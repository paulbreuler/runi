//! Git CLI adapter for resolving commit metadata.
//!
//! Implements `GitMetadataPort` by shelling out to `git rev-parse`.
//! Validates inputs to prevent command injection.

use std::path::Path;
use std::process::Command;

use crate::domain::collection::git_port::GitMetadataPort;

/// Infrastructure adapter that resolves git metadata via the CLI.
///
/// Uses `git rev-parse` under the hood. Validates all inputs before
/// executing to prevent command injection.
pub struct GitCliAdapter;

impl GitCliAdapter {
    /// Validate that a repo root path is safe and exists.
    fn validate_repo_root(repo_root: &str) -> Result<(), String> {
        // Must not be empty
        if repo_root.is_empty() {
            return Err("repo_root must not be empty".to_string());
        }

        // Must be an existing directory
        let path = Path::new(repo_root);
        if !path.is_dir() {
            return Err(format!("repo_root is not a directory: {repo_root}"));
        }

        Ok(())
    }

    /// Validate that a ref name is safe (no shell metacharacters).
    fn validate_ref_name(ref_name: &str) -> Result<(), String> {
        // Must not be empty
        if ref_name.is_empty() {
            return Err("ref_name must not be empty".to_string());
        }

        // Git ref names: alphanumeric, /, -, _, .
        // Reject anything that could be a shell metacharacter or flag
        if ref_name.starts_with('-') {
            return Err(format!("ref_name must not start with a dash: {ref_name}"));
        }

        let is_safe = ref_name
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '/' | '-' | '_' | '.' | '@' | '{' | '}'));

        if !is_safe {
            return Err(format!("ref_name contains invalid characters: {ref_name}"));
        }

        Ok(())
    }
}

impl GitMetadataPort for GitCliAdapter {
    fn resolve_commit(&self, repo_root: &str, ref_name: Option<&str>) -> Result<String, String> {
        Self::validate_repo_root(repo_root)?;

        let git_ref = match ref_name {
            Some(name) => {
                Self::validate_ref_name(name)?;
                name.to_string()
            }
            None => "HEAD".to_string(),
        };

        let output = Command::new("git")
            .args(["rev-parse", &git_ref])
            .current_dir(repo_root)
            .output()
            .map_err(|e| format!("Failed to execute git: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "git rev-parse failed for ref '{git_ref}': {stderr}"
            ));
        }

        let sha = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Validate SHA format (40 hex chars)
        if sha.len() != 40 || !sha.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(format!("git rev-parse returned invalid SHA: {sha}"));
        }

        Ok(sha)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Test 3A.1: Resolve HEAD commit for valid repo ──

    #[test]
    fn test_resolve_head_commit_for_valid_repo() {
        let adapter = GitCliAdapter;
        // Use this repo itself as a fixture
        let repo_root = env!("CARGO_MANIFEST_DIR");
        let result = adapter.resolve_commit(repo_root, None);

        assert!(result.is_ok(), "Expected Ok, got: {result:?}");
        let sha = result.unwrap();
        assert_eq!(sha.len(), 40, "SHA should be 40 chars, got: {sha}");
        assert!(
            sha.chars().all(|c| c.is_ascii_hexdigit()),
            "SHA should be hex: {sha}"
        );
    }

    // ── Test 3A.2: Resolve commit for specific ref ──

    #[test]
    fn test_resolve_commit_for_specific_ref() {
        let adapter = GitCliAdapter;
        let repo_root = env!("CARGO_MANIFEST_DIR");

        // Use HEAD as a guaranteed-existing ref
        let result = adapter.resolve_commit(repo_root, Some("HEAD"));
        assert!(result.is_ok(), "Expected Ok, got: {result:?}");

        let sha = result.unwrap();
        assert_eq!(sha.len(), 40);
        assert!(sha.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // ── Test 3A.3: Invalid repo path returns error ──

    #[test]
    fn test_invalid_repo_path_returns_error() {
        let adapter = GitCliAdapter;
        let result = adapter.resolve_commit("/tmp/definitely-not-a-git-repo-xyz", None);

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("not a directory") || err.contains("not a git repository"),
            "Expected directory/repo error, got: {err}"
        );
    }

    // ── Test 3A.4: Invalid ref name returns error ──

    #[test]
    fn test_invalid_ref_name_returns_error() {
        let adapter = GitCliAdapter;
        let repo_root = env!("CARGO_MANIFEST_DIR");
        let result = adapter.resolve_commit(repo_root, Some("nonexistent-branch-xyz-999"));

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("nonexistent-branch-xyz-999"),
            "Error should mention the ref name, got: {err}"
        );
    }

    // ── Security: Input sanitization tests ──

    #[test]
    fn test_ref_name_starting_with_dash_rejected() {
        let adapter = GitCliAdapter;
        let repo_root = env!("CARGO_MANIFEST_DIR");
        let result = adapter.resolve_commit(repo_root, Some("--upload-pack=evil"));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must not start with a dash"));
    }

    #[test]
    fn test_ref_name_with_shell_metacharacters_rejected() {
        let adapter = GitCliAdapter;
        let repo_root = env!("CARGO_MANIFEST_DIR");
        let result = adapter.resolve_commit(repo_root, Some("main; rm -rf /"));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid characters"));
    }

    #[test]
    fn test_empty_repo_root_rejected() {
        let adapter = GitCliAdapter;
        let result = adapter.resolve_commit("", None);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must not be empty"));
    }
}
