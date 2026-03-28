-- Bloomberg Terminal Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Create market_data table for storing market information
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rate_limits table for API rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Public (anon) clients can only SELECT - all mutations require service role
CREATE POLICY "Allow public read access to market_data" ON market_data
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to rate_limits" ON rate_limits
    FOR SELECT USING (true);

-- NOTE: INSERT/UPDATE/DELETE on market_data and rate_limits are restricted.
-- Only the service_role client (server-side) can perform mutations.
-- The service role bypasses RLS by default.

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_data_created_at ON market_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_updated_at ON market_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$;

-- Schedule cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *', 'SELECT cleanup_expired_rate_limits()');

-- Atomic rate limit increment function
-- This function atomically increments the rate limit counter or creates a new entry
-- Returns the new count and expiry timestamp
CREATE OR REPLACE FUNCTION increment_rate_limit(key text, window_seconds int)
RETURNS TABLE(count int, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_entry record;
    new_expires_at timestamptz;
BEGIN
    new_expires_at := NOW() + (window_seconds || ' seconds')::interval;

    -- Try to update existing entry
    UPDATE rate_limits
    SET count = count + 1,
        updated_at = NOW(),
        expires_at = new_expires_at
    WHERE key = increment_rate_limit.key
      AND expires_at > NOW()
    RETURNING count, expires_at INTO current_entry;

    -- If no entry was updated, insert a new one
    IF current_entry IS NULL THEN
        INSERT INTO rate_limits (key, count, expires_at, created_at, updated_at)
        VALUES (increment_rate_limit.key, 1, new_expires_at, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE
        SET count = 1,
            expires_at = new_expires_at,
            updated_at = NOW()
        RETURNING count, expires_at INTO current_entry;
    END IF;

    RETURN QUERY SELECT current_entry.count, current_entry.expires_at;
END;
$$;
