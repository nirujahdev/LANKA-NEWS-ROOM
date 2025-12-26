-- Update search function to filter by district from articles
-- District is stored in articles table, so we need to join and filter

-- Drop the old function first
DROP FUNCTION IF EXISTS search_clusters(TEXT, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INTEGER);

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
    c.city,
    c.event_type,
    c.image_url,
    ts_rank(
      to_tsvector('english', c.headline || ' ' || COALESCE(s.summary_en, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM clusters c
  LEFT JOIN summaries s ON s.cluster_id = c.id
  LEFT JOIN articles a ON a.cluster_id = c.id
  WHERE 
    c.status = 'published'
    AND c.expires_at >= NOW()
    -- Full-text search condition
    AND (
      search_query IS NULL OR search_query = '' OR
      to_tsvector('english', c.headline) @@ plainto_tsquery('english', search_query)
      OR to_tsvector('english', COALESCE(s.summary_en, '')) @@ plainto_tsquery('english', search_query)
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
COMMENT ON FUNCTION search_clusters IS 'Enhanced full-text search with topic, date, district, and event type filters';

