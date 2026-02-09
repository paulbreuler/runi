// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Event emitter trait for decoupled Tauri event emission.
//!
//! Allows `McpServerService` to emit events without depending on Tauri directly,
//! keeping the application layer testable.

/// Trait for emitting events from the MCP server service.
///
/// Production implementations wrap `tauri::AppHandle::emit()`.
/// Test implementations capture events for assertions.
pub trait EventEmitter: Send + Sync {
    /// Emit a named event with a JSON payload.
    fn emit_event(&self, event_name: &str, payload: serde_json::Value);
}

/// Test event emitter that captures emitted events for assertions.
#[cfg(test)]
pub struct TestEventEmitter {
    /// Captured events as `(event_name, payload)` pairs.
    pub events: std::sync::Arc<std::sync::Mutex<Vec<(String, serde_json::Value)>>>,
}

#[cfg(test)]
impl TestEventEmitter {
    /// Create a new test event emitter.
    #[must_use]
    pub fn new() -> Self {
        use std::sync::{Arc, Mutex};
        Self {
            events: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Get a clone of the events storage for assertions.
    #[must_use]
    pub fn events_handle(
        &self,
    ) -> std::sync::Arc<std::sync::Mutex<Vec<(String, serde_json::Value)>>> {
        std::sync::Arc::clone(&self.events)
    }
}

#[cfg(test)]
impl EventEmitter for TestEventEmitter {
    fn emit_event(&self, event_name: &str, payload: serde_json::Value) {
        self.events
            .lock()
            .expect("lock test events")
            .push((event_name.to_string(), payload));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_emitter_captures_events() {
        let emitter = TestEventEmitter::new();
        let events = emitter.events_handle();

        emitter.emit_event(
            "mcp:collection-created",
            json!({"id": "col_1", "name": "Test"}),
        );
        emitter.emit_event("mcp:request-added", json!({"collection_id": "col_1"}));

        let captured = events.lock().expect("lock events");
        assert_eq!(captured.len(), 2);
        assert_eq!(captured[0].0, "mcp:collection-created");
        assert_eq!(captured[0].1["name"], "Test");
        assert_eq!(captured[1].0, "mcp:request-added");
        drop(captured);
    }

    #[test]
    fn test_emitter_starts_empty() {
        let emitter = TestEventEmitter::new();
        let events = emitter.events_handle();
        let captured = events.lock().expect("lock events");
        assert!(captured.is_empty());
        drop(captured);
    }
}
