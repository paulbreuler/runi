// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP (Model Context Protocol) domain types and configuration.

/// MCP server configuration loading and validation.
pub mod config;
/// Event emitter trait for decoupled Tauri event emission.
pub mod events;
/// JSON-RPC 2.0 request/response/error types.
pub mod jsonrpc;
/// MCP protocol types (initialize, tools/list, tools/call).
pub mod protocol;
/// Transport trait abstraction for MCP message passing.
pub mod transport;
/// Domain types for MCP server and tool metadata.
pub mod types;
