-- Add full-text search indexes for clusters and summaries
-- This enables fast search functionality across headlines and summaries

-- Add full-text search index on clusters.headline
CREATE INDEX IF NOT EXISTS clusters_headline_fts_idx 
ON clusters USING gin(to_tsvector('english', headline));

-- Create search function that searches across clusters and summaries
CREATE OR REPLACE FUNCTION search_clusters(
  search_query TEXT,
  lang_code TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  headline TEXT,
  slug TEXT,
  summary TEXT,
  source_count INTEGER,
  published_at TIMESTAMPTZ,
  category TEXT,
  topic TEXT,
  image_url TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.headline,
    c.slug,
    CASE 
      WHEN lang_code = 'si' THEN COALESCE(s.summary_si, s.summary_en, '')
      WHEN lang_code = 'ta' THEN COALESCE(s.summary_ta, s.summary_en, '')
      ELSE COALESCE(s.summary_en, '')
    END as summary,
    c.source_count,
    c.published_at,
    c.category,
    c.topic,
    c.image_url,
    ts_rank(
      to_tsvector('english', c.headline || ' ' || COALESCE(s.summary_en, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM clusters c
  LEFT JOIN summaries s ON s.cluster_id = c.id
  WHERE 
    c.status = 'published'
    AND c.expires_at >= NOW()
    AND (
      to_tsvector('english', c.headline) @@ plainto_tsquery('english', search_query)
      OR to_tsvector('english', COALESCE(s.summary_en, '')) @@ plainto_tsquery('english', search_query)
    )
  ORDER BY rank DESC, c.published_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION search_clusters IS 'Full-text search across clusters and summaries with multi-language support';

