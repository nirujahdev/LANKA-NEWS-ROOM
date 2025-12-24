-- Migration: Fix Security and Performance Issues
-- Fixes RLS, function security, and adds missing indexes

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

-- Enable RLS on all public tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE RLS POLICIES FOR READ ACCESS
-- ============================================

-- Public read access for articles (published content)
CREATE POLICY "Public read access for articles"
  ON public.articles FOR SELECT
  USING (true);

-- Public read access for sources
CREATE POLICY "Public read access for sources"
  ON public.sources FOR SELECT
  USING (true);

-- Public read access for cluster_articles
CREATE POLICY "Public read access for cluster_articles"
  ON public.cluster_articles FOR SELECT
  USING (true);

-- Public read access for summaries
CREATE POLICY "Public read access for summaries"
  ON public.summaries FOR SELECT
  USING (true);

-- Public read access for clusters
CREATE POLICY "Public read access for clusters"
  ON public.clusters FOR SELECT
  USING (true);

-- Read-only access for pipeline_runs (monitoring)
CREATE POLICY "Public read access for pipeline_runs"
  ON public.pipeline_runs FOR SELECT
  USING (true);

-- Read-only access for pipeline_errors (monitoring)
CREATE POLICY "Public read access for pipeline_errors"
  ON public.pipeline_errors FOR SELECT
  USING (true);

-- Read-only access for pipeline_locks (monitoring)
CREATE POLICY "Public read access for pipeline_locks"
  ON public.pipeline_locks FOR SELECT
  USING (true);

-- Read-only access for pipeline_settings (monitoring)
CREATE POLICY "Public read access for pipeline_settings"
  ON public.pipeline_settings FOR SELECT
  USING (true);

-- ============================================
-- 3. CREATE RLS POLICIES FOR SERVICE ROLE
-- ============================================
-- Service role (backend) has full access to all tables

-- Service role full access to articles
CREATE POLICY "Service role full access to articles"
  ON public.articles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to sources
CREATE POLICY "Service role full access to sources"
  ON public.sources FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to cluster_articles
CREATE POLICY "Service role full access to cluster_articles"
  ON public.cluster_articles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to summaries
CREATE POLICY "Service role full access to summaries"
  ON public.summaries FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to clusters
CREATE POLICY "Service role full access to clusters"
  ON public.clusters FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to pipeline_runs
CREATE POLICY "Service role full access to pipeline_runs"
  ON public.pipeline_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to pipeline_errors
CREATE POLICY "Service role full access to pipeline_errors"
  ON public.pipeline_errors FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to pipeline_locks
CREATE POLICY "Service role full access to pipeline_locks"
  ON public.pipeline_locks FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role full access to pipeline_settings
CREATE POLICY "Service role full access to pipeline_settings"
  ON public.pipeline_settings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 4. FIX FUNCTION SECURITY (search_path)
-- ============================================

-- Drop and recreate acquire_pipeline_lock with secure search_path
DROP FUNCTION IF EXISTS public.acquire_pipeline_lock(text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.acquire_pipeline_lock(
  lock_name text,
  lock_until timestamptz,
  current_ts timestamptz
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- Fixed: immutable search_path
AS $$
DECLARE
  existing_locked_until timestamptz;
BEGIN
  -- Try to insert (if lock doesn't exist)
  INSERT INTO public.pipeline_locks (name, locked_until, updated_at)
  VALUES (lock_name, lock_until, current_ts)
  ON CONFLICT (name) DO NOTHING;
  
  -- Check if insert succeeded (lock didn't exist)
  IF NOT FOUND THEN
    -- Lock exists - check if expired
    SELECT locked_until INTO existing_locked_until
    FROM public.pipeline_locks
    WHERE name = lock_name;
    
    -- If expired, update it
    IF existing_locked_until <= current_ts THEN
      UPDATE public.pipeline_locks
      SET locked_until = lock_until,
          updated_at = current_ts
      WHERE name = lock_name
        AND locked_until <= current_ts;
      
      RETURN TRUE; -- Lock acquired (updated expired lock)
    ELSE
      RETURN FALSE; -- Lock is still active
    END IF;
  ELSE
    RETURN TRUE; -- Lock acquired (inserted new lock)
  END IF;
END;
$$;

COMMENT ON FUNCTION public.acquire_pipeline_lock IS 'Atomically acquires a pipeline lock with secure search_path. Returns true if acquired, false if already locked.';

-- ============================================
-- 5. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================

-- Index for articles.cluster_id (foreign key)
CREATE INDEX IF NOT EXISTS articles_cluster_id_idx 
  ON public.articles (cluster_id);

-- Index for cluster_articles.article_id (foreign key)
CREATE INDEX IF NOT EXISTS cluster_articles_article_id_idx 
  ON public.cluster_articles (article_id);

-- Index for pipeline_errors.run_id (foreign key)
CREATE INDEX IF NOT EXISTS pipeline_errors_run_id_idx 
  ON public.pipeline_errors (run_id);

-- Index for pipeline_errors.source_id (foreign key)
CREATE INDEX IF NOT EXISTS pipeline_errors_source_id_idx 
  ON public.pipeline_errors (source_id);

-- ============================================
-- VERIFICATION COMMENTS
-- ============================================

COMMENT ON TABLE public.articles IS 'Articles table with RLS enabled. Public read, service role write.';
COMMENT ON TABLE public.sources IS 'Sources table with RLS enabled. Public read, service role write.';
COMMENT ON TABLE public.clusters IS 'Clusters table with RLS enabled. Public read, service role write.';
COMMENT ON TABLE public.pipeline_locks IS 'Pipeline locks with RLS enabled. Public read, service role write.';
COMMENT ON TABLE public.pipeline_settings IS 'Pipeline settings with RLS enabled. Public read, service role write.';

