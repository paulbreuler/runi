// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Tauri event emitter for MCP server state changes.
//!
//! Wraps `AppHandle::emit()` to broadcast MCP events to the React UI,
//! enabling real-time updates when Claude Code modifies collections.

use crate::domain::mcp::events::EventEmitter;
use tauri::{AppHandle, Emitter};

/// Event emitter backed by a Tauri `AppHandle`.
///
/// Uses `app.emit(event_name, payload)` to broadcast to all windows,
/// following the same pattern as `memory_monitor.rs`.
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
    fn emit_event(&self, event_name: &str, payload: serde_json::Value) {
        if let Err(e) = self.app.emit(event_name, payload) {
            tracing::warn!("Failed to emit event '{event_name}': {e}");
        }
    }
}
