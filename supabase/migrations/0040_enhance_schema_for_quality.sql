-- Migration: Enhance Schema for Quality Tracking and Validation
-- This migration adds quality tracking columns and ensures data consistency
-- 
-- Changes:
-- 1. Add quality tracking columns to clusters (image, headline translations)
-- 2. Add quality tracking columns to summaries (summary quality, lengths)
-- 3. Add image metadata to articles
-- 4. Create trigger to ensure topics array consistency
-- 5. Add indexes for performance

-- ============================================
-- PART 1: Add Quality Tracking to Clusters
-- ============================================

-- Image quality and relevance scores
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS image_relevance_score NUMERIC(3,2);
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS image_quality_score NUMERIC(3,2);

-- Headline translation quality scores
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS headline_translation_quality_en NUMERIC(3,2);
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS headline_translation_quality_si NUMERIC(3,2);
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS headline_translation_quality_ta NUMERIC(3,2);

-- Add comments for documentation
COMMENT ON COLUMN clusters.image_relevance_score IS 'Relevance score (0.00-1.00) for how well the image matches the article content';
COMMENT ON COLUMN clusters.image_quality_score IS 'Quality score (0.00-1.00) for image technical quality';
COMMENT ON COLUMN clusters.headline_translation_quality_en IS 'Quality score (0.00-1.00) for English headline (always 1.0 for original)';
COMMENT ON COLUMN clusters.headline_translation_quality_si IS 'Quality score (0.00-1.00) for Sinhala headline translation';
COMMENT ON COLUMN clusters.headline_translation_quality_ta IS 'Quality score (0.00-1.00) for Tamil headline translation';

-- ============================================
-- PART 2: Add Quality Tracking to Summaries
-- ============================================

-- Summary quality scores per language
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_quality_score_en NUMERIC(3,2);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_quality_score_si NUMERIC(3,2);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_quality_score_ta NUMERIC(3,2);

-- Summary lengths per language
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_length_en INTEGER;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_length_si INTEGER;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS summary_length_ta INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN summaries.summary_quality_score_en IS 'Quality score (0.00-1.00) for English summary';
COMMENT ON COLUMN summaries.summary_quality_score_si IS 'Quality score (0.00-1.00) for Sinhala summary translation';
COMMENT ON COLUMN summaries.summary_quality_score_ta IS 'Quality score (0.00-1.00) for Tamil summary translation';
COMMENT ON COLUMN summaries.summary_length_en IS 'Character count of English summary';
COMMENT ON COLUMN summaries.summary_length_si IS 'Character count of Sinhala summary';
COMMENT ON COLUMN summaries.summary_length_ta IS 'Character count of Tamil summary';

-- ============================================
-- PART 3: Add Image Metadata to Articles
-- ============================================

-- Image extraction method tracking
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_extraction_method TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_relevance_score NUMERIC(3,2);

-- Add comments for documentation
COMMENT ON COLUMN articles.image_extraction_method IS 'Method used to extract image: rss, content, page, ai';
COMMENT ON COLUMN articles.image_relevance_score IS 'Relevance score (0.00-1.00) for article image';

-- ============================================
-- PART 4: Ensure Topics Array Consistency
-- ============================================

-- Create function to ensure topics array is always populated and consistent with topic field
CREATE OR REPLACE FUNCTION ensure_topics_array()
RETURNS TRIGGER AS $$
BEGIN
  -- If topics array is empty/null but topic field exists, populate it
  IF (NEW.topics IS NULL OR array_length(NEW.topics, 1) IS NULL) AND NEW.topic IS NOT NULL THEN
    NEW.topics := ARRAY[NEW.topic];
  END IF;
  
  -- If topic field is null but topics array exists, set topic to first non-"other" topic
  IF NEW.topic IS NULL AND NEW.topics IS NOT NULL AND array_length(NEW.topics, 1) > 0 THEN
    NEW.topic := COALESCE(
      (SELECT t FROM unnest(NEW.topics) t WHERE t != 'other' LIMIT 1),
      NEW.topics[1],
      'other'
    );
  END IF;
  
  -- Ensure topics array has at least one element
  IF NEW.topics IS NULL OR array_length(NEW.topics, 1) IS NULL THEN
    NEW.topics := ARRAY[COALESCE(NEW.topic, 'other')];
  END IF;
  
  -- Ensure topic field is set
  IF NEW.topic IS NULL THEN
    NEW.topic := COALESCE(
      (SELECT t FROM unnest(NEW.topics) t WHERE t != 'other' LIMIT 1),
      NEW.topics[1],
      'other'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure topics consistency
DROP TRIGGER IF EXISTS ensure_topics_consistency ON clusters;
CREATE TRIGGER ensure_topics_consistency
  BEFORE INSERT OR UPDATE ON clusters
  FOR EACH ROW
  EXECUTE FUNCTION ensure_topics_array();

-- ============================================
-- PART 5: Add Performance Indexes
-- ============================================

-- Indexes for quality-based queries
CREATE INDEX IF NOT EXISTS clusters_image_relevance_idx 
  ON clusters(image_relevance_score) 
  WHERE image_relevance_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS clusters_headline_quality_si_idx 
  ON clusters(headline_translation_quality_si) 
  WHERE headline_translation_quality_si IS NOT NULL;

CREATE INDEX IF NOT EXISTS clusters_headline_quality_ta_idx 
  ON clusters(headline_translation_quality_ta) 
  WHERE headline_translation_quality_ta IS NOT NULL;

CREATE INDEX IF NOT EXISTS summaries_quality_en_idx 
  ON summaries(summary_quality_score_en) 
  WHERE summary_quality_score_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS summaries_quality_si_idx 
  ON summaries(summary_quality_score_si) 
  WHERE summary_quality_score_si IS NOT NULL;

CREATE INDEX IF NOT EXISTS summaries_quality_ta_idx 
  ON summaries(summary_quality_score_ta) 
  WHERE summary_quality_score_ta IS NOT NULL;

-- ============================================
-- PART 6: Backfill Existing Data (Optional)
-- ============================================

-- Set default quality scores for existing data
-- English headlines are always quality 1.0 (original)
UPDATE clusters 
SET headline_translation_quality_en = 1.0 
WHERE headline_translation_quality_en IS NULL;

-- Set quality scores for existing translations (assume 0.8 if they exist)
UPDATE clusters 
SET headline_translation_quality_si = 0.8 
WHERE headline_si IS NOT NULL AND headline_translation_quality_si IS NULL;

UPDATE clusters 
SET headline_translation_quality_ta = 0.8 
WHERE headline_ta IS NOT NULL AND headline_translation_quality_ta IS NULL;

-- Set summary lengths for existing summaries
UPDATE summaries 
SET summary_length_en = LENGTH(COALESCE(summary_en, ''))
WHERE summary_length_en IS NULL AND summary_en IS NOT NULL;

UPDATE summaries 
SET summary_length_si = LENGTH(COALESCE(summary_si, ''))
WHERE summary_length_si IS NULL AND summary_si IS NOT NULL;

UPDATE summaries 
SET summary_length_ta = LENGTH(COALESCE(summary_ta, ''))
WHERE summary_length_ta IS NULL AND summary_ta IS NOT NULL;

-- Set default quality scores for existing summaries (assume 0.7 if they exist)
UPDATE summaries 
SET summary_quality_score_en = 0.7 
WHERE summary_en IS NOT NULL AND summary_quality_score_en IS NULL;

UPDATE summaries 
SET summary_quality_score_si = 0.7 
WHERE summary_si IS NOT NULL AND summary_quality_score_si IS NULL;

UPDATE summaries 
SET summary_quality_score_ta = 0.7 
WHERE summary_ta IS NOT NULL AND summary_quality_score_ta IS NULL;

-- Ensure topics array is populated for all clusters
UPDATE clusters 
SET topics = ARRAY[topic] 
WHERE (topics IS NULL OR array_length(topics, 1) IS NULL) AND topic IS NOT NULL;

UPDATE clusters 
SET topic = COALESCE(
  (SELECT t FROM unnest(topics) t WHERE t != 'other' LIMIT 1),
  topics[1],
  'other'
)
WHERE topic IS NULL AND topics IS NOT NULL AND array_length(topics, 1) > 0;

-- ============================================
-- Migration Complete
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 0040: Schema enhancement for quality tracking completed successfully';
  RAISE NOTICE 'Added quality tracking columns to clusters, summaries, and articles';
  RAISE NOTICE 'Created trigger for topics array consistency';
  RAISE NOTICE 'Added performance indexes';
  RAISE NOTICE 'Backfilled existing data with default quality scores';
END $$;

