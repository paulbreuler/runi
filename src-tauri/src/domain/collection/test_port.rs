#![allow(dead_code)]

//! Domain port for pluggable test execution (hexagonal architecture).
//!
//! Defines the format-agnostic interface for running API test suites.
//! Infrastructure adapters implement `TestRunner` for specific tools
//! (Hurl, Newman, k6, etc.).
//!
//! # Architecture
//!
//! ```text
//! TestRunConfig ──runner──▶ TestRunResult
//!                    ▲
//! HurlRunner ────────┤
//! NewmanRunner ──────┤  (N adapters, 1 trait)
//! K6Runner ──────────┘
//! ```
//!
//! IMPORTANT: This module must have ZERO infrastructure dependencies.
//! No `std::process`, no hurl-specific types.

use std::collections::HashMap;

/// Configuration for a test run — format-agnostic.
///
/// Each runner adapter interprets these fields according to its tool's semantics.
#[derive(Debug, Clone)]
pub struct TestRunConfig {
    /// Path to the test file to execute.
    pub file_path: String,
    /// Environment variables to pass to the test runner.
    pub env_vars: HashMap<String, String>,
    /// Optional timeout in seconds for the entire run.
    pub timeout_secs: Option<u64>,
}

/// Result of a test run — format-agnostic.
///
/// All runner adapters must normalize their tool's output into this structure.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRunResult {
    /// Process exit code (0 = success).
    pub exit_code: i32,
    /// Whether all tests passed.
    pub passed: bool,
    /// Total number of test entries executed.
    pub test_count: u32,
    /// Number of failed test entries.
    pub failure_count: u32,
    /// Total duration in milliseconds.
    pub duration_ms: u64,
    /// Captured stdout from the runner.
    pub stdout: String,
    /// Captured stderr from the runner.
    pub stderr: String,
}

/// Port for format-specific test execution.
///
/// Each adapter wraps a CLI tool and normalizes its output into `TestRunResult`.
/// This trait is intentionally **sync** — test execution blocks on the child process.
pub trait TestRunner: Send + Sync {
    /// Human-readable runner name for error messages (e.g., "hurl", "newman").
    fn runner_name(&self) -> &'static str;

    /// Execute a test suite with the given configuration.
    ///
    /// # Errors
    ///
    /// Returns an error string if the runner cannot be invoked (e.g., CLI not found,
    /// file not found). Test *failures* are reported via `TestRunResult`, not errors.
    fn run(&self, config: &TestRunConfig) -> Result<TestRunResult, String>;
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test 3C.8: `TestRunner` trait is format-agnostic — verify the types compile
    /// and a mock implementation works.
    #[test]
    fn test_runner_trait_is_format_agnostic() {
        struct MockRunner;
        impl TestRunner for MockRunner {
            fn runner_name(&self) -> &'static str {
                "mock"
            }
            fn run(&self, config: &TestRunConfig) -> Result<TestRunResult, String> {
                Ok(TestRunResult {
                    exit_code: 0,
                    passed: true,
                    test_count: 1,
                    failure_count: 0,
                    duration_ms: 42,
                    stdout: format!("ran {}", config.file_path),
                    stderr: String::new(),
                })
            }
        }

        let runner: Box<dyn TestRunner> = Box::new(MockRunner);
        assert_eq!(runner.runner_name(), "mock");

        let config = TestRunConfig {
            file_path: "test.hurl".to_string(),
            env_vars: HashMap::new(),
            timeout_secs: None,
        };
        let result = runner.run(&config).unwrap();
        assert!(result.passed);
        assert_eq!(result.test_count, 1);
        assert_eq!(result.failure_count, 0);
    }

    #[test]
    fn test_run_config_with_env_vars() {
        let mut env = HashMap::new();
        env.insert("base_url".to_string(), "http://localhost:8080".to_string());

        let config = TestRunConfig {
            file_path: "api.hurl".to_string(),
            env_vars: env,
            timeout_secs: Some(30),
        };

        assert_eq!(config.env_vars.len(), 1);
        assert_eq!(config.timeout_secs, Some(30));
    }
}
