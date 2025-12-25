-- RPC function to atomically pick articles for processing
-- Prevents race conditions when multiple workers run concurrently

CREATE OR REPLACE FUNCTION pick_articles_for_processing(batch_limit INTEGER)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  title TEXT,
  url TEXT,
  content_text TEXT,
  content_excerpt TEXT,
  published_at TIMESTAMPTZ,
  lang TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.articles
  SET status = 'processing'
  FROM (
    SELECT a.id
    FROM public.articles a
    WHERE a.status = 'new'
    ORDER BY a.created_at ASC
    LIMIT batch_limit
    FOR UPDATE SKIP LOCKED
  ) AS selected
  WHERE articles.id = selected.id
  RETURNING
    articles.id,
    articles.source_id,
    articles.title,
    articles.url,
    articles.content_text,
    articles.content_excerpt,
    articles.published_at,
    articles.lang::TEXT;
END;
$$ LANGUAGE plpgsql;

