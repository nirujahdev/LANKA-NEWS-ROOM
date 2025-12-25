-- Migration: Enhance image storage and translation tracking
-- Adds support for multiple images per article and translation status tracking

-- Add image_urls array to articles table for storing multiple images
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Add translation_status JSONB to summaries table to track translation success/failure
ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS translation_status JSONB;

-- Add summary_quality_score to summaries table for monitoring
ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS summary_quality_score NUMERIC(5, 2);

-- Create index on image_urls for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_image_urls ON articles USING GIN (image_urls);

-- Create index on translation_status for monitoring
CREATE INDEX IF NOT EXISTS idx_summaries_translation_status ON summaries USING GIN (translation_status);

-- Add comment for documentation
COMMENT ON COLUMN articles.image_urls IS 'Array of all image URLs extracted from the article (RSS, HTML, article page)';
COMMENT ON COLUMN summaries.translation_status IS 'JSON object tracking translation success: {en: boolean, si: boolean, ta: boolean}';
COMMENT ON COLUMN summaries.summary_quality_score IS 'Quality score (0-100) from validation function';

