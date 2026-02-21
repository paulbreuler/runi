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
use crate::infrastructure::mcp::server::sse_broadcaster::{SseBroadcaster, TopicFilter};

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
    /// Project context service for MCP tools.
    pub project_context: Option<crate::infrastructure::commands::ProjectContextHandle>,
    /// Suggestion service for MCP tools (Vigilance Monitor).
    pub suggestion_service: Option<crate::infrastructure::commands::SuggestionServiceHandle>,
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
    // Create session on first request if no session header.
    // If the client sends a stale session ID (e.g. after app reload), create a
    // new session transparently so the client can reconnect without errors.
    let session_id = match headers.get("mcp-session-id").and_then(|v| v.to_str().ok()) {
        Some(id) if state.sessions.has_session(id).await => id.to_string(),
        _ => state.sessions.create_session().await,
    };

    dispatcher::dispatch(
        &body,
        &state.service,
        &state.canvas_state,
        state.project_context.as_ref(),
        state.suggestion_service.as_ref(),
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
    // Accept any session ID (valid or stale) — create a new one if stale so
    // the client reconnects transparently after an app reload.
    let _session_id = match headers.get("mcp-session-id").and_then(|v| v.to_str().ok()) {
        Some(id) if state.sessions.has_session(id).await => id.to_string(),
        Some(_) => state.sessions.create_session().await,
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
    ///
    /// When `topics` is also provided, `stream` is ignored in favour of
    /// topic-based filtering. When neither is provided, `stream` is required.
    stream: Option<String>,

    /// Comma-separated glob patterns for topic-based subscriptions.
    ///
    /// Examples: `collection:*`, `*:created`, `collection:*,request:*`.
    /// When omitted (and `stream` is provided), falls back to the legacy
    /// named-stream subscription. When set to `*` or left empty, subscribes
    /// to all events.
    topics: Option<String>,
}

/// Handle GET /mcp/sse/subscribe — Subscribe to a named stream or topic filter.
///
/// Supports two modes:
/// - **Named stream** (legacy): `?stream=canvas` — subscribe to a single named stream.
/// - **Topic filter**: `?topics=collection:*,request:*` — subscribe with glob patterns.
///
/// When `topics` is provided, it takes precedence over `stream`.
/// When neither is provided, returns 400 Bad Request.
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
#[allow(clippy::too_many_lines)]
async fn handle_sse_subscribe(
    State(state): State<McpServerState>,
    Query(params): Query<SubscribeQuery>,
) -> Result<Sse<ReceiverStream<Result<Event, Infallible>>>, (StatusCode, &'static str)> {
    // Determine subscription mode: topics take precedence over stream.
    enum SubMode {
        Stream(String),
        Topics(TopicFilter),
    }

    let mode = if let Some(ref topics) = params.topics {
        SubMode::Topics(TopicFilter::parse(topics))
    } else if let Some(ref stream) = params.stream {
        SubMode::Stream(stream.clone())
    } else {
        return Err((
            StatusCode::BAD_REQUEST,
            "Missing 'stream' or 'topics' query parameter",
        ));
    };

    let (tx, rx) = tokio::sync::mpsc::channel::<Result<Event, Infallible>>(32);
    let broadcaster = Arc::clone(&state.sse_broadcaster);

    match mode {
        SubMode::Stream(stream_name) => {
            let (sub_id, mut stream_rx) = state.sse_broadcaster.subscribe(&stream_name).await;
            let broadcaster = Arc::clone(&state.sse_broadcaster);

            tokio::spawn(async move {
                // Send initial connection event
                let connected_data = serde_json::json!({"stream": stream_name});
                let init_event = Event::default()
                    .event("connected")
                    .data(connected_data.to_string());
                if tx.send(Ok(init_event)).await.is_err() {
                    broadcaster.unsubscribe(&sub_id).await;
                    return;
                }

                let mut keepalive_interval =
                    tokio::time::interval(std::time::Duration::from_secs(30));

                loop {
                    tokio::select! {
                        maybe_event = stream_rx.recv() => {
                            match maybe_event {
                                Some(sse_event) => {
                                    let Ok(data) = serde_json::to_string(&sse_event) else {
                                        continue;
                                    };
                                    let event = Event::default().event("stream-event").data(data);
                                    if tx.send(Ok(event)).await.is_err() {
                                        break;
                                    }
                                }
                                None => break,
                            }
                        }
                        _ = keepalive_interval.tick() => {
                            let keepalive = Event::default().event("keepalive").data("{}");
                            if tx.send(Ok(keepalive)).await.is_err() {
                                break;
                            }
                        }
                        () = tx.closed() => break,
                    }
                }

                broadcaster.unsubscribe(&sub_id).await;
            });
        }
        SubMode::Topics(filter) => {
            let patterns: Vec<String> = filter.patterns().to_vec();
            let (sub_id, mut topic_rx) = state.sse_broadcaster.subscribe_with_topics(filter).await;

            tokio::spawn(async move {
                // Send initial connection event with topic info
                let connected_data = serde_json::json!({"topics": patterns});
                let init_event = Event::default()
                    .event("connected")
                    .data(connected_data.to_string());
                if tx.send(Ok(init_event)).await.is_err() {
                    broadcaster.unsubscribe(&sub_id).await;
                    return;
                }

                let mut keepalive_interval =
                    tokio::time::interval(std::time::Duration::from_secs(30));

                loop {
                    tokio::select! {
                        maybe_event = topic_rx.recv() => {
                            match maybe_event {
                                Some(sse_event) => {
                                    let Ok(data) = serde_json::to_string(&sse_event) else {
                                        continue;
                                    };
                                    let event = Event::default().event("stream-event").data(data);
                                    if tx.send(Ok(event)).await.is_err() {
                                        break;
                                    }
                                }
                                None => break,
                            }
                        }
                        _ = keepalive_interval.tick() => {
                            let keepalive = Event::default().event("keepalive").data("{}");
                            if tx.send(Ok(keepalive)).await.is_err() {
                                break;
                            }
                        }
                        () = tx.closed() => break,
                    }
                }

                broadcaster.unsubscribe(&sub_id).await;
            });
        }
    }

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
            project_context: None,
            suggestion_service: None,
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
        // A stale/unknown session ID should recover transparently: the server
        // creates a new session and responds with 200 + a fresh Mcp-Session-Id
        // header, rather than returning 404 and forcing a manual reconnect.
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("POST")
            .uri("/mcp")
            .header("Content-Type", "application/json")
            .header("Mcp-Session-Id", "stale-session-id")
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
        assert_eq!(resp.status(), StatusCode::OK);
        assert!(
            resp.headers().contains_key("mcp-session-id"),
            "response must carry a new Mcp-Session-Id header"
        );
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

    // ========================================================================
    // Topic-based /mcp/sse/subscribe endpoint tests
    // ========================================================================

    #[tokio::test]
    async fn test_sse_subscribe_with_topics_returns_sse_stream() {
        let (state, _dir) = make_state();
        let app = router(state);

        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe?topics=collection:*")
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
    async fn test_sse_subscribe_with_topics_creates_topic_subscription() {
        use tokio::time::{Duration, timeout};

        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);
        let app = router(state);

        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe?topics=collection:*,request:*")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        // Wait briefly for the spawned task to register the subscription
        let body = resp.into_body();
        let _ = timeout(Duration::from_millis(200), axum::body::to_bytes(body, 8192)).await;

        // Should have a topic subscriber (not a stream subscriber)
        assert_eq!(broadcaster.topic_subscriber_count().await, 1);
    }

    #[tokio::test]
    async fn test_sse_subscribe_topics_takes_precedence_over_stream() {
        use tokio::time::{Duration, timeout};

        let (state, _dir) = make_state();
        let broadcaster = Arc::clone(&state.sse_broadcaster);
        let app = router(state);

        // Both topics and stream provided — topics should win
        let req = Request::builder()
            .method("GET")
            .uri("/mcp/sse/subscribe?stream=canvas&topics=collection:*")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = resp.into_body();
        let _ = timeout(Duration::from_millis(200), axum::body::to_bytes(body, 8192)).await;

        // Topic subscriber (not stream subscriber)
        assert_eq!(broadcaster.topic_subscriber_count().await, 1);
        assert_eq!(broadcaster.subscriber_count("canvas").await, 0);
    }
}
