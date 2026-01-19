-- V001: Initial Schema
-- Creates the core history table for storing HTTP request/response pairs.
--
-- This migration establishes:
-- 1. The main history table with JSON-serialized request/response data
-- 2. Indexes for efficient sorting, pagination, and filtering
-- 3. Denormalized columns for performant filtering without JSON parsing
--
-- UUID v7 IDs:
-- IDs use UUID v7 format (time-ordered) which provides:
-- - Natural chronological sorting by ID
-- - Reduced B-tree fragmentation for better insert performance
-- - Embedded timestamp (first 48 bits = Unix timestamp in ms)

-- History table: stores HTTP request/response pairs
CREATE TABLE IF NOT EXISTS history (
    -- Unique identifier (UUID v7, time-ordered)
    -- Format: hist_<32-char-hex> (e.g., hist_0192c7e5a1234567890abcdef1234567)
    id TEXT PRIMARY KEY,
    
    -- ISO 8601 timestamp of when the request was made
    -- Stored as TEXT for SQLite compatibility with datetime functions
    timestamp TEXT NOT NULL,
    
    -- JSON-serialized RequestParams
    request_json TEXT NOT NULL,
    
    -- JSON-serialized HttpResponse
    response_json TEXT NOT NULL,
    
    -- Denormalized columns for efficient filtering (extracted from JSON)
    -- These avoid JSON parsing for common filter operations
    method TEXT,           -- HTTP method (GET, POST, PUT, DELETE, etc.)
    status INTEGER,        -- HTTP status code (200, 404, 500, etc.)
    url TEXT              -- Full request URL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary sorting: timestamp descending (newest first)
-- Used for: default list view, pagination
CREATE INDEX IF NOT EXISTS idx_history_timestamp 
    ON history(timestamp DESC);

-- HTTP method filtering
-- Used for: filter by GET/POST/PUT/DELETE
CREATE INDEX IF NOT EXISTS idx_history_method 
    ON history(method);

-- Status code filtering  
-- Used for: filter by 2xx/3xx/4xx/5xx ranges
CREATE INDEX IF NOT EXISTS idx_history_status 
    ON history(status);

-- URL search (prefix matching and equality)
-- Used for: search by URL, filter by domain
CREATE INDEX IF NOT EXISTS idx_history_url 
    ON history(url);

-- Composite index: method + timestamp
-- Used for: "show all GET requests, newest first"
CREATE INDEX IF NOT EXISTS idx_history_method_timestamp 
    ON history(method, timestamp DESC);

-- Composite index: status + timestamp
-- Used for: "show all 4xx errors, newest first"
CREATE INDEX IF NOT EXISTS idx_history_status_timestamp 
    ON history(status, timestamp DESC);
