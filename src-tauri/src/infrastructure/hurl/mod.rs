//! Hurl CLI infrastructure adapter.
//!
//! Implements the `TestRunner` domain port for the [Hurl](https://hurl.dev) CLI tool.
//! Uses `std::process::Command` with explicit argument arrays — **never shell interpolation**.

pub mod runner;

pub use runner::HurlRunner;
