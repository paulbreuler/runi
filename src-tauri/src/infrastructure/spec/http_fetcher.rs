//! HTTP/file/inline content fetcher adapter for the `ContentFetcher` port.
//!
//! Handles all three `SpecSource` variants:
//! - `Url` → HTTP GET via `reqwest` (with httpbin fallback)
//! - `File` → `tokio::fs::read_to_string`
//! - `Inline` → passthrough (no I/O)

use async_trait::async_trait;

use crate::domain::collection::spec_port::{ContentFetcher, FetchResult, SpecSource};

use super::fetcher::fetch_openapi_spec;

/// `ContentFetcher` adapter that handles HTTP, file, and inline sources.
pub struct HttpContentFetcher;

#[async_trait]
impl ContentFetcher for HttpContentFetcher {
    async fn fetch(&self, source: &SpecSource) -> Result<FetchResult, String> {
        let now = chrono::Utc::now();
        let fetched_at = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

        match source {
            SpecSource::Url(url) => {
                // Delegate to existing fetcher (has httpbin fallback logic)
                fetch_openapi_spec(url).await
            }
            SpecSource::File(path) => {
                let content = tokio::fs::read_to_string(path)
                    .await
                    .map_err(|e| format!("Failed to read file {}: {e}", path.display()))?;
                Ok(FetchResult {
                    content,
                    source_url: path.display().to_string(),
                    is_fallback: false,
                    fetched_at,
                })
            }
            SpecSource::Inline(content) => Ok(FetchResult {
                content: content.clone(),
                source_url: "inline".to_string(),
                is_fallback: false,
                fetched_at,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_inline_passthrough() {
        let fetcher = HttpContentFetcher;
        let content = r#"{"openapi":"3.0.0"}"#;
        let result = fetcher
            .fetch(&SpecSource::Inline(content.to_string()))
            .await;

        assert!(result.is_ok());
        let fetch = result.unwrap();
        assert_eq!(fetch.content, content);
        assert_eq!(fetch.source_url, "inline");
        assert!(!fetch.is_fallback);
        assert!(fetch.fetched_at.ends_with('Z'));
    }

    #[tokio::test]
    async fn test_fetch_file_not_found() {
        let fetcher = HttpContentFetcher;
        let result = fetcher
            .fetch(&SpecSource::File("/nonexistent/path/spec.json".into()))
            .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read file"));
    }
}
