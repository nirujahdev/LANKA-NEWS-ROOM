-- Add district column to articles table
-- Districts are more specific than cities and allow better location-based filtering

-- Add district column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS district TEXT;

-- Create index for district filtering
CREATE INDEX IF NOT EXISTS articles_district_idx ON articles(district) WHERE district IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN articles.district IS 'District where the news event takes place (one of 25 Sri Lankan districts)';

