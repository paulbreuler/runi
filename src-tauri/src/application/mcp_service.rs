// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP service — orchestrates server registry and lifecycle management.
//!
//! Tracks multiple MCP servers, their connection states, and cached tool lists.

use crate::domain::mcp::config::{McpServerConfig, load_mcp_servers_config};
use crate::domain::mcp::types::{ServerInfo, ServerStatus, ToolCallResult, ToolInfo};
use crate::infrastructure::mcp::client::McpClient;
use std::collections::HashMap;
use std::path::Path;

/// Entry in the server registry.
struct ServerEntry {
    config: McpServerConfig,
    status: ServerStatus,
    client: Option<McpClient>,
    cached_tools: Vec<ToolInfo>,
}

/// MCP service managing multiple MCP server connections.
pub struct McpService {
    servers: HashMap<String, ServerEntry>,
}

impl McpService {
    /// Create a new empty service with no servers registered.
    #[must_use]
    pub fn new() -> Self {
        Self {
            servers: HashMap::new(),
        }
    }

    /// Load server configurations from a config directory.
    ///
    /// Registers all servers from the config file as `Stopped`.
    /// Replaces any previously loaded configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the config file cannot be read or parsed.
    pub async fn load_config(&mut self, config_dir: &Path) -> Result<(), String> {
        let config = load_mcp_servers_config(config_dir).await?;
        self.servers.clear();
        for server_config in config.servers {
            let name = server_config.name.clone();
            self.servers.insert(
                name,
                ServerEntry {
                    config: server_config,
                    status: ServerStatus::Stopped,
                    client: None,
                    cached_tools: Vec::new(),
                },
            );
        }
        Ok(())
    }

    /// List all registered servers with their current status and tools.
    #[must_use]
    pub fn list_servers(&self) -> Vec<ServerInfo> {
        self.servers
            .values()
            .map(|entry| ServerInfo {
                name: entry.config.name.clone(),
                status: entry.status.clone(),
                tools: entry.cached_tools.clone(),
            })
            .collect()
    }

    /// Start an MCP server by name.
    ///
    /// Spawns the child process, performs the MCP handshake, and discovers tools.
    ///
    /// # Errors
    ///
    /// Returns an error if the server is unknown, already running, or fails to start.
    pub async fn start_server(&mut self, name: &str) -> Result<(), String> {
        let entry = self
            .servers
            .get_mut(name)
            .ok_or_else(|| format!("Unknown MCP server: '{name}'"))?;

        if entry.status == ServerStatus::Running {
            return Err(format!("MCP server '{name}' is already running"));
        }

        entry.status = ServerStatus::Starting;

        match McpClient::connect(&entry.config).await {
            Ok(client) => {
                // Discover tools immediately after connecting
                let tools = match client.list_tools().await {
                    Ok(tools) => tools,
                    Err(e) => {
                        tracing::warn!("Connected to '{name}' but failed to list tools: {e}");
                        Vec::new()
                    }
                };
                entry.client = Some(client);
                entry.cached_tools = tools;
                entry.status = ServerStatus::Running;
                Ok(())
            }
            Err(e) => {
                entry.status = ServerStatus::Error(e.clone());
                Err(e)
            }
        }
    }

    /// Stop an MCP server by name.
    ///
    /// Gracefully disconnects and cleans up.
    ///
    /// # Errors
    ///
    /// Returns an error if the server is unknown or not running.
    pub async fn stop_server(&mut self, name: &str) -> Result<(), String> {
        let entry = self
            .servers
            .get_mut(name)
            .ok_or_else(|| format!("Unknown MCP server: '{name}'"))?;

        if entry.status != ServerStatus::Running {
            return Err(format!("MCP server '{name}' is not running"));
        }

        entry.status = ServerStatus::Stopping;

        if let Some(mut client) = entry.client.take() {
            if let Err(e) = client.disconnect().await {
                tracing::warn!("Error disconnecting from '{name}': {e}");
            }
        }

        entry.cached_tools.clear();
        entry.status = ServerStatus::Stopped;
        Ok(())
    }

    /// Get the cached tools for a running server.
    ///
    /// # Errors
    ///
    /// Returns an error if the server is unknown or not running.
    pub fn get_server_tools(&self, name: &str) -> Result<Vec<ToolInfo>, String> {
        let entry = self
            .servers
            .get(name)
            .ok_or_else(|| format!("Unknown MCP server: '{name}'"))?;

        if entry.status != ServerStatus::Running {
            return Err(format!("MCP server '{name}' is not running"));
        }

        Ok(entry.cached_tools.clone())
    }

    /// Get info for a single server by name.
    ///
    /// # Errors
    ///
    /// Returns an error if the server is unknown.
    pub fn get_server_info(&self, name: &str) -> Result<ServerInfo, String> {
        let entry = self
            .servers
            .get(name)
            .ok_or_else(|| format!("Unknown MCP server: '{name}'"))?;

        Ok(ServerInfo {
            name: entry.config.name.clone(),
            status: entry.status.clone(),
            tools: entry.cached_tools.clone(),
        })
    }

    /// Call a tool on a running MCP server.
    ///
    /// # Errors
    ///
    /// Returns an error if the server is unknown, not running, or the tool call fails.
    pub async fn call_tool(
        &self,
        server_name: &str,
        tool_name: &str,
        arguments: serde_json::Value,
    ) -> Result<ToolCallResult, String> {
        let entry = self
            .servers
            .get(server_name)
            .ok_or_else(|| format!("Unknown MCP server: '{server_name}'"))?;

        if entry.status != ServerStatus::Running {
            return Err(format!("MCP server '{server_name}' is not running"));
        }

        let client = entry
            .client
            .as_ref()
            .ok_or_else(|| format!("MCP server '{server_name}' has no active client"))?;

        client.call_tool(tool_name, arguments).await
    }

    /// Shut down all running servers. Called during app cleanup.
    #[allow(dead_code)] // Available for future app shutdown hook
    pub async fn shutdown_all(&mut self) {
        let names: Vec<String> = self
            .servers
            .iter()
            .filter(|(_, entry)| entry.status == ServerStatus::Running)
            .map(|(name, _)| name.clone())
            .collect();

        for name in names {
            if let Err(e) = self.stop_server(&name).await {
                tracing::warn!("Error shutting down MCP server '{name}': {e}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn make_test_config_dir(yaml: &str) -> TempDir {
        let dir = TempDir::new().unwrap();
        std::fs::write(dir.path().join("mcp-servers.yaml"), yaml).unwrap();
        dir
    }

    #[test]
    fn test_new_service_is_empty() {
        let service = McpService::new();
        assert!(service.list_servers().is_empty());
    }

    #[tokio::test]
    async fn test_load_config_populates_registry() {
        let dir = make_test_config_dir(
            r"
servers:
  - name: echo
    command: echo
  - name: cat
    command: cat
",
        );
        let mut service = McpService::new();
        service.load_config(dir.path()).await.unwrap();

        let servers = service.list_servers();
        assert_eq!(servers.len(), 2);
        assert!(servers.iter().all(|s| s.status == ServerStatus::Stopped));
    }

    #[tokio::test]
    async fn test_load_config_replaces_previous() {
        let dir1 = make_test_config_dir(
            r"
servers:
  - name: old
    command: echo
",
        );
        let dir2 = make_test_config_dir(
            r"
servers:
  - name: new
    command: echo
",
        );
        let mut service = McpService::new();
        service.load_config(dir1.path()).await.unwrap();
        assert_eq!(service.list_servers().len(), 1);
        assert_eq!(service.list_servers()[0].name, "old");

        service.load_config(dir2.path()).await.unwrap();
        assert_eq!(service.list_servers().len(), 1);
        assert_eq!(service.list_servers()[0].name, "new");
    }

    #[tokio::test]
    async fn test_start_unknown_server_returns_error() {
        let mut service = McpService::new();
        let result = service.start_server("nonexistent").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown"));
    }

    #[tokio::test]
    async fn test_stop_unknown_server_returns_error() {
        let mut service = McpService::new();
        let result = service.stop_server("nonexistent").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown"));
    }

    #[tokio::test]
    async fn test_stop_stopped_server_returns_error() {
        let dir = make_test_config_dir(
            r"
servers:
  - name: stopped
    command: echo
",
        );
        let mut service = McpService::new();
        service.load_config(dir.path()).await.unwrap();

        let result = service.stop_server("stopped").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not running"));
    }

    #[tokio::test]
    async fn test_get_tools_stopped_server_returns_error() {
        let dir = make_test_config_dir(
            r"
servers:
  - name: stopped
    command: echo
",
        );
        let mut service = McpService::new();
        service.load_config(dir.path()).await.unwrap();

        let result = service.get_server_tools("stopped");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not running"));
    }

    #[tokio::test]
    async fn test_get_tools_unknown_server_returns_error() {
        let service = McpService::new();
        let result = service.get_server_tools("nope");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_call_tool_unknown_server_returns_error() {
        let service = McpService::new();
        let result = service
            .call_tool("nope", "echo", serde_json::json!({}))
            .await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown"));
    }

    #[tokio::test]
    async fn test_call_tool_stopped_server_returns_error() {
        let dir = make_test_config_dir(
            r"
servers:
  - name: stopped
    command: echo
",
        );
        let mut service = McpService::new();
        service.load_config(dir.path()).await.unwrap();

        let result = service
            .call_tool("stopped", "echo", serde_json::json!({}))
            .await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not running"));
    }

    #[tokio::test]
    async fn test_get_server_info() {
        let dir = make_test_config_dir(
            r"
servers:
  - name: test
    command: echo
",
        );
        let mut service = McpService::new();
        service.load_config(dir.path()).await.unwrap();

        let info = service.get_server_info("test").unwrap();
        assert_eq!(info.name, "test");
        assert_eq!(info.status, ServerStatus::Stopped);
        assert!(info.tools.is_empty());
    }

    #[tokio::test]
    async fn test_get_server_info_unknown_returns_error() {
        let service = McpService::new();
        assert!(service.get_server_info("nope").is_err());
    }

    /// Full lifecycle integration test using @modelcontextprotocol/server-everything.
    ///
    /// Requires `npx` to be available. Marked `#[ignore]` for CI since it
    /// requires npm/Node.js and network access.
    #[tokio::test]
    #[ignore = "requires npx and network access"]
    async fn test_full_lifecycle_with_everything_server() {
        use crate::domain::mcp::types::ToolContent;

        let dir = make_test_config_dir(
            r"
servers:
  - name: everything
    command: npx
    args:
      - '-y'
      - '@modelcontextprotocol/server-everything'
    env: {}
    enabled: true
",
        );

        let mut service = McpService::new();

        // Load config
        service.load_config(dir.path()).await.unwrap();
        let servers = service.list_servers();
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].status, ServerStatus::Stopped);

        // Start server
        service.start_server("everything").await.unwrap();
        let info = service.get_server_info("everything").unwrap();
        assert_eq!(info.status, ServerStatus::Running);
        assert!(!info.tools.is_empty(), "Server should expose tools");

        // List tools
        let tools = service.get_server_tools("everything").unwrap();
        assert!(!tools.is_empty());
        let tool_names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        assert!(
            tool_names.contains(&"echo"),
            "Should have echo tool, got: {tool_names:?}"
        );

        // Call echo tool
        let result = service
            .call_tool(
                "everything",
                "echo",
                serde_json::json!({"message": "hello from runi"}),
            )
            .await
            .unwrap();
        assert!(!result.is_error);
        assert!(!result.content.is_empty());
        match &result.content[0] {
            ToolContent::Text(text) => {
                assert!(
                    text.contains("hello from runi"),
                    "Expected echo response, got: {text}"
                );
            }
        }

        // Error case: start already-running server
        let err = service.start_server("everything").await;
        assert!(err.is_err());
        assert!(err.unwrap_err().contains("already running"));

        // Error case: call unknown tool
        let err = service
            .call_tool("everything", "nonexistent_tool_xyz", serde_json::json!({}))
            .await;
        assert!(err.is_err());

        // Stop server
        service.stop_server("everything").await.unwrap();
        let info = service.get_server_info("everything").unwrap();
        assert_eq!(info.status, ServerStatus::Stopped);
        assert!(info.tools.is_empty());

        // Error case: stop already-stopped server
        let err = service.stop_server("everything").await;
        assert!(err.is_err());
        assert!(err.unwrap_err().contains("not running"));
    }
}
