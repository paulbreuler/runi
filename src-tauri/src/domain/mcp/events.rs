// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Event emitter trait for decoupled Tauri event emission.
//!
//! Allows `McpServerService` to emit events without depending on Tauri directly,
//! keeping the application layer testable.
//!
//! Every event carries an [`Actor`] indicating WHO initiated the action,
//! and is wrapped in an [`EventEnvelope`] with provenance metadata.
//! Uses a ReplicaId pattern for distinguishing human vs AI edits.

use serde::{Deserialize, Serialize};

use crate::domain::participant::{LamportTimestamp, ParticipantId};

/// Who initiated this action.
///
/// Every state mutation carries an actor so the UI can distinguish
/// human, AI, and system actions. Maps to runi's signal system:
/// - `User` → no special signal
/// - `Ai` → purple signal (#a855f7, suspect until verified)
/// - `System` → neutral/gray
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Actor {
    /// Human user via runi UI.
    User,
    /// AI agent via MCP tool call.
    Ai {
        /// Model identifier, e.g. "anthropic/claude-sonnet-4-5-20250929".
        #[serde(skip_serializing_if = "Option::is_none")]
        model: Option<String>,
        /// MCP session ID for grouping related operations.
        #[serde(skip_serializing_if = "Option::is_none")]
        session_id: Option<String>,
    },
    /// Automated system action (drift detection, httpbin import, etc.).
    System,
}

impl Actor {
    /// Convert this actor to a [`ParticipantId`] for the participant system.
    #[must_use]
    pub fn to_participant_id(&self) -> ParticipantId {
        match self {
            Self::User => ParticipantId::User,
            Self::Ai { model, session_id } => ParticipantId::Ai {
                session_id: session_id.clone(),
                model: model.clone(),
            },
            Self::System => ParticipantId::System,
        }
    }
}

/// Wraps every event with provenance metadata.
///
/// The frontend receives this envelope for every Tauri event,
/// enabling actor attribution in the UI.
///
/// The optional `lamport` field carries a Lamport timestamp for causal
/// ordering of events across participants. When present, the UI can
/// display sequence numbers and detect concurrent edits.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EventEnvelope {
    /// Who initiated this action.
    pub actor: Actor,
    /// ISO 8601 timestamp of when the event was emitted.
    pub timestamp: String,
    /// Groups related events (e.g., "create collection + add 5 requests").
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    /// Lamport timestamp for causal ordering.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lamport: Option<LamportTimestamp>,
    /// The domain-specific event data.
    pub payload: serde_json::Value,
}

/// Trait for emitting events from the MCP server service.
///
/// Production implementations wrap `tauri::AppHandle::emit()`.
/// Test implementations capture events for assertions.
pub trait EventEmitter: Send + Sync {
    /// Emit a named event with actor attribution and a JSON payload.
    fn emit_event(&self, event_name: &str, actor: &Actor, payload: serde_json::Value);

    /// Emit a named event with actor attribution, Lamport timestamp, and JSON payload.
    ///
    /// Default implementation delegates to `emit_event`, ignoring the timestamp.
    /// Override this to include Lamport timestamps in emitted events.
    fn emit_event_with_seq(
        &self,
        event_name: &str,
        actor: &Actor,
        lamport: LamportTimestamp,
        payload: serde_json::Value,
    ) {
        // Default: drop lamport, delegate to legacy method.
        // Overridden by TauriEventEmitter to include it.
        let _ = lamport;
        self.emit_event(event_name, actor, payload);
    }
}

/// Test event emitter that captures emitted events for assertions.
#[cfg(test)]
pub struct TestEventEmitter {
    /// Captured events as `(event_name, actor, payload)` tuples.
    pub events: std::sync::Arc<std::sync::Mutex<Vec<(String, Actor, serde_json::Value)>>>,
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
    ) -> std::sync::Arc<std::sync::Mutex<Vec<(String, Actor, serde_json::Value)>>> {
        std::sync::Arc::clone(&self.events)
    }
}

#[cfg(test)]
impl EventEmitter for TestEventEmitter {
    fn emit_event(&self, event_name: &str, actor: &Actor, payload: serde_json::Value) {
        self.events.lock().expect("lock test events").push((
            event_name.to_string(),
            actor.clone(),
            payload,
        ));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_actor_user_serializes() {
        let actor = Actor::User;
        let json = serde_json::to_value(&actor).unwrap();
        assert_eq!(json["type"], "user");
    }

    #[test]
    fn test_actor_ai_serializes_with_model() {
        let actor = Actor::Ai {
            model: Some("anthropic/claude-sonnet-4-5-20250929".to_string()),
            session_id: Some("session_123".to_string()),
        };
        let json = serde_json::to_value(&actor).unwrap();
        assert_eq!(json["type"], "ai");
        assert_eq!(json["model"], "anthropic/claude-sonnet-4-5-20250929");
        assert_eq!(json["session_id"], "session_123");
    }

    #[test]
    fn test_actor_ai_serializes_without_optional_fields() {
        let actor = Actor::Ai {
            model: None,
            session_id: None,
        };
        let json = serde_json::to_value(&actor).unwrap();
        assert_eq!(json["type"], "ai");
        assert!(json.get("model").is_none());
        assert!(json.get("session_id").is_none());
    }

    #[test]
    fn test_actor_system_serializes() {
        let actor = Actor::System;
        let json = serde_json::to_value(&actor).unwrap();
        assert_eq!(json["type"], "system");
    }

    #[test]
    fn test_actor_roundtrip() {
        let actors = vec![
            Actor::User,
            Actor::Ai {
                model: Some("test-model".to_string()),
                session_id: None,
            },
            Actor::System,
        ];
        for actor in actors {
            let json = serde_json::to_string(&actor).unwrap();
            let deserialized: Actor = serde_json::from_str(&json).unwrap();
            assert_eq!(actor, deserialized);
        }
    }

    #[test]
    fn test_event_envelope_construction() {
        let envelope = EventEnvelope {
            actor: Actor::Ai {
                model: Some("claude".to_string()),
                session_id: None,
            },
            timestamp: "2026-02-08T12:00:00Z".to_string(),
            correlation_id: Some("corr_123".to_string()),
            lamport: None,
            payload: json!({"id": "col_1", "name": "Test"}),
        };
        let json = serde_json::to_value(&envelope).unwrap();
        assert_eq!(json["actor"]["type"], "ai");
        assert_eq!(json["timestamp"], "2026-02-08T12:00:00Z");
        assert_eq!(json["correlation_id"], "corr_123");
        assert_eq!(json["payload"]["name"], "Test");
    }

    #[test]
    fn test_event_envelope_without_correlation_id() {
        let envelope = EventEnvelope {
            actor: Actor::User,
            timestamp: "2026-02-08T12:00:00Z".to_string(),
            correlation_id: None,
            lamport: None,
            payload: json!({"id": "col_1"}),
        };
        let json = serde_json::to_value(&envelope).unwrap();
        assert!(json.get("correlation_id").is_none());
    }

    #[test]
    fn test_event_envelope_roundtrip() {
        let envelope = EventEnvelope {
            actor: Actor::System,
            timestamp: "2026-02-08T12:00:00Z".to_string(),
            correlation_id: None,
            lamport: None,
            payload: json!({"key": "value"}),
        };
        let json = serde_json::to_string(&envelope).unwrap();
        let deserialized: EventEnvelope = serde_json::from_str(&json).unwrap();
        assert_eq!(envelope, deserialized);
    }

    #[test]
    fn test_event_envelope_with_lamport() {
        use crate::domain::participant::{LamportTimestamp, ParticipantId};
        let envelope = EventEnvelope {
            actor: Actor::Ai {
                model: None,
                session_id: Some("s1".to_string()),
            },
            timestamp: "2026-02-09T10:00:00Z".to_string(),
            correlation_id: None,
            lamport: Some(LamportTimestamp {
                participant: ParticipantId::Ai {
                    session_id: Some("s1".to_string()),
                    model: None,
                },
                seq: 42,
            }),
            payload: json!({"id": "col_1"}),
        };
        let json = serde_json::to_value(&envelope).unwrap();
        assert_eq!(json["lamport"]["seq"], 42);
        assert_eq!(json["lamport"]["participant"]["type"], "ai");
    }

    #[test]
    fn test_event_envelope_without_lamport_omits_field() {
        let envelope = EventEnvelope {
            actor: Actor::User,
            timestamp: "2026-02-09T10:00:00Z".to_string(),
            correlation_id: None,
            lamport: None,
            payload: json!({"id": "col_1"}),
        };
        let json = serde_json::to_value(&envelope).unwrap();
        assert!(json.get("lamport").is_none());
    }

    #[test]
    fn test_actor_to_participant_id() {
        use crate::domain::participant::ParticipantId;

        assert_eq!(Actor::User.to_participant_id(), ParticipantId::User);
        assert_eq!(Actor::System.to_participant_id(), ParticipantId::System);
        assert_eq!(
            Actor::Ai {
                model: Some("claude".to_string()),
                session_id: Some("s1".to_string()),
            }
            .to_participant_id(),
            ParticipantId::Ai {
                session_id: Some("s1".to_string()),
                model: Some("claude".to_string()),
            }
        );
    }

    #[test]
    fn test_emitter_captures_events_with_actor() {
        let emitter = TestEventEmitter::new();
        let events = emitter.events_handle();

        emitter.emit_event(
            "collection:created",
            &Actor::Ai {
                model: Some("claude".to_string()),
                session_id: None,
            },
            json!({"id": "col_1", "name": "Test"}),
        );
        emitter.emit_event(
            "request:added",
            &Actor::User,
            json!({"collection_id": "col_1"}),
        );

        let captured = events.lock().expect("lock events");
        assert_eq!(captured.len(), 2);
        assert_eq!(captured[0].0, "collection:created");
        assert_eq!(
            captured[0].1,
            Actor::Ai {
                model: Some("claude".to_string()),
                session_id: None,
            }
        );
        assert_eq!(captured[0].2["name"], "Test");
        assert_eq!(captured[1].0, "request:added");
        assert_eq!(captured[1].1, Actor::User);
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
