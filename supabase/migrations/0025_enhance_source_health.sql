-- Source reliability and article quality enhancements

-- Extend source_health table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'avg_article_quality') THEN
    ALTER TABLE source_health ADD COLUMN avg_article_quality NUMERIC(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'reliability_score') THEN
    ALTER TABLE source_health ADD COLUMN reliability_score NUMERIC(3,2) DEFAULT 1.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'last_success_rate') THEN
    ALTER TABLE source_health ADD COLUMN last_success_rate NUMERIC(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'avg_response_time_ms') THEN
    ALTER TABLE source_health ADD COLUMN avg_response_time_ms INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'total_articles_fetched') THEN
    ALTER TABLE source_health ADD COLUMN total_articles_fetched INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'source_health' AND column_name = 'total_articles_published') THEN
    ALTER TABLE source_health ADD COLUMN total_articles_published INTEGER DEFAULT 0;
  END IF;
END $$;

-- Extend articles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'quality_score') THEN
    ALTER TABLE articles ADD COLUMN quality_score NUMERIC(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'readability_score') THEN
    ALTER TABLE articles ADD COLUMN readability_score NUMERIC(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'fact_check_status') THEN
    ALTER TABLE articles ADD COLUMN fact_check_status TEXT CHECK (fact_check_status IN ('unchecked', 'verified', 'disputed', 'false'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'engagement_score') THEN
    ALTER TABLE articles ADD COLUMN engagement_score NUMERIC(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'last_quality_check_at') THEN
    ALTER TABLE articles ADD COLUMN last_quality_check_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create function to update source health metrics
CREATE OR REPLACE FUNCTION update_source_health_metrics()
RETURNS TRIGGER AS $$
DECLARE
  source_uuid UUID;
BEGIN
  -- Get source_id from article
  IF TG_TABLE_NAME = 'articles' THEN
    source_uuid := NEW.source_id;
    
    -- Update source_health metrics
    IF source_uuid IS NOT NULL THEN
      UPDATE source_health
      SET 
        total_articles_fetched = COALESCE(total_articles_fetched, 0) + 1,
        total_articles_published = CASE 
          WHEN NEW.cluster_id IS NOT NULL THEN COALESCE(total_articles_published, 0) + 1
          ELSE total_articles_published
        END,
        avg_article_quality = (
          SELECT AVG(quality_score)::NUMERIC(3,2)
          FROM articles
          WHERE source_id = source_uuid AND quality_score IS NOT NULL
        )
      WHERE source_id = source_uuid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update source health when articles are inserted/updated
DROP TRIGGER IF EXISTS update_source_health_metrics_trigger ON articles;
CREATE TRIGGER update_source_health_metrics_trigger
AFTER INSERT OR UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_source_health_metrics();

-- Add comments for documentation
COMMENT ON COLUMN source_health.avg_article_quality IS 'Average quality score of articles from this source (0.0 to 1.0)';
COMMENT ON COLUMN source_health.reliability_score IS 'Overall reliability score based on success rate and quality (0.0 to 1.0)';
COMMENT ON COLUMN source_health.last_success_rate IS 'Percentage of successful RSS feed fetches';
COMMENT ON COLUMN articles.quality_score IS 'AI-generated quality score (0.0 to 1.0)';
COMMENT ON COLUMN articles.readability_score IS 'Flesch reading ease score';
COMMENT ON COLUMN articles.fact_check_status IS 'Fact-check status: unchecked, verified, disputed, false';
COMMENT ON COLUMN articles.engagement_score IS 'Engagement score based on views, time spent, shares, etc.';
COMMENT ON FUNCTION update_source_health_metrics IS 'Automatically updates source health metrics when articles are created or updated';

