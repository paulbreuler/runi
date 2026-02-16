//! Domain port for git metadata resolution.
//!
//! Decouples git operations from infrastructure (hexagonal architecture).
//! Infrastructure adapters implement this trait for actual git CLI access.
//!
//! IMPORTANT: This module must have ZERO infrastructure dependencies.
//! No `std::process::Command`, no `git2`, no filesystem operations.

/// Port for resolving git metadata from a repository.
///
/// Used during import/refresh to populate `source_commit` on `CollectionSource`.
/// The domain layer defines *what* we need; infrastructure defines *how*.
pub trait GitMetadataPort: Send + Sync {
    /// Resolve the commit SHA for a given repo root and optional ref name.
    ///
    /// - `repo_root`: Path to the git repository root directory.
    /// - `ref_name`: Optional git ref (branch, tag, commit). Defaults to HEAD if `None`.
    ///
    /// Returns the full 40-character hex SHA string.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - `repo_root` is not a valid git repository
    /// - `ref_name` does not exist in the repository
    /// - Git operations fail for any other reason
    fn resolve_commit(&self, repo_root: &str, ref_name: Option<&str>) -> Result<String, String>;
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Mock implementation for testing domain logic without git.
    struct MockGitPort {
        commit: Result<String, String>,
    }

    impl GitMetadataPort for MockGitPort {
        fn resolve_commit(
            &self,
            _repo_root: &str,
            _ref_name: Option<&str>,
        ) -> Result<String, String> {
            self.commit.clone()
        }
    }

    #[test]
    fn test_mock_port_returns_commit() {
        let port = MockGitPort {
            commit: Ok("a".repeat(40)),
        };
        let result = port.resolve_commit("/some/repo", None);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 40);
    }

    #[test]
    fn test_mock_port_returns_error() {
        let port = MockGitPort {
            commit: Err("not a git repository".to_string()),
        };
        let result = port.resolve_commit("/tmp/nope", None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a git repository"));
    }
}
