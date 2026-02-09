// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP server configuration loading and validation.
//!
//! Currently unused — preserved for future MCP client configuration support.

#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

const MCP_SERVERS_FILE_NAME: &str = "mcp-servers.yaml";

/// Configuration for a single MCP server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    /// Unique name identifying this server.
    pub name: String,
    /// Command to execute (e.g. "npx", "python").
    pub command: String,
    /// Arguments to pass to the command.
    #[serde(default)]
    pub args: Vec<String>,
    /// Environment variables to set for the process.
    #[serde(default)]
    pub env: HashMap<String, String>,
    /// Whether this server is enabled.
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

const fn default_enabled() -> bool {
    true
}

/// Top-level MCP servers configuration file.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct McpServersConfig {
    /// List of configured MCP servers.
    #[serde(default)]
    pub servers: Vec<McpServerConfig>,
}

/// Validate an MCP servers configuration.
///
/// # Errors
///
/// Returns an error if any server has an empty name or command, or if
/// duplicate server names exist.
pub fn validate_config(config: &McpServersConfig) -> Result<(), String> {
    let mut seen_names = std::collections::HashSet::new();
    for server in &config.servers {
        if server.name.trim().is_empty() {
            return Err("MCP server config has empty name".to_string());
        }
        if server.command.trim().is_empty() {
            return Err(format!("MCP server '{}' has empty command", server.name));
        }
        if !seen_names.insert(&server.name) {
            return Err(format!("Duplicate MCP server name: '{}'", server.name));
        }
    }
    Ok(())
}

/// Load MCP servers configuration from a directory.
///
/// Returns an empty config if the file does not exist.
///
/// # Errors
///
/// Returns an error if the file exists but cannot be read or parsed,
/// or if validation fails.
pub async fn load_mcp_servers_config(config_dir: &Path) -> Result<McpServersConfig, String> {
    let path = config_dir.join(MCP_SERVERS_FILE_NAME);
    if !path.exists() {
        return Ok(McpServersConfig::default());
    }

    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read MCP servers config {}: {e}", path.display()))?;

    let config: McpServersConfig =
        serde_yml::from_str(&content).map_err(|e| format!("Invalid MCP servers YAML: {e}"))?;

    validate_config(&config)?;
    Ok(config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_single_server_deserializes() {
        let yaml = r"
servers:
  - name: test-server
    command: npx
    args:
      - '-y'
      - '@modelcontextprotocol/server-everything'
    env:
      FOO: bar
    enabled: true
";
        let config: McpServersConfig = serde_yml::from_str(yaml).unwrap();
        assert_eq!(config.servers.len(), 1);
        let server = &config.servers[0];
        assert_eq!(server.name, "test-server");
        assert_eq!(server.command, "npx");
        assert_eq!(
            server.args,
            vec!["-y", "@modelcontextprotocol/server-everything"]
        );
        assert_eq!(server.env.get("FOO").unwrap(), "bar");
        assert!(server.enabled);
    }

    #[test]
    fn test_multiple_servers_parse() {
        let yaml = r"
servers:
  - name: server-a
    command: npx
    args: ['-y', 'pkg-a']
  - name: server-b
    command: python
    args: ['-m', 'mcp_server']
";
        let config: McpServersConfig = serde_yml::from_str(yaml).unwrap();
        assert_eq!(config.servers.len(), 2);
        assert_eq!(config.servers[0].name, "server-a");
        assert_eq!(config.servers[1].name, "server-b");
    }

    #[test]
    fn test_defaults_applied() {
        let yaml = r"
servers:
  - name: minimal
    command: echo
";
        let config: McpServersConfig = serde_yml::from_str(yaml).unwrap();
        let server = &config.servers[0];
        assert!(server.args.is_empty());
        assert!(server.env.is_empty());
        assert!(server.enabled);
    }

    #[test]
    fn test_validation_rejects_empty_name() {
        let config = McpServersConfig {
            servers: vec![McpServerConfig {
                name: String::new(),
                command: "echo".to_string(),
                args: vec![],
                env: HashMap::new(),
                enabled: true,
            }],
        };
        let result = validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty name"));
    }

    #[test]
    fn test_validation_rejects_whitespace_name() {
        let config = McpServersConfig {
            servers: vec![McpServerConfig {
                name: "   ".to_string(),
                command: "echo".to_string(),
                args: vec![],
                env: HashMap::new(),
                enabled: true,
            }],
        };
        assert!(validate_config(&config).is_err());
    }

    #[test]
    fn test_validation_rejects_empty_command() {
        let config = McpServersConfig {
            servers: vec![McpServerConfig {
                name: "test".to_string(),
                command: String::new(),
                args: vec![],
                env: HashMap::new(),
                enabled: true,
            }],
        };
        let result = validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty command"));
    }

    #[test]
    fn test_validation_rejects_duplicate_names() {
        let config = McpServersConfig {
            servers: vec![
                McpServerConfig {
                    name: "dup".to_string(),
                    command: "echo".to_string(),
                    args: vec![],
                    env: HashMap::new(),
                    enabled: true,
                },
                McpServerConfig {
                    name: "dup".to_string(),
                    command: "echo".to_string(),
                    args: vec![],
                    env: HashMap::new(),
                    enabled: true,
                },
            ],
        };
        let result = validate_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Duplicate"));
    }

    #[test]
    fn test_validation_passes_valid_config() {
        let config = McpServersConfig {
            servers: vec![
                McpServerConfig {
                    name: "a".to_string(),
                    command: "echo".to_string(),
                    args: vec![],
                    env: HashMap::new(),
                    enabled: true,
                },
                McpServerConfig {
                    name: "b".to_string(),
                    command: "echo".to_string(),
                    args: vec![],
                    env: HashMap::new(),
                    enabled: false,
                },
            ],
        };
        assert!(validate_config(&config).is_ok());
    }

    #[tokio::test]
    async fn test_load_from_file() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("mcp-servers.yaml");
        tokio::fs::write(
            &path,
            r"
servers:
  - name: echo
    command: echo
    args: ['hello']
",
        )
        .await
        .unwrap();

        let config = load_mcp_servers_config(dir.path()).await.unwrap();
        assert_eq!(config.servers.len(), 1);
        assert_eq!(config.servers[0].name, "echo");
    }

    #[tokio::test]
    async fn test_load_returns_empty_when_missing() {
        let dir = TempDir::new().unwrap();
        let config = load_mcp_servers_config(dir.path()).await.unwrap();
        assert!(config.servers.is_empty());
    }

    #[tokio::test]
    async fn test_load_returns_error_for_malformed_yaml() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("mcp-servers.yaml");
        tokio::fs::write(&path, "servers: [invalid yaml structure")
            .await
            .unwrap();

        let result = load_mcp_servers_config(dir.path()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_load_validates_after_parse() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("mcp-servers.yaml");
        tokio::fs::write(
            &path,
            r"
servers:
  - name: ''
    command: echo
",
        )
        .await
        .unwrap();

        let result = load_mcp_servers_config(dir.path()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty name"));
    }
}
