//! `OpenAPI` adapter for the `SpecParser` port.
//!
//! Wraps the existing `parser.rs` logic to implement the domain-layer
//! `SpecParser` trait. Maps OpenAPI-specific internal types into the
//! format-agnostic `ParsedSpec` IR.

use crate::domain::collection::SourceType;
use crate::domain::collection::spec_port::{
    ParameterLocation, ParsedEndpoint, ParsedParameter, ParsedServer, ParsedSpec, SpecParseError,
    SpecParser,
};

use super::openapi_types::OpenApiParameterLocation;
use super::parser::parse_openapi_spec;

/// `SpecParser` adapter for `OpenAPI` 3.x and Swagger 2.0 specs.
///
/// Uses content sniffing (`can_parse`) to detect `"openapi"` or `"swagger"`
/// top-level JSON keys, then delegates to the existing `parser.rs` for
/// the heavy lifting.
pub struct OpenApiParser;

impl SpecParser for OpenApiParser {
    fn source_type(&self) -> SourceType {
        SourceType::Openapi
    }

    fn format_name(&self) -> &'static str {
        "OpenAPI"
    }

    fn can_parse(&self, content: &str) -> bool {
        // Try JSON first
        if let Ok(doc) = serde_json::from_str::<serde_json::Value>(content) {
            return doc.get("openapi").is_some() || doc.get("swagger").is_some();
        }

        // Fall back to YAML
        let Ok(doc) = serde_yaml_ng::from_str::<serde_yaml_ng::Value>(content) else {
            return false;
        };

        match doc {
            serde_yaml_ng::Value::Mapping(map) => {
                map.contains_key(serde_yaml_ng::Value::String("openapi".to_string()))
                    || map.contains_key(serde_yaml_ng::Value::String("swagger".to_string()))
            }
            _ => false,
        }
    }

    fn parse(&self, content: &str) -> Result<ParsedSpec, SpecParseError> {
        let openapi_spec = parse_openapi_spec(content).map_err(|e| {
            if e.contains("Invalid JSON")
                || e.contains("Invalid format")
                || e.contains("Missing OpenAPI or Swagger")
            {
                SpecParseError::InvalidFormat(e)
            } else {
                SpecParseError::MalformedSpec {
                    format: "OpenAPI".to_string(),
                    detail: e,
                }
            }
        })?;

        // Map OpenAPI-specific types → domain IR
        Ok(ParsedSpec {
            title: openapi_spec.title,
            version: Some(openapi_spec.version),
            description: openapi_spec.description,
            base_urls: openapi_spec
                .servers
                .into_iter()
                .map(|s| ParsedServer {
                    url: s.url,
                    description: s.description,
                })
                .collect(),
            endpoints: openapi_spec
                .operations
                .into_iter()
                .map(|op| ParsedEndpoint {
                    operation_id: Some(op.operation_id),
                    method: op.method,
                    path: op.path,
                    summary: op.summary,
                    description: op.description,
                    tags: op.tags,
                    parameters: op
                        .parameters
                        .into_iter()
                        .map(|p| ParsedParameter {
                            name: p.name,
                            location: map_parameter_location(&p.location),
                            required: p.required,
                            schema_type: p.schema_type,
                            default_value: p.default_value,
                            description: p.description,
                        })
                        .collect(),
                    request_body: op.request_body.as_ref().map(|rb| {
                        crate::domain::collection::spec_port::ParsedRequestBody {
                            content_type: rb.content_type.clone(),
                            schema_hint: None,
                            example: rb.example.clone(),
                            required: rb.required,
                        }
                    }),
                    deprecated: op.deprecated,
                    is_streaming: op.is_streaming,
                })
                .collect(),
            auth_schemes: vec![], // Not extracted yet — future enhancement
            variables: std::collections::BTreeMap::new(),
        })
    }
}

/// Map `OpenAPI`-specific parameter location to domain IR location.
const fn map_parameter_location(loc: &OpenApiParameterLocation) -> ParameterLocation {
    match loc {
        OpenApiParameterLocation::Path => ParameterLocation::Path,
        OpenApiParameterLocation::Query => ParameterLocation::Query,
        OpenApiParameterLocation::Header => ParameterLocation::Header,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINIMAL_OPENAPI: &str = r#"{
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

    const SWAGGER_2: &str = r#"{
        "swagger": "2.0",
        "info": { "title": "Swagger API", "version": "2.0.0" },
        "host": "api.example.com",
        "basePath": "/v1",
        "paths": {}
    }"#;

    #[test]
    fn test_can_parse_openapi_3() {
        let parser = OpenApiParser;
        assert!(parser.can_parse(MINIMAL_OPENAPI));
    }

    #[test]
    fn test_can_parse_swagger_2() {
        let parser = OpenApiParser;
        assert!(parser.can_parse(SWAGGER_2));
    }

    #[test]
    fn test_cannot_parse_postman() {
        let parser = OpenApiParser;
        let postman = r#"{"info": {"_postman_id": "abc123"}}"#;
        assert!(!parser.can_parse(postman));
    }

    #[test]
    fn test_cannot_parse_random_text() {
        let parser = OpenApiParser;
        assert!(!parser.can_parse("hello world"));
        assert!(!parser.can_parse(""));
        assert!(!parser.can_parse("[]"));
    }

    #[test]
    fn test_can_parse_yaml_openapi() {
        let parser = OpenApiParser;
        let yaml_content = r"
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: OK
";
        assert!(parser.can_parse(yaml_content));
    }

    #[test]
    fn test_parse_openapi_to_ir() {
        let parser = OpenApiParser;
        let result = parser.parse(MINIMAL_OPENAPI);
        assert!(result.is_ok());

        let spec = result.unwrap();
        assert_eq!(spec.title, "Test API");
        assert_eq!(spec.version, Some("1.0.0".to_string()));
        assert_eq!(spec.endpoints.len(), 1);
        assert_eq!(spec.endpoints[0].operation_id, Some("getUsers".to_string()));
        assert_eq!(spec.endpoints[0].method, "GET");
        assert_eq!(spec.endpoints[0].path, "/users");
    }

    #[test]
    fn test_parse_invalid_input_returns_invalid_format() {
        let parser = OpenApiParser;
        // "not json" is valid YAML (scalar string) but fails OpenAPI structure validation
        let result = parser.parse("not json");
        assert!(result.is_err());
        match result.unwrap_err() {
            SpecParseError::InvalidFormat(msg) => {
                assert!(
                    msg.contains("Missing OpenAPI or Swagger")
                        || msg.contains("Invalid format")
                        || msg.contains("Invalid JSON"),
                    "Unexpected error message: {msg}"
                );
            }
            other => panic!("Expected InvalidFormat, got {other:?}"),
        }
    }

    #[test]
    fn test_parse_yaml_openapi_returns_ok() {
        let parser = OpenApiParser;
        let yaml_spec = "openapi: \"3.0.0\"\ninfo:\n  title: YAML API\n  version: \"1.0.0\"\npaths:\n  /test:\n    get:\n      operationId: getTest\n      summary: Test endpoint\n      responses:\n        '200':\n          description: OK\n";
        let result = parser.parse(yaml_spec);
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result.err());
        let spec = result.unwrap();
        assert_eq!(spec.title, "YAML API");
        assert_eq!(spec.endpoints.len(), 1);
    }

    #[test]
    fn test_source_type_is_openapi() {
        let parser = OpenApiParser;
        assert_eq!(parser.source_type(), SourceType::Openapi);
    }

    #[test]
    fn test_format_name() {
        let parser = OpenApiParser;
        assert_eq!(parser.format_name(), "OpenAPI");
    }

    #[test]
    fn test_parse_extracts_request_body_example() {
        let spec_with_body = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Test API", "version": "1.0.0" },
            "paths": {
                "/users": {
                    "post": {
                        "operationId": "createUser",
                        "summary": "Create user",
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": { "type": "object" },
                                    "example": {
                                        "name": "Jane Doe",
                                        "email": "jane@example.com"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Created",
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

        let parser = OpenApiParser;
        let result = parser.parse(spec_with_body).unwrap();

        assert_eq!(result.endpoints.len(), 1);
        let body = result.endpoints[0].request_body.as_ref().unwrap();
        assert_eq!(body.content_type, Some("application/json".to_string()));
        assert!(body.required);

        // Example should be serialized as JSON string
        let example = body.example.as_ref().unwrap();
        let parsed: serde_json::Value = serde_json::from_str(example).unwrap();
        assert_eq!(parsed["name"], "Jane Doe");
        assert_eq!(parsed["email"], "jane@example.com");
    }

    #[test]
    fn test_parse_extracts_schema_example_fallback() {
        let spec_with_schema_example = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Test API", "version": "1.0.0" },
            "paths": {
                "/items": {
                    "post": {
                        "operationId": "createItem",
                        "summary": "Create item",
                        "requestBody": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "example": { "title": "Widget", "price": 9.99 }
                                    }
                                }
                            }
                        },
                        "responses": {
                            "201": {
                                "description": "Created",
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

        let parser = OpenApiParser;
        let result = parser.parse(spec_with_schema_example).unwrap();

        let body = result.endpoints[0].request_body.as_ref().unwrap();
        let example = body.example.as_ref().unwrap();
        let parsed: serde_json::Value = serde_json::from_str(example).unwrap();
        assert_eq!(parsed["title"], "Widget");
    }

    #[test]
    fn test_parse_no_request_body_returns_none() {
        let parser = OpenApiParser;
        let result = parser.parse(MINIMAL_OPENAPI).unwrap();

        // GET /users has no requestBody
        assert!(result.endpoints[0].request_body.is_none());
    }
}
