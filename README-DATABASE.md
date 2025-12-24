# Database Setup - Quick Reference

## 🚀 Quick Start

### 1. Run All Migrations

Open Supabase SQL Editor and run:
```
scripts/run-all-migrations.sql
```

This single script:
- ✅ Creates all tables
- ✅ Applies all migrations
- ✅ Seeds initial sources
- ✅ Sets up security fields

### 2. Verify Setup

Run verification script:
```
scripts/verify-migrations.sql
```

### 3. Manage Sources

Use management queries:
```
scripts/manage-sources.sql
```

## 📋 What Gets Created

### Tables
- `sources` - News source configuration
- `clusters` - Grouped news incidents  
- `articles` - Individual articles
- `cluster_articles` - Relationships
- `summaries` - AI summaries
- `pipeline_runs` - Ingestion logs
- `pipeline_errors` - Error tracking

### Key Features
- ✅ Topic categorization (6 categories)
- ✅ 30-day retention policy
- ✅ Domain validation (feed poisoning protection)
- ✅ Multi-language support (EN, SI, TA)

## 🔧 Common Tasks

### Add New Source
```sql
INSERT INTO public.sources (name, type, feed_url, base_domain, language, active)
VALUES ('Source Name', 'rss', 'https://feed-url.com/rss', 'feed-url.com', 'en', true);
```

### View All Sources
```sql
SELECT * FROM public.sources WHERE active = true;
```

### Check Pipeline Status
```sql
SELECT * FROM public.pipeline_runs ORDER BY started_at DESC LIMIT 10;
```

## 📚 Documentation

- **Full Setup Guide**: `docs/database-setup.md`
- **MCP Setup**: `docs/mcp-setup.md`
- **Source Management**: `scripts/manage-sources.sql`

## ⚠️ Important Notes

1. **base_domain is required** for active sources (security)
2. **Migrations must run in order** (0001 → 0002 → 0003)
3. **Verify after setup** using verification script
4. **Never skip domain validation** - it prevents feed poisoning

## 🆘 Troubleshooting

**Migration fails?**
- Check previous migrations completed
- Verify no conflicting constraints
- Review error messages

**Missing base_domain?**
- Run auto-fix in `scripts/manage-sources.sql`
- Or manually set for each source

**MCP not working?**
- Use Supabase SQL Editor instead
- See `docs/mcp-setup.md` for help

