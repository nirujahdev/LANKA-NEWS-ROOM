# Cron Jobs Setup Guide

## Daily Ingestion Cron

**Endpoint**: `/api/cron/ingest`  
**Schedule**: Every 10 minutes (or as needed)  
**Purpose**: Fetch RSS feeds, cluster articles, categorize, and summarize

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Or configure in Vercel Dashboard:
1. Go to Project Settings → Cron Jobs
2. Add new cron job:
   - Path: `/api/cron/ingest`
   - Schedule: `*/10 * * * *` (every 10 minutes)
   - Headers: `x-cron-secret: $CRON_SECRET`

## Monthly Cleanup Cron

**Endpoint**: `/api/cron/cleanup`  
**Schedule**: 1st day of every month at 00:00 UTC  
**Purpose**: Delete clusters older than 30 days (enforces retention policy)

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

Or configure in Vercel Dashboard:
1. Go to Project Settings → Cron Jobs
2. Add new cron job:
   - Path: `/api/cron/cleanup`
   - Schedule: `0 0 1 * *` (1st of every month at midnight UTC)
   - Headers: `x-cron-secret: $CRON_SECRET`

## Environment Variables

Both cron jobs require the `CRON_SECRET` environment variable to be set in Vercel:
- Go to Project Settings → Environment Variables
- Add `CRON_SECRET` with the same value as in your `.env.local`

## Manual Testing

You can manually trigger cron jobs for testing:

```bash
# Test ingestion
curl -H "x-cron-secret: YOUR_SECRET" https://your-app.vercel.app/api/cron/ingest

# Test cleanup (be careful - this deletes data!)
curl -H "x-cron-secret: YOUR_SECRET" https://your-app.vercel.app/api/cron/cleanup
```

## Monitoring

Check pipeline runs and errors in the database:

```sql
-- Recent pipeline runs
SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT 10;

-- Recent errors
SELECT * FROM pipeline_errors ORDER BY created_at DESC LIMIT 20;
```

