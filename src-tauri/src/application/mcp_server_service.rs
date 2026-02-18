// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP server service — tool registry, dispatch, and collection CRUD tools.
//!
//! Manages the set of tools exposed by runi's MCP server and dispatches
//! tool calls to the appropriate handlers backed by the collection store.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde_json::json;

use crate::domain::collection::{
    BodyType, Collection, CollectionRequest, IntelligenceMetadata, RequestBody, SpecBinding,
};
use crate::domain::http::RequestParams;
use crate::domain::mcp::events::{Actor, EventEmitter};
use crate::domain::mcp::protocol::{McpToolDefinition, ToolCallResult, ToolResponseContent};
use crate::domain::participant::{LamportTimestamp, SeqCounter};
use crate::infrastructure::storage::collection_store::{
    delete_collection_in_dir, list_collections_in_dir, load_collection_in_dir,
    save_collection_in_dir,
};

/// A registered tool with its definition and handler.
struct RegisteredTool {
    definition: McpToolDefinition,
}

/// Create a registered tool from name, description, and schema.
fn tool_def(name: &str, description: &str, input_schema: serde_json::Value) -> RegisteredTool {
    RegisteredTool {
        definition: McpToolDefinition {
            name: name.to_string(),
            description: Some(description.to_string()),
            input_schema,
        },
    }
}

/// MCP server service that manages tool registration and dispatch.
///
/// Tools operate on collections stored in a configurable directory,
/// defaulting to the system collections directory.
///
/// Every operation carries an [`Actor`] for provenance tracking.
/// MCP-created collections default to `SourceType::Manual` (MCP is a creation
/// channel, not a collection type). Requests get `ai_generated: true` attribution.
///
/// Maintains a [`SeqCounter`] for Lamport timestamps on emitted events.
pub struct McpServerService {
    tools: Vec<RegisteredTool>,
    collections_dir: PathBuf,
    event_emitter: Option<Arc<dyn EventEmitter>>,
    /// The actor for all operations — set at construction from MCP session info.
    actor: Actor,
    /// Lamport sequence counter for this service instance.
    seq_counter: SeqCounter,
}

impl McpServerService {
    /// Create a new server service with the given collections directory.
    ///
    /// Defaults to `Actor::Ai` since MCP server operations are AI-initiated.
    #[must_use]
    pub fn new(collections_dir: PathBuf) -> Self {
        let mut service = Self {
            tools: Vec::new(),
            collections_dir,
            event_emitter: None,
            actor: Actor::Ai {
                model: None,
                session_id: None,
            },
            seq_counter: SeqCounter::new(),
        };
        service.register_tools();
        service
    }

    /// Create a new server service with an event emitter for UI notifications.
    ///
    /// Defaults to `Actor::Ai` since MCP server operations are AI-initiated.
    #[must_use]
    pub fn with_emitter(collections_dir: PathBuf, emitter: Arc<dyn EventEmitter>) -> Self {
        let mut service = Self {
            tools: Vec::new(),
            collections_dir,
            event_emitter: Some(emitter),
            actor: Actor::Ai {
                model: None,
                session_id: None,
            },
            seq_counter: SeqCounter::new(),
        };
        service.register_tools();
        service
    }

    /// Create a server service using the default system collections directory.
    ///
    /// # Errors
    ///
    /// Returns an error if the collections directory cannot be determined.
    pub fn with_default_dir() -> Result<Self, String> {
        let dir = crate::infrastructure::storage::collection_store::get_collections_dir()?;
        Ok(Self::new(dir))
    }

    /// Emit an event with a Lamport timestamp if an emitter is configured. No-ops otherwise.
    fn emit(&mut self, event_name: &str, payload: serde_json::Value) {
        if let Some(emitter) = &self.event_emitter {
            let lamport = LamportTimestamp {
                participant: self.actor.to_participant_id(),
                seq: self.seq_counter.next(),
            };
            emitter.emit_event_with_seq(event_name, &self.actor, lamport, payload);
        }
    }

    /// Emit a `collection:imported` event after MCP import completes.
    ///
    /// Called by the dispatcher after async import (outside the lock).
    pub fn emit_import_event(&mut self, collection_id: &str, name: &str) {
        self.emit(
            "collection:imported",
            json!({"id": collection_id, "name": name}),
        );
    }

    /// Emit a `request:executed` event after HTTP execution completes.
    ///
    /// Called by the dispatcher after async HTTP execution (outside the lock).
    pub fn emit_execute_event(
        &mut self,
        collection_id: &str,
        request_id: &str,
        response: &crate::domain::http::HttpResponse,
    ) {
        self.emit(
            "request:executed",
            json!({
                "collection_id": collection_id,
                "request_id": request_id,
                "status": response.status,
                "total_ms": response.timing.total_ms,
            }),
        );
    }

    /// Prepare an HTTP request for execution from a collection.
    ///
    /// Synchronously loads the collection and converts the request to `RequestParams`.
    /// The caller (dispatcher) handles the async HTTP execution outside the lock.
    ///
    /// Returns `(params, collection_id, request_id)` on success.
    ///
    /// # Errors
    ///
    /// Returns an error if the collection or request is not found,
    /// or if the arguments are invalid.
    pub fn prepare_execute_request(
        &self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<(RequestParams, String, String), String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;
        let timeout_ms = args
            .get("timeout_ms")
            .and_then(serde_json::Value::as_u64)
            .unwrap_or(30_000);

        Self::validate_collection_id(collection_id)?;
        let collection = load_collection_in_dir(collection_id, self.dir())?;
        let request = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .ok_or_else(|| format!("Request not found: {request_id}"))?;

        let params = collection_request_to_params(request, timeout_ms);
        Ok((params, collection_id.to_string(), request_id.to_string()))
    }

    /// Prepare data for opening a collection request in a canvas tab.
    ///
    /// Returns a JSON value with the full request data for the frontend to
    /// open a tab.
    ///
    /// # Errors
    ///
    /// Returns an error if the collection or request is not found,
    /// or if the arguments are invalid.
    pub fn prepare_open_collection_request(
        &self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<serde_json::Value, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;

        Self::validate_collection_id(collection_id)?;
        let collection = load_collection_in_dir(collection_id, self.dir())?;
        let request = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .ok_or_else(|| format!("Request not found: {request_id}"))?;

        Ok(json!({
            "collection_id": collection_id,
            "request_id": request_id,
            "name": request.name,
            "method": request.method,
            "url": request.url,
            "headers": request.headers,
            "body": request.body.as_ref().and_then(|b| b.content.as_deref()),
            "body_type": request.body.as_ref().map(|b| &b.body_type),
        }))
    }

    /// List all tool definitions.
    #[must_use]
    pub fn list_tools(&self) -> Vec<McpToolDefinition> {
        self.tools.iter().map(|t| t.definition.clone()).collect()
    }

    /// Dispatch a tool call by name.
    ///
    /// # Errors
    ///
    /// Returns an error if the tool is not found or the call fails.
    ///
    /// Note: Canvas tools (`canvas_list_tabs`, `canvas_get_active_tab`, etc.) require
    /// external state and are handled separately in the dispatcher.
    pub fn call_tool(
        &mut self,
        name: &str,
        arguments: Option<serde_json::Map<String, serde_json::Value>>,
    ) -> Result<ToolCallResult, String> {
        let args = arguments.unwrap_or_default();
        match name {
            "create_collection" => self.handle_create_collection(&args),
            "list_collections" => self.handle_list_collections(),
            "add_request" => self.handle_add_request(&args),
            "update_request" => self.handle_update_request(&args),
            "delete_request" => self.handle_delete_request(&args),
            "delete_collection" => self.handle_delete_collection(&args),
            "save_tab_to_collection" => self.handle_save_tab_to_collection(&args),
            "move_request" => self.handle_move_request(&args),
            "copy_request_to_collection" => self.handle_copy_request_to_collection(&args),
            "resolve_drift" => self.handle_resolve_drift(&args),
            // Async tools are handled in dispatcher (they need async I/O)
            "import_collection" | "refresh_collection_spec" | "run_hurl_suite" => {
                Err(format!("Async tool '{name}' must be handled by dispatcher"))
            }
            // Canvas tools are handled in dispatcher with external state
            "canvas_list_tabs"
            | "canvas_get_active_tab"
            | "canvas_list_templates"
            | "canvas_switch_tab"
            | "canvas_open_request_tab"
            | "canvas_close_tab"
            | "canvas_subscribe_stream" => Err(format!(
                "Canvas tool '{name}' must be handled by dispatcher"
            )),
            // Project context tools are handled in dispatcher with external state
            "get_project_context" | "set_project_context" => Err(format!(
                "Project context tool '{name}' must be handled by dispatcher"
            )),
            // Suggestion tools are handled in dispatcher with external state
            "list_suggestions" | "create_suggestion" | "resolve_suggestion" => Err(format!(
                "Suggestion tool '{name}' must be handled by dispatcher"
            )),
            _ => Err(format!("Unknown tool: {name}")),
        }
    }

    #[allow(clippy::too_many_lines)]
    fn register_tools(&mut self) {
        self.tools = vec![
            tool_def(
                "create_collection",
                "Create a new API collection",
                json!({
                    "type": "object",
                    "properties": {
                        "name": { "type": "string", "description": "Name for the new collection" }
                    },
                    "required": ["name"]
                }),
            ),
            tool_def(
                "list_collections",
                "List all saved collections",
                json!({
                    "type": "object",
                    "properties": {}
                }),
            ),
            tool_def(
                "add_request",
                "Add an HTTP request to an existing collection",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection to add the request to" },
                        "name": { "type": "string", "description": "Name for the request" },
                        "method": { "type": "string", "description": "HTTP method (GET, POST, PUT, PATCH, DELETE)", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] },
                        "url": { "type": "string", "description": "Request URL" },
                        "headers": { "type": "object", "description": "Request headers as key-value pairs", "additionalProperties": { "type": "string" } },
                        "body": { "type": "string", "description": "Request body content" },
                        "body_type": { "type": "string", "description": "Body content type", "enum": ["json", "form", "raw", "graphql", "xml"] }
                    },
                    "required": ["collection_id", "name", "method", "url"]
                }),
            ),
            tool_def(
                "update_request",
                "Update an existing request in a collection",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection containing the request" },
                        "request_id": { "type": "string", "description": "ID of the request to update" },
                        "name": { "type": "string", "description": "New name for the request" },
                        "method": { "type": "string", "description": "New HTTP method" },
                        "url": { "type": "string", "description": "New URL" },
                        "headers": { "type": "object", "description": "Request headers (replaces existing headers)", "additionalProperties": { "type": "string" } },
                        "body": { "type": "string", "description": "Request body content" },
                        "body_type": { "type": "string", "description": "Body content type", "enum": ["json", "form", "raw", "graphql", "xml"] }
                    },
                    "required": ["collection_id", "request_id"]
                }),
            ),
            tool_def(
                "open_collection_request",
                "Open a collection request in the canvas. Reuses existing tab if already open. This is the preferred way to view request tabs.",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection containing the request" },
                        "request_id": { "type": "string", "description": "ID of the request to open" }
                    },
                    "required": ["collection_id", "request_id"]
                }),
            ),
            tool_def(
                "delete_request",
                "Delete a request from a collection",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection containing the request" },
                        "request_id": { "type": "string", "description": "ID of the request to delete" }
                    },
                    "required": ["collection_id", "request_id"]
                }),
            ),
            tool_def(
                "delete_collection",
                "Delete a collection",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection to delete" }
                    },
                    "required": ["collection_id"]
                }),
            ),
            tool_def(
                "execute_request",
                "Execute an HTTP request from a collection and return the response",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection containing the request" },
                        "request_id": { "type": "string", "description": "ID of the request to execute" },
                        "timeout_ms": { "type": "integer", "description": "Request timeout in milliseconds (default: 30000)" }
                    },
                    "required": ["collection_id", "request_id"]
                }),
            ),
            // Canvas observation tools (Phase 1)
            tool_def(
                "canvas_list_tabs",
                "List all open context tabs in the canvas. Returns tab IDs, labels, and types.",
                json!({
                    "type": "object",
                    "properties": {}
                }),
            ),
            tool_def(
                "canvas_get_active_tab",
                "Get the currently active tab in the canvas. Returns null if no tab is active.",
                json!({
                    "type": "object",
                    "properties": {}
                }),
            ),
            tool_def(
                "canvas_list_templates",
                "List all available templates (OpenAPI specs, workflows, etc).",
                json!({
                    "type": "object",
                    "properties": {}
                }),
            ),
            // Canvas mutation tools (Phase 2)
            tool_def(
                "canvas_switch_tab",
                "Switch to a different tab by ID. Emits canvas:switch_tab event.",
                json!({
                    "type": "object",
                    "properties": {
                        "tab_id": { "type": "string", "description": "ID of the tab to switch to" }
                    },
                    "required": ["tab_id"]
                }),
            ),
            tool_def(
                "canvas_open_request_tab",
                "Open a blank new request tab (not linked to any collection). To open an existing collection request, use open_collection_request instead. Emits canvas:open_request_tab event.",
                json!({
                    "type": "object",
                    "properties": {
                        "label": { "type": "string", "description": "Label for the new tab (default: 'Request')" }
                    }
                }),
            ),
            tool_def(
                "canvas_close_tab",
                "Close a tab by ID. Emits canvas:close_tab event.",
                json!({
                    "type": "object",
                    "properties": {
                        "tab_id": { "type": "string", "description": "ID of the tab to close" }
                    },
                    "required": ["tab_id"]
                }),
            ),
            // Import / refresh / hurl tools
            tool_def(
                "import_collection",
                "Import an API collection from a URL, file path, or inline spec content",
                json!({
                    "type": "object",
                    "properties": {
                        "url": { "type": "string", "description": "URL to fetch the spec from" },
                        "file_path": { "type": "string", "description": "Local filesystem path to the spec file" },
                        "inline_content": { "type": "string", "description": "Raw spec content (JSON or YAML)" },
                        "display_name": { "type": "string", "description": "Override the collection display name" }
                    }
                }),
            ),
            tool_def(
                "refresh_collection_spec",
                "Refresh a collection's spec from its tracked source and compute drift delta",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection to refresh" }
                    },
                    "required": ["collection_id"]
                }),
            ),
            tool_def(
                "run_hurl_suite",
                "Run a Hurl test suite and return structured results",
                json!({
                    "type": "object",
                    "properties": {
                        "hurl_file_path": { "type": "string", "description": "Path to the .hurl file to execute" },
                        "collection_id": { "type": "string", "description": "Optional collection ID for context" },
                        "env_vars": { "type": "object", "description": "Environment variables (e.g. base_url)", "additionalProperties": { "type": "string" } }
                    },
                    "required": ["hurl_file_path"]
                }),
            ),
            // Collection save/move/copy tools
            tool_def(
                "save_tab_to_collection",
                "Save an ephemeral request tab to a collection",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the target collection" },
                        "name": { "type": "string", "description": "Name for the saved request" },
                        "method": { "type": "string", "description": "HTTP method (GET, POST, PUT, PATCH, DELETE)", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] },
                        "url": { "type": "string", "description": "Request URL" },
                        "headers": { "type": "object", "description": "Request headers as key-value pairs", "additionalProperties": { "type": "string" } },
                        "body": { "type": "string", "description": "Request body content" },
                        "body_type": { "type": "string", "description": "Body content type", "enum": ["json", "form", "raw", "graphql", "xml"] }
                    },
                    "required": ["collection_id", "name", "method", "url"]
                }),
            ),
            tool_def(
                "move_request",
                "Move a request from one collection to another",
                json!({
                    "type": "object",
                    "properties": {
                        "source_collection_id": { "type": "string", "description": "ID of the source collection" },
                        "request_id": { "type": "string", "description": "ID of the request to move" },
                        "target_collection_id": { "type": "string", "description": "ID of the target collection" }
                    },
                    "required": ["source_collection_id", "request_id", "target_collection_id"]
                }),
            ),
            tool_def(
                "copy_request_to_collection",
                "Copy a request to another collection",
                json!({
                    "type": "object",
                    "properties": {
                        "source_collection_id": { "type": "string", "description": "ID of the source collection" },
                        "request_id": { "type": "string", "description": "ID of the request to copy" },
                        "target_collection_id": { "type": "string", "description": "ID of the target collection" }
                    },
                    "required": ["source_collection_id", "request_id", "target_collection_id"]
                }),
            ),
            // Canvas streaming tools
            tool_def(
                "canvas_subscribe_stream",
                "Subscribe to real-time canvas state changes via SSE. Returns the SSE endpoint URL.",
                json!({
                    "type": "object",
                    "properties": {
                        "stream": {
                            "type": "string",
                            "description": "Stream name (default: 'canvas')",
                            "default": "canvas"
                        }
                    }
                }),
            ),
            // Drift resolution tools
            tool_def(
                "resolve_drift",
                "Resolve a detected drift by executing an action (update_spec, fix_request, or ignore)",
                json!({
                    "type": "object",
                    "properties": {
                        "collection_id": { "type": "string", "description": "ID of the collection with the drift" },
                        "method": { "type": "string", "description": "HTTP method of the drifted operation (e.g., GET, POST)" },
                        "path": { "type": "string", "description": "URL path of the drifted operation (e.g., /users/{id})" },
                        "action": { "type": "string", "description": "Resolution action to take", "enum": ["update_spec", "fix_request", "ignore"] }
                    },
                    "required": ["collection_id", "method", "path", "action"]
                }),
            ),
            // Suggestion tools (Vigilance Monitor)
            tool_def(
                "list_suggestions",
                "List AI suggestions from the Vigilance Monitor. Optionally filter by status (pending, accepted, dismissed).",
                json!({
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["pending", "accepted", "dismissed"],
                            "description": "Filter by status (omit for all)"
                        }
                    }
                }),
            ),
            tool_def(
                "create_suggestion",
                "Create a new AI suggestion in the Vigilance Monitor. Used by AI agents to surface drift fixes, schema updates, test gaps, and optimization hints.",
                json!({
                    "type": "object",
                    "properties": {
                        "suggestionType": {
                            "type": "string",
                            "enum": ["drift_fix", "schema_update", "test_gap", "optimization"],
                            "description": "Category of the suggestion"
                        },
                        "title": {
                            "type": "string",
                            "description": "Short human-readable title"
                        },
                        "description": {
                            "type": "string",
                            "description": "Detailed description"
                        },
                        "source": {
                            "type": "string",
                            "description": "Actor attribution (e.g. model name)"
                        },
                        "collectionId": {
                            "type": ["string", "null"],
                            "description": "Linked collection ID"
                        },
                        "requestId": {
                            "type": ["string", "null"],
                            "description": "Linked request ID"
                        },
                        "endpoint": {
                            "type": ["string", "null"],
                            "description": "Linked endpoint path"
                        },
                        "action": {
                            "type": "string",
                            "description": "What action to take"
                        }
                    },
                    "required": ["suggestionType", "title", "description", "source", "action"]
                }),
            ),
            tool_def(
                "resolve_suggestion",
                "Resolve (accept or dismiss) a suggestion in the Vigilance Monitor.",
                json!({
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Suggestion ID"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["accepted", "dismissed"],
                            "description": "Resolution status"
                        }
                    },
                    "required": ["id", "status"]
                }),
            ),
            // Project context tools
            tool_def(
                "get_project_context",
                "Get the current project context — the user's active collection, focused request, investigation notes, recent requests, and session tags. Use this to understand what the user is working on.",
                json!({
                    "type": "object",
                    "properties": {}
                }),
            ),
            tool_def(
                "set_project_context",
                "Update the project context with partial values. Only provided fields are changed. Use this to track what the user or AI is working on.",
                json!({
                    "type": "object",
                    "properties": {
                        "activeCollectionId": {
                            "type": ["string", "null"],
                            "description": "Set the active collection ID (null to clear)"
                        },
                        "activeRequestId": {
                            "type": ["string", "null"],
                            "description": "Set the active request ID (null to clear)"
                        },
                        "investigationNotes": {
                            "type": ["string", "null"],
                            "description": "Set investigation notes (null to clear)"
                        },
                        "pushRecentRequestId": {
                            "type": "string",
                            "description": "Add a request ID to the recent list (max 10, deduplicates)"
                        },
                        "tags": {
                            "type": "array",
                            "items": { "type": "string" },
                            "description": "Replace the session tags"
                        }
                    }
                }),
            ),
        ];
    }

    fn dir(&self) -> &Path {
        &self.collections_dir
    }

    /// Validate a collection ID to prevent path traversal attacks.
    ///
    /// Collection IDs must only contain ASCII alphanumeric characters, underscores,
    /// and hyphens. Rejects any ID with other characters (spaces, dots, slashes, etc).
    fn validate_collection_id(id: &str) -> Result<(), String> {
        if id.is_empty() {
            return Err("Collection ID cannot be empty".to_string());
        }
        if !id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        {
            return Err(format!(
                "Invalid collection ID: '{id}' — must contain only letters, digits, '_', or '-'"
            ));
        }
        Ok(())
    }

    fn handle_create_collection(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let name = args
            .get("name")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: name".to_string())?;

        let collection = Collection::new(name);
        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "collection:created",
            json!({"id": &collection.id, "name": name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "id": collection.id,
                    "name": name,
                    "message": format!("Collection '{name}' created successfully")
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_list_collections(&self) -> Result<ToolCallResult, String> {
        let summaries = list_collections_in_dir(self.dir())?;
        let list: Vec<serde_json::Value> = summaries
            .iter()
            .map(|s| {
                json!({
                    "id": s.id,
                    "name": s.name,
                    "request_count": s.request_count,
                })
            })
            .collect();

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: serde_json::to_string(&list).unwrap_or_else(|_| "[]".to_string()),
            }],
            is_error: false,
        })
    }

    fn handle_add_request(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let name = args
            .get("name")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: name".to_string())?;
        let method = args
            .get("method")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: method".to_string())?;
        let url = args
            .get("url")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: url".to_string())?;

        Self::validate_collection_id(collection_id)?;
        let mut collection = load_collection_in_dir(collection_id, self.dir())?;
        let seq = collection.next_seq();

        // Parse optional headers from object
        let headers = args
            .get("headers")
            .and_then(serde_json::Value::as_object)
            .map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect::<std::collections::BTreeMap<String, String>>()
            })
            .unwrap_or_default();

        // Parse optional body and body_type
        let body_content = args.get("body").and_then(serde_json::Value::as_str);
        let body_type_str = args.get("body_type").and_then(serde_json::Value::as_str);
        let body = body_content.map(|content| {
            use crate::domain::collection::{BodyType, RequestBody};
            let body_type = match body_type_str {
                Some("json") => BodyType::Json,
                Some("form") => BodyType::Form,
                Some("graphql") => BodyType::Graphql,
                Some("xml") => BodyType::Xml,
                _ => BodyType::Raw,
            };
            RequestBody {
                body_type,
                content: Some(content.to_string()),
                file: None,
            }
        });

        let request = CollectionRequest {
            id: CollectionRequest::generate_id(name),
            name: name.to_string(),
            seq,
            method: method.to_uppercase(),
            url: url.to_string(),
            headers,
            body,
            intelligence: IntelligenceMetadata::ai_generated("mcp"),
            ..Default::default()
        };
        let request_id = request.id.clone();
        collection.requests.push(request);
        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "request:added",
            json!({"collection_id": collection_id, "request_id": &request_id, "name": name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "request_id": request_id,
                    "collection_id": collection_id,
                    "message": format!("Request '{name}' added to collection")
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_update_request(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;

        Self::validate_collection_id(collection_id)?;
        let mut collection = load_collection_in_dir(collection_id, self.dir())?;
        let request = collection
            .requests
            .iter_mut()
            .find(|r| r.id == request_id)
            .ok_or_else(|| format!("Request not found: {request_id}"))?;

        if let Some(name) = args.get("name").and_then(serde_json::Value::as_str) {
            request.name = name.to_string();
        }
        if let Some(method) = args.get("method").and_then(serde_json::Value::as_str) {
            request.method = method.to_uppercase();
        }
        if let Some(url) = args.get("url").and_then(serde_json::Value::as_str) {
            request.url = url.to_string();
        }

        // Replace headers if provided (full replacement, not merge)
        if let Some(headers_obj) = args.get("headers").and_then(serde_json::Value::as_object) {
            request.headers = headers_obj
                .iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect();
        }

        // Update body if provided
        if let Some(body_content) = args.get("body").and_then(serde_json::Value::as_str) {
            use crate::domain::collection::{BodyType, RequestBody};
            let body_type = match args.get("body_type").and_then(serde_json::Value::as_str) {
                Some("json") => BodyType::Json,
                Some("form") => BodyType::Form,
                Some("graphql") => BodyType::Graphql,
                Some("xml") => BodyType::Xml,
                _ => BodyType::Raw,
            };
            request.body = Some(RequestBody {
                body_type,
                content: Some(body_content.to_string()),
                file: None,
            });
        }

        let updated_name = request.name.clone();
        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "request:updated",
            json!({"collection_id": collection_id, "request_id": request_id, "name": updated_name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "request_id": request_id,
                    "message": "Request updated successfully"
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_delete_request(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;

        Self::validate_collection_id(collection_id)?;
        let mut collection = load_collection_in_dir(collection_id, self.dir())?;

        // Capture the friendly name before removing the request
        let friendly_name = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .map(|r| r.name.clone());

        let original_len = collection.requests.len();
        collection.requests.retain(|r| r.id != request_id);

        if collection.requests.len() == original_len {
            return Err(format!("Request not found: {request_id}"));
        }

        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "request:deleted",
            json!({"collection_id": collection_id, "request_id": request_id, "name": friendly_name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "collection_id": collection_id,
                    "request_id": request_id,
                    "message": "Request deleted successfully"
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_delete_collection(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;

        Self::validate_collection_id(collection_id)?;

        // Load the friendly name before deleting
        let friendly_name = load_collection_in_dir(collection_id, self.dir())
            .ok()
            .map_or_else(|| collection_id.to_string(), |c| c.metadata.name);
        delete_collection_in_dir(collection_id, self.dir())?;

        self.emit(
            "collection:deleted",
            json!({"id": collection_id, "name": friendly_name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "collection_id": collection_id,
                    "message": format!("Collection '{friendly_name}' deleted")
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_save_tab_to_collection(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;
        let name = args
            .get("name")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: name".to_string())?;
        let method = args
            .get("method")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: method".to_string())?;
        let url = args
            .get("url")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: url".to_string())?;

        Self::validate_collection_id(collection_id)?;
        let mut collection = load_collection_in_dir(collection_id, self.dir())?;
        let seq = collection.next_seq();

        let headers = args
            .get("headers")
            .and_then(serde_json::Value::as_object)
            .map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect::<std::collections::BTreeMap<String, String>>()
            })
            .unwrap_or_default();

        let body_content = args.get("body").and_then(serde_json::Value::as_str);
        let body_type = match args.get("body_type").and_then(serde_json::Value::as_str) {
            Some("form") => BodyType::Form,
            Some("graphql") => BodyType::Graphql,
            Some("xml") => BodyType::Xml,
            Some("json") => BodyType::Json,
            _ => BodyType::Raw,
        };
        let body = body_content.map(|content| RequestBody {
            body_type: body_type.clone(),
            content: Some(content.to_string()),
            file: None,
        });

        let request = CollectionRequest {
            id: CollectionRequest::generate_id(name),
            name: name.to_string(),
            seq,
            method: method.to_uppercase(),
            url: url.to_string(),
            headers,
            body,
            intelligence: IntelligenceMetadata::ai_generated("mcp"),
            ..Default::default()
        };
        let request_id = request.id.clone();
        collection.requests.push(request);
        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "request:saved-to-collection",
            json!({"collection_id": collection_id, "request_id": &request_id, "name": name}),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "request_id": request_id,
                    "collection_id": collection_id,
                    "message": format!("Request '{name}' saved to collection")
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_move_request(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let source_collection_id = args
            .get("source_collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: source_collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;
        let target_collection_id = args
            .get("target_collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: target_collection_id".to_string())?;

        Self::validate_collection_id(source_collection_id)?;
        Self::validate_collection_id(target_collection_id)?;

        let mut source = load_collection_in_dir(source_collection_id, self.dir())?;
        let pos = source
            .requests
            .iter()
            .position(|r| r.id == request_id)
            .ok_or_else(|| format!("Request not found: {request_id}"))?;

        if source_collection_id == target_collection_id {
            return Ok(ToolCallResult {
                content: vec![ToolResponseContent::Text {
                    text: json!({
                        "source_collection_id": source_collection_id,
                        "target_collection_id": target_collection_id,
                        "request_id": request_id,
                        "message": "Source and target collections are the same; no move performed"
                    })
                    .to_string(),
                }],
                is_error: false,
            });
        }

        let mut request = source
            .requests
            .get(pos)
            .cloned()
            .ok_or_else(|| format!("Request not found: {request_id}"))?;
        if request.binding.is_bound() {
            request.binding = SpecBinding::default();
        }

        let mut target = load_collection_in_dir(target_collection_id, self.dir())?;
        request.seq = target.next_seq();
        target.requests.push(request);

        save_collection_in_dir(&target, self.dir())?;
        source.requests.remove(pos);
        if let Err(save_source_error) = save_collection_in_dir(&source, self.dir()) {
            if let Some(target_pos) = target.requests.iter().position(|r| r.id == request_id) {
                target.requests.remove(target_pos);
            }

            return match save_collection_in_dir(&target, self.dir()) {
                Ok(_) => Err(format!(
                    "Failed to save source collection {source_collection_id} while moving request {request_id} to {target_collection_id}; target changes rolled back: {save_source_error}"
                )),
                Err(rollback_error) => Err(format!(
                    "Failed to save source collection {source_collection_id} while moving request {request_id} to {target_collection_id}; rollback failed: {rollback_error}; original error: {save_source_error}"
                )),
            };
        }

        self.emit(
            "request:moved",
            json!({
                "source_collection_id": source_collection_id,
                "target_collection_id": target_collection_id,
                "request_id": request_id,
            }),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "source_collection_id": source_collection_id,
                    "target_collection_id": target_collection_id,
                    "request_id": request_id,
                    "message": "Request moved successfully"
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    fn handle_copy_request_to_collection(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let source_collection_id = args
            .get("source_collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: source_collection_id".to_string())?;
        let request_id = args
            .get("request_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: request_id".to_string())?;
        let target_collection_id = args
            .get("target_collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: target_collection_id".to_string())?;

        Self::validate_collection_id(source_collection_id)?;
        Self::validate_collection_id(target_collection_id)?;

        let source = load_collection_in_dir(source_collection_id, self.dir())?;
        let original = source
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .ok_or_else(|| format!("Request not found: {request_id}"))?;

        let mut copy = original.clone();
        copy.id = CollectionRequest::generate_id(&copy.name);
        copy.binding = SpecBinding::default();

        let mut target = load_collection_in_dir(target_collection_id, self.dir())?;
        copy.seq = target.next_seq();
        let copy_id = copy.id.clone();
        let copy_name = copy.name.clone();
        target.requests.push(copy);

        save_collection_in_dir(&target, self.dir())?;

        self.emit(
            "request:copied",
            json!({
                "source_collection_id": source_collection_id,
                "target_collection_id": target_collection_id,
                "source_request_id": request_id,
                "copied_request_id": &copy_id,
                "request_id": &copy_id,
            }),
        );

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "source_collection_id": source_collection_id,
                    "target_collection_id": target_collection_id,
                    "copy_id": copy_id,
                    "name": copy_name,
                    "message": "Request copied successfully"
                })
                .to_string(),
            }],
            is_error: false,
        })
    }

    /// Handle the `resolve_drift` tool call.
    ///
    /// Accepts a drift action (`update_spec`, `fix_request`, or `ignore`) for a
    /// specific operation identified by `(method, path)` within a collection.
    /// Emits a `drift:resolved` event on success.
    fn handle_resolve_drift(
        &mut self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        use crate::domain::collection::drift::{DriftActionResult, DriftActionType};

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
        let action_str = args
            .get("action")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: action".to_string())?;

        Self::validate_collection_id(collection_id)?;

        let action_type = match action_str {
            "update_spec" => DriftActionType::UpdateSpec,
            "fix_request" => DriftActionType::FixRequest,
            "ignore" => DriftActionType::Ignore,
            other => return Err(format!("Unknown action: {other}")),
        };

        // Verify collection exists
        let _collection = load_collection_in_dir(collection_id, self.dir())?;

        let result = DriftActionResult {
            success: true,
            action_type,
            message: format!("Drift for {method} {path} resolved with action: {action_str}"),
        };

        self.emit(
            "drift:resolved",
            json!({
                "collection_id": collection_id,
                "method": method,
                "path": path,
                "action": action_str,
            }),
        );

        let result_json =
            serde_json::to_value(&result).map_err(|e| format!("Serialization error: {e}"))?;

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: result_json.to_string(),
            }],
            is_error: false,
        })
    }
}

/// Convert a `CollectionRequest` to `RequestParams` for HTTP execution.
fn collection_request_to_params(req: &CollectionRequest, timeout_ms: u64) -> RequestParams {
    RequestParams {
        url: req.url.clone(),
        method: req.method.clone(),
        headers: req
            .headers
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
        body: req.body.as_ref().and_then(|b| b.content.clone()),
        timeout_ms,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::collection::SourceType;
    use tempfile::TempDir;

    fn make_service() -> (McpServerService, TempDir) {
        let dir = TempDir::new().unwrap();
        let service = McpServerService::new(dir.path().to_path_buf());
        (service, dir)
    }

    fn args(pairs: &[(&str, &str)]) -> serde_json::Map<String, serde_json::Value> {
        let mut map = serde_json::Map::new();
        for (k, v) in pairs {
            map.insert((*k).to_string(), json!(*v));
        }
        map
    }

    #[test]
    fn test_registers_twenty_seven_tools() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        // 8 collection tools + 3 save/move/copy tools + 3 import/refresh/hurl tools
        // + 6 canvas tools + 1 streaming tool + 2 project context tools
        // + 1 execute_request + 3 suggestion tools = 27 total
        assert_eq!(tools.len(), 27);
        let names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        // Collection tools
        assert!(names.contains(&"create_collection"));
        assert!(names.contains(&"list_collections"));
        assert!(names.contains(&"add_request"));
        assert!(names.contains(&"update_request"));
        assert!(names.contains(&"delete_request"));
        assert!(names.contains(&"open_collection_request"));
        assert!(names.contains(&"delete_collection"));
        assert!(names.contains(&"execute_request"));
        // Save/move/copy tools
        assert!(names.contains(&"save_tab_to_collection"));
        assert!(names.contains(&"move_request"));
        assert!(names.contains(&"copy_request_to_collection"));
        // Import/refresh/hurl tools
        assert!(names.contains(&"import_collection"));
        assert!(names.contains(&"refresh_collection_spec"));
        assert!(names.contains(&"run_hurl_suite"));
        // Canvas tools
        assert!(names.contains(&"canvas_list_tabs"));
        assert!(names.contains(&"canvas_get_active_tab"));
        assert!(names.contains(&"canvas_list_templates"));
        assert!(names.contains(&"canvas_switch_tab"));
        assert!(names.contains(&"canvas_open_request_tab"));
        assert!(names.contains(&"canvas_close_tab"));
        // Streaming tools
        assert!(names.contains(&"canvas_subscribe_stream"));
        // Project context tools
        assert!(names.contains(&"get_project_context"));
        assert!(names.contains(&"set_project_context"));
        // Suggestion tools (Vigilance Monitor)
        assert!(names.contains(&"list_suggestions"));
        assert!(names.contains(&"create_suggestion"));
        assert!(names.contains(&"resolve_suggestion"));
    }

    #[test]
    fn test_tool_definitions_have_schemas() {
        let (service, _dir) = make_service();
        for tool in service.list_tools() {
            assert_eq!(
                tool.input_schema.get("type").and_then(|v| v.as_str()),
                Some("object"),
                "Tool '{}' should have object schema",
                tool.name
            );
        }
    }

    #[test]
    fn test_create_collection_success() {
        let (mut service, _dir) = make_service();
        let result = service
            .call_tool("create_collection", Some(args(&[("name", "GitHub API")])))
            .unwrap();
        assert!(!result.is_error);
        assert_eq!(result.content.len(), 1);
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        assert!(text.contains("GitHub API"));
        assert!(text.contains("created successfully"));
    }

    #[test]
    fn test_create_collection_missing_name() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("create_collection", Some(serde_json::Map::new()));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("name"));
    }

    #[test]
    fn test_list_collections_empty() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("list_collections", None).unwrap();
        assert!(!result.is_error);
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        assert_eq!(text, "[]");
    }

    #[test]
    fn test_list_collections_after_create() {
        let (mut service, _dir) = make_service();
        service
            .call_tool("create_collection", Some(args(&[("name", "API One")])))
            .unwrap();
        service
            .call_tool("create_collection", Some(args(&[("name", "API Two")])))
            .unwrap();

        let result = service.call_tool("list_collections", None).unwrap();
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        let list: Vec<serde_json::Value> = serde_json::from_str(text).unwrap();
        assert_eq!(list.len(), 2);
    }

    #[test]
    fn test_add_request_success() {
        let (mut service, _dir) = make_service();

        // Create collection first
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test API")])))
            .unwrap();
        let text = match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        let created: serde_json::Value = serde_json::from_str(text).unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // Add request
        let result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "Get Users"),
                    ("method", "GET"),
                    ("url", "https://api.example.com/users"),
                ])),
            )
            .unwrap();
        assert!(!result.is_error);
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        assert!(text.contains("request_id"));
        assert!(text.contains("added to collection"));
    }

    #[test]
    fn test_add_request_with_headers() {
        let (mut service, _dir) = make_service();

        // Create collection
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Headers Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // Add request with headers
        let mut add_args = args(&[
            ("collection_id", collection_id),
            ("name", "With Headers"),
            ("method", "POST"),
            ("url", "https://api.example.com/data"),
        ]);
        add_args.insert(
            "headers".to_string(),
            json!({
                "Content-Type": "application/json",
                "Authorization": "Bearer token123"
            }),
        );

        let result = service.call_tool("add_request", Some(add_args)).unwrap();
        assert!(!result.is_error);

        // Verify headers were saved
        let added: serde_json::Value = serde_json::from_str(match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert_eq!(req.headers.len(), 2);
        assert_eq!(
            req.headers.get("Content-Type"),
            Some(&"application/json".to_string())
        );
        assert_eq!(
            req.headers.get("Authorization"),
            Some(&"Bearer token123".to_string())
        );
    }

    #[test]
    fn test_add_request_with_body() {
        let (mut service, _dir) = make_service();

        // Create collection
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Body Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // Add request with body
        let mut add_args = args(&[
            ("collection_id", collection_id),
            ("name", "With Body"),
            ("method", "POST"),
            ("url", "https://api.example.com/users"),
            ("body", r#"{"name": "John"}"#),
            ("body_type", "json"),
        ]);
        // Also add headers to test combined scenario
        add_args.insert(
            "headers".to_string(),
            json!({"Content-Type": "application/json"}),
        );

        let result = service.call_tool("add_request", Some(add_args)).unwrap();
        assert!(!result.is_error);

        // Verify body was saved
        let added: serde_json::Value = serde_json::from_str(match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert!(req.body.is_some());
        let body = req.body.as_ref().unwrap();
        assert_eq!(body.body_type, crate::domain::collection::BodyType::Json);
        assert_eq!(body.content, Some(r#"{"name": "John"}"#.to_string()));
        // Headers also present
        assert_eq!(req.headers.len(), 1);
    }

    #[test]
    fn test_save_tab_to_collection_preserves_body_type() {
        let (mut service, _dir) = make_service();

        let create_result = service
            .call_tool(
                "create_collection",
                Some(args(&[("name", "Save Tab Body Type")])),
            )
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let mut save_args = args(&[
            ("collection_id", collection_id),
            ("name", "Save XML"),
            ("method", "POST"),
            ("url", "https://api.example.com/xml"),
            ("body", "<root/>"),
            ("body_type", "xml"),
        ]);
        save_args.insert(
            "headers".to_string(),
            json!({"Content-Type": "application/xml"}),
        );

        let result = service
            .call_tool("save_tab_to_collection", Some(save_args))
            .unwrap();
        assert!(!result.is_error);

        let saved: serde_json::Value = serde_json::from_str(match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = saved["request_id"].as_str().unwrap();

        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        let body = req.body.as_ref().unwrap();
        assert_eq!(body.body_type, BodyType::Xml);
        assert_eq!(body.content, Some("<root/>".to_string()));
    }

    #[test]
    fn test_add_request_missing_params() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("add_request", Some(args(&[("collection_id", "foo")])));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("name"));
    }

    #[test]
    fn test_add_request_collection_not_found() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool(
            "add_request",
            Some(args(&[
                ("collection_id", "nonexistent"),
                ("name", "Test"),
                ("method", "GET"),
                ("url", "http://example.com"),
            ])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_update_request_success() {
        let (mut service, _dir) = make_service();

        // Create collection + request
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test API")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let add_result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "Old Name"),
                    ("method", "GET"),
                    ("url", "http://old.com"),
                ])),
            )
            .unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        // Update request
        let result = service
            .call_tool(
                "update_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("request_id", request_id),
                    ("name", "New Name"),
                    ("url", "http://new.com"),
                ])),
            )
            .unwrap();
        assert!(!result.is_error);

        // Verify by loading collection
        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert_eq!(req.name, "New Name");
        assert_eq!(req.url, "http://new.com");
    }

    #[test]
    fn test_update_request_not_found() {
        let (mut service, _dir) = make_service();

        // Create collection
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let result = service.call_tool(
            "update_request",
            Some(args(&[
                ("collection_id", collection_id),
                ("request_id", "nonexistent"),
            ])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    /// Helper: create a collection + request, return (`collection_id`, `request_id`).
    fn create_collection_with_request(
        service: &mut McpServerService,
        col_name: &str,
        req_name: &str,
        method: &str,
        url: &str,
    ) -> (String, String) {
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", col_name)])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap().to_string();

        let add_result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", &collection_id),
                    ("name", req_name),
                    ("method", method),
                    ("url", url),
                ])),
            )
            .unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap().to_string();

        (collection_id, request_id)
    }

    #[test]
    fn test_update_request_headers() {
        let (mut service, _dir) = make_service();
        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Hdr Update",
            "Req",
            "GET",
            "http://a.com",
        );

        // Update with headers
        let mut update_args = args(&[
            ("collection_id", &collection_id),
            ("request_id", &request_id),
        ]);
        update_args.insert(
            "headers".to_string(),
            json!({"X-Custom": "value", "Accept": "application/json"}),
        );

        let result = service
            .call_tool("update_request", Some(update_args))
            .unwrap();
        assert!(!result.is_error);

        let collection = load_collection_in_dir(&collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert_eq!(req.headers.len(), 2);
        assert_eq!(req.headers.get("X-Custom"), Some(&"value".to_string()));
    }

    #[test]
    fn test_update_request_body() {
        let (mut service, _dir) = make_service();
        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Body Update",
            "Req",
            "POST",
            "http://b.com",
        );

        // Update with body
        let update_args = args(&[
            ("collection_id", &collection_id),
            ("request_id", &request_id),
            ("body", r#"{"updated": true}"#),
            ("body_type", "json"),
        ]);

        let result = service
            .call_tool("update_request", Some(update_args))
            .unwrap();
        assert!(!result.is_error);

        let collection = load_collection_in_dir(&collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert!(req.body.is_some());
        let body = req.body.as_ref().unwrap();
        assert_eq!(body.body_type, crate::domain::collection::BodyType::Json);
        assert_eq!(body.content, Some(r#"{"updated": true}"#.to_string()));
    }

    #[test]
    fn test_update_request_partial_preserves_existing() {
        let (mut service, _dir) = make_service();

        // Create collection
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Partial")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // Add request WITH headers and body
        let mut add_args = args(&[
            ("collection_id", collection_id),
            ("name", "Full Req"),
            ("method", "POST"),
            ("url", "http://orig.com"),
            ("body", r#"{"orig": true}"#),
            ("body_type", "json"),
        ]);
        add_args.insert("headers".to_string(), json!({"X-Orig": "yes"}));
        let add_result = service.call_tool("add_request", Some(add_args)).unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        // Update ONLY name — headers and body should be preserved
        let result = service
            .call_tool(
                "update_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("request_id", request_id),
                    ("name", "Renamed"),
                ])),
            )
            .unwrap();
        assert!(!result.is_error);

        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let req = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert_eq!(req.name, "Renamed");
        // Headers preserved
        assert_eq!(req.headers.len(), 1);
        assert_eq!(req.headers.get("X-Orig"), Some(&"yes".to_string()));
        // Body preserved
        assert!(req.body.is_some());
        assert_eq!(
            req.body.as_ref().unwrap().content,
            Some(r#"{"orig": true}"#.to_string())
        );
    }

    #[test]
    fn test_delete_collection_success() {
        let (mut service, _dir) = make_service();

        // Create then delete
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "To Delete")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let result = service
            .call_tool(
                "delete_collection",
                Some(args(&[("collection_id", collection_id)])),
            )
            .unwrap();
        assert!(!result.is_error);

        // Verify deleted
        let list = service.call_tool("list_collections", None).unwrap();
        let text = match &list.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        assert_eq!(text, "[]");
    }

    #[test]
    fn test_delete_collection_not_found() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool(
            "delete_collection",
            Some(args(&[("collection_id", "nonexistent")])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_delete_request_success() {
        let (mut service, _dir) = make_service();
        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Del Req Test",
            "To Delete",
            "GET",
            "http://example.com",
        );

        let result = service
            .call_tool(
                "delete_request",
                Some(args(&[
                    ("collection_id", &collection_id),
                    ("request_id", &request_id),
                ])),
            )
            .unwrap();
        assert!(!result.is_error);

        // Verify request is removed
        let collection = load_collection_in_dir(&collection_id, service.dir()).unwrap();
        assert!(collection.requests.is_empty());
    }

    #[test]
    fn test_delete_request_not_found() {
        let (mut service, _dir) = make_service();
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Del Req NF")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let result = service.call_tool(
            "delete_request",
            Some(args(&[
                ("collection_id", collection_id),
                ("request_id", "nonexistent"),
            ])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_open_collection_request_returns_data() {
        let (mut service, _dir) = make_service();

        // Create collection with a request that has headers + body
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Open Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let mut add_args = args(&[
            ("collection_id", collection_id),
            ("name", "My Request"),
            ("method", "POST"),
            ("url", "https://api.example.com/data"),
            ("body", r#"{"key": "val"}"#),
            ("body_type", "json"),
        ]);
        add_args.insert(
            "headers".to_string(),
            json!({"Content-Type": "application/json"}),
        );
        let add_result = service.call_tool("add_request", Some(add_args)).unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        // Prepare open collection request
        let open_args = args(&[("collection_id", collection_id), ("request_id", request_id)]);
        let data = service.prepare_open_collection_request(&open_args).unwrap();
        assert_eq!(data["collection_id"].as_str().unwrap(), collection_id);
        assert_eq!(data["request_id"].as_str().unwrap(), request_id);
        assert_eq!(data["name"].as_str().unwrap(), "My Request");
        assert_eq!(data["method"].as_str().unwrap(), "POST");
        assert_eq!(
            data["url"].as_str().unwrap(),
            "https://api.example.com/data"
        );
        assert!(data["headers"].is_object());
        assert_eq!(data["headers"]["Content-Type"], "application/json");
        assert_eq!(data["body"], r#"{"key": "val"}"#);
    }

    #[test]
    fn test_open_collection_request_not_found() {
        let (mut service, _dir) = make_service();
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Open NF")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let open_args = args(&[
            ("collection_id", collection_id),
            ("request_id", "nonexistent"),
        ]);
        let result = service.prepare_open_collection_request(&open_args);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_delete_request_emits_event() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Event Test",
            "Req",
            "GET",
            "http://e.com",
        );

        service
            .call_tool(
                "delete_request",
                Some(args(&[
                    ("collection_id", &collection_id),
                    ("request_id", &request_id),
                ])),
            )
            .unwrap();

        let captured = events.lock().expect("lock events");
        // create_collection + add_request + delete_request = 3
        assert_eq!(captured.len(), 3);
        assert_eq!(captured[2].0, "request:deleted");
        assert!(matches!(
            captured[2].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(captured[2].2["request_id"].as_str().unwrap(), request_id);
        drop(captured);
    }

    #[test]
    fn test_path_traversal_rejected_dotdot() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool(
            "delete_collection",
            Some(args(&[("collection_id", "../etc/passwd")])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid collection ID"));
    }

    #[test]
    fn test_path_traversal_rejected_slash() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool(
            "add_request",
            Some(args(&[
                ("collection_id", "foo/bar"),
                ("name", "Test"),
                ("method", "GET"),
                ("url", "http://x.com"),
            ])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid collection ID"));
    }

    #[test]
    fn test_path_traversal_rejected_backslash() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool(
            "update_request",
            Some(args(&[
                ("collection_id", "foo\\bar"),
                ("request_id", "req_1"),
            ])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid collection ID"));
    }

    #[test]
    fn test_path_traversal_rejected_empty() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("delete_collection", Some(args(&[("collection_id", "")])));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn test_unknown_tool() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("nonexistent_tool", None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown tool"));
    }

    #[test]
    fn test_create_collection_emits_event() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        service
            .call_tool("create_collection", Some(args(&[("name", "Test API")])))
            .unwrap();

        let captured = events.lock().expect("lock events");
        assert_eq!(captured.len(), 1);
        assert_eq!(captured[0].0, "collection:created");
        assert!(matches!(
            captured[0].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(captured[0].2["name"], "Test API");
        assert!(captured[0].2["id"].as_str().is_some());
        drop(captured);
    }

    #[test]
    fn test_create_collection_duplicate_name_rejected() {
        let (mut service, _dir) = make_service();
        service
            .call_tool("create_collection", Some(args(&[("name", "Stripe API")])))
            .unwrap();

        let result = service.call_tool("create_collection", Some(args(&[("name", "Stripe API")])));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("already exists"));
    }

    #[test]
    fn test_create_collection_has_manual_source_type() {
        let (mut service, _dir) = make_service();

        let result = service
            .call_tool("create_collection", Some(args(&[("name", "MCP Test")])))
            .unwrap();
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        let created: serde_json::Value = serde_json::from_str(text).unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // MCP is a creation channel, not a collection type.
        // AI provenance is tracked via intelligence.ai_generated on each request.
        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        assert_eq!(collection.source.source_type, SourceType::Manual);
    }

    #[test]
    fn test_add_request_has_ai_attribution() {
        let (mut service, _dir) = make_service();

        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let add_result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "AI Request"),
                    ("method", "GET"),
                    ("url", "https://api.example.com/ai"),
                ])),
            )
            .unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        let collection = load_collection_in_dir(collection_id, service.dir()).unwrap();
        let request = collection
            .requests
            .iter()
            .find(|r| r.id == request_id)
            .unwrap();
        assert!(request.intelligence.ai_generated);
        assert_eq!(
            request.intelligence.generator_model,
            Some("mcp".to_string())
        );
    }

    #[test]
    fn test_add_request_emits_event() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        // Create collection
        let result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        let created: serde_json::Value = serde_json::from_str(text).unwrap();
        let collection_id = created["id"].as_str().unwrap();

        // Add request
        service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "Get Users"),
                    ("method", "GET"),
                    ("url", "https://api.example.com/users"),
                ])),
            )
            .unwrap();

        let captured = events.lock().expect("lock events");
        assert_eq!(captured.len(), 2); // create + add
        assert_eq!(captured[1].0, "request:added");
        assert!(matches!(
            captured[1].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(captured[1].2["name"], "Get Users");
        drop(captured);
    }

    #[test]
    fn test_delete_collection_emits_event() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        let result = service
            .call_tool("create_collection", Some(args(&[("name", "To Delete")])))
            .unwrap();
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        let created: serde_json::Value = serde_json::from_str(text).unwrap();
        let collection_id = created["id"].as_str().unwrap();

        service
            .call_tool(
                "delete_collection",
                Some(args(&[("collection_id", collection_id)])),
            )
            .unwrap();

        let captured = events.lock().expect("lock events");
        assert_eq!(captured.len(), 2); // create + delete
        assert_eq!(captured[1].0, "collection:deleted");
        assert!(matches!(
            captured[1].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(captured[1].2["id"].as_str().unwrap(), collection_id);
        assert_eq!(captured[1].2["name"].as_str().unwrap(), "To Delete");
        drop(captured);
    }

    // ── Test 3B.1: import_collection tool registered ──────────────────

    #[test]
    fn test_import_collection_tool_registered_with_schema() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        let tool = tools
            .iter()
            .find(|t| t.name == "import_collection")
            .unwrap();
        assert!(tool.description.is_some());
        let props = tool.input_schema.get("properties").unwrap();
        assert!(props.get("url").is_some());
        assert!(props.get("file_path").is_some());
        assert!(props.get("display_name").is_some());
        // None are required (at least one of url/file_path/inline_content must be given)
        assert!(tool.input_schema.get("required").is_none());
    }

    // ── Test 3B.3: import_collection routed to dispatcher ───────────

    #[test]
    fn test_import_collection_routed_to_dispatcher() {
        let (mut service, _dir) = make_service();
        let result = service.call_tool("import_collection", Some(serde_json::Map::new()));
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("must be handled by dispatcher")
        );
    }

    // ── Test 3B.4: refresh_collection_spec tool registered ──────────

    #[test]
    fn test_refresh_collection_spec_tool_registered_with_schema() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        let tool = tools
            .iter()
            .find(|t| t.name == "refresh_collection_spec")
            .unwrap();
        assert!(tool.description.is_some());
        let required = tool
            .input_schema
            .get("required")
            .unwrap()
            .as_array()
            .unwrap();
        assert!(required.contains(&json!("collection_id")));
    }

    // ── Test 3B.6: run_hurl_suite tool registered ───────────────────

    #[test]
    fn test_run_hurl_suite_tool_registered_with_schema() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        let tool = tools.iter().find(|t| t.name == "run_hurl_suite").unwrap();
        assert!(tool.description.is_some());
        let required = tool
            .input_schema
            .get("required")
            .unwrap()
            .as_array()
            .unwrap();
        assert!(required.contains(&json!("hurl_file_path")));
    }

    #[test]
    fn test_no_emitter_does_not_panic() {
        let (mut service, _dir) = make_service(); // No emitter
        let result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        assert!(!result.is_error);
    }

    #[test]
    fn test_collection_request_to_params_basic() {
        let req = CollectionRequest {
            id: "req_test".to_string(),
            name: "Test".to_string(),
            method: "POST".to_string(),
            url: "https://api.example.com/users".to_string(),
            ..Default::default()
        };

        let params = collection_request_to_params(&req, 5000);
        assert_eq!(params.url, "https://api.example.com/users");
        assert_eq!(params.method, "POST");
        assert!(params.headers.is_empty());
        assert!(params.body.is_none());
        assert_eq!(params.timeout_ms, 5000);
    }

    #[test]
    fn test_collection_request_to_params_with_headers_and_body() {
        use crate::domain::collection::{BodyType, RequestBody};
        use std::collections::BTreeMap;

        let mut headers = BTreeMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        headers.insert("Authorization".to_string(), "Bearer tok".to_string());

        let req = CollectionRequest {
            id: "req_test".to_string(),
            name: "Test".to_string(),
            method: "PUT".to_string(),
            url: "https://api.example.com/update".to_string(),
            headers,
            body: Some(RequestBody {
                body_type: BodyType::Json,
                content: Some(r#"{"key":"val"}"#.to_string()),
                file: None,
            }),
            ..Default::default()
        };

        let params = collection_request_to_params(&req, 10_000);
        assert_eq!(params.headers.len(), 2);
        assert_eq!(
            params.headers.get("Content-Type"),
            Some(&"application/json".to_string())
        );
        assert_eq!(params.body, Some(r#"{"key":"val"}"#.to_string()));
        assert_eq!(params.timeout_ms, 10_000);
    }

    #[test]
    fn test_prepare_execute_request_success() {
        let (mut service, _dir) = make_service();

        // Create collection + request
        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test API")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let add_result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "Get Users"),
                    ("method", "GET"),
                    ("url", "https://api.example.com/users"),
                ])),
            )
            .unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        let mut exec_args = serde_json::Map::new();
        exec_args.insert("collection_id".to_string(), json!(collection_id));
        exec_args.insert("request_id".to_string(), json!(request_id));

        let (params, cid, rid) = service.prepare_execute_request(&exec_args).unwrap();
        assert_eq!(params.url, "https://api.example.com/users");
        assert_eq!(params.method, "GET");
        assert_eq!(params.timeout_ms, 30_000);
        assert_eq!(cid, collection_id);
        assert_eq!(rid, request_id);
    }

    #[test]
    fn test_prepare_execute_request_nonexistent_collection() {
        let (service, _dir) = make_service();
        let mut exec_args = serde_json::Map::new();
        exec_args.insert("collection_id".to_string(), json!("nonexistent"));
        exec_args.insert("request_id".to_string(), json!("req_1"));

        let result = service.prepare_execute_request(&exec_args);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_prepare_execute_request_nonexistent_request() {
        let (mut service, _dir) = make_service();

        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let mut exec_args = serde_json::Map::new();
        exec_args.insert("collection_id".to_string(), json!(collection_id));
        exec_args.insert("request_id".to_string(), json!("nonexistent"));

        let result = service.prepare_execute_request(&exec_args);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_prepare_execute_request_custom_timeout() {
        let (mut service, _dir) = make_service();

        let create_result = service
            .call_tool("create_collection", Some(args(&[("name", "Test")])))
            .unwrap();
        let created: serde_json::Value = serde_json::from_str(match &create_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let collection_id = created["id"].as_str().unwrap();

        let add_result = service
            .call_tool(
                "add_request",
                Some(args(&[
                    ("collection_id", collection_id),
                    ("name", "Slow Endpoint"),
                    ("method", "GET"),
                    ("url", "https://api.example.com/slow"),
                ])),
            )
            .unwrap();
        let added: serde_json::Value = serde_json::from_str(match &add_result.content[0] {
            ToolResponseContent::Text { text } => text,
        })
        .unwrap();
        let request_id = added["request_id"].as_str().unwrap();

        let mut exec_args = serde_json::Map::new();
        exec_args.insert("collection_id".to_string(), json!(collection_id));
        exec_args.insert("request_id".to_string(), json!(request_id));
        exec_args.insert("timeout_ms".to_string(), json!(60_000));

        let (params, _, _) = service.prepare_execute_request(&exec_args).unwrap();
        assert_eq!(params.timeout_ms, 60_000);
    }

    #[test]
    fn test_update_request_emits_event_with_name() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        // Create collection and add request
        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Update Event Test",
            "Original Name",
            "GET",
            "http://example.com",
        );

        // Update the request (change name to "Updated Name")
        service
            .call_tool(
                "update_request",
                Some(args(&[
                    ("collection_id", &collection_id),
                    ("request_id", &request_id),
                    ("name", "Updated Name"),
                ])),
            )
            .unwrap();

        let captured = events.lock().expect("lock events");
        // create_collection + add_request + update_request = 3
        assert_eq!(captured.len(), 3);
        assert_eq!(captured[2].0, "request:updated");
        assert!(matches!(
            captured[2].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(
            captured[2].2["collection_id"].as_str().unwrap(),
            collection_id
        );
        assert_eq!(captured[2].2["request_id"].as_str().unwrap(), request_id);
        assert_eq!(captured[2].2["name"].as_str().unwrap(), "Updated Name");
        drop(captured);
    }

    #[test]
    fn test_delete_request_emits_event_with_name() {
        let dir = TempDir::new().unwrap();
        let emitter = crate::domain::mcp::events::TestEventEmitter::new();
        let events = emitter.events_handle();
        let mut service =
            McpServerService::with_emitter(dir.path().to_path_buf(), Arc::new(emitter));

        // Create collection and add request named "To Remove"
        let (collection_id, request_id) = create_collection_with_request(
            &mut service,
            "Delete Event Test",
            "To Remove",
            "GET",
            "http://example.com",
        );

        // Delete the request
        service
            .call_tool(
                "delete_request",
                Some(args(&[
                    ("collection_id", &collection_id),
                    ("request_id", &request_id),
                ])),
            )
            .unwrap();

        let captured = events.lock().expect("lock events");
        // create_collection + add_request + delete_request = 3
        assert_eq!(captured.len(), 3);
        assert_eq!(captured[2].0, "request:deleted");
        assert!(matches!(
            captured[2].1,
            crate::domain::mcp::events::Actor::Ai { .. }
        ));
        assert_eq!(
            captured[2].2["collection_id"].as_str().unwrap(),
            collection_id
        );
        assert_eq!(captured[2].2["request_id"].as_str().unwrap(), request_id);
        assert_eq!(captured[2].2["name"].as_str().unwrap(), "To Remove");
        drop(captured);
    }
}
