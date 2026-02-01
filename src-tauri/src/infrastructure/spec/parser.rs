#![allow(dead_code)]

use super::openapi_types::{
    ParameterLocation, ParsedOperation, ParsedParameter, ParsedSpec, Server,
};
use super::streaming::is_streaming_operation;
use openapiv3::OpenAPI;
use serde_json::Value;

/// Parse `OpenAPI` JSON into internal types.
///
/// # Supported Versions
/// - `OpenAPI` 3.0.x (primary)
/// - `OpenAPI` 3.1.x (compatible)
/// - Swagger 2.0 (basic support)
///
/// # Key Decisions
/// - Generate operationId if missing (`method_path` format)
/// - Extract all parameter locations
/// - Detect streaming from produces/responses
pub fn parse_openapi_spec(content: &str) -> Result<ParsedSpec, String> {
    let doc: Value = serde_json::from_str(content).map_err(|e| format!("Invalid JSON: {e}"))?;
    validate_openapi_value(&doc)?;

    // Extract info
    let info = doc.get("info").ok_or("Missing 'info' object")?;
    let title = info
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled")
        .to_string();
    let version = info
        .get("version")
        .and_then(|v| v.as_str())
        .unwrap_or("1.0.0")
        .to_string();
    let description = info
        .get("description")
        .and_then(|v| v.as_str())
        .map(String::from);

    // Extract servers
    let servers = parse_servers(&doc);

    // Extract operations
    let operations = parse_operations(&doc)?;

    Ok(ParsedSpec {
        title,
        version,
        description,
        servers,
        operations,
    })
}

/// Validate the spec against the `OpenAPI` schema when applicable.
pub fn validate_openapi_spec(content: &str) -> Result<(), String> {
    let doc: Value = serde_json::from_str(content).map_err(|e| format!("Invalid JSON: {e}"))?;
    validate_openapi_value(&doc)
}

fn validate_openapi_value(doc: &Value) -> Result<(), String> {
    if doc.get("openapi").is_some() {
        serde_json::from_value::<OpenAPI>(doc.clone())
            .map_err(|e| format!("OpenAPI validation failed: {e}"))?;
        return Ok(());
    }

    if doc.get("swagger").and_then(Value::as_str) == Some("2.0") {
        return Ok(());
    }

    Err("Missing OpenAPI or Swagger version field".to_string())
}

fn parse_servers(doc: &Value) -> Vec<Server> {
    let mut servers = Vec::new();

    // OpenAPI 3.x servers array
    if let Some(arr) = doc.get("servers").and_then(|v| v.as_array()) {
        for server in arr {
            if let Some(url) = server.get("url").and_then(|v| v.as_str()) {
                servers.push(Server {
                    url: url.to_string(),
                    description: server
                        .get("description")
                        .and_then(|v| v.as_str())
                        .map(String::from),
                });
            }
        }
    }

    // Swagger 2.0 host + basePath
    if servers.is_empty() {
        if let (Some(host), Some(base)) = (
            doc.get("host").and_then(|v| v.as_str()),
            doc.get("basePath").and_then(|v| v.as_str()),
        ) {
            let scheme = doc
                .get("schemes")
                .and_then(|v| v.as_array())
                .and_then(|arr| arr.first())
                .and_then(|v| v.as_str())
                .unwrap_or("https");
            servers.push(Server {
                url: format!("{scheme}://{host}{base}"),
                description: None,
            });
        }
    }

    servers
}

fn parse_operations(doc: &Value) -> Result<Vec<ParsedOperation>, String> {
    let paths = doc.get("paths").ok_or("Missing 'paths' object")?;
    let paths_obj = paths.as_object().ok_or("'paths' is not an object")?;

    let mut operations = Vec::new();
    let methods = ["get", "post", "put", "patch", "delete", "options", "head"];

    for (path, path_item) in paths_obj {
        let Some(path_item) = path_item.as_object() else {
            continue;
        };

        for method in &methods {
            if let Some(op) = path_item.get(*method) {
                operations.push(parse_operation(path, method, op));
            }
        }
    }

    Ok(operations)
}

fn parse_operation(path: &str, method: &str, op: &Value) -> ParsedOperation {
    // Generate operationId if missing
    let operation_id = op
        .get("operationId")
        .and_then(|v| v.as_str())
        .map_or_else(|| generate_operation_id(method, path), String::from);

    let summary = op.get("summary").and_then(|v| v.as_str()).map(String::from);
    let description = op
        .get("description")
        .and_then(|v| v.as_str())
        .map(String::from);

    let tags = op
        .get("tags")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    let parameters = parse_parameters(op);
    let deprecated = op
        .get("deprecated")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let is_streaming = is_streaming_operation(op);

    ParsedOperation {
        operation_id,
        path: path.to_string(),
        method: method.to_uppercase(),
        summary,
        description,
        tags,
        parameters,
        deprecated,
        is_streaming,
    }
}

fn parse_parameters(op: &Value) -> Vec<ParsedParameter> {
    let Some(params) = op.get("parameters").and_then(|v| v.as_array()) else {
        return Vec::new();
    };

    params
        .iter()
        .filter_map(|p| {
            let name = p.get("name").and_then(|v| v.as_str())?;
            let location = match p.get("in").and_then(|v| v.as_str())? {
                "path" => ParameterLocation::Path,
                "query" => ParameterLocation::Query,
                "header" => ParameterLocation::Header,
                _ => return None,
            };

            Some(ParsedParameter {
                name: name.to_string(),
                location,
                required: p.get("required").and_then(Value::as_bool).unwrap_or(false),
                schema_type: p
                    .get("schema")
                    .and_then(|s| s.get("type"))
                    .and_then(|v| v.as_str())
                    .map(String::from),
                default_value: p
                    .get("schema")
                    .and_then(|s| s.get("default"))
                    .map(ToString::to_string),
                description: p
                    .get("description")
                    .and_then(|v| v.as_str())
                    .map(String::from),
            })
        })
        .collect()
}

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

    #[test]
    fn test_parse_minimal_spec() {
        let result = parse_openapi_spec(MINIMAL_SPEC);
        assert!(result.is_ok());
        let spec = result.unwrap();
        assert_eq!(spec.title, "Test API");
        assert_eq!(spec.operations.len(), 1);
        assert_eq!(spec.operations[0].operation_id, "getUsers");
    }

    #[test]
    fn test_generates_operation_id_when_missing() {
        let spec_no_id = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Test", "version": "1.0.0" },
            "paths": {
                "/users/{id}": {
                    "get": {
                        "summary": "Get user",
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
        let result = parse_openapi_spec(spec_no_id).unwrap();
        assert_eq!(result.operations[0].operation_id, "get_users_id");
    }

    #[test]
    fn test_parses_parameters() {
        let spec_with_params = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Test", "version": "1.0.0" },
            "paths": {
                "/users": {
                    "get": {
                        "parameters": [
                            {
                                "name": "limit",
                                "in": "query",
                                "required": false,
                                "schema": { "type": "integer" }
                            }
                        ],
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
        let result = parse_openapi_spec(spec_with_params).unwrap();
        assert_eq!(result.operations[0].parameters.len(), 1);
        assert_eq!(result.operations[0].parameters[0].name, "limit");
        assert_eq!(
            result.operations[0].parameters[0].location,
            ParameterLocation::Query
        );
    }

    #[test]
    fn test_parse_invalid_json_returns_error() {
        let result = parse_openapi_spec("not json");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid JSON"));
    }

    #[test]
    fn test_validate_openapi_spec_accepts_minimal() {
        let result = validate_openapi_spec(MINIMAL_SPEC);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_openapi_spec_rejects_invalid_json() {
        let result = validate_openapi_spec("not json");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid JSON"));
    }

    #[test]
    fn test_validate_openapi_spec_accepts_swagger_2() {
        let swagger = r#"{
            "swagger": "2.0",
            "info": { "title": "Test API", "version": "1.0.0" },
            "paths": {}
        }"#;
        let result = validate_openapi_spec(swagger);
        assert!(result.is_ok());
    }
}
