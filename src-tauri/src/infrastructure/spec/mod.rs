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

pub mod converter;
pub mod fetcher;
pub mod hasher;
pub mod http_fetcher;
pub mod openapi_parser;
pub mod openapi_types;
pub mod parser;
pub mod streaming;
