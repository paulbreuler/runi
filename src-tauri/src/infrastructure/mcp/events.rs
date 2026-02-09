// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Tauri event emitter for MCP server state changes.
//!
//! Wraps `AppHandle::emit()` to broadcast MCP events to the React UI,
//! enabling real-time updates when Claude Code modifies collections.
//!
//! Every event is wrapped in an [`EventEnvelope`] with actor attribution
//! and timestamp, so the frontend knows WHO initiated each action.

use std::sync::Arc;

use crate::domain::mcp::events::{Actor, EventEmitter, EventEnvelope};
use crate::domain::participant::LamportTimestamp;
use crate::infrastructure::mcp::server::http_sse::EventBroadcaster;
use tauri::{AppHandle, Emitter};

/// Event emitter backed by a Tauri `AppHandle`.
///
/// Uses `app.emit(event_name, envelope)` to broadcast to all windows,
/// wrapping each payload in an [`EventEnvelope`] with provenance metadata.
///
/// When an [`EventBroadcaster`] is attached, events are also pushed to
/// all connected SSE clients for real-time MCP client notifications.
pub struct TauriEventEmitter {
    app: AppHandle,
    /// Optional SSE broadcaster for pushing events to HTTP SSE clients.
    broadcaster: Option<Arc<EventBroadcaster>>,
}

impl TauriEventEmitter {
    /// Create a new emitter wrapping the given `AppHandle`.
    #[must_use]
    pub const fn new(app: AppHandle) -> Self {
        Self {
            app,
            broadcaster: None,
        }
    }

    /// Attach an SSE broadcaster so events are pushed to connected clients.
    #[must_use]
    pub fn with_broadcaster(mut self, broadcaster: Arc<EventBroadcaster>) -> Self {
        self.broadcaster = Some(broadcaster);
        self
    }

    /// Build and emit an `EventEnvelope`.
    fn emit_envelope(
        &self,
        event_name: &str,
        actor: &Actor,
        lamport: Option<LamportTimestamp>,
        payload: serde_json::Value,
    ) {
        let envelope = EventEnvelope {
            actor: actor.clone(),
            timestamp: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            correlation_id: None,
            lamport,
            payload,
        };

        // Emit to Tauri windows (frontend).
        if let Err(e) = self.app.emit(event_name, &envelope) {
            tracing::warn!("Failed to emit event '{event_name}': {e}");
        }

        // Also push to SSE clients if broadcaster is attached.
        if let Some(ref broadcaster) = self.broadcaster {
            broadcaster.send(envelope);
        }
    }
}

impl EventEmitter for TauriEventEmitter {
    fn emit_event(&self, event_name: &str, actor: &Actor, payload: serde_json::Value) {
        self.emit_envelope(event_name, actor, None, payload);
    }

    fn emit_event_with_seq(
        &self,
        event_name: &str,
        actor: &Actor,
        lamport: LamportTimestamp,
        payload: serde_json::Value,
    ) {
        self.emit_envelope(event_name, actor, Some(lamport), payload);
    }
}
