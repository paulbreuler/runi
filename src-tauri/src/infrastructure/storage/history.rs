// History entry storage and management

use crate::domain::http::{HttpResponse, RequestParams};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tracing;
use uuid::Uuid;

#[cfg(test)]
use ts_rs::TS;

/// A history entry representing a completed HTTP request and response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(TS))]
#[cfg_attr(test, ts(export))]
pub struct HistoryEntry {
    /// Unique identifier for this history entry.
    pub id: String,
    /// Timestamp when the request was made.
    #[cfg_attr(test, ts(type = "string"))]
    pub timestamp: DateTime<Utc>,
    /// The request parameters.
    pub request: RequestParams,
    /// The response received.
    pub response: HttpResponse,
}

impl HistoryEntry {
    /// Create a new history entry from a request and response.
    #[must_use]
    pub fn new(request: RequestParams, response: HttpResponse) -> Self {
        Self {
            id: format!("hist_{}", Uuid::new_v4().to_string().replace('-', "")),
            timestamp: Utc::now(),
            request,
            response,
        }
    }

    /// Generate a filename for this history entry.
    ///
    /// Format: `YYYY-MM-DD-HH-MM-SS-{METHOD}-{sanitized-url}-{id}.yaml`
    ///
    /// The URL is sanitized by replacing special characters with hyphens.
    #[must_use]
    pub fn filename(&self) -> String {
        let datetime = self.timestamp.format("%Y-%m-%d-%H-%M-%S");
        let method = self.request.method.to_uppercase();

        // Sanitize URL for filename: remove protocol, replace special chars with hyphen
        let sanitized = self
            .request
            .url
            .replace("https://", "")
            .replace("http://", "")
            .replace(['/', '?', '&', '=', ':'], "-")
            .chars()
            .take(50) // Limit length
            .collect::<String>();

        // Include entry ID in filename to ensure uniqueness
        let short_id = self.id.chars().take(8).collect::<String>();
        format!("{datetime}-{method}-{sanitized}-{short_id}.yaml")
    }
}

/// Save a history entry to disk.
///
/// # Errors
///
/// Returns an error if the history directory cannot be created or the file cannot be written.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn save_history_entry(entry: &HistoryEntry) -> Result<PathBuf, String> {
    use super::{ensure_dir_exists, get_history_dir};

    let history_dir = get_history_dir()?;
    ensure_dir_exists(&history_dir).await?;

    let filename = entry.filename();
    let file_path = history_dir.join(&filename);

    let yaml_content = serde_yaml::to_string(entry)
        .map_err(|e| format!("Failed to serialize history entry: {e}"))?;

    tokio::fs::write(&file_path, yaml_content)
        .await
        .map_err(|e| format!("Failed to write history file {}: {e}", file_path.display()))?;

    Ok(file_path)
}

/// Load a history entry from a file path.
///
/// # Errors
///
/// Returns an error if the file cannot be read or parsed.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn load_history_entry(path: &Path) -> Result<HistoryEntry, String> {
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("Failed to read history file {}: {e}", path.display()))?;

    let entry: HistoryEntry = serde_yaml::from_str(&content)
        .map_err(|e| format!("Failed to parse history file {}: {e}", path.display()))?;

    Ok(entry)
}

/// List all history entry files, sorted by modification time (newest first).
///
/// # Errors
///
/// Returns an error if the history directory cannot be accessed.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn list_history_entries() -> Result<Vec<PathBuf>, String> {
    use super::get_history_dir;

    let history_dir = get_history_dir()?;

    if !history_dir.exists() {
        return Ok(Vec::new());
    }

    let mut read_dir = tokio::fs::read_dir(&history_dir).await.map_err(|e| {
        format!(
            "Failed to read history directory {}: {e}",
            history_dir.display()
        )
    })?;

    // Filter for YAML files and collect paths with metadata
    let mut paths_with_meta: Vec<(PathBuf, std::time::SystemTime)> = Vec::new();

    loop {
        let entry = match read_dir.next_entry().await {
            Ok(Some(entry)) => entry,
            Ok(None) => break,
            Err(e) => return Err(format!("Failed to read directory entry: {e}")),
        };

        let path = entry.path();
        if path
            .extension()
            .is_some_and(|ext| ext == "yaml" || ext == "yml")
        {
            if let Ok(metadata) = entry.metadata().await {
                if let Ok(modified) = metadata.modified() {
                    paths_with_meta.push((path, modified));
                }
            }
        }
    }

    // Sort by modification time (newest first)
    paths_with_meta.sort_by(|a, b| b.1.cmp(&a.1));

    Ok(paths_with_meta.into_iter().map(|(path, _)| path).collect())
}

/// Load history entries from the history directory.
///
/// # Errors
///
/// Returns an error if the history directory cannot be accessed or entries cannot be loaded.
/// Individual entry errors are logged but do not stop the entire operation.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn load_history_entries(limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
    let paths = list_history_entries().await?;

    let limit = limit.unwrap_or(100); // Default to 100 entries
    let paths_to_load = paths.into_iter().take(limit);

    let mut entries = Vec::new();

    for path in paths_to_load {
        match load_history_entry(&path).await {
            Ok(entry) => entries.push(entry),
            Err(e) => {
                // Log error but continue loading other entries
                tracing::warn!(
                    path = %path.display(),
                    error = %e,
                    "Failed to load history entry"
                );
            }
        }
    }

    // Sort by timestamp (newest first) since file modification time might not match
    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(entries)
}

/// Delete a history entry by ID.
///
/// # Errors
///
/// Returns an error if the history entry cannot be found or deleted.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn delete_history_entry_by_id(id: &str) -> Result<(), String> {
    let paths = list_history_entries().await?;

    for path in paths {
        match load_history_entry(&path).await {
            Ok(entry) if entry.id == id => {
                tokio::fs::remove_file(&path).await.map_err(|e| {
                    format!("Failed to delete history file {}: {e}", path.display())
                })?;
                return Ok(());
            }
            Ok(_) | Err(_) => {
                // Skip files that don't match or can't be parsed
            }
        }
    }

    Err(format!("History entry with id '{id}' not found"))
}

/// Delete a history entry by file path.
///
/// # Errors
///
/// Returns an error if the file cannot be deleted.
#[allow(dead_code)] // May be used in future UI features
pub async fn delete_history_entry(path: &Path) -> Result<(), String> {
    tokio::fs::remove_file(path)
        .await
        .map_err(|e| format!("Failed to delete history file {}: {e}", path.display()))?;

    Ok(())
}

/// Clear all history entries.
///
/// # Errors
///
/// Returns an error if the history directory cannot be accessed or cleared.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn clear_history() -> Result<(), String> {
    use super::get_history_dir;

    let history_dir = get_history_dir()?;

    if !history_dir.exists() {
        return Ok(());
    }

    let paths = list_history_entries().await?;

    let mut failed_deletions: usize = 0;

    for path in paths {
        if let Err(e) = tokio::fs::remove_file(&path).await {
            // Log error but continue processing other files
            tracing::warn!(
                path = %path.display(),
                error = %e,
                "Failed to delete history file"
            );
            failed_deletions += 1;
        }
    }

    if failed_deletions > 0 {
        Err(format!(
            "Failed to delete {failed_deletions} history file(s)"
        ))
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::RequestTiming;
    use std::collections::HashMap;
    use std::env;

    fn create_test_entry() -> HistoryEntry {
        let request = RequestParams {
            url: "https://api.example.com/users".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 30000,
        };

        let response = HttpResponse {
            status: 200,
            status_text: "OK".to_string(),
            headers: HashMap::new(),
            body: r#"{"users": []}"#.to_string(),
            timing: RequestTiming::default(),
        };

        HistoryEntry::new(request, response)
    }

    #[test]
    fn test_history_entry_new() {
        let entry = create_test_entry();

        assert!(entry.id.starts_with("hist_"));
        assert_eq!(entry.response.status, 200);
        assert_eq!(entry.request.url, "https://api.example.com/users");
    }

    #[test]
    fn test_history_entry_filename() {
        let entry = create_test_entry();
        let filename = entry.filename();

        assert!(
            std::path::Path::new(&filename)
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("yaml"))
        );
        assert!(filename.contains("GET"));
        assert!(filename.contains("api.example.com"));
    }

    #[tokio::test]
    async fn test_save_and_load_history_entry() {
        let temp_dir = env::temp_dir().join("runi-test-history");
        tokio::fs::create_dir_all(&temp_dir).await.unwrap();

        // Override get_history_dir for test
        // We'll test with a custom path instead

        let entry = create_test_entry();
        let filename = entry.filename();
        let file_path = temp_dir.join(&filename);

        // Save
        let yaml = serde_yaml::to_string(&entry).unwrap();
        tokio::fs::write(&file_path, yaml).await.unwrap();

        // Load
        let loaded = load_history_entry(&file_path).await.unwrap();

        assert_eq!(loaded.id, entry.id);
        assert_eq!(loaded.request.url, entry.request.url);
        assert_eq!(loaded.response.status, entry.response.status);

        // Cleanup
        tokio::fs::remove_dir_all(&temp_dir).await.unwrap();
    }

    #[test]
    fn test_history_entry_serialization() {
        let entry = create_test_entry();

        let yaml = serde_yaml::to_string(&entry).unwrap();
        let parsed: HistoryEntry = serde_yaml::from_str(&yaml).unwrap();

        assert_eq!(entry.id, parsed.id);
        assert_eq!(entry.request.url, parsed.request.url);
        assert_eq!(entry.response.status, parsed.response.status);
    }
}
