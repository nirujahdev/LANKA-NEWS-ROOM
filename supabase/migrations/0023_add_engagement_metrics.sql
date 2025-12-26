-- Engagement metrics system
-- Tracks aggregate and individual engagement metrics

-- Create cluster_engagement table
CREATE TABLE IF NOT EXISTS cluster_engagement (
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE PRIMARY KEY,
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_time_spent_seconds NUMERIC(10,2),
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_views table
CREATE TABLE IF NOT EXISTS user_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  time_spent_seconds INTEGER,
  referrer TEXT, -- Where user came from
  device_type TEXT -- mobile, desktop, tablet
);

-- Note: One entry per day per item is enforced in application logic
-- Unique constraint allows multiple entries but application should check date

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_views_cluster_idx ON user_views(cluster_id);
CREATE INDEX IF NOT EXISTS user_views_user_idx ON user_views(user_id);
CREATE INDEX IF NOT EXISTS user_views_article_idx ON user_views(article_id);
CREATE INDEX IF NOT EXISTS user_views_viewed_at_idx ON user_views(viewed_at DESC);

-- Create function to update cluster engagement when views are inserted
CREATE OR REPLACE FUNCTION update_cluster_engagement()
RETURNS TRIGGER AS $$
DECLARE
  cluster_uuid UUID;
BEGIN
  -- Determine cluster_id from the view
  IF NEW.cluster_id IS NOT NULL THEN
    cluster_uuid := NEW.cluster_id;
  ELSIF NEW.article_id IS NOT NULL THEN
    -- Get cluster_id from article
    SELECT cluster_id INTO cluster_uuid FROM articles WHERE id = NEW.article_id;
  END IF;
  
  IF cluster_uuid IS NOT NULL THEN
    -- Insert or update cluster_engagement
    INSERT INTO cluster_engagement (cluster_id, view_count, unique_viewers, last_viewed_at, updated_at)
    VALUES (
      cluster_uuid,
      1,
      CASE WHEN NEW.user_id IS NOT NULL THEN 1 ELSE 0 END,
      NEW.viewed_at,
      NOW()
    )
    ON CONFLICT (cluster_id) DO UPDATE
    SET 
      view_count = cluster_engagement.view_count + 1,
      unique_viewers = CASE 
        WHEN NEW.user_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM user_views 
          WHERE cluster_id = cluster_uuid 
          AND user_id = NEW.user_id 
          AND DATE(viewed_at) < DATE(NEW.viewed_at)
        ) THEN cluster_engagement.unique_viewers + 1
        ELSE cluster_engagement.unique_viewers
      END,
      last_viewed_at = NEW.viewed_at,
      updated_at = NOW();
    
    -- Update average time spent if time_spent_seconds is provided
    IF NEW.time_spent_seconds IS NOT NULL THEN
      UPDATE cluster_engagement
      SET avg_time_spent_seconds = (
        SELECT AVG(time_spent_seconds)::NUMERIC(10,2)
        FROM user_views
        WHERE cluster_id = cluster_uuid AND time_spent_seconds IS NOT NULL
      )
      WHERE cluster_id = cluster_uuid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update cluster engagement
DROP TRIGGER IF EXISTS update_cluster_engagement_trigger ON user_views;
CREATE TRIGGER update_cluster_engagement_trigger
AFTER INSERT ON user_views
FOR EACH ROW
EXECUTE FUNCTION update_cluster_engagement();

-- Enable RLS on tables
ALTER TABLE cluster_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_views ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for cluster_engagement (aggregate data)
CREATE POLICY "Public can read cluster engagement"
ON cluster_engagement FOR SELECT
USING (true);

-- Policy: Users can read their own views
CREATE POLICY "Users can read own views"
ON user_views FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert their own views
CREATE POLICY "Users can insert own views"
ON user_views FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Anonymous views can be inserted
CREATE POLICY "Anonymous views can be inserted"
ON user_views FOR INSERT
WITH CHECK (user_id IS NULL);

-- Add comments for documentation
COMMENT ON TABLE cluster_engagement IS 'Aggregate engagement metrics for clusters';
COMMENT ON TABLE user_views IS 'Individual user view tracking for analytics';
COMMENT ON FUNCTION update_cluster_engagement IS 'Automatically updates cluster engagement metrics when views are recorded';

