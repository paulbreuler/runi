//! `OpenAPI` spec processing pipeline.
//!
//! Flow: fetch → parse → convert → collection
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
pub mod openapi_types;
pub mod parser;
pub mod streaming;
