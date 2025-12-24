-- Fix articles table to support hash-based deduplication
-- Drop the existing non-unique hash index
DROP INDEX IF EXISTS articles_hash_idx;

-- Create a unique index on hash (where hash is not null)
-- This allows the pipeline to use onConflict: 'hash' for deduplication
CREATE UNIQUE INDEX articles_hash_unique ON public.articles (hash) WHERE hash IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX articles_hash_unique IS 'Unique constraint on article hash for deduplication. Hash is computed from url, guid, and title combination.';

