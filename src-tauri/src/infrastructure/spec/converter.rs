#![allow(dead_code)]

use super::hasher::compute_spec_hash;
use super::openapi_types::{ParameterLocation, ParsedParameter, ParsedSpec};
use crate::domain::collection::{
    Collection, CollectionMetadata, CollectionRequest, CollectionSource, IntelligenceMetadata,
    RequestParam, SCHEMA_URL, SCHEMA_VERSION, SourceType, SpecBinding,
};
use std::collections::BTreeMap;

/// Convert parsed `OpenAPI` spec to Collection format.
///
/// # Key Decisions
/// - First server URL becomes base URL
/// - All path params preserved as `{name}` placeholders
/// - Query params added to params array
/// - `SpecBinding` preserves `operation_id` for drift detection
/// - Uses integer version (1), not semver
/// - Uses `BTreeMap` for headers (deterministic)
/// - Adds `seq` field for ordering
pub fn convert_to_collection(
    parsed: &ParsedSpec,
    raw_content: &str,
    source_url: &str,
) -> Collection {
    let now = chrono::Utc::now();
    let timestamp = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let hash = compute_spec_hash(raw_content);

    // Get base URL from first server
    let base_url = parsed
        .servers
        .first()
        .map_or_else(|| "https://example.com".to_string(), |s| s.url.clone());

    // Convert operations to requests with seq ordering
    let requests: Vec<CollectionRequest> = parsed
        .operations
        .iter()
        .enumerate()
        .map(|(idx, op)| {
            let path = &op.path;
            let url = join_url(&base_url, path);
            let params = extract_query_params(&op.parameters);

            CollectionRequest {
                id: CollectionRequest::generate_id(&op.operation_id),
                name: op
                    .summary
                    .clone()
                    .unwrap_or_else(|| format!("{method} {path}", method = op.method)),
                seq: u32::try_from(idx + 1).unwrap_or(u32::MAX), // 1-indexed ordering
                method: op.method.clone(),
                url,
                headers: BTreeMap::new(), // NOT HashMap
                params,
                body: None,
                auth: None,
                docs: op.description.clone(),
                is_streaming: op.is_streaming,
                binding: SpecBinding::from_operation(&op.operation_id, &op.path, &op.method),
                intelligence: IntelligenceMetadata::default(),
                tags: op.tags.clone(),
                extensions: BTreeMap::new(),
            }
        })
        .collect();

    Collection {
        schema: SCHEMA_URL.to_string(),
        version: SCHEMA_VERSION, // Integer 1, not "1.0.0"
        id: Collection::generate_id(&parsed.title),
        metadata: CollectionMetadata {
            name: parsed.title.clone(),
            description: parsed.description.clone(),
            tags: vec![],
            created_at: timestamp.clone(),
            modified_at: timestamp.clone(),
        },
        source: CollectionSource {
            source_type: SourceType::Openapi,
            url: Some(source_url.to_string()),
            hash: Some(format!("sha256:{hash}")),
            spec_version: Some(parsed.version.clone()),
            fetched_at: timestamp,
            source_commit: None,
            repo_root: None,
            spec_path: None,
            ref_name: None,
        },
        auth: None,
        variables: BTreeMap::new(),
        extensions: BTreeMap::new(),
        requests,
    }
}

fn join_url(base_url: &str, path: &str) -> String {
    if path.is_empty() {
        return base_url.to_string();
    }

    let normalized_base = base_url.trim_end_matches('/');
    let normalized_path = path.trim_start_matches('/');
    format!("{normalized_base}/{normalized_path}")
}

fn extract_query_params(parameters: &[ParsedParameter]) -> Vec<RequestParam> {
    parameters
        .iter()
        .filter(|p| p.location == ParameterLocation::Query)
        .map(|p| RequestParam {
            key: p.name.clone(),
            value: p.default_value.clone().unwrap_or_default(),
            enabled: true,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::collection::SourceType;

    fn minimal_parsed_spec() -> ParsedSpec {
        ParsedSpec {
            title: "Test API".to_string(),
            version: "1.0.0".to_string(),
            description: Some("Test description".to_string()),
            servers: vec![super::super::openapi_types::Server {
                url: "https://api.test.com".to_string(),
                description: None,
            }],
            operations: vec![super::super::openapi_types::ParsedOperation {
                operation_id: "getUsers".to_string(),
                path: "/users".to_string(),
                method: "GET".to_string(),
                summary: Some("List users".to_string()),
                description: None,
                tags: vec!["users".to_string()],
                parameters: vec![],
                deprecated: false,
                is_streaming: false,
            }],
        }
    }

    #[test]
    fn test_convert_uses_integer_version() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert_eq!(collection.version, 1); // Integer, not string
    }

    #[test]
    fn test_convert_sets_source_type_openapi() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert_eq!(collection.source.source_type, SourceType::Openapi);
    }

    #[test]
    fn test_convert_preserves_operation_id_in_binding() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert_eq!(
            collection.requests[0].binding.operation_id,
            Some("getUsers".to_string())
        );
    }

    #[test]
    fn test_convert_computes_hash() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert!(collection.source.hash.is_some());
        assert!(collection.source.hash.unwrap().starts_with("sha256:"));
    }

    #[test]
    fn test_convert_adds_seq_for_ordering() {
        let mut parsed = minimal_parsed_spec();
        parsed
            .operations
            .push(super::super::openapi_types::ParsedOperation {
                operation_id: "createUser".to_string(),
                path: "/users".to_string(),
                method: "POST".to_string(),
                summary: Some("Create user".to_string()),
                description: None,
                tags: vec![],
                parameters: vec![],
                deprecated: false,
                is_streaming: false,
            });

        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert_eq!(collection.requests[0].seq, 1);
        assert_eq!(collection.requests[1].seq, 2);
    }

    #[test]
    fn test_convert_uses_btreemap_for_headers() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        // This compiles only if headers is BTreeMap, not HashMap
        let _: &BTreeMap<String, String> = &collection.requests[0].headers;
    }

    #[test]
    fn test_convert_normalizes_double_slash_urls() {
        let mut parsed = minimal_parsed_spec();
        parsed.servers[0].url = "https://api.test.com/".to_string();
        parsed.operations[0].path = "/users".to_string();

        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert_eq!(collection.requests[0].url, "https://api.test.com/users");
    }

    #[test]
    fn test_convert_timestamps_use_z_suffix() {
        let parsed = minimal_parsed_spec();
        let collection = convert_to_collection(&parsed, "{}", "https://test.com/spec.json");
        assert!(collection.metadata.created_at.ends_with('Z'));
        assert!(collection.source.fetched_at.ends_with('Z'));
    }
}
