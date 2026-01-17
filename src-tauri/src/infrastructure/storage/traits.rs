// Storage trait abstraction for pluggable storage backends

use crate::infrastructure::storage::history::HistoryEntry;
use async_trait::async_trait;

/// Trait for history storage backends.
///
/// This abstraction allows switching between different storage implementations:
/// - File-based storage (YAML files)
/// - Database storage (`SQLite`, `PostgreSQL`)
/// - Graph database storage (`Neo4j`)
/// - Cloud storage (future)
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
}
