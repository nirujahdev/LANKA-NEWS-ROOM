-- Migration: Add content_html column for image extraction
-- This allows storing raw HTML content separately from plain text content
-- Raw HTML is needed for extracting images from article content

-- Add content_html column to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Create index for performance (partial index on non-null values)
CREATE INDEX IF NOT EXISTS articles_content_html_idx 
ON articles(content_html) WHERE content_html IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN articles.content_html IS 'Raw HTML content for image extraction (content_text is plain text for search)';

