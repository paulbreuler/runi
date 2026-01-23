// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// In-memory history storage (session-only, Burp Suite behavior)
//
// History lives only for the session duration. This is more secure as
// sensitive data (auth tokens, API keys) isn't persisted to disk.

// Allow significant_drop_tightening: The current pattern with explicit lock guards
// is clearer and more maintainable than the suggested merged pattern.
#![allow(clippy::significant_drop_tightening)]

use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::traits::HistoryStorage;
use async_trait::async_trait;
use std::sync::RwLock;

/// In-memory history storage implementation.
///
/// All history entries are stored in memory and cleared when the application exits.
/// This provides security benefits as sensitive data in request/response headers
/// and bodies is never written to disk.
pub struct MemoryHistoryStorage {
    entries: RwLock<Vec<HistoryEntry>>,
}

impl MemoryHistoryStorage {
    /// Create a new in-memory history storage.
    #[must_use]
    #[allow(clippy::missing_const_for_fn)] // RwLock::new is not const stable
    pub fn new() -> Self {
        Self {
            entries: RwLock::new(Vec::new()),
        }
    }
}

impl Default for MemoryHistoryStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl HistoryStorage for MemoryHistoryStorage {
    /// Save a history entry to memory.
    ///
    /// Entries are stored newest-first for efficient retrieval.
    async fn save_entry(&self, entry: &HistoryEntry) -> Result<String, String> {
        let mut entries = self
            .entries
            .write()
            .map_err(|e| format!("Failed to acquire write lock: {e}"))?;
        entries.insert(0, entry.clone()); // Newest first
        Ok(entry.id.clone())
    }

    /// Load history entries from memory.
    ///
    /// Returns entries sorted by timestamp (newest first).
    async fn load_entries(&self, limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
        let entries = self
            .entries
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {e}"))?;
        let limit = limit.unwrap_or(100);
        Ok(entries.iter().take(limit).cloned().collect())
    }

    /// Delete a history entry by ID.
    async fn delete_entry(&self, id: &str) -> Result<(), String> {
        let mut entries = self
            .entries
            .write()
            .map_err(|e| format!("Failed to acquire write lock: {e}"))?;
        let initial_len = entries.len();
        entries.retain(|e| e.id != id);
        if entries.len() == initial_len {
            Err(format!("History entry with id '{id}' not found"))
        } else {
            Ok(())
        }
    }

    /// Clear all history entries from memory.
    async fn clear_all(&self) -> Result<(), String> {
        let mut entries = self
            .entries
            .write()
            .map_err(|e| format!("Failed to acquire write lock: {e}"))?;
        entries.clear();
        Ok(())
    }

    /// Get the total count of history entries.
    async fn count(&self) -> Result<usize, String> {
        let entries = self
            .entries
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {e}"))?;
        Ok(entries.len())
    }

    /// Get history entry IDs with pagination.
    async fn get_ids(
        &self,
        limit: usize,
        offset: usize,
        sort_desc: bool,
    ) -> Result<Vec<String>, String> {
        let entries = self
            .entries
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {e}"))?;

        // Entries are already sorted newest-first
        if sort_desc {
            Ok(entries
                .iter()
                .skip(offset)
                .take(limit)
                .map(|e| e.id.clone())
                .collect())
        } else {
            // Need to reverse for ascending order
            Ok(entries
                .iter()
                .rev()
                .skip(offset)
                .take(limit)
                .map(|e| e.id.clone())
                .collect())
        }
    }

    /// Get history entries by their IDs (batch load).
    async fn get_batch(&self, ids: &[String]) -> Result<Vec<HistoryEntry>, String> {
        let entries = self
            .entries
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {e}"))?;

        Ok(entries
            .iter()
            .filter(|e| ids.contains(&e.id))
            .cloned()
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use std::collections::HashMap;

    fn create_test_entry(url: &str) -> HistoryEntry {
        let request = RequestParams {
            url: url.to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 30000,
        };

        let response = HttpResponse {
            status: 200,
            status_text: "OK".to_string(),
            headers: HashMap::new(),
            body: r#"{"test": true}"#.to_string(),
            timing: RequestTiming::default(),
        };

        HistoryEntry::new(request, response)
    }

    #[tokio::test]
    async fn test_save_entry() {
        let storage = MemoryHistoryStorage::new();
        let entry = create_test_entry("https://api.example.com/test");

        let result = storage.save_entry(&entry).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), entry.id);
    }

    #[tokio::test]
    async fn test_load_entries() {
        let storage = MemoryHistoryStorage::new();
        let entry1 = create_test_entry("https://api.example.com/test1");
        let entry2 = create_test_entry("https://api.example.com/test2");

        storage.save_entry(&entry1).await.unwrap();
        storage.save_entry(&entry2).await.unwrap();

        let entries = storage.load_entries(None).await.unwrap();
        assert_eq!(entries.len(), 2);
        // Newest first (entry2 was saved last)
        assert_eq!(entries[0].id, entry2.id);
        assert_eq!(entries[1].id, entry1.id);
    }

    #[tokio::test]
    async fn test_load_entries_with_limit() {
        let storage = MemoryHistoryStorage::new();

        for i in 0..10 {
            let entry = create_test_entry(&format!("https://api.example.com/test{i}"));
            storage.save_entry(&entry).await.unwrap();
        }

        let entries = storage.load_entries(Some(5)).await.unwrap();
        assert_eq!(entries.len(), 5);
    }

    #[tokio::test]
    async fn test_delete_entry() {
        let storage = MemoryHistoryStorage::new();
        let entry = create_test_entry("https://api.example.com/test");
        let id = entry.id.clone();

        storage.save_entry(&entry).await.unwrap();
        assert_eq!(storage.load_entries(None).await.unwrap().len(), 1);

        storage.delete_entry(&id).await.unwrap();
        assert_eq!(storage.load_entries(None).await.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_delete_entry_not_found() {
        let storage = MemoryHistoryStorage::new();

        let result = storage.delete_entry("nonexistent").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[tokio::test]
    async fn test_clear_all() {
        let storage = MemoryHistoryStorage::new();

        for i in 0..5 {
            let entry = create_test_entry(&format!("https://api.example.com/test{i}"));
            storage.save_entry(&entry).await.unwrap();
        }

        assert_eq!(storage.load_entries(None).await.unwrap().len(), 5);

        storage.clear_all().await.unwrap();
        assert_eq!(storage.load_entries(None).await.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_default_impl() {
        let storage = MemoryHistoryStorage::default();
        let entries = storage.load_entries(None).await.unwrap();
        assert!(entries.is_empty());
    }
}
