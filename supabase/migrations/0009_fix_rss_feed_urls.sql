-- Fix RSS feed URLs for sources that are returning errors
-- This migration updates feed URLs to working endpoints

-- Update NewsFirst to use correct domain (not english.newsfirst.lk)
UPDATE public.sources 
SET feed_url = 'https://www.newsfirst.lk/feed/',
    base_domain = 'newsfirst.lk'
WHERE feed_url LIKE '%english.newsfirst.lk%' 
   OR feed_url LIKE '%newsfirst.lk/feed%';

-- Update Daily Mirror to use working RSS endpoint
UPDATE public.sources 
SET feed_url = 'https://www.dailymirror.lk/RSS_Feeds/breaking-news/108',
    base_domain = 'dailymirror.lk'
WHERE feed_url LIKE '%dailymirror.lk%';

-- Disable news.lk if it exists (404 error - site may be down)
UPDATE public.sources 
SET active = false,
    enabled = false
WHERE feed_url LIKE '%news.lk%';

-- Disable virakesari.lk if it exists (500 error - server issues)
UPDATE public.sources 
SET active = false,
    enabled = false
WHERE feed_url LIKE '%virakesari.lk%';

-- Disable dailynews.lk if it exists (403 error - blocking requests)
UPDATE public.sources 
SET active = false,
    enabled = false
WHERE feed_url LIKE '%dailynews.lk%';

-- Ensure working sources from seed file are present and active
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Ada Derana', 'rss', 'https://www.adaderana.lk/rss.php', 'adaderana.lk', 'si', true, true),
  ('Daily Mirror', 'rss', 'https://www.dailymirror.lk/RSS_Feeds/breaking-news/108', 'dailymirror.lk', 'en', true, true),
  ('NewsFirst', 'rss', 'https://www.newsfirst.lk/feed/', 'newsfirst.lk', 'en', true, true),
  ('Hiru News', 'rss', 'https://www.hirunews.lk/rss/english.xml', 'hirunews.lk', 'en', true, true),
  ('Colombo Page', 'rss', 'http://www.colombopage.com/rss/colombopage-latest.xml', 'colombopage.com', 'en', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = EXCLUDED.name,
  base_domain = EXCLUDED.base_domain,
  language = EXCLUDED.language,
  enabled = EXCLUDED.enabled,
  active = EXCLUDED.active;

-- Add comment for tracking
COMMENT ON TABLE public.sources IS 'RSS feed sources - updated 2025-12-25 to fix failing feeds';

