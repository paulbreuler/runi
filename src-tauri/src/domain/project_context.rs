// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Project context domain model.
//!
//! Persists the user's current working state — active collection, focused request,
//! investigation notes, and recent activity — so that MCP tools and AI agents
//! can understand what the user is working on across sessions.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Maximum number of recent request IDs to retain.
const MAX_RECENT_REQUESTS: usize = 10;

/// Persistent project context representing the user's current working state.
///
/// This is the single source of truth for "what is the user working on?"
/// and is readable/writable by both the UI and MCP tools.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ProjectContext {
    /// The collection the user is currently working in.
    pub active_collection_id: Option<String>,
    /// The request the user is currently focused on.
    pub active_request_id: Option<String>,
    /// Free-text notes from the user or AI about the current investigation.
    pub investigation_notes: Option<String>,
    /// The last N executed request IDs (most recent first, max 10).
    pub recent_request_ids: Vec<String>,
    /// User or AI labels for the current session.
    pub tags: Vec<String>,
}

impl ProjectContext {
    /// Create a new empty project context.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            active_collection_id: None,
            active_request_id: None,
            investigation_notes: None,
            recent_request_ids: Vec::new(),
            tags: Vec::new(),
        }
    }

    /// Add a request ID to the recent list, keeping at most 10 entries.
    ///
    /// If the ID already exists, it is moved to the front. The oldest entry
    /// is dropped when the list exceeds the maximum.
    pub fn push_recent_request(&mut self, request_id: String) {
        // Remove duplicate if present
        self.recent_request_ids.retain(|id| id != &request_id);
        // Insert at front
        self.recent_request_ids.insert(0, request_id);
        // Trim to max
        self.recent_request_ids.truncate(MAX_RECENT_REQUESTS);
    }
}

impl Default for ProjectContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Partial update payload for project context.
///
/// Only fields that are `Some` will be applied. This allows MCP clients
/// and the frontend to update individual fields without replacing the whole context.
#[allow(clippy::option_option)]
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ProjectContextUpdate {
    /// Update the active collection ID.
    pub active_collection_id: Option<Option<String>>,
    /// Update the active request ID.
    pub active_request_id: Option<Option<String>>,
    /// Update the investigation notes.
    pub investigation_notes: Option<Option<String>>,
    /// Append a request ID to the recent list.
    pub push_recent_request_id: Option<String>,
    /// Replace the tags list.
    pub tags: Option<Vec<String>>,
}

impl ProjectContextUpdate {
    /// Apply this partial update to a project context.
    pub fn apply_to(&self, ctx: &mut ProjectContext) {
        if let Some(ref id) = self.active_collection_id {
            ctx.active_collection_id.clone_from(id);
        }
        if let Some(ref id) = self.active_request_id {
            ctx.active_request_id.clone_from(id);
        }
        if let Some(ref notes) = self.investigation_notes {
            ctx.investigation_notes.clone_from(notes);
        }
        if let Some(ref request_id) = self.push_recent_request_id {
            ctx.push_recent_request(request_id.clone());
        }
        if let Some(ref tags) = self.tags {
            ctx.tags.clone_from(tags);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_context_is_empty() {
        let ctx = ProjectContext::new();
        assert!(ctx.active_collection_id.is_none());
        assert!(ctx.active_request_id.is_none());
        assert!(ctx.investigation_notes.is_none());
        assert!(ctx.recent_request_ids.is_empty());
        assert!(ctx.tags.is_empty());
    }

    #[test]
    fn test_default_equals_new() {
        assert_eq!(ProjectContext::default(), ProjectContext::new());
    }

    #[test]
    fn test_push_recent_request_adds_to_front() {
        let mut ctx = ProjectContext::new();
        ctx.push_recent_request("req-1".to_string());
        ctx.push_recent_request("req-2".to_string());
        assert_eq!(ctx.recent_request_ids, vec!["req-2", "req-1"]);
    }

    #[test]
    fn test_push_recent_request_deduplicates() {
        let mut ctx = ProjectContext::new();
        ctx.push_recent_request("req-1".to_string());
        ctx.push_recent_request("req-2".to_string());
        ctx.push_recent_request("req-1".to_string());
        assert_eq!(ctx.recent_request_ids, vec!["req-1", "req-2"]);
    }

    #[test]
    fn test_push_recent_request_truncates_at_10() {
        let mut ctx = ProjectContext::new();
        for i in 0..15 {
            ctx.push_recent_request(format!("req-{i}"));
        }
        assert_eq!(ctx.recent_request_ids.len(), MAX_RECENT_REQUESTS);
        assert_eq!(ctx.recent_request_ids[0], "req-14");
    }

    #[test]
    fn test_partial_update_applies_active_collection() {
        let mut ctx = ProjectContext::new();
        let update = ProjectContextUpdate {
            active_collection_id: Some(Some("col-1".to_string())),
            ..Default::default()
        };
        update.apply_to(&mut ctx);
        assert_eq!(ctx.active_collection_id, Some("col-1".to_string()));
    }

    #[test]
    fn test_partial_update_clears_field() {
        let mut ctx = ProjectContext::new();
        ctx.active_collection_id = Some("col-1".to_string());
        let update = ProjectContextUpdate {
            active_collection_id: Some(None),
            ..Default::default()
        };
        update.apply_to(&mut ctx);
        assert!(ctx.active_collection_id.is_none());
    }

    #[test]
    fn test_partial_update_skips_none_fields() {
        let mut ctx = ProjectContext::new();
        ctx.active_collection_id = Some("col-1".to_string());
        ctx.tags = vec!["tag-a".to_string()];

        let update = ProjectContextUpdate {
            investigation_notes: Some(Some("investigating auth flow".to_string())),
            ..Default::default()
        };
        update.apply_to(&mut ctx);

        // Unchanged fields
        assert_eq!(ctx.active_collection_id, Some("col-1".to_string()));
        assert_eq!(ctx.tags, vec!["tag-a"]);
        // Updated field
        assert_eq!(
            ctx.investigation_notes,
            Some("investigating auth flow".to_string())
        );
    }

    #[test]
    fn test_partial_update_pushes_recent_request() {
        let mut ctx = ProjectContext::new();
        ctx.push_recent_request("req-old".to_string());

        let update = ProjectContextUpdate {
            push_recent_request_id: Some("req-new".to_string()),
            ..Default::default()
        };
        update.apply_to(&mut ctx);

        assert_eq!(ctx.recent_request_ids, vec!["req-new", "req-old"]);
    }

    #[test]
    fn test_serialization_camel_case() {
        let ctx = ProjectContext {
            active_collection_id: Some("col-1".to_string()),
            active_request_id: None,
            investigation_notes: None,
            recent_request_ids: vec!["req-1".to_string()],
            tags: vec!["auth".to_string()],
        };
        let json = serde_json::to_string(&ctx).unwrap();
        assert!(json.contains("\"activeCollectionId\""));
        assert!(json.contains("\"recentRequestIds\""));
        assert!(json.contains("\"tags\""));
    }

    #[test]
    fn test_deserialization_from_camel_case() {
        let json = r#"{
            "activeCollectionId": "col-1",
            "activeRequestId": null,
            "investigationNotes": "testing",
            "recentRequestIds": ["req-1"],
            "tags": ["auth"]
        }"#;
        let ctx: ProjectContext = serde_json::from_str(json).unwrap();
        assert_eq!(ctx.active_collection_id, Some("col-1".to_string()));
        assert_eq!(ctx.investigation_notes, Some("testing".to_string()));
        assert_eq!(ctx.recent_request_ids, vec!["req-1"]);
        assert_eq!(ctx.tags, vec!["auth"]);
    }
}
