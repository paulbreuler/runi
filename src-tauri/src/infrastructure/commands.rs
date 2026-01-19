// Tauri command handlers

use crate::application::proxy_service::ProxyService;
use crate::domain::http::{HttpResponse, RequestParams};
use crate::domain::models::HelloWorldResponse;
use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::memory_storage::MemoryHistoryStorage;
use crate::infrastructure::storage::traits::HistoryStorage;
use std::sync::{Arc, LazyLock};
use tauri::Emitter;
use tokio::sync::Mutex;

/// Global history storage instance (in-memory by default).
///
/// History lives only for the session duration (Burp Suite behavior). This is more
/// secure as sensitive data (auth tokens, API keys) isn't persisted to disk.
///
/// This can be swapped for `FileHistoryStorage` (for export/import features)
/// via feature flags or configuration in the future.
static HISTORY_STORAGE: LazyLock<Arc<MemoryHistoryStorage>> =
    LazyLock::new(|| Arc::new(MemoryHistoryStorage::new()));

/// Initialize the proxy service
pub fn create_proxy_service() -> Arc<Mutex<ProxyService>> {
    Arc::new(Mutex::new(ProxyService::new()))
}

/// Hello world command handler
#[tauri::command]
pub async fn hello_world(
    _service: tauri::State<'_, Arc<Mutex<ProxyService>>>,
) -> Result<HelloWorldResponse, String> {
    Ok(ProxyService::hello_world())
}

/// Get the operating system platform.
///
/// Returns the platform string: "darwin" (macOS), "win32" (Windows), or "linux" (Linux).
///
/// # Errors
///
/// Returns an error if the platform is not supported.
///
/// # Note
///
/// This function must return `Result<String, String>` to satisfy Tauri's command handler
/// signature requirements, even though it never fails on supported platforms.
#[tauri::command]
#[allow(clippy::unnecessary_wraps)] // Required by Tauri: all commands must return Result<T, String>
pub fn get_platform() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        Ok("darwin".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        Ok("win32".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        Ok("linux".to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported platform".to_string())
    }
}

/// Save a request and response to history.
///
/// Uses the configured storage backend (default: in-memory).
/// Emits a `history:new` event with the new entry for live updates.
///
/// # Errors
///
/// Returns an error if the history entry cannot be saved.
#[tauri::command]
pub async fn save_request_history(
    app: tauri::AppHandle,
    request: RequestParams,
    response: HttpResponse,
) -> Result<String, String> {
    let entry = HistoryEntry::new(request, response);
    let id = HISTORY_STORAGE.save_entry(&entry).await?;

    // Emit event for live updates
    app.emit("history:new", &entry)
        .map_err(|e| format!("Failed to emit history:new event: {e}"))?;

    Ok(id)
}

/// Load recent history entries.
///
/// Uses the configured storage backend (default: in-memory).
///
/// # Arguments
///
/// * `limit` - Maximum number of entries to load (default: 100)
///
/// # Errors
///
/// Returns an error if history entries cannot be loaded.
#[tauri::command]
pub async fn load_request_history(limit: Option<usize>) -> Result<Vec<HistoryEntry>, String> {
    HISTORY_STORAGE.load_entries(limit).await
}

/// Delete a history entry by ID.
///
/// Uses the configured storage backend (default: in-memory).
/// Emits a `history:deleted` event with the deleted ID.
///
/// # Errors
///
/// Returns an error if the history entry cannot be found or deleted.
#[tauri::command]
pub async fn delete_history_entry(app: tauri::AppHandle, id: String) -> Result<(), String> {
    HISTORY_STORAGE.delete_entry(&id).await?;

    // Emit event for live updates
    app.emit("history:deleted", &id)
        .map_err(|e| format!("Failed to emit history:deleted event: {e}"))?;

    Ok(())
}

/// Clear all history entries.
///
/// Uses the configured storage backend (default: in-memory).
/// Emits a `history:cleared` event.
///
/// # Errors
///
/// Returns an error if history entries cannot be cleared.
#[tauri::command]
pub async fn clear_request_history(app: tauri::AppHandle) -> Result<(), String> {
    HISTORY_STORAGE.clear_all().await?;

    // Emit event for live updates
    app.emit("history:cleared", ())
        .map_err(|e| format!("Failed to emit history:cleared event: {e}"))?;

    Ok(())
}

/// Get the total count of history entries.
///
/// # Errors
///
/// Returns an error if the count cannot be determined.
#[tauri::command]
pub async fn get_history_count() -> Result<usize, String> {
    HISTORY_STORAGE.count().await
}

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
#[tauri::command]
pub async fn get_history_ids(
    limit: usize,
    offset: usize,
    sort_desc: bool,
) -> Result<Vec<String>, String> {
    HISTORY_STORAGE.get_ids(limit, offset, sort_desc).await
}

/// Get history entries by their IDs (batch load).
///
/// # Arguments
///
/// * `ids` - Vector of entry IDs to fetch
///
/// # Errors
///
/// Returns an error if entries cannot be retrieved.
#[tauri::command]
pub async fn get_history_batch(ids: Vec<String>) -> Result<Vec<HistoryEntry>, String> {
    HISTORY_STORAGE.get_batch(&ids).await
}

/// Set the log level at runtime.
///
/// Allows changing log levels via UI or MCP commands for debugging.
/// Valid levels: "error", "warn", "info", "debug", "trace"
///
/// # Errors
///
/// Returns an error if the log level string is invalid.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri commands require owned types
pub fn set_log_level(level: String) -> Result<(), String> {
    use crate::infrastructure::logging::set_log_level as set_level;
    use tracing::Level;

    let log_level = match level.to_lowercase().as_str() {
        "error" => Level::ERROR,
        "warn" => Level::WARN,
        "info" => Level::INFO,
        "debug" => Level::DEBUG,
        "trace" => Level::TRACE,
        _ => {
            return Err(format!(
                "Invalid log level: {level}. Must be one of: error, warn, info, debug, trace"
            ));
        }
    };

    set_level(log_level);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use serial_test::serial;
    use std::collections::HashMap;
    use uuid::Uuid;

    /// Create a test request with a unique URL to ensure test isolation.
    fn create_test_request(suffix: &str) -> RequestParams {
        let unique_id = Uuid::new_v4().to_string().replace('-', "")[..8].to_string();
        RequestParams {
            url: format!("https://api.example.com/test-{suffix}-{unique_id}"),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 30000,
        }
    }

    /// Create a test response.
    fn create_test_response() -> HttpResponse {
        HttpResponse {
            status: 200,
            status_text: "OK".to_string(),
            headers: HashMap::new(),
            body: r#"{"test": true}"#.to_string(),
            timing: RequestTiming::default(),
        }
    }

    #[tokio::test]
    async fn test_hello_world_command() {
        // Test the service directly as integration tests will cover the command
        let response = ProxyService::hello_world();
        assert_eq!(response.message, "Hello from Runi!");
    }

    /// Helper to save an entry using the storage directly (for tests)
    async fn save_test_entry(request: RequestParams, response: HttpResponse) -> String {
        let entry = HistoryEntry::new(request, response);
        HISTORY_STORAGE.save_entry(&entry).await.unwrap()
    }

    #[tokio::test]
    #[serial]
    async fn test_save_request_history() {
        let request = create_test_request("save");
        let response = create_test_response();

        let id = save_test_entry(request, response).await;
        assert!(id.starts_with("hist_"), "ID should start with 'hist_'");
    }

    #[tokio::test]
    #[serial]
    async fn test_load_request_history() {
        // Clear history first for isolation
        HISTORY_STORAGE.clear_all().await.unwrap();

        let request = create_test_request("load");
        let response = create_test_response();
        let url = request.url.clone();

        let _ = save_test_entry(request, response).await;

        // Now load it
        let result = load_request_history(Some(10)).await;
        assert!(result.is_ok(), "Should load history entries");
        let entries = result.unwrap();
        assert!(!entries.is_empty(), "Should have at least one entry");

        // Find our entry by unique URL
        let found = entries.iter().find(|e| e.request.url == url);
        assert!(found.is_some(), "Should find the saved entry");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_history_entry() {
        let request = create_test_request("delete");
        let response = create_test_response();

        let id = save_test_entry(request, response).await;

        // Delete it (use storage directly since command needs AppHandle)
        let result = HISTORY_STORAGE.delete_entry(&id).await;
        assert!(result.is_ok(), "Should delete history entry");

        // Verify it's gone
        let result = HISTORY_STORAGE.delete_entry(&id).await;
        assert!(
            result.is_err(),
            "Should error when deleting non-existent entry"
        );
    }

    #[test]
    fn test_set_log_level_valid_levels() {
        use crate::infrastructure::logging::{get_log_level, init_logging};
        use tracing::Level;

        // Initialize logging
        init_logging();

        // Test all valid log levels via the Tauri command (which takes String)
        let test_cases = vec![
            ("error", Level::ERROR),
            ("warn", Level::WARN),
            ("info", Level::INFO),
            ("debug", Level::DEBUG),
            ("trace", Level::TRACE),
            ("ERROR", Level::ERROR), // Test case insensitivity
            ("WARN", Level::WARN),
            ("DEBUG", Level::DEBUG),
        ];

        for (input, expected) in test_cases {
            let result = set_log_level(input.to_string());
            assert!(result.is_ok(), "Should accept valid log level: {input}");

            // Verify the level was actually set
            assert_eq!(
                get_log_level(),
                expected,
                "Level should be set to {expected:?} for input {input}"
            );
        }

        // Reset to INFO
        let _ = set_log_level("info".to_string());
    }

    #[test]
    fn test_set_log_level_invalid_level() {
        let result = set_log_level("invalid".to_string());
        assert!(result.is_err(), "Should reject invalid log level");

        let error = result.unwrap_err();
        assert!(
            error.contains("Invalid log level"),
            "Error message should mention invalid log level"
        );
        assert!(
            error.contains("invalid"),
            "Error message should include the invalid input"
        );
    }

    #[tokio::test]
    #[serial]
    async fn test_clear_request_history() {
        // Clear first for isolation
        HISTORY_STORAGE.clear_all().await.unwrap();

        // Save a few entries
        for i in 0..3 {
            let request = create_test_request(&format!("clear-{i}"));
            let response = create_test_response();
            let _ = save_test_entry(request, response).await;
        }

        // Verify entries were saved
        let entries_before = load_request_history(Some(10)).await.unwrap();
        assert!(
            entries_before.len() >= 3,
            "Should have at least 3 entries before clear"
        );

        // Clear all (use storage directly since command needs AppHandle)
        let result = HISTORY_STORAGE.clear_all().await;
        assert!(result.is_ok(), "Should clear history");

        // Verify history is empty
        let entries_after = load_request_history(Some(10)).await.unwrap();
        assert!(
            entries_after.is_empty(),
            "History should be empty after clear"
        );
    }

    #[tokio::test]
    #[serial]
    async fn test_get_history_count() {
        // Clear first for isolation
        HISTORY_STORAGE.clear_all().await.unwrap();

        assert_eq!(get_history_count().await.unwrap(), 0);

        // Save 3 entries
        for i in 0..3 {
            let request = create_test_request(&format!("count-{i}"));
            let response = create_test_response();
            let _ = save_test_entry(request, response).await;
        }

        assert_eq!(get_history_count().await.unwrap(), 3);
    }

    #[tokio::test]
    #[serial]
    async fn test_get_history_ids() {
        // Clear first for isolation
        HISTORY_STORAGE.clear_all().await.unwrap();

        // Save 5 entries
        let mut saved_ids = Vec::new();
        for i in 0..5 {
            let request = create_test_request(&format!("ids-{i}"));
            let response = create_test_response();
            let id = save_test_entry(request, response).await;
            saved_ids.push(id);
        }

        // Get first page (2 items)
        let page1 = get_history_ids(2, 0, true).await.unwrap();
        assert_eq!(page1.len(), 2);

        // Get second page (2 items)
        let page2 = get_history_ids(2, 2, true).await.unwrap();
        assert_eq!(page2.len(), 2);

        // No overlap
        for id in &page1 {
            assert!(!page2.contains(id));
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_get_history_batch() {
        // Clear first for isolation
        HISTORY_STORAGE.clear_all().await.unwrap();

        // Save 5 entries
        let mut saved_ids = Vec::new();
        for i in 0..5 {
            let request = create_test_request(&format!("batch-{i}"));
            let response = create_test_response();
            let id = save_test_entry(request, response).await;
            saved_ids.push(id);
        }

        // Get batch of specific IDs
        let batch_ids = vec![saved_ids[1].clone(), saved_ids[3].clone()];
        let batch = get_history_batch(batch_ids.clone()).await.unwrap();

        assert_eq!(batch.len(), 2);
        assert!(batch.iter().any(|e| e.id == saved_ids[1]));
        assert!(batch.iter().any(|e| e.id == saved_ids[3]));
    }
}
