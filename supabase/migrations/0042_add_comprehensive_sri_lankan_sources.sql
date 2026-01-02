-- Add comprehensive Sri Lankan news sources
-- Includes English, Tamil, and Sinhala sources from major news outlets
-- This migration consolidates and expands news source coverage

-- English Sources (Major Sri Lankan News Outlets)
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  -- Major English News Sources
  ('Daily Mirror', 'rss', 'https://www.dailymirror.lk/RSS_Feeds/breaking-news/108', 'dailymirror.lk', 'en', true, true),
  ('NewsFirst', 'rss', 'https://www.newsfirst.lk/feed/', 'newsfirst.lk', 'en', true, true),
  ('Hiru News', 'rss', 'https://www.hirunews.lk/rss/english.xml', 'hirunews.lk', 'en', true, true),
  ('Colombo Page', 'rss', 'http://www.colombopage.com/rss/colombopage-latest.xml', 'colombopage.com', 'en', true, true),
  ('Sunday Times', 'rss', 'https://www.sundaytimes.lk/feed/', 'sundaytimes.lk', 'en', true, true),
  ('Island', 'rss', 'https://island.lk/feed/', 'island.lk', 'en', true, true),
  ('Daily FT', 'rss', 'https://www.ft.lk/feed/', 'ft.lk', 'en', true, true),
  ('Ceylon Today', 'rss', 'https://www.ceylontoday.lk/feed/', 'ceylontoday.lk', 'en', true, true),
  ('EconomyNext', 'rss', 'https://economynext.com/feed/', 'economynext.com', 'en', true, true),
  ('RepublicNext', 'rss', 'https://www.republicnext.com/feed/', 'republicnext.com', 'en', true, true),
  ('Morning Leader', 'rss', 'https://www.themorning.lk/feed/', 'themorning.lk', 'en', true, true),
  ('Lanka Business News', 'rss', 'https://www.lankabusinessnews.com/feed/', 'lankabusinessnews.com', 'en', true, true),
  ('Groundviews', 'rss', 'https://groundviews.org/feed/', 'groundviews.org', 'en', true, true),
  ('Roar Media', 'rss', 'https://roar.media/feed/', 'roar.media', 'en', true, true),
  ('Echelon', 'rss', 'https://www.echelon.lk/feed/', 'echelon.lk', 'en', true, true),
  ('LMD', 'rss', 'https://lmd.lk/feed/', 'lmd.lk', 'en', true, true),
  ('Daily News', 'rss', 'https://www.dailynews.lk/feed/', 'dailynews.lk', 'en', true, true),
  ('Observer', 'rss', 'https://www.observer.lk/feed/', 'observer.lk', 'en', true, true),
  ('BBC Sinhala', 'rss', 'https://www.bbc.com/sinhala/rss.xml', 'bbc.com', 'en', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Sinhala Sources (Major Sri Lankan News Outlets)
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Ada Derana', 'rss', 'https://www.adaderana.lk/rss.php', 'adaderana.lk', 'si', true, true),
  ('Rivira', 'rss', 'https://www.rivira.lk/rss', 'rivira.lk', 'si', true, true),
  ('Lakbima', 'rss', 'https://www.lakbima.lk/rss', 'lakbima.lk', 'si', true, true),
  ('Rasasinhala', 'rss', 'https://www.rasasinhala.lk/rss', 'rasasinhala.lk', 'si', true, true),
  ('Gossip Lanka', 'rss', 'https://www.gossiplankanews.com/feed/', 'gossiplankanews.com', 'si', true, true),
  ('Lankadeepa', 'rss', 'https://www.lankadeepa.lk/rss', 'lankadeepa.lk', 'si', true, true),
  ('Divaina', 'rss', 'https://www.divaina.com/rss', 'divaina.com', 'si', true, true),
  ('Mawbima', 'rss', 'https://www.mawbima.lk/rss', 'mawbima.lk', 'si', true, true),
  ('Aruna', 'rss', 'https://www.aruna.lk/rss', 'aruna.lk', 'si', true, true),
  ('Irida Lankadeepa', 'rss', 'https://www.irida.lankadeepa.lk/rss', 'irida.lankadeepa.lk', 'si', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Tamil Sources (Major Sri Lankan News Outlets)
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Virakesari', 'rss', 'https://www.virakesari.lk/rss', 'virakesari.lk', 'ta', true, true),
  ('Thinakaran', 'rss', 'https://www.thinakaran.lk/rss', 'thinakaran.lk', 'ta', true, true),
  ('Uthayan', 'rss', 'https://www.uthayan.lk/rss', 'uthayan.lk', 'ta', true, true),
  ('Valampuri', 'rss', 'https://www.valampuri.lk/rss', 'valampuri.lk', 'ta', true, true),
  ('Sudar Oli', 'rss', 'https://www.sudaroli.lk/rss', 'sudaroli.lk', 'ta', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Google News RSS Feeds (Sri Lanka topics) - Keep existing
-- These are already added via migration 0021, but ensure they're active
UPDATE public.sources
SET enabled = true, active = true
WHERE base_domain = 'news.google.com' AND type = 'rss';

-- Add priority/ranking column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sources' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.sources ADD COLUMN priority INTEGER DEFAULT 100;
    CREATE INDEX IF NOT EXISTS sources_priority_idx ON public.sources (priority) WHERE active = true;
    COMMENT ON COLUMN public.sources.priority IS 'Source priority for processing order (lower = higher priority)';
  END IF;
END $$;

-- Set priorities: Major sources get lower priority (processed first)
UPDATE public.sources
SET priority = CASE
  WHEN name IN ('Daily Mirror', 'NewsFirst', 'Ada Derana', 'Virakesari') THEN 10
  WHEN name IN ('Sunday Times', 'Hiru News', 'Lankadeepa', 'Thinakaran') THEN 20
  WHEN name LIKE 'Google News%' THEN 50
  ELSE 100
END
WHERE active = true;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive Sri Lankan news sources have been added/updated.';
  RAISE NOTICE 'English sources: %', (SELECT COUNT(*) FROM public.sources WHERE language = 'en' AND active = true);
  RAISE NOTICE 'Sinhala sources: %', (SELECT COUNT(*) FROM public.sources WHERE language = 'si' AND active = true);
  RAISE NOTICE 'Tamil sources: %', (SELECT COUNT(*) FROM public.sources WHERE language = 'ta' AND active = true);
END $$;

