#![allow(dead_code)]

use serde_json::Value;

/// Detect if an `OpenAPI` operation is for streaming (SSE/WebSocket).
///
/// # Detection Heuristics
/// 1. Response content type includes "text/event-stream"
/// 2. Operation ID or tags contain "stream"
/// 3. x-runi-streaming extension is true
///
/// # Why This Matters
/// httpbin has `/stream/{n}` and `/sse` endpoints.
/// We need to mark these so the UI can handle them differently.
pub fn is_streaming_operation(operation: &Value) -> bool {
    // Check response content types
    if check_response_content_types(operation) {
        return true;
    }

    // Check operationId
    if let Some(op_id) = operation.get("operationId").and_then(|v| v.as_str()) {
        let lowered = op_id.to_lowercase();
        if lowered.contains("stream") || lowered.contains("sse") {
            return true;
        }
    }

    // Check tags
    if let Some(tags) = operation.get("tags").and_then(|v| v.as_array()) {
        for tag in tags {
            if let Some(t) = tag.as_str() {
                if t.to_lowercase().contains("stream") {
                    return true;
                }
            }
        }
    }

    // Check x-runi-streaming extension
    if operation.get("x-runi-streaming").and_then(Value::as_bool) == Some(true) {
        return true;
    }

    false
}

fn check_response_content_types(operation: &Value) -> bool {
    // OpenAPI 3.x: responses.200.content
    if let Some(responses) = operation.get("responses").and_then(|v| v.as_object()) {
        for response in responses.values() {
            if let Some(content) = response.get("content").and_then(|v| v.as_object()) {
                for content_type in content.keys() {
                    if content_type.contains("event-stream")
                        || content_type.contains("octet-stream")
                    {
                        return true;
                    }
                }
            }
        }
    }

    // Swagger 2.0: produces array
    if let Some(produces) = operation.get("produces").and_then(|v| v.as_array()) {
        for p in produces {
            if let Some(s) = p.as_str() {
                if s.contains("event-stream") || s.contains("octet-stream") {
                    return true;
                }
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_detects_event_stream_content_type() {
        let op = json!({
            "responses": {
                "200": {
                    "content": {
                        "text/event-stream": {}
                    }
                }
            }
        });
        assert!(is_streaming_operation(&op));
    }

    #[test]
    fn test_detects_stream_in_operation_id() {
        let op = json!({
            "operationId": "streamEvents"
        });
        assert!(is_streaming_operation(&op));
    }

    #[test]
    fn test_detects_sse_in_operation_id() {
        let op = json!({
            "operationId": "getSSE"
        });
        assert!(is_streaming_operation(&op));
    }

    #[test]
    fn test_detects_stream_in_tags() {
        let op = json!({
            "tags": ["streaming"]
        });
        assert!(is_streaming_operation(&op));
    }

    #[test]
    fn test_detects_custom_extension() {
        let op = json!({
            "x-runi-streaming": true
        });
        assert!(is_streaming_operation(&op));
    }

    #[test]
    fn test_non_streaming_operation() {
        let op = json!({
            "operationId": "getUsers",
            "responses": {
                "200": {
                    "content": {
                        "application/json": {}
                    }
                }
            }
        });
        assert!(!is_streaming_operation(&op));
    }
}
