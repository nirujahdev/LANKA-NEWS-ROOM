-- User feedback system for clusters
-- Allows users to like, report, and rate summaries

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'report', 'helpful', 'not_helpful')),
  reason TEXT, -- For reports: 'inaccurate', 'misleading', 'spam', 'other'
  comment TEXT, -- Optional user comment
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cluster_id, user_id, feedback_type) -- One feedback per type per user
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_feedback_cluster_idx ON user_feedback(cluster_id);
CREATE INDEX IF NOT EXISTS user_feedback_user_idx ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS user_feedback_type_idx ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS user_feedback_created_idx ON user_feedback(created_at DESC);

-- Add aggregate feedback counts to clusters table
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Create function to update cluster feedback counts
CREATE OR REPLACE FUNCTION update_cluster_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for the affected cluster
  UPDATE clusters
  SET 
    like_count = (
      SELECT COUNT(*) FROM user_feedback 
      WHERE cluster_id = COALESCE(NEW.cluster_id, OLD.cluster_id) 
      AND feedback_type = 'like'
    ),
    report_count = (
      SELECT COUNT(*) FROM user_feedback 
      WHERE cluster_id = COALESCE(NEW.cluster_id, OLD.cluster_id) 
      AND feedback_type = 'report'
    ),
    helpful_count = (
      SELECT COUNT(*) FROM user_feedback 
      WHERE cluster_id = COALESCE(NEW.cluster_id, OLD.cluster_id) 
      AND feedback_type = 'helpful'
    )
  WHERE id = COALESCE(NEW.cluster_id, OLD.cluster_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS update_feedback_counts_trigger ON user_feedback;
CREATE TRIGGER update_feedback_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_feedback
FOR EACH ROW
EXECUTE FUNCTION update_cluster_feedback_counts();

-- Enable RLS on user_feedback table
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all feedback
CREATE POLICY "Users can read all feedback"
ON user_feedback FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own feedback
CREATE POLICY "Authenticated users can insert feedback"
ON user_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON user_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
ON user_feedback FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anonymous feedback (user_id IS NULL) can be inserted
CREATE POLICY "Anonymous feedback can be inserted"
ON user_feedback FOR INSERT
WITH CHECK (user_id IS NULL);

-- Add comments for documentation
COMMENT ON TABLE user_feedback IS 'User feedback for news clusters including likes, reports, and helpfulness ratings';
COMMENT ON COLUMN user_feedback.feedback_type IS 'Type of feedback: like, dislike, report, helpful, not_helpful';
COMMENT ON COLUMN user_feedback.reason IS 'Reason for report: inaccurate, misleading, spam, other';
COMMENT ON FUNCTION update_cluster_feedback_counts IS 'Automatically updates aggregate feedback counts on clusters table';

