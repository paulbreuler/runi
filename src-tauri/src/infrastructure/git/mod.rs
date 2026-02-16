//! Git infrastructure adapters.
//!
//! Implements the `GitMetadataPort` domain port using the git CLI.

pub mod cli_adapter;

pub use cli_adapter::GitCliAdapter;
