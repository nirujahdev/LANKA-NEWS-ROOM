# Secure Ingestion Quick Start

## What Was Implemented

✅ **Secure Cron Endpoint** (`/api/cron/run`)
- Bearer token authentication
- Only accepts requests with valid `Authorization: Bearer <CRON_SECRET>` header
- Returns 401 if unauthorized

✅ **Source Allowlist System**
- All sources come from database `sources` table
- Never accepts URLs from requests
- Only processes sources where `active = true`

✅ **Domain Validation**
- Every article URL is validated against source's `base_domain`
- Articles from wrong domains are discarded
- Prevents feed poisoning and malicious redirects

✅ **Safe Ingestion Pipeline**
- Fetches RSS feeds from allowlisted URLs only
- Strips HTML from content
- Deduplicates by URL
- Fails safely (one bad source doesn't stop pipeline)

## Setup Steps

### 1. Apply Database Migration

```sql
-- Run: supabase/migrations/0003_secure_sources.sql
```

### 2. Configure Sources

```sql
-- Set base_domain for each source
UPDATE sources
SET 
  base_domain = 'adaderana.lk',
  active = true
WHERE name = 'Ada Derana';
```

### 3. Set Environment Variable

In Vercel Dashboard:
- **Variable**: `CRON_SECRET`
- **Value**: Generate with `openssl rand -hex 32`
- **Environments**: Production, Preview, Development

### 4. Deploy

The `vercel.json` already includes the cron job:
- Path: `/api/cron/run`
- Schedule: Every 10 minutes (`*/10 * * * *`)

Vercel will automatically send `Authorization: Bearer <CRON_SECRET>` header.

## Testing

```bash
# Manual test (replace YOUR_CRON_SECRET)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/run
```

Expected response:
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

## Security Checklist

- [x] Bearer token authentication
- [x] CRON_SECRET in environment variables only
- [x] Sources from database allowlist only
- [x] Domain validation on all article URLs
- [x] No user input accepted
- [x] Fail-safe error handling
- [x] HTML stripped from content
- [x] URL deduplication

## Files Created

1. `app/api/cron/run/route.ts` - Secure cron endpoint
2. `lib/ingestion.ts` - Safe ingestion pipeline
3. `supabase/migrations/0003_secure_sources.sql` - Database migration
4. `docs/secure-cron-setup.md` - Full documentation

## Next Steps

After ingestion is working:
1. Add clustering logic (group similar articles)
2. Add summarization (generate AI summaries)
3. Add categorization (assign topics)

But ingestion is now secure and ready! 🎉

