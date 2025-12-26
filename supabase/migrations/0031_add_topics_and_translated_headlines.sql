-- Migration: Add Topics Array and Translated Headlines
-- This migration adds support for multi-topic categorization and translated headlines
-- 
-- Changes:
-- 1. Add topics TEXT[] column for multiple topics per cluster
-- 2. Add headline_si TEXT column for Sinhala headlines
-- 3. Add headline_ta TEXT column for Tamil headlines
-- 4. Create indexes for efficient querying

-- Add topics array column
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS topics TEXT[];

-- Create GIN index on topics array for efficient array queries
CREATE INDEX IF NOT EXISTS clusters_topics_idx ON clusters USING GIN(topics);

-- Add translated headline columns
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS headline_si TEXT;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS headline_ta TEXT;

-- Create indexes for search performance on translated headlines
CREATE INDEX IF NOT EXISTS clusters_headline_si_idx ON clusters(headline_si) WHERE headline_si IS NOT NULL;
CREATE INDEX IF NOT EXISTS clusters_headline_ta_idx ON clusters(headline_ta) WHERE headline_ta IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clusters.topics IS 'Array of topics for multi-topic categorization (e.g., ["sri-lanka", "technology"])';
COMMENT ON COLUMN clusters.headline_si IS 'Sinhala translation of the headline';
COMMENT ON COLUMN clusters.headline_ta IS 'Tamil translation of the headline';

-- Note: The existing 'topic' column (single topic) is kept for backward compatibility
-- The existing 'headline' column (English headline) is kept as the primary headline

