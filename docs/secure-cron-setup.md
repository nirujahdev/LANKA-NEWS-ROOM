# Secure Cron Endpoint Setup

## Overview

The `/api/cron/run` endpoint provides secure, source-based data ingestion with domain validation to prevent feed poisoning and malicious redirects.

## Security Features

### 1. Bearer Token Authentication

The endpoint uses `Authorization: Bearer <token>` header validation:
- Token must match `CRON_SECRET` environment variable
- Returns `401 Unauthorized` if token is missing or invalid
- Never exposes `CRON_SECRET` to client code

### 2. Source Allowlist

**CRITICAL**: All data sources come ONLY from the database `sources` table:
- Never accepts URLs from requests
- Never accepts user-provided URLs
- Only fetches from predefined allowlist

### 3. Domain Validation

Every article URL is validated against the source's `base_domain`:
- Extracts hostname from article URL
- Compares with source's `base_domain`
- Discards articles that don't match (prevents feed poisoning)

### 4. Fail-Safe Design

- One bad source doesn't stop the entire pipeline
- Errors are logged but processing continues
- Returns detailed stats for monitoring

## Database Setup

### 1. Apply Migration

Run the migration to add security fields:

```sql
-- Run supabase/migrations/0003_secure_sources.sql
```

This adds:
- `base_domain` - Allowed domain for articles from this source
- `active` - Boolean flag to enable/disable sources
- Indexes for performance

### 2. Configure Sources

Insert or update sources with `base_domain`:

```sql
-- Example: Ada Derana
UPDATE sources
SET 
  base_domain = 'adaderana.lk',
  active = true
WHERE name = 'Ada Derana';

-- Example: Daily Mirror
UPDATE sources
SET 
  base_domain = 'dailymirror.lk',
  active = true
WHERE name = 'Daily Mirror';
```

**Important**: `base_domain` must match the actual domain of article URLs:
- ✅ `adaderana.lk` matches `www.adaderana.lk` (subdomain allowed)
- ❌ `adaderana.lk` does NOT match `malicious-site.com`

## Vercel Configuration

### 1. Environment Variables

Set `CRON_SECRET` in Vercel Dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Your secret token (generate with `openssl rand -hex 32`)
   - **Environments**: Production, Preview, Development

### 2. Cron Job Configuration

The `vercel.json` file already includes the cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/run",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Note**: Vercel Cron automatically sends the `Authorization: Bearer <CRON_SECRET>` header when calling the endpoint.

### 3. Manual Testing

To test manually, include the Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/run
```

## API Endpoint

### GET `/api/cron/run`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Response** (Success):
```json
{
  "ok": true,
  "sourcesProcessed": 5,
  "articlesFetched": 42,
  "articlesInserted": 38,
  "articlesRejected": 4,
  "errors": []
}
```

**Response** (Unauthorized):
```json
{
  "error": "Unauthorized"
}
```
Status: `401`

## Ingestion Pipeline Flow

1. **Load Sources**: Query `sources` table where `active = true`
2. **Fetch RSS**: For each source, fetch from `feed_url` (allowlisted only)
3. **Parse Items**: Extract title, URL, content, published date
4. **Validate Domain**: Check article URL matches source's `base_domain`
5. **Normalize**: Strip HTML, clean content
6. **Deduplicate**: Insert only if URL doesn't exist
7. **Report**: Return stats and errors

## Security Rules

✅ **DO**:
- Use Bearer token authentication
- Fetch only from database allowlist
- Validate article URLs match `base_domain`
- Strip HTML from content
- Deduplicate by URL
- Fail safely (continue on errors)

❌ **DON'T**:
- Accept URLs from requests
- Accept user-provided sources
- Skip domain validation
- Expose `CRON_SECRET` to client
- Log sensitive tokens
- Stop pipeline on single source error

## Monitoring

Check ingestion stats:

```sql
-- Recent articles by source
SELECT 
  s.name,
  COUNT(a.id) as article_count,
  MAX(a.created_at) as latest_article
FROM sources s
LEFT JOIN articles a ON a.source_id = s.id
WHERE s.active = true
GROUP BY s.name
ORDER BY latest_article DESC;

-- Articles rejected (domain mismatch)
-- Check application logs for "articlesRejected" count
```

## Troubleshooting

### 401 Unauthorized

- Check `CRON_SECRET` is set in Vercel environment variables
- Verify token matches exactly (no extra spaces)
- Ensure `Authorization: Bearer` header format is correct

### No Articles Inserted

- Check sources are `active = true` in database
- Verify `base_domain` is set for each source
- Check if articles are being rejected (domain mismatch)
- Review error messages in response

### Domain Validation Failing

- Ensure `base_domain` matches actual article URLs
- Check for subdomain differences (www vs non-www)
- Verify URLs are valid (not malformed)

## Example Source Configuration

```sql
INSERT INTO sources (name, type, feed_url, base_domain, active)
VALUES
  ('Ada Derana', 'rss', 'https://www.adaderana.lk/rss', 'adaderana.lk', true),
  ('Daily Mirror', 'rss', 'https://www.dailymirror.lk/rss', 'dailymirror.lk', true),
  ('NewsFirst', 'rss', 'https://www.newsfirst.lk/rss', 'newsfirst.lk', true);
```

