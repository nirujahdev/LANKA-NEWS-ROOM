-- Add comprehensive news sources for Sri Lanka
-- Includes English, Sinhala, and Tamil sources
-- Note: Some RSS feed URLs may need verification - test each feed before relying on it

-- English Sources
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  -- BBC Sinhala (English section)
  ('BBC Sinhala', 'rss', 'https://www.bbc.com/sinhala/rss.xml', 'bbc.com', 'en', true, true),
  
  -- EconomyNext
  ('EconomyNext', 'rss', 'https://economynext.com/feed/', 'economynext.com', 'en', true, true),
  
  -- Sunday Times
  ('Sunday Times', 'rss', 'https://www.sundaytimes.lk/feed/', 'sundaytimes.lk', 'en', true, true),
  
  -- Island
  ('Island', 'rss', 'https://island.lk/feed/', 'island.lk', 'en', true, true),
  
  -- Daily FT (Financial Times)
  ('Daily FT', 'rss', 'https://www.ft.lk/feed/', 'ft.lk', 'en', true, true),
  
  -- Ceylon Today
  ('Ceylon Today', 'rss', 'https://www.ceylontoday.lk/feed/', 'ceylontoday.lk', 'en', true, true),
  
  -- RepublicNext
  ('RepublicNext', 'rss', 'https://www.republicnext.com/feed/', 'republicnext.com', 'en', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Sinhala Sources
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  -- Ada Derana (Sinhala) - verify if different from existing
  ('Ada Derana Sinhala', 'rss', 'https://www.adaderana.lk/rss.php', 'adaderana.lk', 'si', true, true),
  
  -- Lankadeepa
  ('Lankadeepa', 'rss', 'https://www.lankadeepa.lk/rss', 'lankadeepa.lk', 'si', true, true),
  
  -- Divaina
  ('Divaina', 'rss', 'https://www.divaina.com/rss', 'divaina.com', 'si', true, true),
  
  -- Mawbima
  ('Mawbima', 'rss', 'https://www.mawbima.lk/rss', 'mawbima.lk', 'si', true, true),
  
  -- Aruna
  ('Aruna', 'rss', 'https://www.aruna.lk/rss', 'aruna.lk', 'si', true, true),
  
  -- Irida Lankadeepa
  ('Irida Lankadeepa', 'rss', 'https://www.irida.lankadeepa.lk/rss', 'irida.lankadeepa.lk', 'si', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Tamil Sources
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  -- Virakesari
  ('Virakesari', 'rss', 'https://www.virakesari.lk/rss', 'virakesari.lk', 'ta', true, true),
  
  -- Thinakaran
  ('Thinakaran', 'rss', 'https://www.thinakaran.lk/rss', 'thinakaran.lk', 'ta', true, true),
  
  -- Uthayan
  ('Uthayan', 'rss', 'https://www.uthayan.lk/rss', 'uthayan.lk', 'ta', true, true),
  
  -- Valampuri
  ('Valampuri', 'rss', 'https://www.valampuri.lk/rss', 'valampuri.lk', 'ta', true, true),
  
  -- Sudar Oli
  ('Sudar Oli', 'rss', 'https://www.sudaroli.lk/rss', 'sudaroli.lk', 'ta', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Log the addition
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive news sources have been added. Please verify RSS feed URLs are correct and active.';
END $$;

