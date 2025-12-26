-- Add Google News RSS feeds for Sri Lanka
-- These feeds provide comprehensive coverage of Sri Lankan news across different topics

INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES
  ('Google News - Sri Lanka', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Politics', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+politics&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Economy', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+economy&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Sports', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+sports&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Technology', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+technology&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Health', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+health&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true),
  ('Google News - Sri Lanka Education', 'rss', 'https://news.google.com/rss/search?q=Sri+Lanka+education&hl=en&gl=LK&ceid=LK:en', 'news.google.com', 'en', true, true)
ON CONFLICT (feed_url) DO UPDATE
SET 
  name = excluded.name,
  base_domain = excluded.base_domain,
  language = excluded.language,
  enabled = excluded.enabled,
  active = excluded.active;

