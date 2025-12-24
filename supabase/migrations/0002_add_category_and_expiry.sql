-- Add category and expires_at to clusters table
alter table public.clusters
  add column if not exists category text,
  add column if not exists expires_at timestamptz;

-- Create index on category for filtering
create index if not exists clusters_category_idx on public.clusters (category);

-- Create index on expires_at for cleanup queries
create index if not exists clusters_expires_at_idx on public.clusters (expires_at);

-- Create index on created_at for time-based queries
create index if not exists clusters_created_at_idx on public.clusters (created_at);

-- Update existing clusters to set expires_at (created_at + 30 days)
-- For clusters without created_at, use first_seen_at
update public.clusters
set expires_at = coalesce(created_at, first_seen_at) + interval '30 days'
where expires_at is null;

-- Set default expires_at for new clusters (via trigger or application logic)
-- We'll handle this in application code to ensure created_at + 30 days

-- Add check constraint to ensure category is one of the allowed values
alter table public.clusters
  add constraint clusters_category_check 
  check (category is null or category in ('politics', 'economy', 'sports', 'technology', 'health', 'education'));

