-- Migration: Add X (Twitter) posting tracking fields to clusters table
-- Tracks when clusters are posted to X, tweet IDs, and posting status

-- Add tweeted_at timestamp
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS tweeted_at TIMESTAMPTZ;

-- Add tweet_id for reference
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS tweet_id TEXT;

-- Add tweet_status to track posting state
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS tweet_status TEXT;

-- Create index on tweeted_at for query performance
CREATE INDEX IF NOT EXISTS clusters_tweeted_at_idx ON clusters(tweeted_at) WHERE tweeted_at IS NOT NULL;

-- Create index on tweet_status for filtering
CREATE INDEX IF NOT EXISTS clusters_tweet_status_idx ON clusters(tweet_status) WHERE tweet_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clusters.tweeted_at IS 'Timestamp when the cluster was posted to X (Twitter)';
COMMENT ON COLUMN clusters.tweet_id IS 'X (Twitter) tweet ID for reference and tracking';
COMMENT ON COLUMN clusters.tweet_status IS 'Posting status: pending, posted, or failed';

