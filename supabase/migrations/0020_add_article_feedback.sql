-- Article-level feedback system
-- Allows users to report issues with specific articles (not just clusters)

-- Create article_feedback table
CREATE TABLE IF NOT EXISTS article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'report', 'inaccurate', 'misleading', 'spam', 'duplicate', 
    'broken_link', 'poor_quality', 'other'
  )),
  reason TEXT, -- Detailed reason
  comment TEXT, -- User comment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(article_id, user_id, feedback_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS article_feedback_article_idx ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS article_feedback_user_idx ON article_feedback(user_id);
CREATE INDEX IF NOT EXISTS article_feedback_type_idx ON article_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS article_feedback_status_idx ON article_feedback(status);
CREATE INDEX IF NOT EXISTS article_feedback_created_idx ON article_feedback(created_at DESC);

-- Add aggregate feedback columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3,2);

-- Create function to update article feedback counts
CREATE OR REPLACE FUNCTION update_article_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update report count for the affected article
  UPDATE articles
  SET report_count = (
    SELECT COUNT(*) FROM article_feedback 
    WHERE article_id = COALESCE(NEW.article_id, OLD.article_id) 
    AND feedback_type IN ('report', 'inaccurate', 'misleading', 'spam', 'poor_quality')
  )
  WHERE id = COALESCE(NEW.article_id, OLD.article_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS update_article_feedback_counts_trigger ON article_feedback;
CREATE TRIGGER update_article_feedback_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON article_feedback
FOR EACH ROW
EXECUTE FUNCTION update_article_feedback_counts();

-- Enable RLS on article_feedback table
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all feedback
CREATE POLICY "Users can read all article feedback"
ON article_feedback FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own feedback
CREATE POLICY "Authenticated users can insert article feedback"
ON article_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own article feedback"
ON article_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own article feedback"
ON article_feedback FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anonymous feedback (user_id IS NULL) can be inserted
CREATE POLICY "Anonymous article feedback can be inserted"
ON article_feedback FOR INSERT
WITH CHECK (user_id IS NULL);

-- Add comments for documentation
COMMENT ON TABLE article_feedback IS 'User feedback for specific articles including reports and quality issues';
COMMENT ON COLUMN article_feedback.feedback_type IS 'Type of feedback: report, inaccurate, misleading, spam, duplicate, broken_link, poor_quality, other';
COMMENT ON COLUMN article_feedback.status IS 'Moderation status: pending, reviewed, resolved, dismissed';
COMMENT ON FUNCTION update_article_feedback_counts IS 'Automatically updates aggregate feedback counts on articles table';

