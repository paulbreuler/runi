// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! `SQLite` storage backend for history entries.
//!
//! This module provides a persistent SQLite-based storage implementation
//! for history entries. It's designed for handling large datasets (1M+ entries)
//! with efficient windowed queries.
//!
//! ## Migrations
//!
//! Database schema is managed via migrations. See [`super::migrations`] for details.
//! Migrations are applied automatically when the storage is opened.

// Allow significant_drop_tightening because the lock guards in this module
// are being used correctly. The clippy lint's suggested fix has syntax errors.
#![allow(clippy::significant_drop_tightening)]

use super::history::HistoryEntry;
use super::migrations;
use super::traits::HistoryStorage;
use async_trait::async_trait;
use rusqlite::{Connection, params};
use std::sync::Mutex;

/// SQLite-based history storage.
///
/// This implementation stores history entries in a `SQLite` database file,
/// providing persistence across sessions and efficient queries for large datasets.
///
/// Database schema is managed via migrations - see [`super::migrations`].
pub struct SqliteHistoryStorage {
    /// Database connection wrapped in a mutex for thread safety.
    conn: Mutex<Connection>,
}

impl SqliteHistoryStorage {
    /// Create a new `SQLite` storage at the given path.
    ///
    /// This will:
    /// 1. Open or create the database file
    /// 2. Apply any pending migrations
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be created or migrations fail.
    #[allow(dead_code)] // Will be used when SQLite becomes the default storage
    pub fn new(db_path: &std::path::Path) -> Result<Self, String> {
        let conn = Connection::open(db_path).map_err(|e| {
            format!(
                "Failed to open SQLite database at {}: {e}",
                db_path.display()
            )
        })?;

        // Apply migrations (creates schema if needed)
        migrations::apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Create an in-memory `SQLite` database (for testing).
    ///
    /// # Errors
    ///
    /// Returns an error if the database cannot be created or migrations fail.
    #[cfg(test)]
    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory()
            .map_err(|e| format!("Failed to open in-memory SQLite: {e}"))?;

        // Apply migrations
        migrations::apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Get the current database schema version.
    ///
    /// # Errors
    ///
    /// Returns an error if the version cannot be determined.
    #[allow(dead_code)]
    pub fn schema_version(&self) -> Result<u32, String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Lock poisoned: {e}"))?;

        migrations::get_current_version(&conn)
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

        // Extract denormalized values for efficient filtering
        let method = &entry.request.method;
        let status = entry.response.status;
        let url = &entry.request.url;

        conn.execute(
            r"INSERT OR REPLACE INTO history 
              (id, timestamp, request_json, response_json, method, status, url) 
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                entry.id,
                timestamp,
                request_json,
                response_json,
                method,
                status,
                url
            ],
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

    fn should_run_perf_tests() -> bool {
        std::env::var("RUN_PERF_TESTS")
            .map(|value| value == "1")
            .unwrap_or(false)
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

    // =========================================================================
    // Performance Benchmarks
    // =========================================================================

    /// Helper to create N test entries quickly (without async overhead)
    fn create_n_entries(count: usize) -> Vec<HistoryEntry> {
        (0..count)
            .map(|i| create_test_entry(&format!("perf-{i}")))
            .collect()
    }

    #[tokio::test]
    async fn perf_save_1000_entries() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_save_1000_entries (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(1000);

        let start = std::time::Instant::now();
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }
        let elapsed = start.elapsed();

        println!("Save 1,000 entries: {elapsed:?}");
        // Should complete in under 5 seconds
        assert!(elapsed.as_secs() < 5, "Save 1,000 entries took too long");
        assert_eq!(storage.count().unwrap(), 1000);
    }

    #[tokio::test]
    async fn perf_get_ids_from_10000_entries() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_get_ids_from_10000_entries (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }
        assert_eq!(storage.count().unwrap(), 10000);

        // Benchmark get_ids
        let start = std::time::Instant::now();
        let ids = storage.get_ids(100, 0, true).unwrap();
        let elapsed = start.elapsed();

        println!("Get 100 IDs from 10,000 entries: {elapsed:?}");
        // Should complete in under 50ms (actually much faster)
        assert!(
            elapsed.as_millis() < 50,
            "Get IDs took too long: {elapsed:?}"
        );
        assert_eq!(ids.len(), 100);
    }

    #[tokio::test]
    async fn perf_get_ids_pagination_10000_entries() {
        if !should_run_perf_tests() {
            eprintln!(
                "[TEST] Skipping perf_get_ids_pagination_10000_entries (set RUN_PERF_TESTS=1)"
            );
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }

        // Benchmark paginated get_ids (simulating scrolling)
        let start = std::time::Instant::now();
        for page in 0..10 {
            let _ids = storage.get_ids(100, page * 100, true).unwrap();
        }
        let elapsed = start.elapsed();

        println!("Get 10 pages of 100 IDs each from 10,000 entries: {elapsed:?}");
        // Should complete in under 100ms total
        assert!(
            elapsed.as_millis() < 100,
            "Paginated get_ids took too long: {elapsed:?}"
        );
    }

    #[tokio::test]
    async fn perf_get_batch_100_entries() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_get_batch_100_entries (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);
        let mut saved_ids = Vec::new();

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
            saved_ids.push(entry.id.clone());
        }

        // Get 100 random IDs to fetch
        let batch_ids: Vec<String> = saved_ids.iter().take(100).cloned().collect();

        // Benchmark get_batch
        let start = std::time::Instant::now();
        let batch = storage.get_batch(&batch_ids).unwrap();
        let elapsed = start.elapsed();

        println!("Get batch of 100 entries from 10,000: {elapsed:?}");
        // Should complete in under 50ms
        assert!(
            elapsed.as_millis() < 50,
            "Get batch took too long: {elapsed:?}"
        );
        assert_eq!(batch.len(), 100);
    }

    #[tokio::test]
    async fn perf_load_entries_with_limit() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_load_entries_with_limit (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }

        // Benchmark load_entries with limit
        let start = std::time::Instant::now();
        let loaded = storage.load_entries(Some(100)).await.unwrap();
        let elapsed = start.elapsed();

        println!("Load 100 entries from 10,000: {elapsed:?}");
        // Should complete in under 50ms
        assert!(
            elapsed.as_millis() < 50,
            "Load entries took too long: {elapsed:?}"
        );
        assert_eq!(loaded.len(), 100);
    }

    #[tokio::test]
    async fn perf_count_10000_entries() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_count_10000_entries (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }

        // Benchmark count
        let start = std::time::Instant::now();
        let count = storage.count().unwrap();
        let elapsed = start.elapsed();

        println!("Count 10,000 entries: {elapsed:?}");
        // Should be extremely fast (< 10ms)
        assert!(elapsed.as_millis() < 10, "Count took too long: {elapsed:?}");
        assert_eq!(count, 10000);
    }

    #[tokio::test]
    async fn perf_delete_entry_from_10000() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_delete_entry_from_10000 (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);
        let mut saved_ids = Vec::new();

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
            saved_ids.push(entry.id.clone());
        }

        // Benchmark delete (delete 10 entries)
        let start = std::time::Instant::now();
        for id in saved_ids.iter().take(10) {
            storage.delete_entry(id).await.unwrap();
        }
        let elapsed = start.elapsed();

        println!("Delete 10 entries from 10,000: {elapsed:?}");
        // Should complete in under 50ms
        assert!(
            elapsed.as_millis() < 50,
            "Delete took too long: {elapsed:?}"
        );
        assert_eq!(storage.count().unwrap(), 9990);
    }

    #[tokio::test]
    async fn perf_index_usage_for_sorting() {
        if !should_run_perf_tests() {
            eprintln!("[TEST] Skipping perf_index_usage_for_sorting (set RUN_PERF_TESTS=1)");
            return;
        }
        let storage = SqliteHistoryStorage::in_memory().unwrap();
        let entries = create_n_entries(10000);

        // Save all entries first
        for entry in &entries {
            storage.save_entry(entry).await.unwrap();
        }

        // Test that sorting (ASC vs DESC) is equally fast (index used)
        let start_desc = std::time::Instant::now();
        let _ids_desc = storage.get_ids(100, 0, true).unwrap();
        let elapsed_desc = start_desc.elapsed();

        let start_asc = std::time::Instant::now();
        let _ids_asc = storage.get_ids(100, 0, false).unwrap();
        let elapsed_asc = start_asc.elapsed();

        println!("Get IDs DESC: {elapsed_desc:?}, ASC: {elapsed_asc:?}");

        // Both should be fast
        assert!(elapsed_desc.as_millis() < 50);
        assert!(elapsed_asc.as_millis() < 50);
    }
}
