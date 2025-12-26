-- User bookmarks system
-- Allows users to save/bookmark clusters or articles

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  notes TEXT, -- User's personal notes
  tags TEXT[], -- User-defined tags
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, cluster_id, article_id),
  CHECK (
    (cluster_id IS NOT NULL AND article_id IS NULL) OR 
    (cluster_id IS NULL AND article_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_bookmarks_user_idx ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_cluster_idx ON user_bookmarks(cluster_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_article_idx ON user_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_created_idx ON user_bookmarks(created_at DESC);

-- Enable RLS on user_bookmarks table
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own bookmarks
CREATE POLICY "Users can read own bookmarks"
ON user_bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks"
ON user_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
ON user_bookmarks FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
ON user_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_bookmarks IS 'User bookmarks for clusters or articles with personal notes and tags';
COMMENT ON COLUMN user_bookmarks.notes IS 'User personal notes about the bookmarked item';
COMMENT ON COLUMN user_bookmarks.tags IS 'User-defined tags for organizing bookmarks';

