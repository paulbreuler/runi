//! `SQLite` storage backend for history entries.
//!
//! This module provides a persistent SQLite-based storage implementation
//! for history entries. It's designed for handling large datasets (1M+ entries)
//! with efficient windowed queries.

// Allow significant_drop_tightening because the lock guards in this module
// are being used correctly. The clippy lint's suggested fix has syntax errors.
#![allow(clippy::significant_drop_tightening)]

use super::history::HistoryEntry;
use super::traits::HistoryStorage;
use async_trait::async_trait;
use rusqlite::{Connection, params};
use std::sync::Mutex;

/// SQLite-based history storage.
///
/// This implementation stores history entries in a `SQLite` database file,
/// providing persistence across sessions and efficient queries for large datasets.
pub struct SqliteHistoryStorage {
    /// Database connection wrapped in a mutex for thread safety.
    conn: Mutex<Connection>,
}

impl SqliteHistoryStorage {
    /// Create a new `SQLite` storage at the given path.
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be created or initialized.
    #[allow(dead_code)] // Will be used when SQLite becomes the default storage
    pub fn new(db_path: &std::path::Path) -> Result<Self, String> {
        let conn = Connection::open(db_path).map_err(|e| {
            format!(
                "Failed to open SQLite database at {}: {e}",
                db_path.display()
            )
        })?;

        // Initialize the database schema
        Self::init_schema(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Create an in-memory `SQLite` database (for testing).
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be created.
    #[cfg(test)]
    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory()
            .map_err(|e| format!("Failed to open in-memory SQLite: {e}"))?;

        Self::init_schema(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Initialize the database schema.
    fn init_schema(conn: &Connection) -> Result<(), String> {
        conn.execute_batch(
            r"
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                request_json TEXT NOT NULL,
                response_json TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
            ",
        )
        .map_err(|e| format!("Failed to initialize database schema: {e}"))?;

        Ok(())
    }

    /// Get the total count of history entries.
    ///
    /// # Errors
    ///
    /// Returns an error if the count query fails.
    pub fn count(&self) -> Result<usize, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM history", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count entries: {e}"))?;

        // Safe conversion: negative counts are impossible, clamp to 0
        Ok(usize::try_from(count).unwrap_or(0))
    }

    /// Get history entry IDs with pagination and sorting.
    ///
    /// # Arguments
    ///
    /// * `limit` - Maximum number of IDs to return
    /// * `offset` - Number of IDs to skip (for pagination)
    /// * `sort_desc` - Sort by timestamp descending (newest first) if true
    ///
    /// # Errors
    ///
    /// Returns an error if the query fails.
    pub fn get_ids(
        &self,
        limit: usize,
        offset: usize,
        sort_desc: bool,
    ) -> Result<Vec<String>, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let order = if sort_desc { "DESC" } else { "ASC" };
        let sql = format!("SELECT id FROM history ORDER BY timestamp {order} LIMIT ?1 OFFSET ?2");

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| format!("Failed to prepare statement: {e}"))?;

        // Safe: limit/offset are bounded by reasonable values, saturating handles overflow
        let limit_i64 = i64::try_from(limit).unwrap_or(i64::MAX);
        let offset_i64 = i64::try_from(offset).unwrap_or(i64::MAX);

        let ids: Vec<String> = stmt
            .query_map(params![limit_i64, offset_i64], |row| row.get(0))
            .map_err(|e| format!("Failed to query IDs: {e}"))?
            .filter_map(Result::ok)
            .collect();

        Ok(ids)
    }

    /// Get history entries by their IDs (batch load).
    ///
    /// # Arguments
    ///
    /// * `ids` - Vector of entry IDs to fetch
    ///
    /// # Errors
    ///
    /// Returns an error if the query fails.
    pub fn get_batch(&self, ids: &[String]) -> Result<Vec<HistoryEntry>, String> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }

        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        // Build parameterized query for the IDs
        let placeholders: Vec<&str> = ids.iter().map(|_| "?").collect();
        let sql = format!(
            "SELECT id, timestamp, request_json, response_json FROM history WHERE id IN ({}) ORDER BY timestamp DESC",
            placeholders.join(", ")
        );

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| format!("Failed to prepare statement: {e}"))?;

        let mut entries = Vec::new();
        let params: Vec<&dyn rusqlite::ToSql> =
            ids.iter().map(|s| s as &dyn rusqlite::ToSql).collect();

        let mut rows = stmt
            .query(params.as_slice())
            .map_err(|e| format!("Failed to query entries: {e}"))?;

        while let Some(row) = rows
            .next()
            .map_err(|e| format!("Failed to fetch row: {e}"))?
        {
            let entry = Self::row_to_entry(row)?;
            entries.push(entry);
        }

        Ok(entries)
    }

    /// Convert a database row to a `HistoryEntry`.
    fn row_to_entry(row: &rusqlite::Row) -> Result<HistoryEntry, String> {
        let id: String = row.get(0).map_err(|e| format!("Failed to get id: {e}"))?;
        let timestamp_str: String = row
            .get(1)
            .map_err(|e| format!("Failed to get timestamp: {e}"))?;
        let request_json: String = row
            .get(2)
            .map_err(|e| format!("Failed to get request: {e}"))?;
        let response_json: String = row
            .get(3)
            .map_err(|e| format!("Failed to get response: {e}"))?;

        let timestamp = chrono::DateTime::parse_from_rfc3339(&timestamp_str)
            .map_err(|e| format!("Failed to parse timestamp: {e}"))?
            .with_timezone(&chrono::Utc);

        let request = serde_json::from_str(&request_json)
            .map_err(|e| format!("Failed to parse request JSON: {e}"))?;

        let response = serde_json::from_str(&response_json)
            .map_err(|e| format!("Failed to parse response JSON: {e}"))?;

        Ok(HistoryEntry {
            id,
            timestamp,
            request,
            response,
        })
    }
}

#[async_trait]
impl HistoryStorage for SqliteHistoryStorage {
    async fn save_entry(&self, entry: &HistoryEntry) -> Result<String, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let timestamp = entry.timestamp.to_rfc3339();
        let request_json = serde_json::to_string(&entry.request)
            .map_err(|e| format!("Failed to serialize request: {e}"))?;
        let response_json = serde_json::to_string(&entry.response)
            .map_err(|e| format!("Failed to serialize response: {e}"))?;

        conn.execute(
            "INSERT OR REPLACE INTO history (id, timestamp, request_json, response_json) VALUES (?1, ?2, ?3, ?4)",
            params![entry.id, timestamp, request_json, response_json],
        )
        .map_err(|e| format!("Failed to save entry: {e}"))?;

        Ok(entry.id.clone())
    }

    async fn load_entries(&self, limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let limit = limit.unwrap_or(100);
        let limit_i64 = i64::try_from(limit).unwrap_or(i64::MAX);
        let sql = "SELECT id, timestamp, request_json, response_json FROM history ORDER BY timestamp DESC LIMIT ?1";

        let mut stmt = conn
            .prepare(sql)
            .map_err(|e| format!("Failed to prepare statement: {e}"))?;

        let mut entries = Vec::new();
        let mut rows = stmt
            .query(params![limit_i64])
            .map_err(|e| format!("Failed to query entries: {e}"))?;

        while let Some(row) = rows
            .next()
            .map_err(|e| format!("Failed to fetch row: {e}"))?
        {
            let entry = Self::row_to_entry(row)?;
            entries.push(entry);
        }

        Ok(entries)
    }

    async fn delete_entry(&self, id: &str) -> Result<(), String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        let affected = conn
            .execute("DELETE FROM history WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete entry: {e}"))?;

        if affected == 0 {
            Err(format!("History entry with id '{id}' not found"))
        } else {
            Ok(())
        }
    }

    async fn clear_all(&self) -> Result<(), String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        conn.execute("DELETE FROM history", [])
            .map_err(|e| format!("Failed to clear history: {e}"))?;

        Ok(())
    }

    async fn count(&self) -> Result<usize, String> {
        // Delegate to sync implementation
        Self::count(self)
    }

    async fn get_ids(
        &self,
        limit: usize,
        offset: usize,
        sort_desc: bool,
    ) -> Result<Vec<String>, String> {
        // Delegate to sync implementation
        Self::get_ids(self, limit, offset, sort_desc)
    }

    async fn get_batch(&self, ids: &[String]) -> Result<Vec<HistoryEntry>, String> {
        // Delegate to sync implementation
        Self::get_batch(self, ids)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use std::collections::HashMap;

    fn create_test_entry(id_suffix: &str) -> HistoryEntry {
        let request = RequestParams {
            url: format!("https://api.example.com/users/{id_suffix}"),
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

    #[tokio::test]
    async fn test_create_database() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        assert_eq!(storage.count().unwrap(), 0);
    }

    #[tokio::test]
    async fn test_save_and_load_entry() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entry = create_test_entry("1");

        // Save
        let saved_id = storage.save_entry(&entry).await.unwrap();
        assert_eq!(saved_id, entry.id);

        // Load
        let loaded = storage.load_entries(Some(10)).await.unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, entry.id);
        assert_eq!(loaded[0].request.url, entry.request.url);
    }

    #[tokio::test]
    async fn test_load_entries_with_limit() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();

        // Save 5 entries
        for i in 0..5 {
            let entry = create_test_entry(&format!("{i}"));
            storage.save_entry(&entry).await.unwrap();
        }

        // Load with limit
        let loaded = storage.load_entries(Some(3)).await.unwrap();
        assert_eq!(loaded.len(), 3);
    }

    #[tokio::test]
    async fn test_delete_entry() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entry = create_test_entry("1");

        storage.save_entry(&entry).await.unwrap();
        assert_eq!(storage.count().unwrap(), 1);

        storage.delete_entry(&entry.id).await.unwrap();
        assert_eq!(storage.count().unwrap(), 0);
    }

    #[tokio::test]
    async fn test_delete_nonexistent_entry() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();

        let result = storage.delete_entry("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_clear_all() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();

        // Save 3 entries
        for i in 0..3 {
            let entry = create_test_entry(&format!("{i}"));
            storage.save_entry(&entry).await.unwrap();
        }
        assert_eq!(storage.count().unwrap(), 3);

        // Clear all
        storage.clear_all().await.unwrap();
        assert_eq!(storage.count().unwrap(), 0);
    }

    #[tokio::test]
    async fn test_get_ids_pagination() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();

        // Save 10 entries
        for i in 0..10 {
            let entry = create_test_entry(&format!("{i}"));
            storage.save_entry(&entry).await.unwrap();
            // Small delay to ensure different timestamps
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }

        // Verify count
        assert_eq!(storage.count().unwrap(), 10);

        // Get first page
        let page1 = storage.get_ids(5, 0, true).unwrap();
        assert_eq!(page1.len(), 5);

        // Get second page
        let page2 = storage.get_ids(5, 5, true).unwrap();
        assert_eq!(page2.len(), 5);

        // No overlap between pages
        for id in &page1 {
            assert!(!page2.contains(id));
        }
    }

    #[tokio::test]
    async fn test_get_batch() {
        let storage = SqliteHistoryStorage::in_memory().unwrap();

        // Save 5 entries
        let mut saved_ids = Vec::new();
        for i in 0..5 {
            let entry = create_test_entry(&format!("{i}"));
            storage.save_entry(&entry).await.unwrap();
            saved_ids.push(entry.id);
        }

        // Get batch of specific IDs
        let batch_ids = vec![saved_ids[1].clone(), saved_ids[3].clone()];
        let batch = storage.get_batch(&batch_ids).unwrap();

        assert_eq!(batch.len(), 2);
        assert!(batch.iter().any(|e| e.id == saved_ids[1]));
        assert!(batch.iter().any(|e| e.id == saved_ids[3]));
    }

    #[tokio::test]
    async fn test_concurrent_access() {
        use std::sync::Arc;

        let storage = Arc::new(SqliteHistoryStorage::in_memory().unwrap());

        // Spawn multiple tasks to save entries concurrently
        let mut handles = Vec::new();
        for i in 0..10 {
            let storage_clone = Arc::clone(&storage);
            let handle = tokio::spawn(async move {
                let entry = create_test_entry(&format!("{i}"));
                storage_clone.save_entry(&entry).await
            });
            handles.push(handle);
        }

        // Wait for all tasks to complete
        for handle in handles {
            handle.await.unwrap().unwrap();
        }

        // All entries should be saved
        assert_eq!(storage.count().unwrap(), 10);
    }
}
