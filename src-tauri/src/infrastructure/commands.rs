// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Tauri command handlers

use crate::application::proxy_service::ProxyService;
use crate::domain::collection::Collection;
use crate::domain::features::config as feature_config;
use crate::domain::http::{HttpResponse, RequestParams};
use crate::domain::models::HelloWorldResponse;
use crate::infrastructure::spec::converter::convert_to_collection;
use crate::infrastructure::spec::fetcher::fetch_openapi_spec;
use crate::infrastructure::spec::parser::parse_openapi_spec;
use crate::infrastructure::storage::collection_store::{
    CollectionSummary, delete_collection, list_collections, load_collection, save_collection,
};
use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::memory_storage::MemoryHistoryStorage;
use crate::infrastructure::storage::traits::HistoryStorage;
use std::sync::{Arc, LazyLock};
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use tracing::error;

/// Global history storage instance (in-memory by default).
///
/// History lives only for the session duration (Burp Suite behavior). This is more
/// secure as sensitive data (auth tokens, API keys) isn't persisted to disk.
///
/// This can be swapped for `FileHistoryStorage` (for export/import features)
/// via feature flags or configuration in the future.
static HISTORY_STORAGE: LazyLock<Arc<MemoryHistoryStorage>> =
    LazyLock::new(|| Arc::new(MemoryHistoryStorage::new()));

const HTTPBIN_SPEC_URL: &str = "https://httpbin.org/spec.json";

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

/// Get the process startup time (time from process start until Tauri setup completes).
///
/// This measures the time from when the Rust process starts (in `main()`) until the Tauri setup
/// callback completes. This includes:
/// - Rust process initialization
/// - Tauri framework initialization
/// - Plugin initialization
/// - `WebView` creation
///
/// Note: This does NOT include HTML/JS bundle loading time or JavaScript execution time,
/// which are measured separately in the frontend. The total startup time is:
/// `processStartup + frontendStartup` (where frontendStartup = JS load + React mount).
///
/// # Arguments
///
/// * `process_startup_time` - State containing the process startup time in milliseconds
///
/// # Returns
///
/// The process startup time in milliseconds (from process start to Tauri setup completion).
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri command API requires State to be passed by value, not reference
pub fn get_process_startup_time(
    process_startup_time: tauri::State<'_, std::sync::Mutex<f64>>,
) -> Result<f64, String> {
    let time = process_startup_time
        .lock()
        .map_err(|e| format!("Failed to get process startup time: {e}"))?;
    Ok(*time)
}

/// System specifications for performance measurement context.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemSpecs {
    pub cpu_model: String,
    pub cpu_cores: usize,
    pub total_memory_gb: f64,
    pub platform: String,
    pub architecture: String,
    pub build_mode: String,  // "dev" or "release"
    pub bundle_size_mb: f64, // Application bundle size in MB
}

/// Get detailed system specifications.
///
/// Returns CPU model, cores, RAM, platform, architecture, and build mode.
/// This information is used to provide context for startup timing measurements.
///
/// # Returns
///
/// System specifications including CPU model, RAM, and build mode.
///
/// # Errors
///
/// Returns an error if system information cannot be retrieved.
///
/// Note: This function is infallible in practice, but returns `Result` for consistency
/// with other Tauri commands and potential future error cases.
#[tauri::command]
#[allow(clippy::unnecessary_wraps)] // Result return type is for consistency with Tauri command pattern
pub fn get_system_specs() -> Result<SystemSpecs, String> {
    use sysinfo::System;

    let mut system = System::new_all();
    system.refresh_all();

    // Get CPU information
    let cpu_model = if system.cpus().is_empty() {
        "Unknown".to_string()
    } else {
        system.cpus()[0].name().to_string()
    };
    let cpu_cores = system.cpus().len();

    // Get total memory in GB (sysinfo returns memory in KiB)
    let total_memory_kib = system.total_memory();
    // Precision loss is acceptable for memory measurements in GB
    #[allow(clippy::cast_precision_loss)]
    let total_memory_gb = total_memory_kib as f64 / (1024.0 * 1024.0);

    // Get platform
    let platform = if cfg!(target_os = "macos") {
        "darwin".to_string()
    } else if cfg!(target_os = "windows") {
        "win32".to_string()
    } else if cfg!(target_os = "linux") {
        "linux".to_string()
    } else {
        "unknown".to_string()
    };

    // Get architecture
    let architecture = std::env::consts::ARCH.to_string();

    // Get build mode
    let build_mode = if cfg!(debug_assertions) {
        "dev".to_string()
    } else {
        "release".to_string()
    };

    // Get bundle size (executable size)
    // Precision loss is acceptable for file size measurements in MB
    #[allow(clippy::cast_precision_loss)]
    let bundle_size_mb = std::env::current_exe()
        .ok()
        .and_then(|exe_path| std::fs::metadata(&exe_path).ok())
        .map_or(0.0, |metadata| metadata.len() as f64 / (1024.0 * 1024.0));

    Ok(SystemSpecs {
        cpu_model,
        cpu_cores,
        total_memory_gb,
        platform,
        architecture,
        build_mode,
        bundle_size_mb,
    })
}

/// Load feature flag configuration from disk.
///
/// # Errors
///
/// Returns an error if a config file exists but cannot be read or parsed.
#[tauri::command]
pub async fn load_feature_flags() -> Result<serde_json::Value, String> {
    feature_config::load_feature_flags().await
}

/// Get the feature flag config directory path.
///
/// # Errors
///
/// Returns an error if the home directory cannot be resolved.
#[tauri::command]
pub fn get_config_dir() -> Result<String, String> {
    let dir = feature_config::get_config_dir()?;
    Ok(dir.to_string_lossy().to_string())
}

/// Save a collection to disk.
#[tauri::command]
pub async fn cmd_save_collection(collection: Collection) -> Result<String, String> {
    let path = save_collection(&collection)?;
    Ok(path.to_string_lossy().to_string())
}

/// Load a collection by ID.
#[tauri::command]
pub async fn cmd_load_collection(collection_id: String) -> Result<Collection, String> {
    load_collection(&collection_id)
}

/// List all saved collections.
#[tauri::command]
pub async fn cmd_list_collections() -> Result<Vec<CollectionSummary>, String> {
    list_collections()
}

/// Delete a collection by ID.
#[tauri::command]
pub async fn cmd_delete_collection(collection_id: String) -> Result<(), String> {
    delete_collection(&collection_id)
}

/// Convenience command: Add httpbin.org collection.
///
/// # Flow
/// 1. Fetch `OpenAPI` spec from httpbin.org (or use bundled fallback)
/// 2. Parse spec into internal types
/// 3. Convert to Collection format
/// 4. Save to disk
/// 5. Return the new collection
#[tauri::command]
pub async fn cmd_add_httpbin_collection() -> Result<Collection, String> {
    let fetch_result = fetch_openapi_spec(HTTPBIN_SPEC_URL).await?;
    let parsed = parse_openapi_spec(&fetch_result.content)?;
    let collection =
        convert_to_collection(&parsed, &fetch_result.content, &fetch_result.source_url);
    save_collection(&collection)?;
    Ok(collection)
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

/// Log a frontend crash report to the terminal logger.
#[tauri::command]
pub async fn cmd_log_frontend_error(report_json: String) -> Result<(), String> {
    error!("frontend-crash: {report_json}");
    Ok(())
}

/// Write a frontend crash report to a user-selected path.
#[tauri::command]
pub async fn cmd_write_frontend_error_report(
    path: String,
    report_json: String,
) -> Result<(), String> {
    let report_value: serde_json::Value =
        serde_json::from_str(&report_json).map_err(|e| format!("Invalid JSON: {e}"))?;
    let pretty = serde_json::to_string_pretty(&report_value)
        .map_err(|e| format!("Failed to format JSON: {e}"))?;
    let path_buf = std::path::PathBuf::from(&path);
    if let Some(parent) = path_buf.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create report directory: {e}"))?;
    }
    tokio::fs::write(&path_buf, pretty)
        .await
        .map_err(|e| format!("Failed to write report: {e}"))?;
    Ok(())
}

/// Startup timing entry for a single startup event.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct StartupTimingEntry {
    timestamp: String,
    platform: String,
    architecture: String,
    build_mode: String,
    system_specs: SystemSpecs,
    timing: TimingMetrics,
    unit: String,
}

/// Timing metrics for a single startup.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct TimingMetrics {
    #[serde(rename = "processStartup")]
    process_startup: f64,
    #[serde(rename = "domContentLoaded")]
    dom_content_loaded: f64,
    #[serde(rename = "windowLoaded")]
    window_loaded: f64,
    #[serde(rename = "reactMounted")]
    react_mounted: f64,
    total: f64,
}

/// Aggregated timing statistics.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct TimingAggregates {
    last_3: Vec<StartupTimingEntry>,
    average: TimingMetrics,
    count: usize,
}

/// Complete startup timing data with history and aggregates.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct StartupTimingData {
    latest: StartupTimingEntry,
    aggregates: TimingAggregates,
}

/// Write startup timing metrics to a file in the app data directory.
///
/// This command writes startup timing data (Process Startup, `DOMContentLoaded`, Window Load, React Mounted, Total)
/// to `startup-timing.json` in the app's data directory. The file maintains:
/// - The latest startup timing entry
/// - The last 3 startup entries (for recent history)
/// - Aggregated averages across all startups (cumulative)
/// - Total startup count
///
/// Timing breakdown:
/// - `processStartup`: Time from process start (Rust main) until Tauri setup completes
/// - `domContentLoaded`: Time from JS execution start until `DOMContentLoaded` event
/// - `windowLoaded`: Time from JS execution start until window load event
/// - `reactMounted`: Time from JS execution start until React first render
/// - `total`: Complete startup time from process start to React mount (processStartup + reactMounted)
///
/// The file is written to the platform-appropriate app data directory:
/// - macOS: `~/Library/Application Support/com.runi/startup-timing.json`
/// - Linux: `~/.local/share/com.runi/startup-timing.json` or `$XDG_DATA_HOME/com.runi/startup-timing.json`
/// - Windows: `%APPDATA%\com.runi\startup-timing.json`
///
/// # File Format
///
/// The output file has the following structure:
/// ```json
/// {
///   "latest": {
///     "timestamp": "ISO 8601 timestamp",
///     "platform": "darwin",
///     "architecture": "arm64",
///     "timing": {
///       "processStartup": 50.0,
///       "domContentLoaded": 123.45,
///       "windowLoaded": 234.56,
///       "reactMounted": 345.67,
///       "total": 456.78
///     },
///     "unit": "ms"
///   },
///   "aggregates": {
///     "last3": [
///       { /* entry 1 */ },
///       { /* entry 2 */ },
///       { /* entry 3 */ }
///     ],
///     "average": {
///       "processStartup": 48.0,
///       "domContentLoaded": 120.50,
///       "windowLoaded": 230.40,
///       "reactMounted": 340.30,
///       "total": 450.20
///     },
///     "count": 10
///   }
/// }
/// ```
///
/// # Arguments
///
/// * `app` - Tauri app handle for accessing path APIs
/// * `timing` - JSON value containing timing data with structure:
///   ```json
///   {
///     "timestamp": "ISO 8601 timestamp",
///     "platform": "platform string",
///     "architecture": "architecture string",
///     "timing": {
///       "domContentLoaded": 123.45,
///       "windowLoaded": 234.56,
///       "reactMounted": 345.67,
///       "total": 456.78
///     },
///     "unit": "ms"
///   }
///   ```
///
/// # Errors
///
/// Returns an error if the app data directory cannot be determined or the file cannot be written.
/// Errors are silently ignored in production to avoid breaking the app if file write fails.
///
/// # Note
///
/// This function exceeds 100 lines to handle complex backward compatibility with old file formats
/// and cumulative average calculations. The complexity is necessary for maintaining data integrity.
#[tauri::command]
#[allow(clippy::too_many_lines)] // Complex backward compatibility logic requires longer function
pub async fn write_startup_timing(
    app: tauri::AppHandle,
    timing: serde_json::Value,
) -> Result<(), String> {
    // Parse the incoming timing data
    let new_entry: StartupTimingEntry =
        serde_json::from_value(timing).map_err(|e| format!("Failed to parse timing data: {e}"))?;

    // Get app data directory
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    // Ensure directory exists (Tauri v2 doesn't auto-create it)
    tokio::fs::create_dir_all(&app_data_dir)
        .await
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    // Read existing data if file exists
    let timing_file = app_data_dir.join("startup-timing.json");
    // Complex nested parsing for backward compatibility - using match for clarity over map_or
    #[allow(clippy::option_if_let_else)]
    let (previous_count, mut running_totals) = if timing_file.exists() {
        match tokio::fs::read_to_string(&timing_file).await {
            Ok(content) => {
                // Try to parse as new format (with aggregates) or old format (single entry)
                match serde_json::from_str::<StartupTimingData>(&content) {
                    Ok(data) => {
                        // Use previous count and calculate running totals from average * count
                        let count = data.aggregates.count;
                        let avg = &data.aggregates.average;
                        // Precision loss is acceptable for count (max ~2^52 startups before precision issues)
                        // Casting usize to f64 directly (platform-dependent, but acceptable for startup counts)
                        #[allow(clippy::cast_precision_loss)]
                        let count_f64 = count as f64;
                        let totals = TimingMetrics {
                            process_startup: avg.process_startup * count_f64,
                            dom_content_loaded: avg.dom_content_loaded * count_f64,
                            window_loaded: avg.window_loaded * count_f64,
                            react_mounted: avg.react_mounted * count_f64,
                            total: avg.total * count_f64,
                        };
                        (count, totals)
                    }
                    Err(_) => {
                        // Try old format (single entry) - treat as 1 startup
                        // Old format may not have processStartup, buildMode, or systemSpecs
                        // Complex nested parsing for backward compatibility - using match for clarity
                        #[allow(clippy::option_if_let_else)]
                        match serde_json::from_str::<serde_json::Value>(&content) {
                            Ok(json_value) => {
                                // Try to extract timing from old format
                                let timing_obj = json_value
                                    .get("timing")
                                    .or_else(|| json_value.is_object().then_some(&json_value));
                                if let Some(timing_obj) = timing_obj {
                                    let totals = TimingMetrics {
                                        process_startup: timing_obj
                                            .get("processStartup")
                                            .and_then(serde_json::Value::as_f64)
                                            .unwrap_or(0.0),
                                        dom_content_loaded: timing_obj
                                            .get("domContentLoaded")
                                            .and_then(serde_json::Value::as_f64)
                                            .unwrap_or(0.0),
                                        window_loaded: timing_obj
                                            .get("windowLoaded")
                                            .and_then(serde_json::Value::as_f64)
                                            .unwrap_or(0.0),
                                        react_mounted: timing_obj
                                            .get("reactMounted")
                                            .and_then(serde_json::Value::as_f64)
                                            .unwrap_or(0.0),
                                        total: timing_obj
                                            .get("total")
                                            .and_then(serde_json::Value::as_f64)
                                            .unwrap_or(0.0),
                                    };
                                    (1, totals)
                                } else {
                                    (
                                        0,
                                        TimingMetrics {
                                            process_startup: 0.0,
                                            dom_content_loaded: 0.0,
                                            window_loaded: 0.0,
                                            react_mounted: 0.0,
                                            total: 0.0,
                                        },
                                    )
                                }
                            }
                            Err(_) => (
                                0,
                                TimingMetrics {
                                    process_startup: 0.0,
                                    dom_content_loaded: 0.0,
                                    window_loaded: 0.0,
                                    react_mounted: 0.0,
                                    total: 0.0,
                                },
                            ),
                        }
                    }
                }
            }
            Err(_) => (
                0,
                TimingMetrics {
                    process_startup: 0.0,
                    dom_content_loaded: 0.0,
                    window_loaded: 0.0,
                    react_mounted: 0.0,
                    total: 0.0,
                },
            ),
        }
    } else {
        (
            0,
            TimingMetrics {
                process_startup: 0.0,
                dom_content_loaded: 0.0,
                window_loaded: 0.0,
                react_mounted: 0.0,
                total: 0.0,
            },
        )
    };

    // Get last 3 entries from previous data (if available)
    // Complex nested parsing for backward compatibility - using match for clarity
    #[allow(clippy::option_if_let_else)]
    let mut last_3: Vec<StartupTimingEntry> = if timing_file.exists() {
        match tokio::fs::read_to_string(&timing_file).await {
            Ok(content) => {
                match serde_json::from_str::<StartupTimingData>(&content) {
                    Ok(data) => {
                        let mut entries = data.aggregates.last_3.clone();
                        // Only add latest if it's not already in last_3 (avoid duplication)
                        // Check by timestamp to avoid duplicates
                        let latest_timestamp = &data.latest.timestamp;
                        let is_duplicate = entries
                            .iter()
                            .any(|entry| entry.timestamp == *latest_timestamp);
                        if !is_duplicate {
                            entries.push(data.latest);
                        }
                        entries
                    }
                    Err(_) => {
                        // Try to parse as old format (may be missing new fields)
                        // Complex nested parsing for backward compatibility - using match for clarity
                        #[allow(clippy::option_if_let_else)]
                        match serde_json::from_str::<serde_json::Value>(&content) {
                            Ok(json_value) => {
                                // Try to parse as StartupTimingEntry (with defaults for missing fields)
                                // Complex backward compatibility logic - using if let for clarity
                                #[allow(clippy::option_if_let_else)]
                                if let Ok(entry) =
                                    serde_json::from_value::<StartupTimingEntry>(json_value.clone())
                                {
                                    vec![entry]
                                } else {
                                    // Old format - create entry with defaults
                                    if let Some(timing_obj) = json_value.get("timing") {
                                        let timing = TimingMetrics {
                                            process_startup: timing_obj
                                                .get("processStartup")
                                                .and_then(serde_json::Value::as_f64)
                                                .unwrap_or(0.0),
                                            dom_content_loaded: timing_obj
                                                .get("domContentLoaded")
                                                .and_then(serde_json::Value::as_f64)
                                                .unwrap_or(0.0),
                                            window_loaded: timing_obj
                                                .get("windowLoaded")
                                                .and_then(serde_json::Value::as_f64)
                                                .unwrap_or(0.0),
                                            react_mounted: timing_obj
                                                .get("reactMounted")
                                                .and_then(serde_json::Value::as_f64)
                                                .unwrap_or(0.0),
                                            total: timing_obj
                                                .get("total")
                                                .and_then(serde_json::Value::as_f64)
                                                .unwrap_or(0.0),
                                        };
                                        vec![StartupTimingEntry {
                                            timestamp: json_value
                                                .get("timestamp")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or("")
                                                .to_string(),
                                            platform: json_value
                                                .get("platform")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or("unknown")
                                                .to_string(),
                                            architecture: json_value
                                                .get("architecture")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or("unknown")
                                                .to_string(),
                                            build_mode: "unknown".to_string(),
                                            system_specs: SystemSpecs {
                                                cpu_model: "Unknown".to_string(),
                                                cpu_cores: 0,
                                                total_memory_gb: 0.0,
                                                platform: "unknown".to_string(),
                                                architecture: "unknown".to_string(),
                                                build_mode: "unknown".to_string(),
                                                bundle_size_mb: 0.0,
                                            },
                                            timing,
                                            unit: "ms".to_string(),
                                        }]
                                    } else {
                                        Vec::new()
                                    }
                                }
                            }
                            Err(_) => Vec::new(),
                        }
                    }
                }
            }
            Err(_) => Vec::new(),
        }
    } else {
        Vec::new()
    };

    // Add new entry to history
    last_3.push(new_entry.clone());

    // Keep only last 3 entries for history
    if last_3.len() > 3 {
        last_3 = last_3.into_iter().rev().take(3).collect::<Vec<_>>();
        last_3.reverse();
    }

    // Update running totals with new entry
    running_totals.process_startup += new_entry.timing.process_startup;
    running_totals.dom_content_loaded += new_entry.timing.dom_content_loaded;
    running_totals.window_loaded += new_entry.timing.window_loaded;
    running_totals.react_mounted += new_entry.timing.react_mounted;
    running_totals.total += new_entry.timing.total;

    // Calculate new count and averages
    let count = previous_count + 1;
    let avg_process_startup = running_totals.process_startup / count as f64;
    let avg_dom_content_loaded = running_totals.dom_content_loaded / count as f64;
    let avg_window_loaded = running_totals.window_loaded / count as f64;
    let avg_react_mounted = running_totals.react_mounted / count as f64;
    let avg_total = running_totals.total / count as f64;

    // Build the complete data structure
    let timing_data = StartupTimingData {
        latest: new_entry,
        aggregates: TimingAggregates {
            last_3,
            average: TimingMetrics {
                process_startup: avg_process_startup,
                dom_content_loaded: avg_dom_content_loaded,
                window_loaded: avg_window_loaded,
                react_mounted: avg_react_mounted,
                total: avg_total,
            },
            count,
        },
    };

    // Write timing file
    let timing_json = serde_json::to_string_pretty(&timing_data)
        .map_err(|e| format!("Failed to serialize timing data: {e}"))?;

    tokio::fs::write(&timing_file, timing_json.as_bytes())
        .await
        .map_err(|e| format!("Failed to write startup timing file: {e}"))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use crate::infrastructure::storage::collection_store::with_collections_dir_override_async;
    use serial_test::serial;
    use std::collections::HashMap;
    use tempfile::TempDir;
    use uuid::{NoContext, Timestamp, Uuid};

    /// Create a test startup timing entry.
    fn create_test_timing_entry(timestamp: &str, total: f64) -> serde_json::Value {
        serde_json::json!({
            "timestamp": timestamp,
            "platform": "darwin",
            "architecture": "arm64",
            "buildMode": "dev",
            "systemSpecs": {
                "cpuModel": "Test CPU",
                "cpuCores": 4,
                "totalMemoryGb": 8.0,
                "platform": "darwin",
                "architecture": "arm64",
                "buildMode": "dev",
                "bundleSizeMb": 10.0
            },
            "timing": {
                "processStartup": total * 0.1,
                "domContentLoaded": total * 0.3,
                "windowLoaded": total * 0.6,
                "reactMounted": total * 0.9,
                "total": total
            },
            "unit": "ms"
        })
    }

    /// Test that timing data structures serialize/deserialize correctly.
    #[test]
    fn test_timing_data_serialization() {
        let entry = create_test_timing_entry("2026-01-24T12:00:00Z", 100.0);
        // Clone needed because entry is used later in the test
        #[allow(clippy::redundant_clone)]
        let parsed: StartupTimingEntry = serde_json::from_value(entry.clone()).unwrap();
        // Use approximate equality for float comparisons (clippy::float_cmp)
        assert!((parsed.timing.total - 100.0).abs() < f64::EPSILON);
        assert!((parsed.timing.dom_content_loaded - 30.0).abs() < f64::EPSILON);

        // Test that it serializes back with camelCase
        let serialized = serde_json::to_value(&parsed).unwrap();
        assert!(
            serialized
                .get("timing")
                .unwrap()
                .get("domContentLoaded")
                .is_some()
        );
        assert!(serialized.get("timing").unwrap().get("total").is_some());
    }

    /// Test that aggregates calculate correctly.
    #[test]
    fn test_timing_aggregates_calculation() {
        let entries = [
            create_test_timing_entry("2026-01-24T12:00:00Z", 100.0),
            create_test_timing_entry("2026-01-24T13:00:00Z", 200.0),
            create_test_timing_entry("2026-01-24T14:00:00Z", 300.0),
        ];

        let parsed_entries: Vec<StartupTimingEntry> = entries
            .iter()
            .map(|e| {
                // Clone needed because entries array is used later
                #[allow(clippy::redundant_clone)]
                serde_json::from_value(e.clone()).unwrap()
            })
            .collect();

        // Calculate averages manually
        let count = parsed_entries.len();
        // Precision loss is acceptable for count (max 3 entries)
        #[allow(clippy::cast_precision_loss)]
        let avg_total = parsed_entries.iter().map(|e| e.timing.total).sum::<f64>() / count as f64;
        // Use approximate equality for float comparisons (clippy::float_cmp)
        assert!((avg_total - 200.0).abs() < f64::EPSILON);

        // Test last 3 logic
        let last_3: Vec<StartupTimingEntry> = parsed_entries
            .iter()
            .rev()
            .take(3)
            .cloned()
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();
        assert_eq!(last_3.len(), 3);
        // Use approximate equality for float comparisons (clippy::float_cmp)
        assert!((last_3[0].timing.total - 100.0).abs() < f64::EPSILON);
        assert!((last_3[2].timing.total - 300.0).abs() < f64::EPSILON);
    }

    /// Create a test request with a unique URL to ensure test isolation.
    fn create_test_request(suffix: &str) -> RequestParams {
        let unique_id = Uuid::new_v7(Timestamp::now(NoContext))
            .to_string()
            .replace('-', "")[..8]
            .to_string();
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
        for i in 0..5 {
            let request = create_test_request(&format!("ids-{i}"));
            let response = create_test_response();
            save_test_entry(request, response).await;
        }

        // Verify count
        let count = get_history_count().await.unwrap();
        assert_eq!(count, 5);

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

    #[tokio::test]
    #[serial]
    async fn test_cmd_add_httpbin_collection_returns_collection() {
        let temp_dir = TempDir::new().unwrap();
        let result = with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            cmd_add_httpbin_collection().await
        })
        .await;
        let collection = result.unwrap();
        assert!(collection.metadata.name.to_lowercase().contains("httpbin"));
    }
}
