// HTTP execution command handler

use crate::domain::http::{HttpResponse, RequestParams, RequestTiming};
use reqwest::{header::HeaderMap, header::HeaderName, header::HeaderValue, Client, Method};
use std::collections::HashMap;
use std::str::FromStr;
use std::time::Instant;

/// Execute an HTTP request with the given parameters.
///
/// # Errors
///
/// Returns an error string if the request fails due to network issues,
/// invalid URL, timeout, or other HTTP client errors.
#[tauri::command]
pub async fn execute_request(params: RequestParams) -> Result<HttpResponse, String> {
    let start = Instant::now();

    // Build the HTTP client with HTTP/2 enabled by default
    let client = Client::builder()
        .timeout(std::time::Duration::from_millis(params.timeout_ms))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    // Parse HTTP method
    let method = Method::from_str(&params.method.to_uppercase())
        .map_err(|e| format!("Invalid HTTP method '{}': {e}", params.method))?;

    // Build request headers
    let mut header_map = HeaderMap::new();
    for (key, value) in &params.headers {
        let header_name =
            HeaderName::from_str(key).map_err(|e| format!("Invalid header name '{key}': {e}"))?;
        let header_value = HeaderValue::from_str(value)
            .map_err(|e| format!("Invalid header value for '{key}': {e}"))?;
        header_map.insert(header_name, header_value);
    }

    // Build and send request
    let mut request_builder = client.request(method, &params.url).headers(header_map);

    if let Some(body) = &params.body {
        request_builder = request_builder.body(body.clone());
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    let elapsed = start.elapsed();

    // Extract status info before consuming the response
    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("Unknown")
        .to_string();

    // Convert response headers to HashMap
    let mut headers = HashMap::new();
    for (name, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(name.to_string(), v.to_string());
        }
    }

    // Read response body
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    // Build timing info (detailed timing requires connection events which
    // reqwest doesn't expose directly, so we only have total time)
    #[allow(clippy::cast_possible_truncation)]
    // HTTP request duration will never exceed u64::MAX ms
    let timing = RequestTiming {
        total_ms: elapsed.as_millis() as u64,
        dns_ms: None,
        connect_ms: None,
        tls_ms: None,
        first_byte_ms: None,
    };

    Ok(HttpResponse {
        status,
        status_text,
        headers,
        body,
        timing,
    })
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
}
