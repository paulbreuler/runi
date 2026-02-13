// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Canvas state snapshot types for MCP integration.
//!
//! The frontend pushes canvas snapshots to the backend via a Tauri command.
//! MCP tools then read from this shared state to understand the user's current context
//! without needing direct access to frontend state.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Snapshot of the current canvas state.
///
/// Pushed from the frontend whenever significant canvas state changes occur
/// (tab switches, tab opens/closes, template selection). MCP tools read from
/// this snapshot to understand what the user is currently working on.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct CanvasStateSnapshot {
    /// List of all open context tabs.
    pub tabs: Vec<TabSummary>,
    /// Index of the currently active tab (if any).
    pub active_tab_index: Option<usize>,
    /// List of available templates.
    pub templates: Vec<TemplateSummary>,
}

impl CanvasStateSnapshot {
    /// Create a new empty canvas state snapshot.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active_tab_index: None,
            templates: Vec::new(),
        }
    }

    /// Get the currently active tab, if any.
    #[must_use]
    pub fn active_tab(&self) -> Option<&TabSummary> {
        self.active_tab_index.and_then(|idx| self.tabs.get(idx))
    }
}

impl Default for CanvasStateSnapshot {
    fn default() -> Self {
        Self::new()
    }
}

/// Summary of a context tab.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TabSummary {
    /// Unique tab identifier.
    pub id: String,
    /// Human-readable tab label.
    pub label: String,
    /// Tab type discriminator.
    pub tab_type: TabType,
}

/// Type of context tab.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum TabType {
    /// Template tab (`OpenAPI` spec, workflow, etc).
    Template,
    /// Request tab (manual HTTP request).
    Request,
}

/// Summary of an available template.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct TemplateSummary {
    /// Unique template identifier.
    pub id: String,
    /// Human-readable template name.
    pub name: String,
    /// Template type (`OpenAPI`, workflow, etc).
    pub template_type: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_canvas_state_snapshot_new() {
        let snapshot = CanvasStateSnapshot::new();
        assert!(snapshot.tabs.is_empty());
        assert!(snapshot.active_tab_index.is_none());
        assert!(snapshot.templates.is_empty());
    }

    #[test]
    fn test_canvas_state_snapshot_default() {
        let snapshot = CanvasStateSnapshot::default();
        assert!(snapshot.tabs.is_empty());
        assert!(snapshot.active_tab_index.is_none());
    }

    #[test]
    fn test_active_tab_none_when_no_tabs() {
        let snapshot = CanvasStateSnapshot::new();
        assert!(snapshot.active_tab().is_none());
    }

    #[test]
    fn test_active_tab_none_when_no_active_index() {
        let snapshot = CanvasStateSnapshot {
            tabs: vec![TabSummary {
                id: "tab-1".to_string(),
                label: "Request".to_string(),
                tab_type: TabType::Request,
            }],
            active_tab_index: None,
            templates: vec![],
        };
        assert!(snapshot.active_tab().is_none());
    }

    #[test]
    fn test_active_tab_returns_correct_tab() {
        let tab1 = TabSummary {
            id: "tab-1".to_string(),
            label: "Request 1".to_string(),
            tab_type: TabType::Request,
        };
        let tab2 = TabSummary {
            id: "tab-2".to_string(),
            label: "Template".to_string(),
            tab_type: TabType::Template,
        };
        let expected_tab2 = tab2.clone();
        let snapshot = CanvasStateSnapshot {
            tabs: vec![tab1, tab2],
            active_tab_index: Some(1),
            templates: vec![],
        };
        assert_eq!(snapshot.active_tab(), Some(&expected_tab2));
    }

    #[test]
    fn test_active_tab_none_when_index_out_of_bounds() {
        let snapshot = CanvasStateSnapshot {
            tabs: vec![TabSummary {
                id: "tab-1".to_string(),
                label: "Request".to_string(),
                tab_type: TabType::Request,
            }],
            active_tab_index: Some(99),
            templates: vec![],
        };
        assert!(snapshot.active_tab().is_none());
    }

    #[test]
    fn test_tab_summary_serialization() {
        let tab = TabSummary {
            id: "tab-123".to_string(),
            label: "GET /users".to_string(),
            tab_type: TabType::Request,
        };
        let json = serde_json::to_string(&tab).unwrap();
        assert!(json.contains("\"id\":\"tab-123\""));
        assert!(json.contains("\"label\":\"GET /users\""));
        assert!(json.contains("\"tabType\":\"request\""));
    }

    #[test]
    fn test_template_summary_serialization() {
        let template = TemplateSummary {
            id: "tpl-456".to_string(),
            name: "Petstore API".to_string(),
            template_type: "openapi".to_string(),
        };
        let json = serde_json::to_string(&template).unwrap();
        assert!(json.contains("\"id\":\"tpl-456\""));
        assert!(json.contains("\"name\":\"Petstore API\""));
        assert!(json.contains("\"templateType\":\"openapi\""));
    }

    #[test]
    fn test_canvas_state_snapshot_serialization() {
        let snapshot = CanvasStateSnapshot {
            tabs: vec![
                TabSummary {
                    id: "tab-1".to_string(),
                    label: "Request".to_string(),
                    tab_type: TabType::Request,
                },
                TabSummary {
                    id: "tab-2".to_string(),
                    label: "Template".to_string(),
                    tab_type: TabType::Template,
                },
            ],
            active_tab_index: Some(0),
            templates: vec![TemplateSummary {
                id: "tpl-1".to_string(),
                name: "Test API".to_string(),
                template_type: "openapi".to_string(),
            }],
        };
        let json = serde_json::to_string(&snapshot).unwrap();
        assert!(json.contains("\"tabs\""));
        assert!(json.contains("\"activeTabIndex\":0"));
        assert!(json.contains("\"templates\""));
    }

    #[test]
    fn test_canvas_state_snapshot_deserialization() {
        let json = r#"{
            "tabs": [
                {"id": "tab-1", "label": "Request", "tabType": "request"}
            ],
            "activeTabIndex": 0,
            "templates": []
        }"#;
        let snapshot: CanvasStateSnapshot = serde_json::from_str(json).unwrap();
        assert_eq!(snapshot.tabs.len(), 1);
        assert_eq!(snapshot.active_tab_index, Some(0));
        assert_eq!(snapshot.tabs[0].id, "tab-1");
        assert_eq!(snapshot.tabs[0].tab_type, TabType::Request);
    }
}
