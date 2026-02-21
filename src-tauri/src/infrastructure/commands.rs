// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Tauri command handlers

use std::collections::{BTreeMap, HashMap};
use std::path::PathBuf;
use std::sync::{Arc, LazyLock};

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{Emitter, Manager};
use tokio::sync::{Mutex, RwLock};
use tracing::error;
use ts_rs::TS;

use crate::application::import_service::{ImportOverrides, ImportService};
use crate::application::proxy_service::ProxyService;
use crate::domain::canvas_state::CanvasStateSnapshot;
use crate::domain::collection::spec_port::SpecSource;
use crate::domain::collection::{
    BodyType, Collection, CollectionEnvironment, CollectionRequest, RequestBody, SpecBinding,
};
use crate::domain::features::config as feature_config;
use crate::domain::http::{HttpResponse, RequestParams};
use crate::domain::mcp::events::{Actor, EventEmitter, EventEnvelope};
use crate::domain::models::HelloWorldResponse;
use crate::infrastructure::git::GitCliAdapter;
use crate::infrastructure::mcp::events::TauriEventEmitter;
use crate::infrastructure::spec::http_fetcher::HttpContentFetcher;
use crate::infrastructure::spec::openapi_parser::OpenApiParser;
use crate::infrastructure::storage::collection_store::{
    CollectionSummary, delete_collection, list_collections, load_collection, open_collection_file,
    save_collection,
};
use crate::infrastructure::storage::history::HistoryEntry;
use crate::infrastructure::storage::memory_storage::MemoryHistoryStorage;
use crate::infrastructure::storage::traits::HistoryStorage;

/// Global history storage instance (in-memory by default).
///
/// History lives only for the session duration (Burp Suite behavior). This is more
/// secure as sensitive data (auth tokens, API keys) isn't persisted to disk.
///
/// This can be swapped for `FileHistoryStorage` (for export/import features)
/// via feature flags or configuration in the future.
static HISTORY_STORAGE: LazyLock<Arc<MemoryHistoryStorage>> =
    LazyLock::new(|| Arc::new(MemoryHistoryStorage::new()));

/// Managed state type for canvas state snapshots.
///
/// The frontend pushes canvas state updates to this shared state via the
/// `sync_canvas_state` command. MCP tools read from this state to understand
/// the user's current context.
pub type CanvasStateHandle = Arc<RwLock<CanvasStateSnapshot>>;

/// Session-scoped drift review state.
///
/// Stores the review decision (accepted/ignored) for each drift change identified
/// by key `"{collection_id}:{method}:{path}"`. Values are `"accepted"` or `"ignored"`.
/// Entries absent from the map are implicitly `"pending"`.
pub type DriftReviewStore = Arc<Mutex<std::collections::HashMap<String, String>>>;

const HTTPBIN_SPEC_URL: &str = "https://httpbin.org/spec.json";

/// Request payload for the generic import command.
///
/// Exactly one of `url`, `file_path`, or `inline_content` must be provided.
/// Optional fields allow display-name overrides and git-tracking metadata.
#[derive(Debug, Clone, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ImportCollectionRequest {
    /// URL to fetch the spec from.
    pub url: Option<String>,
    /// Local filesystem path to the spec file.
    pub file_path: Option<String>,
    /// Raw spec content (for testing or piped input).
    pub inline_content: Option<String>,
    /// Override the collection display name.
    pub display_name: Option<String>,
    /// Git repo root for tracking.
    pub repo_root: Option<String>,
    /// Relative path to spec within repo.
    pub spec_path: Option<String>,
    /// Git ref (branch/tag/commit) being tracked.
    pub ref_name: Option<String>,
}

/// Substring matched against `save_collection` errors to detect name collisions.
const ERR_COLLECTION_ALREADY_EXISTS: &str = "already exists";

/// Import a collection from any supported spec format.
///
/// Thin shell: validates input, constructs domain types, delegates to `ImportService`,
/// persists via `CollectionStore`, and returns the result.
///
/// # Errors
///
/// Returns an error if no source is provided, the spec cannot be fetched/parsed,
/// or the collection cannot be saved.
pub async fn import_collection_inner(
    request: ImportCollectionRequest,
) -> Result<Collection, String> {
    // Validate: exactly one source must be provided
    let source = match (&request.url, &request.file_path, &request.inline_content) {
        (Some(url), None, None) => SpecSource::Url(url.clone()),
        (None, Some(path), None) => SpecSource::File(PathBuf::from(path)),
        (None, None, Some(content)) => SpecSource::Inline(content.clone()),
        _ => {
            return Err(
                "Must provide exactly one of url, file_path, or inline_content".to_string(),
            );
        }
    };

    let overrides = ImportOverrides {
        display_name: request.display_name,
        repo_root: request.repo_root,
        spec_path: request.spec_path,
        ref_name: request.ref_name,
    };

    let service = if overrides.repo_root.is_some() {
        ImportService::with_git_metadata(
            vec![Box::new(OpenApiParser)],
            Box::new(HttpContentFetcher),
            Box::new(GitCliAdapter),
        )
    } else {
        ImportService::new(vec![Box::new(OpenApiParser)], Box::new(HttpContentFetcher))
    };
    let mut collection = service.import(source, overrides).await?;
    // On name collision, append the spec version to disambiguate (e.g., "Bookshelf API (0.2.0)").
    match save_collection(&collection) {
        Ok(_) => {}
        Err(ref e) if e.contains(ERR_COLLECTION_ALREADY_EXISTS) => {
            if let Some(ref version) = collection.source.spec_version.clone() {
                let versioned_name = format!("{} ({})", collection.metadata.name, version);
                collection.id = Collection::generate_id(&versioned_name);
                collection.metadata.name = versioned_name;
                save_collection(&collection)?;
            } else {
                return Err(e.clone());
            }
        }
        Err(e) => return Err(e),
    }
    Ok(collection)
}

/// Generic import command: import a collection from URL, file, or inline content.
///
/// Emits `collection:created` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_import_collection(
    app: tauri::AppHandle,
    request: ImportCollectionRequest,
) -> Result<Collection, String> {
    let collection = import_collection_inner(request).await?;

    emit_collection_event(
        &app,
        "collection:created",
        &Actor::User,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
    Ok(collection)
}

/// Extract the path portion from a URL or template URL.
///
/// Handles various input formats:
/// - Full URLs: `https://api.example.com/users` → `/users`
/// - Template URLs: `{{baseUrl}}/users` → `/users`
/// - Paths: `/users` → `/users` (passthrough)
/// - Root URLs: `https://api.example.com` → `/`
///
/// This is used when building old endpoints from collection requests for drift detection,
/// ensuring path-only comparisons match the new spec's path format.
fn extract_path_from_url(url: &str) -> String {
    let raw = {
        // 1. If already starts with `/`, it's a path — return as-is
        if url.starts_with('/') {
            url.to_string()
        }
        // 2. If starts with `{{`, extract from first `/` after `}}`
        else if url.starts_with("{{") {
            url.find("}}").map_or_else(
                || format!("/{url}"),
                |end_idx| {
                    let after_template = &url[end_idx + 2..];
                    after_template.find('/').map_or_else(
                        || format!("/{after_template}"),
                        |slash_idx| after_template[slash_idx..].to_string(),
                    )
                },
            )
        }
        // 3. If contains `://` (any scheme), extract path after authority
        else if let Some(scheme_end) = url.find("://") {
            let after_scheme = &url[scheme_end + 3..];
            // Find first `/` after authority (host:port)
            after_scheme.find('/').map_or_else(
                || "/".to_string(),
                |slash_idx| after_scheme[slash_idx..].to_string(),
            )
        }
        // 4. Fallback: prepend `/` to make it a path
        else {
            format!("/{url}")
        }
    };

    // Strip query string and fragment (OpenAPI paths never include these)
    raw.split(['?', '#']).next().unwrap_or(&raw).to_string()
}

/// Refresh a collection's spec from its tracked source (core logic, no `AppHandle`).
///
/// Re-fetches the spec, computes hash for fast-path skip, then structural drift
/// if content changed. Updates the collection's `source.hash` and `source.fetched_at`.
///
/// # Errors
///
/// Returns an error if:
/// - Collection not found
/// - Collection has no tracked spec source (no URL)
/// - Re-fetch fails
/// - Re-parse fails
// Used by tests; production path goes through `_with_source` directly.
#[allow(dead_code)]
pub async fn refresh_collection_spec_inner(
    collection_id: &str,
    service: &ImportService,
) -> Result<crate::domain::collection::drift::SpecRefreshResult, String> {
    refresh_collection_spec_inner_with_source(collection_id, service, None).await
}

/// Refresh a collection spec, optionally overriding the source with a new path.
///
/// If `override_source` is provided it is used instead of the stored source
/// (useful for "compare v1 collection against v2.json").
///
/// # Errors
///
/// Returns an error if:
/// - The collection cannot be found or loaded
/// - No source can be resolved (`override_source` is `None` and the collection has no stored URL)
/// - Re-fetching the spec content fails
/// - Re-parsing the new spec content fails
/// - The collection cannot be saved after the update
pub async fn refresh_collection_spec_inner_with_source(
    collection_id: &str,
    service: &ImportService,
    override_source: Option<&str>,
) -> Result<crate::domain::collection::drift::SpecRefreshResult, String> {
    use crate::domain::collection::drift::compute_drift;
    use crate::domain::collection::spec_port::SpecSource;
    use crate::infrastructure::spec::hasher::compute_spec_hash;

    // 1. Load collection
    let mut collection = load_collection(collection_id)?;

    // 2. Resolve source — override > stored url/path
    let source_str = override_source
        .or(collection.source.url.as_deref())
        .ok_or_else(|| "Collection has no tracked spec source".to_string())?;

    // 3. Route to File or URL: treat anything containing a scheme separator as a URL
    let spec_source = if source_str.contains("://") {
        SpecSource::Url(source_str.to_string())
    } else {
        SpecSource::File(std::path::PathBuf::from(source_str))
    };

    // 4. Re-fetch content
    let fetch_result = service.fetcher().fetch(&spec_source).await?;

    // 5. Compute new hash — fast path if unchanged
    let new_hash = format!("sha256:{}", compute_spec_hash(&fetch_result.content));
    if collection.source.hash.as_deref() == Some(&new_hash) {
        // Fast path: hash unchanged, but update metadata
        let now = chrono::Utc::now();
        collection.source.fetched_at = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

        // Update source_commit if repo_root is tracked
        if let Some(repo_root) = &collection.source.repo_root {
            if let Some(sha) =
                service.resolve_git_commit(repo_root, collection.source.ref_name.as_deref())
            {
                collection.source.source_commit = Some(sha);
            }
        }

        save_collection(&collection)?;
        return Ok(crate::domain::collection::drift::SpecRefreshResult {
            changed: false,
            operations_added: vec![],
            operations_removed: vec![],
            operations_changed: vec![],
        });
    }

    // 5. Re-parse new content into ParsedSpec
    let new_spec = service.parse_content(&fetch_result.content)?;

    // 6. Reconstruct old spec endpoints from collection's requests
    let old_endpoints: Vec<crate::domain::collection::spec_port::ParsedEndpoint> = collection
        .requests
        .iter()
        .map(|req| {
            // Use binding path/method if available, otherwise fall back to request fields
            // Extract path portion from URL to ensure path-only comparison with new spec
            let path = req
                .binding
                .path
                .clone()
                .unwrap_or_else(|| extract_path_from_url(&req.url));
            let method = req
                .binding
                .method
                .clone()
                .unwrap_or_else(|| req.method.clone());

            crate::domain::collection::spec_port::ParsedEndpoint {
                operation_id: req.binding.operation_id.clone(),
                method,
                path,
                summary: Some(req.name.clone()),
                description: req.docs.clone(),
                tags: req.tags.clone(),
                parameters: req
                    .params
                    .iter()
                    .map(|p| crate::domain::collection::spec_port::ParsedParameter {
                        name: p.key.clone(),
                        location: crate::domain::collection::spec_port::ParameterLocation::Query,
                        required: false,
                        schema_type: None,
                        default_value: Some(p.value.clone()),
                        description: None,
                    })
                    .collect(),
                request_body: None,
                deprecated: false,
                is_streaming: req.is_streaming,
            }
        })
        .collect();

    let old_spec = crate::domain::collection::spec_port::ParsedSpec {
        title: collection.metadata.name.clone(),
        version: collection.source.spec_version.clone(),
        description: collection.metadata.description.clone(),
        base_urls: vec![],
        endpoints: old_endpoints,
        auth_schemes: vec![],
        variables: std::collections::BTreeMap::new(),
    };

    // 7. Compute drift
    let drift = compute_drift(&old_spec, &new_spec);

    // 8. Update source metadata
    let now = chrono::Utc::now();
    collection.source.hash = Some(new_hash);
    collection.source.fetched_at = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // 8b. Update source_commit if repo_root is tracked
    if let Some(repo_root) = &collection.source.repo_root {
        if let Some(sha) =
            service.resolve_git_commit(repo_root, collection.source.ref_name.as_deref())
        {
            collection.source.source_commit = Some(sha);
        }
    }

    // 9. Persist
    save_collection(&collection)?;

    Ok(drift)
}

/// Refresh a collection's spec and compute drift delta.
///
/// Emits `collection:refreshed` with the full `SpecRefreshResult` payload (plus
/// `collection_id`) using `Actor::User` on success. Auto-creates suggestions for
/// each breaking change (removed operation → `drift_fix`) and each changed
/// operation → `optimization`).
#[tauri::command]
pub async fn cmd_refresh_collection_spec(
    app: tauri::AppHandle,
    collection_id: String,
    new_spec_path: Option<String>,
    suggestion_svc: tauri::State<'_, SuggestionServiceHandle>,
) -> Result<crate::domain::collection::drift::SpecRefreshResult, String> {
    // Check if collection has repo_root to decide if git adapter is needed
    let needs_git = load_collection(&collection_id)
        .map(|c| c.source.repo_root.is_some())
        .unwrap_or(false);

    let service = if needs_git {
        ImportService::with_git_metadata(
            vec![Box::new(OpenApiParser)],
            Box::new(HttpContentFetcher),
            Box::new(GitCliAdapter),
        )
    } else {
        ImportService::new(vec![Box::new(OpenApiParser)], Box::new(HttpContentFetcher))
    };
    let result = refresh_collection_spec_inner_with_source(
        &collection_id,
        &service,
        new_spec_path.as_deref(),
    )
    .await?;

    // Emit full result payload (not just {id, changed})
    let mut payload = serde_json::to_value(&result).unwrap_or_else(|_| serde_json::json!({}));
    if let serde_json::Value::Object(ref mut map) = payload {
        map.insert(
            "collection_id".to_string(),
            serde_json::Value::String(collection_id.clone()),
        );
    }
    emit_collection_event(&app, "collection:refreshed", &Actor::User, payload);

    // Auto-create suggestions and emit suggestion:created events for each
    auto_create_drift_suggestions(&result, &collection_id, &suggestion_svc, &app);

    Ok(result)
}

/// Create suggestions from drift results — one `drift_fix` per removed operation
/// (breaking change) and one `optimization` per changed operation.
/// Emits `suggestion:created` for each suggestion so the frontend updates in real-time.
pub fn auto_create_drift_suggestions(
    result: &crate::domain::collection::drift::SpecRefreshResult,
    collection_id: &str,
    svc: &crate::application::suggestion_service::SuggestionService,
    app: &tauri::AppHandle,
) {
    use crate::domain::suggestion::{CreateSuggestionRequest, SuggestionType};

    for op in &result.operations_removed {
        let req = CreateSuggestionRequest {
            suggestion_type: SuggestionType::DriftFix,
            title: format!("Breaking change: {} {} removed", op.method, op.path),
            description: format!(
                "The operation {} {} was present in the previous spec but is missing from the \
                 updated spec. This is a breaking change for API consumers.",
                op.method, op.path
            ),
            source: "runi-drift-detector".to_string(),
            collection_id: Some(collection_id.to_string()),
            request_id: None,
            endpoint: Some(format!("{} {}", op.method, op.path)),
            action: format!(
                "Review removal of {} {} and update affected requests",
                op.method, op.path
            ),
        };
        match svc.create_suggestion(&req) {
            Ok(suggestion) => emit_suggestion_created(app, &suggestion),
            Err(e) => tracing::warn!("Failed to auto-create drift_fix suggestion: {e}"),
        }
    }

    for op in &result.operations_changed {
        let req = CreateSuggestionRequest {
            suggestion_type: SuggestionType::Optimization,
            title: format!("Spec change detected: {} {}", op.method, op.path),
            description: format!(
                "The operation {} {} changed in the updated spec. Fields affected: {}.",
                op.method,
                op.path,
                op.changes.join(", ")
            ),
            source: "runi-drift-detector".to_string(),
            collection_id: Some(collection_id.to_string()),
            request_id: None,
            endpoint: Some(format!("{} {}", op.method, op.path)),
            action: format!(
                "Review changes to {} {} and update requests if needed",
                op.method, op.path
            ),
        };
        match svc.create_suggestion(&req) {
            Ok(suggestion) => emit_suggestion_created(app, &suggestion),
            Err(e) => tracing::warn!("Failed to auto-create optimization suggestion: {e}"),
        }
    }
}

/// Emit a `suggestion:created` event wrapped in an [`EventEnvelope`].
fn emit_suggestion_created(
    app: &tauri::AppHandle,
    suggestion: &crate::domain::suggestion::Suggestion,
) {
    if let Ok(payload) = serde_json::to_value(suggestion) {
        let envelope = EventEnvelope {
            actor: Actor::System,
            timestamp: chrono::Utc::now().to_rfc3339(),
            correlation_id: None,
            lamport: None,
            payload,
        };
        if let Ok(v) = serde_json::to_value(&envelope) {
            if let Err(e) = app.emit("suggestion:created", &v) {
                tracing::warn!("Failed to emit suggestion:created event: {e}");
            }
        }
    }
}

/// Emit a collection event wrapped in an [`EventEnvelope`].
fn emit_collection_event(
    app: &tauri::AppHandle,
    event_name: &str,
    actor: &Actor,
    payload: serde_json::Value,
) {
    let emitter = TauriEventEmitter::new(app.clone());
    emitter.emit_event(event_name, actor, payload);
}

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

    // Get total memory in GB (sysinfo returns memory in bytes)
    let total_memory_bytes = system.total_memory();
    // Precision loss is acceptable for memory measurements in GB
    #[allow(clippy::cast_precision_loss)]
    let total_memory_gb = total_memory_bytes as f64 / (1024.0 * 1024.0 * 1024.0);

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

/// Create a new empty collection with the given name.
///
/// Builds a `Collection` via `Collection::new(name)`, persists it to disk,
/// and returns the saved collection.
pub fn create_collection_inner(name: &str) -> Result<Collection, String> {
    let collection = Collection::new(name);
    save_collection(&collection)?;
    Ok(collection)
}

/// Create a new empty collection.
///
/// Emits `collection:created` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_create_collection(
    app: tauri::AppHandle,
    name: String,
) -> Result<Collection, String> {
    let collection = create_collection_inner(&name)?;
    emit_collection_event(
        &app,
        "collection:created",
        &Actor::User,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
    Ok(collection)
}

/// Open an existing runi collection `.yaml` file from an arbitrary disk path.
///
/// Reads the file, validates it, assigns a new ID, and saves it into
/// the managed collections directory.
pub fn open_collection_file_inner(path: &str) -> Result<Collection, String> {
    let file_path = PathBuf::from(path);
    open_collection_file(&file_path)
}

/// Open an existing runi collection file from disk.
///
/// Emits `collection:created` with `Actor::User` on success (the opened
/// collection appears as a new collection in the UI).
#[tauri::command]
pub async fn cmd_open_collection_file(
    app: tauri::AppHandle,
    path: String,
) -> Result<Collection, String> {
    let collection = open_collection_file_inner(&path)?;
    emit_collection_event(
        &app,
        "collection:created",
        &Actor::User,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
    Ok(collection)
}

/// Save a collection to disk.
///
/// Emits `collection:saved` with `Actor::User` for real-time UI updates.
#[tauri::command]
pub async fn cmd_save_collection(
    app: tauri::AppHandle,
    collection: Collection,
) -> Result<String, String> {
    let path = save_collection(&collection)?;
    emit_collection_event(
        &app,
        "collection:saved",
        &Actor::User,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
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
///
/// Emits `collection:deleted` with `Actor::User` for real-time UI updates.
#[tauri::command]
pub async fn cmd_delete_collection(
    app: tauri::AppHandle,
    collection_id: String,
) -> Result<(), String> {
    // Load the friendly name before deleting
    let friendly_name = load_collection(&collection_id)
        .ok()
        .map_or_else(|| collection_id.clone(), |c| c.metadata.name);

    delete_collection(&collection_id)?;
    emit_collection_event(
        &app,
        "collection:deleted",
        &Actor::User,
        json!({"id": &collection_id, "name": &friendly_name}),
    );
    Ok(())
}

/// Delete a request from a collection (core logic, no `AppHandle`).
///
/// Returns the friendly name of the deleted request for event emission.
fn delete_request_inner(collection_id: &str, request_id: &str) -> Result<String, String> {
    let mut collection = load_collection(collection_id)?;

    let friendly_name = collection
        .requests
        .iter()
        .find(|r| r.id == request_id)
        .map_or_else(|| request_id.to_string(), |r| r.name.clone());

    let original_len = collection.requests.len();
    collection.requests.retain(|r| r.id != request_id);

    if collection.requests.len() == original_len {
        return Err(format!("Request not found: {request_id}"));
    }

    save_collection(&collection)?;
    Ok(friendly_name)
}

/// Delete a request from a collection.
///
/// Emits `request:deleted` with `Actor::User` for real-time UI updates.
#[tauri::command]
pub async fn cmd_delete_request(
    app: tauri::AppHandle,
    collection_id: String,
    request_id: String,
) -> Result<(), String> {
    let friendly_name = delete_request_inner(&collection_id, &request_id)?;
    emit_collection_event(
        &app,
        "request:deleted",
        &Actor::User,
        json!({"collection_id": &collection_id, "request_id": &request_id, "name": &friendly_name}),
    );
    Ok(())
}

/// Rename a collection (core logic, no `AppHandle`).
fn rename_collection_inner(collection_id: &str, new_name: &str) -> Result<(), String> {
    let mut collection = load_collection(collection_id)?;
    collection.metadata.name = new_name.to_string();
    save_collection(&collection)?;
    Ok(())
}

/// Rename a collection.
///
/// Emits `collection:saved` with `Actor::User` for real-time UI updates.
#[tauri::command]
pub async fn cmd_rename_collection(
    app: tauri::AppHandle,
    collection_id: String,
    new_name: String,
) -> Result<(), String> {
    rename_collection_inner(&collection_id, &new_name)?;
    emit_collection_event(
        &app,
        "collection:saved",
        &Actor::User,
        json!({"id": &collection_id, "name": &new_name}),
    );
    Ok(())
}

/// Rename a request in a collection (core logic, no `AppHandle`).
fn rename_request_inner(
    collection_id: &str,
    request_id: &str,
    new_name: &str,
) -> Result<(), String> {
    let mut collection = load_collection(collection_id)?;
    let request = collection
        .requests
        .iter_mut()
        .find(|r| r.id == request_id)
        .ok_or_else(|| format!("Request not found: {request_id}"))?;

    request.name = new_name.to_string();
    save_collection(&collection)?;
    Ok(())
}

/// Update a request in a collection (core logic, no `AppHandle`).
#[allow(clippy::too_many_arguments)]
fn update_request_inner(
    collection_id: &str,
    request_id: &str,
    name: Option<String>,
    method: Option<String>,
    url: Option<String>,
    headers: Option<BTreeMap<String, String>>,
    body: Option<String>,
    body_type: Option<BodyType>,
) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    let request = collection
        .requests
        .iter_mut()
        .find(|r| r.id == request_id)
        .ok_or_else(|| format!("Request not found: {request_id}"))?;

    if let Some(n) = name {
        request.name = n;
    }
    if let Some(m) = method {
        request.method = m.to_uppercase();
    }
    if let Some(u) = url {
        request.url = u;
    }
    if let Some(h) = headers {
        request.headers = h;
    }
    if let Some(b) = body {
        let bt = body_type.unwrap_or_else(|| infer_body_type_from_headers(&request.headers));
        request.body = Some(RequestBody {
            body_type: bt,
            content: Some(b),
            file: None,
        });
    } else if let Some(bt) = body_type {
        if let Some(ref mut b) = request.body {
            b.body_type = bt;
        }
    }

    save_collection(&collection)?;
    Ok(collection)
}

/// Update a request in a collection.
///
/// Emits `request:updated` with `Actor::User` on success.
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn cmd_update_request(
    app: tauri::AppHandle,
    collection_id: String,
    request_id: String,
    name: Option<String>,
    method: Option<String>,
    url: Option<String>,
    headers: Option<BTreeMap<String, String>>,
    body: Option<String>,
    body_type: Option<BodyType>,
) -> Result<Collection, String> {
    let collection = update_request_inner(
        &collection_id,
        &request_id,
        name.clone(),
        method,
        url,
        headers,
        body,
        body_type,
    )?;

    emit_collection_event(
        &app,
        "request:updated",
        &Actor::User,
        json!({
            "collection_id": &collection_id,
            "request_id": &request_id,
            "name": name
        }),
    );

    Ok(collection)
}

/// Rename a request in a collection.
///
/// Emits `request:updated` with `Actor::User` for real-time UI updates.
#[tauri::command]
pub async fn cmd_rename_request(
    app: tauri::AppHandle,
    collection_id: String,
    request_id: String,
    new_name: String,
) -> Result<(), String> {
    rename_request_inner(&collection_id, &request_id, &new_name)?;
    emit_collection_event(
        &app,
        "request:updated",
        &Actor::User,
        json!({"collection_id": &collection_id, "request_id": &request_id, "name": &new_name}),
    );
    Ok(())
}

/// Duplicate a collection (core logic, no `AppHandle`).
///
/// Clones the collection with a new ID and "(Copy)" suffix on the name.
/// All requests are also cloned with new IDs.
fn duplicate_collection_inner(collection_id: &str) -> Result<Collection, String> {
    let original = load_collection(collection_id)?;
    let new_name = format!("{} (Copy)", original.metadata.name);
    let mut copy = Collection::new(&new_name);
    // Preserve source, auth, variables, extensions from original
    copy.source.clone_from(&original.source);
    copy.auth.clone_from(&original.auth);
    copy.variables.clone_from(&original.variables);
    copy.extensions.clone_from(&original.extensions);
    // Clone requests with new IDs
    copy.requests = original
        .requests
        .iter()
        .enumerate()
        .map(|(i, r)| {
            let mut cloned = r.clone();
            cloned.id = CollectionRequest::generate_id(&r.name);
            // Precision loss acceptable: seq values are small integers
            #[allow(clippy::cast_possible_truncation)]
            {
                cloned.seq = (i as u32) + 1;
            }
            cloned
        })
        .collect();
    save_collection(&copy)?;
    Ok(copy)
}

/// Duplicate a collection.
///
/// Emits `collection:created` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_duplicate_collection(
    app: tauri::AppHandle,
    collection_id: String,
) -> Result<Collection, String> {
    let collection = duplicate_collection_inner(&collection_id)?;
    emit_collection_event(
        &app,
        "collection:created",
        &Actor::User,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
    Ok(collection)
}

/// Add a new empty request to a collection (core logic, no `AppHandle`).
///
/// Creates a GET request with the given name and appends it to the collection.
fn add_request_inner(collection_id: &str, name: &str) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    let seq = collection.next_seq();
    let request = CollectionRequest {
        id: CollectionRequest::generate_id(name),
        name: name.to_string(),
        seq,
        method: "GET".to_string(),
        url: String::new(),
        ..Default::default()
    };
    collection.requests.push(request);
    save_collection(&collection)?;
    Ok(collection)
}

/// Add a new empty request to a collection.
///
/// Emits `request:added` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_add_request(
    app: tauri::AppHandle,
    collection_id: String,
    name: String,
) -> Result<Collection, String> {
    let collection = add_request_inner(&collection_id, &name)?;
    let request_id = collection
        .requests
        .last()
        .map(|r| r.id.clone())
        .unwrap_or_default();
    emit_collection_event(
        &app,
        "request:added",
        &Actor::User,
        json!({"collection_id": &collection_id, "request_id": &request_id, "name": &name}),
    );
    Ok(collection)
}

/// Duplicate a request within a collection (core logic, no `AppHandle`).
///
/// Clones the request with a new ID and "(Copy)" suffix, inserting after the original.
fn duplicate_request_inner(
    collection_id: &str,
    request_id: &str,
) -> Result<(Collection, String), String> {
    let mut collection = load_collection(collection_id)?;
    let pos = collection
        .requests
        .iter()
        .position(|r| r.id == request_id)
        .ok_or_else(|| format!("Request not found: {request_id}"))?;

    let original = collection.requests[pos].clone();
    let new_name = format!("{} (Copy)", original.name);
    let new_seq = original.seq + 1;

    // Bump seq for all requests after the original so the copy slots in right after
    for r in &mut collection.requests {
        if r.seq >= new_seq {
            r.seq += 1;
        }
    }

    let mut copy = original;
    copy.id = CollectionRequest::generate_id(&new_name);
    copy.name = new_name;
    copy.seq = new_seq;

    let copy_id = copy.id.clone();
    collection.requests.insert(pos + 1, copy);
    save_collection(&collection)?;
    Ok((collection, copy_id))
}

/// Duplicate a request within a collection.
///
/// Emits `request:added` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_duplicate_request(
    app: tauri::AppHandle,
    collection_id: String,
    request_id: String,
) -> Result<Collection, String> {
    let (collection, copy_id) = duplicate_request_inner(&collection_id, &request_id)?;
    let copy_name = collection
        .requests
        .iter()
        .find(|r| r.id == copy_id)
        .map(|r| r.name.clone())
        .unwrap_or_default();
    emit_collection_event(
        &app,
        "request:added",
        &Actor::User,
        json!({"collection_id": &collection_id, "request_id": &copy_id, "name": &copy_name}),
    );
    Ok(collection)
}

/// Save a tab (with full request data) to a collection (core logic, no `AppHandle`).
///
/// Creates a new `CollectionRequest` from the provided tab data and appends it
/// to the target collection with the next sequence number.
fn save_tab_to_collection_inner(
    collection_id: &str,
    name: &str,
    method: &str,
    url: &str,
    headers: &BTreeMap<String, String>,
    body: Option<&str>,
    body_type: Option<BodyType>,
) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    let seq = collection.next_seq();
    let effective_body_type = body_type.unwrap_or_else(|| infer_body_type_from_headers(headers));
    let request_body = body.map(|content| RequestBody {
        body_type: effective_body_type,
        content: Some(content.to_string()),
        file: None,
    });
    let request = CollectionRequest {
        id: CollectionRequest::generate_id(name),
        name: name.to_string(),
        seq,
        method: method.to_string(),
        url: url.to_string(),
        headers: headers.clone(),
        body: request_body,
        ..Default::default()
    };
    collection.requests.push(request);
    save_collection(&collection)?;
    Ok(collection)
}

fn infer_body_type_from_headers(headers: &BTreeMap<String, String>) -> BodyType {
    let content_type = headers
        .iter()
        .find_map(|(name, value)| name.eq_ignore_ascii_case("content-type").then_some(value));

    let Some(content_type) = content_type else {
        return BodyType::Raw;
    };

    let normalized = content_type.to_ascii_lowercase();
    if normalized.contains("application/json") {
        BodyType::Json
    } else if normalized.contains("application/x-www-form-urlencoded")
        || normalized.contains("multipart/form-data")
    {
        BodyType::Form
    } else if normalized.contains("application/graphql")
        || normalized.contains("application/graphql+json")
    {
        BodyType::Graphql
    } else if normalized.contains("application/xml") || normalized.contains("text/xml") {
        BodyType::Xml
    } else {
        BodyType::Raw
    }
}

/// Save a tab's request data to a collection.
///
/// Creates a new request from the provided tab fields (name, method, URL,
/// headers, body) and appends it to the collection.
/// Emits `request:saved-to-collection` with `Actor::User` on success.
#[tauri::command]
#[allow(clippy::too_many_arguments)] // Tab data requires multiple fields
pub async fn cmd_save_tab_to_collection(
    app: tauri::AppHandle,
    collection_id: String,
    name: String,
    method: String,
    url: String,
    headers: BTreeMap<String, String>,
    body: Option<String>,
    body_type: Option<BodyType>,
) -> Result<Collection, String> {
    let collection = save_tab_to_collection_inner(
        &collection_id,
        &name,
        &method,
        &url,
        &headers,
        body.as_deref(),
        body_type,
    )?;
    let request_id = collection
        .requests
        .last()
        .map(|r| r.id.clone())
        .unwrap_or_default();
    emit_collection_event(
        &app,
        "request:saved-to-collection",
        &Actor::User,
        json!({"collection_id": &collection_id, "request_id": &request_id, "name": &name}),
    );
    Ok(collection)
}

/// Result of moving a request between collections.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveRequestResult {
    /// The source collection after the request was removed.
    pub from: Collection,
    /// The target collection after the request was added.
    pub to: Collection,
}

/// Move a request between collections (core logic, no `AppHandle`).
///
/// Removes the request from the source collection and appends it to the target.
/// Strips any `SpecBinding` since the request is leaving its original context.
/// Saves both collections. Returns both updated collections.
fn move_request_inner(
    source_collection_id: &str,
    request_id: &str,
    target_collection_id: &str,
) -> Result<MoveRequestResult, String> {
    if source_collection_id == target_collection_id {
        let collection = load_collection(source_collection_id)?;
        if !collection.requests.iter().any(|r| r.id == request_id) {
            return Err(format!("Request not found: {request_id}"));
        }
        return Ok(MoveRequestResult {
            from: collection.clone(),
            to: collection,
        });
    }

    let mut source = load_collection(source_collection_id)?;
    let pos = source
        .requests
        .iter()
        .position(|r| r.id == request_id)
        .ok_or_else(|| format!("Request not found: {request_id}"))?;
    let mut request = source
        .requests
        .get(pos)
        .cloned()
        .ok_or_else(|| format!("Request not found: {request_id}"))?;

    // Strip spec binding — moving breaks the binding context
    if request.binding.is_bound() {
        request.binding = SpecBinding::default();
    }

    let mut target = load_collection(target_collection_id)?;
    request.seq = target.next_seq();
    target.requests.push(request);

    save_collection(&target)?;
    source.requests.remove(pos);
    if let Err(save_source_error) = save_collection(&source) {
        if let Some(target_pos) = target.requests.iter().position(|r| r.id == request_id) {
            target.requests.remove(target_pos);
        }

        return match save_collection(&target) {
            Ok(_) => Err(format!(
                "Failed to save source collection {source_collection_id} while moving request {request_id} to {target_collection_id}; target changes rolled back: {save_source_error}"
            )),
            Err(rollback_error) => Err(format!(
                "Failed to save source collection {source_collection_id} while moving request {request_id} to {target_collection_id}; rollback failed: {rollback_error}; original error: {save_source_error}"
            )),
        };
    }

    Ok(MoveRequestResult {
        from: source,
        to: target,
    })
}

/// Move a request from one collection to another.
///
/// Removes the request from the source and appends to the target.
/// Strips spec binding since the request leaves its original spec context.
/// Emits `request:moved` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_move_request(
    app: tauri::AppHandle,
    source_collection_id: String,
    request_id: String,
    target_collection_id: String,
) -> Result<MoveRequestResult, String> {
    let result = move_request_inner(&source_collection_id, &request_id, &target_collection_id)?;
    emit_collection_event(
        &app,
        "request:moved",
        &Actor::User,
        json!({
            "source_collection_id": &source_collection_id,
            "target_collection_id": &target_collection_id,
            "request_id": &request_id,
        }),
    );
    Ok(result)
}

/// Copy a request to another collection (core logic, no `AppHandle`).
///
/// Clones the request with a new ID, strips any `SpecBinding`, and appends
/// the copy to the target collection. The source collection is not modified.
fn copy_request_to_collection_inner(
    source_collection_id: &str,
    request_id: &str,
    target_collection_id: &str,
) -> Result<Collection, String> {
    let source = load_collection(source_collection_id)?;
    let original = source
        .requests
        .iter()
        .find(|r| r.id == request_id)
        .ok_or_else(|| format!("Request not found: {request_id}"))?;

    let mut copy = original.clone();
    copy.id = CollectionRequest::generate_id(&copy.name);
    copy.binding = SpecBinding::default();

    let mut target = load_collection(target_collection_id)?;
    copy.seq = target.next_seq();
    target.requests.push(copy);

    save_collection(&target)?;
    Ok(target)
}

/// Copy a request from one collection to another.
///
/// Clones the request with a new ID and strips spec binding.
/// Only the target collection is modified; the source remains unchanged.
/// Emits `request:copied` with `Actor::User` on success.
#[tauri::command]
pub async fn cmd_copy_request_to_collection(
    app: tauri::AppHandle,
    source_collection_id: String,
    request_id: String,
    target_collection_id: String,
) -> Result<Collection, String> {
    let target = copy_request_to_collection_inner(
        &source_collection_id,
        &request_id,
        &target_collection_id,
    )?;
    let copy_id = target
        .requests
        .last()
        .map(|r| r.id.clone())
        .unwrap_or_default();
    emit_collection_event(
        &app,
        "request:copied",
        &Actor::User,
        json!({
            "source_collection_id": &source_collection_id,
            "target_collection_id": &target_collection_id,
            "source_request_id": &request_id,
            "copied_request_id": &copy_id,
            "request_id": &copy_id,
        }),
    );
    Ok(target)
}

/// Fetch, parse, and save the httpbin.org collection.
///
/// Uses `ImportService` with pluggable parsers for format detection.
/// Core logic extracted from the Tauri command for testability (no `AppHandle` needed).
async fn add_httpbin_collection_inner() -> Result<Collection, String> {
    let service = ImportService::new(vec![Box::new(OpenApiParser)], Box::new(HttpContentFetcher));
    let collection = service
        .import(
            SpecSource::Url(HTTPBIN_SPEC_URL.to_string()),
            ImportOverrides::default(),
        )
        .await?;
    save_collection(&collection)?;
    Ok(collection)
}

/// Convenience command: Add httpbin.org collection.
///
/// # Flow
/// 1. Fetch `OpenAPI` spec from httpbin.org (or use bundled fallback)
/// 2. Parse spec into internal types
/// 3. Convert to Collection format
/// 4. Save to disk
/// 5. Emit `collection:created` with `Actor::System`
/// 6. Return the new collection
#[tauri::command]
pub async fn cmd_add_httpbin_collection(app: tauri::AppHandle) -> Result<Collection, String> {
    let collection = add_httpbin_collection_inner().await?;
    emit_collection_event(
        &app,
        "collection:created",
        &Actor::System,
        json!({"id": &collection.id, "name": &collection.metadata.name}),
    );
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

/// Sync canvas state from the frontend to the backend.
///
/// The frontend calls this command whenever significant canvas state changes occur
/// (tab switches, tab opens/closes, template selection). MCP tools read from this
/// state to understand what the user is currently working on.
///
/// Broadcasts an SSE event on the `"canvas"` stream so that MCP subscribers
/// receive real-time updates. The `event_hint` describes *what* changed and the
/// `actor` indicates *who* triggered the change (`"user"` or `"ai"`).
///
/// # Errors
///
/// Returns an error if the canvas state cannot be updated.
#[tauri::command]
pub async fn sync_canvas_state(
    state: tauri::State<'_, CanvasStateHandle>,
    broadcaster: tauri::State<'_, crate::infrastructure::mcp::commands::SseBroadcasterHandle>,
    snapshot: CanvasStateSnapshot,
    event_hint: crate::domain::canvas_state::CanvasEventHint,
    actor: String,
) -> Result<(), String> {
    use crate::infrastructure::mcp::server::sse_broadcaster::SseEvent;

    // Update the shared state
    *state.write().await = snapshot.clone();

    // Build SSE event data
    let event_type = event_hint.event_type().to_string();
    let hint_value =
        serde_json::to_value(&event_hint).map_err(|e| format!("Failed to serialize hint: {e}"))?;
    let snapshot_value = serde_json::to_value(&snapshot)
        .map_err(|e| format!("Failed to serialize snapshot: {e}"))?;

    let data = json!({
        "snapshot": snapshot_value,
        "detail": hint_value,
        "actor": actor,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });

    // Broadcast to all SSE subscribers on the "canvas" stream
    broadcaster
        .broadcast("canvas", SseEvent::new(event_type, data))
        .await;

    Ok(())
}

// ── Hurl test execution ──────────────────────────────────────────────

/// Request payload for running a Hurl test suite.
#[derive(Debug, Clone, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RunHurlSuiteRequest {
    /// Path to the `.hurl` file to execute.
    pub hurl_file_path: String,
    /// Optional collection ID for context.
    pub collection_id: Option<String>,
    /// Optional environment variables (e.g., `base_url`).
    pub env_vars: Option<HashMap<String, String>>,
}

/// Result of running a Hurl test suite.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct HurlSuiteResult {
    /// Process exit code (0 = success).
    pub exit_code: i32,
    /// Whether all tests passed.
    pub passed: bool,
    /// Total number of hurl entries executed.
    pub test_count: u32,
    /// Number of failed entries.
    pub failure_count: u32,
    /// Total duration in milliseconds.
    #[ts(type = "number")]
    pub duration_ms: u64,
    /// Captured stdout from hurl.
    pub stdout: String,
    /// Captured stderr from hurl.
    pub stderr: String,
    /// The collection ID this suite was run against (if any).
    pub collection_id: Option<String>,
}

/// Runs a Hurl test suite for a collection.
///
/// Builds a `TestRunConfig` from the request and delegates to `HurlRunner::run()`,
/// which validates file existence and `.hurl` extension before execution.
#[tauri::command]
pub async fn cmd_run_hurl_suite(request: RunHurlSuiteRequest) -> Result<HurlSuiteResult, String> {
    use crate::domain::collection::test_port::{TestRunConfig, TestRunner};
    use crate::infrastructure::hurl::HurlRunner;

    let RunHurlSuiteRequest {
        hurl_file_path,
        env_vars,
        collection_id,
    } = request;

    let config = TestRunConfig {
        file_path: hurl_file_path,
        env_vars: env_vars.unwrap_or_default(),
        timeout_secs: None,
    };

    // Run on a blocking thread since Command::output() blocks
    let result = tokio::task::spawn_blocking(move || {
        let runner = HurlRunner;
        runner.run(&config)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))??;

    Ok(HurlSuiteResult {
        exit_code: result.exit_code,
        passed: result.passed,
        test_count: result.test_count,
        failure_count: result.failure_count,
        duration_ms: result.duration_ms,
        stdout: result.stdout,
        stderr: result.stderr,
        collection_id,
    })
}

// ── Project Context ─────────────────────────────────────────────────

/// Managed state type for the project context service.
pub type ProjectContextHandle =
    Arc<crate::application::project_context_service::ProjectContextService>;

/// Get the current project context.
///
/// Returns the persisted context representing the user's current working state.
///
/// # Errors
///
/// Returns an error if the context cannot be loaded from the database.
#[tauri::command]
pub async fn cmd_get_project_context(
    ctx_svc: tauri::State<'_, ProjectContextHandle>,
) -> Result<crate::domain::project_context::ProjectContext, String> {
    ctx_svc.get_context()
}

/// Update the project context with partial values.
///
/// Only fields present in the update payload are modified. Emits a
/// `context:updated` Tauri event on success.
///
/// # Errors
///
/// Returns an error if the update fails.
#[tauri::command]
pub async fn cmd_update_project_context(
    ctx_svc: tauri::State<'_, ProjectContextHandle>,
    app: tauri::AppHandle,
    update: crate::domain::project_context::ProjectContextUpdate,
) -> Result<crate::domain::project_context::ProjectContext, String> {
    let ctx = ctx_svc.update_context(&update)?;

    // Emit context:updated event for frontend sync (wrapped in EventEnvelope)
    let payload =
        serde_json::to_value(&ctx).map_err(|e| format!("Failed to serialize context: {e}"))?;
    let envelope = EventEnvelope {
        actor: Actor::User,
        timestamp: chrono::Utc::now().to_rfc3339(),
        correlation_id: None,
        lamport: None,
        payload,
    };
    let envelope_value = serde_json::to_value(&envelope).unwrap_or_else(|_| serde_json::json!({}));
    if let Err(e) = app.emit("context:updated", &envelope_value) {
        tracing::warn!("Failed to emit context:updated event: {e}");
    }

    Ok(ctx)
}

/// Create a `ProjectContextHandle` backed by the app's `SQLite` database.
///
/// # Errors
///
/// Returns an error if the database cannot be opened.
pub fn create_project_context_service() -> Result<ProjectContextHandle, String> {
    let data_dir = crate::infrastructure::storage::get_data_dir()?;
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create data dir: {e}"))?;
    let db_path = data_dir.join("project_context.db");
    let svc = crate::application::project_context_service::ProjectContextService::new(&db_path)?;
    Ok(Arc::new(svc))
}

// ── Suggestions (Vigilance Monitor) ────────────────────────────────

/// Managed state type for the suggestion service.
pub type SuggestionServiceHandle = Arc<crate::application::suggestion_service::SuggestionService>;

/// List all suggestions, optionally filtered by status.
///
/// # Errors
///
/// Returns an error if the database query fails.
#[tauri::command]
pub async fn cmd_list_suggestions(
    svc: tauri::State<'_, SuggestionServiceHandle>,
    status: Option<String>,
) -> Result<Vec<crate::domain::suggestion::Suggestion>, String> {
    let status_filter = match status.as_deref() {
        Some(s) => {
            let v = serde_json::Value::String(s.to_string());
            Some(
                serde_json::from_value::<crate::domain::suggestion::SuggestionStatus>(v)
                    .map_err(|e| format!("Invalid status filter: {e}"))?,
            )
        }
        None => None,
    };
    svc.list_suggestions(status_filter)
}

/// Create a new AI suggestion.
///
/// Emits a `suggestion:created` Tauri event on success.
///
/// # Errors
///
/// Returns an error if the suggestion cannot be created.
#[tauri::command]
pub async fn cmd_create_suggestion(
    svc: tauri::State<'_, SuggestionServiceHandle>,
    app: tauri::AppHandle,
    request: crate::domain::suggestion::CreateSuggestionRequest,
) -> Result<crate::domain::suggestion::Suggestion, String> {
    let suggestion = svc.create_suggestion(&request)?;

    // Emit suggestion:created event for frontend sync (wrapped in EventEnvelope)
    let payload = serde_json::to_value(&suggestion)
        .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;
    let envelope = EventEnvelope {
        actor: Actor::User,
        timestamp: chrono::Utc::now().to_rfc3339(),
        correlation_id: None,
        lamport: None,
        payload,
    };
    let envelope_value = serde_json::to_value(&envelope).unwrap_or_else(|_| serde_json::json!({}));
    if let Err(e) = app.emit("suggestion:created", &envelope_value) {
        tracing::warn!("Failed to emit suggestion:created event: {e}");
    }

    Ok(suggestion)
}

/// Resolve a suggestion (accept or dismiss).
///
/// Emits a `suggestion:resolved` Tauri event on success.
///
/// # Errors
///
/// Returns an error if the suggestion cannot be found or updated.
#[tauri::command]
pub async fn cmd_resolve_suggestion(
    svc: tauri::State<'_, SuggestionServiceHandle>,
    app: tauri::AppHandle,
    id: String,
    status: String,
) -> Result<crate::domain::suggestion::Suggestion, String> {
    let status_enum: crate::domain::suggestion::SuggestionStatus =
        serde_json::from_value(serde_json::Value::String(status))
            .map_err(|e| format!("Invalid status: {e}"))?;

    let suggestion = svc.resolve_suggestion(&id, status_enum)?;

    // Emit suggestion:resolved event for frontend sync (wrapped in EventEnvelope)
    let payload = serde_json::to_value(&suggestion)
        .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;
    let envelope = EventEnvelope {
        actor: Actor::User,
        timestamp: chrono::Utc::now().to_rfc3339(),
        correlation_id: None,
        lamport: None,
        payload,
    };
    let envelope_value = serde_json::to_value(&envelope).unwrap_or_else(|_| serde_json::json!({}));
    if let Err(e) = app.emit("suggestion:resolved", &envelope_value) {
        tracing::warn!("Failed to emit suggestion:resolved event: {e}");
    }

    Ok(suggestion)
}

/// Dismiss all pending suggestions and emit a `suggestion:cleared` event.
///
/// Returns the count of dismissed suggestions.
///
/// # Errors
///
/// Returns an error if the database update fails.
#[tauri::command]
pub async fn cmd_clear_suggestions(
    svc: tauri::State<'_, SuggestionServiceHandle>,
    app: tauri::AppHandle,
) -> Result<u64, String> {
    let count = svc.clear_all_pending()?;

    let envelope = EventEnvelope {
        actor: Actor::User,
        timestamp: chrono::Utc::now().to_rfc3339(),
        correlation_id: None,
        lamport: None,
        payload: json!({"count": count}),
    };
    let envelope_value = serde_json::to_value(&envelope).unwrap_or_else(|_| serde_json::json!({}));
    if let Err(e) = app.emit("suggestion:cleared", &envelope_value) {
        tracing::warn!("Failed to emit suggestion:cleared event: {e}");
    }

    Ok(count)
}

/// Create a `SuggestionServiceHandle` backed by the app's `SQLite` database.
///
/// # Errors
///
/// Returns an error if the database cannot be opened.
pub fn create_suggestion_service() -> Result<SuggestionServiceHandle, String> {
    let data_dir = crate::infrastructure::storage::get_data_dir()?;
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create data dir: {e}"))?;
    let db_path = data_dir.join("suggestions.db");
    let svc = crate::application::suggestion_service::SuggestionService::new(&db_path)?;
    Ok(Arc::new(svc))
}

// ── Environment commands ───────────────────────────────────────────────────

/// Upsert a named environment on a collection (core logic, no `AppHandle`).
///
/// Creates the environment if it does not exist, or updates its variables if it does.
fn upsert_environment_inner(
    collection_id: &str,
    name: &str,
    variables: BTreeMap<String, String>,
) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    if let Some(env) = collection.environments.iter_mut().find(|e| e.name == name) {
        env.variables = variables;
    } else {
        collection.environments.push(CollectionEnvironment {
            name: name.to_string(),
            variables,
        });
    }
    save_collection(&collection)?;
    Ok(collection)
}

/// Upsert a named environment on a collection.
///
/// Creates the environment if it does not exist, or replaces its variables if it does.
/// Emits `collection:environment-updated` with `Actor::User` on success.
///
/// # Errors
///
/// Returns an error if the collection cannot be loaded or saved.
#[tauri::command]
pub async fn cmd_upsert_environment(
    app: tauri::AppHandle,
    collection_id: String,
    name: String,
    variables: BTreeMap<String, String>,
) -> Result<(), String> {
    upsert_environment_inner(&collection_id, &name, variables)?;
    emit_collection_event(
        &app,
        "collection:environment-updated",
        &Actor::User,
        json!({"collection_id": &collection_id, "name": &name}),
    );
    Ok(())
}

/// Delete a named environment from a collection (core logic, no `AppHandle`).
///
/// If the deleted environment is the active one, `active_environment` is cleared.
fn delete_environment_inner(collection_id: &str, name: &str) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    let original_len = collection.environments.len();
    collection.environments.retain(|e| e.name != name);
    if collection.environments.len() == original_len {
        return Err(format!("Environment not found: {name}"));
    }
    // Clear active_environment if it was the deleted one
    if collection.active_environment.as_deref() == Some(name) {
        collection.active_environment = None;
    }
    save_collection(&collection)?;
    Ok(collection)
}

/// Delete a named environment from a collection.
///
/// If the deleted environment was active, `active_environment` is cleared.
/// Emits `collection:environment-deleted` with `Actor::User` on success.
///
/// # Errors
///
/// Returns an error if the collection cannot be loaded, the environment is not found,
/// or the collection cannot be saved.
#[tauri::command]
pub async fn cmd_delete_environment(
    app: tauri::AppHandle,
    collection_id: String,
    name: String,
) -> Result<(), String> {
    delete_environment_inner(&collection_id, &name)?;
    emit_collection_event(
        &app,
        "collection:environment-deleted",
        &Actor::User,
        json!({"collection_id": &collection_id, "name": &name}),
    );
    Ok(())
}

/// Set the active environment on a collection (core logic, no `AppHandle`).
///
/// Passing `None` clears the active environment (no variable interpolation).
/// Returns an error if the named environment does not exist.
fn set_active_environment_inner(
    collection_id: &str,
    name: Option<&str>,
) -> Result<Collection, String> {
    let mut collection = load_collection(collection_id)?;
    if let Some(env_name) = name {
        if !collection.environments.iter().any(|e| e.name == env_name) {
            return Err(format!("Environment not found: {env_name}"));
        }
        collection.active_environment = Some(env_name.to_string());
    } else {
        collection.active_environment = None;
    }
    save_collection(&collection)?;
    Ok(collection)
}

/// Set the active environment for a collection.
///
/// Pass `name: null` to clear the active environment (disables variable interpolation).
/// Emits `collection:environment-activated` or `collection:environment-deactivated` with
/// `Actor::User` on success, depending on whether `name` is `Some` or `None`.
///
/// # Errors
///
/// Returns an error if the collection cannot be loaded, the named environment does not
/// exist, or the collection cannot be saved.
#[tauri::command]
pub async fn cmd_set_active_environment(
    app: tauri::AppHandle,
    collection_id: String,
    name: Option<String>,
) -> Result<(), String> {
    set_active_environment_inner(&collection_id, name.as_deref())?;
    let event_name = if name.is_some() {
        "collection:environment-activated"
    } else {
        "collection:environment-deactivated"
    };
    emit_collection_event(
        &app,
        event_name,
        &Actor::User,
        json!({"collection_id": &collection_id, "name": &name}),
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
    use crate::infrastructure::storage::collection_store::with_collections_dir_override_async;
    use async_trait::async_trait;
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
            add_httpbin_collection_inner().await
        })
        .await;
        let collection = result.unwrap();
        assert!(collection.metadata.name.to_lowercase().contains("httpbin"));
    }

    #[tokio::test]
    async fn test_sync_canvas_state_updates_state() {
        use crate::domain::canvas_state::{CanvasEventHint, TabSummary, TabType, TemplateSummary};
        use crate::infrastructure::mcp::server::sse_broadcaster::SseBroadcaster;

        let state: CanvasStateHandle = Arc::new(RwLock::new(CanvasStateSnapshot::new()));
        let broadcaster = Arc::new(SseBroadcaster::new());

        let snapshot = CanvasStateSnapshot {
            tabs: vec![TabSummary {
                id: "tab-1".to_string(),
                label: "Request".to_string(),
                tab_type: TabType::Request,
            }],
            active_tab_index: Some(0),
            templates: vec![TemplateSummary {
                id: "tpl-1".to_string(),
                name: "Test API".to_string(),
                template_type: "openapi".to_string(),
            }],
        };

        // Simulate the sync_canvas_state logic (we can't use tauri::State in tests)
        let hint = CanvasEventHint::TabOpened {
            tab_id: "tab-1".to_string(),
            label: "Test Tab".to_string(),
        };
        {
            let mut guard = state.write().await;
            *guard = snapshot.clone();
        }
        let event_type = hint.event_type().to_string();
        let hint_value = serde_json::to_value(&hint).unwrap();
        let snapshot_value = serde_json::to_value(&snapshot).unwrap();
        let data = json!({
            "snapshot": snapshot_value,
            "detail": hint_value,
            "actor": "human",
            "timestamp": "2026-02-13T00:00:00Z",
        });
        let sse_event =
            crate::infrastructure::mcp::server::sse_broadcaster::SseEvent::new(event_type, data);
        broadcaster.broadcast("canvas", sse_event).await;

        // Verify state was updated
        {
            let guard = state.read().await;
            assert_eq!(guard.tabs.len(), 1);
            assert_eq!(guard.tabs[0].id, "tab-1");
            assert_eq!(guard.active_tab_index, Some(0));
            assert_eq!(guard.templates.len(), 1);
            drop(guard);
        }
    }

    #[tokio::test]
    async fn test_sync_canvas_state_overwrites_previous_state() {
        use crate::domain::canvas_state::{TabSummary, TabType};

        let state: CanvasStateHandle = Arc::new(RwLock::new(CanvasStateSnapshot::new()));

        // Set initial state
        {
            let mut guard = state.write().await;
            *guard = CanvasStateSnapshot {
                tabs: vec![TabSummary {
                    id: "tab-old".to_string(),
                    label: "Old".to_string(),
                    tab_type: TabType::Request,
                }],
                active_tab_index: Some(0),
                templates: vec![],
            };
        }

        // Update with new state
        {
            let mut guard = state.write().await;
            *guard = CanvasStateSnapshot {
                tabs: vec![TabSummary {
                    id: "tab-new".to_string(),
                    label: "New".to_string(),
                    tab_type: TabType::Template,
                }],
                active_tab_index: None,
                templates: vec![],
            };
        }

        // Verify new state replaced old
        {
            let guard = state.read().await;
            assert_eq!(guard.tabs.len(), 1);
            assert_eq!(guard.tabs[0].id, "tab-new");
            assert_eq!(guard.active_tab_index, None);
            drop(guard);
        }
    }

    #[tokio::test]
    async fn test_sync_canvas_state_broadcasts_sse_event() {
        use crate::domain::canvas_state::{CanvasEventHint, TabSummary, TabType};
        use crate::infrastructure::mcp::server::sse_broadcaster::SseBroadcaster;

        let state: CanvasStateHandle = Arc::new(RwLock::new(CanvasStateSnapshot::new()));
        let broadcaster = Arc::new(SseBroadcaster::new());

        // Subscribe to the canvas stream before broadcasting
        let (_sub_id, mut rx) = broadcaster.subscribe("canvas").await;

        let snapshot = CanvasStateSnapshot {
            tabs: vec![TabSummary {
                id: "tab-1".to_string(),
                label: "Request".to_string(),
                tab_type: TabType::Request,
            }],
            active_tab_index: Some(0),
            templates: vec![],
        };

        // Simulate the sync_canvas_state logic
        let hint = CanvasEventHint::TabSwitched {
            tab_id: "tab-1".to_string(),
            label: "Test Tab".to_string(),
        };
        {
            let mut guard = state.write().await;
            *guard = snapshot.clone();
        }
        let event_type = hint.event_type().to_string();
        let hint_value = serde_json::to_value(&hint).unwrap();
        let snapshot_value = serde_json::to_value(&snapshot).unwrap();
        let data = json!({
            "snapshot": snapshot_value,
            "detail": hint_value,
            "actor": "human",
            "timestamp": "2026-02-13T00:00:00Z",
        });
        let sse_event =
            crate::infrastructure::mcp::server::sse_broadcaster::SseEvent::new(event_type, data);
        let sent = broadcaster.broadcast("canvas", sse_event).await;
        assert_eq!(sent, 1, "Should broadcast to 1 subscriber");

        // Verify subscriber received the event
        let received = rx.recv().await.unwrap();
        assert_eq!(received.event_type, "canvas:tab_switched");
        assert_eq!(received.data["actor"], "human");
        assert_eq!(received.data["detail"]["kind"], "tab_switched");
        assert_eq!(received.data["detail"]["tab_id"], "tab-1");
        assert!(received.data["snapshot"]["tabs"].is_array());
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Create a collection with a request
            let mut collection = Collection::new("Del Req Test");
            let req = crate::domain::collection::CollectionRequest {
                id: "req_to_delete".to_string(),
                name: "Delete Me".to_string(),
                seq: 1,
                method: "GET".to_string(),
                url: "http://example.com".to_string(),
                ..Default::default()
            };
            collection.requests.push(req);
            save_collection(&collection).unwrap();

            // Delete the request
            let result = delete_request_inner(&collection.id, "req_to_delete");
            assert!(result.is_ok(), "Should delete request successfully");
            assert_eq!(result.unwrap(), "Delete Me");

            // Verify request is removed
            let loaded = load_collection(&collection.id).unwrap();
            assert!(loaded.requests.is_empty());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_request_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Del Req NF");
            save_collection(&collection).unwrap();

            let result = delete_request_inner(&collection.id, "nonexistent");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_rename_collection_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Old Name");
            save_collection(&collection).unwrap();

            let result = rename_collection_inner(&collection.id, "New Name");
            assert!(result.is_ok());

            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.metadata.name, "New Name");
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_rename_collection_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let result = rename_collection_inner("nonexistent", "New Name");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_rename_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Rename Req Test");
            let req = crate::domain::collection::CollectionRequest {
                id: "req_to_rename".to_string(),
                name: "Old Name".to_string(),
                seq: 1,
                method: "POST".to_string(),
                url: "http://example.com".to_string(),
                ..Default::default()
            };
            collection.requests.push(req);
            save_collection(&collection).unwrap();

            let result = rename_request_inner(&collection.id, "req_to_rename", "New Name");
            assert!(result.is_ok());

            let loaded = load_collection(&collection.id).unwrap();
            let renamed = loaded
                .requests
                .iter()
                .find(|r| r.id == "req_to_rename")
                .unwrap();
            assert_eq!(renamed.name, "New Name");
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_rename_request_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Rename NF");
            save_collection(&collection).unwrap();

            let result = rename_request_inner(&collection.id, "nonexistent", "New Name");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    async fn test_sync_canvas_state_broadcasts_each_hint_variant() {
        use crate::domain::canvas_state::CanvasEventHint;
        use crate::infrastructure::mcp::server::sse_broadcaster::{SseBroadcaster, SseEvent};

        let broadcaster = Arc::new(SseBroadcaster::new());
        let (_sub_id, mut rx) = broadcaster.subscribe("canvas").await;

        let hints = vec![
            (
                CanvasEventHint::TabOpened {
                    tab_id: "t1".to_string(),
                    label: "Tab 1".to_string(),
                },
                "canvas:tab_opened",
            ),
            (
                CanvasEventHint::TabClosed {
                    tab_id: "t2".to_string(),
                    label: "Tab 2".to_string(),
                },
                "canvas:tab_closed",
            ),
            (
                CanvasEventHint::LayoutChanged {
                    context_id: "ctx".to_string(),
                    layout_id: "lay".to_string(),
                },
                "canvas:layout_changed",
            ),
            (CanvasEventHint::StateSync, "canvas:state_sync"),
        ];

        for (hint, expected_type) in hints {
            let event_type = hint.event_type().to_string();
            let data = json!({"detail": serde_json::to_value(&hint).unwrap(), "actor": "ai"});
            broadcaster
                .broadcast("canvas", SseEvent::new(event_type, data))
                .await;

            let received = rx.recv().await.unwrap();
            assert_eq!(received.event_type, expected_type);
            assert_eq!(received.data["actor"], "ai");
        }
    }

    // ── cmd_import_collection tests ──────────────────────────────────

    const MINIMAL_OPENAPI: &str = r#"{
        "openapi": "3.0.0",
        "info": { "title": "Test API", "version": "1.0.0" },
        "paths": {
            "/users": {
                "get": {
                    "operationId": "getUsers",
                    "summary": "List users",
                    "responses": {
                        "200": {
                            "description": "OK"
                        }
                    }
                }
            }
        }
    }"#;

    /// Test 1.1: Reject empty request (no source provided).
    #[tokio::test]
    async fn test_import_collection_rejects_empty_request() {
        let request = ImportCollectionRequest {
            url: None,
            file_path: None,
            inline_content: None,
            display_name: None,
            repo_root: None,
            spec_path: None,
            ref_name: None,
        };
        let result = import_collection_inner(request).await;
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Must provide exactly one of url, file_path, or inline_content"
        );
    }

    /// Test 1.3: Inline import produces valid Collection.
    #[tokio::test]
    #[serial]
    async fn test_import_collection_inline_produces_collection() {
        let temp_dir = TempDir::new().unwrap();
        let result = with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let request = ImportCollectionRequest {
                url: None,
                file_path: None,
                inline_content: Some(MINIMAL_OPENAPI.to_string()),
                display_name: None,
                repo_root: None,
                spec_path: None,
                ref_name: None,
            };
            import_collection_inner(request).await
        })
        .await;

        let collection = result.unwrap();
        assert_eq!(
            collection.source.source_type,
            crate::domain::collection::SourceType::Openapi
        );
        assert!(collection.source.hash.is_some());
        assert!(collection.source.spec_version.is_some());
        assert!(!collection.source.fetched_at.is_empty());
        assert!(!collection.requests.is_empty());
    }

    /// Test 1.3b: File import reads from filesystem.
    #[tokio::test]
    #[serial]
    async fn test_import_collection_file_produces_collection() {
        let temp_dir = TempDir::new().unwrap();
        let spec_file = temp_dir.path().join("test_spec.json");
        std::fs::write(&spec_file, MINIMAL_OPENAPI).unwrap();

        let collections_dir = TempDir::new().unwrap();
        let result =
            with_collections_dir_override_async(collections_dir.path().to_path_buf(), || async {
                let request = ImportCollectionRequest {
                    url: None,
                    file_path: Some(spec_file.to_string_lossy().to_string()),
                    inline_content: None,
                    display_name: None,
                    repo_root: None,
                    spec_path: None,
                    ref_name: None,
                };
                import_collection_inner(request).await
            })
            .await;

        let collection = result.unwrap();
        assert_eq!(
            collection.source.source_type,
            crate::domain::collection::SourceType::Openapi
        );
    }

    /// Test 1.4: Display name override.
    #[tokio::test]
    #[serial]
    async fn test_import_collection_display_name_override() {
        let temp_dir = TempDir::new().unwrap();
        let result = with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let request = ImportCollectionRequest {
                url: None,
                file_path: None,
                inline_content: Some(MINIMAL_OPENAPI.to_string()),
                display_name: Some("My Custom API".to_string()),
                repo_root: None,
                spec_path: None,
                ref_name: None,
            };
            import_collection_inner(request).await
        })
        .await;

        let collection = result.unwrap();
        assert_eq!(collection.metadata.name, "My Custom API");
    }

    /// Test 1.5: Repo tracking fields persisted.
    #[tokio::test]
    #[serial]
    async fn test_import_collection_repo_tracking_fields() {
        let temp_dir = TempDir::new().unwrap();
        let result = with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let request = ImportCollectionRequest {
                url: None,
                file_path: None,
                inline_content: Some(MINIMAL_OPENAPI.to_string()),
                display_name: None,
                repo_root: Some("../my-project".to_string()),
                spec_path: Some("api/openapi.json".to_string()),
                ref_name: Some("main".to_string()),
            };
            import_collection_inner(request).await
        })
        .await;

        let collection = result.unwrap();
        assert_eq!(
            collection.source.repo_root,
            Some("../my-project".to_string())
        );
        assert_eq!(
            collection.source.spec_path,
            Some("api/openapi.json".to_string())
        );
        assert_eq!(collection.source.ref_name, Some("main".to_string()));
    }

    /// Test 1.6: Collection persisted to YAML file.
    #[tokio::test]
    #[serial]
    async fn test_import_collection_persists_to_disk() {
        let temp_dir = TempDir::new().unwrap();
        let result = with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let request = ImportCollectionRequest {
                url: None,
                file_path: None,
                inline_content: Some(MINIMAL_OPENAPI.to_string()),
                display_name: None,
                repo_root: None,
                spec_path: None,
                ref_name: None,
            };
            let collection = import_collection_inner(request).await?;
            // Verify it's persisted by loading it back
            let loaded = load_collection(&collection.id)?;
            assert_eq!(loaded.id, collection.id);
            assert_eq!(loaded.metadata.name, collection.metadata.name);
            assert_eq!(loaded.requests.len(), collection.requests.len());
            Ok::<Collection, String>(collection)
        })
        .await;

        assert!(result.is_ok());
    }

    // ── cmd_refresh_collection_spec tests ─────────────────────────────

    /// Mock fetcher that returns configurable content for refresh tests.
    struct ConfigurableMockFetcher {
        content: String,
    }

    #[async_trait]
    impl crate::domain::collection::spec_port::ContentFetcher for ConfigurableMockFetcher {
        async fn fetch(
            &self,
            _source: &crate::domain::collection::spec_port::SpecSource,
        ) -> Result<crate::domain::collection::spec_port::FetchResult, String> {
            Ok(crate::domain::collection::spec_port::FetchResult {
                content: self.content.clone(),
                source_url: "https://example.com/spec.json".to_string(),
                is_fallback: false,
                fetched_at: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            })
        }
    }

    fn make_refresh_service(content: &str) -> ImportService {
        ImportService::new(
            vec![Box::new(OpenApiParser)],
            Box::new(ConfigurableMockFetcher {
                content: content.to_string(),
            }),
        )
    }

    /// Helper: create and save a collection from inline `OpenAPI` content.
    async fn import_and_save(content: &str) -> Collection {
        let service = make_refresh_service(content);
        let collection = service
            .import(
                crate::domain::collection::spec_port::SpecSource::Inline(content.to_string()),
                ImportOverrides::default(),
            )
            .await
            .unwrap();
        save_collection(&collection).unwrap();
        collection
    }

    const SPEC_V1: &str = r#"{
        "openapi": "3.0.0",
        "info": { "title": "Test API", "version": "1.0.0" },
        "paths": {
            "/users": {
                "get": {
                    "operationId": "getUsers",
                    "summary": "List users",
                    "responses": { "200": { "description": "OK" } }
                }
            },
            "/users/{id}": {
                "post": {
                    "operationId": "createUser",
                    "summary": "Create user",
                    "responses": { "201": { "description": "Created" } }
                }
            }
        }
    }"#;

    /// V2: adds DELETE /users/{id}, removes POST /users/{id}.
    const SPEC_V2: &str = r#"{
        "openapi": "3.0.0",
        "info": { "title": "Test API", "version": "2.0.0" },
        "paths": {
            "/users": {
                "get": {
                    "operationId": "getUsers",
                    "summary": "List all users",
                    "parameters": [
                        { "name": "limit", "in": "query", "schema": { "type": "integer" } }
                    ],
                    "responses": { "200": { "description": "OK" } }
                }
            },
            "/users/{id}": {
                "delete": {
                    "operationId": "deleteUser",
                    "summary": "Delete user",
                    "responses": { "204": { "description": "Deleted" } }
                }
            }
        }
    }"#;

    /// Test 2B.7: Collection ID not found.
    #[tokio::test]
    #[serial]
    async fn test_refresh_collection_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let service = make_refresh_service(SPEC_V1);
            let result = refresh_collection_spec_inner("nonexistent_id", &service).await;
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    /// Test 2B.1: Reject non-tracked collection (no source URL).
    #[tokio::test]
    #[serial]
    async fn test_refresh_rejects_non_tracked_collection() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Create a manual collection with no source URL
            let collection = Collection::new("Manual API");
            save_collection(&collection).unwrap();

            let service = make_refresh_service(SPEC_V1);
            let result = refresh_collection_spec_inner(&collection.id, &service).await;
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("no tracked spec source"));
        })
        .await;
    }

    /// Test 2B.2: No drift when hash matches.
    #[tokio::test]
    #[serial]
    async fn test_refresh_no_drift_when_hash_matches() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Import with V1, then refresh with same content
            let collection = import_and_save(SPEC_V1).await;

            let service = make_refresh_service(SPEC_V1);
            let result = refresh_collection_spec_inner(&collection.id, &service)
                .await
                .unwrap();
            assert!(!result.changed);
            assert!(result.operations_added.is_empty());
            assert!(result.operations_removed.is_empty());
            assert!(result.operations_changed.is_empty());
        })
        .await;
    }

    /// Test 2B.3 + 2B.4 + 2B.5: Detect added, removed, and changed operations.
    #[tokio::test]
    #[serial]
    async fn test_refresh_detects_drift() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Import with V1
            let collection = import_and_save(SPEC_V1).await;

            // Refresh with V2 (different content)
            let service = make_refresh_service(SPEC_V2);
            let result = refresh_collection_spec_inner(&collection.id, &service)
                .await
                .unwrap();

            assert!(result.changed);

            // Added: DELETE /users/{id}
            assert!(
                result
                    .operations_added
                    .iter()
                    .any(|op| op.method == "DELETE" && op.path == "/users/{id}"),
                "Should detect added DELETE /users/{{id}}: {:?}",
                result.operations_added
            );

            // Removed: POST /users/{id}
            assert!(
                result
                    .operations_removed
                    .iter()
                    .any(|op| op.method == "POST" && op.path == "/users/{id}"),
                "Should detect removed POST /users/{{id}}: {:?}",
                result.operations_removed
            );

            // Changed: GET /users (summary changed, parameter added)
            let get_users_change = result
                .operations_changed
                .iter()
                .find(|op| op.method == "GET" && op.path == "/users");
            assert!(
                get_users_change.is_some(),
                "Should detect changed GET /users: {:?}",
                result.operations_changed
            );
            let changes = &get_users_change.unwrap().changes;
            assert!(changes.contains(&"summary".to_string()));
            assert!(changes.contains(&"parameters".to_string()));
        })
        .await;
    }

    // ── Test 3A.7: Refresh updates source_commit ──

    struct MockGitPort {
        commit: String,
    }

    impl crate::domain::collection::git_port::GitMetadataPort for MockGitPort {
        fn resolve_commit(
            &self,
            _repo_root: &str,
            _ref_name: Option<&str>,
        ) -> Result<String, String> {
            Ok(self.commit.clone())
        }
    }

    fn make_refresh_service_with_git(content: &str, commit: &str) -> ImportService {
        ImportService::with_git_metadata(
            vec![Box::new(OpenApiParser)],
            Box::new(ConfigurableMockFetcher {
                content: content.to_string(),
            }),
            Box::new(MockGitPort {
                commit: commit.to_string(),
            }),
        )
    }

    #[tokio::test]
    #[serial]
    async fn test_refresh_updates_source_commit() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Import with V1, setting repo_root so commit tracking is active
            let old_sha = "a".repeat(40);
            let service = make_refresh_service_with_git(SPEC_V1, &old_sha);
            let collection = service
                .import(
                    crate::domain::collection::spec_port::SpecSource::Inline(SPEC_V1.to_string()),
                    ImportOverrides {
                        repo_root: Some("/some/repo".to_string()),
                        ref_name: Some("main".to_string()),
                        ..Default::default()
                    },
                )
                .await
                .unwrap();
            save_collection(&collection).unwrap();

            assert_eq!(collection.source.source_commit, Some(old_sha));

            // Refresh with V2 content and a new commit SHA
            let new_sha = "b".repeat(40);
            let refresh_service = make_refresh_service_with_git(SPEC_V2, &new_sha);
            let result = refresh_collection_spec_inner(&collection.id, &refresh_service)
                .await
                .unwrap();
            assert!(result.changed);

            // Verify persisted collection has updated source_commit
            let updated = load_collection(&collection.id).unwrap();
            assert_eq!(
                updated.source.source_commit,
                Some(new_sha),
                "source_commit should be updated after refresh"
            );
        })
        .await;
    }

    /// Test 2B.6: Hash and timestamp updated after refresh.
    #[tokio::test]
    #[serial]
    async fn test_refresh_updates_hash_and_timestamp() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = import_and_save(SPEC_V1).await;
            let old_hash = collection.source.hash.clone();

            // Refresh with V2 (different content = different hash)
            let service = make_refresh_service(SPEC_V2);
            let result = refresh_collection_spec_inner(&collection.id, &service)
                .await
                .unwrap();
            assert!(result.changed);

            // Load the persisted collection and verify updates
            let updated = load_collection(&collection.id).unwrap();
            assert_ne!(updated.source.hash, old_hash, "Hash should be updated");
            assert!(
                updated.source.hash.as_ref().unwrap().starts_with("sha256:"),
                "Hash should have sha256 prefix"
            );
            // Verify fetched_at is a valid RFC 3339 timestamp with Z suffix
            assert!(
                updated.source.fetched_at.ends_with('Z'),
                "fetched_at should be UTC with Z suffix"
            );
            assert_eq!(
                updated.source.fetched_at.len(),
                20,
                "fetched_at should be in YYYY-MM-DDTHH:MM:SSZ format"
            );
        })
        .await;
    }

    /// Test 2B.7: No false drift for unbound requests with full URLs.
    ///
    /// This test verifies the fix for the bug where unbound requests with full URLs
    /// (e.g., `https://api.example.com/users`) were causing false positive drift
    /// because the path comparison was comparing full URLs against path-only values
    /// from the new spec (e.g., `/users`).
    #[tokio::test]
    #[serial]
    async fn test_refresh_no_false_drift_for_unbound_full_urls() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Import from spec
            let mut collection = import_and_save(SPEC_V1).await;

            // Simulate an unbound request by clearing binding.path and setting a full URL
            if let Some(req) = collection.requests.first_mut() {
                req.binding.path = None; // Clear binding
                req.url = "https://api.example.com/users".to_string(); // Full URL
            }
            save_collection(&collection).unwrap();

            // Refresh with same spec content
            let service = make_refresh_service(SPEC_V1);
            let result = refresh_collection_spec_inner(&collection.id, &service)
                .await
                .unwrap();

            // Should not detect false drift
            assert!(
                !result.changed,
                "Should not detect drift when full URL path matches spec endpoint"
            );
            assert!(
                result.operations_removed.is_empty(),
                "Should not show GET /users as removed: {:?}",
                result.operations_removed
            );
        })
        .await;
    }

    /// Test 2B.8: No false drift for unbound requests with template URLs.
    ///
    /// Verifies that template URLs like `{{baseUrl}}/users` are handled correctly.
    #[tokio::test]
    #[serial]
    async fn test_refresh_no_false_drift_for_template_urls() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            // Import from spec
            let mut collection = import_and_save(SPEC_V1).await;

            // Simulate an unbound request with a template URL
            if let Some(req) = collection.requests.first_mut() {
                req.binding.path = None; // Clear binding
                req.url = "{{baseUrl}}/users".to_string(); // Template URL
            }
            save_collection(&collection).unwrap();

            // Refresh with same spec content
            let service = make_refresh_service(SPEC_V1);
            let result = refresh_collection_spec_inner(&collection.id, &service)
                .await
                .unwrap();

            // Should not detect false drift
            assert!(
                !result.changed,
                "Should not detect drift when template URL path matches spec endpoint"
            );
            assert!(
                result.operations_removed.is_empty(),
                "Should not show GET /users as removed: {:?}",
                result.operations_removed
            );
        })
        .await;
    }

    // ── Tests for extract_path_from_url ──

    #[test]
    fn test_extract_path_from_full_url() {
        assert_eq!(
            extract_path_from_url("https://api.example.com/users"),
            "/users"
        );
        assert_eq!(
            extract_path_from_url("https://api.example.com/users/123"),
            "/users/123"
        );
        assert_eq!(
            extract_path_from_url("http://localhost:8080/api/v1/items"),
            "/api/v1/items"
        );
    }

    #[test]
    fn test_extract_path_from_template_url() {
        assert_eq!(extract_path_from_url("{{baseUrl}}/users"), "/users");
        assert_eq!(
            extract_path_from_url("{{baseUrl}}/users/{{id}}"),
            "/users/{{id}}"
        );
    }

    #[test]
    fn test_extract_path_already_a_path() {
        assert_eq!(extract_path_from_url("/users"), "/users");
        assert_eq!(extract_path_from_url("/users/123"), "/users/123");
    }

    #[test]
    fn test_extract_path_root() {
        assert_eq!(extract_path_from_url("https://api.example.com"), "/");
        assert_eq!(extract_path_from_url("https://api.example.com/"), "/");
    }

    #[test]
    fn test_extract_path_with_query_string() {
        assert_eq!(
            extract_path_from_url("https://api.example.com/users?limit=10"),
            "/users"
        );
        assert_eq!(
            extract_path_from_url("{{baseUrl}}/users?limit=10"),
            "/users"
        );
    }

    #[test]
    fn test_extract_path_with_fragment() {
        assert_eq!(
            extract_path_from_url("https://api.example.com/users#section"),
            "/users"
        );
        assert_eq!(extract_path_from_url("{{baseUrl}}/users#section"), "/users");
    }

    #[test]
    fn test_extract_path_edge_cases() {
        // Custom scheme
        assert_eq!(
            extract_path_from_url("custom://api.example.com/users"),
            "/users"
        );
        // No path after authority
        assert_eq!(extract_path_from_url("https://api.example.com"), "/");
        // Fallback for malformed input
        assert_eq!(extract_path_from_url("malformed"), "/malformed");
    }

    #[tokio::test]
    #[serial]
    async fn test_create_collection_inner_creates_and_persists() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = create_collection_inner("My New API").unwrap();
            assert_eq!(collection.metadata.name, "My New API");
            assert!(collection.id.starts_with("col_my_new_api_"));
            assert!(collection.requests.is_empty());

            // Verify it was persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.metadata.name, "My New API");
            assert_eq!(loaded.id, collection.id);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_create_collection_inner_appears_in_list() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            create_collection_inner("Listed API").unwrap();
            let summaries = list_collections().unwrap();
            assert_eq!(summaries.len(), 1);
            assert_eq!(summaries[0].name, "Listed API");
            assert_eq!(summaries[0].request_count, 0);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_duplicate_collection_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut original = Collection::new("My API");
            let req = crate::domain::collection::CollectionRequest {
                id: "req_1".to_string(),
                name: "Get Users".to_string(),
                seq: 1,
                method: "GET".to_string(),
                url: "http://example.com/users".to_string(),
                ..Default::default()
            };
            original.requests.push(req);
            save_collection(&original).unwrap();

            let copy = duplicate_collection_inner(&original.id).unwrap();
            assert_eq!(copy.metadata.name, "My API (Copy)");
            assert_ne!(copy.id, original.id);
            assert_eq!(copy.requests.len(), 1);
            assert_ne!(copy.requests[0].id, "req_1");

            // Verify persisted
            let loaded = load_collection(&copy.id).unwrap();
            assert_eq!(loaded.metadata.name, "My API (Copy)");
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_duplicate_collection_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let result = duplicate_collection_inner("nonexistent");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_duplicate_collection_copies_requests() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut original = Collection::new("Multi Req");
            for i in 1..=3 {
                original
                    .requests
                    .push(crate::domain::collection::CollectionRequest {
                        id: format!("req_{i}"),
                        name: format!("Request {i}"),
                        seq: i,
                        method: "POST".to_string(),
                        url: format!("http://example.com/{i}"),
                        ..Default::default()
                    });
            }
            save_collection(&original).unwrap();

            let copy = duplicate_collection_inner(&original.id).unwrap();
            assert_eq!(copy.requests.len(), 3);
            // All IDs should be new
            for (orig, copied) in original.requests.iter().zip(copy.requests.iter()) {
                assert_ne!(orig.id, copied.id);
                assert_eq!(orig.name, copied.name);
                assert_eq!(orig.url, copied.url);
            }
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_add_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Add Req Test");
            save_collection(&collection).unwrap();

            let updated = add_request_inner(&collection.id, "New Request").unwrap();
            assert_eq!(updated.requests.len(), 1);
            assert_eq!(updated.requests[0].name, "New Request");
            assert_eq!(updated.requests[0].method, "GET");
            assert!(updated.requests[0].url.is_empty());

            // Verify persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.requests.len(), 1);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_add_request_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let result = add_request_inner("nonexistent", "New Request");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_add_request_inner_increments_seq() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Seq Test");
            collection
                .requests
                .push(crate::domain::collection::CollectionRequest {
                    id: "req_existing".to_string(),
                    name: "Existing".to_string(),
                    seq: 5,
                    method: "GET".to_string(),
                    url: String::new(),
                    ..Default::default()
                });
            save_collection(&collection).unwrap();

            let updated = add_request_inner(&collection.id, "New").unwrap();
            assert_eq!(updated.requests.len(), 2);
            assert_eq!(updated.requests[1].seq, 6);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_duplicate_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Dup Req Test");
            let req = crate::domain::collection::CollectionRequest {
                id: "req_orig".to_string(),
                name: "Original".to_string(),
                seq: 1,
                method: "POST".to_string(),
                url: "http://example.com".to_string(),
                ..Default::default()
            };
            collection.requests.push(req);
            save_collection(&collection).unwrap();

            let (updated, copy_id) = duplicate_request_inner(&collection.id, "req_orig").unwrap();
            assert_eq!(updated.requests.len(), 2);
            assert_eq!(updated.requests[1].name, "Original (Copy)");
            assert_ne!(updated.requests[1].id, "req_orig");
            assert_eq!(updated.requests[1].id, copy_id);
            assert_eq!(updated.requests[1].method, "POST");
            assert_eq!(updated.requests[1].url, "http://example.com");

            // Verify persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.requests.len(), 2);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_duplicate_request_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Dup NF");
            save_collection(&collection).unwrap();

            let result = duplicate_request_inner(&collection.id, "nonexistent");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_save_tab_to_collection_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Save Tab Test");
            save_collection(&collection).unwrap();

            let mut headers = BTreeMap::new();
            headers.insert("Content-Type".to_string(), "application/json".to_string());
            let updated = save_tab_to_collection_inner(
                &collection.id,
                "My Request",
                "POST",
                "https://api.example.com/users",
                &headers,
                Some(r#"{"name":"test"}"#),
                None,
            )
            .unwrap();

            assert_eq!(updated.requests.len(), 1);
            let req = &updated.requests[0];
            assert_eq!(req.name, "My Request");
            assert_eq!(req.method, "POST");
            assert_eq!(req.url, "https://api.example.com/users");
            assert_eq!(req.headers.get("Content-Type").unwrap(), "application/json");
            assert!(req.body.is_some());
            assert_eq!(
                req.body.as_ref().unwrap().content.as_deref(),
                Some(r#"{"name":"test"}"#)
            );
            assert!(req.id.starts_with("req_"));
            assert_eq!(req.seq, 1);

            // Verify persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.requests.len(), 1);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_save_tab_to_collection_inner_no_body() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("No Body Test");
            save_collection(&collection).unwrap();

            let updated = save_tab_to_collection_inner(
                &collection.id,
                "GET Req",
                "GET",
                "https://api.example.com",
                &BTreeMap::new(),
                None,
                None,
            )
            .unwrap();

            assert_eq!(updated.requests.len(), 1);
            assert!(updated.requests[0].body.is_none());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_update_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Update Request Test");
            let req_id = "req_123".to_string();
            collection.requests.push(CollectionRequest {
                id: req_id.clone(),
                name: "Old Name".to_string(),
                method: "GET".to_string(),
                url: "https://example.com/old".to_string(),
                seq: 1,
                ..Default::default()
            });
            save_collection(&collection).unwrap();

            let mut new_headers = BTreeMap::new();
            new_headers.insert("X-Test".to_string(), "Value".to_string());

            let updated = update_request_inner(
                &collection.id,
                &req_id,
                Some("New Name".to_string()),
                Some("POST".to_string()),
                Some("https://example.com/new".to_string()),
                Some(new_headers),
                Some("New Body".to_string()),
                None,
            )
            .unwrap();

            assert_eq!(updated.requests.len(), 1);
            let req = &updated.requests[0];
            assert_eq!(req.name, "New Name");
            assert_eq!(req.method, "POST");
            assert_eq!(req.url, "https://example.com/new");
            assert_eq!(req.headers.get("X-Test").unwrap(), "Value");
            assert_eq!(
                req.body.as_ref().unwrap().content.as_deref(),
                Some("New Body")
            );

            // Verify persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.requests[0].name, "New Name");
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_move_request_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut source = Collection::new("Move Source");
            source.requests.push(CollectionRequest {
                id: "req_moveme".to_string(),
                name: "Move Me".to_string(),
                seq: 1,
                method: "PUT".to_string(),
                url: "https://example.com/move".to_string(),
                ..Default::default()
            });
            save_collection(&source).unwrap();

            let target = Collection::new("Move Target");
            save_collection(&target).unwrap();

            move_request_inner(&source.id, "req_moveme", &target.id).unwrap();

            let loaded_source = load_collection(&source.id).unwrap();
            assert_eq!(loaded_source.requests.len(), 0);

            let loaded_target = load_collection(&target.id).unwrap();
            assert_eq!(loaded_target.requests.len(), 1);
            assert_eq!(loaded_target.requests[0].id, "req_moveme");
            assert_eq!(loaded_target.requests[0].method, "PUT");
            assert_eq!(loaded_target.requests[0].seq, 1);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_save_tab_to_collection_inner_preserves_body_type() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Save Tab Body Type Test");
            save_collection(&collection).unwrap();

            let updated = save_tab_to_collection_inner(
                &collection.id,
                "XML Request",
                "POST",
                "https://api.example.com/xml",
                &BTreeMap::new(),
                Some("<root/>"),
                Some(BodyType::Xml),
            )
            .unwrap();

            let req = &updated.requests[0];
            assert!(req.body.is_some());
            assert_eq!(
                req.body.as_ref().map(|b| b.body_type.clone()),
                Some(BodyType::Xml)
            );
            assert_eq!(
                req.body.as_ref().and_then(|b| b.content.clone()),
                Some("<root/>".to_string())
            );
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_move_request_inner_strips_binding() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut source = Collection::new("Bind Source");
            source.requests.push(CollectionRequest {
                id: "req_bound".to_string(),
                name: "Bound Request".to_string(),
                seq: 1,
                method: "GET".to_string(),
                url: "https://example.com".to_string(),
                binding: SpecBinding::from_operation("getUsers", "/users", "GET"),
                ..Default::default()
            });
            save_collection(&source).unwrap();

            let target = Collection::new("Bind Target");
            save_collection(&target).unwrap();

            move_request_inner(&source.id, "req_bound", &target.id).unwrap();

            let loaded_target = load_collection(&target.id).unwrap();
            assert!(!loaded_target.requests[0].binding.is_bound());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_move_request_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let source = Collection::new("Move NF Source");
            save_collection(&source).unwrap();

            let target = Collection::new("Move NF Target");
            save_collection(&target).unwrap();

            let result = move_request_inner(&source.id, "nonexistent", &target.id);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_copy_request_to_collection_inner_success() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut source = Collection::new("Copy Source");
            source.requests.push(CollectionRequest {
                id: "req_copyme".to_string(),
                name: "Copy Me".to_string(),
                seq: 1,
                method: "DELETE".to_string(),
                url: "https://example.com/copy".to_string(),
                ..Default::default()
            });
            save_collection(&source).unwrap();

            let target = Collection::new("Copy Target");
            save_collection(&target).unwrap();

            let updated_target =
                copy_request_to_collection_inner(&source.id, "req_copyme", &target.id).unwrap();

            // Target has the copy
            assert_eq!(updated_target.requests.len(), 1);
            assert_ne!(updated_target.requests[0].id, "req_copyme"); // new ID
            assert_eq!(updated_target.requests[0].name, "Copy Me");
            assert_eq!(updated_target.requests[0].method, "DELETE");

            // Source is unchanged
            let loaded_source = load_collection(&source.id).unwrap();
            assert_eq!(loaded_source.requests.len(), 1);
            assert_eq!(loaded_source.requests[0].id, "req_copyme");
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_copy_request_to_collection_inner_strips_binding() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut source = Collection::new("Copy Bind Src");
            source.requests.push(CollectionRequest {
                id: "req_copybound".to_string(),
                name: "Bound Copy".to_string(),
                seq: 1,
                method: "GET".to_string(),
                url: "https://example.com".to_string(),
                binding: SpecBinding::from_operation("listPets", "/pets", "GET"),
                ..Default::default()
            });
            save_collection(&source).unwrap();

            let target = Collection::new("Copy Bind Tgt");
            save_collection(&target).unwrap();

            let updated_target =
                copy_request_to_collection_inner(&source.id, "req_copybound", &target.id).unwrap();

            assert!(!updated_target.requests[0].binding.is_bound());

            // Source binding is preserved
            let loaded_source = load_collection(&source.id).unwrap();
            assert!(loaded_source.requests[0].binding.is_bound());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_copy_request_to_collection_inner_not_found() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let source = Collection::new("Copy NF Src");
            save_collection(&source).unwrap();

            let target = Collection::new("Copy NF Tgt");
            save_collection(&target).unwrap();

            let result = copy_request_to_collection_inner(&source.id, "nonexistent", &target.id);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    // ── Environment command tests ─────────────────────────────────────────

    #[tokio::test]
    #[serial]
    async fn test_upsert_environment_inner_creates_new_environment() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Env Upsert Test");
            save_collection(&collection).unwrap();

            let mut vars = BTreeMap::new();
            vars.insert("baseUrl".to_string(), "http://localhost:3000".to_string());

            let updated = upsert_environment_inner(&collection.id, "local", vars).unwrap();
            assert_eq!(updated.environments.len(), 1);
            assert_eq!(updated.environments[0].name, "local");
            assert_eq!(
                updated.environments[0].variables.get("baseUrl"),
                Some(&"http://localhost:3000".to_string())
            );

            // Verify persisted
            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.environments.len(), 1);
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_upsert_environment_inner_updates_existing_environment() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Env Update Test");
            let mut vars = BTreeMap::new();
            vars.insert("baseUrl".to_string(), "http://old.example.com".to_string());
            collection.environments.push(CollectionEnvironment {
                name: "local".to_string(),
                variables: vars,
            });
            save_collection(&collection).unwrap();

            let mut new_vars = BTreeMap::new();
            new_vars.insert("baseUrl".to_string(), "http://new.example.com".to_string());
            new_vars.insert("apiKey".to_string(), "secret123".to_string());

            let updated = upsert_environment_inner(&collection.id, "local", new_vars).unwrap();
            // Still only one environment (updated, not duplicated)
            assert_eq!(updated.environments.len(), 1);
            assert_eq!(
                updated.environments[0].variables.get("baseUrl"),
                Some(&"http://new.example.com".to_string())
            );
            assert_eq!(
                updated.environments[0].variables.get("apiKey"),
                Some(&"secret123".to_string())
            );
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_environment_inner_removes_environment() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Env Delete Test");
            collection.environments.push(CollectionEnvironment {
                name: "local".to_string(),
                variables: BTreeMap::new(),
            });
            collection.active_environment = Some("local".to_string());
            save_collection(&collection).unwrap();

            let updated = delete_environment_inner(&collection.id, "local").unwrap();
            assert!(updated.environments.is_empty());
            // Active environment should be cleared when it's the deleted one
            assert!(updated.active_environment.is_none());

            let loaded = load_collection(&collection.id).unwrap();
            assert!(loaded.environments.is_empty());
            assert!(loaded.active_environment.is_none());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_environment_inner_not_found_returns_error() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Env Delete NF Test");
            save_collection(&collection).unwrap();

            let result = delete_environment_inner(&collection.id, "nonexistent");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_environment_inner_preserves_active_when_not_deleted() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Env Delete Other Test");
            collection.environments.push(CollectionEnvironment {
                name: "local".to_string(),
                variables: BTreeMap::new(),
            });
            collection.environments.push(CollectionEnvironment {
                name: "staging".to_string(),
                variables: BTreeMap::new(),
            });
            collection.active_environment = Some("local".to_string());
            save_collection(&collection).unwrap();

            let updated = delete_environment_inner(&collection.id, "staging").unwrap();
            assert_eq!(updated.environments.len(), 1);
            // Active environment (local) should be preserved since staging was deleted
            assert_eq!(updated.active_environment, Some("local".to_string()));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_set_active_environment_inner_sets_active() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Env Active Test");
            collection.environments.push(CollectionEnvironment {
                name: "local".to_string(),
                variables: BTreeMap::new(),
            });
            collection.environments.push(CollectionEnvironment {
                name: "staging".to_string(),
                variables: BTreeMap::new(),
            });
            save_collection(&collection).unwrap();

            let updated = set_active_environment_inner(&collection.id, Some("staging")).unwrap();
            assert_eq!(updated.active_environment, Some("staging".to_string()));

            let loaded = load_collection(&collection.id).unwrap();
            assert_eq!(loaded.active_environment, Some("staging".to_string()));
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_set_active_environment_inner_clears_when_none() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let mut collection = Collection::new("Env Clear Test");
            collection.environments.push(CollectionEnvironment {
                name: "local".to_string(),
                variables: BTreeMap::new(),
            });
            collection.active_environment = Some("local".to_string());
            save_collection(&collection).unwrap();

            let updated = set_active_environment_inner(&collection.id, None).unwrap();
            assert!(updated.active_environment.is_none());

            let loaded = load_collection(&collection.id).unwrap();
            assert!(loaded.active_environment.is_none());
        })
        .await;
    }

    #[tokio::test]
    #[serial]
    async fn test_set_active_environment_inner_nonexistent_returns_error() {
        let temp_dir = TempDir::new().unwrap();
        with_collections_dir_override_async(temp_dir.path().to_path_buf(), || async {
            let collection = Collection::new("Env NE Test");
            save_collection(&collection).unwrap();

            let result = set_active_environment_inner(&collection.id, Some("nonexistent"));
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("not found"));
        })
        .await;
    }
}
