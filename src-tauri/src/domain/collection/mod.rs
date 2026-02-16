//! Collection domain types for runi's comprehension layer.
//!
//! These types enable:
//! - Provenance tracking (where did this collection come from?)
//! - Spec binding (which `OpenAPI` operation does this request match?)
//! - AI attribution (was this AI-generated? Is it verified?)
//!
//! IMPORTANT: All map fields use `BTreeMap` for deterministic YAML output.
//! Never use `HashMap` — it has random ordering that breaks Git diffs.

/// Spec binding types for linking requests to operations.
pub mod binding;
/// Drift detection types and diff engine for spec refresh.
pub mod drift;
/// Git metadata port for resolving commit SHAs.
pub mod git_port;
/// AI attribution and verification metadata.
pub mod intelligence;
/// Source type and provenance tracking.
pub mod source;
/// Domain ports for pluggable spec import (hexagonal architecture).
pub mod spec_port;
/// Domain ports for test runner integration.
pub mod test_port;
/// Core collection types and schema definitions.
pub mod types;

/// Re-export binding types.
#[allow(unused_imports)]
pub use binding::*;
/// Re-export intelligence metadata types.
#[allow(unused_imports)]
pub use intelligence::*;
/// Re-export source types.
#[allow(unused_imports)]
pub use source::*;
/// Re-export spec port types.
#[allow(unused_imports)]
pub use spec_port::*;
/// Re-export test port types.
#[allow(unused_imports)]
pub use test_port::*;
/// Re-export core collection types.
#[allow(unused_imports)]
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reexports_available() {
        let collection = Collection::new("Test");
        let source = CollectionSource::default();
        let binding = SpecBinding::default();
        let intelligence = IntelligenceMetadata::default();

        assert!(collection.requests.is_empty());
        assert_eq!(source.source_type, SourceType::Manual);
        assert!(!binding.is_bound());
        assert!(!intelligence.ai_generated);
    }
}
