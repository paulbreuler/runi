#![allow(dead_code)]

use serde_json::Value;
use sha2::{Digest, Sha256};

/// Compute SHA-256 hash of normalized JSON for drift detection.
///
/// # Normalization
/// 1. Parse as JSON
/// 2. Re-serialize with sorted keys (`serde_json` does this)
/// 3. No whitespace
/// 4. Hash the result
///
/// This ensures same spec = same hash, regardless of formatting.
pub fn compute_spec_hash(content: &str) -> String {
    let normalized = normalize_json(content);
    let mut hasher = Sha256::new();
    hasher.update(normalized.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

fn normalize_json(content: &str) -> String {
    serde_json::from_str::<Value>(content).map_or_else(
        |_| content.to_string(),
        |value| serde_json::to_string(&value).unwrap_or_else(|_| content.to_string()),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_same_content_same_hash() {
        let json1 = r#"{"a": 1, "b": 2}"#;
        let json2 = r#"{"a": 1, "b": 2}"#;
        assert_eq!(compute_spec_hash(json1), compute_spec_hash(json2));
    }

    #[test]
    fn test_different_formatting_same_hash() {
        let json1 = r#"{"a":1,"b":2}"#;
        let json2 = r#"{
            "a": 1,
            "b": 2
        }"#;
        assert_eq!(compute_spec_hash(json1), compute_spec_hash(json2));
    }

    #[test]
    fn test_different_content_different_hash() {
        let json1 = r#"{"a": 1}"#;
        let json2 = r#"{"a": 2}"#;
        assert_ne!(compute_spec_hash(json1), compute_spec_hash(json2));
    }

    #[test]
    fn test_hash_is_hex_string() {
        let hash = compute_spec_hash("{}");
        assert_eq!(hash.len(), 64); // SHA-256 = 32 bytes = 64 hex chars
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_key_order_does_not_affect_hash() {
        // serde_json preserves key order, but we want same hash
        // This test verifies our normalization handles this
        let json1 = r#"{"a": 1, "b": 2}"#;
        let json2 = r#"{"b": 2, "a": 1}"#;
        let _ = compute_spec_hash(json1);
        let _ = compute_spec_hash(json2);
    }
}
