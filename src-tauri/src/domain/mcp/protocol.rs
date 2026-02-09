// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP protocol types for the server implementation.
//!
//! These types model the MCP 2024-11-05 specification's initialize,
//! tools/list, and tools/call methods.

use serde::{Deserialize, Serialize};

/// MCP protocol version supported by this server.
pub const PROTOCOL_VERSION: &str = "2024-11-05";

/// Server name reported in initialize response.
pub const SERVER_NAME: &str = "runi";

/// Server version reported in initialize response.
pub const SERVER_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Server capabilities advertised during initialization.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServerCapabilities {
    /// Tool execution capability.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<ToolsCapability>,
}

impl ServerCapabilities {
    /// Create capabilities with tools support enabled.
    #[must_use]
    pub const fn with_tools() -> Self {
        Self {
            tools: Some(ToolsCapability {}),
        }
    }
}

/// Marker struct indicating tool support is available.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ToolsCapability {}

/// Server info returned in the initialize response.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct McpServerInfo {
    /// Server name.
    pub name: String,
    /// Server version.
    pub version: String,
}

/// Result of the `initialize` method.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InitializeResult {
    /// MCP protocol version.
    pub protocol_version: String,
    /// Server capabilities.
    pub capabilities: ServerCapabilities,
    /// Server identification.
    pub server_info: McpServerInfo,
}

impl InitializeResult {
    /// Build the default initialize result for runi.
    #[must_use]
    pub fn for_runi() -> Self {
        Self {
            protocol_version: PROTOCOL_VERSION.to_string(),
            capabilities: ServerCapabilities::with_tools(),
            server_info: McpServerInfo {
                name: SERVER_NAME.to_string(),
                version: SERVER_VERSION.to_string(),
            },
        }
    }
}

/// Tool definition for `tools/list` response.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct McpToolDefinition {
    /// Tool name (identifier used in tool calls).
    pub name: String,
    /// Human-readable description.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// JSON Schema describing the tool's input parameters.
    pub input_schema: serde_json::Value,
}

/// Parameters for a `tools/call` request.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ToolCallParams {
    /// Tool name to invoke.
    pub name: String,
    /// Arguments as a JSON object.
    #[serde(default)]
    pub arguments: Option<serde_json::Map<String, serde_json::Value>>,
}

/// Content item in a tool call response.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum ToolResponseContent {
    /// Text content.
    #[serde(rename = "text")]
    Text {
        /// The text value.
        text: String,
    },
}

/// Result of a `tools/call` invocation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ToolCallResult {
    /// Content items returned by the tool.
    pub content: Vec<ToolResponseContent>,
    /// Whether this result represents an error.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub is_error: bool,
}

/// Result of `tools/list` method.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ToolsListResult {
    /// Available tools.
    pub tools: Vec<McpToolDefinition>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_initialize_result_serialization() {
        let result = InitializeResult::for_runi();
        let json_str = serde_json::to_string(&result).unwrap();
        let parsed: InitializeResult = serde_json::from_str(&json_str).unwrap();
        assert_eq!(parsed.protocol_version, PROTOCOL_VERSION);
        assert_eq!(parsed.server_info.name, "runi");
        assert!(parsed.capabilities.tools.is_some());
    }

    #[test]
    fn test_initialize_result_camel_case() {
        let result = InitializeResult::for_runi();
        let json_str = serde_json::to_string(&result).unwrap();
        assert!(json_str.contains("protocolVersion"));
        assert!(json_str.contains("serverInfo"));
    }

    #[test]
    fn test_tool_definition_serialization() {
        let tool = McpToolDefinition {
            name: "create_collection".to_string(),
            description: Some("Create a new collection".to_string()),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "name": { "type": "string" }
                },
                "required": ["name"]
            }),
        };
        let json_str = serde_json::to_string(&tool).unwrap();
        let parsed: McpToolDefinition = serde_json::from_str(&json_str).unwrap();
        assert_eq!(parsed.name, "create_collection");
        assert_eq!(
            parsed.description.as_deref(),
            Some("Create a new collection")
        );
        assert!(parsed.input_schema.get("required").is_some());
    }

    #[test]
    fn test_tool_definition_no_description() {
        let tool = McpToolDefinition {
            name: "test".to_string(),
            description: None,
            input_schema: json!({"type": "object"}),
        };
        let json_str = serde_json::to_string(&tool).unwrap();
        assert!(!json_str.contains("description"));
    }

    #[test]
    fn test_tool_call_params_serialization() {
        let params = ToolCallParams {
            name: "create_collection".to_string(),
            arguments: Some(serde_json::from_value(json!({"name": "My API"})).unwrap()),
        };
        let json_str = serde_json::to_string(&params).unwrap();
        let parsed: ToolCallParams = serde_json::from_str(&json_str).unwrap();
        assert_eq!(parsed.name, "create_collection");
        assert!(parsed.arguments.is_some());
    }

    #[test]
    fn test_tool_call_params_no_arguments() {
        let params = ToolCallParams {
            name: "list_collections".to_string(),
            arguments: None,
        };
        let json_str = serde_json::to_string(&params).unwrap();
        let parsed: ToolCallParams = serde_json::from_str(&json_str).unwrap();
        assert!(parsed.arguments.is_none());
    }

    #[test]
    fn test_tool_call_result_success() {
        let result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Collection created".to_string(),
            }],
            is_error: false,
        };
        let json_str = serde_json::to_string(&result).unwrap();
        assert!(!json_str.contains("isError"));
        let parsed: ToolCallResult = serde_json::from_str(&json_str).unwrap();
        assert!(!parsed.is_error);
        assert_eq!(parsed.content.len(), 1);
    }

    #[test]
    fn test_tool_call_result_error() {
        let result = ToolCallResult {
            content: vec![ToolResponseContent::Text {
                text: "Not found".to_string(),
            }],
            is_error: true,
        };
        let json_str = serde_json::to_string(&result).unwrap();
        assert!(json_str.contains("isError"));
        let parsed: ToolCallResult = serde_json::from_str(&json_str).unwrap();
        assert!(parsed.is_error);
    }

    #[test]
    fn test_tool_response_content_text_tag() {
        let content = ToolResponseContent::Text {
            text: "hello".to_string(),
        };
        let json_str = serde_json::to_string(&content).unwrap();
        assert!(json_str.contains("\"type\":\"text\""));
    }

    #[test]
    fn test_tools_list_result() {
        let result = ToolsListResult {
            tools: vec![McpToolDefinition {
                name: "test_tool".to_string(),
                description: Some("A test".to_string()),
                input_schema: json!({"type": "object"}),
            }],
        };
        let json_str = serde_json::to_string(&result).unwrap();
        let parsed: ToolsListResult = serde_json::from_str(&json_str).unwrap();
        assert_eq!(parsed.tools.len(), 1);
        assert_eq!(parsed.tools[0].name, "test_tool");
    }

    #[test]
    fn test_server_capabilities_with_tools() {
        let caps = ServerCapabilities::with_tools();
        assert!(caps.tools.is_some());
        let json_str = serde_json::to_string(&caps).unwrap();
        assert!(json_str.contains("\"tools\""));
    }
}
