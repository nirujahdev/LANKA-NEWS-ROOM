-- User reading history system
-- Tracks what users read and how long they spend

-- Create user_reading_history table
CREATE TABLE IF NOT EXISTS user_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  time_spent_seconds INTEGER, -- How long user spent reading
  scroll_depth NUMERIC(3,2), -- 0.0 to 1.0 (how much of article was viewed)
  referrer TEXT, -- Where user came from
  device_type TEXT -- mobile, desktop, tablet
);

-- Note: One entry per day per item is enforced in application logic
-- Unique constraint allows multiple entries but application should check date

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_reading_history_user_idx ON user_reading_history(user_id);
CREATE INDEX IF NOT EXISTS user_reading_history_cluster_idx ON user_reading_history(cluster_id);
CREATE INDEX IF NOT EXISTS user_reading_history_article_idx ON user_reading_history(article_id);
CREATE INDEX IF NOT EXISTS user_reading_history_read_at_idx ON user_reading_history(read_at DESC);

-- Enable RLS on user_reading_history table
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own history
CREATE POLICY "Users can read own reading history"
ON user_reading_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own reading history"
ON user_reading_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own reading history"
ON user_reading_history FOR DELETE
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_reading_history IS 'Tracks user reading history with time spent and engagement metrics';
COMMENT ON COLUMN user_reading_history.scroll_depth IS 'Percentage of content viewed (0.0 to 1.0)';
COMMENT ON COLUMN user_reading_history.time_spent_seconds IS 'Time user spent reading the content';

