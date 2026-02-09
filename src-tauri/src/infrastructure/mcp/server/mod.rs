// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP server infrastructure — dispatcher, HTTP/SSE transport, session management.

/// JSON-RPC method dispatcher — routes requests to handlers.
pub mod dispatcher;
/// Axum HTTP/SSE transport for the MCP server.
pub mod http_sse;
/// Session management with `Mcp-Session-Id` tracking.
pub mod session;
