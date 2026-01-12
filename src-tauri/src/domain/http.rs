// HTTP domain models for request/response handling

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Timing information for HTTP request phases.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[allow(clippy::struct_field_names)] // _ms suffix is intentional for clarity
pub struct RequestTiming {
    /// Total request duration in milliseconds.
    pub total_ms: u64,
    /// DNS resolution time in milliseconds.
    pub dns_ms: Option<u64>,
    /// TCP connection time in milliseconds.
    pub connect_ms: Option<u64>,
    /// TLS handshake time in milliseconds.
    pub tls_ms: Option<u64>,
    /// Time to first byte in milliseconds.
    pub first_byte_ms: Option<u64>,
}

/// Parameters for an HTTP request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestParams {
    /// The target URL.
    pub url: String,
    /// HTTP method (GET, POST, PUT, PATCH, DELETE, etc.).
    pub method: String,
    /// Request headers as key-value pairs.
    #[serde(default)]
    pub headers: HashMap<String, String>,
    /// Optional request body.
    pub body: Option<String>,
    /// Request timeout in milliseconds (default: 30000).
    #[serde(default = "default_timeout")]
    pub timeout_ms: u64,
}

/// Default timeout of 30 seconds.
const fn default_timeout() -> u64 {
    30000
}

/// Response from an HTTP request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    /// HTTP status code.
    pub status: u16,
    /// HTTP status text (e.g., "OK", "Not Found").
    pub status_text: String,
    /// Response headers as key-value pairs.
    pub headers: HashMap<String, String>,
    /// Response body as a string.
    pub body: String,
    /// Timing information for the request.
    pub timing: RequestTiming,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_request_params_serialization() {
        let params = RequestParams {
            url: "https://example.com".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 30000,
        };

        let json = serde_json::to_string(&params).unwrap();
        let parsed: RequestParams = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.url, "https://example.com");
        assert_eq!(parsed.method, "GET");
        assert_eq!(parsed.timeout_ms, 30000);
    }

    #[test]
    fn test_request_params_with_headers() {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        headers.insert("Authorization".to_string(), "Bearer token123".to_string());

        let params = RequestParams {
            url: "https://api.example.com/data".to_string(),
            method: "POST".to_string(),
            headers,
            body: Some(r#"{"key": "value"}"#.to_string()),
            timeout_ms: 5000,
        };

        assert_eq!(params.headers.len(), 2);
        assert_eq!(
            params.headers.get("Content-Type"),
            Some(&"application/json".to_string())
        );
        assert!(params.body.is_some());
    }

    #[test]
    fn test_http_response_serialization() {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());

        let response = HttpResponse {
            status: 200,
            status_text: "OK".to_string(),
            headers,
            body: r#"{"result": "success"}"#.to_string(),
            timing: RequestTiming {
                total_ms: 150,
                dns_ms: Some(10),
                connect_ms: Some(20),
                tls_ms: Some(30),
                first_byte_ms: Some(50),
            },
        };

        let json = serde_json::to_string(&response).unwrap();
        let parsed: HttpResponse = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.status, 200);
        assert_eq!(parsed.status_text, "OK");
        assert_eq!(parsed.timing.total_ms, 150);
        assert_eq!(parsed.timing.dns_ms, Some(10));
    }

    #[test]
    fn test_request_timing_default() {
        let timing = RequestTiming::default();

        assert_eq!(timing.total_ms, 0);
        assert!(timing.dns_ms.is_none());
        assert!(timing.connect_ms.is_none());
        assert!(timing.tls_ms.is_none());
        assert!(timing.first_byte_ms.is_none());
    }

    #[test]
    fn test_default_timeout() {
        let json = r#"{"url": "https://example.com", "method": "GET"}"#;
        let params: RequestParams = serde_json::from_str(json).unwrap();

        assert_eq!(params.timeout_ms, 30000);
    }
}
