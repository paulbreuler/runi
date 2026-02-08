// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Tauri command handlers for MCP operations.
//!
//! These commands are exposed to the frontend via `tauri::generate_handler!`.

use crate::application::mcp_service::McpService;
use crate::domain::features::config as feature_config;
use crate::domain::mcp::types::{ServerInfo, ToolCallResult, ToolInfo};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Managed state type for the MCP service.
pub type McpServiceState = Arc<RwLock<McpService>>;

/// Create the initial MCP service state for Tauri managed state.
#[must_use]
pub fn create_mcp_service() -> McpServiceState {
    Arc::new(RwLock::new(McpService::new()))
}

/// Load MCP server configuration from `~/.runi/mcp-servers.yaml`.
#[tauri::command]
pub async fn mcp_load_config(state: tauri::State<'_, McpServiceState>) -> Result<(), String> {
    let config_dir = feature_config::get_config_dir()?;
    let mut service = state.write().await;
    service.load_config(&config_dir).await
}

/// Start an MCP server by name.
#[tauri::command]
pub async fn mcp_start_server(
    name: String,
    state: tauri::State<'_, McpServiceState>,
) -> Result<(), String> {
    let mut service = state.write().await;
    service.start_server(&name).await
}

/// Stop an MCP server by name.
#[tauri::command]
pub async fn mcp_stop_server(
    name: String,
    state: tauri::State<'_, McpServiceState>,
) -> Result<(), String> {
    let mut service = state.write().await;
    service.stop_server(&name).await
}

/// List all registered MCP servers with their status and tools.
#[tauri::command]
pub async fn mcp_list_servers(
    state: tauri::State<'_, McpServiceState>,
) -> Result<Vec<ServerInfo>, String> {
    let service = state.read().await;
    Ok(service.list_servers())
}

/// Get info for a single MCP server by name.
#[tauri::command]
pub async fn mcp_server_status(
    name: String,
    state: tauri::State<'_, McpServiceState>,
) -> Result<ServerInfo, String> {
    let service = state.read().await;
    service.get_server_info(&name)
}

/// List tools available on a running MCP server.
#[tauri::command]
pub async fn mcp_list_tools(
    server_name: String,
    state: tauri::State<'_, McpServiceState>,
) -> Result<Vec<ToolInfo>, String> {
    let service = state.read().await;
    service.get_server_tools(&server_name)
}

/// Call a tool on a running MCP server.
#[tauri::command]
pub async fn mcp_call_tool(
    server_name: String,
    tool_name: String,
    arguments: serde_json::Value,
    state: tauri::State<'_, McpServiceState>,
) -> Result<ToolCallResult, String> {
    let service = state.read().await;
    service.call_tool(&server_name, &tool_name, arguments).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::mcp::types::{ServerStatus, ToolContent};

    #[test]
    fn test_server_info_json_roundtrip() {
        let info = ServerInfo {
            name: "test".to_string(),
            status: ServerStatus::Running,
            tools: vec![ToolInfo {
                name: "echo".to_string(),
                description: Some("Echo tool".to_string()),
                input_schema: serde_json::json!({"type": "object"}),
            }],
        };
        let json = serde_json::to_string(&info).unwrap();
        let parsed: ServerInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.name, "test");
        assert_eq!(parsed.tools.len(), 1);
    }

    #[test]
    fn test_tool_call_result_json_roundtrip() {
        let result = ToolCallResult {
            content: vec![ToolContent::Text("hello".to_string())],
            is_error: false,
        };
        let json = serde_json::to_string(&result).unwrap();
        let parsed: ToolCallResult = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.content.len(), 1);
        assert!(!parsed.is_error);
    }

    #[tokio::test]
    async fn test_create_mcp_service_returns_valid_state() {
        let state = create_mcp_service();
        let service = state.read().await;
        assert!(service.list_servers().is_empty());
        drop(service);
    }
}
