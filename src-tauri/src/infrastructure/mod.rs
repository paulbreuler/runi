// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Infrastructure layer - External interfaces (Tauri commands, networking)

pub mod commands;
/// Git metadata infrastructure adapters.
pub mod git;
pub mod http;
/// Hurl CLI adapter for test execution.
pub mod hurl;
pub mod logging;
/// MCP infrastructure adapters and transports.
pub mod mcp;
pub mod memory_monitor;
pub mod spec;
pub mod storage;
