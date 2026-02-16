#![allow(dead_code)]

//! Domain ports for pluggable spec import (hexagonal architecture).
//!
//! This module defines the format-agnostic intermediate representation (IR)
//! and port traits for spec parsing and content fetching. Infrastructure
//! adapters implement these traits for specific formats (`OpenAPI`, Postman, etc.)
//! and transport mechanisms (HTTP, filesystem, etc.).
//!
//! # Architecture
//!
//! ```text
//! Source Format ──parser──▶ ParsedSpec (IR) ──converter──▶ Collection
//!                               ▲
//! OpenAPI ────────────────────┤
//! Postman ────────────────────┤  (N parsers, 1 converter)
//! Bruno ──────────────────────┘
//! ```
//!
//! IMPORTANT: This module must have ZERO infrastructure dependencies.
//! No `reqwest`, no `openapiv3`, no `tokio::fs`.

use std::collections::BTreeMap;
use std::fmt;
use std::path::PathBuf;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use super::source::SourceType;

// ── Intermediate Representation (format-agnostic) ──────────────────

/// The canonical IR that all format parsers target.
///
/// Designed to be a superset of what all spec formats can express.
/// Each parser transpiles its native representation into this IR,
/// then a single shared converter transpiles IR into `Collection`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedSpec {
    /// Spec title (e.g., "httpbin.org").
    pub title: String,
    /// Spec version from info.version (e.g., "0.9.2").
    pub version: Option<String>,
    /// Spec description.
    pub description: Option<String>,
    /// Server/base URLs — plural to preserve multi-server specs.
    pub base_urls: Vec<ParsedServer>,
    /// All endpoints extracted from the spec.
    pub endpoints: Vec<ParsedEndpoint>,
    /// Security/auth schemes defined in the spec.
    pub auth_schemes: Vec<ParsedAuthScheme>,
    /// Collection-level variables (e.g., Postman variables).
    pub variables: BTreeMap<String, String>,
}

/// A server/base URL from the spec.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedServer {
    /// Server URL (e.g., `https://httpbin.org`).
    pub url: String,
    /// Optional description of this server.
    pub description: Option<String>,
}

/// A single endpoint extracted from a spec.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedEndpoint {
    /// Unique operation identifier (may be generated if missing).
    pub operation_id: Option<String>,
    /// HTTP method (GET, POST, etc.) — always uppercase.
    pub method: String,
    /// URL path (e.g., "/users/{id}").
    pub path: String,
    /// Short summary of the operation.
    pub summary: Option<String>,
    /// Detailed description.
    pub description: Option<String>,
    /// Tags for grouping.
    pub tags: Vec<String>,
    /// Parameters (path, query, header).
    pub parameters: Vec<ParsedParameter>,
    /// Request body definition (if any).
    pub request_body: Option<ParsedRequestBody>,
    /// Whether this endpoint is deprecated.
    pub deprecated: bool,
    /// Whether this endpoint streams (SSE, WebSocket, etc.).
    pub is_streaming: bool,
}

/// Where a parameter lives in the request.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ParameterLocation {
    /// URL path parameter (e.g., `/users/{id}`).
    Path,
    /// Query string parameter.
    Query,
    /// HTTP header parameter.
    Header,
}

/// A request parameter extracted from a spec.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedParameter {
    /// Parameter name.
    pub name: String,
    /// Where this parameter goes (path, query, header).
    pub location: ParameterLocation,
    /// Whether this parameter is required.
    pub required: bool,
    /// Schema type hint (e.g., "string", "integer").
    pub schema_type: Option<String>,
    /// Default value if any.
    pub default_value: Option<String>,
    /// Parameter description.
    pub description: Option<String>,
}

/// Request body definition from a spec.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedRequestBody {
    /// Content type (e.g., "application/json").
    pub content_type: Option<String>,
    /// JSON schema fragment hint.
    pub schema_hint: Option<String>,
    /// Example body content.
    pub example: Option<String>,
    /// Whether the body is required.
    pub required: bool,
}

/// Authentication scheme from a spec.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedAuthScheme {
    /// Scheme type (e.g., "bearer", "apiKey", "basic", "oauth2").
    pub scheme_type: String,
    /// Header/query param name for API key auth.
    pub name: Option<String>,
    /// Where the auth goes ("header", "query").
    pub location: Option<String>,
    /// Description of the scheme.
    pub description: Option<String>,
}

// ── Port: Spec Parser ──────────────────────────────────────────────

/// Port for format-specific spec parsing.
///
/// Each adapter parses one source format into the shared IR.
/// Implements the Strategy pattern (`GoF`) — selected at runtime
/// via `can_parse()` content sniffing.
///
/// This trait is intentionally **sync** — parsing is CPU-bound (no I/O).
pub trait SpecParser: Send + Sync {
    /// The source type this parser handles.
    fn source_type(&self) -> SourceType;

    /// Human-readable format name for error messages.
    fn format_name(&self) -> &'static str;

    /// Content sniffing — can this parser handle the given content?
    ///
    /// Must be cheap: check magic bytes or top-level keys, not full parse.
    fn can_parse(&self, content: &str) -> bool;

    /// Parse raw content into the canonical IR.
    ///
    /// This is the "transpile" step: source format → `ParsedSpec`.
    ///
    /// # Errors
    ///
    /// Returns `SpecParseError` with enough context to distinguish
    /// "wrong format" (try next parser) from "right format, malformed"
    /// (report error to user).
    fn parse(&self, content: &str) -> Result<ParsedSpec, SpecParseError>;
}

// ── Port: Content Fetcher ──────────────────────────────────────────

/// Port for fetching spec content from various sources.
///
/// Decouples transport (HTTP, filesystem, git) from parsing.
/// This trait is **async** — fetching is I/O-bound.
#[async_trait]
pub trait ContentFetcher: Send + Sync {
    /// Fetch content from the given source.
    ///
    /// # Errors
    ///
    /// Returns an error string if the content cannot be fetched.
    async fn fetch(&self, source: &SpecSource) -> Result<FetchResult, String>;
}

// ── Source & Result Types ──────────────────────────────────────────

/// Where to fetch spec content from — sum type, not stringly-typed.
///
/// Makes illegal states unrepresentable: you can't pass both URL and file,
/// and you can't pass neither.
#[derive(Debug, Clone)]
pub enum SpecSource {
    /// Fetch from a URL via HTTP(S).
    Url(String),
    /// Read from a local file.
    File(PathBuf),
    /// Raw content for testing or piped input.
    Inline(String),
}

/// Result of fetching spec content.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FetchResult {
    /// The raw spec content.
    pub content: String,
    /// The source URL or path (for provenance tracking).
    pub source_url: String,
    /// Whether this is a fallback (e.g., bundled spec).
    pub is_fallback: bool,
    /// When the content was fetched (RFC 3339 UTC with Z suffix).
    pub fetched_at: String,
}

// ── Errors ─────────────────────────────────────────────────────────

/// Errors from spec parsing.
///
/// Distinguished variants enable the auto-detection chain:
/// `InvalidFormat` means "try the next parser",
/// `MalformedSpec` means "this parser matched but the content is broken".
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SpecParseError {
    /// Content doesn't match expected format (try next parser).
    InvalidFormat(String),
    /// Content matches format but has structural errors.
    MalformedSpec {
        /// Which format was detected.
        format: String,
        /// What went wrong.
        detail: String,
    },
    /// Unsupported spec version.
    UnsupportedVersion {
        /// Which format was detected.
        format: String,
        /// The unsupported version string.
        version: String,
    },
}

impl fmt::Display for SpecParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidFormat(msg) => write!(f, "Invalid format: {msg}"),
            Self::MalformedSpec { format, detail } => {
                write!(f, "Malformed {format} spec: {detail}")
            }
            Self::UnsupportedVersion { format, version } => {
                write!(f, "Unsupported {format} version: {version}")
            }
        }
    }
}

impl std::error::Error for SpecParseError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spec_parse_error_display() {
        let err = SpecParseError::InvalidFormat("not JSON".to_string());
        assert_eq!(err.to_string(), "Invalid format: not JSON");

        let err = SpecParseError::MalformedSpec {
            format: "OpenAPI".to_string(),
            detail: "missing paths".to_string(),
        };
        assert_eq!(err.to_string(), "Malformed OpenAPI spec: missing paths");

        let err = SpecParseError::UnsupportedVersion {
            format: "OpenAPI".to_string(),
            version: "4.0.0".to_string(),
        };
        assert_eq!(err.to_string(), "Unsupported OpenAPI version: 4.0.0");
    }

    #[test]
    fn test_parsed_spec_creation() {
        let spec = ParsedSpec {
            title: "Test API".to_string(),
            version: Some("1.0.0".to_string()),
            description: None,
            base_urls: vec![ParsedServer {
                url: "https://api.test.com".to_string(),
                description: None,
            }],
            endpoints: vec![],
            auth_schemes: vec![],
            variables: BTreeMap::new(),
        };
        assert_eq!(spec.title, "Test API");
        assert!(spec.endpoints.is_empty());
    }

    #[test]
    fn test_spec_source_variants() {
        let url = SpecSource::Url("https://example.com/spec.json".to_string());
        let file = SpecSource::File(PathBuf::from("/tmp/spec.json"));
        let inline = SpecSource::Inline("{}".to_string());

        // Ensure variants are constructable and debuggable
        assert!(format!("{url:?}").contains("Url"));
        assert!(format!("{file:?}").contains("File"));
        assert!(format!("{inline:?}").contains("Inline"));
    }

    #[test]
    fn test_fetch_result_creation() {
        let result = FetchResult {
            content: "{}".to_string(),
            source_url: "https://example.com/spec.json".to_string(),
            is_fallback: false,
            fetched_at: "2026-01-31T10:30:00Z".to_string(),
        };
        assert!(!result.is_fallback);
        assert!(result.fetched_at.ends_with('Z'));
    }

    #[test]
    fn test_parameter_location_serializes_snake_case() {
        let yaml = serde_yaml_ng::to_string(&ParameterLocation::Query).unwrap();
        assert!(yaml.contains("query"));
    }
}
