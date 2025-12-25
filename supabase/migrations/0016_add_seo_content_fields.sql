-- Add SEO content fields for enhanced story pages
-- These fields support key facts, confirmed vs differs sections, and keywords

-- Add key facts (JSON array of strings, per language)
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS key_facts_en TEXT[];
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS key_facts_si TEXT[];
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS key_facts_ta TEXT[];

-- Add confirmed vs differs section (text, per language)
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS confirmed_vs_differs_en TEXT;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS confirmed_vs_differs_si TEXT;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS confirmed_vs_differs_ta TEXT;

-- Add keywords (JSON array, stored in clusters)
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Add last_checked timestamp
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN summaries.key_facts_en IS 'Key facts extracted from sources (English)';
COMMENT ON COLUMN summaries.key_facts_si IS 'Key facts extracted from sources (Sinhala)';
COMMENT ON COLUMN summaries.key_facts_ta IS 'Key facts extracted from sources (Tamil)';
COMMENT ON COLUMN summaries.confirmed_vs_differs_en IS 'Explanation of what is confirmed vs what differs between sources (English)';
COMMENT ON COLUMN summaries.confirmed_vs_differs_si IS 'Explanation of what is confirmed vs what differs between sources (Sinhala)';
COMMENT ON COLUMN summaries.confirmed_vs_differs_ta IS 'Explanation of what is confirmed vs what differs between sources (Tamil)';
COMMENT ON COLUMN clusters.keywords IS 'SEO keywords for the cluster (language-agnostic)';
COMMENT ON COLUMN clusters.last_checked_at IS 'Timestamp when cluster was last checked/updated';

