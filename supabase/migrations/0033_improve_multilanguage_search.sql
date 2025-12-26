-- Enhanced multi-language search function
-- Searches across English, Sinhala, and Tamil headlines and summaries
-- Returns language-specific headlines based on lang_code

-- Drop the old function first
DROP FUNCTION IF EXISTS search_clusters(TEXT, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INTEGER);

-- Create full-text search indexes on translated fields for better performance
CREATE INDEX IF NOT EXISTS clusters_headline_si_fts_idx 
ON clusters USING gin(to_tsvector('english', COALESCE(headline_si, '')));

CREATE INDEX IF NOT EXISTS clusters_headline_ta_fts_idx 
ON clusters USING gin(to_tsvector('english', COALESCE(headline_ta, '')));

CREATE INDEX IF NOT EXISTS summaries_summary_si_fts_idx 
ON summaries USING gin(to_tsvector('english', COALESCE(summary_si, '')));

CREATE INDEX IF NOT EXISTS summaries_summary_ta_fts_idx 
ON summaries USING gin(to_tsvector('english', COALESCE(summary_ta, '')));

-- Create enhanced search function with multi-language support
CREATE OR REPLACE FUNCTION search_clusters(
  search_query TEXT,
  lang_code TEXT DEFAULT 'en',
  topic_filter TEXT[] DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  district_filter TEXT DEFAULT NULL,
  event_type_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
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
  city TEXT,
  event_type TEXT,
  image_url TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id,
    -- Return language-specific headline based on lang_code
    CASE 
      WHEN lang_code = 'si' THEN COALESCE(c.headline_si, c.headline, '')
      WHEN lang_code = 'ta' THEN COALESCE(c.headline_ta, c.headline, '')
      ELSE COALESCE(c.headline, '')
    END as headline,
    c.slug,
    -- Return language-specific summary based on lang_code
    CASE 
      WHEN lang_code = 'si' THEN COALESCE(s.summary_si, s.summary_en, '')
      WHEN lang_code = 'ta' THEN COALESCE(s.summary_ta, s.summary_en, '')
      ELSE COALESCE(s.summary_en, '')
    END as summary,
    c.source_count,
    c.published_at,
    c.category,
    c.topic,
    c.city,
    c.event_type,
    c.image_url,
    -- Calculate rank using all language fields for better relevance
    -- Search across English, Sinhala, and Tamil content
    CASE
      WHEN search_query IS NULL OR search_query = '' THEN 0
      ELSE GREATEST(
        -- English content rank
        ts_rank(
          to_tsvector('english', COALESCE(c.headline, '') || ' ' || COALESCE(s.summary_en, '')),
          plainto_tsquery('english', search_query)
        ),
        -- Sinhala headline rank (if available)
        CASE 
          WHEN c.headline_si IS NOT NULL THEN
            ts_rank(
              to_tsvector('english', c.headline_si),
              plainto_tsquery('english', search_query)
            )
          ELSE 0
        END,
        -- Tamil headline rank (if available)
        CASE 
          WHEN c.headline_ta IS NOT NULL THEN
            ts_rank(
              to_tsvector('english', c.headline_ta),
              plainto_tsquery('english', search_query)
            )
          ELSE 0
        END,
        -- Sinhala summary rank (if available)
        CASE 
          WHEN s.summary_si IS NOT NULL THEN
            ts_rank(
              to_tsvector('english', s.summary_si),
              plainto_tsquery('english', search_query)
            )
          ELSE 0
        END,
        -- Tamil summary rank (if available)
        CASE 
          WHEN s.summary_ta IS NOT NULL THEN
            ts_rank(
              to_tsvector('english', s.summary_ta),
              plainto_tsquery('english', search_query)
            )
          ELSE 0
        END
      )
    END as rank
  FROM clusters c
  LEFT JOIN summaries s ON s.cluster_id = c.id
  LEFT JOIN articles a ON a.cluster_id = c.id
  WHERE 
    c.status = 'published'
    AND (c.expires_at IS NULL OR c.expires_at >= NOW())
    -- Enhanced full-text search across all languages
    AND (
      search_query IS NULL OR search_query = '' OR
      -- Search in English headline
      to_tsvector('english', COALESCE(c.headline, '')) @@ plainto_tsquery('english', search_query)
      -- Search in English summary
      OR to_tsvector('english', COALESCE(s.summary_en, '')) @@ plainto_tsquery('english', search_query)
      -- Search in Sinhala headline (if available)
      OR (c.headline_si IS NOT NULL AND to_tsvector('english', c.headline_si) @@ plainto_tsquery('english', search_query))
      -- Search in Tamil headline (if available)
      OR (c.headline_ta IS NOT NULL AND to_tsvector('english', c.headline_ta) @@ plainto_tsquery('english', search_query))
      -- Search in Sinhala summary (if available)
      OR (s.summary_si IS NOT NULL AND to_tsvector('english', s.summary_si) @@ plainto_tsquery('english', search_query))
      -- Search in Tamil summary (if available)
      OR (s.summary_ta IS NOT NULL AND to_tsvector('english', s.summary_ta) @@ plainto_tsquery('english', search_query))
    )
    -- Topic filter (array matching)
    AND (topic_filter IS NULL OR array_length(topic_filter, 1) IS NULL OR c.topic = ANY(topic_filter))
    -- Date range filter
    AND (date_from IS NULL OR c.published_at >= date_from)
    AND (date_to IS NULL OR c.published_at <= date_to)
    -- District filter (from articles table)
    AND (district_filter IS NULL OR a.district = district_filter)
    -- Event type filter
    AND (event_type_filter IS NULL OR c.event_type = event_type_filter)
  ORDER BY 
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN rank
      ELSE 0
    END DESC,
    c.published_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION search_clusters IS 'Enhanced multi-language full-text search across English, Sinhala, and Tamil headlines and summaries with topic, date, district, and event type filters';

