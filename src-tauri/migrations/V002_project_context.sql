-- V002: Project Context
-- Creates the project_context table for persisting user working state.
--
-- This table stores a single row (singleton pattern) representing the
-- current project context. MCP tools and the frontend read/write this
-- to understand what the user is working on.

CREATE TABLE IF NOT EXISTS project_context (
    -- Singleton key — always 'current'
    id TEXT PRIMARY KEY DEFAULT 'current',

    -- The collection the user is currently working in (nullable)
    active_collection_id TEXT,

    -- The request the user is currently focused on (nullable)
    active_request_id TEXT,

    -- Free-text investigation notes from user or AI (nullable)
    investigation_notes TEXT,

    -- JSON array of recent request IDs (max 10, most recent first)
    recent_request_ids_json TEXT NOT NULL DEFAULT '[]',

    -- JSON array of session tags
    tags_json TEXT NOT NULL DEFAULT '[]'
);

-- Insert the singleton row
INSERT OR IGNORE INTO project_context (id) VALUES ('current');
