-- Migration: Add agent tracking columns to clusters and summaries tables
-- This tracks agent usage, quality scores, costs, and performance metrics

-- Add agent tracking columns to clusters table
ALTER TABLE clusters 
ADD COLUMN IF NOT EXISTS agent_version TEXT,
ADD COLUMN IF NOT EXISTS agent_quality_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS agent_cost NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS agent_time INTEGER, -- milliseconds
ADD COLUMN IF NOT EXISTS agent_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_error TEXT;

-- Add agent tracking columns to summaries table
ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS agent_version TEXT,
ADD COLUMN IF NOT EXISTS agent_quality_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS agent_cost NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS agent_time INTEGER, -- milliseconds
ADD COLUMN IF NOT EXISTS agent_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_error TEXT;

-- Add indexes for agent tracking queries
CREATE INDEX IF NOT EXISTS idx_clusters_agent_used ON clusters(agent_used);
CREATE INDEX IF NOT EXISTS idx_clusters_agent_quality ON clusters(agent_quality_score);
CREATE INDEX IF NOT EXISTS idx_summaries_agent_used ON summaries(agent_used);
CREATE INDEX IF NOT EXISTS idx_summaries_agent_quality ON summaries(agent_quality_score);

-- Add comments for documentation
COMMENT ON COLUMN clusters.agent_version IS 'Version of agent used (e.g., "v1.0")';
COMMENT ON COLUMN clusters.agent_quality_score IS 'Overall quality score from agent (0-1)';
COMMENT ON COLUMN clusters.agent_cost IS 'Estimated cost in tokens/credits';
COMMENT ON COLUMN clusters.agent_time IS 'Time taken by agent in milliseconds';
COMMENT ON COLUMN clusters.agent_used IS 'Whether agent was used for this cluster';
COMMENT ON COLUMN clusters.agent_error IS 'Error message if agent failed';

COMMENT ON COLUMN summaries.agent_version IS 'Version of agent used (e.g., "v1.0")';
COMMENT ON COLUMN summaries.agent_quality_score IS 'Overall quality score from agent (0-1)';
COMMENT ON COLUMN summaries.agent_cost IS 'Estimated cost in tokens/credits';
COMMENT ON COLUMN summaries.agent_time IS 'Time taken by agent in milliseconds';
COMMENT ON COLUMN summaries.agent_used IS 'Whether agent was used for this summary';
COMMENT ON COLUMN summaries.agent_error IS 'Error message if agent failed';

