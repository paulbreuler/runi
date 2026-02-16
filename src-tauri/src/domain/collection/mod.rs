//! Collection domain types for runi's comprehension layer.
//!
//! These types enable:
//! - Provenance tracking (where did this collection come from?)
//! - Spec binding (which `OpenAPI` operation does this request match?)
//! - AI attribution (was this AI-generated? Is it verified?)
//!
//! IMPORTANT: All map fields use `BTreeMap` for deterministic YAML output.
//! Never use `HashMap` — it has random ordering that breaks Git diffs.

pub mod binding;
pub mod intelligence;
pub mod source;
pub mod spec_port;
pub mod types;

#[allow(unused_imports)]
pub use binding::*;
#[allow(unused_imports)]
pub use intelligence::*;
#[allow(unused_imports)]
pub use source::*;
#[allow(unused_imports)]
pub use spec_port::*;
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
