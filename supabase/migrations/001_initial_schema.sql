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

-- Create policies for anon access (adjust as needed)
-- Public read access (client-side reads via anon key)
CREATE POLICY "Allow public read access to market_data" ON market_data
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to rate_limits" ON rate_limits
    FOR SELECT USING (true);

-- Service role policies (server-side writes via service-role key)
-- These require authenticated role with service-role key
CREATE POLICY "Allow service role insert access to market_data" ON market_data
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update access to market_data" ON market_data
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role delete access to market_data" ON market_data
    FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role insert access to rate_limits" ON rate_limits
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update access to rate_limits" ON rate_limits
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role delete access to rate_limits" ON rate_limits
    FOR DELETE USING (auth.role() = 'service_role');

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
CREATE OR REPLACE FUNCTION increment_rate_limit(
    p_key TEXT,
    p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL;
    
    INSERT INTO rate_limits (key, count, expires_at, created_at, updated_at)
    VALUES (p_key, 1, v_expires_at, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET
        count = rate_limits.count + 1,
        updated_at = NOW(),
        expires_at = CASE 
            WHEN rate_limits.expires_at <= NOW() THEN v_expires_at
            ELSE rate_limits.expires_at
        END
    RETURNING JSONB_BUILD_OBJECT(
        'count', rate_limits.count,
        'expires_at', rate_limits.expires_at
    ) INTO v_result;
    
    -- Fetch the current state after upsert
    SELECT JSONB_BUILD_OBJECT(
        'count', COALESCE(r.count, 1),
        'expires_at', COALESCE(r.expires_at, v_expires_at)
    ) INTO v_result
    FROM rate_limits r
    WHERE r.key = p_key;
    
    RETURN v_result;
END;
$$;
