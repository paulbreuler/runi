-- V001: Initial Schema
-- Creates the core history table for storing HTTP request/response pairs.
--
-- This migration establishes:
-- 1. The main history table with JSON-serialized request/response data
-- 2. An index on timestamp for efficient sorting and pagination
-- 3. Future-proofing with method and status columns for filtering

-- History table: stores HTTP request/response pairs
CREATE TABLE IF NOT EXISTS history (
    -- Unique identifier (UUID v4)
    id TEXT PRIMARY KEY,
    
    -- ISO 8601 timestamp of when the request was made
    timestamp TEXT NOT NULL,
    
    -- JSON-serialized RequestParams
    request_json TEXT NOT NULL,
    
    -- JSON-serialized HttpResponse
    response_json TEXT NOT NULL,
    
    -- Denormalized columns for efficient filtering (extracted from JSON)
    -- These are optional and populated by the application
    method TEXT,
    status INTEGER,
    url TEXT
);

-- Index for sorting by timestamp (newest first pagination)
CREATE INDEX IF NOT EXISTS idx_history_timestamp 
    ON history(timestamp DESC);

-- Index for filtering by HTTP method
CREATE INDEX IF NOT EXISTS idx_history_method 
    ON history(method);

-- Index for filtering by status code
CREATE INDEX IF NOT EXISTS idx_history_status 
    ON history(status);

-- Index for URL search (prefix matching)
CREATE INDEX IF NOT EXISTS idx_history_url 
    ON history(url);
