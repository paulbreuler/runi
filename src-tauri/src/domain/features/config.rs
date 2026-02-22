// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Feature flag configuration loading and merge logic.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const RUNI_CONFIG_DIR_NAME: &str = ".runi";
const FLAGS_FILE_NAME: &str = "flags.toml";
const FLAGS_LOCAL_FILE_NAME: &str = "flags.local.toml";

/// Top-level feature flag config shape.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FeatureFlagsConfig {
    /// Optional schema reference (ignored by runtime).
    #[serde(rename = "$schema", skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    /// HTTP layer flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub http: Option<HttpFlagsConfig>,
    /// Canvas layer flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canvas: Option<CanvasFlagsConfig>,
    /// Comprehension layer flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comprehension: Option<ComprehensionFlagsConfig>,
    /// AI layer flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai: Option<AiFlagsConfig>,
    /// Debug layer flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug: Option<DebugFlagsConfig>,
}

/// HTTP layer flags.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HttpFlagsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collections_enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collections_saving: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub import_bruno: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub import_postman: Option<bool>,
    #[serde(rename = "importOpenAPI", skip_serializing_if = "Option::is_none")]
    pub import_open_api: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_curl: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_python: Option<bool>,
    #[serde(rename = "exportJavaScript", skip_serializing_if = "Option::is_none")]
    pub export_javascript: Option<bool>,
}

/// Canvas layer flags.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CanvasFlagsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimap: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_lines: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub snap_to_grid: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_bar: Option<bool>,
}

/// Comprehension layer flags.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ComprehensionFlagsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub drift_detection: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_verification: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantic_links: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temporal_awareness: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spec_binding: Option<bool>,
}

/// AI layer flags.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AiFlagsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ollama_integration: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub natural_language_commands: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mcp_generation: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agentic_testing: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_suggested_integrations: Option<bool>,
}

/// Debug layer flags.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DebugFlagsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verbose_logging: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance_overlay: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mock_responses: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub force_all_experimental: Option<bool>,
}

/// Return the `~/.runi` config directory path.
///
/// # Errors
///
/// Returns an error if the user's home directory is unavailable.
pub fn get_config_dir() -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    Ok(home_dir.join(RUNI_CONFIG_DIR_NAME))
}

/// Load feature flags from `flags.toml` and `flags.local.toml` in the config directory.
///
/// # Errors
///
/// Returns an error if a TOML file exists but cannot be read or parsed.
pub async fn load_feature_flags() -> Result<serde_json::Value, String> {
    let config_dir = get_config_dir()?;
    load_feature_flags_from_dir(&config_dir).await
}

/// Load feature flags from a specified directory.
///
/// # Errors
///
/// Returns an error if a TOML file exists but cannot be read or parsed.
pub async fn load_feature_flags_from_dir(config_dir: &Path) -> Result<serde_json::Value, String> {
    let flags_path = config_dir.join(FLAGS_FILE_NAME);
    let local_path = config_dir.join(FLAGS_LOCAL_FILE_NAME);

    let mut config = FeatureFlagsConfig::default();

    if let Some(team_config) = read_config_if_exists(&flags_path).await? {
        config = merge_configs(config, team_config);
    }

    if let Some(local_config) = read_config_if_exists(&local_path).await? {
        config = merge_configs(config, local_config);
    }

    serde_json::to_value(config).map_err(|e| format!("Failed to serialize feature flags: {e}"))
}

async fn read_config_if_exists(path: &Path) -> Result<Option<FeatureFlagsConfig>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("Failed to read feature flags file {}: {e}", path.display()))?;

    let config: FeatureFlagsConfig =
        toml::from_str(&content).map_err(|e| format!("Invalid TOML: {e}"))?;

    Ok(Some(config))
}

/// Merge feature flag configurations with overlay precedence.
pub fn merge_configs(base: FeatureFlagsConfig, overlay: FeatureFlagsConfig) -> FeatureFlagsConfig {
    FeatureFlagsConfig {
        schema: overlay.schema.or(base.schema),
        http: merge_http(base.http, overlay.http),
        canvas: merge_canvas(base.canvas, overlay.canvas),
        comprehension: merge_comprehension(base.comprehension, overlay.comprehension),
        ai: merge_ai(base.ai, overlay.ai),
        debug: merge_debug(base.debug, overlay.debug),
    }
}

fn merge_http(
    base: Option<HttpFlagsConfig>,
    overlay: Option<HttpFlagsConfig>,
) -> Option<HttpFlagsConfig> {
    match (base, overlay) {
        (Some(base), Some(overlay)) => Some(HttpFlagsConfig {
            collections_enabled: overlay.collections_enabled.or(base.collections_enabled),
            collections_saving: overlay.collections_saving.or(base.collections_saving),
            import_bruno: overlay.import_bruno.or(base.import_bruno),
            import_postman: overlay.import_postman.or(base.import_postman),
            import_open_api: overlay.import_open_api.or(base.import_open_api),
            export_curl: overlay.export_curl.or(base.export_curl),
            export_python: overlay.export_python.or(base.export_python),
            export_javascript: overlay.export_javascript.or(base.export_javascript),
        }),
        (base, overlay) => overlay.or(base),
    }
}

fn merge_canvas(
    base: Option<CanvasFlagsConfig>,
    overlay: Option<CanvasFlagsConfig>,
) -> Option<CanvasFlagsConfig> {
    match (base, overlay) {
        (Some(base), Some(overlay)) => Some(CanvasFlagsConfig {
            enabled: overlay.enabled.or(base.enabled),
            minimap: overlay.minimap.or(base.minimap),
            connection_lines: overlay.connection_lines.or(base.connection_lines),
            snap_to_grid: overlay.snap_to_grid.or(base.snap_to_grid),
            command_bar: overlay.command_bar.or(base.command_bar),
        }),
        (base, overlay) => overlay.or(base),
    }
}

fn merge_comprehension(
    base: Option<ComprehensionFlagsConfig>,
    overlay: Option<ComprehensionFlagsConfig>,
) -> Option<ComprehensionFlagsConfig> {
    match (base, overlay) {
        (Some(base), Some(overlay)) => Some(ComprehensionFlagsConfig {
            drift_detection: overlay.drift_detection.or(base.drift_detection),
            ai_verification: overlay.ai_verification.or(base.ai_verification),
            semantic_links: overlay.semantic_links.or(base.semantic_links),
            temporal_awareness: overlay.temporal_awareness.or(base.temporal_awareness),
            spec_binding: overlay.spec_binding.or(base.spec_binding),
        }),
        (base, overlay) => overlay.or(base),
    }
}

fn merge_ai(base: Option<AiFlagsConfig>, overlay: Option<AiFlagsConfig>) -> Option<AiFlagsConfig> {
    match (base, overlay) {
        (Some(base), Some(overlay)) => Some(AiFlagsConfig {
            ollama_integration: overlay.ollama_integration.or(base.ollama_integration),
            natural_language_commands: overlay
                .natural_language_commands
                .or(base.natural_language_commands),
            mcp_generation: overlay.mcp_generation.or(base.mcp_generation),
            agentic_testing: overlay.agentic_testing.or(base.agentic_testing),
            ai_suggested_integrations: overlay
                .ai_suggested_integrations
                .or(base.ai_suggested_integrations),
        }),
        (base, overlay) => overlay.or(base),
    }
}

fn merge_debug(
    base: Option<DebugFlagsConfig>,
    overlay: Option<DebugFlagsConfig>,
) -> Option<DebugFlagsConfig> {
    match (base, overlay) {
        (Some(base), Some(overlay)) => Some(DebugFlagsConfig {
            verbose_logging: overlay.verbose_logging.or(base.verbose_logging),
            performance_overlay: overlay.performance_overlay.or(base.performance_overlay),
            mock_responses: overlay.mock_responses.or(base.mock_responses),
            force_all_experimental: overlay
                .force_all_experimental
                .or(base.force_all_experimental),
        }),
        (base, overlay) => overlay.or(base),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_config_parses_camel_case_fields() {
        let toml_str = r"
[http]
importBruno = true
exportJavaScript = false

[canvas]
connectionLines = true
";
        let parsed: FeatureFlagsConfig = toml::from_str(toml_str).unwrap();
        let http = parsed.http.unwrap();
        assert_eq!(http.import_bruno, Some(true));
        assert_eq!(http.export_javascript, Some(false));
        let canvas = parsed.canvas.unwrap();
        assert_eq!(canvas.connection_lines, Some(true));
    }

    #[test]
    fn test_config_handles_missing_optional_fields() {
        let toml_str = r"
[http]
importBruno = true
";
        let parsed: FeatureFlagsConfig = toml::from_str(toml_str).unwrap();
        let http = parsed.http.unwrap();
        assert_eq!(http.import_bruno, Some(true));
        assert_eq!(http.import_postman, None);
    }

    #[test]
    fn test_schema_field_is_optional() {
        let toml_str = r#"
"$schema" = "https://runi.dev/schema/flags/v1.json"

[http]
importBruno = true
"#;
        let parsed: FeatureFlagsConfig = toml::from_str(toml_str).unwrap();
        assert_eq!(
            parsed.schema.as_deref(),
            Some("https://runi.dev/schema/flags/v1.json")
        );
    }

    #[test]
    fn test_merge_configs_overrides_with_some_values() {
        let base = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(false),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let overlay = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(true),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let merged = merge_configs(base, overlay);
        assert_eq!(merged.http.unwrap().import_bruno, Some(true));
    }

    #[test]
    fn test_merge_configs_preserves_none_values() {
        let base = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(true),
                export_curl: None,
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let overlay = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: None,
                export_curl: Some(true),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let merged = merge_configs(base, overlay);
        let http = merged.http.unwrap();
        assert_eq!(http.import_bruno, Some(true));
        assert_eq!(http.export_curl, Some(true));
    }

    #[test]
    fn test_merge_configs_handles_nested_structs() {
        let base = FeatureFlagsConfig {
            canvas: Some(CanvasFlagsConfig {
                minimap: Some(true),
                ..CanvasFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let overlay = FeatureFlagsConfig {
            canvas: Some(CanvasFlagsConfig {
                command_bar: Some(true),
                ..CanvasFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let merged = merge_configs(base, overlay);
        let canvas = merged.canvas.unwrap();
        assert_eq!(canvas.minimap, Some(true));
        assert_eq!(canvas.command_bar, Some(true));
    }

    #[test]
    fn test_merge_configs_local_overrides_team() {
        let defaults = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(false),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let team = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(true),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let local = FeatureFlagsConfig {
            http: Some(HttpFlagsConfig {
                import_bruno: Some(false),
                ..HttpFlagsConfig::default()
            }),
            ..FeatureFlagsConfig::default()
        };
        let merged = merge_configs(merge_configs(defaults, team), local);
        assert_eq!(merged.http.unwrap().import_bruno, Some(false));
    }

    #[tokio::test]
    async fn test_load_feature_flags_reads_flags_toml() {
        let dir = TempDir::new().unwrap();
        let flags_path = dir.path().join(FLAGS_FILE_NAME);
        tokio::fs::write(&flags_path, "[http]\nimportBruno = true\n")
            .await
            .unwrap();

        let loaded = load_feature_flags_from_dir(dir.path()).await.unwrap();
        let http = loaded.get("http").unwrap();
        assert_eq!(
            http.get("importBruno").unwrap(),
            &serde_json::Value::Bool(true)
        );
    }

    #[tokio::test]
    async fn test_load_feature_flags_returns_empty_object_when_missing() {
        let dir = TempDir::new().unwrap();
        let loaded = load_feature_flags_from_dir(dir.path()).await.unwrap();
        assert_eq!(loaded, serde_json::json!({}));
    }

    #[tokio::test]
    async fn test_load_feature_flags_parses_valid_toml() {
        let dir = TempDir::new().unwrap();
        let flags_path = dir.path().join(FLAGS_FILE_NAME);
        tokio::fs::write(&flags_path, "[canvas]\nenabled = true\n")
            .await
            .unwrap();

        let loaded = load_feature_flags_from_dir(dir.path()).await.unwrap();
        let canvas = loaded.get("canvas").unwrap();
        assert_eq!(
            canvas.get("enabled").unwrap(),
            &serde_json::Value::Bool(true)
        );
    }

    #[tokio::test]
    async fn test_load_feature_flags_returns_error_for_invalid_toml() {
        let dir = TempDir::new().unwrap();
        let flags_path = dir.path().join(FLAGS_FILE_NAME);
        tokio::fs::write(&flags_path, "[http\ninvalid")
            .await
            .unwrap();

        let result = load_feature_flags_from_dir(dir.path()).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_config_ignores_unknown_fields() {
        let toml_str = r#"
[http]
importBruno = true
someCustomFlag = "custom"

[customSection]
anotherFlag = 123
"#;

        let parsed: FeatureFlagsConfig = toml::from_str(toml_str).unwrap();
        let http = parsed.http.unwrap();
        // Known field is still parsed correctly.
        assert_eq!(http.import_bruno, Some(true));
        // Presence of unknown fields/sections does not cause deserialization to fail.
    }

    #[test]
    fn test_get_config_dir_returns_expected_path() {
        let dir = get_config_dir().unwrap();
        assert!(dir.ends_with(RUNI_CONFIG_DIR_NAME));
    }
}
