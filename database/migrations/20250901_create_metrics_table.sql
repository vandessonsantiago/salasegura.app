-- Migration: Create metrics table for AI chat system
-- Date: September 1, 2025
-- Description: Table to persist aggregated metrics from MetricsService

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    total_interactions INTEGER DEFAULT 0,
    total_processing_time INTEGER DEFAULT 0,
    average_processing_time DECIMAL(10,2) DEFAULT 0.0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    legal_queries INTEGER DEFAULT 0,
    authenticated_users INTEGER DEFAULT 0,
    anonymous_users INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    top_topics JSONB DEFAULT '{}',
    hourly_stats JSONB DEFAULT '[]'
);

-- Index for efficient queries by timestamp
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics (timestamp);

-- Optional: Table for individual errors (if needed for detailed tracking)
CREATE TABLE IF NOT EXISTS metrics_errors (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    error_context JSONB,
    user_id TEXT,
    resolved BOOLEAN DEFAULT FALSE
);

-- Index for error tracking
CREATE INDEX IF NOT EXISTS idx_metrics_errors_timestamp ON metrics_errors (timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_errors_resolved ON metrics_errors (resolved);

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE ON metrics TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON metrics_errors TO authenticated;
