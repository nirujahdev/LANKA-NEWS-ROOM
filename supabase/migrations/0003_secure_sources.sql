-- Update sources table to add base_domain and active fields
-- This enables domain validation to prevent feed poisoning

-- Add base_domain column (stores the allowed domain for articles from this source)
alter table public.sources
  add column if not exists base_domain text;

-- Add active column (replaces 'enabled' for clarity, but keep enabled for backward compatibility)
alter table public.sources
  add column if not exists active boolean default true;

-- Create index on active for faster filtering
create index if not exists sources_active_idx on public.sources (active) where active = true;

-- Create index on base_domain for validation queries
create index if not exists sources_base_domain_idx on public.sources (base_domain);

-- Update existing sources: set active = enabled if enabled exists
update public.sources
set active = coalesce(enabled, true)
where active is null;

-- Extract base_domain from feed_url for existing sources (if not set)
-- This is a helper - you should manually verify and set base_domain for each source
update public.sources
set base_domain = (
  select regexp_replace(
    regexp_replace(feed_url, '^https?://', ''),
    '/.*$', ''
  )
)
where base_domain is null and feed_url is not null;

-- Add constraint: base_domain must be set for active sources
alter table public.sources
  add constraint sources_active_requires_domain
  check (active = false or base_domain is not null);

-- Add comment explaining security purpose
comment on column public.sources.base_domain is 'Allowed domain for articles from this source. Used to prevent feed poisoning and malicious redirects.';

