# Vercel Environment Variables - Quick Reference

**⚠️ IMPORTANT**: Replace the placeholders below with your actual values.

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://qisxzgzutfspwqmiqbvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase anon key - see values below]
SUPABASE_URL=https://qisxzgzutfspwqmiqbvn.supabase.co
SUPABASE_ANON_KEY=[Your Supabase anon key - see values below]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase service role key - see values below]
OPENAI_API_KEY=[Your OpenAI API key - see values below]
CRON_SECRET=[Your cron secret - see values below]
```

## Actual Values (Add to Vercel manually)

**⚠️ SECURITY**: These values are stored locally only. Add them to Vercel Dashboard → Settings → Environment Variables.

See `docs/environment-variables-setup.md` for step-by-step instructions with actual values.

## Optional Variables (with defaults)

```
SUMMARY_MODEL=gpt-4o-mini
SUMMARY_TRANSLATE_MODEL=gpt-4o-mini
SIMILARITY_THRESHOLD=0.65
WINDOW_HOURS=24
MAX_SUMMARY_ARTICLES=5
RSS_CONCURRENCY=4
```

## Instructions

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Replace placeholders above with your actual values
3. Add each variable to Vercel
4. Select **Production**, **Preview**, and **Development** for each
5. Click **Save**
6. Redeploy your project

**Note**: Never commit actual secrets to GitHub. This file uses placeholders for security.
