// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Project context service — CRUD operations with SQLite persistence.
//!
//! Manages the singleton project context that represents the user's current
//! working state. The context is persisted in the same SQLite database as
//! history, using the migrations framework.

use std::sync::Mutex;

use rusqlite::{Connection, params};

use crate::domain::project_context::{ProjectContext, ProjectContextUpdate};
use crate::infrastructure::storage::migrations;

/// Service for managing the persistent project context.
///
/// Uses a `SQLite` database to persist context across app restarts.
/// Thread-safe via internal `Mutex<Connection>`.
pub struct ProjectContextService {
    /// Database connection wrapped in a mutex for thread safety.
    conn: Mutex<Connection>,
}

impl ProjectContextService {
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
                "Failed to open project context database at {}: {e}",
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

    /// Get the current project context.
    ///
    /// Returns the singleton context row, or a default empty context if
    /// the row has never been written.
    ///
    /// # Errors
    ///
    /// Returns an error if the database query fails.
    pub fn get_context(&self) -> Result<ProjectContext, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        Self::load_context(&conn)
    }

    /// Apply a partial update to the project context.
    ///
    /// Holds the database lock for the entire read-modify-write cycle to
    /// ensure atomicity under concurrent access.
    /// Returns the updated context.
    ///
    /// # Errors
    ///
    /// Returns an error if the database read or write fails.
    pub fn update_context(&self, update: &ProjectContextUpdate) -> Result<ProjectContext, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let mut ctx = Self::load_context(&conn)?;
        update.apply_to(&mut ctx);
        Self::write_context(&conn, &ctx)?;
        drop(conn);
        Ok(ctx)
    }

    /// Load the project context from an already-locked connection.
    fn load_context(conn: &Connection) -> Result<ProjectContext, String> {
        let result = conn.query_row(
            r"SELECT active_collection_id, active_request_id, investigation_notes,
                     recent_request_ids_json, tags_json
              FROM project_context WHERE id = 'current'",
            [],
            |row| {
                let active_collection_id: Option<String> = row.get(0)?;
                let active_request_id: Option<String> = row.get(1)?;
                let investigation_notes: Option<String> = row.get(2)?;
                let recent_request_ids_json: String = row.get(3)?;
                let tags_json: String = row.get(4)?;
                Ok((
                    active_collection_id,
                    active_request_id,
                    investigation_notes,
                    recent_request_ids_json,
                    tags_json,
                ))
            },
        );

        match result {
            Ok((
                active_collection_id,
                active_request_id,
                investigation_notes,
                recent_json,
                tags_json,
            )) => {
                let recent_request_ids: Vec<String> = serde_json::from_str(&recent_json)
                    .map_err(|e| format!("Failed to parse recent_request_ids: {e}"))?;
                let tags: Vec<String> = serde_json::from_str(&tags_json)
                    .map_err(|e| format!("Failed to parse tags: {e}"))?;

                Ok(ProjectContext {
                    active_collection_id,
                    active_request_id,
                    investigation_notes,
                    recent_request_ids,
                    tags,
                })
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(ProjectContext::new()),
            Err(e) => Err(format!("Failed to load project context: {e}")),
        }
    }

    /// Persist the full project context to an already-locked connection.
    fn write_context(conn: &Connection, ctx: &ProjectContext) -> Result<(), String> {
        let recent_json = serde_json::to_string(&ctx.recent_request_ids)
            .map_err(|e| format!("Failed to serialize recent_request_ids: {e}"))?;
        let tags_json = serde_json::to_string(&ctx.tags)
            .map_err(|e| format!("Failed to serialize tags: {e}"))?;

        conn.execute(
            r"INSERT OR REPLACE INTO project_context
              (id, active_collection_id, active_request_id, investigation_notes,
               recent_request_ids_json, tags_json)
              VALUES ('current', ?1, ?2, ?3, ?4, ?5)",
            params![
                ctx.active_collection_id,
                ctx.active_request_id,
                ctx.investigation_notes,
                recent_json,
                tags_json,
            ],
        )
        .map_err(|e| format!("Failed to save project context: {e}"))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_context_returns_default_on_fresh_db() {
        let svc = ProjectContextService::in_memory().unwrap();
        let ctx = svc.get_context().unwrap();
        assert_eq!(ctx, ProjectContext::new());
    }

    #[test]
    fn test_update_context_sets_active_collection() {
        let svc = ProjectContextService::in_memory().unwrap();
        let update = ProjectContextUpdate {
            active_collection_id: Some(Some("col-123".to_string())),
            ..Default::default()
        };
        let ctx = svc.update_context(&update).unwrap();
        assert_eq!(ctx.active_collection_id, Some("col-123".to_string()));
    }

    #[test]
    fn test_update_context_persists_across_reads() {
        let svc = ProjectContextService::in_memory().unwrap();

        let update = ProjectContextUpdate {
            active_collection_id: Some(Some("col-1".to_string())),
            active_request_id: Some(Some("req-1".to_string())),
            investigation_notes: Some(Some("testing auth flow".to_string())),
            tags: Some(vec!["auth".to_string(), "testing".to_string()]),
            ..Default::default()
        };
        svc.update_context(&update).unwrap();

        // Re-read
        let ctx = svc.get_context().unwrap();
        assert_eq!(ctx.active_collection_id, Some("col-1".to_string()));
        assert_eq!(ctx.active_request_id, Some("req-1".to_string()));
        assert_eq!(
            ctx.investigation_notes,
            Some("testing auth flow".to_string())
        );
        assert_eq!(ctx.tags, vec!["auth", "testing"]);
    }

    #[test]
    fn test_update_context_partial_preserves_existing() {
        let svc = ProjectContextService::in_memory().unwrap();

        // First update
        let update1 = ProjectContextUpdate {
            active_collection_id: Some(Some("col-1".to_string())),
            tags: Some(vec!["tag-a".to_string()]),
            ..Default::default()
        };
        svc.update_context(&update1).unwrap();

        // Second partial update
        let update2 = ProjectContextUpdate {
            active_request_id: Some(Some("req-1".to_string())),
            ..Default::default()
        };
        let ctx = svc.update_context(&update2).unwrap();

        // First update fields preserved
        assert_eq!(ctx.active_collection_id, Some("col-1".to_string()));
        assert_eq!(ctx.tags, vec!["tag-a"]);
        // Second update applied
        assert_eq!(ctx.active_request_id, Some("req-1".to_string()));
    }

    #[test]
    fn test_update_context_clears_field() {
        let svc = ProjectContextService::in_memory().unwrap();

        // Set a value
        svc.update_context(&ProjectContextUpdate {
            active_collection_id: Some(Some("col-1".to_string())),
            ..Default::default()
        })
        .unwrap();

        // Clear it
        let ctx = svc
            .update_context(&ProjectContextUpdate {
                active_collection_id: Some(None),
                ..Default::default()
            })
            .unwrap();

        assert!(ctx.active_collection_id.is_none());
    }

    #[test]
    fn test_update_context_pushes_recent_request() {
        let svc = ProjectContextService::in_memory().unwrap();

        svc.update_context(&ProjectContextUpdate {
            push_recent_request_id: Some("req-1".to_string()),
            ..Default::default()
        })
        .unwrap();
        svc.update_context(&ProjectContextUpdate {
            push_recent_request_id: Some("req-2".to_string()),
            ..Default::default()
        })
        .unwrap();

        let ctx = svc.get_context().unwrap();
        assert_eq!(ctx.recent_request_ids, vec!["req-2", "req-1"]);
    }

    #[test]
    fn test_concurrent_updates() {
        use std::sync::Arc;

        let svc = Arc::new(ProjectContextService::in_memory().unwrap());

        let mut handles = Vec::new();
        for i in 0..10 {
            let svc_clone = Arc::clone(&svc);
            let handle = std::thread::spawn(move || {
                svc_clone
                    .update_context(&ProjectContextUpdate {
                        push_recent_request_id: Some(format!("req-{i}")),
                        ..Default::default()
                    })
                    .unwrap();
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }

        let ctx = svc.get_context().unwrap();
        // All 10 should be present (max 10 = limit)
        assert_eq!(ctx.recent_request_ids.len(), 10);
    }
}
