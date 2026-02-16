#![allow(dead_code)]

use std::time::Duration;

use crate::domain::collection::spec_port::FetchResult;

const HTTPBIN_SPEC_URL: &str = "https://httpbin.org/spec.json";
const FETCH_TIMEOUT: Duration = Duration::from_secs(5);

/// Fetch `OpenAPI` spec from URL with fallback to bundled spec.
///
/// # Strategy
/// 1. Try network fetch with 5s timeout
/// 2. On failure, use bundled httpbin spec
/// 3. Always return `FetchResult` (never fail for httpbin)
///
/// # Why Network-First
/// - Catches upstream spec changes
/// - Bundled spec is outdated fallback
/// - User sees latest API structure
pub async fn fetch_openapi_spec(url: &str) -> Result<FetchResult, String> {
    let now = chrono::Utc::now();
    let fetched_at = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // Try network fetch
    match fetch_from_network(url).await {
        Ok(content) => Ok(FetchResult {
            content,
            source_url: url.to_string(),
            is_fallback: false,
            fetched_at,
        }),
        Err(e) => {
            // Fall back to bundled spec for httpbin
            if url == HTTPBIN_SPEC_URL || url.contains("httpbin") {
                let bundled = include_str!("../../../assets/httpbin-openapi.json");
                Ok(FetchResult {
                    content: bundled.to_string(),
                    source_url: url.to_string(),
                    is_fallback: true,
                    fetched_at,
                })
            } else {
                Err(format!("Failed to fetch spec: {e}"))
            }
        }
    }
}

async fn fetch_from_network(url: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(FETCH_TIMEOUT)
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    response.text().await.map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_returns_fallback_on_invalid_url() {
        let result = fetch_openapi_spec("https://invalid.httpbin.test/spec.json").await;
        assert!(result.is_ok());
        let fetch_result = result.unwrap();
        assert!(fetch_result.is_fallback);
        assert!(!fetch_result.content.is_empty());
    }

    #[tokio::test]
    async fn test_fetch_fails_for_non_httpbin() {
        let result = fetch_openapi_spec("https://invalid.example.com/spec.json").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_fetched_at_uses_utc_z_suffix() {
        let result = fetch_openapi_spec("https://httpbin.org/spec.json").await;
        // Will either succeed or fallback, both should have Z suffix
        let fetch_result = result.unwrap();
        assert!(fetch_result.fetched_at.ends_with('Z'));
    }
}
