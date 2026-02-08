// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP client wrapper around the `rmcp` crate.
//!
//! Manages a single MCP server connection: spawn, handshake, tool discovery,
//! tool invocation, and graceful shutdown.

use crate::domain::mcp::config::McpServerConfig;
use crate::domain::mcp::types::{ToolCallResult, ToolContent, ToolInfo};
use rmcp::model::{CallToolRequestParams, RawContent};
use rmcp::service::RunningService;
use rmcp::transport::TokioChildProcess;
use rmcp::{RoleClient, ServiceExt};
use std::borrow::Cow;
use tokio::process::Command;

/// Wrapper around an rmcp `RunningService` for a single MCP server.
pub struct McpClient {
    service: Option<RunningService<RoleClient, ()>>,
}

impl McpClient {
    /// Create a new disconnected client (test-only; production uses [`Self::connect`]).
    #[cfg(test)]
    #[must_use]
    pub const fn new() -> Self {
        Self { service: None }
    }

    /// Whether the client is connected to a running MCP server.
    #[allow(dead_code)] // Public API, used in integration tests and future UI wiring
    #[must_use]
    pub fn is_connected(&self) -> bool {
        self.service.as_ref().is_some_and(|s| !s.is_closed())
    }

    /// Connect to an MCP server by spawning a child process.
    ///
    /// Performs the MCP `initialize` handshake automatically.
    ///
    /// # Errors
    ///
    /// Returns an error if the process cannot be spawned or the handshake fails.
    pub async fn connect(config: &McpServerConfig) -> Result<Self, String> {
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args);
        for (key, value) in &config.env {
            cmd.env(key, value);
        }
        cmd.kill_on_drop(true);

        let transport = TokioChildProcess::new(cmd)
            .map_err(|e| format!("Failed to spawn MCP server '{}': {e}", config.name))?;

        let service = ()
            .serve(transport)
            .await
            .map_err(|e| format!("MCP handshake failed for '{}': {e}", config.name))?;

        Ok(Self {
            service: Some(service),
        })
    }

    /// List all tools from the connected server (handles pagination).
    ///
    /// # Errors
    ///
    /// Returns an error if not connected or the request fails.
    pub async fn list_tools(&self) -> Result<Vec<ToolInfo>, String> {
        let service = self.service.as_ref().ok_or("MCP client not connected")?;
        let tools = service
            .list_all_tools()
            .await
            .map_err(|e| format!("Failed to list tools: {e}"))?;

        Ok(tools.into_iter().map(convert_tool).collect())
    }

    /// Call a tool by name with JSON arguments.
    ///
    /// # Errors
    ///
    /// Returns an error if not connected or the tool call fails.
    pub async fn call_tool(
        &self,
        name: &str,
        arguments: serde_json::Value,
    ) -> Result<ToolCallResult, String> {
        let service = self.service.as_ref().ok_or("MCP client not connected")?;

        let args_map = match arguments {
            serde_json::Value::Object(map) => Some(map),
            serde_json::Value::Null => None,
            _ => return Err("Tool arguments must be a JSON object or null".to_string()),
        };

        let params = CallToolRequestParams {
            name: Cow::Owned(name.to_string()),
            arguments: args_map,
            meta: None,
            task: None,
        };

        let result = service
            .call_tool(params)
            .await
            .map_err(|e| format!("Tool call failed: {e}"))?;

        Ok(convert_call_result(&result))
    }

    /// Gracefully disconnect from the MCP server.
    ///
    /// # Errors
    ///
    /// Returns an error if the shutdown fails.
    pub async fn disconnect(&mut self) -> Result<(), String> {
        if let Some(service) = self.service.take() {
            service
                .cancel()
                .await
                .map_err(|e| format!("MCP disconnect failed: {e}"))?;
        }
        Ok(())
    }
}

/// Convert an rmcp `Tool` to our domain `ToolInfo`.
fn convert_tool(tool: rmcp::model::Tool) -> ToolInfo {
    ToolInfo {
        name: tool.name.to_string(),
        description: tool.description.map(|d| d.to_string()),
        input_schema: serde_json::to_value(&*tool.input_schema).unwrap_or_default(),
    }
}

/// Convert an rmcp `CallToolResult` to our domain `ToolCallResult`.
fn convert_call_result(result: &rmcp::model::CallToolResult) -> ToolCallResult {
    let content = result
        .content
        .iter()
        .filter_map(|c| match &c.raw {
            RawContent::Text(text) => Some(ToolContent::Text(text.text.clone())),
            _ => None,
        })
        .collect();

    ToolCallResult {
        content,
        is_error: result.is_error.unwrap_or(false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_client_is_disconnected() {
        let client = McpClient::new();
        assert!(!client.is_connected());
    }

    #[test]
    fn test_convert_tool() {
        use rmcp::model::Tool;
        use serde_json::json;
        use std::sync::Arc;

        let schema_map: serde_json::Map<String, serde_json::Value> =
            serde_json::from_value(json!({
                "type": "object",
                "properties": {
                    "message": { "type": "string" }
                }
            }))
            .unwrap();

        let tool = Tool {
            name: Cow::Borrowed("echo"),
            title: None,
            description: Some(Cow::Borrowed("Echo tool")),
            input_schema: Arc::new(schema_map),
            output_schema: None,
            annotations: None,
            icons: None,
            meta: None,
        };

        let info = convert_tool(tool);
        assert_eq!(info.name, "echo");
        assert_eq!(info.description.as_deref(), Some("Echo tool"));
        assert!(info.input_schema.get("type").is_some());
    }

    #[test]
    fn test_convert_call_result_text() {
        use rmcp::model::{Annotated, CallToolResult, RawContent, RawTextContent};

        let result = CallToolResult {
            content: vec![Annotated {
                raw: RawContent::Text(RawTextContent {
                    text: "hello world".to_string(),
                    meta: None,
                }),
                annotations: None,
            }],
            structured_content: None,
            is_error: Some(false),
            meta: None,
        };

        let converted = convert_call_result(&result);
        assert!(!converted.is_error);
        assert_eq!(converted.content.len(), 1);
        assert_eq!(
            converted.content[0],
            ToolContent::Text("hello world".to_string())
        );
    }

    #[test]
    fn test_convert_call_result_error() {
        use rmcp::model::CallToolResult;

        let result = CallToolResult {
            content: vec![],
            structured_content: None,
            is_error: Some(true),
            meta: None,
        };

        let converted = convert_call_result(&result);
        assert!(converted.is_error);
    }

    #[test]
    fn test_convert_call_result_none_is_error() {
        use rmcp::model::CallToolResult;

        let result = CallToolResult {
            content: vec![],
            structured_content: None,
            is_error: None,
            meta: None,
        };

        let converted = convert_call_result(&result);
        assert!(!converted.is_error);
    }
}
