// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Axum HTTP/SSE transport for the MCP server.
//!
//! Exposes JSON-RPC 2.0 over HTTP POST with SSE for server notifications.
//! Implements the MCP Streamable HTTP transport spec.

use std::convert::Infallible;
use std::sync::Arc;

use axum::Router;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::response::sse::{Event, Sse};
use axum::routing::{delete, get, post};
use tokio::sync::RwLock;
use tokio_stream::wrappers::ReceiverStream;

use crate::application::mcp_server_service::McpServerService;
use crate::infrastructure::mcp::server::dispatcher;
use crate::infrastructure::mcp::server::session::SessionManager;

/// Shared state for the Axum MCP server.
#[derive(Clone)]
pub struct McpServerState {
    /// Tool registry and dispatch.
    pub service: Arc<RwLock<McpServerService>>,
    /// Session manager.
    pub sessions: Arc<SessionManager>,
}

/// Build the Axum router for the MCP server.
pub fn router(state: McpServerState) -> Router {
    Router::new()
        .route("/mcp", post(handle_post))
        .route("/mcp", delete(handle_delete))
        .route("/mcp/sse", get(handle_sse))
        .with_state(state)
}

/// Handle POST /mcp — JSON-RPC request → response.
async fn handle_post(
    State(state): State<McpServerState>,
    headers: HeaderMap,
    body: String,
) -> axum::response::Response {
    // Create session on first request if no session header
    let session_id = match headers.get("mcp-session-id").and_then(|v| v.to_str().ok()) {
        Some(id) => {
            if !state.sessions.has_session(id).await {
                return (StatusCode::NOT_FOUND, "Unknown session").into_response();
            }
            id.to_string()
        }
        None => state.sessions.create_session().await,
    };

    dispatcher::dispatch(&body, &state.service)
        .await
        .map_or_else(
            || {
                // Notification — no response body
                axum::response::Response::builder()
                    .status(StatusCode::ACCEPTED)
                    .header("Mcp-Session-Id", &session_id)
                    .body(axum::body::Body::empty())
                    .unwrap_or_default()
            },
            |response| {
                axum::response::Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", "application/json")
                    .header("Mcp-Session-Id", &session_id)
                    .body(axum::body::Body::from(response))
                    .unwrap_or_default()
            },
        )
}

/// Handle GET /mcp/sse — SSE stream for server notifications.
async fn handle_sse(
    State(state): State<McpServerState>,
    headers: HeaderMap,
) -> Result<Sse<ReceiverStream<Result<Event, Infallible>>>, (StatusCode, &'static str)> {
    let _session_id = match headers.get("mcp-session-id").and_then(|v| v.to_str().ok()) {
        Some(id) if state.sessions.has_session(id).await => id.to_string(),
        Some(_) => {
            return Err((StatusCode::NOT_FOUND, "Unknown session"));
        }
        None => {
            return Err((StatusCode::BAD_REQUEST, "Missing Mcp-Session-Id header"));
        }
    };

    let (tx, rx) = tokio::sync::mpsc::channel::<Result<Event, Infallible>>(32);

    // Send initial endpoint event, then hold the sender open so the SSE stream
    // stays alive. The sender will be dropped when the client disconnects
    // (the spawned task detects the closed channel via send failure).
    tokio::spawn(async move {
        let _ = tx
            .send(Ok(Event::default().event("endpoint").data("/mcp")))
            .await;

        // Keep the SSE stream alive by holding `tx`.
        // Future: use this to push server notifications (collection changes, etc).
        // The pending future never resolves; when the client disconnects,
        // the rx side drops and subsequent sends would fail.
        std::future::pending::<()>().await;
        // Unreachable, but ensures `tx` is not dropped.
        drop(tx);
    });

    Ok(Sse::new(ReceiverStream::new(rx)))
}

/// Handle DELETE /mcp — session cleanup.
async fn handle_delete(
    State(state): State<McpServerState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(session_id) = headers.get("mcp-session-id").and_then(|v| v.to_str().ok()) else {
        return (StatusCode::BAD_REQUEST, "Missing Mcp-Session-Id header");
    };

    if state.sessions.remove_session(session_id).await {
        (StatusCode::OK, "Session deleted")
    } else {
        (StatusCode::NOT_FOUND, "Unknown session")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use serde_json::json;
    use tempfile::TempDir;
    use tower::ServiceExt;

    fn make_state() -> (McpServerState, TempDir) {
        let dir = TempDir::new().unwrap();
        let service = McpServerService::new(dir.path().to_path_buf());
        let state = McpServerState {
            service: Arc::new(RwLock::new(service)),
            sessions: Arc::new(SessionManager::new()),
        };
        (state, dir)
    }

    #[tokio::test]
    async fn test_post_initialize() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("POST")
            .uri("/mcp")
            .header("Content-Type", "application/json")
            .body(Body::from(
                json!({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {}
                })
                .to_string(),
            ))
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        // Should have session header
        assert!(resp.headers().contains_key("mcp-session-id"));

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(parsed["result"]["serverInfo"]["name"], "runi");
    }

    #[tokio::test]
    async fn test_post_notification_returns_accepted() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("POST")
            .uri("/mcp")
            .header("Content-Type", "application/json")
            .body(Body::from(
                json!({
                    "jsonrpc": "2.0",
                    "method": "notifications/initialized"
                })
                .to_string(),
            ))
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::ACCEPTED);
    }

    #[tokio::test]
    async fn test_post_with_invalid_session() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("POST")
            .uri("/mcp")
            .header("Content-Type", "application/json")
            .header("Mcp-Session-Id", "invalid-session-id")
            .body(Body::from(
                json!({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "ping"
                })
                .to_string(),
            ))
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_session() {
        let (state, _dir) = make_state();
        let session_id = state.sessions.create_session().await;
        let app = router(state);

        let req = Request::builder()
            .method("DELETE")
            .uri("/mcp")
            .header("Mcp-Session-Id", &session_id)
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_delete_missing_session_header() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("DELETE")
            .uri("/mcp")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }
}
