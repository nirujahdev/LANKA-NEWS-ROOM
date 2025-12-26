-- Migration: Complete Database Cleanup
-- This migration deletes ALL data from clusters, summaries, articles, and cluster_articles tables
-- WARNING: This will delete ALL existing data. Use with caution.
-- 
-- Execution order respects foreign key constraints:
-- 1. Delete summaries (references clusters)
-- 2. Delete cluster_articles (references clusters and articles)
-- 3. Unlink articles from clusters
-- 4. Delete articles
-- 5. Delete clusters
--
-- Tables preserved:
-- - sources (RSS feed sources are kept)
-- - pipeline_runs (optional: kept for history, can be cleared if needed)
-- - pipeline_errors (optional: kept for history, can be cleared if needed)

-- Starting complete database cleanup
DO $$
BEGIN
  RAISE NOTICE 'Starting complete database cleanup...';
END $$;

-- Step 1: Delete all summaries
DELETE FROM summaries;

-- Step 2: Delete all cluster_articles links
DELETE FROM cluster_articles;

-- Step 3: Unlink articles from clusters (set cluster_id to NULL)
UPDATE articles SET cluster_id = NULL;

-- Step 4: Delete all articles
DELETE FROM articles;

-- Step 5: Delete all clusters
DELETE FROM clusters;

-- Optional: Clear pipeline history (uncomment if needed)
-- DELETE FROM pipeline_errors;
-- DELETE FROM pipeline_runs;

DO $$
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully. All clusters, summaries, and articles have been deleted.';
END $$;

