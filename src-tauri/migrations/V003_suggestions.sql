-- V003: Suggestions
-- Creates the suggestions table for the Vigilance Monitor.
--
-- Stores AI-generated suggestions (drift fixes, schema updates, test gaps,
-- optimizations) that surface in the Vigilance Monitor panel.

CREATE TABLE IF NOT EXISTS suggestions (
    -- Unique identifier (UUID v7)
    id TEXT PRIMARY KEY,

    -- Category: drift_fix, schema_update, test_gap, optimization
    suggestion_type TEXT NOT NULL,

    -- Short human-readable title
    title TEXT NOT NULL,

    -- Detailed description of the issue or opportunity
    description TEXT NOT NULL,

    -- Lifecycle status: pending, accepted, dismissed
    status TEXT NOT NULL DEFAULT 'pending',

    -- Actor attribution (which AI model created it)
    source TEXT NOT NULL,

    -- Linked collection ID (nullable)
    collection_id TEXT,

    -- Linked request ID (nullable)
    request_id TEXT,

    -- Linked endpoint path (nullable)
    endpoint TEXT,

    -- What action to take
    action TEXT NOT NULL,

    -- When the suggestion was created (ISO 8601)
    created_at TEXT NOT NULL,

    -- When the suggestion was resolved (ISO 8601, nullable)
    resolved_at TEXT
);

-- Index for listing pending suggestions efficiently
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
