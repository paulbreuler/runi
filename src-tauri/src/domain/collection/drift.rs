//! Drift detection types and diff engine for spec refresh.
//!
//! Compares two `ParsedSpec` instances to detect structural changes:
//! added, removed, or modified operations keyed by `(method, path)`.
//!
//! IMPORTANT: This module must have ZERO infrastructure dependencies.
//! Pure functions only — no I/O, no side effects.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::spec_port::ParsedSpec;

/// Severity of a detected drift.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)] // Exported via ts-rs for frontend; not yet consumed in Rust
pub enum DriftSeverity {
    /// Informational — cosmetic or non-functional change.
    Info,
    /// Warning — structural change that may affect consumers.
    Warning,
    /// Breaking — removal or incompatible change.
    Breaking,
}

/// Type of action that can resolve a drift.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum DriftActionType {
    /// Update the spec to match the current reality.
    UpdateSpec,
    /// Fix the request to match the spec.
    FixRequest,
    /// Suppress this drift — mark as acceptable.
    Ignore,
}

/// A suggested action to resolve a detected drift.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)] // Exported via ts-rs for frontend; not yet consumed in Rust
pub struct DriftSuggestedAction {
    /// The type of resolution action.
    pub action_type: DriftActionType,
    /// Human-readable label for the action button.
    pub label: String,
    /// Description of what this action will do.
    pub description: String,
}

/// Result of executing a drift resolution action.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct DriftActionResult {
    /// Whether the action was applied successfully.
    pub success: bool,
    /// The action that was executed.
    pub action_type: DriftActionType,
    /// Human-readable message describing the outcome.
    pub message: String,
}

/// Suggest resolution actions for an added operation.
#[must_use]
#[allow(dead_code)] // Exported via ts-rs types; called from tests and future MCP tools
pub fn suggest_actions_for_added() -> Vec<DriftSuggestedAction> {
    vec![
        DriftSuggestedAction {
            action_type: DriftActionType::UpdateSpec,
            label: "Update Spec".to_string(),
            description: "Accept this new endpoint into the spec".to_string(),
        },
        DriftSuggestedAction {
            action_type: DriftActionType::Ignore,
            label: "Ignore".to_string(),
            description: "Suppress this drift warning".to_string(),
        },
    ]
}

/// Suggest resolution actions for a removed operation.
#[must_use]
#[allow(dead_code)] // Exported via ts-rs types; called from tests and future MCP tools
pub fn suggest_actions_for_removed() -> Vec<DriftSuggestedAction> {
    vec![
        DriftSuggestedAction {
            action_type: DriftActionType::UpdateSpec,
            label: "Update Spec".to_string(),
            description: "Remove this endpoint from the spec".to_string(),
        },
        DriftSuggestedAction {
            action_type: DriftActionType::Ignore,
            label: "Ignore".to_string(),
            description: "Suppress this drift warning".to_string(),
        },
    ]
}

/// Suggest resolution actions for a changed operation.
#[must_use]
#[allow(dead_code)] // Exported via ts-rs types; called from tests and future MCP tools
pub fn suggest_actions_for_changed() -> Vec<DriftSuggestedAction> {
    vec![
        DriftSuggestedAction {
            action_type: DriftActionType::UpdateSpec,
            label: "Update Spec".to_string(),
            description: "Update the spec to match the new version".to_string(),
        },
        DriftSuggestedAction {
            action_type: DriftActionType::FixRequest,
            label: "Fix Request".to_string(),
            description: "Update the request to match the spec".to_string(),
        },
        DriftSuggestedAction {
            action_type: DriftActionType::Ignore,
            label: "Ignore".to_string(),
            description: "Suppress this drift warning".to_string(),
        },
    ]
}

/// Result of refreshing a collection's spec against its upstream source.
#[derive(Debug, Clone, Serialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct SpecRefreshResult {
    /// Whether any structural changes were detected.
    pub changed: bool,
    /// Operations present in the new spec but not in the old.
    pub operations_added: Vec<DriftOperation>,
    /// Operations present in the old spec but not in the new.
    pub operations_removed: Vec<DriftOperation>,
    /// Operations present in both but with structural differences.
    pub operations_changed: Vec<OperationChange>,
}

/// An operation identified by HTTP method and path.
#[derive(Debug, Clone, Serialize, PartialEq, Eq, TS)]
#[ts(export)]
pub struct DriftOperation {
    /// HTTP method (e.g., "GET", "POST").
    pub method: String,
    /// URL path (e.g., "/users/{id}").
    pub path: String,
}

/// An operation that exists in both specs but has structural differences.
#[derive(Debug, Clone, Serialize, PartialEq, Eq, TS)]
#[ts(export)]
pub struct OperationChange {
    /// HTTP method (e.g., "GET").
    pub method: String,
    /// URL path (e.g., "/users").
    pub path: String,
    /// What changed (e.g., `summary`, `parameters`, `deprecated`).
    pub changes: Vec<String>,
}

/// Compute structural drift between two parsed specs.
///
/// Keys endpoints by `(method, path)` tuple and detects:
/// - Added operations (in `new` but not `old`)
/// - Removed operations (in `old` but not `new`)
/// - Changed operations (in both, but with differences in summary, parameters count, or deprecated status)
///
/// This is a pure function — no I/O, no side effects, easily testable.
pub fn compute_drift(old: &ParsedSpec, new: &ParsedSpec) -> SpecRefreshResult {
    // Build lookup maps keyed by (method, path)
    let old_map: BTreeMap<(String, String), _> = old
        .endpoints
        .iter()
        .map(|ep| ((ep.method.clone(), ep.path.clone()), ep))
        .collect();

    let new_map: BTreeMap<(String, String), _> = new
        .endpoints
        .iter()
        .map(|ep| ((ep.method.clone(), ep.path.clone()), ep))
        .collect();

    // Detect added operations
    let operations_added: Vec<DriftOperation> = new_map
        .keys()
        .filter(|key| !old_map.contains_key(*key))
        .map(|(method, path)| DriftOperation {
            method: method.clone(),
            path: path.clone(),
        })
        .collect();

    // Detect removed operations
    let operations_removed: Vec<DriftOperation> = old_map
        .keys()
        .filter(|key| !new_map.contains_key(*key))
        .map(|(method, path)| DriftOperation {
            method: method.clone(),
            path: path.clone(),
        })
        .collect();

    // Detect changed operations
    let operations_changed: Vec<OperationChange> = old_map
        .iter()
        .filter_map(|(key, old_ep)| {
            let new_ep = new_map.get(key)?;
            let mut changes = Vec::new();

            if old_ep.summary != new_ep.summary {
                changes.push("summary".to_string());
            }
            if old_ep.parameters.len() != new_ep.parameters.len() {
                changes.push("parameters".to_string());
            }
            if old_ep.deprecated != new_ep.deprecated {
                changes.push("deprecated".to_string());
            }

            if changes.is_empty() {
                None
            } else {
                Some(OperationChange {
                    method: key.0.clone(),
                    path: key.1.clone(),
                    changes,
                })
            }
        })
        .collect();

    let changed = !operations_added.is_empty()
        || !operations_removed.is_empty()
        || !operations_changed.is_empty();

    SpecRefreshResult {
        changed,
        operations_added,
        operations_removed,
        operations_changed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::collection::spec_port::{
        ParameterLocation, ParsedEndpoint, ParsedParameter, ParsedServer,
    };
    use std::collections::BTreeMap;

    /// Helper: create a minimal `ParsedSpec` with the given endpoints.
    fn make_spec(endpoints: Vec<ParsedEndpoint>) -> ParsedSpec {
        ParsedSpec {
            title: "Test API".to_string(),
            version: Some("1.0.0".to_string()),
            description: None,
            base_urls: vec![ParsedServer {
                url: "https://api.test.com".to_string(),
                description: None,
            }],
            endpoints,
            auth_schemes: vec![],
            variables: BTreeMap::new(),
        }
    }

    /// Helper: create a simple endpoint with method, path, and optional summary.
    fn make_endpoint(method: &str, path: &str, summary: Option<&str>) -> ParsedEndpoint {
        ParsedEndpoint {
            operation_id: None,
            method: method.to_string(),
            path: path.to_string(),
            summary: summary.map(ToString::to_string),
            description: None,
            tags: vec![],
            parameters: vec![],
            request_body: None,
            deprecated: false,
            is_streaming: false,
        }
    }

    #[test]
    fn test_no_drift_identical_specs() {
        let spec = make_spec(vec![
            make_endpoint("GET", "/users", Some("List users")),
            make_endpoint("POST", "/users", Some("Create user")),
        ]);

        let result = compute_drift(&spec, &spec);
        assert!(!result.changed);
        assert!(result.operations_added.is_empty());
        assert!(result.operations_removed.is_empty());
        assert!(result.operations_changed.is_empty());
    }

    /// Test 2B.3: Detect added operations.
    #[test]
    fn test_detect_added_operations() {
        let old = make_spec(vec![
            make_endpoint("GET", "/users", Some("List users")),
            make_endpoint("POST", "/users", Some("Create user")),
        ]);

        let new = make_spec(vec![
            make_endpoint("GET", "/users", Some("List users")),
            make_endpoint("POST", "/users", Some("Create user")),
            make_endpoint("DELETE", "/users/{id}", Some("Delete user")),
        ]);

        let result = compute_drift(&old, &new);
        assert!(result.changed);
        assert_eq!(result.operations_added.len(), 1);
        assert_eq!(result.operations_added[0].method, "DELETE");
        assert_eq!(result.operations_added[0].path, "/users/{id}");
        assert!(result.operations_removed.is_empty());
        assert!(result.operations_changed.is_empty());
    }

    /// Test 2B.4: Detect removed operations.
    #[test]
    fn test_detect_removed_operations() {
        let old = make_spec(vec![
            make_endpoint("GET", "/users", Some("List users")),
            make_endpoint("POST", "/users", Some("Create user")),
            make_endpoint("PUT", "/users/{id}", Some("Update user")),
        ]);

        let new = make_spec(vec![
            make_endpoint("GET", "/users", Some("List users")),
            make_endpoint("POST", "/users", Some("Create user")),
        ]);

        let result = compute_drift(&old, &new);
        assert!(result.changed);
        assert!(result.operations_added.is_empty());
        assert_eq!(result.operations_removed.len(), 1);
        assert_eq!(result.operations_removed[0].method, "PUT");
        assert_eq!(result.operations_removed[0].path, "/users/{id}");
        assert!(result.operations_changed.is_empty());
    }

    /// Test 2B.5: Detect changed operations (summary + parameters).
    #[test]
    fn test_detect_changed_operations() {
        let old = make_spec(vec![{
            let mut ep = make_endpoint("GET", "/users", Some("List users"));
            ep.parameters = vec![]; // no params
            ep
        }]);

        let new = make_spec(vec![{
            let mut ep = make_endpoint("GET", "/users", Some("List all users"));
            ep.parameters = vec![ParsedParameter {
                name: "limit".to_string(),
                location: ParameterLocation::Query,
                required: false,
                schema_type: Some("integer".to_string()),
                default_value: None,
                description: None,
            }];
            ep
        }]);

        let result = compute_drift(&old, &new);
        assert!(result.changed);
        assert!(result.operations_added.is_empty());
        assert!(result.operations_removed.is_empty());
        assert_eq!(result.operations_changed.len(), 1);
        assert_eq!(result.operations_changed[0].method, "GET");
        assert_eq!(result.operations_changed[0].path, "/users");
        assert!(
            result.operations_changed[0]
                .changes
                .contains(&"summary".to_string())
        );
        assert!(
            result.operations_changed[0]
                .changes
                .contains(&"parameters".to_string())
        );
    }

    #[test]
    fn test_detect_deprecated_change() {
        let old = make_spec(vec![make_endpoint("GET", "/users", Some("List users"))]);

        let new = make_spec(vec![{
            let mut ep = make_endpoint("GET", "/users", Some("List users"));
            ep.deprecated = true;
            ep
        }]);

        let result = compute_drift(&old, &new);
        assert!(result.changed);
        assert_eq!(result.operations_changed.len(), 1);
        assert!(
            result.operations_changed[0]
                .changes
                .contains(&"deprecated".to_string())
        );
    }

    #[test]
    fn test_empty_specs_no_drift() {
        let old = make_spec(vec![]);
        let new = make_spec(vec![]);

        let result = compute_drift(&old, &new);
        assert!(!result.changed);
    }

    #[test]
    fn test_suggest_actions_for_added() {
        let actions = suggest_actions_for_added();
        assert_eq!(actions.len(), 2);
        assert_eq!(actions[0].action_type, DriftActionType::UpdateSpec);
        assert_eq!(actions[1].action_type, DriftActionType::Ignore);
    }

    #[test]
    fn test_suggest_actions_for_removed() {
        let actions = suggest_actions_for_removed();
        assert_eq!(actions.len(), 2);
        assert_eq!(actions[0].action_type, DriftActionType::UpdateSpec);
        assert_eq!(actions[1].action_type, DriftActionType::Ignore);
    }

    #[test]
    fn test_suggest_actions_for_changed() {
        let actions = suggest_actions_for_changed();
        assert_eq!(actions.len(), 3);
        assert_eq!(actions[0].action_type, DriftActionType::UpdateSpec);
        assert_eq!(actions[1].action_type, DriftActionType::FixRequest);
        assert_eq!(actions[2].action_type, DriftActionType::Ignore);
    }

    #[test]
    fn test_drift_action_result_success() {
        let result = DriftActionResult {
            success: true,
            action_type: DriftActionType::UpdateSpec,
            message: "Spec updated".to_string(),
        };
        assert!(result.success);
        assert_eq!(result.action_type, DriftActionType::UpdateSpec);
    }

    #[test]
    fn test_drift_severity_serialization() {
        let severity = DriftSeverity::Breaking;
        let json = serde_json::to_string(&severity).unwrap();
        assert_eq!(json, "\"breaking\"");

        let parsed: DriftSeverity = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, DriftSeverity::Breaking);
    }

    #[test]
    fn test_drift_action_type_serialization() {
        let action = DriftActionType::FixRequest;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"fix_request\"");

        let parsed: DriftActionType = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, DriftActionType::FixRequest);
    }
}
