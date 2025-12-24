-- Seed initial RSS sources for Sri Lanka news
-- Includes base_domain for domain validation security

insert into public.sources (name, type, feed_url, base_domain, language, enabled, active)
values
  ('Ada Derana', 'rss', 'https://www.adaderana.lk/rss.php', 'adaderana.lk', 'si', true, true),
  ('Daily Mirror', 'rss', 'https://www.dailymirror.lk/RSS_Feeds/breaking-news/108', 'dailymirror.lk', 'en', true, true),
  ('NewsFirst', 'rss', 'https://www.newsfirst.lk/feed/', 'newsfirst.lk', 'en', true, true),
  ('Hiru News', 'rss', 'https://www.hirunews.lk/rss/english.xml', 'hirunews.lk', 'en', true, true),
  ('Colombo Page', 'rss', 'http://www.colombopage.com/rss/colombopage-latest.xml', 'colombopage.com', 'en', true, true)
on conflict (feed_url) do update
set 
  name = excluded.name,
  base_domain = excluded.base_domain,
  enabled = excluded.enabled,
  active = excluded.active;

