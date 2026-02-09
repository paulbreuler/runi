// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Tauri event emitter for MCP server state changes.
//!
//! Wraps `AppHandle::emit()` to broadcast MCP events to the React UI,
//! enabling real-time updates when Claude Code modifies collections.
//!
//! Every event is wrapped in an [`EventEnvelope`] with actor attribution
//! and timestamp, so the frontend knows WHO initiated each action.

use crate::domain::mcp::events::{Actor, EventEmitter, EventEnvelope};
use tauri::{AppHandle, Emitter};

/// Event emitter backed by a Tauri `AppHandle`.
///
/// Uses `app.emit(event_name, envelope)` to broadcast to all windows,
/// wrapping each payload in an [`EventEnvelope`] with provenance metadata.
pub struct TauriEventEmitter {
    app: AppHandle,
}

impl TauriEventEmitter {
    /// Create a new emitter wrapping the given `AppHandle`.
    #[must_use]
    pub const fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl EventEmitter for TauriEventEmitter {
    fn emit_event(&self, event_name: &str, actor: &Actor, payload: serde_json::Value) {
        let envelope = EventEnvelope {
            actor: actor.clone(),
            timestamp: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            correlation_id: None,
            payload,
        };
        if let Err(e) = self.app.emit(event_name, &envelope) {
            tracing::warn!("Failed to emit event '{event_name}': {e}");
        }
    }
}
