// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Tauri command handlers for the MCP server.
//!
//! These commands are exposed to the frontend via `tauri::generate_handler!`.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::sync::RwLock;

use crate::application::mcp_server_service::McpServerService;
use crate::domain::canvas_state::CanvasStateSnapshot;
use crate::domain::mcp::events::EventEmitter;
use crate::infrastructure::commands::CanvasStateHandle;
use crate::infrastructure::mcp::events::TauriEventEmitter;
use crate::infrastructure::mcp::server::http_sse::{self, EventBroadcaster, McpServerState};
use crate::infrastructure::mcp::server::session::SessionManager;
use crate::infrastructure::mcp::server::sse_broadcaster::SseBroadcaster;

/// Managed state type for the MCP server.
pub type McpServerServiceState = Arc<RwLock<Option<McpServerHandle>>>;

/// Shared `SseBroadcaster` handle managed as Tauri state.
///
/// This is the same instance used by the MCP server and Tauri commands,
/// allowing commands like `sync_canvas_state` to broadcast SSE events
/// that MCP clients can subscribe to.
pub type SseBroadcasterHandle = Arc<SseBroadcaster>;

/// Handle to a running MCP server (Axum + session manager).
pub struct McpServerHandle {
    /// Port the server is listening on.
    pub port: u16,
    /// Shutdown signal sender.
    shutdown_tx: tokio::sync::oneshot::Sender<()>,
    /// Session manager reference.
    pub sessions: Arc<SessionManager>,
}

/// Create the initial MCP server state for Tauri managed state.
#[must_use]
pub fn create_mcp_server_state() -> McpServerServiceState {
    Arc::new(RwLock::new(None))
}

/// Status info returned by `mcp_server_status`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerStatusInfo {
    /// Whether the server is running.
    pub running: bool,
    /// Port the server is listening on (if running).
    pub port: Option<u16>,
    /// Number of active sessions.
    pub session_count: usize,
}

/// Default port for the MCP server.
/// Uses 3002 to avoid conflict with runi-planning-docs MCP (limps) on 3001.
pub const DEFAULT_MCP_PORT: u16 = 3002;

/// Start the MCP server on the given port, storing the handle in the provided state.
///
/// This is the core implementation used by both the Tauri command and auto-start.
/// When an `AppHandle` is provided, MCP events (collection/request changes)
/// are broadcast to the React UI via Tauri events.
///
/// The `sse_broadcaster` parameter is the shared `SseBroadcaster` instance
/// managed as Tauri state. Passing it in ensures the same broadcaster is used
/// by both the MCP server and Tauri commands (e.g., `sync_canvas_state`).
///
/// # Errors
///
/// Returns an error if the server is already running, the collections directory
/// cannot be determined, or the port is unavailable.
pub async fn start_server(
    port: u16,
    state: &McpServerServiceState,
    app_handle: Option<tauri::AppHandle>,
    sse_broadcaster: Arc<SseBroadcaster>,
) -> Result<(), String> {
    // Prepare everything outside the lock — no I/O while holding the lock.
    let broadcaster = Arc::new(EventBroadcaster::new());

    // Get canvas state handle from app if available
    let canvas_state = if let Some(ref handle) = app_handle {
        handle
            .try_state::<CanvasStateHandle>()
            .ok_or_else(|| "Canvas state not initialized".to_string())?
            .inner()
            .clone()
    } else {
        Arc::new(RwLock::new(CanvasStateSnapshot::new()))
    };

    let service = if let Some(ref handle) = app_handle {
        let emitter: Arc<dyn EventEmitter> = Arc::new(
            TauriEventEmitter::new(handle.clone()).with_broadcaster(Arc::clone(&broadcaster)),
        );
        let dir = crate::infrastructure::storage::collection_store::get_collections_dir()?;
        McpServerService::with_emitter(dir, emitter)
    } else {
        McpServerService::with_default_dir()?
    };
    let sessions = Arc::new(SessionManager::new());

    // Get project context handle from app if available
    let project_context = app_handle.as_ref().and_then(|handle| {
        let state = handle
            .try_state::<crate::infrastructure::commands::ProjectContextHandle>()
            .map(|s| s.inner().clone());
        if state.is_none() {
            tracing::warn!("ProjectContextService not registered; project-context MCP tools will be unavailable");
        }
        state
    });

    // Get suggestion service handle from app if available
    let suggestion_service = app_handle.as_ref().and_then(|handle| {
        let state = handle
            .try_state::<crate::infrastructure::commands::SuggestionServiceHandle>()
            .map(|s| s.inner().clone());
        if state.is_none() {
            tracing::warn!(
                "SuggestionService not registered; suggestion MCP tools will be unavailable"
            );
        }
        state
    });

    let mcp_state = McpServerState {
        service: Arc::new(RwLock::new(service)),
        sessions: Arc::clone(&sessions),
        broadcaster,
        sse_broadcaster,
        canvas_state,
        project_context,
        suggestion_service,
        drift_review_store: std::sync::Arc::new(tokio::sync::Mutex::new(
            std::collections::HashMap::new(),
        )),
        app_handle: app_handle.clone(),
    };

    let app = http_sse::router(mcp_state);

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .map_err(|e| format!("Failed to bind to port {port}: {e}"))?;

    // Store the actual bound port (handles port 0 → ephemeral port assignment).
    let actual_port = listener
        .local_addr()
        .map_err(|e| format!("Failed to get local address: {e}"))?
        .port();

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    // Atomic check-and-set: single write lock to avoid TOCTOU race.
    let mut guard = state.write().await;
    if guard.is_some() {
        return Err("MCP server is already running".to_string());
    }

    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = shutdown_rx.await;
            })
            .await
        {
            tracing::error!("MCP server exited with error: {e}");
        }
    });

    *guard = Some(McpServerHandle {
        port: actual_port,
        shutdown_tx,
        sessions,
    });
    drop(guard);

    tracing::info!("MCP server started on port {actual_port}");
    Ok(())
}

/// Start the MCP HTTP/SSE server on the given port.
#[tauri::command]
pub async fn mcp_server_start(
    port: u16,
    app_handle: tauri::AppHandle,
    server_state: tauri::State<'_, McpServerServiceState>,
    sse_broadcaster: tauri::State<'_, SseBroadcasterHandle>,
) -> Result<(), String> {
    start_server(
        port,
        &server_state,
        Some(app_handle),
        sse_broadcaster.inner().clone(),
    )
    .await
}

/// Stop the MCP HTTP/SSE server.
#[tauri::command]
pub async fn mcp_server_stop(
    server_state: tauri::State<'_, McpServerServiceState>,
) -> Result<(), String> {
    let handle = {
        let mut guard = server_state.write().await;
        guard
            .take()
            .ok_or_else(|| "MCP server is not running".to_string())?
    };

    let _ = handle.shutdown_tx.send(());
    tracing::info!("MCP server stopped");
    Ok(())
}

/// Get the status of the MCP server.
#[tauri::command]
pub async fn mcp_server_status(
    server_state: tauri::State<'_, McpServerServiceState>,
) -> Result<McpServerStatusInfo, String> {
    // Copy needed fields under the read lock, then drop before awaiting
    // session_count() to avoid holding the lock across an .await point.
    let (port, sessions) = {
        let guard = server_state.read().await;
        guard.as_ref().map_or((None, None), |handle| {
            (Some(handle.port), Some(Arc::clone(&handle.sessions)))
        })
    };

    if let Some(sessions) = sessions {
        Ok(McpServerStatusInfo {
            running: true,
            port,
            session_count: sessions.session_count().await,
        })
    } else {
        Ok(McpServerStatusInfo {
            running: false,
            port: None,
            session_count: 0,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_mcp_server_state_is_none() {
        let state = create_mcp_server_state();
        let guard = state.read().await;
        assert!(guard.is_none());
        drop(guard);
    }

    #[test]
    fn test_server_status_info_serialization() {
        let status = McpServerStatusInfo {
            running: true,
            port: Some(3001),
            session_count: 2,
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"running\":true"));
        assert!(json.contains("\"port\":3001"));
        assert!(json.contains("\"sessionCount\":2"));
    }

    #[test]
    fn test_server_status_info_not_running() {
        let status = McpServerStatusInfo {
            running: false,
            port: None,
            session_count: 0,
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"running\":false"));
        assert!(json.contains("\"port\":null"));
    }
}
