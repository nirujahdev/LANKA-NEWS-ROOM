-- Add status tracking to articles table for pipeline processing
-- Status: 'new' (default), 'processing', 'processed', 'failed'

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'processing', 'processed', 'failed'));

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Create index on status for efficient querying
CREATE INDEX IF NOT EXISTS articles_status_idx ON public.articles (status) 
  WHERE status IN ('new', 'processing');

-- Create index on processed_at for tracking
CREATE INDEX IF NOT EXISTS articles_processed_at_idx ON public.articles (processed_at);

-- Update existing articles to have 'processed' status if they have cluster_id
UPDATE public.articles
SET status = 'processed', processed_at = COALESCE(created_at, NOW())
WHERE cluster_id IS NOT NULL AND status = 'new';

