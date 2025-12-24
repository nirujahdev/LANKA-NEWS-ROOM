# Database Setup Guide

## Overview

This guide covers setting up the complete database schema for the Lanka News Room platform, including all migrations, seeding, and verification.

## Prerequisites

- Supabase project: `qisxzgzutfspwqmiqbvn`
- Access to Supabase SQL Editor
- Service role key configured in environment variables

## Quick Start

### Option 1: Run All Migrations at Once

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/run-all-migrations.sql`
3. Click "Run" to execute
4. Verify with `scripts/verify-migrations.sql`

### Option 2: Run Migrations Individually

Run each migration file in order:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_add_category_and_expiry.sql`
3. `supabase/migrations/0003_secure_sources.sql`
4. `supabase/seeds/seed_sources.sql`

## Migration Details

### Migration 1: Base Schema (`0001_init.sql`)

Creates the foundational database structure:

**Extensions:**
- `uuid-ossp` - For UUID generation

**Enums:**
- `lang_code` - Language codes: 'en', 'si', 'ta', 'unk'
- `cluster_status` - Cluster status: 'draft', 'published'

**Tables:**
- `sources` - News source configuration
- `clusters` - Grouped news incidents
- `articles` - Individual news articles
- `cluster_articles` - Many-to-many relationship
- `summaries` - AI-generated summaries
- `pipeline_runs` - Ingestion pipeline logs
- `pipeline_errors` - Error tracking

**Indexes:**
- Unique indexes on URLs and GUIDs
- Performance indexes on foreign keys and timestamps

### Migration 2: Category and Expiry (`0002_add_category_and_expiry.sql`)

Adds topic categorization and retention policy:

**New Columns:**
- `clusters.category` - Topic category (politics, economy, sports, technology, health, education)
- `clusters.expires_at` - Auto-calculated expiry (created_at + 30 days)

**Indexes:**
- `clusters_category_idx` - For category filtering
- `clusters_expires_at_idx` - For cleanup queries
- `clusters_created_at_idx` - For time-based queries

**Constraints:**
- Category must be one of the allowed values

### Migration 3: Secure Sources (`0003_secure_sources.sql`)

Adds security features for source validation:

**New Columns:**
- `sources.base_domain` - Allowed domain for articles (prevents feed poisoning)
- `sources.active` - Enable/disable source (replaces/enhances `enabled`)

**Indexes:**
- `sources_active_idx` - For filtering active sources
- `sources_base_domain_idx` - For domain validation

**Constraints:**
- Active sources must have `base_domain` set

## Seeding Initial Data

The `seed_sources.sql` script inserts initial RSS sources:

1. **Ada Derana** (Sinhala) - `adaderana.lk`
2. **Daily Mirror** (English) - `dailymirror.lk`
3. **NewsFirst** (English) - `newsfirst.lk`
4. **Hiru News** (English) - `hirunews.lk`
5. **Colombo Page** (English) - `colombopage.com`

All sources are set to `active = true` with proper `base_domain` values.

## Verification

After running migrations, verify the setup:

```sql
-- Run scripts/verify-migrations.sql
```

This checks:
- ✅ Extensions installed
- ✅ Enums created
- ✅ All tables exist
- ✅ Column schemas correct
- ✅ Indexes created
- ✅ Constraints applied
- ✅ Sources seeded
- ✅ base_domain set for all active sources

## Common Operations

### View All Sources

```sql
SELECT * FROM public.sources ORDER BY name;
```

### Add a New Source

```sql
INSERT INTO public.sources (name, type, feed_url, base_domain, language, enabled, active)
VALUES (
  'BBC Sinhala',
  'rss',
  'https://www.bbc.com/sinhala/rss.xml',
  'bbc.com',
  'si',
  true,
  true
);
```

### Update Source Configuration

```sql
-- Update feed URL
UPDATE public.sources
SET feed_url = 'https://new-url.com/rss'
WHERE name = 'Source Name';

-- Update base_domain
UPDATE public.sources
SET base_domain = 'newdomain.lk'
WHERE name = 'Source Name';

-- Disable source
UPDATE public.sources
SET active = false
WHERE name = 'Source Name';
```

### Check Source Statistics

```sql
SELECT 
  s.name,
  COUNT(DISTINCT a.id) as article_count,
  MAX(a.created_at) as latest_article
FROM public.sources s
LEFT JOIN public.articles a ON a.source_id = s.id
GROUP BY s.id, s.name
ORDER BY article_count DESC;
```

See `scripts/manage-sources.sql` for more management queries.

## Troubleshooting

### Migration Fails

If a migration fails:
1. Check error message in Supabase SQL Editor
2. Verify previous migrations completed
3. Check for conflicting constraints
4. Review table/column existence

### Missing base_domain

If sources are missing `base_domain`:

```sql
-- Auto-extract from feed_url
UPDATE public.sources
SET base_domain = regexp_replace(
  regexp_replace(feed_url, '^https?://', ''),
  '/.*$', ''
)
WHERE base_domain IS NULL;
```

### Verify Constraints

```sql
-- Check if constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clusters'
  AND constraint_name = 'clusters_category_check';
```

## Database Schema Diagram

```
sources (1) ──< (many) articles
                │
                └──> (many) clusters
                        │
                        └──> (1) summaries

pipeline_runs (1) ──< (many) pipeline_errors
```

## Next Steps

After database setup:
1. ✅ Verify all migrations applied
2. ✅ Confirm sources are seeded
3. ✅ Test ingestion pipeline
4. ✅ Monitor pipeline runs
5. ✅ Check article ingestion

## Security Notes

- `base_domain` is critical for preventing feed poisoning
- Never disable domain validation
- Always set `base_domain` when adding new sources
- Active sources must have `base_domain` (enforced by constraint)

## Support

For issues:
1. Check `pipeline_errors` table for ingestion errors
2. Review `pipeline_runs` for execution logs
3. Verify source configuration matches actual feed domains
4. Check Supabase logs for SQL errors

