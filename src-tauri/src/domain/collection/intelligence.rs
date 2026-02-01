use serde::{Deserialize, Serialize};

/// AI attribution and drift status (stubs for future features).
///
/// # Why This Matters
/// - 42% of AI-generated code contains hallucinations (MIT CSAIL)
/// - runi's differentiation: "Did AI generate this? Has it been verified?"
/// - These are STUBS for now — minimal implementation, future expansion
///
/// # Future Features (not in Plan 11)
/// - AI verification badge in UI
/// - Drift detection overlay
/// - Hallucination warning panel
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct IntelligenceMetadata {
    /// True if this request was AI-generated.
    #[serde(default)]
    pub ai_generated: bool,

    /// Model that generated this: "anthropic/claude-sonnet-4-20250514".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generator_model: Option<String>,

    /// Has this been verified against the spec?
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verified: Option<bool>,

    /// Current drift status from last validation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub drift_status: Option<DriftStatus>,

    /// When drift was last checked: "2026-01-31T10:30:00Z".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_validated: Option<String>,
}

impl IntelligenceMetadata {
    /// Mark as AI-generated with model attribution.
    pub fn ai_generated(model: &str) -> Self {
        Self {
            ai_generated: true,
            generator_model: Some(model.to_string()),
            verified: None,
            drift_status: None,
            last_validated: None,
        }
    }
}

/// Drift detection status for spec-bound requests.
///
/// # Progression
/// - Clean: Request matches current spec
/// - Warning: Spec changed, request still valid but different
/// - Error: Request no longer valid against spec
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DriftStatus {
    /// Request matches current spec.
    Clean,
    /// Spec changed but request still valid.
    Warning,
    /// Request no longer matches spec.
    Error,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intelligence_metadata_defaults_ai_generated_false() {
        let meta = IntelligenceMetadata::default();
        assert!(!meta.ai_generated);
        assert!(meta.generator_model.is_none());
        assert!(meta.verified.is_none());
        assert!(meta.drift_status.is_none());
    }

    #[test]
    fn test_drift_status_enum_variants() {
        let statuses = vec![DriftStatus::Clean, DriftStatus::Warning, DriftStatus::Error];
        for status in statuses {
            let yaml = serde_yml::to_string(&status).unwrap();
            assert!(!yaml.contains("::"));
        }
    }

    #[test]
    fn test_drift_status_serializes_snake_case() {
        let yaml = serde_yml::to_string(&DriftStatus::Warning).unwrap();
        assert!(yaml.contains("warning"));
    }

    #[test]
    fn test_ai_generated_constructor() {
        let meta = IntelligenceMetadata::ai_generated("anthropic/claude-sonnet-4-20250514");
        assert!(meta.ai_generated);
        assert_eq!(
            meta.generator_model,
            Some("anthropic/claude-sonnet-4-20250514".to_string())
        );
    }

    #[test]
    fn test_intelligence_serializes_cleanly() {
        let meta = IntelligenceMetadata::default();
        let yaml = serde_yml::to_string(&meta).unwrap();
        // Default should be minimal
        assert!(yaml.contains("ai_generated: false"));
        assert!(!yaml.contains("generator_model"));
    }
}
