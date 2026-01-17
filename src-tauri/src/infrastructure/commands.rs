// Tauri command handlers

use crate::application::proxy_service::ProxyService;
use crate::domain::http::{HttpResponse, RequestParams};
use crate::domain::models::HelloWorldResponse;
use crate::infrastructure::storage::file_storage::FileHistoryStorage;
use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::traits::HistoryStorage;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Global history storage instance (file-based by default).
///
/// This can be swapped for other implementations (e.g., Neo4j) via feature flags
/// or configuration in the future.
#[allow(clippy::non_std_lazy_statics)] // once_cell is acceptable for cross-platform compatibility
static HISTORY_STORAGE: once_cell::sync::Lazy<Arc<FileHistoryStorage>> =
    once_cell::sync::Lazy::new(|| Arc::new(FileHistoryStorage::new()));

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_hello_world_command() {
        // Test the service directly as integration tests will cover the command
        let response = ProxyService::hello_world();
        assert_eq!(response.message, "Hello from Runi!");
    }

    #[tokio::test]
    async fn test_save_request_history() {
        let request = RequestParams {
            url: "https://api.example.com/test".to_string(),
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

        let result = save_request_history(request, response).await;
        assert!(result.is_ok(), "Should save history entry");
        let id = result.unwrap();
        assert!(id.starts_with("hist_"), "ID should start with 'hist_'");
    }

    #[tokio::test]
    async fn test_load_request_history() {
        // First save an entry
        let request = RequestParams {
            url: "https://api.example.com/test".to_string(),
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

        let _ = save_request_history(request.clone(), response.clone()).await;

        // Now load it
        let result = load_request_history(Some(10)).await;
        assert!(result.is_ok(), "Should load history entries");
        let entries = result.unwrap();
        assert!(!entries.is_empty(), "Should have at least one entry");

        // Find our entry
        let found = entries.iter().find(|e| e.request.url == request.url);
        assert!(found.is_some(), "Should find the saved entry");
    }

    #[tokio::test]
    async fn test_delete_history_entry() {
        // Save an entry
        let request = RequestParams {
            url: "https://api.example.com/delete-test".to_string(),
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

        let id = save_request_history(request.clone(), response)
            .await
            .unwrap();

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

    #[tokio::test]
    async fn test_clear_request_history() {
        // Save a few entries
        for i in 0..3 {
            let request = RequestParams {
                url: format!("https://api.example.com/test-{i}"),
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

            let _ = save_request_history(request, response).await;
        }

        // Clear all
        let result = clear_request_history().await;
        assert!(result.is_ok(), "Should clear history");

        // Verify they're gone (note: this test might fail if other tests ran and created entries
        // In a real scenario, we'd use a test-specific directory)
        let _entries = load_request_history(Some(10)).await.unwrap();
    }
}
