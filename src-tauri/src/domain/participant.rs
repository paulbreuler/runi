// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Participant identity and Lamport timestamps for multiplayer-like provenance.
//!
//! Uses a ReplicaId/ParticipantId pattern for multiplayer-like provenance. Every state mutation
//! carries a participant identity and a logical sequence number so the UI can
//! attribute changes to the correct actor and order them causally.
//!
//! # Participant types
//!
//! | Participant | ReplicaId | Color   | Meaning                 |
//! |-------------|-----------|---------|-------------------------|
//! | User        | 0         | —       | Human via runi UI       |
//! | System      | 1         | gray    | Automated (drift, etc.) |
//! | AI          | 2         | purple  | AI via MCP              |

use serde::{Deserialize, Serialize};

/// Identifies WHO made a change — the multiplayer "cursor".
///
/// `ParticipantId` variants:
/// - `User` (replica 0) — the human at the keyboard
/// - `System` (replica 1) — automated runi actions
/// - `Ai` (replica 2) — AI agents via MCP
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ParticipantId {
    /// Human user via runi UI.
    User,
    /// Automated system action (drift detection, httpbin import, etc.).
    System,
    /// AI agent via MCP tool call.
    Ai {
        /// MCP session ID for grouping related operations.
        #[serde(skip_serializing_if = "Option::is_none")]
        session_id: Option<String>,
        /// Model identifier, e.g. "anthropic/claude-sonnet-4-5-20250929".
        #[serde(skip_serializing_if = "Option::is_none")]
        model: Option<String>,
    },
}

impl ParticipantId {
    /// The replica ID for this participant.
    ///
    /// Used for deterministic ordering: User=0, System=1, AI=2.
    /// Reserved for version vector ordering in future multiplayer features.
    #[must_use]
    #[allow(dead_code)] // Used in tests; will be used by version vectors
    pub const fn replica_id(&self) -> u32 {
        match self {
            Self::User => 0,
            Self::System => 1,
            Self::Ai { .. } => 2,
        }
    }
}

/// Logical (Lamport) sequence number per participant.
///
/// Monotonically increasing within a participant's session.
/// Used to order events causally, not by wall-clock time.
pub type Seq = u64;

/// A Lamport timestamp: `(participant, sequence)`.
///
/// Provides causal ordering of events across participants.
/// Two events from the same participant are ordered by `seq`.
/// Events from different participants with the same `seq` are
/// ordered by `replica_id` (deterministic tiebreaker).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LamportTimestamp {
    /// Who produced this event.
    pub participant: ParticipantId,
    /// Monotonically increasing sequence number.
    pub seq: Seq,
}

/// Counter that produces monotonically increasing `Seq` values.
///
/// Each participant maintains one counter per session.
#[derive(Debug)]
pub struct SeqCounter {
    next: Seq,
}

impl SeqCounter {
    /// Create a new counter starting at 1.
    #[must_use]
    pub const fn new() -> Self {
        Self { next: 1 }
    }

    /// Get the next sequence number and advance the counter.
    pub const fn next(&mut self) -> Seq {
        let seq = self.next;
        self.next += 1;
        seq
    }

    /// Peek at the current value without advancing.
    /// Reserved for debugging and test assertions.
    #[must_use]
    #[allow(dead_code)] // Used in tests; will be used by operation log
    pub const fn current(&self) -> Seq {
        self.next
    }
}

impl Default for SeqCounter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_participant_user_serializes() {
        let p = ParticipantId::User;
        let json = serde_json::to_value(&p).unwrap();
        assert_eq!(json["type"], "user");
    }

    #[test]
    fn test_participant_ai_serializes_with_fields() {
        let p = ParticipantId::Ai {
            session_id: Some("sess_123".to_string()),
            model: Some("claude".to_string()),
        };
        let json = serde_json::to_value(&p).unwrap();
        assert_eq!(json["type"], "ai");
        assert_eq!(json["session_id"], "sess_123");
        assert_eq!(json["model"], "claude");
    }

    #[test]
    fn test_participant_ai_serializes_without_optional_fields() {
        let p = ParticipantId::Ai {
            session_id: None,
            model: None,
        };
        let json = serde_json::to_value(&p).unwrap();
        assert_eq!(json["type"], "ai");
        assert!(json.get("session_id").is_none());
        assert!(json.get("model").is_none());
    }

    #[test]
    fn test_participant_system_serializes() {
        let p = ParticipantId::System;
        let json = serde_json::to_value(&p).unwrap();
        assert_eq!(json["type"], "system");
    }

    #[test]
    fn test_replica_ids() {
        assert_eq!(ParticipantId::User.replica_id(), 0);
        assert_eq!(ParticipantId::System.replica_id(), 1);
        assert_eq!(
            ParticipantId::Ai {
                session_id: None,
                model: None
            }
            .replica_id(),
            2
        );
    }

    #[test]
    fn test_participant_roundtrip() {
        let participants = vec![
            ParticipantId::User,
            ParticipantId::System,
            ParticipantId::Ai {
                session_id: Some("test".to_string()),
                model: None,
            },
        ];
        for p in participants {
            let json = serde_json::to_string(&p).unwrap();
            let deserialized: ParticipantId = serde_json::from_str(&json).unwrap();
            assert_eq!(p, deserialized);
        }
    }

    #[test]
    fn test_lamport_timestamp_serializes() {
        let ts = LamportTimestamp {
            participant: ParticipantId::Ai {
                session_id: Some("sess_1".to_string()),
                model: None,
            },
            seq: 42,
        };
        let json = serde_json::to_value(&ts).unwrap();
        assert_eq!(json["participant"]["type"], "ai");
        assert_eq!(json["seq"], 42);
    }

    #[test]
    fn test_lamport_timestamp_roundtrip() {
        let ts = LamportTimestamp {
            participant: ParticipantId::User,
            seq: 7,
        };
        let json = serde_json::to_string(&ts).unwrap();
        let deserialized: LamportTimestamp = serde_json::from_str(&json).unwrap();
        assert_eq!(ts, deserialized);
    }

    #[test]
    fn test_seq_counter_monotonic() {
        let mut counter = SeqCounter::new();
        assert_eq!(counter.current(), 1);
        assert_eq!(counter.next(), 1);
        assert_eq!(counter.next(), 2);
        assert_eq!(counter.next(), 3);
        assert_eq!(counter.current(), 4);
    }

    #[test]
    fn test_seq_counter_default() {
        let counter = SeqCounter::default();
        assert_eq!(counter.current(), 1);
    }

    #[test]
    fn test_participant_hash_equality() {
        use std::collections::HashSet;
        let mut set = HashSet::new();
        set.insert(ParticipantId::User);
        set.insert(ParticipantId::System);
        set.insert(ParticipantId::Ai {
            session_id: None,
            model: None,
        });
        assert_eq!(set.len(), 3);
    }

    #[test]
    fn test_participant_from_json() {
        let json = json!({"type": "ai", "session_id": "s1", "model": "claude-3"});
        let p: ParticipantId = serde_json::from_value(json).unwrap();
        assert_eq!(
            p,
            ParticipantId::Ai {
                session_id: Some("s1".to_string()),
                model: Some("claude-3".to_string()),
            }
        );
    }
}
