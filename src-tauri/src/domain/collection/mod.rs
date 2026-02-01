//! Collection domain types for runi's comprehension layer.
//!
//! These types enable:
//! - Provenance tracking (where did this collection come from?)
//! - Spec binding (which OpenAPI operation does this request match?)
//! - AI attribution (was this AI-generated? Is it verified?)
//!
//! IMPORTANT: All map fields use BTreeMap for deterministic YAML output.
//! Never use HashMap — it has random ordering that breaks Git diffs.

pub mod binding;
pub mod intelligence;
pub mod source;
pub mod types;

pub use binding::*;
pub use intelligence::*;
pub use source::*;
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reexports_available() {
        let _collection = Collection::new("Test");
        let _source = CollectionSource::default();
        let _binding = SpecBinding::default();
        let _intelligence = IntelligenceMetadata::default();

        assert!(_collection.requests.is_empty());
        assert_eq!(_source.source_type, SourceType::Manual);
        assert!(!_binding.is_bound());
        assert!(!_intelligence.ai_generated);
    }
}
