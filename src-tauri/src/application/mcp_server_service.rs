// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP server service — tool registry, dispatch, and collection CRUD tools.
//!
//! Manages the set of tools exposed by runi's MCP server and dispatches
//! tool calls to the appropriate handlers backed by the collection store.

use std::path::{Path, PathBuf};

use serde_json::json;

use crate::domain::collection::{Collection, CollectionRequest};
use crate::domain::mcp::protocol::{McpToolDefinition, ToolCallResult, ToolResponseContent};
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
pub struct McpServerService {
    tools: Vec<RegisteredTool>,
    collections_dir: PathBuf,
}

impl McpServerService {
    /// Create a new server service with the given collections directory.
    #[must_use]
    pub fn new(collections_dir: PathBuf) -> Self {
        let mut service = Self {
            tools: Vec::new(),
            collections_dir,
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
        &self,
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
        &self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let name = args
            .get("name")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: name".to_string())?;

        let collection = Collection::new(name);
        save_collection_in_dir(&collection, self.dir())?;

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
        &self,
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
            ..Default::default()
        };
        let request_id = request.id.clone();
        collection.requests.push(request);
        save_collection_in_dir(&collection, self.dir())?;

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
        &self,
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
        &self,
        args: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<ToolCallResult, String> {
        let collection_id = args
            .get("collection_id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| "Missing required parameter: collection_id".to_string())?;

        Self::validate_collection_id(collection_id)?;
        delete_collection_in_dir(collection_id, self.dir())?;

        Ok(ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: json!({
                    "collection_id": collection_id,
                    "message": format!("Collection '{collection_id}' deleted")
                })
                .to_string(),
            }],
            is_error: false,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
    fn test_registers_five_tools() {
        let (service, _dir) = make_service();
        let tools = service.list_tools();
        assert_eq!(tools.len(), 5);
        let names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        assert!(names.contains(&"create_collection"));
        assert!(names.contains(&"list_collections"));
        assert!(names.contains(&"add_request"));
        assert!(names.contains(&"update_request"));
        assert!(names.contains(&"delete_collection"));
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
        let (service, _dir) = make_service();
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
        let (service, _dir) = make_service();
        let result = service.call_tool("create_collection", Some(serde_json::Map::new()));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("name"));
    }

    #[test]
    fn test_list_collections_empty() {
        let (service, _dir) = make_service();
        let result = service.call_tool("list_collections", None).unwrap();
        assert!(!result.is_error);
        let text = match &result.content[0] {
            ToolResponseContent::Text { text } => text,
        };
        assert_eq!(text, "[]");
    }

    #[test]
    fn test_list_collections_after_create() {
        let (service, _dir) = make_service();
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
        let (service, _dir) = make_service();

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
        let (service, _dir) = make_service();
        let result = service.call_tool("add_request", Some(args(&[("collection_id", "foo")])));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("name"));
    }

    #[test]
    fn test_add_request_collection_not_found() {
        let (service, _dir) = make_service();
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
        let (service, _dir) = make_service();

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
        let (service, _dir) = make_service();

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
        let (service, _dir) = make_service();

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
        let (service, _dir) = make_service();
        let result = service.call_tool(
            "delete_collection",
            Some(args(&[("collection_id", "nonexistent")])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_path_traversal_rejected_dotdot() {
        let (service, _dir) = make_service();
        let result = service.call_tool(
            "delete_collection",
            Some(args(&[("collection_id", "../etc/passwd")])),
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid collection ID"));
    }

    #[test]
    fn test_path_traversal_rejected_slash() {
        let (service, _dir) = make_service();
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
        let (service, _dir) = make_service();
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
        let (service, _dir) = make_service();
        let result = service.call_tool("delete_collection", Some(args(&[("collection_id", "")])));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn test_unknown_tool() {
        let (service, _dir) = make_service();
        let result = service.call_tool("nonexistent_tool", None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown tool"));
    }
}
