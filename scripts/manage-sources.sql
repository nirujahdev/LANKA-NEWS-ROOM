-- ============================================
-- Source Management Queries
-- Common operations for managing news sources
-- ============================================

-- View All Sources
-- ============================================
SELECT 
  id,
  name,
  type,
  feed_url,
  base_domain,
  active,
  enabled,
  language,
  created_at
FROM public.sources
ORDER BY active DESC, name;

-- View Active Sources Only
-- ============================================
SELECT 
  name,
  type,
  feed_url,
  base_domain,
  language
FROM public.sources
WHERE active = true
ORDER BY name;

-- Add a New Source
-- ============================================
-- Example:
/*
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES (
  'BBC Sinhala',
  'rss',
  'https://www.bbc.com/sinhala/rss.xml',
  'bbc.com',
  'si',
  true,
  true
);
*/

-- Update Source Configuration
-- ============================================
-- Example: Update feed URL
/*
UPDATE public.sources
SET feed_url = 'https://new-feed-url.com/rss'
WHERE name = 'Source Name';
*/

-- Example: Update base_domain
/*
UPDATE public.sources
SET base_domain = 'newdomain.lk'
WHERE name = 'Source Name';
*/

-- Example: Enable/Disable Source
/*
UPDATE public.sources
SET active = false, enabled = false
WHERE name = 'Source Name';
*/

-- Example: Enable Source
/*
UPDATE public.sources
SET active = true, enabled = true
WHERE name = 'Source Name';
*/

-- Check Source Statistics
-- ============================================
SELECT 
  s.name,
  s.active,
  COUNT(DISTINCT a.id) as article_count,
  COUNT(DISTINCT a.cluster_id) as cluster_count,
  MAX(a.created_at) as latest_article,
  MIN(a.created_at) as first_article
FROM public.sources s
LEFT JOIN public.articles a ON a.source_id = s.id
GROUP BY s.id, s.name, s.active
ORDER BY article_count DESC;

-- Find Sources Without base_domain
-- ============================================
SELECT 
  id,
  name,
  feed_url,
  base_domain,
  active
FROM public.sources
WHERE active = true AND base_domain IS NULL;

-- Fix Missing base_domain (Auto-extract from feed_url)
-- ============================================
/*
UPDATE public.sources
SET base_domain = regexp_replace(
  regexp_replace(feed_url, '^https?://', ''),
  '/.*$', ''
)
WHERE active = true AND base_domain IS NULL;
*/

-- Test Domain Validation
-- ============================================
-- Check if article URLs match source base_domain
SELECT 
  s.name,
  s.base_domain,
  a.url,
  CASE 
    WHEN a.url LIKE '%' || s.base_domain || '%' THEN 'MATCH'
    ELSE 'MISMATCH'
  END as domain_check
FROM public.sources s
JOIN public.articles a ON a.source_id = s.id
WHERE s.active = true
LIMIT 20;

-- Delete a Source (and related data)
-- ============================================
-- WARNING: This will cascade delete articles and clusters
/*
DELETE FROM public.sources
WHERE name = 'Source Name';
*/

-- View Source Feed Status
-- ============================================
SELECT 
  s.name,
  s.active,
  s.feed_url,
  COUNT(DISTINCT pr.id) as pipeline_runs,
  COUNT(DISTINCT pe.id) as errors,
  MAX(pr.started_at) as last_run
FROM public.sources s
LEFT JOIN public.pipeline_runs pr ON pr.id IS NOT NULL
LEFT JOIN public.pipeline_errors pe ON pe.source_id = s.id
GROUP BY s.id, s.name, s.active, s.feed_url
ORDER BY s.name;

