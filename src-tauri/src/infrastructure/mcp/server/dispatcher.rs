// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! JSON-RPC method dispatcher for the MCP server.
//!
//! Routes incoming JSON-RPC requests to the appropriate handler based on method name.

use std::sync::Arc;

use serde_json::json;
use tauri::Emitter;
use tokio::sync::RwLock;

use crate::application::mcp_server_service::McpServerService;
#[cfg(test)]
use crate::domain::canvas_state::CanvasStateSnapshot;
use crate::domain::mcp::events::{Actor, EventEnvelope};
use crate::domain::mcp::jsonrpc::{JsonRpcError, JsonRpcId, JsonRpcRequest, JsonRpcResponse};
use crate::domain::mcp::protocol::{
    InitializeResult, ToolCallParams, ToolCallResult, ToolResponseContent, ToolsListResult,
};
use crate::infrastructure::commands::{
    CanvasStateHandle, DriftReviewStore, ProjectContextHandle, SuggestionServiceHandle,
};
use crate::infrastructure::http::execute_http_request;

/// Dispatch a JSON-RPC request string to the appropriate handler.
///
/// Returns `Some(response_json)` for requests, `None` for notifications.
///
/// # Errors
///
/// Parse errors return a JSON-RPC error response.
pub async fn dispatch(
    raw: &str,
    service: &Arc<RwLock<McpServerService>>,
    canvas_state: &CanvasStateHandle,
    project_context: Option<&ProjectContextHandle>,
    suggestion_service: Option<&SuggestionServiceHandle>,
    drift_review_store: &DriftReviewStore,
    app_handle: Option<&tauri::AppHandle>,
) -> Option<String> {
    let request: JsonRpcRequest = match serde_json::from_str(raw) {
        Ok(r) => r,
        Err(e) => {
            let resp = JsonRpcResponse::error(None, JsonRpcError::parse_error());
            tracing::warn!("JSON-RPC parse error: {e}");
            return Some(serde_json::to_string(&resp).unwrap_or_default());
        }
    };

    // Notifications have no id and expect no response
    if request.is_notification() {
        handle_notification(&request.method);
        return None;
    }

    // Flatten Option<Option<JsonRpcId>> → Option<JsonRpcId> for the response.
    // `Some(Some(id))` → `Some(id)`, `Some(None)` (id: null) → `None`, `None` (absent) → `None`
    let id = request.id.clone().flatten();
    let response = match request.method.as_str() {
        "initialize" => handle_initialize(id),
        "tools/list" => handle_tools_list(id, service).await,
        "tools/call" => {
            handle_tools_call(
                id,
                &request,
                service,
                canvas_state,
                project_context,
                suggestion_service,
                drift_review_store,
                app_handle,
            )
            .await
        }
        "ping" => handle_ping(id),
        _ => JsonRpcResponse::error(id, JsonRpcError::method_not_found(&request.method)),
    };

    Some(serde_json::to_string(&response).unwrap_or_default())
}

fn handle_notification(method: &str) {
    match method {
        "notifications/initialized" => {
            tracing::info!("MCP client initialized");
        }
        "notifications/cancelled" => {
            tracing::info!("MCP client cancelled a request");
        }
        other => {
            tracing::debug!("Unknown notification: {other}");
        }
    }
}

fn handle_initialize(id: Option<JsonRpcId>) -> JsonRpcResponse {
    let result = InitializeResult::for_runi();
    JsonRpcResponse::success(
        id,
        serde_json::to_value(result).unwrap_or_else(|_| json!({})),
    )
}

async fn handle_tools_list(
    id: Option<JsonRpcId>,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let svc = service.read().await;
    let tools = svc.list_tools();
    drop(svc);

    let result = ToolsListResult { tools };
    JsonRpcResponse::success(
        id,
        serde_json::to_value(result).unwrap_or_else(|_| json!({})),
    )
}

#[allow(clippy::too_many_arguments)] // All parameters required: MCP JSON-RPC bridge + multiple Tauri service handles
async fn handle_tools_call(
    id: Option<JsonRpcId>,
    request: &JsonRpcRequest,
    service: &Arc<RwLock<McpServerService>>,
    canvas_state: &CanvasStateHandle,
    project_context: Option<&ProjectContextHandle>,
    suggestion_service: Option<&SuggestionServiceHandle>,
    drift_review_store: &DriftReviewStore,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let params: ToolCallParams = match request.params.as_ref() {
        Some(p) => match serde_json::from_value(p.clone()) {
            Ok(params) => params,
            Err(e) => {
                return JsonRpcResponse::error(id, JsonRpcError::invalid_params(&e.to_string()));
            }
        },
        None => {
            return JsonRpcResponse::error(id, JsonRpcError::invalid_params("missing params"));
        }
    };

    // execute_request needs async HTTP — handle it specially to avoid
    // holding the RwLock read guard across an .await point.
    if params.name == "execute_request" {
        return handle_execute_request(id, params.arguments, service).await;
    }

    // open_collection_request needs app_handle to emit Tauri event
    if params.name == "open_collection_request" {
        return handle_open_collection_request(id, params.arguments, service, app_handle).await;
    }

    // Import/refresh/hurl tools need async I/O
    if params.name == "import_collection" {
        return handle_import_collection(id, params.arguments, service).await;
    }
    if params.name == "refresh_collection_spec" {
        return handle_refresh_collection_spec(
            id,
            params.arguments,
            suggestion_service,
            app_handle,
        )
        .await;
    }
    if params.name == "run_hurl_suite" {
        return handle_run_hurl_suite(id, params.arguments).await;
    }

    // Canvas tools read from/write to external state
    if params.name.starts_with("canvas_") {
        return handle_canvas_tool(id, &params.name, params.arguments, canvas_state, app_handle)
            .await;
    }

    // Project context tools read from/write to external state
    if params.name == "get_project_context" || params.name == "set_project_context" {
        return handle_project_context_tool(
            id,
            &params.name,
            params.arguments,
            project_context,
            app_handle,
        );
    }

    // Suggestion tools read from/write to external state
    if params.name == "list_suggestions"
        || params.name == "create_suggestion"
        || params.name == "resolve_suggestion"
    {
        return handle_suggestion_tool(
            id,
            &params.name,
            params.arguments,
            suggestion_service,
            app_handle,
        );
    }

    // Drift review tools read from / write to shared drift review store
    if params.name == "get_drift_review"
        || params.name == "accept_drift_change"
        || params.name == "dismiss_drift_change"
    {
        return handle_drift_review_tool(
            id,
            &params.name,
            params.arguments,
            drift_review_store,
            app_handle,
        )
        .await;
    }

    let mut svc = service.write().await;
    match svc.call_tool(&params.name, params.arguments) {
        Ok(result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            // Tool errors are returned as successful JSON-RPC responses
            // with is_error=true in the MCP result, per the MCP spec.
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `execute_request` tool — async HTTP execution outside the lock.
async fn handle_execute_request(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let args = arguments.unwrap_or_default();

    // Phase 1: Read lock to prepare request params, then drop lock.
    let prepare_result = {
        let svc = service.read().await;
        svc.prepare_execute_request(&args)
    };

    let (request_params, collection_id, request_id) = match prepare_result {
        Ok(result) => result,
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            return JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            );
        }
    };

    // Phase 2: Execute HTTP request without holding any lock.
    let correlation_id = format!("mcp-{collection_id}-{request_id}");
    match execute_http_request(request_params, Some(correlation_id)).await {
        Ok(response) => {
            // Emit event for UI update
            {
                let mut svc = service.write().await;
                svc.emit_execute_event(&collection_id, &request_id, &response);
            }

            let result_json = json!({
                "status": response.status,
                "status_text": response.status_text,
                "headers": response.headers,
                "body": response.body,
                "timing": {
                    "total_ms": response.timing.total_ms,
                    "dns_ms": response.timing.dns_ms,
                    "connect_ms": response.timing.connect_ms,
                    "tls_ms": response.timing.tls_ms,
                    "first_byte_ms": response.timing.first_byte_ms,
                }
            });

            let result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: result_json.to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(result).unwrap_or_else(|_| json!({})),
            )
        }
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: format!("HTTP request failed: {e}"),
                }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `open_collection_request` tool — emit Tauri event with request data.
async fn handle_open_collection_request(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    service: &Arc<RwLock<McpServerService>>,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let args = arguments.unwrap_or_default();

    // Read lock to prepare request data
    let data = {
        let svc = service.read().await;
        svc.prepare_open_collection_request(&args)
    };

    let request_data = match data {
        Ok(d) => d,
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            return JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            );
        }
    };

    // Emit Tauri event if app handle is available
    if let Some(app) = app_handle {
        let envelope = ai_event_envelope(request_data.clone());
        if let Err(e) = app.emit("canvas:open_collection_request", envelope) {
            tracing::warn!("Failed to emit canvas:open_collection_request event: {e}");
        }
    }

    let result = ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json!({
                "collection_id": request_data["collection_id"],
                "request_id": request_data["request_id"],
                "message": format!("Opened request '{}' in canvas", request_data["name"].as_str().unwrap_or("unknown")),
            })
            .to_string(),
        }],
        is_error: false,
    };
    JsonRpcResponse::success(
        id,
        serde_json::to_value(result).unwrap_or_else(|_| json!({})),
    )
}

fn handle_ping(id: Option<JsonRpcId>) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({}))
}

/// Handle `import_collection` tool — async import from URL/file/inline content.
async fn handle_import_collection(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    service: &Arc<RwLock<McpServerService>>,
) -> JsonRpcResponse {
    let args = arguments.unwrap_or_default();

    let request = crate::infrastructure::commands::ImportCollectionRequest {
        url: args
            .get("url")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        file_path: args
            .get("file_path")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        inline_content: args
            .get("inline_content")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        display_name: args
            .get("display_name")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        repo_root: args
            .get("repo_root")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        spec_path: args
            .get("spec_path")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
        ref_name: args
            .get("ref_name")
            .and_then(serde_json::Value::as_str)
            .map(String::from),
    };

    match crate::infrastructure::commands::import_collection_inner(request).await {
        Ok(crate::infrastructure::commands::ImportCollectionResult::Success { collection }) => {
            // Emit event for UI update
            {
                let mut svc = service.write().await;
                svc.emit_import_event(&collection.id, &collection.metadata.name);
            }

            let result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: json!({
                        "collection_id": collection.id,
                        "name": collection.metadata.name,
                        "request_count": collection.requests.len(),
                        "message": format!("Collection '{}' imported successfully", collection.metadata.name),
                    })
                    .to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(result).unwrap_or_else(|_| json!({})),
            )
        }
        Ok(crate::infrastructure::commands::ImportCollectionResult::Conflict {
            existing_id,
            existing_name,
        }) => {
            let result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: json!({
                        "status": "conflict",
                        "existing_id": existing_id,
                        "existing_name": existing_name,
                        "message": format!(
                            "A collection named '{}' already exists. Use replace_collection_spec to update it.",
                            existing_name
                        ),
                    })
                    .to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(result).unwrap_or_else(|_| json!({})),
            )
        }
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `refresh_collection_spec` tool — async spec refresh with drift.
///
/// Emits `collection:refreshed` with the full payload (including `collection_id`)
/// using `Actor::Ai`. Auto-creates drift suggestions via the suggestion service.
async fn handle_refresh_collection_spec(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    suggestion_service: Option<&SuggestionServiceHandle>,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let args = arguments.unwrap_or_default();
    let Some(collection_id) = args
        .get("collection_id")
        .and_then(serde_json::Value::as_str)
    else {
        let error_result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Missing required parameter: collection_id".to_string(),
            }],
            is_error: true,
        };
        return JsonRpcResponse::success(
            id,
            serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
        );
    };
    let collection_id = collection_id.to_string();

    // Optional: compare against a different spec file/URL instead of stored source
    let new_spec_path = args
        .get("new_spec_path")
        .and_then(serde_json::Value::as_str)
        .map(str::to_string);

    // Check if collection has repo_root to decide if git adapter is needed
    let needs_git =
        crate::infrastructure::storage::collection_store::load_collection(&collection_id)
            .map(|c| c.source.repo_root.is_some())
            .unwrap_or(false);

    let service = if needs_git {
        crate::application::import_service::ImportService::with_git_metadata(
            vec![Box::new(
                crate::infrastructure::spec::openapi_parser::OpenApiParser,
            )],
            Box::new(crate::infrastructure::spec::http_fetcher::HttpContentFetcher),
            Box::new(crate::infrastructure::git::GitCliAdapter),
        )
    } else {
        crate::application::import_service::ImportService::new(
            vec![Box::new(
                crate::infrastructure::spec::openapi_parser::OpenApiParser,
            )],
            Box::new(crate::infrastructure::spec::http_fetcher::HttpContentFetcher),
        )
    };

    match crate::infrastructure::commands::refresh_collection_spec_inner_with_source(
        &collection_id,
        &service,
        new_spec_path.as_deref(),
    )
    .await
    {
        Ok(result) => {
            // Emit full payload with collection_id, using Actor::Ai
            if let Some(app) = app_handle {
                let mut payload = serde_json::to_value(&result).unwrap_or_else(|_| json!({}));
                if let serde_json::Value::Object(ref mut map) = payload {
                    map.insert(
                        "collection_id".to_string(),
                        serde_json::Value::String(collection_id.clone()),
                    );
                }
                let envelope = ai_event_envelope(payload);
                if let Err(e) = app.emit("collection:refreshed", envelope) {
                    tracing::warn!("Failed to emit collection:refreshed event: {e}");
                }
            }

            // Auto-create suggestions for breaking changes, emitting events if app handle available
            if let Some(svc) = suggestion_service {
                if let Some(app) = app_handle {
                    crate::infrastructure::commands::auto_create_drift_suggestions(
                        &result,
                        &collection_id,
                        svc,
                        app,
                    );
                }
            }

            let result_json = serde_json::to_value(&result).unwrap_or_else(|_| json!({}));
            let tool_result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: result_json.to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
            )
        }
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `run_hurl_suite` tool — async hurl test execution.
async fn handle_run_hurl_suite(
    id: Option<JsonRpcId>,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
) -> JsonRpcResponse {
    use crate::domain::collection::test_port::{TestRunConfig, TestRunner};
    use crate::infrastructure::hurl::HurlRunner;

    let args = arguments.unwrap_or_default();
    let Some(hurl_file_path) = args
        .get("hurl_file_path")
        .and_then(serde_json::Value::as_str)
    else {
        let error_result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Missing required parameter: hurl_file_path".to_string(),
            }],
            is_error: true,
        };
        return JsonRpcResponse::success(
            id,
            serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
        );
    };
    let hurl_file_path = hurl_file_path.to_string();

    let collection_id = args
        .get("collection_id")
        .and_then(serde_json::Value::as_str)
        .map(String::from);

    let env_vars: std::collections::HashMap<String, String> = args
        .get("env_vars")
        .and_then(serde_json::Value::as_object)
        .map(|obj| {
            obj.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default();

    let config = TestRunConfig {
        file_path: hurl_file_path,
        env_vars,
        timeout_secs: None,
    };

    let run_result = tokio::task::spawn_blocking(move || {
        let runner = HurlRunner;
        runner.run(&config)
    })
    .await;

    match run_result {
        Ok(Ok(result)) => {
            let result_json = json!({
                "exit_code": result.exit_code,
                "passed": result.passed,
                "test_count": result.test_count,
                "failure_count": result.failure_count,
                "duration_ms": result.duration_ms,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "collection_id": collection_id,
            });
            let tool_result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: result_json.to_string(),
                }],
                is_error: false,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
            )
        }
        Ok(Err(e)) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: format!("Task join error: {e}"),
                }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle canvas tools (observation and mutation).
async fn handle_canvas_tool(
    id: Option<JsonRpcId>,
    tool_name: &str,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    canvas_state: &CanvasStateHandle,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let result = match tool_name {
        // Phase 1: Observation tools (read from canvas state)
        "canvas_list_tabs" => handle_canvas_list_tabs(canvas_state).await,
        "canvas_get_active_tab" => handle_canvas_get_active_tab(canvas_state).await,
        "canvas_list_templates" => handle_canvas_list_templates(canvas_state).await,

        // Phase 2: Mutation tools (emit events via app handle)
        "canvas_switch_tab" => handle_canvas_switch_tab(arguments, app_handle),
        "canvas_open_request_tab" => handle_canvas_open_request_tab(arguments, app_handle),
        "canvas_close_tab" => handle_canvas_close_tab(arguments, app_handle),

        // Phase 3: Streaming tools
        "canvas_subscribe_stream" => Ok(handle_canvas_subscribe_stream(arguments)),

        _ => Err(format!("Unknown canvas tool: {tool_name}")),
    };

    match result {
        Ok(tool_result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Construct an `EventEnvelope` with AI actor provenance for MCP-driven events.
///
/// MCP tool calls emit events attributed to AI, enabling the frontend to
/// distinguish AI actions from user actions and gate viewport navigation
/// based on Follow AI mode.
fn ai_event_envelope(payload: serde_json::Value) -> serde_json::Value {
    let envelope = EventEnvelope {
        actor: Actor::Ai {
            model: None,
            session_id: None,
        },
        timestamp: chrono::Utc::now().to_rfc3339(),
        correlation_id: None,
        lamport: None,
        payload,
    };
    serde_json::to_value(envelope).unwrap_or_else(|_| serde_json::json!({}))
}

// Phase 1: Canvas observation tools

async fn handle_canvas_list_tabs(
    canvas_state: &CanvasStateHandle,
) -> Result<ToolCallResult, String> {
    let state = canvas_state.read().await;
    let tabs_json =
        serde_json::to_value(&state.tabs).map_err(|e| format!("Failed to serialize tabs: {e}"))?;
    drop(state);

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: tabs_json.to_string(),
        }],
        is_error: false,
    })
}

async fn handle_canvas_get_active_tab(
    canvas_state: &CanvasStateHandle,
) -> Result<ToolCallResult, String> {
    let state = canvas_state.read().await;
    let active_tab_json = match state.active_tab() {
        Some(tab) => {
            serde_json::to_value(tab).map_err(|e| format!("Failed to serialize active tab: {e}"))?
        }
        None => json!(null),
    };
    drop(state);

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: active_tab_json.to_string(),
        }],
        is_error: false,
    })
}

async fn handle_canvas_list_templates(
    canvas_state: &CanvasStateHandle,
) -> Result<ToolCallResult, String> {
    let state = canvas_state.read().await;
    let templates_json = serde_json::to_value(&state.templates)
        .map_err(|e| format!("Failed to serialize templates: {e}"))?;
    drop(state);

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: templates_json.to_string(),
        }],
        is_error: false,
    })
}

// Phase 2: Canvas mutation tools

fn handle_canvas_switch_tab(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let Some(app) = app_handle else {
        return Err("App handle not available (MCP server running without UI)".to_string());
    };

    let args = arguments.unwrap_or_default();
    let tab_id = args
        .get("tab_id")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: tab_id".to_string())?;

    // Emit event to frontend with AI actor provenance
    let envelope = ai_event_envelope(json!({"contextId": tab_id}));
    app.emit("canvas:switch_tab", envelope)
        .map_err(|e| format!("Failed to emit canvas:switch_tab event: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json!({"tab_id": tab_id, "message": "Tab switch requested"}).to_string(),
        }],
        is_error: false,
    })
}

fn handle_canvas_open_request_tab(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let Some(app) = app_handle else {
        return Err("App handle not available (MCP server running without UI)".to_string());
    };

    let args = arguments.unwrap_or_default();
    let label = args
        .get("label")
        .and_then(serde_json::Value::as_str)
        .unwrap_or("Request");

    // Emit event to frontend with AI actor provenance
    let envelope = ai_event_envelope(json!({"label": label}));
    app.emit("canvas:open_request_tab", envelope)
        .map_err(|e| format!("Failed to emit canvas:open_request_tab event: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json!({"label": label, "message": "Request tab open requested"}).to_string(),
        }],
        is_error: false,
    })
}

fn handle_canvas_close_tab(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let Some(app) = app_handle else {
        return Err("App handle not available (MCP server running without UI)".to_string());
    };

    let args = arguments.unwrap_or_default();
    let tab_id = args
        .get("tab_id")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: tab_id".to_string())?;

    // Emit event to frontend with AI actor provenance
    let envelope = ai_event_envelope(json!({"contextId": tab_id}));
    app.emit("canvas:close_tab", envelope)
        .map_err(|e| format!("Failed to emit canvas:close_tab event: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json!({"tab_id": tab_id, "message": "Tab close requested"}).to_string(),
        }],
        is_error: false,
    })
}

// Phase 3: Canvas streaming tools

/// Default port for the MCP server's SSE endpoint.
const DEFAULT_SSE_PORT: u16 = crate::infrastructure::mcp::commands::DEFAULT_MCP_PORT;

fn handle_canvas_subscribe_stream(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
) -> ToolCallResult {
    let args = arguments.unwrap_or_default();
    let stream = args
        .get("stream")
        .and_then(serde_json::Value::as_str)
        .unwrap_or("canvas");

    // Validate stream name to prevent URL injection
    if !stream
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
    {
        return ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({"error": "Invalid stream name. Only alphanumerics, hyphens, and underscores allowed."}).to_string(),
            }],
            is_error: true,
        };
    }

    let url = format!("http://127.0.0.1:{DEFAULT_SSE_PORT}/mcp/sse/subscribe?stream={stream}");

    ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json!({"url": url}).to_string(),
        }],
        is_error: false,
    }
}

// ── Project Context Tools ──────────────────────────────────────────

/// Handle project context tools (`get_project_context`, `set_project_context`).
fn handle_project_context_tool(
    id: Option<JsonRpcId>,
    tool_name: &str,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    project_context: Option<&ProjectContextHandle>,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let Some(ctx_svc) = project_context else {
        let error_result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Project context service not available".to_string(),
            }],
            is_error: true,
        };
        return JsonRpcResponse::success(
            id,
            serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
        );
    };

    let result = match tool_name {
        "get_project_context" => handle_get_project_context(ctx_svc),
        "set_project_context" => handle_set_project_context(arguments, ctx_svc, app_handle),
        _ => Err(format!("Unknown project context tool: {tool_name}")),
    };

    match result {
        Ok(tool_result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `get_project_context` — return the current project context.
fn handle_get_project_context(ctx_svc: &ProjectContextHandle) -> Result<ToolCallResult, String> {
    let ctx = ctx_svc.get_context()?;
    let ctx_json =
        serde_json::to_value(&ctx).map_err(|e| format!("Failed to serialize context: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: ctx_json.to_string(),
        }],
        is_error: false,
    })
}

/// Handle `set_project_context` — apply a partial update and emit event.
fn handle_set_project_context(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    ctx_svc: &ProjectContextHandle,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let update_value = serde_json::Value::Object(args);
    let update: crate::domain::project_context::ProjectContextUpdate =
        serde_json::from_value(update_value).map_err(|e| format!("Invalid update payload: {e}"))?;

    let ctx = ctx_svc.update_context(&update)?;

    // Emit context:updated Tauri event for frontend sync (wrapped in EventEnvelope)
    if let Some(handle) = app_handle {
        let payload =
            serde_json::to_value(&ctx).map_err(|e| format!("Failed to serialize context: {e}"))?;
        let envelope = ai_event_envelope(payload);
        if let Err(e) = handle.emit("context:updated", &envelope) {
            tracing::warn!("Failed to emit context:updated event: {e}");
        }
    }

    let ctx_json =
        serde_json::to_value(&ctx).map_err(|e| format!("Failed to serialize context: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: ctx_json.to_string(),
        }],
        is_error: false,
    })
}

// ── Suggestion Tools (Vigilance Monitor) ───────────────────────────

/// Handle suggestion tools (`list_suggestions`, `create_suggestion`, `resolve_suggestion`).
fn handle_suggestion_tool(
    id: Option<JsonRpcId>,
    tool_name: &str,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    suggestion_service: Option<&SuggestionServiceHandle>,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let Some(svc) = suggestion_service else {
        let error_result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Suggestion service not available".to_string(),
            }],
            is_error: true,
        };
        return JsonRpcResponse::success(
            id,
            serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
        );
    };

    let result = match tool_name {
        "list_suggestions" => handle_list_suggestions(arguments, svc),
        "create_suggestion" => handle_create_suggestion(arguments, svc, app_handle),
        "resolve_suggestion" => handle_resolve_suggestion(arguments, svc, app_handle),
        _ => Err(format!("Unknown suggestion tool: {tool_name}")),
    };

    match result {
        Ok(tool_result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `list_suggestions` — list all or filtered suggestions.
fn handle_list_suggestions(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    svc: &SuggestionServiceHandle,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let status_filter = args
        .get("status")
        .and_then(|v| v.as_str())
        .map(|s| {
            serde_json::from_value::<crate::domain::suggestion::SuggestionStatus>(
                serde_json::Value::String(s.to_string()),
            )
        })
        .transpose()
        .map_err(|e| format!("Invalid status filter: {e}"))?;

    let suggestions = svc.list_suggestions(status_filter)?;
    let json = serde_json::to_value(&suggestions)
        .map_err(|e| format!("Failed to serialize suggestions: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json.to_string(),
        }],
        is_error: false,
    })
}

/// Handle `create_suggestion` — create a new suggestion and emit event.
fn handle_create_suggestion(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    svc: &SuggestionServiceHandle,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let req_value = serde_json::Value::Object(args);
    let req: crate::domain::suggestion::CreateSuggestionRequest = serde_json::from_value(req_value)
        .map_err(|e| format!("Invalid create suggestion payload: {e}"))?;

    let suggestion = svc.create_suggestion(&req)?;

    // Emit suggestion:created Tauri event for frontend sync (wrapped in EventEnvelope)
    if let Some(handle) = app_handle {
        let payload = serde_json::to_value(&suggestion)
            .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;
        let envelope = ai_event_envelope(payload);
        if let Err(e) = handle.emit("suggestion:created", &envelope) {
            tracing::warn!("Failed to emit suggestion:created event: {e}");
        }
    }

    let json = serde_json::to_value(&suggestion)
        .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json.to_string(),
        }],
        is_error: false,
    })
}

/// Handle `resolve_suggestion` — accept or dismiss a suggestion and emit event.
fn handle_resolve_suggestion(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    svc: &SuggestionServiceHandle,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let id = args
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("Missing required field: id")?;
    let status_str = args
        .get("status")
        .and_then(|v| v.as_str())
        .ok_or("Missing required field: status")?;

    let status: crate::domain::suggestion::SuggestionStatus =
        serde_json::from_value(serde_json::Value::String(status_str.to_string()))
            .map_err(|e| format!("Invalid status: {e}"))?;

    let suggestion = svc.resolve_suggestion(id, status)?;

    // Emit suggestion:resolved Tauri event for frontend sync (wrapped in EventEnvelope)
    if let Some(handle) = app_handle {
        let payload = serde_json::to_value(&suggestion)
            .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;
        let envelope = ai_event_envelope(payload);
        if let Err(e) = handle.emit("suggestion:resolved", &envelope) {
            tracing::warn!("Failed to emit suggestion:resolved event: {e}");
        }
    }

    let json = serde_json::to_value(&suggestion)
        .map_err(|e| format!("Failed to serialize suggestion: {e}"))?;

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: json.to_string(),
        }],
        is_error: false,
    })
}

// ── Drift Review Tools ─────────────────────────────────────────────

/// Handle drift review tools (`get_drift_review`, `accept_drift_change`, `dismiss_drift_change`).
///
/// All three tools share the same in-memory `DriftReviewStore`. Keys use the
/// format `"{collection_id}:{method}:{path}"`. Values are `"accepted"` or
/// `"ignored"`. Absent keys are implicitly `"pending"`.
async fn handle_drift_review_tool(
    id: Option<JsonRpcId>,
    tool_name: &str,
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    drift_review_store: &DriftReviewStore,
    app_handle: Option<&tauri::AppHandle>,
) -> JsonRpcResponse {
    let result = match tool_name {
        "get_drift_review" => handle_get_drift_review(arguments, drift_review_store).await,
        "accept_drift_change" => {
            handle_accept_drift_change(arguments, drift_review_store, app_handle).await
        }
        "dismiss_drift_change" => {
            handle_dismiss_drift_change(arguments, drift_review_store, app_handle).await
        }
        _ => Err(format!("Unknown drift review tool: {tool_name}")),
    };

    match result {
        Ok(tool_result) => JsonRpcResponse::success(
            id,
            serde_json::to_value(tool_result).unwrap_or_else(|_| json!({})),
        ),
        Err(e) => {
            let error_result = ToolCallResult {
                content: vec![ToolResponseContent::Text { text: e }],
                is_error: true,
            };
            JsonRpcResponse::success(
                id,
                serde_json::to_value(error_result).unwrap_or_else(|_| json!({})),
            )
        }
    }
}

/// Handle `get_drift_review` — return the session-scoped review state for a collection.
///
/// Returns all review decisions for the given collection keyed by
/// `"{method}:{path}"`. Operations absent from the map are implicitly
/// `"pending"`. Drift groupings (removed/changed/added) are provided by the
/// `refresh_collection_spec` tool call that produced the drift data; this tool
/// surfaces only the accepted/ignored decisions made since then.
async fn handle_get_drift_review(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    drift_review_store: &DriftReviewStore,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let collection_id = args
        .get("collection_id")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;

    let prefix = format!("{collection_id}:");

    let store = drift_review_store.lock().await;

    // Collect all review decisions for this collection
    let review_state: serde_json::Map<String, serde_json::Value> = store
        .iter()
        .filter_map(|(key, status)| {
            key.strip_prefix(&prefix).map(|operation_key| {
                (
                    operation_key.to_string(),
                    serde_json::Value::String(status.clone()),
                )
            })
        })
        .collect();

    drop(store);

    let result_json = json!({
        "collection_id": collection_id,
        "review_state": review_state,
    });

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: result_json.to_string(),
        }],
        is_error: false,
    })
}

/// Handle `accept_drift_change` — mark a drift change as accepted.
///
/// Writes `"accepted"` to the shared store for the key
/// `"{collection_id}:{method}:{path}"` and emits a `drift:change-accepted`
/// Tauri event wrapped in an `EventEnvelope` with `Actor::Ai`.
///
/// # Event payload
///
/// ```json
/// {
///   "actor": { "type": "ai", "model": null, "session_id": null },
///   "timestamp": "<ISO-8601>",
///   "payload": {
///     "collection_id": "...",
///     "method": "DELETE",
///     "path": "/books/{id}",
///     "status": "accepted"
///   }
/// }
/// ```
async fn handle_accept_drift_change(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    drift_review_store: &DriftReviewStore,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let collection_id = args
        .get("collection_id")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
    let method = args
        .get("method")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: method".to_string())?;
    let path = args
        .get("path")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: path".to_string())?;

    let key = format!("{collection_id}:{method}:{path}");
    {
        let mut store = drift_review_store.lock().await;
        store.insert(key, "accepted".to_string());
    }

    let event_payload = json!({
        "collection_id": collection_id,
        "method": method,
        "path": path,
        "status": "accepted",
    });

    if let Some(app) = app_handle {
        let envelope = ai_event_envelope(event_payload.clone());
        if let Err(e) = app.emit("drift:change-accepted", envelope) {
            tracing::warn!("Failed to emit drift:change-accepted event: {e}");
        }
    }

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: event_payload.to_string(),
        }],
        is_error: false,
    })
}

/// Handle `dismiss_drift_change` — mark a drift change as ignored.
///
/// Writes `"ignored"` to the shared store for the key
/// `"{collection_id}:{method}:{path}"` and emits a `drift:change-dismissed`
/// Tauri event wrapped in an `EventEnvelope` with `Actor::Ai`.
///
/// # Event payload
///
/// ```json
/// {
///   "actor": { "type": "ai", "model": null, "session_id": null },
///   "timestamp": "<ISO-8601>",
///   "payload": {
///     "collection_id": "...",
///     "method": "PUT",
///     "path": "/books/{id}",
///     "status": "ignored"
///   }
/// }
/// ```
async fn handle_dismiss_drift_change(
    arguments: Option<serde_json::Map<String, serde_json::Value>>,
    drift_review_store: &DriftReviewStore,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<ToolCallResult, String> {
    let args = arguments.unwrap_or_default();
    let collection_id = args
        .get("collection_id")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
    let method = args
        .get("method")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: method".to_string())?;
    let path = args
        .get("path")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "Missing required parameter: path".to_string())?;

    let key = format!("{collection_id}:{method}:{path}");
    {
        let mut store = drift_review_store.lock().await;
        store.insert(key, "ignored".to_string());
    }

    let event_payload = json!({
        "collection_id": collection_id,
        "method": method,
        "path": path,
        "status": "ignored",
    });

    if let Some(app) = app_handle {
        let envelope = ai_event_envelope(event_payload.clone());
        if let Err(e) = app.emit("drift:change-dismissed", envelope) {
            tracing::warn!("Failed to emit drift:change-dismissed event: {e}");
        }
    }

    Ok(ToolCallResult {
        content: vec![ToolResponseContent::Text {
            text: event_payload.to_string(),
        }],
        is_error: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_service() -> (
        Arc<RwLock<McpServerService>>,
        CanvasStateHandle,
        DriftReviewStore,
        TempDir,
    ) {
        let dir = TempDir::new().unwrap();
        let service = McpServerService::new(dir.path().to_path_buf());
        let canvas_state = Arc::new(RwLock::new(CanvasStateSnapshot::new()));
        let drift_store = Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new()));
        (
            Arc::new(RwLock::new(service)),
            canvas_state,
            drift_store,
            dir,
        )
    }

    #[tokio::test]
    async fn test_dispatch_initialize() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert_eq!(result["protocolVersion"], "2025-11-25");
        assert_eq!(result["serverInfo"]["name"], "runi");
    }

    #[tokio::test]
    async fn test_dispatch_tools_list() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        let tools = result["tools"].as_array().unwrap();
        // 8 collection + 3 save/move/copy + 3 import/refresh/hurl + 6 canvas + 1 streaming
        // + 2 project context + 1 execute_request + 3 suggestion + 3 environment
        // + 3 drift review = 33 total
        assert_eq!(tools.len(), 33);
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_create_collection() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "create_collection",
                "arguments": { "name": "My API" }
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_unknown_tool() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "nonexistent",
                "arguments": {}
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        // Tool errors are returned as success with is_error=true
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(result["isError"].as_bool().unwrap_or(false));
    }

    #[tokio::test]
    async fn test_dispatch_tools_call_missing_params() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        assert_eq!(parsed.error.unwrap().code, -32602);
    }

    #[tokio::test]
    async fn test_dispatch_unknown_method() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 6,
            "method": "unknown/method"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        let err = parsed.error.unwrap();
        assert_eq!(err.code, -32601);
        assert!(err.message.contains("unknown/method"));
    }

    #[tokio::test]
    async fn test_dispatch_notification_returns_none() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await;
        assert!(resp.is_none());
    }

    #[tokio::test]
    async fn test_dispatch_parse_error() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let resp = dispatch(
            "not valid json",
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_some());
        assert_eq!(parsed.error.unwrap().code, -32700);
    }

    #[tokio::test]
    async fn test_dispatch_ping() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 7,
            "method": "ping"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
    }

    #[tokio::test]
    async fn test_dispatch_string_id() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": "abc-123",
            "method": "ping"
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert_eq!(parsed.id, Some(JsonRpcId::String("abc-123".to_string())));
    }

    #[tokio::test]
    async fn test_e2e_through_fake_transport() {
        use crate::domain::mcp::transport::Transport;
        use crate::infrastructure::mcp::fake_transport::FakeTransport;

        let (service, canvas_state, drift_store, _dir) = make_service();
        let transport = FakeTransport::new();

        // Inject initialize request
        let init_req = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        .to_string();
        transport.inject(init_req).unwrap();

        // Read from receiver, dispatch, send response
        let mut rx = transport.receiver().await;
        let msg = rx.recv().await.unwrap();
        if let Some(response) = dispatch(
            &msg,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        {
            transport.send(response).await.unwrap();
        }

        // Verify response was captured
        let sent = transport.sent_messages().await;
        assert_eq!(sent.len(), 1);
        let resp: JsonRpcResponse = serde_json::from_str(&sent[0]).unwrap();
        assert!(resp.error.is_none());
        let result = resp.result.unwrap();
        assert_eq!(result["serverInfo"]["name"], "runi");
    }

    #[tokio::test]
    #[allow(clippy::too_many_lines)] // Integration test for execute_request; complexity is intrinsic
    async fn test_dispatch_execute_request() {
        use std::io::{Read, Write};
        use std::net::TcpListener;

        // Start a minimal test HTTP server
        let listener = match TcpListener::bind("127.0.0.1:0") {
            Ok(l) => l,
            Err(err) if err.kind() == std::io::ErrorKind::PermissionDenied => {
                eprintln!("[TEST] Skipping: {err}");
                return;
            }
            Err(err) => panic!("bind: {err}"),
        };
        let addr = listener.local_addr().unwrap();
        let base_url = format!("http://{addr}");

        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut buf = [0u8; 1024];
            let _ = stream.read(&mut buf);
            let body = r#"{"ok": true}"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            stream.write_all(response.as_bytes()).unwrap();
        });

        let (service, canvas_state, drift_store, _dir) = make_service();

        // Create collection
        let create_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": { "name": "create_collection", "arguments": { "name": "Test" } }
        })
        .to_string();
        let resp = dispatch(
            &create_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let create_result = parsed.result.unwrap();
        let content_text: serde_json::Value =
            serde_json::from_str(create_result["content"][0]["text"].as_str().unwrap()).unwrap();
        let collection_id = content_text["id"].as_str().unwrap();

        // Add request
        let add_req = json!({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {
                "name": "add_request",
                "arguments": {
                    "collection_id": collection_id,
                    "name": "Test Request",
                    "method": "GET",
                    "url": format!("{}/test", base_url)
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &add_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let add_result = parsed.result.unwrap();
        let add_text: serde_json::Value =
            serde_json::from_str(add_result["content"][0]["text"].as_str().unwrap()).unwrap();
        let request_id = add_text["request_id"].as_str().unwrap();

        // Execute request
        let exec_req = json!({
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {
                "name": "execute_request",
                "arguments": {
                    "collection_id": collection_id,
                    "request_id": request_id,
                    "timeout_ms": 5000
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &exec_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none(), "JSON-RPC should succeed");
        let exec_result = parsed.result.unwrap();
        assert!(
            !exec_result["isError"].as_bool().unwrap_or(false),
            "Tool should succeed"
        );

        // Parse the HTTP response from the tool result
        let result_text: serde_json::Value =
            serde_json::from_str(exec_result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert_eq!(result_text["status"], 200);
        assert!(result_text["body"].as_str().unwrap().contains("ok"));
    }

    #[tokio::test]
    async fn test_dispatch_execute_request_missing_collection() {
        let (service, canvas_state, drift_store, _dir) = make_service();

        let exec_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": "execute_request",
                "arguments": {
                    "collection_id": "nonexistent",
                    "request_id": "req_1"
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &exec_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(
            parsed.error.is_none(),
            "JSON-RPC should succeed (tool error in result)"
        );
        let result = parsed.result.unwrap();
        assert!(
            result["isError"].as_bool().unwrap_or(false),
            "Tool should return error"
        );
    }

    #[tokio::test]
    async fn test_canvas_subscribe_stream_returns_url() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 10,
            "method": "tools/call",
            "params": {
                "name": "canvas_subscribe_stream",
                "arguments": {}
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));

        let text = result["content"][0]["text"].as_str().unwrap();
        let url_result: serde_json::Value = serde_json::from_str(text).unwrap();
        let url = url_result["url"].as_str().unwrap();
        assert!(url.contains("/mcp/sse/subscribe?stream=canvas"));
        assert!(url.contains("127.0.0.1:3002"));
    }

    #[tokio::test]
    async fn test_canvas_subscribe_stream_custom_stream() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0",
            "id": 11,
            "method": "tools/call",
            "params": {
                "name": "canvas_subscribe_stream",
                "arguments": { "stream": "collections" }
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let result = parsed.result.unwrap();
        let text = result["content"][0]["text"].as_str().unwrap();
        let url_result: serde_json::Value = serde_json::from_str(text).unwrap();
        let url = url_result["url"].as_str().unwrap();
        assert!(url.contains("stream=collections"));
    }

    #[tokio::test]
    async fn test_dispatch_open_collection_request_not_found() {
        let (service, canvas_state, drift_store, _dir) = make_service();

        // Create collection first
        let create_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": { "name": "create_collection", "arguments": { "name": "Test" } }
        })
        .to_string();
        let resp = dispatch(
            &create_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let create_result = parsed.result.unwrap();
        let content_text: serde_json::Value =
            serde_json::from_str(create_result["content"][0]["text"].as_str().unwrap()).unwrap();
        let collection_id = content_text["id"].as_str().unwrap();

        // Try to open nonexistent request
        let open_req = json!({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {
                "name": "open_collection_request",
                "arguments": {
                    "collection_id": collection_id,
                    "request_id": "nonexistent"
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &open_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(
            parsed.error.is_none(),
            "JSON-RPC should succeed (tool error in result)"
        );
        let result = parsed.result.unwrap();
        assert!(
            result["isError"].as_bool().unwrap_or(false),
            "Tool should return error"
        );
    }

    #[tokio::test]
    async fn test_dispatch_open_collection_request_success() {
        let (service, canvas_state, drift_store, _dir) = make_service();

        // Create collection + request
        let create_req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": { "name": "create_collection", "arguments": { "name": "Test" } }
        })
        .to_string();
        let resp = dispatch(
            &create_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let content_text: serde_json::Value = serde_json::from_str(
            parsed.result.unwrap()["content"][0]["text"]
                .as_str()
                .unwrap(),
        )
        .unwrap();
        let collection_id = content_text["id"].as_str().unwrap();

        let add_req = json!({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {
                "name": "add_request",
                "arguments": {
                    "collection_id": collection_id,
                    "name": "Test Req",
                    "method": "GET",
                    "url": "https://example.com"
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &add_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        let add_text: serde_json::Value = serde_json::from_str(
            parsed.result.unwrap()["content"][0]["text"]
                .as_str()
                .unwrap(),
        )
        .unwrap();
        let request_id = add_text["request_id"].as_str().unwrap();

        // Open request (no app_handle, so no event emitted, but should still succeed)
        let open_req = json!({
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {
                "name": "open_collection_request",
                "arguments": {
                    "collection_id": collection_id,
                    "request_id": request_id
                }
            }
        })
        .to_string();
        let resp = dispatch(
            &open_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));

        let text: serde_json::Value =
            serde_json::from_str(result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert!(text["message"].as_str().unwrap().contains("Opened request"));
    }

    // ── Test 3B.2: import_collection tool delegates to ImportService ─

    #[tokio::test]
    #[serial_test::serial]
    async fn test_dispatch_import_collection_with_inline_content() {
        use crate::infrastructure::storage::collection_store::with_collections_dir_override_async;

        let dir = TempDir::new().unwrap();
        let (service, canvas_state, drift_store, _server_dir) = make_service();

        let inline_spec = r#"{
            "openapi": "3.0.0",
            "info": { "title": "MCP Import Test", "version": "1.0.0" },
            "paths": {
                "/health": {
                    "get": {
                        "operationId": "healthCheck",
                        "summary": "Health check",
                        "responses": { "200": { "description": "OK" } }
                    }
                }
            }
        }"#;

        let result = with_collections_dir_override_async(dir.path().to_path_buf(), || async {
            let req = json!({
                "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {
                    "name": "import_collection",
                    "arguments": { "inline_content": inline_spec }
                }
            })
            .to_string();
            dispatch(
                &req,
                &service,
                &canvas_state,
                None,
                None,
                &drift_store,
                None,
            )
            .await
            .unwrap()
        })
        .await;

        let parsed: JsonRpcResponse = serde_json::from_str(&result).unwrap();
        assert!(parsed.error.is_none());
        let tool_result = parsed.result.unwrap();
        assert!(
            !tool_result["isError"].as_bool().unwrap_or(false),
            "import should succeed"
        );
        let text: serde_json::Value =
            serde_json::from_str(tool_result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert!(text["collection_id"].as_str().is_some());
        assert_eq!(text["name"].as_str().unwrap(), "MCP Import Test");
        assert!(text["message"].as_str().unwrap().contains("imported"));
    }

    // ── Test 3B.3: import_collection error for invalid input ────────

    #[tokio::test]
    #[serial_test::serial]
    async fn test_dispatch_import_collection_no_source_returns_error() {
        use crate::infrastructure::storage::collection_store::with_collections_dir_override_async;

        let dir = TempDir::new().unwrap();
        let (service, canvas_state, drift_store, _server_dir) = make_service();

        let result = with_collections_dir_override_async(dir.path().to_path_buf(), || async {
            let req = json!({
                "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {
                    "name": "import_collection",
                    "arguments": {}
                }
            })
            .to_string();
            dispatch(
                &req,
                &service,
                &canvas_state,
                None,
                None,
                &drift_store,
                None,
            )
            .await
            .unwrap()
        })
        .await;

        let parsed: JsonRpcResponse = serde_json::from_str(&result).unwrap();
        assert!(parsed.error.is_none(), "JSON-RPC should succeed");
        let tool_result = parsed.result.unwrap();
        assert!(
            tool_result["isError"].as_bool().unwrap_or(false),
            "Tool should return error"
        );
        let text = tool_result["content"][0]["text"].as_str().unwrap();
        assert!(text.contains("Must provide"));
    }

    // ── Test 3B.5: refresh_collection_spec missing collection ───────

    #[tokio::test]
    async fn test_dispatch_refresh_collection_spec_missing_id() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": "refresh_collection_spec",
                "arguments": {}
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(result["isError"].as_bool().unwrap_or(false));
        let text = result["content"][0]["text"].as_str().unwrap();
        assert!(text.contains("collection_id"));
    }

    // ── Test 3B.6: run_hurl_suite missing path ──────────────────────

    #[tokio::test]
    async fn test_dispatch_run_hurl_suite_missing_path() {
        let (service, canvas_state, drift_store, _dir) = make_service();
        let req = json!({
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": "run_hurl_suite",
                "arguments": {}
            }
        })
        .to_string();

        let resp = dispatch(
            &req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(result["isError"].as_bool().unwrap_or(false));
        let text = result["content"][0]["text"].as_str().unwrap();
        assert!(text.contains("hurl_file_path"));
    }

    // ── Test 3B.7: MCP events emitted on import ─────────────────────

    #[tokio::test]
    #[serial_test::serial]
    async fn test_dispatch_import_collection_emits_event() {
        use crate::domain::mcp::events::TestEventEmitter;
        use crate::infrastructure::storage::collection_store::with_collections_dir_override_async;

        let dir = TempDir::new().unwrap();
        let emitter = TestEventEmitter::new();
        let events = emitter.events_handle();
        let mcp_service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));
        let service = Arc::new(RwLock::new(mcp_service));
        let canvas_state = Arc::new(RwLock::new(CanvasStateSnapshot::new()));
        let drift_store: DriftReviewStore =
            Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new()));

        let inline_spec = r#"{
            "openapi": "3.0.0",
            "info": { "title": "Event Test", "version": "1.0.0" },
            "paths": {}
        }"#;

        with_collections_dir_override_async(dir.path().to_path_buf(), || async {
            let req = json!({
                "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {
                    "name": "import_collection",
                    "arguments": { "inline_content": inline_spec }
                }
            })
            .to_string();
            dispatch(
                &req,
                &service,
                &canvas_state,
                None,
                None,
                &drift_store,
                None,
            )
            .await
            .unwrap()
        })
        .await;

        let has_import_event = events
            .lock()
            .expect("lock events")
            .iter()
            .any(|(name, _, _)| name == "collection:imported");
        assert!(has_import_event, "Should emit collection:imported event");
    }

    #[test]
    fn test_ai_event_envelope_produces_ai_actor() {
        use crate::domain::mcp::events::{Actor, EventEnvelope};

        let payload = json!({"contextId": "tab_1"});
        let envelope_value = ai_event_envelope(payload.clone());

        let envelope: EventEnvelope = serde_json::from_value(envelope_value).unwrap();

        // Verify actor is AI with no model/session info
        assert_eq!(
            envelope.actor,
            Actor::Ai {
                model: None,
                session_id: None
            }
        );

        // Verify payload is preserved
        assert_eq!(envelope.payload, payload);

        // Verify timestamp is present and valid ISO 8601
        assert!(!envelope.timestamp.is_empty());
        chrono::DateTime::parse_from_rfc3339(&envelope.timestamp).unwrap();

        // Verify optional fields are None
        assert!(envelope.correlation_id.is_none());
        assert!(envelope.lamport.is_none());
    }

    // ── Drift Review Tool Tests ────────────────────────────────────

    /// Helper: create a fresh `DriftReviewStore`.
    fn make_drift_store() -> DriftReviewStore {
        Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new()))
    }

    #[tokio::test]
    async fn test_get_drift_review_empty_returns_empty_state() {
        let drift_store = make_drift_store();
        let result = handle_get_drift_review(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_test_123".to_string()),
                );
                m
            }),
            &drift_store,
        )
        .await
        .unwrap();

        assert!(!result.is_error);
        let ToolResponseContent::Text { text } = &result.content[0];
        let parsed: serde_json::Value = serde_json::from_str(text).unwrap();
        assert_eq!(parsed["collection_id"], "col_test_123");
        assert!(
            parsed["review_state"].as_object().unwrap().is_empty(),
            "review_state should be empty for a collection with no decisions"
        );
    }

    #[tokio::test]
    async fn test_accept_drift_change_stores_accepted() {
        let drift_store = make_drift_store();

        let result = handle_accept_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_abc".to_string()),
                );
                m.insert(
                    "method".to_string(),
                    serde_json::Value::String("DELETE".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/books/{id}".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await
        .unwrap();

        assert!(!result.is_error);

        // Verify the store now has the accepted entry
        let store = drift_store.lock().await;
        assert_eq!(
            store.get("col_abc:DELETE:/books/{id}").map(String::as_str),
            Some("accepted")
        );
        drop(store);
    }

    #[tokio::test]
    async fn test_dismiss_drift_change_stores_ignored() {
        let drift_store = make_drift_store();

        let result = handle_dismiss_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_xyz".to_string()),
                );
                m.insert(
                    "method".to_string(),
                    serde_json::Value::String("PUT".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/books/{id}".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await
        .unwrap();

        assert!(!result.is_error);

        // Verify the store has the ignored entry
        let store = drift_store.lock().await;
        assert_eq!(
            store.get("col_xyz:PUT:/books/{id}").map(String::as_str),
            Some("ignored")
        );
        drop(store);
    }

    #[tokio::test]
    async fn test_accept_then_get_reflects_in_review_state() {
        let drift_store = make_drift_store();

        // Accept a change
        handle_accept_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_review".to_string()),
                );
                m.insert(
                    "method".to_string(),
                    serde_json::Value::String("DELETE".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/items/{id}".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await
        .unwrap();

        // Get review state for the collection
        let result = handle_get_drift_review(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_review".to_string()),
                );
                m
            }),
            &drift_store,
        )
        .await
        .unwrap();

        let ToolResponseContent::Text { text } = &result.content[0];
        let parsed: serde_json::Value = serde_json::from_str(text).unwrap();
        let review_state = parsed["review_state"].as_object().unwrap();
        assert_eq!(
            review_state
                .get("DELETE:/items/{id}")
                .and_then(|v| v.as_str()),
            Some("accepted")
        );
    }

    #[tokio::test]
    async fn test_dismiss_then_get_reflects_in_review_state() {
        let drift_store = make_drift_store();

        // Dismiss a change
        handle_dismiss_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_dismiss".to_string()),
                );
                m.insert(
                    "method".to_string(),
                    serde_json::Value::String("PUT".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/products/{id}".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await
        .unwrap();

        // Get review state
        let result = handle_get_drift_review(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_dismiss".to_string()),
                );
                m
            }),
            &drift_store,
        )
        .await
        .unwrap();

        let ToolResponseContent::Text { text } = &result.content[0];
        let parsed: serde_json::Value = serde_json::from_str(text).unwrap();
        let review_state = parsed["review_state"].as_object().unwrap();
        assert_eq!(
            review_state
                .get("PUT:/products/{id}")
                .and_then(|v| v.as_str()),
            Some("ignored")
        );
    }

    #[tokio::test]
    async fn test_get_drift_review_isolates_by_collection_id() {
        let drift_store = make_drift_store();

        // Insert entries for two different collections
        {
            let mut store = drift_store.lock().await;
            store.insert("col_a:GET:/items".to_string(), "accepted".to_string());
            store.insert(
                "col_b:DELETE:/items/{id}".to_string(),
                "ignored".to_string(),
            );
        }

        // Query only col_a
        let result = handle_get_drift_review(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_a".to_string()),
                );
                m
            }),
            &drift_store,
        )
        .await
        .unwrap();

        let ToolResponseContent::Text { text } = &result.content[0];
        let parsed: serde_json::Value = serde_json::from_str(text).unwrap();
        let review_state = parsed["review_state"].as_object().unwrap();

        // Should only contain col_a entries
        assert!(review_state.contains_key("GET:/items"));
        assert!(!review_state.contains_key("DELETE:/items/{id}"));
        assert_eq!(review_state.len(), 1);
    }

    #[tokio::test]
    async fn test_accept_drift_change_missing_collection_id() {
        let drift_store = make_drift_store();

        let result = handle_accept_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "method".to_string(),
                    serde_json::Value::String("GET".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/items".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("collection_id"));
    }

    #[tokio::test]
    async fn test_dismiss_drift_change_missing_method() {
        let drift_store = make_drift_store();

        let result = handle_dismiss_drift_change(
            Some({
                let mut m = serde_json::Map::new();
                m.insert(
                    "collection_id".to_string(),
                    serde_json::Value::String("col_abc".to_string()),
                );
                m.insert(
                    "path".to_string(),
                    serde_json::Value::String("/items".to_string()),
                );
                m
            }),
            &drift_store,
            None,
        )
        .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("method"));
    }

    #[tokio::test]
    async fn test_drift_review_tool_via_dispatch() {
        let (service, canvas_state, drift_store, _dir) = make_service();

        // Accept a change via dispatch
        let accept_req = json!({
            "jsonrpc": "2.0",
            "id": 100,
            "method": "tools/call",
            "params": {
                "name": "accept_drift_change",
                "arguments": {
                    "collection_id": "col_test",
                    "method": "DELETE",
                    "path": "/books/{id}"
                }
            }
        })
        .to_string();

        let resp = dispatch(
            &accept_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));

        // Verify via get_drift_review
        let get_req = json!({
            "jsonrpc": "2.0",
            "id": 101,
            "method": "tools/call",
            "params": {
                "name": "get_drift_review",
                "arguments": { "collection_id": "col_test" }
            }
        })
        .to_string();

        let resp = dispatch(
            &get_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));

        let text: serde_json::Value =
            serde_json::from_str(result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert_eq!(
            text["review_state"]["DELETE:/books/{id}"].as_str(),
            Some("accepted")
        );
    }

    #[tokio::test]
    async fn test_dismiss_drift_change_via_dispatch() {
        let (service, canvas_state, drift_store, _dir) = make_service();

        let dismiss_req = json!({
            "jsonrpc": "2.0",
            "id": 200,
            "method": "tools/call",
            "params": {
                "name": "dismiss_drift_change",
                "arguments": {
                    "collection_id": "col_abc",
                    "method": "PUT",
                    "path": "/books/{id}"
                }
            }
        })
        .to_string();

        let resp = dispatch(
            &dismiss_req,
            &service,
            &canvas_state,
            None,
            None,
            &drift_store,
            None,
        )
        .await
        .unwrap();
        let parsed: JsonRpcResponse = serde_json::from_str(&resp).unwrap();
        assert!(parsed.error.is_none());
        let result = parsed.result.unwrap();
        assert!(!result["isError"].as_bool().unwrap_or(false));

        let text: serde_json::Value =
            serde_json::from_str(result["content"][0]["text"].as_str().unwrap()).unwrap();
        assert_eq!(text["status"].as_str(), Some("ignored"));
        assert_eq!(text["method"].as_str(), Some("PUT"));
        assert_eq!(text["path"].as_str(), Some("/books/{id}"));
    }
}
