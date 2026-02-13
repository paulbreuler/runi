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

/// Hint describing what kind of canvas mutation occurred.
///
/// Sent alongside canvas state syncs so that SSE subscribers can react
/// to specific changes without diffing the full snapshot.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum CanvasEventHint {
    /// A new tab was opened.
    TabOpened {
        /// The ID of the opened tab.
        tab_id: String,
        /// The user-friendly label of the opened tab.
        label: String,
    },
    /// The active tab was switched.
    TabSwitched {
        /// The ID of the tab that is now active.
        tab_id: String,
        /// The user-friendly label of the switched-to tab.
        label: String,
    },
    /// A tab was closed.
    TabClosed {
        /// The ID of the closed tab.
        tab_id: String,
        /// The user-friendly label of the closed tab.
        label: String,
    },
    /// The layout within a context changed (e.g., template selection).
    LayoutChanged {
        /// The context/tab ID where the layout changed.
        context_id: String,
        /// The new layout identifier.
        layout_id: String,
    },
    /// Initial mount or non-specific full state refresh.
    StateSync,
}

impl CanvasEventHint {
    /// Return the SSE event type string for this hint.
    #[must_use]
    pub const fn event_type(&self) -> &'static str {
        match self {
            Self::TabOpened { .. } => "canvas:tab_opened",
            Self::TabSwitched { .. } => "canvas:tab_switched",
            Self::TabClosed { .. } => "canvas:tab_closed",
            Self::LayoutChanged { .. } => "canvas:layout_changed",
            Self::StateSync => "canvas:state_sync",
        }
    }
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

    // ========================================================================
    // CanvasEventHint tests
    // ========================================================================

    #[test]
    fn test_canvas_event_hint_tab_opened_serialization() {
        let hint = CanvasEventHint::TabOpened {
            tab_id: "tab-1".to_string(),
            label: "Test Tab".to_string(),
        };
        let json = serde_json::to_string(&hint).unwrap();
        assert!(json.contains(r#""kind":"tab_opened""#));
        assert!(json.contains(r#""tab_id":"tab-1""#));
        assert!(json.contains(r#""label":"Test Tab""#));
    }

    #[test]
    fn test_canvas_event_hint_tab_switched_serialization() {
        let hint = CanvasEventHint::TabSwitched {
            tab_id: "tab-2".to_string(),
            label: "Switched Tab".to_string(),
        };
        let json = serde_json::to_string(&hint).unwrap();
        assert!(json.contains(r#""kind":"tab_switched""#));
        assert!(json.contains(r#""tab_id":"tab-2""#));
        assert!(json.contains(r#""label":"Switched Tab""#));
    }

    #[test]
    fn test_canvas_event_hint_tab_closed_serialization() {
        let hint = CanvasEventHint::TabClosed {
            tab_id: "tab-3".to_string(),
            label: "Closed Tab".to_string(),
        };
        let json = serde_json::to_string(&hint).unwrap();
        assert!(json.contains(r#""kind":"tab_closed""#));
        assert!(json.contains(r#""label":"Closed Tab""#));
    }

    #[test]
    fn test_canvas_event_hint_layout_changed_serialization() {
        let hint = CanvasEventHint::LayoutChanged {
            context_id: "ctx-1".to_string(),
            layout_id: "layout-a".to_string(),
        };
        let json = serde_json::to_string(&hint).unwrap();
        assert!(json.contains(r#""kind":"layout_changed""#));
        assert!(json.contains(r#""context_id":"ctx-1""#));
        assert!(json.contains(r#""layout_id":"layout-a""#));
    }

    #[test]
    fn test_canvas_event_hint_state_sync_serialization() {
        let hint = CanvasEventHint::StateSync;
        let json = serde_json::to_string(&hint).unwrap();
        assert_eq!(json, r#"{"kind":"state_sync"}"#);
    }

    #[test]
    fn test_canvas_event_hint_deserialization() {
        let json = r#"{"kind":"tab_opened","tab_id":"tab-42","label":"Test"}"#;
        let hint: CanvasEventHint = serde_json::from_str(json).unwrap();
        assert_eq!(
            hint,
            CanvasEventHint::TabOpened {
                tab_id: "tab-42".to_string(),
                label: "Test".to_string(),
            }
        );
    }

    #[test]
    fn test_canvas_event_hint_state_sync_deserialization() {
        let json = r#"{"kind":"state_sync"}"#;
        let hint: CanvasEventHint = serde_json::from_str(json).unwrap();
        assert_eq!(hint, CanvasEventHint::StateSync);
    }

    #[test]
    fn test_canvas_event_hint_event_type_mapping() {
        assert_eq!(
            CanvasEventHint::TabOpened {
                tab_id: String::new(),
                label: String::new(),
            }
            .event_type(),
            "canvas:tab_opened"
        );
        assert_eq!(
            CanvasEventHint::TabSwitched {
                tab_id: String::new(),
                label: String::new(),
            }
            .event_type(),
            "canvas:tab_switched"
        );
        assert_eq!(
            CanvasEventHint::TabClosed {
                tab_id: String::new(),
                label: String::new(),
            }
            .event_type(),
            "canvas:tab_closed"
        );
        assert_eq!(
            CanvasEventHint::LayoutChanged {
                context_id: String::new(),
                layout_id: String::new()
            }
            .event_type(),
            "canvas:layout_changed"
        );
        assert_eq!(CanvasEventHint::StateSync.event_type(), "canvas:state_sync");
    }
}
