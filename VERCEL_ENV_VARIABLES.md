# Vercel Environment Variables - Quick Reference

**⚠️ IMPORTANT**: Replace the placeholders below with your actual values from:
- Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- OpenAI: https://platform.openai.com/api-keys
- Generate CRON_SECRET: `openssl rand -hex 32`

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_PUBLISHABLE_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
CRON_SECRET=YOUR_CRON_SECRET_HERE
```

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
