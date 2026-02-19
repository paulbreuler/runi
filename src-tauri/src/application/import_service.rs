//! Application service for spec import orchestration.
//!
//! Coordinates the pluggable import pipeline:
//! 1. Fetch content via `ContentFetcher` port
//! 2. Detect format via `SpecParser::can_parse()` chain
//! 3. Parse into domain IR (`ParsedSpec`)
//! 4. Convert IR → `Collection` (shared logic, not per-adapter)
//!
//! This implements the Mediator pattern — parsers and fetcher don't know
//! about each other, only the service coordinates them.

use std::collections::BTreeMap;

use crate::domain::collection::git_port::GitMetadataPort;
use crate::domain::collection::spec_port::{
    ContentFetcher, FetchResult, ParsedSpec, SpecParseError, SpecParser, SpecSource,
};
use crate::domain::collection::{
    BodyType, Collection, CollectionMetadata, CollectionRequest, CollectionSource,
    IntelligenceMetadata, RequestBody, RequestParam, SCHEMA_URL, SCHEMA_VERSION, SourceType,
    SpecBinding,
};
use crate::infrastructure::spec::hasher::compute_spec_hash;

/// Orchestrates spec import using injected ports.
///
/// The key architectural insight: IR→Collection conversion lives here,
/// not in each adapter. Adding a new format only requires writing a
/// `SpecParser` implementation, not a converter.
pub struct ImportService {
    parsers: Vec<Box<dyn SpecParser>>,
    fetcher: Box<dyn ContentFetcher>,
    git_metadata: Option<Box<dyn GitMetadataPort>>,
}

/// Overrides for import behavior (display name, git tracking, etc.).
#[derive(Debug, Clone, Default)]
pub struct ImportOverrides {
    /// Override the collection display name.
    pub display_name: Option<String>,
    /// Git repo root for tracking.
    pub repo_root: Option<String>,
    /// Relative path to spec within repo.
    pub spec_path: Option<String>,
    /// Git ref (branch/tag/commit) being tracked.
    pub ref_name: Option<String>,
}

impl ImportService {
    /// Create a new import service with the given parsers and fetcher.
    pub fn new(parsers: Vec<Box<dyn SpecParser>>, fetcher: Box<dyn ContentFetcher>) -> Self {
        Self {
            parsers,
            fetcher,
            git_metadata: None,
        }
    }

    /// Create an import service with git metadata resolution.
    pub fn with_git_metadata(
        parsers: Vec<Box<dyn SpecParser>>,
        fetcher: Box<dyn ContentFetcher>,
        git_metadata: Box<dyn GitMetadataPort>,
    ) -> Self {
        Self {
            parsers,
            fetcher,
            git_metadata: Some(git_metadata),
        }
    }

    /// Import from any supported format.
    ///
    /// Auto-detects format via parser chain (Chain of Responsibility).
    /// Returns a fully-formed `Collection` ready to save.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Content cannot be fetched
    /// - No parser can handle the content
    /// - The matching parser fails to parse
    pub async fn import(
        &self,
        source: SpecSource,
        overrides: ImportOverrides,
    ) -> Result<Collection, String> {
        // 1. Fetch content
        let fetch_result = self.fetcher.fetch(&source).await?;

        // 2. Detect format — try each parser's can_parse()
        let parser = self
            .detect_parser(&fetch_result.content)
            .map_err(|e| e.to_string())?;

        // 3. Parse into IR
        let parsed = parser
            .parse(&fetch_result.content)
            .map_err(|e| e.to_string())?;

        // 4. Convert IR → Collection (shared logic, not per-adapter)
        let mut collection =
            Self::ir_to_collection(&parsed, &fetch_result, parser.source_type(), &overrides);

        // 5. Resolve git commit if repo_root is provided and git port is available
        if let (Some(repo_root), Some(git)) = (&overrides.repo_root, &self.git_metadata) {
            match git.resolve_commit(repo_root, overrides.ref_name.as_deref()) {
                Ok(sha) => collection.source.source_commit = Some(sha),
                Err(e) => {
                    tracing::warn!("Failed to resolve git commit for {repo_root}: {e}");
                }
            }
        }

        Ok(collection)
    }

    /// Detect which parser can handle the given content.
    ///
    /// Tries each parser's `can_parse()` in registration order.
    /// Returns `InvalidFormat` if no parser matches.
    fn detect_parser(&self, content: &str) -> Result<&dyn SpecParser, SpecParseError> {
        for parser in &self.parsers {
            if parser.can_parse(content) {
                return Ok(parser.as_ref());
            }
        }

        Err(SpecParseError::InvalidFormat(
            "No registered parser can handle this content".to_string(),
        ))
    }

    /// Parse raw content into the canonical IR using the parser chain.
    ///
    /// Useful for re-parsing fetched content during refresh/drift detection
    /// without creating a full collection.
    ///
    /// # Errors
    ///
    /// Returns an error if no parser matches or parsing fails.
    pub fn parse_content(&self, content: &str) -> Result<ParsedSpec, String> {
        let parser = self.detect_parser(content).map_err(|e| e.to_string())?;
        parser.parse(content).map_err(|e| e.to_string())
    }

    /// Access the content fetcher for re-fetching during refresh.
    pub fn fetcher(&self) -> &dyn ContentFetcher {
        self.fetcher.as_ref()
    }

    /// Resolve a git commit SHA if the git metadata port is available.
    ///
    /// Returns `None` if no git port is configured or resolution fails.
    pub fn resolve_git_commit(&self, repo_root: &str, ref_name: Option<&str>) -> Option<String> {
        self.git_metadata
            .as_ref()
            .and_then(|git| git.resolve_commit(repo_root, ref_name).ok())
    }

    /// The single shared IR → Collection converter.
    ///
    /// This is the compiler IR insight: one converter for all formats.
    /// Each parser transpiles its native format into `ParsedSpec` IR,
    /// and this method transpiles IR into `Collection`.
    fn ir_to_collection(
        parsed: &ParsedSpec,
        fetch: &FetchResult,
        source_type: SourceType,
        overrides: &ImportOverrides,
    ) -> Collection {
        let now = chrono::Utc::now();
        let timestamp = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();
        let hash = compute_spec_hash(&fetch.content);

        let title = overrides.display_name.as_deref().unwrap_or(&parsed.title);

        // Get base URL from first server
        let base_url = parsed
            .base_urls
            .first()
            .map_or_else(|| "https://example.com".to_string(), |s| s.url.clone());

        // Convert endpoints to requests with seq ordering
        let requests: Vec<CollectionRequest> = parsed
            .endpoints
            .iter()
            .enumerate()
            .map(|(idx, ep)| {
                let url = join_url(&base_url, &ep.path);
                let params = extract_query_params(ep);
                let operation_id = ep
                    .operation_id
                    .clone()
                    .unwrap_or_else(|| generate_operation_id(&ep.method, &ep.path));

                CollectionRequest {
                    id: CollectionRequest::generate_id(&operation_id),
                    name: ep
                        .summary
                        .clone()
                        .unwrap_or_else(|| format!("{} {}", ep.method, ep.path)),
                    seq: u32::try_from(idx + 1).unwrap_or(u32::MAX),
                    method: ep.method.clone(),
                    url,
                    headers: BTreeMap::new(),
                    params,
                    body: ep.request_body.as_ref().and_then(|rb| {
                        rb.example.as_ref().map(|_| {
                            let body_type = rb
                                .content_type
                                .as_deref()
                                .map_or(BodyType::Json, body_type_from_content_type);
                            RequestBody {
                                body_type,
                                content: rb.example.clone(),
                                file: None,
                            }
                        })
                    }),
                    auth: None,
                    docs: ep.description.clone(),
                    is_streaming: ep.is_streaming,
                    binding: SpecBinding::from_operation(&operation_id, &ep.path, &ep.method),
                    intelligence: IntelligenceMetadata::default(),
                    tags: ep.tags.clone(),
                    extensions: BTreeMap::new(),
                }
            })
            .collect();

        Collection {
            schema: SCHEMA_URL.to_string(),
            version: SCHEMA_VERSION,
            id: Collection::generate_id(title),
            metadata: CollectionMetadata {
                name: title.to_string(),
                description: parsed.description.clone(),
                tags: vec![],
                created_at: timestamp.clone(),
                modified_at: timestamp.clone(),
            },
            source: CollectionSource {
                source_type,
                url: Some(fetch.source_url.clone()),
                hash: Some(format!("sha256:{hash}")),
                spec_version: parsed.version.clone(),
                fetched_at: timestamp,
                source_commit: None,
                repo_root: overrides.repo_root.clone(),
                spec_path: overrides.spec_path.clone(),
                ref_name: overrides.ref_name.clone(),
            },
            auth: None,
            variables: BTreeMap::new(),
            extensions: BTreeMap::new(),
            requests,
        }
    }
}

/// Join a base URL and path, normalizing double slashes.
fn join_url(base_url: &str, path: &str) -> String {
    if path.is_empty() {
        return base_url.to_string();
    }

    let normalized_base = base_url.trim_end_matches('/');
    let normalized_path = path.trim_start_matches('/');
    format!("{normalized_base}/{normalized_path}")
}

/// Extract query parameters from a parsed endpoint.
fn extract_query_params(
    endpoint: &crate::domain::collection::spec_port::ParsedEndpoint,
) -> Vec<RequestParam> {
    use crate::domain::collection::spec_port::ParameterLocation;

    endpoint
        .parameters
        .iter()
        .filter(|p| p.location == ParameterLocation::Query)
        .map(|p| RequestParam {
            key: p.name.clone(),
            value: p.default_value.clone().unwrap_or_default(),
            enabled: true,
        })
        .collect()
}

/// Map a MIME content-type string to the appropriate `BodyType`.
///
/// Falls back to `Json` when the content-type is absent or unrecognised,
/// since most `OpenAPI` specs use JSON and omitting the field is common.
fn body_type_from_content_type(content_type: &str) -> BodyType {
    if content_type.contains("json") {
        BodyType::Json
    } else if content_type.contains("x-www-form-urlencoded") || content_type.contains("form-data") {
        BodyType::Form
    } else if content_type.contains("xml") {
        BodyType::Xml
    } else {
        BodyType::Raw
    }
}

/// Generate an operation ID from method and path when none is provided.
fn generate_operation_id(method: &str, path: &str) -> String {
    let cleaned = path
        .replace('/', "_")
        .replace(['{', '}'], "")
        .trim_matches('_')
        .to_string();
    let method = method.to_lowercase();
    format!("{method}_{cleaned}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::collection::spec_port::{
        ContentFetcher, ParsedEndpoint, ParsedServer, SpecSource,
    };
    use async_trait::async_trait;

    /// Mock fetcher for testing — returns inline content.
    struct MockFetcher;

    #[async_trait]
    impl ContentFetcher for MockFetcher {
        async fn fetch(&self, source: &SpecSource) -> Result<FetchResult, String> {
            match source {
                SpecSource::Inline(content) => Ok(FetchResult {
                    content: content.clone(),
                    source_url: "inline".to_string(),
                    is_fallback: false,
                    fetched_at: "2026-01-31T10:30:00Z".to_string(),
                }),
                _ => Err("MockFetcher only handles Inline".to_string()),
            }
        }
    }

    fn openapi_parser() -> Box<dyn SpecParser> {
        Box::new(crate::infrastructure::spec::openapi_parser::OpenApiParser)
    }

    const MINIMAL_SPEC: &str = r#"{
        "openapi": "3.0.0",
        "info": { "title": "Test API", "version": "1.0.0" },
        "paths": {
            "/users": {
                "get": {
                    "operationId": "getUsers",
                    "summary": "List users",
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": { "type": "object" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }"#;

    #[tokio::test]
    async fn test_import_with_inline_openapi() {
        let service = ImportService::new(vec![openapi_parser()], Box::new(MockFetcher));

        let result = service
            .import(
                SpecSource::Inline(MINIMAL_SPEC.to_string()),
                ImportOverrides::default(),
            )
            .await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert_eq!(collection.metadata.name, "Test API");
        assert_eq!(collection.source.source_type, SourceType::Openapi);
        assert_eq!(collection.requests.len(), 1);
        assert_eq!(collection.requests[0].method, "GET");
    }

    #[tokio::test]
    async fn test_import_with_display_name_override() {
        let service = ImportService::new(vec![openapi_parser()], Box::new(MockFetcher));

        let result = service
            .import(
                SpecSource::Inline(MINIMAL_SPEC.to_string()),
                ImportOverrides {
                    display_name: Some("Custom Name".to_string()),
                    ..Default::default()
                },
            )
            .await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert_eq!(collection.metadata.name, "Custom Name");
    }

    #[tokio::test]
    async fn test_import_no_parser_matches() {
        let service = ImportService::new(vec![openapi_parser()], Box::new(MockFetcher));

        let result = service
            .import(
                SpecSource::Inline(r#"{"not": "a spec"}"#.to_string()),
                ImportOverrides::default(),
            )
            .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("No registered parser"));
    }

    #[tokio::test]
    async fn test_import_preserves_git_tracking_overrides() {
        let service = ImportService::new(vec![openapi_parser()], Box::new(MockFetcher));

        let result = service
            .import(
                SpecSource::Inline(MINIMAL_SPEC.to_string()),
                ImportOverrides {
                    repo_root: Some("../project".to_string()),
                    spec_path: Some("api/spec.json".to_string()),
                    ref_name: Some("main".to_string()),
                    ..Default::default()
                },
            )
            .await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert_eq!(collection.source.repo_root, Some("../project".to_string()));
        assert_eq!(
            collection.source.spec_path,
            Some("api/spec.json".to_string())
        );
        assert_eq!(collection.source.ref_name, Some("main".to_string()));
    }

    // ── Test 3A.5: Import populates source_commit when repo_root provided ──

    struct MockGitPort {
        commit: Result<String, String>,
    }

    impl GitMetadataPort for MockGitPort {
        fn resolve_commit(
            &self,
            _repo_root: &str,
            _ref_name: Option<&str>,
        ) -> Result<String, String> {
            self.commit.clone()
        }
    }

    #[tokio::test]
    async fn test_import_populates_source_commit_when_repo_root_provided() {
        let fake_sha = "a".repeat(40);
        let service = ImportService::with_git_metadata(
            vec![openapi_parser()],
            Box::new(MockFetcher),
            Box::new(MockGitPort {
                commit: Ok(fake_sha.clone()),
            }),
        );

        let result = service
            .import(
                SpecSource::Inline(MINIMAL_SPEC.to_string()),
                ImportOverrides {
                    repo_root: Some("/some/repo".to_string()),
                    ..Default::default()
                },
            )
            .await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert_eq!(collection.source.source_commit, Some(fake_sha));
    }

    // ── Test 3A.6: Import without repo_root leaves source_commit as None ──

    #[tokio::test]
    async fn test_import_without_repo_root_leaves_source_commit_none() {
        let service = ImportService::new(vec![openapi_parser()], Box::new(MockFetcher));

        let result = service
            .import(
                SpecSource::Inline(MINIMAL_SPEC.to_string()),
                ImportOverrides::default(),
            )
            .await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert!(
            collection.source.source_commit.is_none(),
            "source_commit should be None without repo_root"
        );
    }

    #[test]
    fn test_ir_to_collection_produces_correct_structure() {
        let parsed = ParsedSpec {
            title: "IR Test".to_string(),
            version: Some("2.0.0".to_string()),
            description: Some("Test description".to_string()),
            base_urls: vec![ParsedServer {
                url: "https://api.test.com".to_string(),
                description: None,
            }],
            endpoints: vec![ParsedEndpoint {
                operation_id: Some("listItems".to_string()),
                method: "GET".to_string(),
                path: "/items".to_string(),
                summary: Some("List items".to_string()),
                description: None,
                tags: vec!["items".to_string()],
                parameters: vec![],
                request_body: None,
                deprecated: false,
                is_streaming: false,
            }],
            auth_schemes: vec![],
            variables: BTreeMap::new(),
        };

        let fetch = FetchResult {
            content: "{}".to_string(),
            source_url: "https://example.com/spec.json".to_string(),
            is_fallback: false,
            fetched_at: "2026-01-31T10:30:00Z".to_string(),
        };

        let collection = ImportService::ir_to_collection(
            &parsed,
            &fetch,
            SourceType::Openapi,
            &ImportOverrides::default(),
        );

        assert_eq!(collection.metadata.name, "IR Test");
        assert_eq!(
            collection.metadata.description,
            Some("Test description".to_string())
        );
        assert_eq!(collection.source.source_type, SourceType::Openapi);
        assert_eq!(collection.source.spec_version, Some("2.0.0".to_string()));
        assert!(collection.source.hash.unwrap().starts_with("sha256:"));
        assert_eq!(collection.requests.len(), 1);
        assert_eq!(collection.requests[0].url, "https://api.test.com/items");
        assert_eq!(collection.requests[0].seq, 1);
        assert_eq!(
            collection.requests[0].binding.operation_id,
            Some("listItems".to_string())
        );
    }
}
