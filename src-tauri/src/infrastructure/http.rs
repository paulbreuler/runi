// HTTP execution command handler using curl for detailed timing

use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
use curl::easy::{Easy2, Handler, List, WriteError};
use std::collections::HashMap;
use std::time::Duration;

/// Handler for collecting HTTP response data from curl.
struct ResponseCollector {
    /// HTTP status code extracted from headers.
    status_code: u32,
    /// HTTP status text (e.g., "OK", "Not Found").
    status_text: String,
    /// Response headers as key-value pairs.
    headers: Vec<(String, String)>,
    /// Response body bytes.
    body: Vec<u8>,
    /// Whether we've parsed the status line.
    status_parsed: bool,
}

impl ResponseCollector {
    const fn new() -> Self {
        Self {
            status_code: 0,
            status_text: String::new(),
            headers: Vec::new(),
            body: Vec::new(),
            status_parsed: false,
        }
    }
}

impl Handler for ResponseCollector {
    fn write(&mut self, data: &[u8]) -> Result<usize, WriteError> {
        self.body.extend_from_slice(data);
        Ok(data.len())
    }

    fn header(&mut self, data: &[u8]) -> bool {
        // Parse header line
        if let Ok(line) = std::str::from_utf8(data) {
            let line = line.trim();

            // Skip empty lines
            if line.is_empty() {
                return true;
            }

            // Check for HTTP status line (e.g., "HTTP/1.1 200 OK" or "HTTP/2 200")
            if line.starts_with("HTTP/") {
                // Reset for potential redirects - we want the final status
                self.status_parsed = false;
                self.headers.clear();

                let parts: Vec<&str> = line.splitn(3, ' ').collect();
                if parts.len() >= 2 {
                    if let Ok(code) = parts[1].parse::<u32>() {
                        self.status_code = code;
                        self.status_text = if parts.len() >= 3 {
                            parts[2].to_string()
                        } else {
                            // HTTP/2 doesn't include status text, provide standard one
                            status_text_for_code(code)
                        };
                        self.status_parsed = true;
                    }
                }
                return true;
            }

            // Regular header line (key: value)
            if self.status_parsed {
                if let Some((key, value)) = line.split_once(':') {
                    self.headers
                        .push((key.trim().to_string(), value.trim().to_string()));
                }
            }
        }
        true
    }
}

/// Returns standard status text for common HTTP status codes.
fn status_text_for_code(code: u32) -> String {
    match code {
        100 => "Continue",
        101 => "Switching Protocols",
        200 => "OK",
        201 => "Created",
        202 => "Accepted",
        204 => "No Content",
        301 => "Moved Permanently",
        302 => "Found",
        304 => "Not Modified",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        408 => "Request Timeout",
        409 => "Conflict",
        410 => "Gone",
        422 => "Unprocessable Entity",
        429 => "Too Many Requests",
        500 => "Internal Server Error",
        501 => "Not Implemented",
        502 => "Bad Gateway",
        503 => "Service Unavailable",
        504 => "Gateway Timeout",
        _ => "Unknown",
    }
    .to_string()
}

/// Configure the HTTP method on the curl handle.
fn configure_method(
    easy: &mut Easy2<ResponseCollector>,
    method: &str,
    body: Option<&str>,
) -> Result<(), String> {
    let method_upper = method.to_uppercase();

    // Validate method doesn't contain invalid characters
    if method_upper.contains(' ') || method_upper.contains('\n') || method_upper.contains('\r') {
        return Err(format!(
            "Invalid HTTP method '{method}': contains invalid characters"
        ));
    }

    match method_upper.as_str() {
        "GET" => easy
            .get(true)
            .map_err(|e| format!("Failed to set GET: {e}"))?,
        "POST" => {
            easy.post(true)
                .map_err(|e| format!("Failed to set POST: {e}"))?;
            let data = body.unwrap_or("");
            easy.post_fields_copy(data.as_bytes())
                .map_err(|e| format!("Failed to set body: {e}"))?;
        }
        "PUT" => {
            easy.upload(true)
                .map_err(|e| format!("Failed to set PUT: {e}"))?;
            easy.custom_request("PUT")
                .map_err(|e| format!("Failed to set PUT: {e}"))?;
            if let Some(b) = body {
                easy.post_fields_copy(b.as_bytes())
                    .map_err(|e| format!("Failed to set body: {e}"))?;
            }
        }
        "HEAD" => easy
            .nobody(true)
            .map_err(|e| format!("Failed to set HEAD: {e}"))?,
        _ => {
            // PATCH, DELETE, OPTIONS, and extension methods
            easy.custom_request(&method_upper)
                .map_err(|e| format!("Failed to set {method_upper}: {e}"))?;
            if let Some(b) = body {
                easy.post_fields_copy(b.as_bytes())
                    .map_err(|e| format!("Failed to set body: {e}"))?;
            }
        }
    }
    Ok(())
}

/// Extract timing information from completed curl handle.
fn extract_timing(easy: &Easy2<ResponseCollector>) -> RequestTiming {
    let dns_time = easy.namelookup_time().unwrap_or_default();
    let connect_time = easy.connect_time().unwrap_or_default();
    let appconnect_time = easy.appconnect_time().unwrap_or_default();
    let starttransfer_time = easy.starttransfer_time().unwrap_or_default();
    let total_time = easy.total_time().unwrap_or_default();

    // Calculate individual phase durations (libcurl times are cumulative)
    let dns_ms = duration_to_ms(dns_time);
    let connect_ms = duration_to_ms(connect_time.saturating_sub(dns_time));
    let tls_ms = if appconnect_time > connect_time {
        Some(duration_to_ms(appconnect_time.saturating_sub(connect_time)))
    } else {
        Some(0) // HTTP connection, no TLS
    };
    let first_byte_ms = duration_to_ms(starttransfer_time);
    let total_ms = duration_to_ms(total_time);

    RequestTiming {
        total_ms,
        dns_ms: Some(dns_ms),
        connect_ms: Some(connect_ms),
        tls_ms,
        first_byte_ms: Some(first_byte_ms),
    }
}

/// Build the HTTP response from curl handle.
fn build_response(easy: &Easy2<ResponseCollector>, timing: RequestTiming) -> HttpResponse {
    let collector = easy.get_ref();

    // Convert headers to HashMap
    let headers: HashMap<String, String> = collector
        .headers
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();

    let body = String::from_utf8_lossy(&collector.body).to_string();
    let status_code = easy.response_code().unwrap_or(collector.status_code);
    let status = u16::try_from(status_code).unwrap_or(500);
    let status_text = if collector.status_text.is_empty() {
        status_text_for_code(status_code)
    } else {
        collector.status_text.clone()
    };

    HttpResponse {
        status,
        status_text,
        headers,
        body,
        timing,
    }
}

/// Execute an HTTP request synchronously using curl.
fn execute_request_sync(params: &RequestParams) -> Result<HttpResponse, String> {
    let mut easy = Easy2::new(ResponseCollector::new());

    // Configure connection
    easy.url(&params.url)
        .map_err(|e| format!("Invalid URL '{}': {e}", params.url))?;
    easy.timeout(Duration::from_millis(params.timeout_ms))
        .map_err(|e| format!("Failed to set timeout: {e}"))?;
    easy.http_version(curl::easy::HttpVersion::V2TLS)
        .map_err(|e| format!("Failed to set HTTP version: {e}"))?;
    easy.follow_location(true)
        .map_err(|e| format!("Failed to configure redirects: {e}"))?;

    // Configure method and body
    configure_method(&mut easy, &params.method, params.body.as_deref())?;

    // Set headers
    let mut header_list = List::new();
    for (key, value) in &params.headers {
        header_list
            .append(&format!("{key}: {value}"))
            .map_err(|e| format!("Failed to add header '{key}': {e}"))?;
    }
    easy.http_headers(header_list)
        .map_err(|e| format!("Failed to set headers: {e}"))?;

    // Perform request
    easy.perform().map_err(|e| format!("Request failed: {e}"))?;

    // Extract timing and build response
    let timing = extract_timing(&easy);
    Ok(build_response(&easy, timing))
}

/// Convert Duration to milliseconds as u64.
fn duration_to_ms(d: Duration) -> u64 {
    // Safe: HTTP request duration in milliseconds will never exceed u64::MAX
    u64::try_from(d.as_millis()).unwrap_or(u64::MAX)
}

/// Execute an HTTP request with the given parameters.
///
/// Uses the curl library to capture detailed timing breakdown including
/// DNS resolution, TCP connect, TLS handshake, and time to first byte.
///
/// # Errors
///
/// Returns an error string if the request fails due to network issues,
/// invalid URL, timeout, or other HTTP client errors.
#[tauri::command]
pub async fn execute_request(params: RequestParams) -> Result<HttpResponse, String> {
    // Move blocking curl operation to a dedicated thread
    tokio::task::spawn_blocking(move || execute_request_sync(&params))
        .await
        .map_err(|e| format!("Task execution failed: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_request_get() {
        let params = RequestParams {
            url: "https://httpbin.org/get".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed: {result:?}");

        let response = result.unwrap();
        assert_eq!(response.status, 200);
        assert_eq!(response.status_text, "OK");
        assert!(response.timing.total_ms > 0);
    }

    #[tokio::test]
    async fn test_execute_request_post_with_body() {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());

        let params = RequestParams {
            url: "https://httpbin.org/post".to_string(),
            method: "POST".to_string(),
            headers,
            body: Some(r#"{"test": "data"}"#.to_string()),
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed: {result:?}");

        let response = result.unwrap();
        assert_eq!(response.status, 200);
        assert!(response.body.contains("test"));
    }

    #[tokio::test]
    async fn test_execute_request_with_headers() {
        let mut headers = HashMap::new();
        headers.insert("X-Custom-Header".to_string(), "test-value".to_string());

        let params = RequestParams {
            url: "https://httpbin.org/headers".to_string(),
            method: "GET".to_string(),
            headers,
            body: None,
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed: {result:?}");

        let response = result.unwrap();
        assert_eq!(response.status, 200);
        assert!(response.body.contains("X-Custom-Header"));
    }

    #[tokio::test]
    async fn test_execute_request_invalid_url() {
        let params = RequestParams {
            url: "not-a-valid-url".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 5000,
        };

        let result = execute_request(params).await;
        assert!(result.is_err(), "Request should fail for invalid URL");
    }

    #[tokio::test]
    async fn test_execute_request_invalid_method() {
        // HTTP allows extension methods, so "INVALID" is actually valid
        // Use a method with invalid characters (space) to trigger an error
        let params = RequestParams {
            url: "https://httpbin.org/get".to_string(),
            method: "GET POST".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 5000,
        };

        let result = execute_request(params).await;
        assert!(result.is_err(), "Request should fail for method with space");
        assert!(result.unwrap_err().contains("Invalid HTTP method"));
    }

    #[tokio::test]
    async fn test_execute_request_404() {
        let params = RequestParams {
            url: "https://httpbin.org/status/404".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed even for 404");

        let response = result.unwrap();
        assert_eq!(response.status, 404);
        assert_eq!(response.status_text, "Not Found");
    }

    #[tokio::test]
    async fn test_execute_request_different_methods() {
        let methods = vec!["PUT", "PATCH", "DELETE"];

        for method in methods {
            let params = RequestParams {
                url: format!("https://httpbin.org/{}", method.to_lowercase()),
                method: method.to_string(),
                headers: HashMap::new(),
                body: None,
                timeout_ms: 10000,
            };

            let result = execute_request(params).await;
            assert!(
                result.is_ok(),
                "{method} request should succeed: {result:?}"
            );
            assert_eq!(result.unwrap().status, 200);
        }
    }

    #[tokio::test]
    async fn test_timing_fields_populated() {
        let params = RequestParams {
            url: "https://httpbin.org/get".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed: {result:?}");

        let response = result.unwrap();
        let timing = &response.timing;

        // All timing fields should be populated for HTTPS request
        assert!(timing.total_ms > 0, "total_ms should be positive");
        assert!(timing.dns_ms.is_some(), "dns_ms should be populated");
        assert!(
            timing.connect_ms.is_some(),
            "connect_ms should be populated"
        );
        assert!(timing.tls_ms.is_some(), "tls_ms should be populated");
        assert!(
            timing.first_byte_ms.is_some(),
            "first_byte_ms should be populated"
        );

        // TLS time should be > 0 for HTTPS
        assert!(
            timing.tls_ms.unwrap() > 0,
            "tls_ms should be positive for HTTPS"
        );

        // First byte should be before or equal to total
        assert!(
            timing.first_byte_ms.unwrap() <= timing.total_ms,
            "first_byte_ms should be <= total_ms"
        );
    }

    #[tokio::test]
    async fn test_http_no_tls_time() {
        // HTTP (not HTTPS) should have tls_ms = 0
        let params = RequestParams {
            url: "http://httpbin.org/get".to_string(),
            method: "GET".to_string(),
            headers: HashMap::new(),
            body: None,
            timeout_ms: 10000,
        };

        let result = execute_request(params).await;
        assert!(result.is_ok(), "Request should succeed: {result:?}");

        let response = result.unwrap();
        let timing = &response.timing;

        // TLS time should be 0 for HTTP (non-TLS) connection
        assert_eq!(timing.tls_ms, Some(0), "tls_ms should be 0 for HTTP");
    }
}
