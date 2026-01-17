// File-based storage implementation for history

use crate::infrastructure::storage::history::{
    HistoryEntry, clear_history, delete_history_entry_by_id, load_history_entries,
    save_history_entry,
};
use crate::infrastructure::storage::traits::HistoryStorage;
use async_trait::async_trait;

/// File-based storage implementation using YAML files.
///
/// This is the default storage backend, storing entries as individual YAML files
/// in `~/.runi/history/` (or platform equivalent).
///
/// # File Format
///
/// Each entry is stored as a YAML file with the naming scheme:
/// `YYYY-MM-DD-HH-MM-SS-{METHOD}-{sanitized-url}.yaml`
#[derive(Debug, Clone)]
pub struct FileHistoryStorage;

impl FileHistoryStorage {
    /// Create a new file-based storage instance.
    #[must_use]
    pub const fn new() -> Self {
        Self
    }
}

impl Default for FileHistoryStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl HistoryStorage for FileHistoryStorage {
    async fn save_entry(&self, entry: &HistoryEntry) -> Result<String, String> {
        save_history_entry(entry).await?;
        Ok(entry.id.clone())
    }

    async fn load_entries(&self, limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
        load_history_entries(limit).await
    }

    async fn delete_entry(&self, id: &str) -> Result<(), String> {
        delete_history_entry_by_id(id).await
    }

    async fn clear_all(&self) -> Result<(), String> {
        clear_history().await
    }
}
