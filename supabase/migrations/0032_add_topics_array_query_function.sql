-- Migration: Add RPC function for querying clusters by topics array
-- This function efficiently queries clusters that have a topic in their topics array
-- or match the single topic field (for backward compatibility)

CREATE OR REPLACE FUNCTION get_clusters_by_topic(
  topic_slug TEXT,
  status_filter cluster_status DEFAULT 'published'::cluster_status,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  headline TEXT,
  headline_si TEXT,
  headline_ta TEXT,
  slug TEXT,
  status cluster_status,
  topic TEXT,
  topics TEXT[],
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  source_count INTEGER,
  article_count INTEGER,
  image_url TEXT,
  category TEXT,
  city TEXT,
  primary_entity TEXT,
  event_type TEXT,
  language lang_code,
  keywords TEXT[],
  meta_title_en TEXT,
  meta_description_en TEXT,
  meta_title_si TEXT,
  meta_description_si TEXT,
  meta_title_ta TEXT,
  meta_description_ta TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.headline,
    c.headline_si,
    c.headline_ta,
    c.slug,
    c.status,
    c.topic,
    c.topics,
    c.published_at,
    c.updated_at,
    c.source_count,
    c.article_count,
    c.image_url,
    c.category,
    c.city,
    c.primary_entity,
    c.event_type,
    c.language,
    c.keywords,
    c.meta_title_en,
    c.meta_description_en,
    c.meta_title_si,
    c.meta_description_si,
    c.meta_title_ta,
    c.meta_description_ta
  FROM clusters c
  WHERE 
    c.status = status_filter
    AND (
      -- Match single topic field (backward compatibility)
      LOWER(c.topic) = LOWER(topic_slug)
      OR
      -- Match topics array (new multi-topic support)
      (c.topics IS NOT NULL AND topic_slug = ANY(c.topics))
    )
  ORDER BY c.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_clusters_by_topic IS 'Efficiently query clusters by topic, supporting both single topic field and topics array';

-- Create index on topics array for better performance (if not already exists)
CREATE INDEX IF NOT EXISTS clusters_topics_gin_idx ON clusters USING GIN(topics) WHERE topics IS NOT NULL;

