-- Migration 4: Pipeline Locks and Settings
-- Adds distributed lock mechanism and pipeline settings tracking

-- ============================================
-- Pipeline Locks Table
-- ============================================
-- Used for distributed locking to prevent concurrent pipeline executions
-- Lock expires automatically after TTL (time-to-live) period

create table if not exists public.pipeline_locks (
  name text primary key,
  locked_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists pipeline_locks_locked_until_idx 
  on public.pipeline_locks (locked_until);

comment on table public.pipeline_locks is 'Distributed locks for pipeline execution. Prevents concurrent runs.';
comment on column public.pipeline_locks.name is 'Lock identifier (e.g., "cron_pipeline")';
comment on column public.pipeline_locks.locked_until is 'Lock expiration timestamp. If locked_until < now(), lock is expired.';
comment on column public.pipeline_locks.updated_at is 'Last update timestamp for monitoring.';

-- ============================================
-- Pipeline Settings Table
-- ============================================
-- Single-row table for tracking pipeline state and configuration
-- Uses name as primary key to ensure single row

create table if not exists public.pipeline_settings (
  name text primary key default 'main',
  last_successful_run timestamptz,
  updated_at timestamptz not null default now()
);

-- Insert default row if it doesn't exist
insert into public.pipeline_settings (name, last_successful_run)
values ('main', null)
on conflict (name) do nothing;

create index if not exists pipeline_settings_name_idx 
  on public.pipeline_settings (name);

comment on table public.pipeline_settings is 'Pipeline configuration and state tracking. Single-row table.';
comment on column public.pipeline_settings.name is 'Settings identifier (always "main" for single-row pattern)';
comment on column public.pipeline_settings.last_successful_run is 'Timestamp of last successful pipeline run. Used for early-exit optimization.';

-- ============================================
-- Atomic Lock Acquisition Function
-- ============================================
-- PostgreSQL function for atomic lock acquisition.
-- Returns true if lock was acquired, false if already locked.
-- Uses INSERT ... ON CONFLICT with conditional update.

create or replace function public.acquire_pipeline_lock(
  lock_name text,
  lock_until timestamptz,
  current_ts timestamptz
) returns boolean
language plpgsql
as $$
declare
  existing_locked_until timestamptz;
begin
  -- Try to insert (if lock doesn't exist)
  insert into public.pipeline_locks (name, locked_until, updated_at)
  values (lock_name, lock_until, current_ts)
  on conflict (name) do nothing;
  
  -- Check if insert succeeded (lock didn't exist)
  if not found then
    -- Lock exists - check if expired
    select locked_until into existing_locked_until
    from public.pipeline_locks
    where name = lock_name;
    
    -- If expired, update it
    if existing_locked_until <= current_ts then
      update public.pipeline_locks
      set locked_until = lock_until,
          updated_at = current_ts
      where name = lock_name
        and locked_until <= current_ts;
      
      return true; -- Lock acquired (updated expired lock)
    else
      return false; -- Lock is still active
    end if;
  else
    return true; -- Lock acquired (inserted new lock)
  end if;
end;
$$;

comment on function public.acquire_pipeline_lock is 'Atomically acquires a pipeline lock. Returns true if acquired, false if already locked.';

