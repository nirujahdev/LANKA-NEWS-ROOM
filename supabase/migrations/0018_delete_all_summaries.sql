-- Delete all summaries to allow regeneration with improved pipeline
-- This migration removes all existing summaries so they can be regenerated
-- with enhanced quality and translation accuracy

DELETE FROM summaries;

-- Log the deletion
DO $$
BEGIN
  RAISE NOTICE 'All summaries have been deleted. Pipeline will regenerate them with improved quality on next run.';
END $$;


