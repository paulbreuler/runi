#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Provenance tracking for drift detection.
///
/// This enables runi's killer feature: knowing when upstream specs change.
///
/// # Research Context
/// - 75% of APIs don't match their specs (Salt Security 2024)
/// - No existing tool tracks spec source URL for re-fetch
/// - SHA-256 hash enables cheap "did spec change?" detection
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
pub struct CollectionSource {
    /// How this collection was created.
    pub source_type: SourceType,

    /// Original URL for re-fetching (drift detection).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,

    /// SHA-256 hash of normalized spec: "sha256:abc123...".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hash: Option<String>,

    /// Spec version from info.version field.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spec_version: Option<String>,

    /// When spec was fetched: "2026-01-31T10:30:00Z".
    pub fetched_at: String,

    /// Git commit SHA if spec came from a repo.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_commit: Option<String>,

    // --- Tracking profile (API tracking bootstrap) ---
    /// Path to the git repo root for tracked specs.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub repo_root: Option<String>,

    /// Relative path to the `OpenAPI` spec within the repo.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub spec_path: Option<String>,

    /// Git ref (branch/tag/commit) being tracked.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ref_name: Option<String>,
}

impl Default for CollectionSource {
    fn default() -> Self {
        let now = chrono::Utc::now();
        Self {
            source_type: SourceType::Manual,
            url: None,
            hash: None,
            spec_version: None,
            fetched_at: now.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            source_commit: None,
            repo_root: None,
            spec_path: None,
            ref_name: None,
        }
    }
}

/// How this collection was created.
///
/// Import order matters for competitive positioning:
/// - openapi: Primary differentiation (spec-bound requests)
/// - postman: Largest user base to capture
/// - bruno: Growing open-source competitor
/// - insomnia: Users fleeing Kong's forced-login
/// - curl: Import from cURL commands
/// - manual: User created from scratch
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    /// Imported from an `OpenAPI` specification.
    Openapi,
    /// Imported from a Postman collection.
    Postman,
    /// Imported from a Bruno collection.
    Bruno,
    /// Imported from an Insomnia export.
    Insomnia,
    /// Imported from a cURL command.
    Curl,
    /// Created manually by the user.
    #[default]
    Manual,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collection_source_all_fields() {
        let source = CollectionSource {
            source_type: SourceType::Openapi,
            url: Some("https://httpbin.org/spec.json".to_string()),
            hash: Some("sha256:abc123".to_string()),
            spec_version: Some("0.9.2".to_string()),
            fetched_at: "2026-01-31T10:30:00Z".to_string(),
            source_commit: Some("abc123".to_string()),
            repo_root: None,
            spec_path: None,
            ref_name: None,
        };
        let yaml = serde_yaml_ng::to_string(&source).unwrap();
        assert!(yaml.contains("source_type: openapi"));
        assert!(yaml.contains("url: https://httpbin.org"));
        assert!(yaml.contains("hash: sha256:abc123"));
    }

    #[test]
    fn test_source_type_enum_variants() {
        let variants = vec![
            SourceType::Openapi,
            SourceType::Postman,
            SourceType::Bruno,
            SourceType::Insomnia,
            SourceType::Curl,
            SourceType::Manual,
        ];
        for v in variants {
            let yaml = serde_yaml_ng::to_string(&v).unwrap();
            // All should serialize to snake_case
            assert!(!yaml.contains("::"));
        }
    }

    #[test]
    fn test_source_type_serializes_snake_case() {
        let yaml = serde_yaml_ng::to_string(&SourceType::Openapi).unwrap();
        assert!(yaml.contains("openapi"));
    }

    #[test]
    fn test_collection_source_default() {
        let source = CollectionSource::default();
        assert_eq!(source.source_type, SourceType::Manual);
        assert!(source.url.is_none());
        assert!(source.hash.is_none());
        assert!(source.fetched_at.ends_with('Z'));
        assert!(source.repo_root.is_none());
        assert!(source.spec_path.is_none());
        assert!(source.ref_name.is_none());
    }

    #[test]
    fn test_existing_yaml_without_tracking_fields_deserializes() {
        let yaml = r"
source_type: openapi
url: https://example.com/spec.json
hash: sha256:abc123
fetched_at: '2026-01-31T10:30:00Z'
";
        let source: CollectionSource = serde_yaml_ng::from_str(yaml).unwrap();
        assert_eq!(source.source_type, SourceType::Openapi);
        assert!(source.repo_root.is_none());
        assert!(source.spec_path.is_none());
        assert!(source.ref_name.is_none());
    }

    #[test]
    fn test_tracking_fields_roundtrip() {
        let source = CollectionSource {
            source_type: SourceType::Openapi,
            url: Some("https://example.com/spec.json".to_string()),
            hash: None,
            spec_version: None,
            fetched_at: "2026-01-31T10:30:00Z".to_string(),
            source_commit: None,
            repo_root: Some("../project-alder".to_string()),
            spec_path: Some("crates/api/src/openapi.rs".to_string()),
            ref_name: Some("main".to_string()),
        };
        let yaml = serde_yaml_ng::to_string(&source).unwrap();
        assert!(yaml.contains("repo_root: ../project-alder"));
        assert!(yaml.contains("spec_path: crates/api/src/openapi.rs"));
        assert!(yaml.contains("ref_name: main"));

        let parsed: CollectionSource = serde_yaml_ng::from_str(&yaml).unwrap();
        assert_eq!(parsed.repo_root, Some("../project-alder".to_string()));
        assert_eq!(
            parsed.spec_path,
            Some("crates/api/src/openapi.rs".to_string())
        );
        assert_eq!(parsed.ref_name, Some("main".to_string()));
    }

    #[test]
    fn test_tracking_fields_skipped_when_none() {
        let source = CollectionSource::default();
        let yaml = serde_yaml_ng::to_string(&source).unwrap();
        assert!(!yaml.contains("repo_root"));
        assert!(!yaml.contains("spec_path"));
        assert!(!yaml.contains("ref_name"));
    }
}
