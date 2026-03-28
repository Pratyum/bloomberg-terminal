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
CREATE POLICY "Allow public read access to market_data" ON market_data
    FOR SELECT USING (true);

CREATE POLICY "Allow service role write access to market_data" ON market_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update access to market_data" ON market_data
    FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to rate_limits" ON rate_limits
    FOR SELECT USING (true);

CREATE POLICY "Allow service role write access to rate_limits" ON rate_limits
    FOR ALL USING (true);

-- Create indexes for better performance
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
