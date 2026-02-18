// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Suggestion domain model.
//!
//! Represents AI-generated suggestions (drift fixes, schema updates, test gaps,
//! optimization hints) that surface in the Vigilance Monitor panel. Suggestions
//! are persistent, actionable, and cross-context.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// The category of an AI suggestion.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum SuggestionType {
    /// Fix detected API drift between spec and reality.
    DriftFix,
    /// Recommend a schema update based on observed responses.
    SchemaUpdate,
    /// Highlight missing test coverage.
    TestGap,
    /// Suggest a performance or quality optimization.
    Optimization,
}

/// The lifecycle status of a suggestion.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum SuggestionStatus {
    /// Awaiting user action.
    Pending,
    /// User accepted and executed the suggestion.
    Accepted,
    /// User dismissed the suggestion (soft delete).
    Dismissed,
}

/// An AI-generated suggestion surfaced in the Vigilance Monitor.
///
/// Each suggestion has a type, title, description, action to take,
/// optional context linking it to a collection/request/endpoint,
/// and lifecycle status tracking.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
#[allow(clippy::struct_field_names)] // suggestion_type matches domain language
pub struct Suggestion {
    /// Unique identifier (UUID v7).
    pub id: String,
    /// Category of the suggestion.
    pub suggestion_type: SuggestionType,
    /// Short human-readable title.
    pub title: String,
    /// Detailed description of the issue or opportunity.
    pub description: String,
    /// Current lifecycle status.
    pub status: SuggestionStatus,
    /// Actor attribution — which AI model or source created it.
    pub source: String,
    /// Linked collection ID (if applicable).
    pub collection_id: Option<String>,
    /// Linked request ID (if applicable).
    pub request_id: Option<String>,
    /// Linked endpoint path (if applicable).
    pub endpoint: Option<String>,
    /// What action to take (update spec, fix request, add test, etc.).
    pub action: String,
    /// When the suggestion was created (ISO 8601).
    pub created_at: String,
    /// When the suggestion was resolved (ISO 8601), if resolved.
    pub resolved_at: Option<String>,
}

/// Payload for creating a new suggestion.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct CreateSuggestionRequest {
    /// Category of the suggestion.
    pub suggestion_type: SuggestionType,
    /// Short human-readable title.
    pub title: String,
    /// Detailed description.
    pub description: String,
    /// Actor attribution.
    pub source: String,
    /// Linked collection ID (if applicable).
    pub collection_id: Option<String>,
    /// Linked request ID (if applicable).
    pub request_id: Option<String>,
    /// Linked endpoint path (if applicable).
    pub endpoint: Option<String>,
    /// What action to take.
    pub action: String,
}

impl Suggestion {
    /// Create a new suggestion from a creation request.
    ///
    /// Generates a UUID v7 ID and sets `created_at` to now.
    #[must_use]
    pub fn from_request(req: &CreateSuggestionRequest) -> Self {
        Self {
            id: uuid::Uuid::now_v7().to_string(),
            suggestion_type: req.suggestion_type,
            title: req.title.clone(),
            description: req.description.clone(),
            status: SuggestionStatus::Pending,
            source: req.source.clone(),
            collection_id: req.collection_id.clone(),
            request_id: req.request_id.clone(),
            endpoint: req.endpoint.clone(),
            action: req.action.clone(),
            created_at: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            resolved_at: None,
        }
    }

    /// Resolve this suggestion with the given status (Accepted or Dismissed).
    ///
    /// Sets `resolved_at` to now.
    #[allow(dead_code)] // Domain API — used in tests, available for future callers
    pub fn resolve(&mut self, status: SuggestionStatus) {
        self.status = status;
        self.resolved_at = Some(chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_request() -> CreateSuggestionRequest {
        CreateSuggestionRequest {
            suggestion_type: SuggestionType::DriftFix,
            title: "Response schema drift detected".to_string(),
            description: "GET /users returns extra field 'avatar_url' not in spec".to_string(),
            source: "claude-3.5-sonnet".to_string(),
            collection_id: Some("col-1".to_string()),
            request_id: Some("req-1".to_string()),
            endpoint: Some("GET /users".to_string()),
            action: "Update spec to include avatar_url field".to_string(),
        }
    }

    #[test]
    fn test_from_request_creates_pending_suggestion() {
        let req = sample_request();
        let suggestion = Suggestion::from_request(&req);

        assert!(!suggestion.id.is_empty());
        assert_eq!(suggestion.suggestion_type, SuggestionType::DriftFix);
        assert_eq!(suggestion.title, req.title);
        assert_eq!(suggestion.description, req.description);
        assert_eq!(suggestion.status, SuggestionStatus::Pending);
        assert_eq!(suggestion.source, req.source);
        assert_eq!(suggestion.collection_id, Some("col-1".to_string()));
        assert_eq!(suggestion.request_id, Some("req-1".to_string()));
        assert_eq!(suggestion.endpoint, Some("GET /users".to_string()));
        assert_eq!(suggestion.action, req.action);
        assert!(!suggestion.created_at.is_empty());
        assert!(suggestion.resolved_at.is_none());
    }

    #[test]
    fn test_resolve_sets_status_and_timestamp() {
        let req = sample_request();
        let mut suggestion = Suggestion::from_request(&req);

        suggestion.resolve(SuggestionStatus::Accepted);

        assert_eq!(suggestion.status, SuggestionStatus::Accepted);
        assert!(suggestion.resolved_at.is_some());
    }

    #[test]
    fn test_dismiss_sets_dismissed_status() {
        let req = sample_request();
        let mut suggestion = Suggestion::from_request(&req);

        suggestion.resolve(SuggestionStatus::Dismissed);

        assert_eq!(suggestion.status, SuggestionStatus::Dismissed);
        assert!(suggestion.resolved_at.is_some());
    }

    #[test]
    fn test_serialization_camel_case() {
        let req = sample_request();
        let suggestion = Suggestion::from_request(&req);
        let json = serde_json::to_string(&suggestion).unwrap();

        assert!(json.contains("\"suggestionType\""));
        assert!(json.contains("\"collectionId\""));
        assert!(json.contains("\"requestId\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"resolvedAt\""));
    }

    #[test]
    fn test_suggestion_type_serialization() {
        assert_eq!(
            serde_json::to_string(&SuggestionType::DriftFix).unwrap(),
            "\"drift_fix\""
        );
        assert_eq!(
            serde_json::to_string(&SuggestionType::SchemaUpdate).unwrap(),
            "\"schema_update\""
        );
        assert_eq!(
            serde_json::to_string(&SuggestionType::TestGap).unwrap(),
            "\"test_gap\""
        );
        assert_eq!(
            serde_json::to_string(&SuggestionType::Optimization).unwrap(),
            "\"optimization\""
        );
    }

    #[test]
    fn test_suggestion_status_serialization() {
        assert_eq!(
            serde_json::to_string(&SuggestionStatus::Pending).unwrap(),
            "\"pending\""
        );
        assert_eq!(
            serde_json::to_string(&SuggestionStatus::Accepted).unwrap(),
            "\"accepted\""
        );
        assert_eq!(
            serde_json::to_string(&SuggestionStatus::Dismissed).unwrap(),
            "\"dismissed\""
        );
    }

    #[test]
    fn test_deserialization_from_camel_case() {
        let json = r#"{
            "id": "test-id",
            "suggestionType": "test_gap",
            "title": "Missing tests",
            "description": "No tests for auth module",
            "status": "pending",
            "source": "claude",
            "collectionId": null,
            "requestId": null,
            "endpoint": null,
            "action": "Add tests",
            "createdAt": "2026-01-01T00:00:00Z",
            "resolvedAt": null
        }"#;
        let suggestion: Suggestion = serde_json::from_str(json).unwrap();
        assert_eq!(suggestion.id, "test-id");
        assert_eq!(suggestion.suggestion_type, SuggestionType::TestGap);
        assert_eq!(suggestion.status, SuggestionStatus::Pending);
    }
}
