#![allow(dead_code)]

use serde_json::Value;

use openapiv3::{OpenAPI, Parameter, ReferenceOr};

use super::openapi_types::{
    OpenApiParameterLocation, OpenApiParsedOperation, OpenApiParsedParameter,
    OpenApiParsedRequestBody, OpenApiParsedSpec, OpenApiServer,
};
use super::streaming::is_streaming_operation;

/// Parse a raw spec string (JSON or YAML) into a `serde_json::Value`.
///
/// Tries JSON first; if that fails, attempts YAML and converts to JSON.
/// Returns an "Invalid format" error if neither succeeds.
fn parse_to_json_value(content: &str) -> Result<Value, String> {
    // Try JSON first (fast path — most common)
    if let Ok(doc) = serde_json::from_str::<Value>(content) {
        return Ok(doc);
    }

    // Fall back to YAML
    let yaml_value: serde_yaml_ng::Value = serde_yaml_ng::from_str(content)
        .map_err(|e| format!("Invalid format: not valid JSON or YAML: {e}"))?;

    // Convert YAML → JSON via serde round-trip
    let json_str = serde_json::to_string(&yaml_value)
        .map_err(|e| format!("Invalid format: YAML-to-JSON conversion failed: {e}"))?;
    serde_json::from_str::<Value>(&json_str)
        .map_err(|e| format!("Invalid format: JSON re-parse after YAML conversion failed: {e}"))
}

/// Parse `OpenAPI` JSON or YAML into internal types.
///
/// # Supported Formats
/// - JSON (primary)
/// - YAML (converted to JSON internally)
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
pub fn parse_openapi_spec(content: &str) -> Result<OpenApiParsedSpec, String> {
    let doc: Value = parse_to_json_value(content)?;

    // OpenAPI 3.x — deserialize once, use typed field access throughout
    if doc.get("openapi").is_some() {
        // Normalize 3.1.0 JSON-Schema type arrays to 3.0.x nullable form so the
        // `openapiv3` crate (which targets 3.0.x) can deserialize either version.
        let doc = normalize_31_type_arrays(doc);
        let api: OpenAPI =
            serde_json::from_value(doc).map_err(|e| format!("OpenAPI validation failed: {e}"))?;
        return Ok(extract_from_openapi_typed(&api));
    }

    // Swagger 2.0 — raw JSON path (openapiv3 crate only supports OpenAPI 3.x)
    if doc.get("swagger").and_then(Value::as_str) == Some("2.0") {
        return parse_swagger_2(&doc);
    }

    Err("Missing OpenAPI or Swagger version field".to_string())
}

/// Validate the spec against the `OpenAPI` schema when applicable.
///
/// Accepts both JSON and YAML input.
pub fn validate_openapi_spec(content: &str) -> Result<(), String> {
    let doc: Value = parse_to_json_value(content)?;
    validate_openapi_value(&doc)
}

fn validate_openapi_value(doc: &Value) -> Result<(), String> {
    if doc.get("openapi").is_some() {
        let normalized = normalize_31_type_arrays(doc.clone());
        serde_json::from_value::<OpenAPI>(normalized)
            .map_err(|e| format!("OpenAPI validation failed: {e}"))?;
        return Ok(());
    }

    if doc.get("swagger").and_then(Value::as_str) == Some("2.0") {
        return Ok(());
    }

    Err("Missing OpenAPI or Swagger version field".to_string())
}

// ─── OpenAPI 3.1 → 3.0 normalization ─────────────────────────────────────────

/// Recursively convert `OpenAPI` 3.1 JSON-Schema type arrays to the 3.0.x
/// `nullable` style understood by the `openapiv3` crate.
///
/// `OpenAPI` 3.1 allows `"type": ["string", "null"]` (JSON Schema 2020-12).
/// `OpenAPI` 3.0 uses `"type": "string", "nullable": true` instead.
///
/// This function normalises `["T", "null"]` → `type: "T", nullable: true`
/// so that specs written against either version can be parsed successfully.
fn normalize_31_type_arrays(value: Value) -> Value {
    match value {
        Value::Object(mut map) => {
            // Check if "type" is an array containing "null"
            let nullable_type = if let Some(Value::Array(types)) = map.get("type") {
                let non_null: Vec<&str> = types
                    .iter()
                    .filter_map(|v| v.as_str())
                    .filter(|s| *s != "null")
                    .collect();
                let has_null = types.iter().any(|v| v.as_str() == Some("null"));

                if has_null {
                    match non_null.as_slice() {
                        // ["null"] → nullable with no specific type; drop "type"
                        [] => Some(None),
                        // ["T", "null"] → type: "T", nullable: true
                        [single] => Some(Some((*single).to_string())),
                        // ["T1", "T2", "null"] → too complex; leave as-is
                        _ => None,
                    }
                } else {
                    None
                }
            } else {
                None
            };

            if let Some(resolved) = nullable_type {
                // Remove the array-style "type" key
                map.remove("type");
                // Set nullable: true
                map.insert("nullable".to_string(), Value::Bool(true));
                // Re-insert scalar type if present
                if let Some(t) = resolved {
                    map.insert("type".to_string(), Value::String(t));
                }
            }

            // Recurse into all values
            Value::Object(
                map.into_iter()
                    .map(|(k, v)| (k, normalize_31_type_arrays(v)))
                    .collect(),
            )
        }
        Value::Array(arr) => Value::Array(arr.into_iter().map(normalize_31_type_arrays).collect()),
        other => other,
    }
}

// ─── OpenAPI 3.x typed extraction ────────────────────────────────────────────

fn extract_from_openapi_typed(api: &OpenAPI) -> OpenApiParsedSpec {
    let servers = api
        .servers
        .iter()
        .map(|s| OpenApiServer {
            url: s.url.clone(),
            description: s.description.clone(),
        })
        .collect();

    OpenApiParsedSpec {
        title: api.info.title.clone(),
        version: api.info.version.clone(),
        description: api.info.description.clone(),
        servers,
        operations: extract_operations_typed(api),
    }
}

fn extract_operations_typed(api: &OpenAPI) -> Vec<OpenApiParsedOperation> {
    // `OpenAPI::operations()` skips $ref path items and yields (path, method, op) triples
    api.operations()
        .map(|(path, method, op)| extract_operation_typed(path, method, op))
        .collect()
}

fn extract_operation_typed(
    path: &str,
    method: &str,
    op: &openapiv3::Operation,
) -> OpenApiParsedOperation {
    let operation_id = op
        .operation_id
        .clone()
        .unwrap_or_else(|| generate_operation_id(method, path));

    let parameters = extract_parameters_typed(op);
    let request_body = extract_request_body_typed(op);

    // Serialize op back to Value for streaming detection — keeps streaming.rs signature unchanged
    let op_value = serde_json::to_value(op).unwrap_or_default();
    let is_streaming = is_streaming_operation(&op_value);

    OpenApiParsedOperation {
        operation_id,
        path: path.to_string(),
        method: method.to_uppercase(),
        summary: op.summary.clone(),
        description: op.description.clone(),
        tags: op.tags.clone(),
        parameters,
        request_body,
        deprecated: op.deprecated,
        is_streaming,
    }
}

fn extract_parameters_typed(op: &openapiv3::Operation) -> Vec<OpenApiParsedParameter> {
    op.parameters
        .iter()
        .filter_map(|p_ref| {
            // Skip $ref parameters — same behavior as original filter_map
            let p = p_ref.as_item()?;

            let location = match p {
                Parameter::Query { .. } => OpenApiParameterLocation::Query,
                Parameter::Header { .. } => OpenApiParameterLocation::Header,
                Parameter::Path { .. } => OpenApiParameterLocation::Path,
                Parameter::Cookie { .. } => return None, // Cookie not in our IR
            };

            let data = p.parameter_data_ref();
            let (schema_type, default_value) = extract_param_schema_fields(data);

            Some(OpenApiParsedParameter {
                name: data.name.clone(),
                location,
                required: data.required,
                schema_type,
                default_value,
                description: data.description.clone(),
            })
        })
        .collect()
}

/// Extract `schema_type` and `default_value` from a parameter's format field.
///
/// Serializes `ParameterSchemaOrContent` to JSON to avoid deep matching on
/// the complex `SchemaKind` type hierarchy.
fn extract_param_schema_fields(
    data: &openapiv3::ParameterData,
) -> (Option<String>, Option<String>) {
    let Ok(schema_json) = serde_json::to_value(&data.format) else {
        return (None, None);
    };

    // ParameterSchemaOrContent::Schema serializes as {"schema": {...}}
    let schema = schema_json.get("schema");
    let schema_type = schema
        .and_then(|s| s.get("type"))
        .and_then(|v| v.as_str())
        .map(String::from);
    let default_value = schema
        .and_then(|s| s.get("default"))
        .map(ToString::to_string);

    (schema_type, default_value)
}

/// Extract request body from an `OpenAPI` operation using typed field access.
///
/// Prefers `content.application/json.example`, falls back to
/// `content.application/json.schema.example`, then `None`.
///
/// `$ref` request bodies (e.g. `"$ref": "#/components/requestBodies/..."`) are
/// silently skipped because `openapiv3` does not auto-resolve references. A
/// future improvement could perform manual `$ref` resolution before extraction.
fn extract_request_body_typed(op: &openapiv3::Operation) -> Option<OpenApiParsedRequestBody> {
    let rb = match op.request_body.as_ref()? {
        ReferenceOr::Item(rb) => rb,
        ReferenceOr::Reference { reference } => {
            tracing::debug!(target: "spec::parser", %reference, "$ref request body skipped (not resolved)");
            return None;
        }
    };

    // Prefer application/json, fall back to first content type
    let (content_type, media_type) = rb
        .content
        .get("application/json")
        .map(|v| ("application/json", v))
        .or_else(|| rb.content.iter().next().map(|(k, v)| (k.as_str(), v)))?;

    // Prefer media-level example → schema-level example → None
    let example = media_type
        .example
        .as_ref()
        .or_else(|| {
            media_type
                .schema
                .as_ref()
                .and_then(ReferenceOr::as_item)
                .and_then(|s| s.schema_data.example.as_ref())
        })
        .map(|v| serde_json::to_string(v).unwrap_or_default());

    Some(OpenApiParsedRequestBody {
        content_type: Some(content_type.to_string()),
        example,
        required: rb.required,
    })
}

// ─── Swagger 2.0 raw JSON path ────────────────────────────────────────────────

fn parse_swagger_2(doc: &Value) -> Result<OpenApiParsedSpec, String> {
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

    let servers = parse_servers_swagger2(doc);
    let operations = parse_operations_swagger2(doc)?;

    Ok(OpenApiParsedSpec {
        title,
        version,
        description,
        servers,
        operations,
    })
}

fn parse_servers_swagger2(doc: &Value) -> Vec<OpenApiServer> {
    let mut servers = Vec::new();

    // Swagger 2.0: derive server URL from host + basePath + schemes
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
        servers.push(OpenApiServer {
            url: format!("{scheme}://{host}{base}"),
            description: None,
        });
    }

    servers
}

fn parse_operations_swagger2(doc: &Value) -> Result<Vec<OpenApiParsedOperation>, String> {
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
                operations.push(parse_operation_swagger2(path, method, op));
            }
        }
    }

    Ok(operations)
}

fn parse_operation_swagger2(path: &str, method: &str, op: &Value) -> OpenApiParsedOperation {
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

    let parameters = parse_parameters_swagger2(op);
    let request_body = parse_request_body_swagger2(op);
    let deprecated = op
        .get("deprecated")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let is_streaming = is_streaming_operation(op);

    OpenApiParsedOperation {
        operation_id,
        path: path.to_string(),
        method: method.to_uppercase(),
        summary,
        description,
        tags,
        parameters,
        request_body,
        deprecated,
        is_streaming,
    }
}

fn parse_parameters_swagger2(op: &Value) -> Vec<OpenApiParsedParameter> {
    let Some(params) = op.get("parameters").and_then(|v| v.as_array()) else {
        return Vec::new();
    };

    params
        .iter()
        .filter_map(|p| {
            let name = p.get("name").and_then(|v| v.as_str())?;
            let location = match p.get("in").and_then(|v| v.as_str())? {
                "path" => OpenApiParameterLocation::Path,
                "query" => OpenApiParameterLocation::Query,
                "header" => OpenApiParameterLocation::Header,
                _ => return None,
            };

            Some(OpenApiParsedParameter {
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

/// Extract request body for Swagger 2.0 operations.
///
/// Prefers `content.application/json.example`, falls back to
/// `content.application/json.schema.example`, then `None`.
fn parse_request_body_swagger2(op: &Value) -> Option<OpenApiParsedRequestBody> {
    let rb = op.get("requestBody")?;
    let required = rb.get("required").and_then(Value::as_bool).unwrap_or(false);
    let content = rb.get("content")?.as_object()?;

    let (content_type, media_type) = content
        .get("application/json")
        .map(|v| ("application/json", v))
        .or_else(|| content.iter().next().map(|(k, v)| (k.as_str(), v)))?;

    let example = media_type
        .get("example")
        .or_else(|| media_type.get("schema").and_then(|s| s.get("example")))
        .map(|v| serde_json::to_string(v).unwrap_or_default());

    Some(OpenApiParsedRequestBody {
        content_type: Some(content_type.to_string()),
        example,
        required,
    })
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
            OpenApiParameterLocation::Query
        );
    }

    #[test]
    fn test_parse_invalid_input_returns_error() {
        // "not json" is valid YAML (a scalar string), so it parses but fails
        // OpenAPI validation because it has no "openapi" or "swagger" key.
        let result = parse_openapi_spec("not json");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Missing OpenAPI or Swagger"));
    }

    #[test]
    fn test_parse_invalid_yaml_returns_invalid_format() {
        // Deliberately malformed YAML that is also not valid JSON
        let result = parse_openapi_spec("{{{{invalid_yaml:");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid format"));
    }

    #[test]
    fn test_parse_yaml_openapi_spec() {
        let yaml_spec = "openapi: \"3.0.0\"\ninfo:\n  title: YAML API\n  version: \"1.0.0\"\npaths:\n  /test:\n    get:\n      operationId: getTest\n      summary: Test endpoint\n      responses:\n        '200':\n          description: OK\n";
        let result = parse_openapi_spec(yaml_spec);
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result.err());
        let spec = result.unwrap();
        assert_eq!(spec.title, "YAML API");
        assert_eq!(spec.operations.len(), 1);
        assert_eq!(spec.operations[0].operation_id, "getTest");
    }

    #[test]
    fn test_validate_openapi_spec_accepts_minimal() {
        let result = validate_openapi_spec(MINIMAL_SPEC);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_openapi_spec_rejects_invalid_input() {
        // "not json" is valid YAML (scalar string) but fails OpenAPI validation
        let result = validate_openapi_spec("not json");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Missing OpenAPI or Swagger"));
    }

    #[test]
    fn test_validate_openapi_spec_accepts_yaml() {
        let yaml_spec =
            "openapi: \"3.0.0\"\ninfo:\n  title: YAML API\n  version: \"1.0.0\"\npaths: {}\n";
        let result = validate_openapi_spec(yaml_spec);
        assert!(result.is_ok());
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

    #[test]
    fn test_parse_extracts_request_body_from_operation() {
        let spec = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Test", "version": "1.0.0" },
            "paths": {
                "/pets": {
                    "post": {
                        "operationId": "createPet",
                        "requestBody": {
                            "required": true,
                            "content": {
                                "application/json": {
                                    "schema": { "type": "object" },
                                    "example": { "name": "Fido", "tag": "dog" }
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

        let result = parse_openapi_spec(spec).unwrap();
        let op = &result.operations[0];
        let body = op.request_body.as_ref().expect("should have request_body");
        assert_eq!(body.content_type, Some("application/json".to_string()));
        assert!(body.required);

        let example = body.example.as_ref().expect("should have example");
        let parsed: serde_json::Value = serde_json::from_str(example).unwrap();
        assert_eq!(parsed["name"], "Fido");
    }

    #[test]
    fn test_parse_openapi_31_nullable_type_arrays() {
        // OpenAPI 3.1.0 uses JSON Schema type arrays for nullable fields.
        // Our normaliser should convert ["string","null"] so the openapiv3 crate
        // can parse the spec without error.
        let spec = r#"{
            "openapi": "3.1.0",
            "info": { "title": "Nullable API", "version": "0.1.0" },
            "paths": {
                "/items": {
                    "get": {
                        "operationId": "listItems",
                        "responses": {
                            "200": {
                                "description": "OK",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "name":  { "type": "string" },
                                                "note":  { "type": ["string", "null"] },
                                                "count": { "type": ["null", "integer"] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }"#;
        let result = parse_openapi_spec(spec);
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result.err());
        let parsed = result.unwrap();
        assert_eq!(parsed.title, "Nullable API");
        assert_eq!(parsed.operations.len(), 1);
        assert_eq!(parsed.operations[0].operation_id, "listItems");
    }

    #[test]
    fn test_normalize_31_type_arrays() {
        let input = serde_json::json!({
            "type": ["string", "null"],
            "properties": {
                "count": { "type": ["integer", "null"] },
                "plain": { "type": "string" }
            }
        });
        let output = normalize_31_type_arrays(input);
        assert_eq!(output["type"], "string");
        assert_eq!(output["nullable"], true);
        assert_eq!(output["properties"]["count"]["type"], "integer");
        assert_eq!(output["properties"]["count"]["nullable"], true);
        assert_eq!(output["properties"]["plain"]["type"], "string");
        assert!(output["properties"]["plain"].get("nullable").is_none());
    }

    #[test]
    fn test_typed_extraction_with_security_schemes() {
        // Verifies the typed path handles a spec with components.securitySchemes
        // without panicking or producing wrong results.
        let spec = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Secure API", "version": "2.0.0" },
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    },
                    "apiKey": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "X-API-Key"
                    }
                }
            },
            "paths": {
                "/protected": {
                    "get": {
                        "operationId": "getProtected",
                        "security": [{ "bearerAuth": [] }],
                        "responses": {
                            "200": { "description": "OK" }
                        }
                    }
                }
            }
        }"#;

        let result = parse_openapi_spec(spec);
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result.err());

        let parsed = result.unwrap();
        assert_eq!(parsed.title, "Secure API");
        assert_eq!(parsed.version, "2.0.0");
        assert_eq!(parsed.operations.len(), 1);
        assert_eq!(parsed.operations[0].operation_id, "getProtected");
    }
}
