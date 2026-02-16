//! Hurl CLI infrastructure adapter.
//!
//! Implements the `TestRunner` domain port for the [Hurl](https://hurl.dev) CLI tool.
//! Uses `std::process::Command` with explicit argument arrays — **never shell interpolation**.

/// Hurl CLI runner implementation.
pub mod runner;

/// Re-export the Hurl runner implementation.
pub use runner::HurlRunner;
