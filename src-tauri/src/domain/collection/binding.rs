#![allow(dead_code)]

use serde::{Deserialize, Serialize};

/// Links a request to its `OpenAPI` operation for drift detection.
///
/// # Why This Matters
/// This is the bridge between "HTTP client" and "comprehension layer".
/// When a request is bound to an `operation_id`, we can:
/// - Detect when the spec changes
/// - Verify AI-generated code matches the spec
/// - Show deprecation warnings
///
/// # Example YAML
/// ```yaml
/// binding:
///   operation_id: getUsers
///   path: /users/{id}
///   method: GET
/// ```
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct SpecBinding {
    /// `OpenAPI` `operationId` for the bound request.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,

    /// `OpenAPI` path template for the bound operation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// HTTP method for the bound operation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,

    /// When this binding was last validated against the spec.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bound_at: Option<String>,

    /// True if user manually bound this (vs auto-detected).
    #[serde(default)]
    pub is_manual: bool,
}

impl SpecBinding {
    /// Create a binding from an `OpenAPI` operation.
    pub fn from_operation(operation_id: &str, path: &str, method: &str) -> Self {
        let now = chrono::Utc::now();
        Self {
            operation_id: Some(operation_id.to_string()),
            path: Some(path.to_string()),
            method: Some(method.to_uppercase()),
            bound_at: Some(now.format("%Y-%m-%dT%H:%M:%SZ").to_string()),
            is_manual: false,
        }
    }

    /// Check if this binding has any data.
    pub const fn is_bound(&self) -> bool {
        self.operation_id.is_some() || self.path.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spec_binding_with_operation_id() {
        let binding = SpecBinding::from_operation("getUsers", "/users/{id}", "get");
        assert_eq!(binding.operation_id, Some("getUsers".to_string()));
        assert_eq!(binding.path, Some("/users/{id}".to_string()));
        assert_eq!(binding.method, Some("GET".to_string()));
        assert!(!binding.is_manual);
    }

    #[test]
    fn test_spec_binding_defaults_to_empty() {
        let binding = SpecBinding::default();
        assert!(binding.operation_id.is_none());
        assert!(binding.path.is_none());
        assert!(binding.method.is_none());
        assert!(!binding.is_manual);
        assert!(!binding.is_bound());
    }

    #[test]
    fn test_spec_binding_serializes_cleanly() {
        let binding = SpecBinding::default();
        let yaml = serde_yaml_ng::to_string(&binding).unwrap();
        // Empty binding should be minimal
        assert!(!yaml.contains("operation_id"));
        assert!(yaml.contains("is_manual: false"));
    }

    #[test]
    fn test_is_bound_returns_true_when_has_data() {
        let binding = SpecBinding {
            operation_id: Some("test".to_string()),
            ..Default::default()
        };
        assert!(binding.is_bound());
    }
}
