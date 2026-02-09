// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Infrastructure layer - External interfaces (Tauri commands, networking)

pub mod commands;
pub mod http;
pub mod logging;
/// MCP infrastructure adapters and transports.
pub mod mcp;
pub mod memory_monitor;
pub mod spec;
pub mod storage;
