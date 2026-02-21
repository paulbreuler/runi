// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Suggestion service — CRUD operations with SQLite persistence.
//!
//! Manages AI-generated suggestions for the Vigilance Monitor panel.
//! Suggestions are persisted in the same SQLite database as other app state.

use std::sync::Mutex;

use rusqlite::{Connection, params};

use crate::domain::suggestion::{
    CreateSuggestionRequest, Suggestion, SuggestionStatus, SuggestionType,
};
use crate::infrastructure::storage::migrations;

/// Service for managing AI suggestions with `SQLite` persistence.
///
/// Thread-safe via internal `Mutex<Connection>`.
pub struct SuggestionService {
    /// Database connection wrapped in a mutex for thread safety.
    conn: Mutex<Connection>,
}

impl SuggestionService {
    /// Create a new service backed by a `SQLite` database at the given path.
    ///
    /// Applies any pending migrations on open.
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be opened or migrations fail.
    pub fn new(db_path: &std::path::Path) -> Result<Self, String> {
        let conn = Connection::open(db_path).map_err(|e| {
            format!(
                "Failed to open suggestions database at {}: {e}",
                db_path.display()
            )
        })?;

        migrations::apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Create an in-memory database (for testing).
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be created or migrations fail.
    #[cfg(test)]
    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory()
            .map_err(|e| format!("Failed to open in-memory SQLite: {e}"))?;

        migrations::apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// List all suggestions, optionally filtered by status.
    ///
    /// Returns suggestions ordered by `created_at` descending (newest first).
    ///
    /// # Errors
    ///
    /// Returns an error if the database query fails.
    pub fn list_suggestions(
        &self,
        status_filter: Option<SuggestionStatus>,
    ) -> Result<Vec<Suggestion>, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) =
            if let Some(status) = status_filter {
                let status_str = serde_json::to_value(status)
                    .map_err(|e| format!("Failed to serialize status: {e}"))?
                    .as_str()
                    .unwrap_or("pending")
                    .to_string();
                (
                    "SELECT id, suggestion_type, title, description, status, source, \
                     collection_id, request_id, endpoint, action, created_at, resolved_at \
                     FROM suggestions WHERE status = ?1 ORDER BY created_at DESC"
                        .to_string(),
                    vec![Box::new(status_str)],
                )
            } else {
                (
                    "SELECT id, suggestion_type, title, description, status, source, \
                     collection_id, request_id, endpoint, action, created_at, resolved_at \
                     FROM suggestions ORDER BY created_at DESC"
                        .to_string(),
                    vec![],
                )
            };

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| format!("Failed to prepare statement: {e}"))?;

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            params_vec.iter().map(AsRef::as_ref).collect();

        let rows = stmt
            .query_map(param_refs.as_slice(), |row| {
                Ok(Self::row_to_suggestion(row))
            })
            .map_err(|e| format!("Failed to query suggestions: {e}"))?;

        let mut suggestions = Vec::new();
        for row in rows {
            let suggestion = row.map_err(|e| format!("Failed to read row: {e}"))??;
            suggestions.push(suggestion);
        }

        drop(stmt);
        drop(conn);
        Ok(suggestions)
    }

    /// Get a single suggestion by ID.
    ///
    /// # Errors
    ///
    /// Returns an error if the suggestion is not found or the query fails.
    pub fn get_suggestion(&self, id: &str) -> Result<Suggestion, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        conn.query_row(
            "SELECT id, suggestion_type, title, description, status, source, \
             collection_id, request_id, endpoint, action, created_at, resolved_at \
             FROM suggestions WHERE id = ?1",
            params![id],
            |row| Ok(Self::row_to_suggestion(row)),
        )
        .map_err(|e| format!("Suggestion not found: {e}"))?
    }

    /// Create a new suggestion from a request payload.
    ///
    /// Returns the created suggestion.
    ///
    /// # Errors
    ///
    /// Returns an error if the insert fails.
    pub fn create_suggestion(&self, req: &CreateSuggestionRequest) -> Result<Suggestion, String> {
        let suggestion = Suggestion::from_request(req);

        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let type_str = serde_json::to_value(suggestion.suggestion_type)
            .map_err(|e| format!("Failed to serialize type: {e}"))?
            .as_str()
            .unwrap_or("drift_fix")
            .to_string();

        let status_str = serde_json::to_value(suggestion.status)
            .map_err(|e| format!("Failed to serialize status: {e}"))?
            .as_str()
            .unwrap_or("pending")
            .to_string();

        conn.execute(
            "INSERT INTO suggestions \
             (id, suggestion_type, title, description, status, source, \
              collection_id, request_id, endpoint, action, created_at, resolved_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                suggestion.id,
                type_str,
                suggestion.title,
                suggestion.description,
                status_str,
                suggestion.source,
                suggestion.collection_id,
                suggestion.request_id,
                suggestion.endpoint,
                suggestion.action,
                suggestion.created_at,
                suggestion.resolved_at,
            ],
        )
        .map_err(|e| format!("Failed to insert suggestion: {e}"))?;

        drop(conn);
        Ok(suggestion)
    }

    /// Update the status of a suggestion (accept or dismiss).
    ///
    /// Returns the updated suggestion.
    ///
    /// # Errors
    ///
    /// Returns an error if the suggestion is not found or the update fails.
    pub fn resolve_suggestion(
        &self,
        id: &str,
        status: SuggestionStatus,
    ) -> Result<Suggestion, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let resolved_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
        let status_str = serde_json::to_value(status)
            .map_err(|e| format!("Failed to serialize status: {e}"))?
            .as_str()
            .unwrap_or("accepted")
            .to_string();

        let affected = conn
            .execute(
                "UPDATE suggestions SET status = ?1, resolved_at = ?2 WHERE id = ?3",
                params![status_str, resolved_at, id],
            )
            .map_err(|e| format!("Failed to update suggestion: {e}"))?;

        if affected == 0 {
            return Err(format!("Suggestion not found: {id}"));
        }

        drop(conn);
        self.get_suggestion(id)
    }

    /// Dismiss all pending suggestions atomically.
    ///
    /// Sets `status='dismissed'` and `resolved_at=now` for every suggestion currently in
    /// the `pending` state. Returns the count of rows affected.
    ///
    /// # Errors
    ///
    /// Returns an error if the database update fails.
    pub fn clear_all_pending(&self) -> Result<u64, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let resolved_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

        let affected = conn
            .execute(
                "UPDATE suggestions SET status = 'dismissed', resolved_at = ?1 \
                 WHERE status = 'pending'",
                rusqlite::params![resolved_at],
            )
            .map_err(|e| format!("Failed to dismiss pending suggestions: {e}"))?;

        drop(conn);
        Ok(affected as u64)
    }

    /// Convert a database row to a `Suggestion`.
    fn row_to_suggestion(row: &rusqlite::Row<'_>) -> Result<Suggestion, String> {
        let id: String = row.get(0).map_err(|e| format!("Failed to read id: {e}"))?;
        let type_str: String = row
            .get(1)
            .map_err(|e| format!("Failed to read suggestion_type: {e}"))?;
        let title: String = row
            .get(2)
            .map_err(|e| format!("Failed to read title: {e}"))?;
        let description: String = row
            .get(3)
            .map_err(|e| format!("Failed to read description: {e}"))?;
        let status_str: String = row
            .get(4)
            .map_err(|e| format!("Failed to read status: {e}"))?;
        let source: String = row
            .get(5)
            .map_err(|e| format!("Failed to read source: {e}"))?;
        let collection_id: Option<String> = row
            .get(6)
            .map_err(|e| format!("Failed to read collection_id: {e}"))?;
        let request_id: Option<String> = row
            .get(7)
            .map_err(|e| format!("Failed to read request_id: {e}"))?;
        let endpoint: Option<String> = row
            .get(8)
            .map_err(|e| format!("Failed to read endpoint: {e}"))?;
        let action: String = row
            .get(9)
            .map_err(|e| format!("Failed to read action: {e}"))?;
        let created_at: String = row
            .get(10)
            .map_err(|e| format!("Failed to read created_at: {e}"))?;
        let resolved_at: Option<String> = row
            .get(11)
            .map_err(|e| format!("Failed to read resolved_at: {e}"))?;

        let suggestion_type: SuggestionType =
            serde_json::from_value(serde_json::Value::String(type_str.clone()))
                .map_err(|e| format!("Invalid suggestion_type '{type_str}': {e}"))?;

        let status: SuggestionStatus =
            serde_json::from_value(serde_json::Value::String(status_str.clone()))
                .map_err(|e| format!("Invalid status '{status_str}': {e}"))?;

        Ok(Suggestion {
            id,
            suggestion_type,
            title,
            description,
            status,
            source,
            collection_id,
            request_id,
            endpoint,
            action,
            created_at,
            resolved_at,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_request() -> CreateSuggestionRequest {
        CreateSuggestionRequest {
            suggestion_type: SuggestionType::DriftFix,
            title: "Schema drift on GET /users".to_string(),
            description: "Response includes undocumented field 'avatar_url'".to_string(),
            source: "claude-3.5-sonnet".to_string(),
            collection_id: Some("col-1".to_string()),
            request_id: Some("req-1".to_string()),
            endpoint: Some("GET /users".to_string()),
            action: "Update spec to include avatar_url".to_string(),
        }
    }

    #[test]
    fn test_create_and_get_suggestion() {
        let svc = SuggestionService::in_memory().unwrap();
        let req = sample_request();

        let created = svc.create_suggestion(&req).unwrap();
        assert_eq!(created.title, req.title);
        assert_eq!(created.status, SuggestionStatus::Pending);

        let fetched = svc.get_suggestion(&created.id).unwrap();
        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.title, req.title);
    }

    #[test]
    fn test_list_suggestions_returns_all() {
        let svc = SuggestionService::in_memory().unwrap();

        svc.create_suggestion(&sample_request()).unwrap();
        svc.create_suggestion(&CreateSuggestionRequest {
            suggestion_type: SuggestionType::TestGap,
            title: "Missing auth tests".to_string(),
            description: "No coverage for /auth endpoint".to_string(),
            source: "claude".to_string(),
            collection_id: None,
            request_id: None,
            endpoint: Some("POST /auth".to_string()),
            action: "Add test".to_string(),
        })
        .unwrap();

        let all = svc.list_suggestions(None).unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_list_suggestions_with_status_filter() {
        let svc = SuggestionService::in_memory().unwrap();

        let s1 = svc.create_suggestion(&sample_request()).unwrap();
        svc.create_suggestion(&CreateSuggestionRequest {
            suggestion_type: SuggestionType::Optimization,
            title: "Slow query".to_string(),
            description: "N+1 detected".to_string(),
            source: "claude".to_string(),
            collection_id: None,
            request_id: None,
            endpoint: None,
            action: "Add batch endpoint".to_string(),
        })
        .unwrap();

        // Resolve one
        svc.resolve_suggestion(&s1.id, SuggestionStatus::Accepted)
            .unwrap();

        let pending = svc
            .list_suggestions(Some(SuggestionStatus::Pending))
            .unwrap();
        assert_eq!(pending.len(), 1);

        let accepted = svc
            .list_suggestions(Some(SuggestionStatus::Accepted))
            .unwrap();
        assert_eq!(accepted.len(), 1);
        assert_eq!(accepted[0].id, s1.id);
    }

    #[test]
    fn test_resolve_suggestion_accepted() {
        let svc = SuggestionService::in_memory().unwrap();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        let resolved = svc
            .resolve_suggestion(&created.id, SuggestionStatus::Accepted)
            .unwrap();
        assert_eq!(resolved.status, SuggestionStatus::Accepted);
        assert!(resolved.resolved_at.is_some());
    }

    #[test]
    fn test_resolve_suggestion_dismissed() {
        let svc = SuggestionService::in_memory().unwrap();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        let resolved = svc
            .resolve_suggestion(&created.id, SuggestionStatus::Dismissed)
            .unwrap();
        assert_eq!(resolved.status, SuggestionStatus::Dismissed);
        assert!(resolved.resolved_at.is_some());
    }

    #[test]
    fn test_resolve_nonexistent_returns_error() {
        let svc = SuggestionService::in_memory().unwrap();
        let result = svc.resolve_suggestion("nonexistent", SuggestionStatus::Accepted);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_nonexistent_returns_error() {
        let svc = SuggestionService::in_memory().unwrap();
        let result = svc.get_suggestion("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_persists_across_reads() {
        let svc = SuggestionService::in_memory().unwrap();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        // Re-read from DB
        let fetched = svc.get_suggestion(&created.id).unwrap();
        assert_eq!(fetched.suggestion_type, SuggestionType::DriftFix);
        assert_eq!(fetched.collection_id, Some("col-1".to_string()));
        assert_eq!(fetched.endpoint, Some("GET /users".to_string()));
    }

    #[test]
    fn test_clear_all_pending_dismisses_pending_suggestions() {
        let svc = SuggestionService::in_memory().unwrap();

        // Create two pending suggestions
        svc.create_suggestion(&sample_request()).unwrap();
        svc.create_suggestion(&CreateSuggestionRequest {
            suggestion_type: SuggestionType::Optimization,
            title: "Slow query".to_string(),
            description: "N+1 detected".to_string(),
            source: "claude".to_string(),
            collection_id: None,
            request_id: None,
            endpoint: None,
            action: "Add batch endpoint".to_string(),
        })
        .unwrap();

        // Create one accepted suggestion (should not be affected)
        let s3 = svc.create_suggestion(&sample_request()).unwrap();
        svc.resolve_suggestion(&s3.id, SuggestionStatus::Accepted)
            .unwrap();

        let dismissed_count = svc.clear_all_pending().unwrap();
        assert_eq!(dismissed_count, 2);

        let pending = svc
            .list_suggestions(Some(SuggestionStatus::Pending))
            .unwrap();
        assert_eq!(pending.len(), 0);

        // Accepted suggestion should still be accepted
        let accepted = svc
            .list_suggestions(Some(SuggestionStatus::Accepted))
            .unwrap();
        assert_eq!(accepted.len(), 1);

        // Both previously-pending are now dismissed
        let dismissed = svc
            .list_suggestions(Some(SuggestionStatus::Dismissed))
            .unwrap();
        assert_eq!(dismissed.len(), 2);
    }

    #[test]
    fn test_clear_all_pending_returns_zero_when_no_pending() {
        let svc = SuggestionService::in_memory().unwrap();

        let count = svc.clear_all_pending().unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_concurrent_creates() {
        use std::sync::Arc;

        let svc = Arc::new(SuggestionService::in_memory().unwrap());

        let mut handles = Vec::new();
        for i in 0..10 {
            let svc_clone = Arc::clone(&svc);
            let handle = std::thread::spawn(move || {
                svc_clone
                    .create_suggestion(&CreateSuggestionRequest {
                        suggestion_type: SuggestionType::Optimization,
                        title: format!("Suggestion {i}"),
                        description: format!("Description {i}"),
                        source: "test".to_string(),
                        collection_id: None,
                        request_id: None,
                        endpoint: None,
                        action: "optimize".to_string(),
                    })
                    .unwrap();
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }

        let all = svc.list_suggestions(None).unwrap();
        assert_eq!(all.len(), 10);
    }
}
