// Tauri command handlers

use crate::application::proxy_service::ProxyService;
use crate::domain::http::{HttpResponse, RequestParams};
use crate::domain::models::HelloWorldResponse;
use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::memory_storage::MemoryHistoryStorage;
use crate::infrastructure::storage::traits::HistoryStorage;
use std::sync::{Arc, LazyLock};
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
/// Uses the configured storage backend (default: file-based).
///
/// # Errors
///
/// Returns an error if the history entry cannot be saved.
#[tauri::command]
pub async fn save_request_history(
    request: RequestParams,
    response: HttpResponse,
) -> Result<String, String> {
    let entry = HistoryEntry::new(request, response);
    HISTORY_STORAGE.save_entry(&entry).await
}

/// Load recent history entries.
///
/// Uses the configured storage backend (default: file-based).
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
/// Uses the configured storage backend (default: file-based).
///
/// # Errors
///
/// Returns an error if the history entry cannot be found or deleted.
#[tauri::command]
pub async fn delete_history_entry(id: String) -> Result<(), String> {
    HISTORY_STORAGE.delete_entry(&id).await
}

/// Clear all history entries.
///
/// Uses the configured storage backend (default: file-based).
///
/// # Errors
///
/// Returns an error if history entries cannot be cleared.
#[tauri::command]
pub async fn clear_request_history() -> Result<(), String> {
    HISTORY_STORAGE.clear_all().await
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

    #[tokio::test]
    async fn test_save_request_history() {
        let request = create_test_request("save");
        let response = create_test_response();

        let result = save_request_history(request, response).await;
        assert!(result.is_ok(), "Should save history entry");
        let id = result.unwrap();
        assert!(id.starts_with("hist_"), "ID should start with 'hist_'");
    }

    #[tokio::test]
    async fn test_load_request_history() {
        // Clear history first for isolation
        let _ = clear_request_history().await;

        let request = create_test_request("load");
        let response = create_test_response();
        let url = request.url.clone();

        let _ = save_request_history(request, response).await;

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
    async fn test_delete_history_entry() {
        let request = create_test_request("delete");
        let response = create_test_response();

        let id = save_request_history(request, response).await.unwrap();

        // Delete it
        let result = delete_history_entry(id.clone()).await;
        assert!(result.is_ok(), "Should delete history entry");

        // Verify it's gone
        let result = delete_history_entry(id).await;
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
    async fn test_clear_request_history() {
        // Clear first for isolation
        let _ = clear_request_history().await;

        // Save a few entries
        for i in 0..3 {
            let request = create_test_request(&format!("clear-{i}"));
            let response = create_test_response();
            let _ = save_request_history(request, response).await;
        }

        // Verify entries were saved
        let entries_before = load_request_history(Some(10)).await.unwrap();
        assert!(
            entries_before.len() >= 3,
            "Should have at least 3 entries before clear"
        );

        // Clear all
        let result = clear_request_history().await;
        assert!(result.is_ok(), "Should clear history");

        // Verify history is empty
        let entries_after = load_request_history(Some(10)).await.unwrap();
        assert!(
            entries_after.is_empty(),
            "History should be empty after clear"
        );
    }
}
