// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Axum HTTP/SSE transport for the MCP server.
//!
//! Exposes JSON-RPC 2.0 over HTTP POST with SSE for server notifications.
//! Implements the MCP Streamable HTTP transport spec.

use std::convert::Infallible;
use std::sync::Arc;

use axum::Router;
use axum::extract::{DefaultBodyLimit, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::response::sse::{Event, Sse};
use axum::routing::{delete, get, post};
use tokio::sync::RwLock;
use tokio_stream::wrappers::ReceiverStream;

use crate::application::mcp_server_service::McpServerService;
use crate::domain::mcp::events::EventEnvelope;
use crate::infrastructure::mcp::server::dispatcher;
use crate::infrastructure::mcp::server::session::SessionManager;

/// Broadcasts `EventEnvelope`s to all connected SSE clients.
///
/// Wraps a `tokio::sync::broadcast` channel. The sender is shared
/// with the event emitter so that every event emitted by the MCP
/// service is also pushed to SSE clients in real-time.
#[derive(Debug, Clone)]
pub struct EventBroadcaster {
    tx: tokio::sync::broadcast::Sender<EventEnvelope>,
}

/// Default broadcast channel capacity — enough to buffer bursts
/// without excessive memory use. Slow receivers that lag behind
/// will receive a `Lagged` error and lose intermediate events.
const BROADCAST_CAPACITY: usize = 128;

impl EventBroadcaster {
    /// Create a new broadcaster with default capacity.
    #[must_use]
    pub fn new() -> Self {
        let (tx, _) = tokio::sync::broadcast::channel(BROADCAST_CAPACITY);
        Self { tx }
    }

    /// Send an event to all connected SSE clients.
    ///
    /// Returns the number of receivers that got the message.
    /// Returns 0 if no SSE clients are connected (this is fine).
    pub fn send(&self, envelope: EventEnvelope) -> usize {
        self.tx.send(envelope).unwrap_or(0)
    }

    /// Subscribe to the broadcast channel.
    ///
    /// Each SSE handler calls this to get its own receiver.
    #[must_use]
    pub fn subscribe(&self) -> tokio::sync::broadcast::Receiver<EventEnvelope> {
        self.tx.subscribe()
    }
}

/// Shared state for the Axum MCP server.
#[derive(Clone)]
pub struct McpServerState {
    /// Tool registry and dispatch.
    pub service: Arc<RwLock<McpServerService>>,
    /// Session manager.
    pub sessions: Arc<SessionManager>,
    /// Event broadcaster for SSE push notifications.
    pub broadcaster: Arc<EventBroadcaster>,
}

/// Maximum request body size (1 MiB). Prevents memory exhaustion from oversized payloads.
const MAX_BODY_SIZE: usize = 1024 * 1024;

/// Build the Axum router for the MCP server.
pub fn router(state: McpServerState) -> Router {
    Router::new()
        .route("/mcp", post(handle_post))
        .route("/mcp", delete(handle_delete))
        .route("/mcp/sse", get(handle_sse))
        .layer(DefaultBodyLimit::max(MAX_BODY_SIZE))
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
///
/// Sends an initial `endpoint` event, then relays all broadcast events
/// as SSE `event: mcp-event` messages until the client disconnects.
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
    let mut broadcast_rx = state.broadcaster.subscribe();

    // Send initial endpoint event, then relay broadcast events to this SSE
    // client. When the client disconnects, `rx` is dropped — the `tx.send()`
    // calls below will fail, and this task exits cleanly (no leak).
    tokio::spawn(async move {
        // Initial endpoint event per MCP spec.
        if tx
            .send(Ok(Event::default().event("endpoint").data("/mcp")))
            .await
            .is_err()
        {
            return; // Client already disconnected.
        }

        // Relay broadcast events until client disconnects or channel closes.
        // Uses select! to detect client disconnect even when no broadcasts arrive.
        loop {
            tokio::select! {
                result = broadcast_rx.recv() => {
                    match result {
                        Ok(envelope) => {
                            let Ok(data) = serde_json::to_string(&envelope) else {
                                continue; // Skip malformed envelopes.
                            };
                            let sse_event = Event::default().event("mcp-event").data(data);
                            if tx.send(Ok(sse_event)).await.is_err() {
                                break; // Client disconnected.
                            }
                        }
                        Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                            tracing::warn!("SSE client lagged, skipped {n} events");
                        }
                        Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                            break; // Broadcaster shut down.
                        }
                    }
                }
                () = tx.closed() => {
                    break; // Client disconnected.
                }
            }
        }
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
    use crate::domain::mcp::events::{Actor, EventEnvelope};
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
            broadcaster: Arc::new(EventBroadcaster::new()),
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

    // ========================================================================
    // EventBroadcaster tests
    // ========================================================================

    fn make_envelope(name: &str) -> EventEnvelope {
        EventEnvelope {
            actor: Actor::Ai {
                model: Some("claude".to_string()),
                session_id: None,
            },
            timestamp: "2026-02-09T12:00:00Z".to_string(),
            correlation_id: None,
            lamport: None,
            payload: json!({"name": name}),
        }
    }

    #[test]
    fn test_broadcaster_send_with_no_subscribers_returns_zero() {
        let broadcaster = EventBroadcaster::new();
        let count = broadcaster.send(make_envelope("test"));
        assert_eq!(count, 0);
    }

    #[test]
    fn test_broadcaster_send_with_subscriber_returns_one() {
        let broadcaster = EventBroadcaster::new();
        let _rx = broadcaster.subscribe();
        let count = broadcaster.send(make_envelope("test"));
        assert_eq!(count, 1);
    }

    #[tokio::test]
    async fn test_broadcaster_subscriber_receives_events() {
        let broadcaster = EventBroadcaster::new();
        let mut rx = broadcaster.subscribe();

        broadcaster.send(make_envelope("hello"));

        let received = rx.recv().await.unwrap();
        assert_eq!(received.payload["name"], "hello");
        assert_eq!(
            received.actor,
            Actor::Ai {
                model: Some("claude".to_string()),
                session_id: None,
            }
        );
    }

    #[tokio::test]
    async fn test_broadcaster_multiple_subscribers() {
        let broadcaster = EventBroadcaster::new();
        let mut rx1 = broadcaster.subscribe();
        let mut rx2 = broadcaster.subscribe();

        let count = broadcaster.send(make_envelope("multi"));
        assert_eq!(count, 2);

        let e1 = rx1.recv().await.unwrap();
        let e2 = rx2.recv().await.unwrap();
        assert_eq!(e1.payload["name"], "multi");
        assert_eq!(e2.payload["name"], "multi");
    }

    #[tokio::test]
    async fn test_broadcaster_subscriber_dropped_reduces_count() {
        let broadcaster = EventBroadcaster::new();
        let rx1 = broadcaster.subscribe();
        let _rx2 = broadcaster.subscribe();

        assert_eq!(broadcaster.send(make_envelope("two")), 2);

        drop(rx1);
        assert_eq!(broadcaster.send(make_envelope("one")), 1);
    }
}
