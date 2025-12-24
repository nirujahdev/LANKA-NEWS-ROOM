# Topic-Based Categorization & 30-Day Retention

## Overview

This implementation adds topic-based categorization and a 30-day retention policy to the news pipeline.

## Features

### 1. Fixed Topic Categories

The system uses exactly 6 categories:
- `politics` - Government, elections, political parties
- `economy` - Finance, fuel prices, economic policy
- `sports` - Cricket, football, sports events
- `technology` - Tech news, digital services
- `health` - Disease, hospitals, health services
- `education` - Exams, schools, universities

### 2. AI-Powered Categorization

- Each cluster is automatically categorized when it reaches 2+ sources
- Uses OpenAI to analyze headlines and content excerpts
- Returns exactly one category from the allowed list
- Defaults to `politics` if uncertain

### 3. 30-Day Retention Policy

- All clusters are visible for 30 days from creation
- On the 1st of every month, clusters older than 30 days are automatically deleted
- No infinite archive or search functionality

### 4. Feed Types

**Home Feed** (`feed=home`):
- Shows clusters from last 24 hours
- Ordered by `last_seen_at` (most recently updated first)
- Highlights important, breaking news

**Recent Feed** (`feed=recent`):
- Shows all clusters from last 30 days
- Ordered by `created_at` (newest first)
- Full 30-day history

**Topic Pages** (`category=politics|economy|...`):
- Filtered by specific category
- Last 30 days only
- Ordered by `updated_at`

## Database Changes

### Migration: `0002_add_category_and_expiry.sql`

Adds to `clusters` table:
- `category` (TEXT) - One of the 6 allowed categories
- `expires_at` (TIMESTAMPTZ) - Auto-calculated as `created_at + 30 days`
- Indexes on `category`, `expires_at`, and `created_at`

## API Changes

### GET `/api/clusters`

New query parameters:
- `feed=home` - Last 24 hours, ordered by last_updated
- `feed=recent` - Last 30 days, ordered by created_at
- `category=politics|economy|sports|technology|health|education` - Filter by category

Examples:
```
GET /api/clusters?lang=en&feed=home
GET /api/clusters?lang=si&feed=recent
GET /api/clusters?lang=en&category=politics
GET /api/clusters?lang=en&feed=recent&category=economy
```

### Response Format

Clusters now include:
```json
{
  "id": "...",
  "headline": "...",
  "category": "politics",
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-02-14T10:00:00Z",
  ...
}
```

## Cron Jobs

### Daily Ingestion (`/api/cron/ingest`)

Enhanced to:
1. Fetch RSS feeds
2. Cluster articles
3. **Categorize new clusters** (when source_count >= 2)
4. Summarize eligible clusters
5. Set `expires_at` for new clusters

### Monthly Cleanup (`/api/cron/cleanup`)

New cron job that:
1. Runs on 1st of every month at 00:00 UTC
2. Deletes clusters where `created_at < NOW() - 30 days`
3. Cascades deletion to related summaries and cluster_articles
4. Unlinks articles from deleted clusters

## Frontend Integration

### Updated API Client

```typescript
import { loadClusters } from '@/lib/api';

// Home feed (24h)
const homeNews = await loadClusters('en', 'home');

// Recent feed (30d)
const recentNews = await loadClusters('en', 'recent');

// Politics category
const politicsNews = await loadClusters('en', null, 'politics');

// Recent politics news
const recentPolitics = await loadClusters('en', 'recent', 'politics');
```

## Implementation Details

### Categorization Logic

Located in `lib/categorize.ts`:
- Uses OpenAI `gpt-4o-mini` (same as summarization)
- Analyzes up to 6 articles per cluster
- Uses title + content_excerpt (first 500 chars)
- Includes Sri Lankan context hints (ICC → sports, MOH → health)
- Validates response against allowed categories
- Falls back to `politics` on error or uncertainty

### Expiry Calculation

When creating a new cluster:
```typescript
const now = new Date();
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
```

### Cleanup Safety

The cleanup cron:
- Only deletes clusters older than 30 days
- Preserves articles (unlinks them, doesn't delete)
- Logs all deletions for audit
- Can be run manually for testing

## Testing

### Test Categorization

```bash
# Trigger ingestion (will categorize new clusters)
curl -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.vercel.app/api/cron/ingest
```

### Test Cleanup (Careful!)

```bash
# Manually trigger cleanup (deletes old data!)
curl -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.vercel.app/api/cron/cleanup
```

### Check Categories

```sql
-- View categorized clusters
SELECT category, COUNT(*) 
FROM clusters 
WHERE status = 'published' 
GROUP BY category;

-- View uncategorized clusters (should be minimal)
SELECT id, headline, source_count 
FROM clusters 
WHERE status = 'published' AND category IS NULL;
```

## Migration Steps

1. **Apply database migration**:
   ```sql
   -- Run supabase/migrations/0002_add_category_and_expiry.sql
   ```

2. **Deploy updated code** to Vercel

3. **Set up cron jobs** in Vercel (see `docs/cron-setup.md`)

4. **Verify**:
   - Daily ingestion categorizes new clusters
   - Monthly cleanup runs on 1st of month
   - API routes return category and respect expiry

## Notes

- Categories are assigned only to published clusters (source_count >= 2)
- Unpublished clusters remain uncategorized until published
- Expiry is calculated at cluster creation time
- Cleanup runs automatically but can be triggered manually
- No search or archive functionality - only 30-day window

