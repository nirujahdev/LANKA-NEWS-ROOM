-- Migration: Optimize RLS Policy Performance
-- Fixes auth_rls_initplan warnings and consolidates redundant policies

-- ============================================
-- DROP OLD REDUNDANT POLICIES
-- ============================================
-- The service_role doesn't need explicit policies because it bypasses RLS
-- Having both public and service_role policies causes multiple permissive policies warning

-- Drop service role policies (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role full access to articles" ON public.articles;
DROP POLICY IF EXISTS "Service role full access to sources" ON public.sources;
DROP POLICY IF EXISTS "Service role full access to cluster_articles" ON public.cluster_articles;
DROP POLICY IF EXISTS "Service role full access to summaries" ON public.summaries;
DROP POLICY IF EXISTS "Service role full access to clusters" ON public.clusters;
DROP POLICY IF EXISTS "Service role full access to pipeline_runs" ON public.pipeline_runs;
DROP POLICY IF EXISTS "Service role full access to pipeline_errors" ON public.pipeline_errors;
DROP POLICY IF EXISTS "Service role full access to pipeline_locks" ON public.pipeline_locks;
DROP POLICY IF EXISTS "Service role full access to pipeline_settings" ON public.pipeline_settings;

-- ============================================
-- GRANT DIRECT TABLE PERMISSIONS TO SERVICE_ROLE
-- ============================================
-- Service role needs direct grants to bypass RLS

-- Grant all permissions to service_role on all tables
GRANT ALL ON public.articles TO service_role;
GRANT ALL ON public.sources TO service_role;
GRANT ALL ON public.cluster_articles TO service_role;
GRANT ALL ON public.summaries TO service_role;
GRANT ALL ON public.clusters TO service_role;
GRANT ALL ON public.pipeline_runs TO service_role;
GRANT ALL ON public.pipeline_errors TO service_role;
GRANT ALL ON public.pipeline_locks TO service_role;
GRANT ALL ON public.pipeline_settings TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.articles IS 'Articles table with RLS enabled. Public read access. Service role has direct grants.';
COMMENT ON TABLE public.sources IS 'Sources table with RLS enabled. Public read access. Service role has direct grants.';
COMMENT ON TABLE public.clusters IS 'Clusters table with RLS enabled. Public read access. Service role has direct grants.';
COMMENT ON TABLE public.pipeline_locks IS 'Pipeline locks with RLS enabled. Public read access. Service role has direct grants.';
COMMENT ON TABLE public.pipeline_settings IS 'Pipeline settings with RLS enabled. Public read access. Service role has direct grants.';

