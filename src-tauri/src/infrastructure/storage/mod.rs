// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Storage infrastructure for pluggable storage backends

pub mod encryption;
pub mod file_storage;
pub mod history;
pub mod memory_storage;
pub mod migrations;
pub mod sqlite_storage;
pub mod traits;

use std::path::{Path, PathBuf};

/// Get the runi data directory.
///
/// Returns `~/.runi/` on Unix systems, `%APPDATA%/runi/` on Windows.
///
/// # Errors
///
/// Returns an error if the user's home/data directory cannot be determined.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub fn get_data_dir() -> Result<PathBuf, String> {
    dirs::data_dir()
        .ok_or_else(|| "Unable to determine data directory".to_string())
        .map(|mut path| {
            path.push("runi");
            path
        })
}

/// Get the history directory.
///
/// Returns `~/.runi/history/` (or platform equivalent).
///
/// # Errors
///
/// Returns an error if the data directory cannot be determined.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub fn get_history_dir() -> Result<PathBuf, String> {
    get_data_dir().map(|mut path| {
        path.push("history");
        path
    })
}

/// Ensure a directory exists, creating it if necessary.
///
/// # Errors
///
/// Returns an error if the directory cannot be created.
#[allow(dead_code)] // Used by file storage, retained for future export feature
pub async fn ensure_dir_exists(path: &Path) -> Result<(), String> {
    if path.exists() {
        if !path.is_dir() {
            return Err(format!(
                "Path exists but is not a directory: {}",
                path.display()
            ));
        }
        return Ok(());
    }

    tokio::fs::create_dir_all(path)
        .await
        .map_err(|e| format!("Failed to create directory {}: {e}", path.display()))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_get_data_dir() {
        let result = get_data_dir();
        assert!(result.is_ok(), "Should be able to get data directory");

        let data_dir = result.unwrap();
        assert!(
            data_dir.ends_with("runi"),
            "Data dir should end with 'runi'"
        );
    }

    #[test]
    fn test_get_history_dir() {
        let result = get_history_dir();
        assert!(result.is_ok(), "Should be able to get history directory");

        let history_dir = result.unwrap();
        assert!(
            history_dir.ends_with("history"),
            "History dir should end with 'history'"
        );
        assert!(
            history_dir.parent().unwrap().ends_with("runi"),
            "History dir should be in runi data dir"
        );
    }

    #[tokio::test]
    async fn test_ensure_dir_exists() {
        let temp_dir = env::temp_dir();
        let test_dir = temp_dir.join("runi-test-ensure-dir");

        // Clean up if it exists
        let _ = tokio::fs::remove_dir_all(&test_dir).await;

        // Test creating new directory
        let result = ensure_dir_exists(&test_dir).await;
        assert!(result.is_ok(), "Should create directory successfully");
        assert!(test_dir.exists(), "Directory should exist");
        assert!(test_dir.is_dir(), "Should be a directory");

        // Test with existing directory (should not error)
        let result = ensure_dir_exists(&test_dir).await;
        assert!(result.is_ok(), "Should handle existing directory");

        // Clean up
        let _ = tokio::fs::remove_dir_all(&test_dir).await;
    }

    #[tokio::test]
    async fn test_ensure_dir_exists_with_file() {
        let temp_dir = env::temp_dir();
        let test_file = temp_dir.join("runi-test-file-conflict");

        // Create a file
        tokio::fs::write(&test_file, "test").await.unwrap();

        // Try to ensure it as a directory (should fail)
        let result = ensure_dir_exists(&test_file).await;
        assert!(result.is_err(), "Should error when path is a file");

        // Clean up
        let _ = tokio::fs::remove_file(&test_file).await;
    }
}
