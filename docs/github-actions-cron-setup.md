# GitHub Actions Cron Setup Guide

This guide explains how to set up the free 15-minute cron scheduler using GitHub Actions.

## Overview

Instead of using Vercel's paid cron jobs (limited to once per day on Hobby plan), we use GitHub Actions to trigger the pipeline every 15 minutes for free.

## Architecture

```
GitHub Actions (every 15 min)
    ↓
    HTTP GET /api/cron/run
    Authorization: Bearer CRON_SECRET
    ↓
    [Lock Check] → If locked → Skip
    ↓
    [Early Exit Check 1] → If last_run < 10 min ago → Skip
    ↓
    [Acquire Lock] → Atomic SQL lock
    ↓
    [Early Exit Check 2] → Fetch RSS → Check for new URLs/GUIDs → If none → Skip
    ↓
    [Full Pipeline] → Fetch → Insert → Cluster → Categorize → Summarize
    ↓
    [Release Lock] → Always in finally block
```

## Setup Steps

### 1. Apply Database Migration

Run the migration to create lock and settings tables:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/0004_add_pipeline_locks.sql
```

This creates:
- `pipeline_locks` table for distributed locking
- `pipeline_settings` table for tracking last successful run
- `acquire_pipeline_lock()` SQL function for atomic lock acquisition

### 2. Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add the following secrets:

#### Required Secrets

**`CRON_SECRET`**
- **Name**: `CRON_SECRET`
- **Value**: Same as your Vercel `CRON_SECRET` environment variable
- **Purpose**: Authenticates GitHub Actions requests to your Vercel endpoint

**`VERCEL_DOMAIN`** (Optional)
- **Name**: `VERCEL_DOMAIN`
- **Value**: Your Vercel deployment domain (e.g., `your-app.vercel.app`)
- **Purpose**: If not set, defaults to `your-app.vercel.app` (you'll need to update the workflow file)

### 3. Update Workflow File (if needed)

If you didn't set `VERCEL_DOMAIN` secret, edit `.github/workflows/cron-15min.yml`:

```yaml
VERCEL_DOMAIN: ${{ secrets.VERCEL_DOMAIN || 'your-actual-domain.vercel.app' }}
```

Replace `your-actual-domain.vercel.app` with your actual Vercel domain.

### 4. Verify Workflow

1. Go to **Actions** tab in GitHub
2. You should see "Trigger Pipeline Cron (15 min)" workflow
3. Click **"Run workflow"** to test manually
4. Check the logs to verify it's calling your endpoint correctly

## How It Works

### Lock Protection

- **Prevents overlapping runs**: If a pipeline is already running, new requests skip
- **TTL-based expiration**: Locks expire after 10 minutes (configurable via `LOCK_TTL_MINUTES`)
- **Atomic acquisition**: Uses PostgreSQL function for race-condition-free locking

### Early Exit Optimization

**Stage 1: Timestamp Check**
- Quick check: Was last run less than 10 minutes ago?
- If yes → Skip (no expensive operations)

**Stage 2: New Items Check**
- Fetches RSS feeds for all sources
- Compares URLs/GUIDs/hashes with database
- If no new items → Skip (no processing needed)

### Response Codes

The endpoint returns:
- `200 OK` with `{ ok: true, skipped: true, reason: "..." }` - Skipped (expected)
- `200 OK` with `{ ok: true, ...stats }` - Pipeline executed successfully
- `401 Unauthorized` - Invalid `CRON_SECRET`
- `500 Internal Server Error` - Pipeline execution failed

## Monitoring

### GitHub Actions Logs

Check workflow runs in GitHub Actions tab:
- Green checkmark = Success (even if skipped)
- Red X = Failure (check logs for details)

### Vercel Logs

Check function logs in Vercel dashboard:
- Go to **Deployments** → Select deployment → **Functions** tab
- Look for `/api/cron/run` executions

### Database Monitoring

Query lock status:
```sql
SELECT * FROM pipeline_locks WHERE name = 'cron_pipeline';
```

Query last successful run:
```sql
SELECT * FROM pipeline_settings WHERE name = 'main';
```

## Troubleshooting

### Workflow Fails with 401

- Verify `CRON_SECRET` secret matches Vercel environment variable
- Check secret name is exactly `CRON_SECRET` (case-sensitive)

### Workflow Fails with Connection Error

- Verify `VERCEL_DOMAIN` is set correctly
- Check your Vercel deployment is live
- Ensure endpoint `/api/cron/run` exists

### Pipeline Always Skipped

- Check `pipeline_settings.last_successful_run` - might be too recent
- Check `pipeline_locks` - might be locked by stuck process
- Manually release lock: `UPDATE pipeline_locks SET locked_until = now() WHERE name = 'cron_pipeline';`

### Lock Never Releases

- Locks auto-expire after TTL (10 minutes default)
- Check `pipeline_locks.locked_until` - should be in the past if expired
- Manually release: `UPDATE pipeline_locks SET locked_until = now() WHERE name = 'cron_pipeline';`

## Configuration

### Lock TTL

Default: 10 minutes

To change, set environment variable:
```
LOCK_TTL_MINUTES=15
```

### Minimum Run Interval

Default: 10 minutes between runs

This is hardcoded in `lib/pipelineEarlyExit.ts` as `MIN_RUN_INTERVAL_MINUTES`.

## Cost

- **GitHub Actions**: Free (2000 minutes/month for private repos, unlimited for public)
- **Vercel**: No additional cost (using existing function)
- **Supabase**: Minimal (lock table queries are lightweight)

## Security

- `CRON_SECRET` stored in GitHub Secrets (encrypted)
- Bearer token authentication prevents unauthorized access
- Lock prevents concurrent execution (race condition protection)
- All sources come from database allowlist (never from requests)

