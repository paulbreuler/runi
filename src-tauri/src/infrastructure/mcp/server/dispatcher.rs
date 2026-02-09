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

    let id = request.id.clone();
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
        assert_eq!(tools.len(), 5);
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
}
