use serde::{Deserialize, Serialize};

/// Result of fetching an `OpenAPI` spec.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FetchResult {
    pub content: String,
    pub source_url: String,
    pub is_fallback: bool,
    pub fetched_at: String,
}

/// Parsed `OpenAPI` spec in our internal format.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ParsedSpec {
    pub title: String,
    pub version: String,
    pub description: Option<String>,
    pub servers: Vec<Server>,
    pub operations: Vec<ParsedOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Server {
    pub url: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ParsedOperation {
    pub operation_id: String,
    pub path: String,
    pub method: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub parameters: Vec<ParsedParameter>,
    pub deprecated: bool,
    pub is_streaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ParsedParameter {
    pub name: String,
    pub location: ParameterLocation,
    pub required: bool,
    pub schema_type: Option<String>,
    pub default_value: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ParameterLocation {
    Path,
    Query,
    Header,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fetch_result_tracks_fallback() {
        let result = FetchResult {
            content: "{}".to_string(),
            source_url: "https://httpbin.org/spec.json".to_string(),
            is_fallback: false,
            fetched_at: "2026-01-31T10:30:00Z".to_string(),
        };
        assert!(!result.is_fallback);
    }

    #[test]
    fn test_parameter_location_serializes_snake_case() {
        let yaml = serde_yml::to_string(&ParameterLocation::Query).unwrap();
        assert!(yaml.contains("query"));
    }
}
