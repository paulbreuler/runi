// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP infrastructure — server transport, dispatcher, and Tauri command handlers.

/// Tauri command handlers for MCP server lifecycle.
pub mod commands;
/// In-memory transport for testing without HTTP.
pub mod fake_transport;
/// HTTP/SSE server, dispatcher, and session management.
pub mod server;
