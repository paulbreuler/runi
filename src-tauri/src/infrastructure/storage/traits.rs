// Storage trait abstraction for pluggable storage backends

use crate::infrastructure::storage::history::HistoryEntry;
use async_trait::async_trait;

/// Trait for history storage backends.
///
/// This abstraction allows switching between different storage implementations:
/// - Memory storage (default) - Session-only, no persistence, secure
/// - File-based storage (YAML files) - Git-friendly, for export/import
/// - Database storage (`SQLite`, `PostgreSQL`) - For larger datasets (future)
///
/// # Design
///
/// All operations are async and return `Result<T, String>` for consistency
/// with Tauri command patterns. Error messages should be user-friendly.
#[async_trait]
pub trait HistoryStorage: Send + Sync {
    /// Save a history entry.
    ///
    /// # Errors
    ///
    /// Returns an error if the entry cannot be saved.
    async fn save_entry(&self, entry: &HistoryEntry) -> Result<String, String>;

    /// Load history entries with optional limit.
    ///
    /// # Arguments
    ///
    /// * `limit` - Maximum number of entries to load (None = all)
    ///
    /// # Errors
    ///
    /// Returns an error if entries cannot be loaded.
    async fn load_entries(&self, limit: Option<usize>) -> Result<Vec<HistoryEntry>, String>;

    /// Delete a history entry by ID.
    ///
    /// # Errors
    ///
    /// Returns an error if the entry cannot be found or deleted.
    async fn delete_entry(&self, id: &str) -> Result<(), String>;

    /// Clear all history entries.
    ///
    /// # Errors
    ///
    /// Returns an error if entries cannot be cleared.
    async fn clear_all(&self) -> Result<(), String>;

    /// Get the total count of history entries.
    ///
    /// # Errors
    ///
    /// Returns an error if the count cannot be determined.
    async fn count(&self) -> Result<usize, String>;

    /// Get history entry IDs with pagination.
    ///
    /// # Arguments
    ///
    /// * `limit` - Maximum number of IDs to return
    /// * `offset` - Number of IDs to skip (for pagination)
    /// * `sort_desc` - Sort by timestamp descending (newest first) if true
    ///
    /// # Errors
    ///
    /// Returns an error if IDs cannot be retrieved.
    async fn get_ids(
        &self,
        limit: usize,
        offset: usize,
        sort_desc: bool,
    ) -> Result<Vec<String>, String>;

    /// Get history entries by their IDs (batch load).
    ///
    /// # Arguments
    ///
    /// * `ids` - Vector of entry IDs to fetch
    ///
    /// # Errors
    ///
    /// Returns an error if entries cannot be retrieved.
    async fn get_batch(&self, ids: &[String]) -> Result<Vec<HistoryEntry>, String>;
}
