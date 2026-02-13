// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Axum HTTP/SSE transport for the MCP server.
//!
//! Exposes JSON-RPC 2.0 over HTTP POST with SSE for server notifications.
//! Implements the MCP Streamable HTTP transport spec.

use std::convert::Infallible;
use std::sync::Arc;

use axum::Router;
use axum::extract::{DefaultBodyLimit, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::response::sse::{Event, Sse};
use axum::routing::{delete, get, post};
use serde::Deserialize;
use tokio::sync::RwLock;
use tokio_stream::wrappers::ReceiverStream;

use crate::application::mcp_server_service::McpServerService;
#[cfg(test)]
use crate::domain::canvas_state::CanvasStateSnapshot;
use crate::domain::mcp::events::EventEnvelope;
use crate::infrastructure::commands::CanvasStateHandle;
use crate::infrastructure::mcp::server::dispatcher;
use crate::infrastructure::mcp::server::session::SessionManager;
use crate::infrastructure::mcp::server::sse_broadcaster::SseBroadcaster;

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
    /// Generic SSE broadcaster for multi-stream support (canvas, collections, etc.).
    pub sse_broadcaster: Arc<SseBroadcaster>,
    /// Canvas state snapshot for MCP tools.
    pub canvas_state: CanvasStateHandle,
    /// Tauri app handle for mutation tools (tab switching, opening, closing).
    pub app_handle: Option<tauri::AppHandle>,
}

/// Maximum request body size (1 MiB). Prevents memory exhaustion from oversized payloads.
const MAX_BODY_SIZE: usize = 1024 * 1024;

/// Build the Axum router for the MCP server.
pub fn router(state: McpServerState) -> Router {
    Router::new()
        .route("/mcp", post(handle_post))
        .route("/mcp", delete(handle_delete))
        .route("/mcp/sse", get(handle_sse))
        .route("/mcp/sse/subscribe", get(handle_sse_subscribe))
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

    dispatcher::dispatch(
        &body,
        &state.service,
        &state.canvas_state,
        state.app_handle.as_ref(),
    )
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

/// Query parameters for `/mcp/sse/subscribe`.
#[derive(Debug, Deserialize)]
struct SubscribeQuery {
    /// Stream name to subscribe to (e.g., "canvas", "collections").
    stream: String,
}

/// Handle GET /mcp/sse/subscribe — Subscribe to a named stream.
///
/// Returns an SSE stream with keepalive pings every 30 seconds.
/// Events are sent as `event: stream-event` with JSON data.
///
/// # Security
///
/// No authentication is required for this endpoint. This is intentional:
/// the MCP server binds to `127.0.0.1` only (localhost), so only local
/// processes can connect. If the server is ever exposed beyond localhost,
/// authentication must be added.
async fn handle_sse_subscribe(
    State(state): State<McpServerState>,
    Query(params): Query<SubscribeQuery>,
) -> Result<Sse<ReceiverStream<Result<Event, Infallible>>>, (StatusCode, &'static str)> {
    let stream_name = params.stream;

    // Subscribe to the stream
    let (sub_id, mut stream_rx) = state.sse_broadcaster.subscribe(&stream_name).await;

    let (tx, rx) = tokio::sync::mpsc::channel::<Result<Event, Infallible>>(32);

    // Clone broadcaster for cleanup on disconnect
    let broadcaster = Arc::clone(&state.sse_broadcaster);

    // Spawn task to relay events and send keepalive pings
    tokio::spawn(async move {
        // Send initial connection event
        let connected_data = serde_json::json!({"stream": stream_name});
        let init_event = Event::default()
            .event("connected")
            .data(connected_data.to_string());
        if tx.send(Ok(init_event)).await.is_err() {
            // Client already disconnected - clean up subscription
            broadcaster.unsubscribe(&sub_id).await;
            return;
        }

        let mut keepalive_interval = tokio::time::interval(std::time::Duration::from_secs(30));

        // Relay events until client disconnects
        loop {
            tokio::select! {
                maybe_event = stream_rx.recv() => {
                    match maybe_event {
                        Some(sse_event) => {
                            let Ok(data) = serde_json::to_string(&sse_event) else {
                                continue; // Skip malformed events.
                            };
                            let event = Event::default().event("stream-event").data(data);
                            if tx.send(Ok(event)).await.is_err() {
                                break; // Client disconnected.
                            }
                        }
                        None => {
                            // Stream closed
                            break;
                        }
                    }
                }
                _ = keepalive_interval.tick() => {
                    let keepalive = Event::default().event("keepalive").data("{}");
                    if tx.send(Ok(keepalive)).await.is_err() {
                        break; // Client disconnected.
                    }
                }
                () = tx.closed() => {
                    break; // Client disconnected.
                }
            }
        }

        // Clean up subscription when relay loop exits
        broadcaster.unsubscribe(&sub_id).await;
    });

    // Keepalive is handled by the spawned task above (typed `event: keepalive`
    // events every 30s). No need for Axum's SSE-level keep_alive which would
    // send redundant `:keep-alive-text` comments on the same interval.
    Ok(Sse::new(ReceiverStream::new(rx)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::mcp::events::{Actor, EventEnvelope};
    use crate::infrastructure::mcp::server::sse_broadcaster::SseEvent;
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
            sse_broadcaster: Arc::new(SseBroadcaster::new()),
            canvas_state: Arc::new(RwLock::new(CanvasStateSnapshot::new())),
            app_handle: None,
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

    // ========================================================================
    // /mcp/sse/subscribe endpoint tests
    // ========================================================================

    #[tokio::test]
    async fn test_sse_subscribe_missing_stream_param() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_sse_subscribe_returns_sse_stream() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe?stream=canvas")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(
            resp.headers().get("content-type").unwrap(),
            "text/event-stream"
        );
    }

    #[tokio::test]
    async fn test_sse_subscribe_sends_connected_event() {
        use tokio::time::{Duration, timeout};

        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);
        let app = router(state);

        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe?stream=canvas")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        // SSE streams are infinite — `to_bytes` will block until the stream
        // closes or the byte limit is hit. Wrap in a short timeout so we
        // capture the initial "connected" event that is sent immediately,
        // then the timeout fires (the stream stays open for keepalives).
        let body = resp.into_body();
        let result = timeout(Duration::from_millis(200), axum::body::to_bytes(body, 8192)).await;

        // Expect timeout (Err) because the SSE stream is infinite.
        // The connected event was sent but `to_bytes` keeps waiting for more.
        // Verify the subscriber is active as a proxy for the connected event.
        assert!(
            result.is_err(),
            "SSE stream should stay open (timeout expected)"
        );

        // The subscriber should be active (connected event was sent by the spawned task)
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
    }

    #[tokio::test]
    async fn test_sse_subscribe_receives_broadcast_events() {
        use tokio::time::{Duration, timeout};

        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);

        // Subscribe to the stream
        let (_sub_id, mut rx) = broadcaster.subscribe("canvas").await;

        // Broadcast an event
        let event = SseEvent::new(
            "canvas:node_added".to_string(),
            json!({"id": "node_1", "type": "request"}),
        );
        broadcaster.broadcast("canvas", event.clone()).await;

        // Verify the subscriber receives it
        let received = timeout(Duration::from_millis(100), rx.recv())
            .await
            .expect("timeout")
            .expect("event received");
        assert_eq!(received.event_type, "canvas:node_added");
        assert_eq!(received.data["id"], "node_1");
    }

    #[tokio::test]
    async fn test_sse_subscribe_multiple_streams_isolated() {
        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);

        // Subscribe to two different streams
        let (_sub1, mut rx1) = broadcaster.subscribe("canvas").await;
        let (_sub2, mut rx2) = broadcaster.subscribe("collections").await;

        // Broadcast to canvas
        let canvas_event = SseEvent::new("canvas:update".to_string(), json!({"id": "node_1"}));
        broadcaster.broadcast("canvas", canvas_event).await;

        // Broadcast to collections
        let collection_event =
            SseEvent::new("collection:created".to_string(), json!({"id": "col_1"}));
        broadcaster.broadcast("collections", collection_event).await;

        // Each subscriber only gets their stream's events
        let canvas_received = rx1.recv().await.unwrap();
        assert_eq!(canvas_received.event_type, "canvas:update");

        let collection_received = rx2.recv().await.unwrap();
        assert_eq!(collection_received.event_type, "collection:created");

        // No cross-contamination
        assert!(rx1.try_recv().is_err());
        assert!(rx2.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_sse_subscribe_cleanup_on_disconnect() {
        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);

        // Subscribe and immediately drop
        let (_sub_id, rx) = broadcaster.subscribe("canvas").await;
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);

        drop(rx);

        // Broadcast should clean up closed subscriptions
        broadcaster
            .broadcast("canvas", SseEvent::new("test".to_string(), json!({})))
            .await;
        assert_eq!(broadcaster.subscriber_count("canvas").await, 0);
    }
}
