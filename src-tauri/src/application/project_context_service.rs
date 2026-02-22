// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Project context service — CRUD operations with TOML file persistence.
//!
//! Manages the singleton project context that represents the user's current
//! working state. The context is persisted as a TOML file at the configured
//! path (typically `~/.runi/state.toml`).

use std::path::PathBuf;
use std::sync::Mutex;

use crate::domain::project_context::{ProjectContext, ProjectContextUpdate};

/// Service for managing the persistent project context.
///
/// Uses a TOML file to persist context across app restarts.
/// Thread-safe via internal `Mutex<PathBuf>`.
pub struct ProjectContextService {
    /// Path to the TOML file, wrapped in a mutex for thread safety.
    file_path: Mutex<PathBuf>,
}

impl ProjectContextService {
    /// Create a new service backed by a TOML file at the given path.
    ///
    /// Creates the parent directory if it does not exist.
    /// If the file does not exist, a default empty context will be returned
    /// on the first read and written on the first update.
    ///
    /// # Errors
    ///
    /// Returns an error if the parent directory cannot be created.
    pub fn new(file_path: &std::path::Path) -> Result<Self, String> {
        if let Some(parent) = file_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                format!(
                    "Failed to create directory for {}: {e}",
                    file_path.display()
                )
            })?;
        }

        Ok(Self {
            file_path: Mutex::new(file_path.to_path_buf()),
        })
    }

    /// Get the current project context.
    ///
    /// Returns the stored context, or a default empty context if
    /// the file does not exist or is empty.
    ///
    /// # Errors
    ///
    /// Returns an error if the file exists but cannot be read or parsed.
    pub fn get_context(&self) -> Result<ProjectContext, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?
            .clone();

        Self::load_context(&path)
    }

    /// Apply a partial update to the project context.
    ///
    /// Holds the lock for the entire read-modify-write cycle to
    /// ensure atomicity under concurrent access.
    /// Returns the updated context.
    ///
    /// # Errors
    ///
    /// Returns an error if the file read or write fails.
    #[allow(clippy::significant_drop_tightening)]
    pub fn update_context(&self, update: &ProjectContextUpdate) -> Result<ProjectContext, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let mut ctx = Self::load_context(&path)?;
        update.apply_to(&mut ctx);
        Self::write_context(&path, &ctx)?;
        Ok(ctx)
    }

    /// Load the project context from a TOML file.
    fn load_context(path: &std::path::Path) -> Result<ProjectContext, String> {
        if !path.exists() {
            return Ok(ProjectContext::new());
        }

        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read {}: {e}", path.display()))?;

        if content.trim().is_empty() {
            return Ok(ProjectContext::new());
        }

        toml::from_str(&content).map_err(|e| format!("Failed to parse {}: {e}", path.display()))
    }

    /// Persist the full project context to a TOML file atomically.
    ///
    /// Uses a write-to-temp-then-rename pattern so the file is never left in a
    /// partially-written state. The OS `rename` call is atomic on the same
    /// filesystem, meaning readers always observe either the old or the new content.
    fn write_context(path: &std::path::Path, ctx: &ProjectContext) -> Result<(), String> {
        let content = toml::to_string_pretty(ctx)
            .map_err(|e| format!("Failed to serialize project context: {e}"))?;

        let tmp_path = path.with_extension("toml.tmp");
        std::fs::write(&tmp_path, &content)
            .map_err(|e| format!("Failed to write temp file {}: {e}", tmp_path.display()))?;
        std::fs::rename(&tmp_path, path)
            .map_err(|e| format!("Failed to rename to {}: {e}", path.display()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    /// Create a service backed by a temporary TOML file.
    fn temp_service() -> (ProjectContextService, TempDir) {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("state.toml");
        let svc = ProjectContextService::new(&file_path).unwrap();
        (svc, dir)
    }

    #[test]
    fn test_get_context_returns_default_when_file_missing() {
        let (svc, _dir) = temp_service();
        let ctx = svc.get_context().unwrap();
        assert_eq!(ctx, ProjectContext::new());
    }

    #[test]
    fn test_update_context_sets_active_collection() {
        let (svc, _dir) = temp_service();
        let update = ProjectContextUpdate {
            active_collection_id: Some(Some("col-123".to_string())),
            ..Default::default()
        };
        let ctx = svc.update_context(&update).unwrap();
        assert_eq!(ctx.active_collection_id, Some("col-123".to_string()));
    }

    #[test]
    fn test_update_context_persists_across_reads() {
        let (svc, _dir) = temp_service();

        let update = ProjectContextUpdate {
            active_collection_id: Some(Some("col-1".to_string())),
            active_request_id: Some(Some("req-1".to_string())),
            investigation_notes: Some(Some("testing auth flow".to_string())),
            tags: Some(vec!["auth".to_string(), "testing".to_string()]),
            ..Default::default()
        };
        svc.update_context(&update).unwrap();

        // Re-read from file
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
        let (svc, _dir) = temp_service();

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
        let (svc, _dir) = temp_service();

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
        let (svc, _dir) = temp_service();

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

        let (svc, _dir) = temp_service();
        let svc = Arc::new(svc);

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
