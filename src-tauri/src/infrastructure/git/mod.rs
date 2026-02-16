//! Git infrastructure adapters.
//!
//! Implements the `GitMetadataPort` domain port using the git CLI.

/// Git CLI adapter for resolving commit metadata.
pub mod cli_adapter;

/// Re-export the CLI adapter implementation.
pub use cli_adapter::GitCliAdapter;
