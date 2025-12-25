-- Check current RSS sources and their status
-- Run this to see what sources are active and which ones might be problematic

-- Show all sources with their status
SELECT 
  id,
  name,
  feed_url,
  base_domain,
  language,
  enabled,
  active,
  created_at,
  updated_at
FROM public.sources
ORDER BY active DESC, name;

-- Count articles by source (to see which sources are working)
SELECT 
  s.name,
  s.feed_url,
  s.active,
  COUNT(a.id) as article_count,
  MAX(a.created_at) as last_article_fetched
FROM public.sources s
LEFT JOIN public.articles a ON a.source_id = s.id
GROUP BY s.id, s.name, s.feed_url, s.active
ORDER BY article_count DESC;

-- Find sources with no articles (might be broken)
SELECT 
  s.name,
  s.feed_url,
  s.active,
  s.created_at
FROM public.sources s
LEFT JOIN public.articles a ON a.source_id = s.id
WHERE a.id IS NULL
  AND s.active = true
ORDER BY s.created_at DESC;

