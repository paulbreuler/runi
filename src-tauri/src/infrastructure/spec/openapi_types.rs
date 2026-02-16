//! `OpenAPI`-specific internal types.
//!
//! These are implementation details of the `OpenAPI` adapter.
//! The domain-layer `ParsedSpec` in `domain::collection::spec_port` is the
//! canonical IR — these types exist only to bridge the `openapiv3` crate
//! output into the domain IR.

use serde::{Deserialize, Serialize};

/// Parsed `OpenAPI` spec in our internal format.
///
/// This is the `OpenAPI`-specific representation. The `OpenApiParser` adapter
/// maps this into the domain `ParsedSpec` IR.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OpenApiParsedSpec {
    pub title: String,
    pub version: String,
    pub description: Option<String>,
    pub servers: Vec<OpenApiServer>,
    pub operations: Vec<OpenApiParsedOperation>,
}

/// A server entry from an `OpenAPI` spec.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OpenApiServer {
    pub url: String,
    pub description: Option<String>,
}

/// A parsed operation from an `OpenAPI` spec.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OpenApiParsedOperation {
    pub operation_id: String,
    pub path: String,
    pub method: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub parameters: Vec<OpenApiParsedParameter>,
    pub deprecated: bool,
    pub is_streaming: bool,
}

/// A parsed parameter from an `OpenAPI` spec.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OpenApiParsedParameter {
    pub name: String,
    pub location: OpenApiParameterLocation,
    pub required: bool,
    pub schema_type: Option<String>,
    pub default_value: Option<String>,
    pub description: Option<String>,
}

/// Parameter location in an `OpenAPI` spec.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OpenApiParameterLocation {
    Path,
    Query,
    Header,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parameter_location_serializes_snake_case() {
        let yaml = serde_yaml_ng::to_string(&OpenApiParameterLocation::Query).unwrap();
        assert!(yaml.contains("query"));
    }
}
