// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Suggestion service — CRUD operations with TOML file persistence.
//!
//! Manages AI-generated suggestions for the Vigilance Monitor panel.
//! Suggestions are persisted as a TOML file at the configured path
//! (typically `~/.runi/suggestions.toml`).

use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::domain::suggestion::{CreateSuggestionRequest, Suggestion, SuggestionStatus};

/// Wrapper struct for TOML serialization of suggestion lists.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct SuggestionsFile {
    /// All stored suggestions.
    #[serde(default)]
    suggestions: Vec<Suggestion>,
}

/// Service for managing AI suggestions with TOML file persistence.
///
/// Thread-safe via internal `Mutex<PathBuf>`.
pub struct SuggestionService {
    /// Path to the TOML file, wrapped in a mutex for thread safety.
    file_path: Mutex<PathBuf>,
}

impl SuggestionService {
    /// Create a new service backed by a TOML file at the given path.
    ///
    /// Creates the parent directory if it does not exist.
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

    /// List all suggestions, optionally filtered by status.
    ///
    /// Returns suggestions ordered by `created_at` descending (newest first).
    ///
    /// # Errors
    ///
    /// Returns an error if the file cannot be read or parsed.
    pub fn list_suggestions(
        &self,
        status_filter: Option<SuggestionStatus>,
    ) -> Result<Vec<Suggestion>, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?
            .clone();

        let file = Self::load_file(&path)?;
        let mut suggestions: Vec<Suggestion> = match status_filter {
            Some(status) => file
                .suggestions
                .into_iter()
                .filter(|s| s.status == status)
                .collect(),
            None => file.suggestions,
        };

        // Sort by created_at descending (newest first)
        suggestions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(suggestions)
    }

    /// Get a single suggestion by ID.
    ///
    /// # Errors
    ///
    /// Returns an error if the suggestion is not found or the file cannot be read.
    #[allow(dead_code)]
    pub fn get_suggestion(&self, id: &str) -> Result<Suggestion, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?
            .clone();

        let file = Self::load_file(&path)?;
        file.suggestions
            .into_iter()
            .find(|s| s.id == id)
            .ok_or_else(|| format!("Suggestion not found: {id}"))
    }

    /// Create a new suggestion from a request payload.
    ///
    /// Returns the created suggestion.
    ///
    /// # Errors
    ///
    /// Returns an error if the file cannot be read or written.
    #[allow(clippy::significant_drop_tightening)]
    pub fn create_suggestion(&self, req: &CreateSuggestionRequest) -> Result<Suggestion, String> {
        let suggestion = Suggestion::from_request(req);

        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let mut file = Self::load_file(&path)?;
        file.suggestions.push(suggestion.clone());
        Self::write_file(&path, &file)?;

        Ok(suggestion)
    }

    /// Update the status of a suggestion (accept or dismiss).
    ///
    /// Returns the updated suggestion.
    ///
    /// # Errors
    ///
    /// Returns an error if the suggestion is not found or the file cannot be written.
    #[allow(clippy::significant_drop_tightening)]
    pub fn resolve_suggestion(
        &self,
        id: &str,
        status: SuggestionStatus,
    ) -> Result<Suggestion, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let mut file = Self::load_file(&path)?;
        let resolved_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

        let suggestion = file
            .suggestions
            .iter_mut()
            .find(|s| s.id == id)
            .ok_or_else(|| format!("Suggestion not found: {id}"))?;

        suggestion.status = status;
        suggestion.resolved_at = Some(resolved_at);

        let result = suggestion.clone();
        Self::write_file(&path, &file)?;
        Ok(result)
    }

    /// Dismiss all pending suggestions atomically.
    ///
    /// Sets status to `Dismissed` and `resolved_at` to now for every suggestion
    /// currently in the `Pending` state. Returns the count of items affected.
    ///
    /// # Errors
    ///
    /// Returns an error if the file cannot be read or written.
    #[allow(clippy::significant_drop_tightening)]
    pub fn clear_all_pending(&self) -> Result<u64, String> {
        let path = self
            .file_path
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let mut file = Self::load_file(&path)?;
        let resolved_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

        let mut count: u64 = 0;
        for suggestion in &mut file.suggestions {
            if suggestion.status == SuggestionStatus::Pending {
                suggestion.status = SuggestionStatus::Dismissed;
                suggestion.resolved_at = Some(resolved_at.clone());
                count += 1;
            }
        }

        Self::write_file(&path, &file)?;
        Ok(count)
    }

    /// Load the suggestions file, returning an empty file if it doesn't exist.
    fn load_file(path: &std::path::Path) -> Result<SuggestionsFile, String> {
        if !path.exists() {
            return Ok(SuggestionsFile::default());
        }

        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read {}: {e}", path.display()))?;

        if content.trim().is_empty() {
            return Ok(SuggestionsFile::default());
        }

        toml::from_str(&content).map_err(|e| format!("Failed to parse {}: {e}", path.display()))
    }

    /// Write the suggestions file atomically using a write-to-temp-then-rename pattern.
    ///
    /// This ensures the file is never left in a partially-written state if the
    /// process is killed mid-write. The OS `rename` call is atomic on the same
    /// filesystem, so readers always observe either the old or the new content.
    fn write_file(path: &std::path::Path, file: &SuggestionsFile) -> Result<(), String> {
        let content = toml::to_string_pretty(file)
            .map_err(|e| format!("Failed to serialize suggestions: {e}"))?;

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
    use crate::domain::suggestion::SuggestionType;
    use tempfile::TempDir;

    /// Create a service backed by a temporary TOML file.
    fn temp_service() -> (SuggestionService, TempDir) {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("suggestions.toml");
        let svc = SuggestionService::new(&file_path).unwrap();
        (svc, dir)
    }

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
        let (svc, _dir) = temp_service();
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
        let (svc, _dir) = temp_service();

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
        let (svc, _dir) = temp_service();

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
        let (svc, _dir) = temp_service();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        let resolved = svc
            .resolve_suggestion(&created.id, SuggestionStatus::Accepted)
            .unwrap();
        assert_eq!(resolved.status, SuggestionStatus::Accepted);
        assert!(resolved.resolved_at.is_some());
    }

    #[test]
    fn test_resolve_suggestion_dismissed() {
        let (svc, _dir) = temp_service();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        let resolved = svc
            .resolve_suggestion(&created.id, SuggestionStatus::Dismissed)
            .unwrap();
        assert_eq!(resolved.status, SuggestionStatus::Dismissed);
        assert!(resolved.resolved_at.is_some());
    }

    #[test]
    fn test_resolve_nonexistent_returns_error() {
        let (svc, _dir) = temp_service();
        let result = svc.resolve_suggestion("nonexistent", SuggestionStatus::Accepted);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_nonexistent_returns_error() {
        let (svc, _dir) = temp_service();
        let result = svc.get_suggestion("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_persists_across_reads() {
        let (svc, _dir) = temp_service();
        let created = svc.create_suggestion(&sample_request()).unwrap();

        // Re-read from file
        let fetched = svc.get_suggestion(&created.id).unwrap();
        assert_eq!(fetched.suggestion_type, SuggestionType::DriftFix);
        assert_eq!(fetched.collection_id, Some("col-1".to_string()));
        assert_eq!(fetched.endpoint, Some("GET /users".to_string()));
    }

    #[test]
    fn test_clear_all_pending_dismisses_pending_suggestions() {
        let (svc, _dir) = temp_service();

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
        let (svc, _dir) = temp_service();

        let count = svc.clear_all_pending().unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_concurrent_creates() {
        use std::sync::Arc;

        let (svc, _dir) = temp_service();
        let svc = Arc::new(svc);

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
