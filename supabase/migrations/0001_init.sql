-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lang_code') then
    create type lang_code as enum ('en', 'si', 'ta', 'unk');
  end if;

  if not exists (select 1 from pg_type where typname = 'cluster_status') then
    create type cluster_status as enum ('draft', 'published');
  end if;
end$$;

create table if not exists public.sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('rss', 'x', 'facebook')),
  feed_url text not null,
  language lang_code default 'unk'::lang_code,
  enabled boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists sources_feed_url_idx on public.sources (feed_url);

create table if not exists public.clusters (
  id uuid primary key default uuid_generate_v4(),
  headline text not null,
  status cluster_status default 'draft'::cluster_status,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  source_count integer default 0,
  article_count integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists clusters_status_idx on public.clusters (status);
create index if not exists clusters_last_seen_idx on public.clusters (last_seen_at);

create table if not exists public.articles (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null references public.sources(id),
  title text not null,
  url text not null,
  guid text,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  content_text text,
  content_excerpt text,
  lang lang_code default 'unk'::lang_code,
  hash text,
  cluster_id uuid references public.clusters(id),
  created_at timestamptz default now()
);

create unique index if not exists articles_url_unique on public.articles (url);
create unique index if not exists articles_guid_unique on public.articles (guid) where guid is not null;
create index if not exists articles_hash_idx on public.articles (hash);
create index if not exists articles_source_idx on public.articles (source_id);
create index if not exists articles_published_idx on public.articles (published_at);

create table if not exists public.cluster_articles (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid not null references public.clusters(id),
  article_id uuid not null references public.articles(id),
  created_at timestamptz default now(),
  unique (cluster_id, article_id)
);

create table if not exists public.summaries (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid not null references public.clusters(id),
  summary_en text,
  summary_si text,
  summary_ta text,
  model text,
  prompt_version text,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists summaries_cluster_unique on public.summaries (cluster_id);

create table if not exists public.pipeline_runs (
  id uuid primary key default uuid_generate_v4(),
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text check (status in ('started', 'success', 'error')),
  notes text
);

create table if not exists public.pipeline_errors (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid references public.pipeline_runs(id),
  source_id uuid references public.sources(id),
  stage text,
  error_message text,
  created_at timestamptz default now()
);

