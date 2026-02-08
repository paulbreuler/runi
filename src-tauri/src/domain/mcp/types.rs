// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP domain types for server status, tool info, and tool call results.

use serde::{Deserialize, Serialize};

/// Status of an MCP server connection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", content = "message")]
pub enum ServerStatus {
    /// Server is not running.
    Stopped,
    /// Server process is starting up.
    Starting,
    /// Server is running and connected.
    Running,
    /// Server is shutting down.
    Stopping,
    /// Server encountered an error.
    Error(String),
}

impl std::fmt::Display for ServerStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Stopped => write!(f, "Stopped"),
            Self::Starting => write!(f, "Starting"),
            Self::Running => write!(f, "Running"),
            Self::Stopping => write!(f, "Stopping"),
            Self::Error(msg) => write!(f, "Error: {msg}"),
        }
    }
}

/// Information about a tool provided by an MCP server.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ToolInfo {
    /// Tool name (identifier).
    pub name: String,
    /// Human-readable description.
    pub description: Option<String>,
    /// JSON Schema for the tool's input parameters.
    pub input_schema: serde_json::Value,
}

/// Content type in a tool call result.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", content = "value")]
pub enum ToolContent {
    /// Text content.
    Text(String),
}

/// Result of invoking a tool on an MCP server.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ToolCallResult {
    /// Content returned by the tool.
    pub content: Vec<ToolContent>,
    /// Whether this result represents an error.
    pub is_error: bool,
}

/// Summary info about an MCP server and its tools.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerInfo {
    /// Server name from configuration.
    pub name: String,
    /// Current connection status.
    pub status: ServerStatus,
    /// Tools available on this server (empty if not running).
    pub tools: Vec<ToolInfo>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_status_display() {
        assert_eq!(ServerStatus::Stopped.to_string(), "Stopped");
        assert_eq!(ServerStatus::Starting.to_string(), "Starting");
        assert_eq!(ServerStatus::Running.to_string(), "Running");
        assert_eq!(ServerStatus::Stopping.to_string(), "Stopping");
        assert_eq!(
            ServerStatus::Error("connection refused".to_string()).to_string(),
            "Error: connection refused"
        );
    }

    #[test]
    fn test_server_status_equality() {
        assert_eq!(ServerStatus::Stopped, ServerStatus::Stopped);
        assert_ne!(ServerStatus::Stopped, ServerStatus::Running);
        assert_eq!(
            ServerStatus::Error("x".to_string()),
            ServerStatus::Error("x".to_string())
        );
        assert_ne!(
            ServerStatus::Error("x".to_string()),
            ServerStatus::Error("y".to_string())
        );
    }

    #[test]
    fn test_tool_info_serialization_roundtrip() {
        let tool = ToolInfo {
            name: "echo".to_string(),
            description: Some("Echoes input".to_string()),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "message": { "type": "string" }
                }
            }),
        };
        let json = serde_json::to_string(&tool).unwrap();
        let deserialized: ToolInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(tool, deserialized);
    }

    #[test]
    fn test_tool_call_result_serialization_roundtrip() {
        let result = ToolCallResult {
            content: vec![ToolContent::Text("hello".to_string())],
            is_error: false,
        };
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: ToolCallResult = serde_json::from_str(&json).unwrap();
        assert_eq!(result, deserialized);
    }

    #[test]
    fn test_tool_call_result_error() {
        let result = ToolCallResult {
            content: vec![ToolContent::Text("something failed".to_string())],
            is_error: true,
        };
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"isError\":true"));
    }

    #[test]
    fn test_server_info_serialization_roundtrip() {
        let info = ServerInfo {
            name: "test".to_string(),
            status: ServerStatus::Running,
            tools: vec![ToolInfo {
                name: "echo".to_string(),
                description: None,
                input_schema: serde_json::json!({}),
            }],
        };
        let json = serde_json::to_string(&info).unwrap();
        let deserialized: ServerInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "test");
        assert_eq!(deserialized.tools.len(), 1);
    }

    #[test]
    fn test_server_status_serialization_roundtrip() {
        for status in [
            ServerStatus::Stopped,
            ServerStatus::Starting,
            ServerStatus::Running,
            ServerStatus::Stopping,
            ServerStatus::Error("oops".to_string()),
        ] {
            let json = serde_json::to_string(&status).unwrap();
            let deserialized: ServerStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(status, deserialized);
        }
    }
}
