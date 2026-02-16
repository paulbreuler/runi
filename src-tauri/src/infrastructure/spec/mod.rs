//! Spec processing pipeline with pluggable format support.
//!
//! Architecture: Hexagonal ports (domain) + adapters (infrastructure).
//!
//! - `openapi_parser`: `SpecParser` adapter for `OpenAPI` 3.x / Swagger 2.0
//! - `http_fetcher`: `ContentFetcher` adapter for HTTP, file, and inline sources
//! - `parser`, `converter`, `fetcher`: Internal implementation details
//!
//! Key differentiators vs competitors:
//! - Hash tracking for drift detection
//! - Streaming endpoint detection
//! - Bundled fallback for offline operation
//!
//! IMPORTANT: Uses `serde_yaml_ng` (NOT `serde_yaml` which is archived)

/// `OpenAPI` to Collection converter.
pub mod converter;
/// HTTP/file/inline content fetcher.
pub mod fetcher;
/// Spec content hasher for drift detection.
pub mod hasher;
/// ContentFetcher adapter for HTTP, file, and inline sources.
pub mod http_fetcher;
/// SpecParser adapter for OpenAPI 3.x / Swagger 2.0.
pub mod openapi_parser;
/// OpenAPI-specific internal types.
pub mod openapi_types;
/// `OpenAPI` spec parser implementation.
pub mod parser;
/// Streaming endpoint detection utilities.
pub mod streaming;
