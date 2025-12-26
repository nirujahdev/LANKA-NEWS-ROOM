-- Enhanced user preferences and activity tracking

-- Extend user_preferences table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'preferred_sources') THEN
    ALTER TABLE user_preferences ADD COLUMN preferred_sources UUID[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'blocked_sources') THEN
    ALTER TABLE user_preferences ADD COLUMN blocked_sources UUID[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'notification_preferences') THEN
    ALTER TABLE user_preferences ADD COLUMN notification_preferences JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'reading_preferences') THEN
    ALTER TABLE user_preferences ADD COLUMN reading_preferences JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'topic_interests') THEN
    ALTER TABLE user_preferences ADD COLUMN topic_interests TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'location_preferences') THEN
    ALTER TABLE user_preferences ADD COLUMN location_preferences TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'language_preference') THEN
    ALTER TABLE user_preferences ADD COLUMN language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'si', 'ta'));
  END IF;
END $$;

-- Create user_activity_summary table
CREATE TABLE IF NOT EXISTS user_activity_summary (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_articles_read INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  favorite_topics TEXT[],
  favorite_sources UUID[],
  last_active_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0, -- Daily reading streak
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update user activity summary
CREATE OR REPLACE FUNCTION update_user_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update activity summary when reading history is added
  IF TG_TABLE_NAME = 'user_reading_history' THEN
    INSERT INTO user_activity_summary (
      user_id,
      total_articles_read,
      total_time_spent_minutes,
      last_active_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      1,
      COALESCE(NEW.time_spent_seconds, 0) / 60,
      NEW.read_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      total_articles_read = user_activity_summary.total_articles_read + 1,
      total_time_spent_minutes = user_activity_summary.total_time_spent_minutes + 
        COALESCE(NEW.time_spent_seconds, 0) / 60,
      last_active_at = NEW.read_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update activity summary from reading history
DROP TRIGGER IF EXISTS update_user_activity_summary_trigger ON user_reading_history;
CREATE TRIGGER update_user_activity_summary_trigger
AFTER INSERT ON user_reading_history
FOR EACH ROW
EXECUTE FUNCTION update_user_activity_summary();

-- Enable RLS on user_activity_summary
ALTER TABLE user_activity_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own activity summary
CREATE POLICY "Users can read own activity summary"
ON user_activity_summary FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can update activity summary (via triggers)
CREATE POLICY "System can update activity summary"
ON user_activity_summary FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE user_activity_summary IS 'User activity summary for personalization and analytics';
COMMENT ON COLUMN user_preferences.preferred_sources IS 'Array of source IDs that user prefers';
COMMENT ON COLUMN user_preferences.blocked_sources IS 'Array of source IDs that user wants to hide';
COMMENT ON COLUMN user_preferences.notification_preferences IS 'JSON object with notification settings';
COMMENT ON COLUMN user_preferences.reading_preferences IS 'JSON object with reading settings (font size, dark mode, etc.)';
COMMENT ON COLUMN user_activity_summary.streak_days IS 'Consecutive days user has read articles';

