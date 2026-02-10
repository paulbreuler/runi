// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP server service — tool registry, dispatch, and collection CRUD tools.
//!
//! Manages the set of tools exposed by runi's MCP server and dispatches
//! tool calls to the appropriate handlers backed by the collection store.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde_json::json;

use crate::domain::collection::{Collection, CollectionRequest, IntelligenceMetadata};
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
            "delete_collection" => self.handle_delete_collection(&args),
            _ => Err(format!("Unknown tool: {name}")),
        }
    }

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
                        "url": { "type": "string", "description": "Request URL" }
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
                        "url": { "type": "string", "description": "New URL" }
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
        let request = CollectionRequest {
            id: CollectionRequest::generate_id(name),
            name: name.to_string(),
            seq,
            method: method.to_uppercase(),
            url: url.to_string(),
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

        save_collection_in_dir(&collection, self.dir())?;

        self.emit(
            "request:updated",
            json!({"collection_id": collection_id, "request_id": request_id}),
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
    fn test_registers_six_tools() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        assert_eq!(tools.len(), 6);
        let names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        assert!(names.contains(&"create_collection"));
        assert!(names.contains(&"list_collections"));
        assert!(names.contains(&"add_request"));
        assert!(names.contains(&"update_request"));
        assert!(names.contains(&"delete_collection"));
        assert!(names.contains(&"execute_request"));
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
}
