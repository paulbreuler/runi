// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! JSON-RPC method dispatcher for the MCP server.
//!
//! Routes incoming JSON-RPC requests to the appropriate handler based on method name.

use std::sync::Arc;

use serde_json::json;
use tokio::sync::RwLock;

use crate::application::mcp_server_service::McpServerService;
use crate::domain::mcp::jsonrpc::{JsonRpcError, JsonRpcId, JsonRpcRequest, JsonRpcResponse};
use crate::domain::mcp::protocol::{
    InitializeResult, ToolCallParams, ToolCallResult, ToolResponseContent, ToolsListResult,
};
use crate::infrastructure::http::execute_http_request;

/// Dispatch a JSON-RPC request string to the appropriate handler.
///
/// Returns `Some(response_json)` for requests, `None` for notifications.
///
/// # Errors
///
/// Parse errors return a JSON-RPC error response.
pub async fn dispatch(raw: &str, service: &Arc<RwLock<McpServerService>>) -> Option<String> {
    let request: JsonRpcRequest = match serde_json::from_str(raw) {
        Ok(r) => r,
        Err(e) => {
            let resp = JsonRpcResponse::error(None, JsonRpcError::parse_error());
            tracing::warn!("JSON-RPC parse error: {e}");
            return Some(serde_json::to_string(&resp).unwrap_or_default());
        }
    };

    // Notifications have no id and expect no response
    if request.is_notification() {
        handle_notification(&request.method);
        return None;
    }

    // Flatten Option<Option<JsonRpcId>> → Option<JsonRpcId> for the response.
    // `Some(Some(id))` → `Some(id)`, `Some(None)` (id: null) → `None`, `None` (absent) → `None`
    let id = request.id.clone().flatten();
    let response = match request.method.as_str() {
        "initialize" => handle_initialize(id),
        "tools/list" => handle_tools_list(id, service).await,
        "tools/call" => handle_tools_call(id, &request, service).await,
        "ping" => handle_ping(id),
        _ => JsonRpcResponse::error(id, JsonRpcError::method_not_found(&request.method)),
    };

    Some(serde_json::to_string(&response).unwrap_or_default())
}

fn handle_notification(method: &str) {
    match method {
        "notifications/initialized" => {
            tracing::info!("MCP client initialized");
        }
        "notifications/cancelled" => {
            tracing::info!("MCP client cancelled a request");
        }
        other => {
            tracing::debug!("Unknown notification: {other}");
        }
    }
}

fn handle_initialize(id: Option<JsonRpcId>) -> JsonRpcResponse {
    let result = InitializeResult::for_runi();
    JsonRpcResponse::success(
        id,
        serde_json::to_value(result).unwrap_or_else(|_| json!({})),
    )
}

async fn handle_tools_list(
    id: Option<JsonRpcId>,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let svc = service.read().await;
    let tools = svc.list_tools();
    drop(svc);

    let result = ToolsListResult { tools };
    JsonRpcResponse::success(
        id,
        serde_json::to_value(result).unwrap_or_else(|_| json!({})),
    )
}

async fn handle_tools_call(
    id: Option<JsonRpcId>,
    request: &JsonRpcRequest,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let params: ToolCallParams = match request.params.as_ref() {
        Some(p) => match serde_json::from_value(p.clone()) {
            Ok(params) => params,
            Err(e) => {
                return JsonRpcResponse::error(id, JsonRpcError::invalid_params(&e.to_string()));
            }
        },
        None => {
            return JsonRpcResponse::error(id, JsonRpcError::invalid_params("missing params"));
        }
    };

    // execute_request needs async HTTP — handle it specially to avoid
    // holding the RwLock read guard across an .await point.
    if params.name == "execute_request" {
        return handle_execute_request(id, params.arguments, service).await;
    }

    let svc = service.read().await;
    match svc.call_tool(&params.name, params.arguments) {
        Ok(result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            // Tool errors are returned as successful JSON-RPC responses
            // with is_error=true in the MCP result, per the MCP spec.
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `execute_request` tool — async HTTP execution outside the lock.
async fn handle_execute_request(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let args = arguments.unwrap_or_default();

    // Phase 1: Read lock to prepare request params, then drop lock.
    let prepare_result = {
        let svc = service.read().await;
        svc.prepare_execute_request(&args)
    };

    let (request_params, collection_id, request_id) = match prepare_result {
        Ok(result) => result,
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            return JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            );
        }
    };

    // Phase 2: Execute HTTP request without holding any lock.
    let correlation_id = format!("mcp-{collection_id}-{request_id}");
    match execute_http_request(request_params, Some(correlation_id)).await {
        Ok(response) => {
            // Emit event for UI update
            {
                let svc = service.read().await;
                svc.emit_execute_event(&collection_id, &request_id, &response);
            }

            let result_json = json!({
                "status": response.status,
                "status_text": response.status_text,
                "headers": response.headers,
                "body": response.body,
                "timing": {
                    "total_ms": response.timing.total_ms,
                    "dns_ms": response.timing.dns_ms,
                    "connect_ms": response.timing.connect_ms,
                    "tls_ms": response.timing.tls_ms,
                    "first_byte_ms": response.timing.first_byte_ms,
                }
            });

            let result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: result_json.to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(result).unwrap_or_else(|_| json!({})),
            )
        }
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: format!("HTTP request failed: {e}"),
                }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

fn handle_ping(id: Option<JsonRpcId>) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({}))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_service() -> (Arc<RwLock<McpServerService>>, TempDir) {
        let dir = TempDir::new().unwrap();
        let service = McpServerService::new(dir.path().to_path_buf());
        (Arc::new(RwLock::new(service)), dir)
    }

    #[tokio::test]
    async fn test_dispatch_initialize() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert_eq!(result["protocolVersion"], "2025-11-25");
        assert_eq!(result["serverInfo"]["name"], "runi");
    }

    #[tokio::test]
    async fn test_dispatch_tools_list() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        let tools = result["tools"].as_array().unwrap();
        assert_eq!(tools.len(), 6);
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_create_collection() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "create_collection",
                "arguments": { "name": "My API" }
            }
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_unknown_tool() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "nonexistent",
                "arguments": {}
            }
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        // Tool errors are returned as success with is_error=true
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(result["isError"].as_bool().unwrap_or(false));
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_missing_params() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call"
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        assert_eq!(parsed.error.unwrap().code, -32602);
    }

    #[tokio::test]
    async fn test_dispatch_unknown_method() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 6,
            "method": "unknown/method"
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        let err = parsed.error.unwrap();
        assert_eq!(err.code, -32601);
        assert!(err.message.contains("unknown/method"));
    }

    #[tokio::test]
    async fn test_dispatch_notification_returns_none() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        })
        .to_string();

        let resp = dispatch(&req, &service).await;
        assert!(resp.is_none());
    }

    #[tokio::test]
    async fn test_dispatch_parse_error() {
        let (service, _dir) = make_service();
        let resp = dispatch("not valid json", &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        assert_eq!(parsed.error.unwrap().code, -32700);
    }

    #[tokio::test]
    async fn test_dispatch_ping() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 7,
            "method": "ping"
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
    }

    #[tokio::test]
    async fn test_dispatch_string_id() {
        let (service, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": "abc-123",
            "method": "ping"
        })
        .to_string();

        let resp = dispatch(&req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert_eq!(parsed.id, Some(JsonRpcId::String("abc-123".to_string())));
    }

    #[tokio::test]
    async fn test_e2e_through_fake_transport() {
        use crate::domain::mcp::transport::Transport;
        use crate::infrastructure::mcp::fake_transport::FakeTransport;

        let (service, _dir) = make_service();
        let transport = FakeTransport::new();

        // Inject initialize request
        let init_req = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        .to_string();
        transport.inject(init_req).unwrap();

        // Read from receiver, dispatch, send response
        let mut rx = transport.receiver().await;
        let msg = rx.recv().await.unwrap();
        if let Some(response) = dispatch(&msg, &service).await {
            transport.send(response).await.unwrap();
        }

        // Verify response was captured
        let sent = transport.sent_messages().await;
        assert_eq!(sent.len(), 1);
        let resp: JsonRpcResponse = serde_json::from_str(&sent[0]).unwrap();
        assert!(resp.error.is_none());
        let result = resp.result.unwrap();
        assert_eq!(result["serverInfo"]["name"], "runi");
    }

    #[tokio::test]
    async fn test_dispatch_execute_request() {
        use std::io::{Read, Write};
        use std::net::TcpListener;

        // Start a minimal test HTTP server
        let listener = match TcpListener::bind("127.0.0.1:0") {
            Ok(l) => l,
            Err(err) if err.kind() == std::io::ErrorKind::PermissionDenied => {
                eprintln!("[TEST] Skipping: {err}");
                return;
            }
            Err(err) => panic!("bind: {err}"),
        };
        let addr = listener.local_addr().unwrap();
        let base_url = format!("http://{addr}");

        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut buf = [0u8; 1024];
            let _ = stream.read(&mut buf);
            let body = r#"{"ok": true}"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            stream.write_all(response.as_bytes()).unwrap();
        });

        let (service, _dir) = make_service();

        // Create collection
        let create_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": { "name": "create_collection", "arguments": { "name": "Test" } }
        })
        .to_string();
        let resp = dispatch(&create_req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let create_result = parsed.result.unwrap();
        let content_text: serde_json::Value =
            serde_json::from_str(create_result["content"][0]["text"].as_str().unwrap()).unwrap();
        let collection_id = content_text["id"].as_str().unwrap();

        // Add request
        let add_req = json!({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {
                "name": "add_request",
                "arguments": {
                    "collection_id": collection_id,
                    "name": "Test Request",
                    "method": "GET",
                    "url": format!("{}/test", base_url)
                }
            }
        })
        .to_string();
        let resp = dispatch(&add_req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let add_result = parsed.result.unwrap();
        let add_text: serde_json::Value =
            serde_json::from_str(add_result["content"][0]["text"].as_str().unwrap()).unwrap();
        let request_id = add_text["request_id"].as_str().unwrap();

        // Execute request
        let exec_req = json!({
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {
                "name": "execute_request",
                "arguments": {
                    "collection_id": collection_id,
                    "request_id": request_id,
                    "timeout_ms": 5000
                }
            }
        })
        .to_string();
        let resp = dispatch(&exec_req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none(), "JSON-RPC should succeed");
        let exec_result = parsed.result.unwrap();
        assert!(
            !exec_result["isError"].as_bool().unwrap_or(false),
            "Tool should succeed"
        );

        // Parse the HTTP response from the tool result
        let result_text: serde_json::Value =
            serde_json::from_str(exec_result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert_eq!(result_text["status"], 200);
        assert!(result_text["body"].as_str().unwrap().contains("ok"));
    }

    #[tokio::test]
    async fn test_dispatch_execute_request_missing_collection() {
        let (service, _dir) = make_service();

        let exec_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": "execute_request",
                "arguments": {
                    "collection_id": "nonexistent",
                    "request_id": "req_1"
                }
            }
        })
        .to_string();
        let resp = dispatch(&exec_req, &service).await.unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(
            parsed.error.is_none(),
            "JSON-RPC should succeed (tool error in result)"
        );
        let result = parsed.result.unwrap();
        assert!(
            result["isError"].as_bool().unwrap_or(false),
            "Tool should return error"
        );
    }
}
