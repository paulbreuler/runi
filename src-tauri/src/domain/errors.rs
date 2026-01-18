// Structured error types with correlation IDs for tracing errors across React and Rust boundaries.
//
// Enables loose coupling between frontend and backend by providing structured error information
// that can be traced through the entire request lifecycle.

use serde::{Deserialize, Serialize};

/// Application error with correlation ID for tracing.
///
/// Used for errors that propagate between React and Rust,
/// allowing errors to be traced through the entire system.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Eq))]
pub struct AppError {
    /// Correlation ID for tracing the error across boundaries
    pub correlation_id: String,
    /// Error code (e.g., `HTTP_REQUEST_FAILED`, `INVALID_URL`)
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// Optional error details (structured data)
    pub details: Option<serde_json::Value>,
}

impl AppError {
    /// Create a new `AppError` with the given code, message, and correlation ID.
    ///
    /// # Arguments
    ///
    /// * `correlation_id` - Correlation ID for tracing
    /// * `code` - Error code
    /// * `message` - Error message
    pub fn new(
        correlation_id: String,
        code: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self {
            correlation_id,
            code: code.into(),
            message: message.into(),
            details: None,
        }
    }

    /// Create a new `AppError` with details.
    ///
    /// # Arguments
    ///
    /// * `correlation_id` - Correlation ID for tracing
    /// * `code` - Error code
    /// * `message` - Error message
    /// * `details` - Optional error details
    pub fn with_details(
        correlation_id: String,
        code: impl Into<String>,
        message: impl Into<String>,
        details: serde_json::Value,
    ) -> Self {
        Self {
            correlation_id,
            code: code.into(),
            message: message.into(),
            details: Some(details),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "[{}] {}: {}",
            self.code, self.correlation_id, self.message
        )
    }
}

impl std::error::Error for AppError {}

/// Helper trait for converting errors to `AppError` with correlation ID.
pub trait ToAppError {
    /// Convert error to `AppError` with the given correlation ID.
    fn to_app_error(&self, correlation_id: String) -> AppError;
}

impl ToAppError for curl::Error {
    fn to_app_error(&self, correlation_id: String) -> AppError {
        AppError::with_details(
            correlation_id,
            "HTTP_REQUEST_FAILED",
            format!("Request failed: {self}"),
            serde_json::json!({
                "error_type": "curl_error",
                "error_code": self.code(),
            }),
        )
    }
}

impl ToAppError for String {
    fn to_app_error(&self, correlation_id: String) -> AppError {
        AppError::new(correlation_id, "ERROR", self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_error_new() {
        let error = AppError::new("test-id".to_string(), "TEST_CODE", "Test message");
        assert_eq!(error.correlation_id, "test-id");
        assert_eq!(error.code, "TEST_CODE");
        assert_eq!(error.message, "Test message");
        assert_eq!(error.details, None);
    }

    #[test]
    fn test_app_error_with_details() {
        let details = serde_json::json!({"url": "https://example.com"});
        let error =
            AppError::with_details("test-id".to_string(), "CODE", "Message", details.clone());
        assert_eq!(error.correlation_id, "test-id");
        assert_eq!(error.code, "CODE");
        assert_eq!(error.message, "Message");
        assert_eq!(error.details, Some(details));
    }

    #[test]
    fn test_app_error_display() {
        let error = AppError::new("test-id".to_string(), "CODE", "Message");
        let display = format!("{error}");
        assert!(display.contains("CODE"));
        assert!(display.contains("test-id"));
        assert!(display.contains("Message"));
    }

    #[test]
    fn test_to_app_error_string() {
        let error_string = "Test error".to_string();
        let app_error = error_string.to_app_error("corr-id".to_string());
        assert_eq!(app_error.correlation_id, "corr-id");
        assert_eq!(app_error.code, "ERROR");
        assert_eq!(app_error.message, "Test error");
    }
}
