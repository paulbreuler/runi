// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Application layer - Use cases and services

/// Spec import orchestration — pluggable format detection and conversion.
pub mod import_service;
/// MCP server application service — tool registry, dispatch, and collection CRUD.
pub mod mcp_server_service;
/// Project context service — persistent user working state.
pub mod project_context_service;
/// HTTP proxy application service.
pub mod proxy_service;
/// Suggestion service — AI suggestion CRUD with TOML file persistence.
pub mod suggestion_service;
