//! `HurlRunner` — infrastructure adapter for the Hurl CLI.
//!
//! Shells out to the `hurl` binary using `std::process::Command` with an explicit
//! argument array. **No shell interpolation** — all paths and variables are passed
//! as discrete OS arguments, preventing command injection.

use std::path::Path;
use std::process::Command;
use std::time::Instant;

use crate::domain::collection::test_port::{TestRunConfig, TestRunResult, TestRunner};

/// Infrastructure adapter that executes `.hurl` files via the Hurl CLI.
///
/// # Security
///
/// Uses `std::process::Command` with explicit args — never `sh -c` or string
/// interpolation. File paths with shell metacharacters are safe because they
/// are passed as a single OS argument.
#[derive(Debug, Default)]
pub struct HurlRunner;

impl HurlRunner {
    /// Build the argument list for a hurl invocation.
    ///
    /// Pure function — easy to test without spawning a process.
    fn build_args(config: &TestRunConfig) -> Vec<String> {
        let mut args = vec![
            "--test".to_string(),
            "--json".to_string(),
            config.file_path.clone(),
        ];

        for (key, value) in &config.env_vars {
            args.push("--variable".to_string());
            args.push(format!("{key}={value}"));
        }

        args
    }

    /// Parse hurl JSON output into a `TestRunResult`.
    ///
    /// Hurl `--json` output is a JSON array of entry results. Each entry has
    /// a `success` boolean. We count entries and failures from there.
    #[allow(clippy::cast_possible_truncation)] // Entry counts will never exceed u32::MAX
    fn parse_json_output(
        stdout: &str,
        exit_code: i32,
        duration_ms: u64,
        stderr: &str,
    ) -> TestRunResult {
        // Try to parse the JSON array from stdout
        if let Ok(entries) = serde_json::from_str::<Vec<serde_json::Value>>(stdout) {
            let test_count = entries.len() as u32;
            let failure_count = entries
                .iter()
                .filter(|e| e.get("success").and_then(serde_json::Value::as_bool) == Some(false))
                .count() as u32;

            return TestRunResult {
                exit_code,
                passed: exit_code == 0 && failure_count == 0,
                test_count,
                failure_count,
                duration_ms,
                stdout: stdout.to_string(),
                stderr: stderr.to_string(),
            };
        }

        // Fallback: couldn't parse JSON — report raw output
        TestRunResult {
            exit_code,
            passed: exit_code == 0,
            test_count: 0,
            failure_count: u32::from(exit_code != 0),
            duration_ms,
            stdout: stdout.to_string(),
            stderr: stderr.to_string(),
        }
    }
}

impl TestRunner for HurlRunner {
    fn runner_name(&self) -> &'static str {
        "hurl"
    }

    #[allow(clippy::cast_possible_truncation)] // Duration in ms will never exceed u64::MAX
    fn run(&self, config: &TestRunConfig) -> Result<TestRunResult, String> {
        // Validate file exists
        let path = Path::new(&config.file_path);
        if !path.exists() {
            return Err(format!("Hurl file not found: {}", config.file_path));
        }

        // Validate extension
        if path.extension().and_then(std::ffi::OsStr::to_str) != Some("hurl") {
            return Err(format!(
                "Invalid file type: expected .hurl file, got '{}'",
                config.file_path
            ));
        }

        let args = Self::build_args(config);
        let start = Instant::now();

        let mut cmd = Command::new("hurl");
        cmd.args(&args);

        // Pass env vars via Command::envs — NOT shell expansion
        if !config.env_vars.is_empty() {
            cmd.envs(&config.env_vars);
        }

        // Honor timeout_secs if provided
        let output = if let Some(timeout_secs) = config.timeout_secs {
            use std::io::Read;

            cmd.stdout(std::process::Stdio::piped());
            cmd.stderr(std::process::Stdio::piped());

            let mut child = cmd.spawn().map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    "hurl CLI not found — install from https://hurl.dev".to_string()
                } else {
                    format!("Failed to execute hurl: {e}")
                }
            })?;

            let timeout = std::time::Duration::from_secs(timeout_secs);
            let start_wait = Instant::now();

            // Poll for completion with timeout
            loop {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        // Process finished — read output
                        let mut stdout_buf = Vec::new();
                        let mut stderr_buf = Vec::new();

                        if let Some(mut out) = child.stdout.take() {
                            let _ = out.read_to_end(&mut stdout_buf);
                        }
                        if let Some(mut err) = child.stderr.take() {
                            let _ = err.read_to_end(&mut stderr_buf);
                        }

                        break std::process::Output {
                            status,
                            stdout: stdout_buf,
                            stderr: stderr_buf,
                        };
                    }
                    Ok(None) => {
                        // Still running
                        if start_wait.elapsed() > timeout {
                            // Timeout exceeded — kill the process
                            let _ = child.kill();
                            return Err(format!(
                                "hurl execution timed out after {timeout_secs} seconds"
                            ));
                        }
                        std::thread::sleep(std::time::Duration::from_millis(100));
                    }
                    Err(e) => return Err(format!("Failed to wait for hurl process: {e}")),
                }
            }
        } else {
            // No timeout — blocking wait
            cmd.output().map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    "hurl CLI not found — install from https://hurl.dev".to_string()
                } else {
                    format!("Failed to execute hurl: {e}")
                }
            })?
        };

        let duration_ms = start.elapsed().as_millis() as u64;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let exit_code = output.status.code().unwrap_or(-1);

        Ok(Self::parse_json_output(
            &stdout,
            exit_code,
            duration_ms,
            &stderr,
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    // ── Test 3C.1: Reject missing hurl path ──────────────────────────

    #[test]
    fn test_reject_missing_hurl_path() {
        let runner = HurlRunner;
        let config = TestRunConfig {
            file_path: "/nonexistent/path/test.hurl".to_string(),
            env_vars: HashMap::new(),
            timeout_secs: None,
        };
        let result = runner.run(&config);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("Hurl file not found: /nonexistent/path/test.hurl")
        );
    }

    // ── Test 3C.2: Reject invalid file extension ─────────────────────

    #[test]
    fn test_reject_invalid_extension() {
        let dir = tempfile::tempdir().unwrap();
        let bad_file = dir.path().join("test.yaml");
        std::fs::write(&bad_file, "GET http://example.com").unwrap();

        let runner = HurlRunner;
        let config = TestRunConfig {
            file_path: bad_file.to_string_lossy().to_string(),
            env_vars: HashMap::new(),
            timeout_secs: None,
        };
        let result = runner.run(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("expected .hurl file"));
    }

    // ── Test 3C.5: Environment variables passed to hurl ──────────────

    #[test]
    fn test_env_vars_in_args() {
        let mut env_vars = HashMap::new();
        env_vars.insert("base_url".to_string(), "http://localhost:8080".to_string());

        let config = TestRunConfig {
            file_path: "test.hurl".to_string(),
            env_vars,
            timeout_secs: None,
        };

        let args = HurlRunner::build_args(&config);
        assert!(args.contains(&"--variable".to_string()));
        assert!(args.contains(&"base_url=http://localhost:8080".to_string()));
    }

    // ── Test 3C.6: Command injection prevention ──────────────────────

    #[test]
    fn test_command_injection_prevention() {
        let config = TestRunConfig {
            file_path: "test; rm -rf /; echo.hurl".to_string(),
            env_vars: HashMap::new(),
            timeout_secs: None,
        };

        let args = HurlRunner::build_args(&config);

        // The malicious path must be a SINGLE argument, not shell-expanded
        assert_eq!(args.len(), 3); // --test, --json, file_path
        assert_eq!(args[2], "test; rm -rf /; echo.hurl");
    }

    // ── Test 3C.7: Hurl CLI not found returns clear error ────────────

    #[test]
    fn test_hurl_not_found_error() {
        let dir = tempfile::tempdir().unwrap();
        let hurl_file = dir.path().join("test.hurl");
        std::fs::write(&hurl_file, "GET http://example.com\nHTTP 200").unwrap();

        let config = TestRunConfig {
            file_path: hurl_file.to_string_lossy().to_string(),
            env_vars: HashMap::new(),
            timeout_secs: None,
        };

        // If hurl IS installed, execution succeeds (still valid).
        // If hurl is NOT installed, we get the expected error.
        if let Err(e) = HurlRunner.run(&config) {
            assert!(
                e.contains("hurl CLI not found"),
                "Expected 'hurl CLI not found' error, got: {e}"
            );
        }
    }

    // ── Test 3C.8: TestRunner trait is format-agnostic ────────────────

    #[test]
    fn test_hurl_runner_implements_test_runner() {
        let runner: Box<dyn TestRunner> = Box::new(HurlRunner);
        assert_eq!(runner.runner_name(), "hurl");
    }

    // ── JSON parsing tests ───────────────────────────────────────────

    #[test]
    fn test_parse_json_output_success() {
        let json = r#"[{"success": true}, {"success": true}]"#;
        let result = HurlRunner::parse_json_output(json, 0, 100, "");

        assert!(result.passed);
        assert_eq!(result.test_count, 2);
        assert_eq!(result.failure_count, 0);
        assert_eq!(result.exit_code, 0);
        assert_eq!(result.duration_ms, 100);
    }

    #[test]
    fn test_parse_json_output_with_failures() {
        let json = r#"[{"success": true}, {"success": false}]"#;
        let result = HurlRunner::parse_json_output(json, 1, 200, "assertion error");

        assert!(!result.passed);
        assert_eq!(result.test_count, 2);
        assert_eq!(result.failure_count, 1);
        assert_eq!(result.exit_code, 1);
    }

    #[test]
    fn test_parse_json_output_invalid_json() {
        let result = HurlRunner::parse_json_output("not json", 1, 50, "error");

        assert!(!result.passed);
        assert_eq!(result.test_count, 0);
        assert_eq!(result.failure_count, 1);
    }

    // ── Test 3C.3 and 3C.4: Full execution tests (require hurl CLI) ─

    #[test]
    #[ignore = "requires hurl CLI and network access"]
    fn test_successful_hurl_execution() {
        let dir = tempfile::tempdir().unwrap();
        let hurl_file = dir.path().join("test.hurl");
        std::fs::write(&hurl_file, "GET https://httpbin.org/status/200\nHTTP 200\n").unwrap();

        let config = TestRunConfig {
            file_path: hurl_file.to_string_lossy().to_string(),
            env_vars: HashMap::new(),
            timeout_secs: Some(30),
        };

        let result = HurlRunner.run(&config).unwrap();
        assert!(result.passed);
        assert_eq!(result.exit_code, 0);
        assert!(result.test_count > 0);
        assert_eq!(result.failure_count, 0);
        assert!(result.duration_ms > 0);
    }

    #[test]
    #[ignore = "requires hurl CLI and network access"]
    fn test_failed_hurl_execution() {
        let dir = tempfile::tempdir().unwrap();
        let hurl_file = dir.path().join("test.hurl");
        std::fs::write(&hurl_file, "GET https://httpbin.org/status/200\nHTTP 404\n").unwrap();

        let config = TestRunConfig {
            file_path: hurl_file.to_string_lossy().to_string(),
            env_vars: HashMap::new(),
            timeout_secs: Some(30),
        };

        let result = HurlRunner.run(&config).unwrap();
        assert!(!result.passed);
        assert_ne!(result.exit_code, 0);
        assert!(result.failure_count > 0);
    }
}
