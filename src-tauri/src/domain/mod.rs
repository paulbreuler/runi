// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Domain layer - Core business logic and models

/// Canvas state domain models and snapshots.
pub mod canvas_state;
/// Collection domain models.
pub mod collection;
pub mod errors;
pub mod features;
pub mod http;
/// MCP domain models and protocol types.
pub mod mcp;
pub mod models;
/// Participant identity and Lamport timestamps for multiplayer-like provenance.
pub mod participant;
/// Project context — persistent user working state for MCP and AI agents.
pub mod project_context;
/// AI suggestion domain models for the Vigilance Monitor.
pub mod suggestion;
