-- ============================================
-- Database Verification Queries
-- Run this to verify all migrations applied correctly
-- ============================================

-- Check Extensions
\echo 'Checking Extensions...'
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- Check Enums
\echo 'Checking Enums...'
SELECT typname, oid 
FROM pg_type 
WHERE typname IN ('lang_code', 'cluster_status');

-- Check Tables Exist
\echo 'Checking Tables...'
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'sources', 
    'clusters', 
    'articles', 
    'cluster_articles', 
    'summaries', 
    'pipeline_runs', 
    'pipeline_errors'
  )
ORDER BY tablename;

-- Check Sources Table Columns
\echo 'Checking Sources Table Schema...'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sources'
ORDER BY ordinal_position;

-- Check Clusters Table Columns (including new ones)
\echo 'Checking Clusters Table Schema...'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clusters'
ORDER BY ordinal_position;

-- Check Indexes
\echo 'Checking Indexes...'
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sources', 'clusters', 'articles')
ORDER BY tablename, indexname;

-- Check Constraints
\echo 'Checking Constraints...'
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('sources', 'clusters')
ORDER BY tc.table_name, tc.constraint_type;

-- Check Seeded Sources
\echo 'Checking Seeded Sources...'
SELECT 
  id,
  name,
  type,
  feed_url,
  base_domain,
  active,
  enabled,
  language
FROM public.sources
ORDER BY name;

-- Verify base_domain is set for all active sources
\echo 'Verifying base_domain for active sources...'
SELECT 
  name,
  active,
  base_domain,
  CASE 
    WHEN active = true AND base_domain IS NULL THEN 'ERROR: Missing base_domain'
    WHEN active = true AND base_domain IS NOT NULL THEN 'OK'
    ELSE 'OK (inactive)'
  END as status
FROM public.sources
ORDER BY active DESC, name;

-- Count Records
\echo 'Record Counts...'
SELECT 
  'sources' as table_name,
  COUNT(*) as count
FROM public.sources
UNION ALL
SELECT 
  'clusters' as table_name,
  COUNT(*) as count
FROM public.clusters
UNION ALL
SELECT 
  'articles' as table_name,
  COUNT(*) as count
FROM public.articles
UNION ALL
SELECT 
  'summaries' as table_name,
  COUNT(*) as count
FROM public.summaries;

\echo '============================================'
\echo 'Verification Complete!'
\echo '============================================'

