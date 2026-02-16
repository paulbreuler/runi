#![allow(dead_code)]

use rand::RngExt;
use serde::{Deserialize, Serialize};
use serde_yaml_ng::Value;
use std::collections::BTreeMap;

use super::binding::SpecBinding;
use super::intelligence::IntelligenceMetadata;
use super::source::CollectionSource;

/// Schema URL for JSON Schema validation + IDE autocomplete.
/// Users can add: `# yaml-language-server: $schema=https://runi.dev/schema/collection/v1.json`
pub const SCHEMA_URL: &str = "https://runi.dev/schema/collection/v1.json";

/// Current schema version. Simple integer, not semver.
/// Breaking changes = bump version. Non-breaking = same version.
pub const SCHEMA_VERSION: u32 = 1;

/// Root collection type with full provenance tracking.
///
/// # Deterministic Serialization
/// - Fields serialize in declaration order (serde default)
/// - All maps use `BTreeMap` (alphabetical key ordering)
/// - Timestamps use RFC 3339 UTC with Z suffix
///
/// # Forward Compatibility
/// - Unknown fields with `x-` prefix are preserved
/// - Readers should ignore unknown fields, not fail
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Collection {
    /// JSON Schema URL for IDE validation. Always first field.
    #[serde(rename = "$schema")]
    pub schema: String,

    /// Schema version. Simple integer (1, 2, 3...), not semver.
    pub version: u32,

    /// Unique collection identifier.
    pub id: String,

    /// Collection metadata (name, description, timestamps).
    pub metadata: CollectionMetadata,

    /// Provenance tracking (where did this come from?).
    pub source: CollectionSource,

    /// Collection-level auth (inherited by requests).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<AuthConfig>,

    /// Default values for variables.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub variables: BTreeMap<String, String>,

    /// Extension fields (x-team, x-owner, etc).
    #[serde(flatten, default, skip_serializing_if = "BTreeMap::is_empty")]
    pub extensions: BTreeMap<String, Value>,

    /// Request definitions.
    pub requests: Vec<CollectionRequest>,
}

impl Collection {
    /// Generate a collection ID from name.
    pub fn generate_id(name: &str) -> String {
        let slug = name
            .to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '_' })
            .collect::<String>();
        let random = random_hex_suffix();
        format!("col_{slug}_{random}")
    }

    /// Get requests sorted by seq with id tiebreaker for deterministic ordering.
    pub fn sorted_requests(&self) -> Vec<&CollectionRequest> {
        let mut sorted: Vec<_> = self.requests.iter().collect();
        sorted.sort_by(|a, b| match a.seq.cmp(&b.seq) {
            std::cmp::Ordering::Equal => a.id.cmp(&b.id),
            other => other,
        });
        sorted
    }

    /// Get the next seq value for a new request.
    pub fn next_seq(&self) -> u32 {
        self.requests.iter().map(|r| r.seq).max().unwrap_or(0) + 1
    }

    /// Create a new collection with defaults.
    pub fn new(name: &str) -> Self {
        let now = chrono::Utc::now();
        let timestamp = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

        Self {
            schema: SCHEMA_URL.to_string(),
            version: SCHEMA_VERSION,
            id: Self::generate_id(name),
            metadata: CollectionMetadata {
                name: name.to_string(),
                description: None,
                tags: vec![],
                created_at: timestamp.clone(),
                modified_at: timestamp,
            },
            source: CollectionSource::default(),
            auth: None,
            variables: BTreeMap::new(),
            extensions: BTreeMap::new(),
            requests: vec![],
        }
    }
}

/// Collection metadata (name, description, timestamps).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CollectionMetadata {
    /// Human-readable collection name.
    pub name: String,

    /// Optional description shown in UI.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Tags for filtering/organizing.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,

    /// RFC 3339 UTC timestamp: "2026-01-31T10:30:00Z".
    pub created_at: String,

    /// RFC 3339 UTC timestamp: "2026-01-31T10:30:00Z".
    pub modified_at: String,
}

/// A single request in the collection.
///
/// # Ordering
/// The `seq` field controls display order. This prevents Git conflicts
/// from array reordering — each request has an explicit position.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[allow(clippy::derive_partial_eq_without_eq)]
pub struct CollectionRequest {
    /// Unique request identifier.
    pub id: String,

    /// Human-readable name.
    pub name: String,

    /// Explicit ordering (1, 2, 3...). Prevents array reorder conflicts.
    #[serde(default)]
    pub seq: u32,

    /// HTTP method (GET, POST, etc).
    pub method: String,

    /// URL with variable interpolation: "{{baseUrl}}/users/{{id}}".
    pub url: String,

    /// Headers as map (NOT array — prevents merge conflicts).
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub headers: BTreeMap<String, String>,

    /// Query parameters.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub params: Vec<RequestParam>,

    /// Request body.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<RequestBody>,

    /// Request-specific auth (overrides collection auth).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<AuthConfig>,

    /// Markdown documentation for this request.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs: Option<String>,

    /// Is this a streaming endpoint (SSE/WebSocket)?
    #[serde(default)]
    pub is_streaming: bool,

    /// Link to `OpenAPI` operation (for drift detection).
    #[serde(default)]
    pub binding: SpecBinding,

    /// AI attribution and verification status.
    #[serde(default)]
    pub intelligence: IntelligenceMetadata,

    /// Tags for filtering/organizing.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,

    /// Extension fields (x-timeout, x-retries, etc).
    #[serde(flatten, default, skip_serializing_if = "BTreeMap::is_empty")]
    pub extensions: BTreeMap<String, Value>,
}

impl CollectionRequest {
    /// Generate a request ID from name.
    pub fn generate_id(name: &str) -> String {
        let slug = name
            .to_lowercase()
            .chars()
            .take(10)
            .map(|c| if c.is_alphanumeric() { c } else { '_' })
            .collect::<String>();
        let random = random_hex_suffix();
        format!("req_{slug}_{random}")
    }
}

/// Query parameter with explicit enabled flag.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RequestParam {
    /// Parameter key (name).
    pub key: String,

    /// Parameter value.
    pub value: String,

    /// Whether this parameter is active.
    #[serde(default = "default_true")]
    pub enabled: bool,
}

const fn default_true() -> bool {
    true
}

/// Request body definition.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RequestBody {
    /// Body type (json, form, raw, etc).
    #[serde(rename = "type")]
    pub body_type: BodyType,

    /// Inline body content.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,

    /// External file reference for large bodies.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
}

/// Supported request body types.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BodyType {
    /// No body.
    #[default]
    None,
    /// JSON body.
    Json,
    /// Form-encoded body.
    Form,
    /// Raw body.
    Raw,
    /// GraphQL body.
    Graphql,
    /// XML body.
    Xml,
}

/// Authentication configuration for requests and collections.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AuthConfig {
    /// Auth type (bearer, basic, `api_key`, etc).
    #[serde(rename = "type")]
    pub auth_type: AuthType,

    /// Token for Bearer auth. Use variable: "{{accessToken}}".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,

    /// Username for Basic auth.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,

    /// Password for Basic auth.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,

    /// Header name for API key auth.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<String>,
}

/// Supported auth types.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuthType {
    /// No authentication.
    #[default]
    None,
    /// Bearer token authentication.
    Bearer,
    /// Basic auth (username/password).
    Basic,
    /// API key authentication.
    ApiKey,
}

fn random_hex_suffix() -> String {
    let mut rng = rand::rng();
    let mut random = String::with_capacity(6);
    for _ in 0..6 {
        let nibble: u8 = rng.random_range(0..16);
        random.push(std::char::from_digit(u32::from(nibble), 16).unwrap_or('0'));
    }
    random
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collection_has_required_fields() {
        let collection = Collection::new("Test API");
        assert_eq!(collection.schema, SCHEMA_URL);
        assert_eq!(collection.version, 1);
        assert!(collection.id.starts_with("col_test_api_"));
    }

    #[test]
    fn test_collection_uses_integer_version() {
        let collection = Collection::new("Test");
        let yaml = serde_yaml_ng::to_string(&collection).unwrap();
        assert!(yaml.contains("version: 1"));
        // NOT "version: '1.0.0'" or "version: 1.0.0"
        assert!(!yaml.contains("version: '"));
        assert!(!yaml.contains("version: 1.0"));
    }

    #[test]
    fn test_headers_use_btreemap_for_determinism() {
        let mut req = CollectionRequest {
            id: "req_test".to_string(),
            name: "Test".to_string(),
            seq: 1,
            method: "GET".to_string(),
            url: "https://example.com".to_string(),
            headers: BTreeMap::new(),
            params: vec![],
            body: None,
            auth: None,
            docs: None,
            is_streaming: false,
            binding: SpecBinding::default(),
            intelligence: IntelligenceMetadata::default(),
            tags: vec![],
            extensions: BTreeMap::new(),
        };

        // Insert in random order
        req.headers.insert("Z-Header".to_string(), "z".to_string());
        req.headers.insert("A-Header".to_string(), "a".to_string());
        req.headers.insert("M-Header".to_string(), "m".to_string());

        let yaml = serde_yaml_ng::to_string(&req).unwrap();

        // BTreeMap ensures alphabetical order
        let a_pos = yaml.find("A-Header").unwrap();
        let m_pos = yaml.find("M-Header").unwrap();
        let z_pos = yaml.find("Z-Header").unwrap();
        assert!(a_pos < m_pos);
        assert!(m_pos < z_pos);
    }

    #[test]
    fn test_deterministic_serialization() {
        let collection = Collection::new("Determinism Test");
        let yaml1 = serde_yaml_ng::to_string(&collection).unwrap();
        let yaml2 = serde_yaml_ng::to_string(&collection).unwrap();
        assert_eq!(yaml1, yaml2);
    }

    #[test]
    fn test_seq_field_for_ordering() {
        let req = CollectionRequest {
            id: "req_test".to_string(),
            name: "Test".to_string(),
            seq: 42,
            method: "GET".to_string(),
            url: "https://example.com".to_string(),
            headers: BTreeMap::new(),
            params: vec![],
            body: None,
            auth: None,
            docs: None,
            is_streaming: false,
            binding: SpecBinding::default(),
            intelligence: IntelligenceMetadata::default(),
            tags: vec![],
            extensions: BTreeMap::new(),
        };
        let yaml = serde_yaml_ng::to_string(&req).unwrap();
        assert!(yaml.contains("seq: 42"));
    }

    #[test]
    fn test_timestamp_format_rfc3339_utc() {
        let collection = Collection::new("Test");
        // Should end with Z (UTC), not +00:00
        assert!(collection.metadata.created_at.ends_with('Z'));
        // Should match format: 2026-01-31T10:30:00Z
        assert_eq!(collection.metadata.created_at.len(), 20);
    }

    #[test]
    fn test_extension_fields_with_x_prefix() {
        let mut collection = Collection::new("Test");
        collection
            .extensions
            .insert("x-team".to_string(), Value::String("platform".to_string()));

        let yaml = serde_yaml_ng::to_string(&collection).unwrap();
        assert!(yaml.contains("x-team: platform"));
    }

    #[test]
    fn test_body_type_serializes_snake_case() {
        let body = RequestBody {
            body_type: BodyType::Graphql,
            content: Some("query { }".to_string()),
            file: None,
        };
        let yaml = serde_yaml_ng::to_string(&body).unwrap();
        assert!(yaml.contains("type: graphql"));
    }

    #[test]
    fn test_sorted_requests_with_tiebreaker() {
        let mut collection = Collection::new("Test");

        // Add requests with duplicate seq values (simulates Git merge)
        collection.requests = vec![
            CollectionRequest {
                id: "req_zebra".to_string(),
                name: "Zebra".to_string(),
                seq: 2, // Duplicate seq
                ..Default::default()
            },
            CollectionRequest {
                id: "req_alpha".to_string(),
                name: "Alpha".to_string(),
                seq: 2, // Duplicate seq - same as above
                ..Default::default()
            },
            CollectionRequest {
                id: "req_first".to_string(),
                name: "First".to_string(),
                seq: 1,
                ..Default::default()
            },
        ];

        let sorted = collection.sorted_requests();

        // seq=1 first, then seq=2 sorted by id (alpha before zebra)
        assert_eq!(sorted[0].id, "req_first");
        assert_eq!(sorted[1].id, "req_alpha"); // Tiebreaker: a < z
        assert_eq!(sorted[2].id, "req_zebra");
    }

    #[test]
    fn test_next_seq() {
        let mut collection = Collection::new("Test");
        assert_eq!(collection.next_seq(), 1); // Empty = 1

        collection.requests.push(CollectionRequest {
            seq: 5,
            ..Default::default()
        });
        assert_eq!(collection.next_seq(), 6); // max + 1
    }

    #[test]
    fn test_generate_collection_id() {
        let id = Collection::generate_id("httpbin.org");
        assert!(id.starts_with("col_httpbin_org_"));
        assert_eq!(id.len(), "col_httpbin_org_".len() + 6);
    }

    #[test]
    fn test_generate_request_id() {
        let id = CollectionRequest::generate_id("Get Request");
        assert!(id.starts_with("req_get_reques_"));
        assert_eq!(id.len(), "req_get_reques_".len() + 6);
    }
}
