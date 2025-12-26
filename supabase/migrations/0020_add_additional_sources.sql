-- Add additional news sources for Sri Lanka
-- Includes more English and Sinhala sources

-- Additional English Sources
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Morning Leader', 'rss', 'https://www.themorning.lk/feed/', 'themorning.lk', 'en', true, true),
  ('Lanka Business News', 'rss', 'https://www.lankabusinessnews.com/feed/', 'lankabusinessnews.com', 'en', true, true),
  ('Groundviews', 'rss', 'https://groundviews.org/feed/', 'groundviews.org', 'en', true, true),
  ('Roar Media', 'rss', 'https://roar.media/feed/', 'roar.media', 'en', true, true),
  ('Echelon', 'rss', 'https://www.echelon.lk/feed/', 'echelon.lk', 'en', true, true),
  ('LMD', 'rss', 'https://lmd.lk/feed/', 'lmd.lk', 'en', true, true),
  ('Daily News', 'rss', 'https://www.dailynews.lk/feed/', 'dailynews.lk', 'en', true, true),
  ('Observer', 'rss', 'https://www.observer.lk/feed/', 'observer.lk', 'en', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

-- Additional Sinhala Sources
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Rivira', 'rss', 'https://www.rivira.lk/rss', 'rivira.lk', 'si', true, true),
  ('Lakbima', 'rss', 'https://www.lakbima.lk/rss', 'lakbima.lk', 'si', true, true),
  ('Rasasinhala', 'rss', 'https://www.rasasinhala.lk/rss', 'rasasinhala.lk', 'si', true, true),
  ('Gossip Lanka', 'rss', 'https://www.gossiplankanews.com/feed/', 'gossiplankanews.com', 'si', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

