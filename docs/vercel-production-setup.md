# Vercel Production Setup Guide

This guide walks you through deploying your Lanka News Room application to Vercel with all required environment variables.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub repository with your code
- Supabase project with database migrations applied
- OpenAI API key

## Step 1: Push Code to GitHub

Ensure all your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

**Important**: The template files (`env.local.example`, `env.local.template`) are now sanitized and safe to commit. Your actual `.env.local` file is ignored by git and will NOT be pushed.

## Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click **"Deploy"** (we'll add environment variables next)

## Step 3: Configure Environment Variables

After the initial deployment, go to **Settings** → **Environment Variables** and add the following:

### Required Variables

**⚠️ IMPORTANT**: Replace all placeholders below with your actual values. Never commit real secrets to GitHub.

#### 1. Supabase Configuration

Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

```
SUPABASE_URL
Value: https://YOUR_PROJECT_REF.supabase.co
Environments: Production, Preview, Development
```

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://YOUR_PROJECT_REF.supabase.co
Environments: Production, Preview, Development
```

```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
Value: YOUR_PUBLISHABLE_KEY_HERE
Environments: Production, Preview, Development
```

#### 2. Supabase Service Role Key (CRITICAL - Keep Secret!)

Get from: Supabase Dashboard → Settings → API → service_role key

```
SUPABASE_SERVICE_ROLE_KEY
Value: YOUR_SERVICE_ROLE_KEY_HERE
Environments: Production, Preview, Development
```

#### 3. Supabase Anon Key

Get from: Supabase Dashboard → Settings → API → anon/public key

```
SUPABASE_ANON_KEY
Value: YOUR_ANON_KEY_HERE
Environments: Production, Preview, Development
```

#### 4. OpenAI API Key

Get from: https://platform.openai.com/api-keys

```
OPENAI_API_KEY
Value: YOUR_OPENAI_API_KEY_HERE
Environments: Production, Preview, Development
```

#### 5. Cron Secret (CRITICAL - Protects Cron Endpoints!)

Generate with: `openssl rand -hex 32`

```
CRON_SECRET
Value: YOUR_CRON_SECRET_HERE
Environments: Production, Preview, Development
```

### Optional Configuration Variables

These have defaults but can be customized:

```
SUMMARY_MODEL
Value: gpt-4o-mini
Environments: Production, Preview, Development
```

```
SUMMARY_TRANSLATE_MODEL
Value: gpt-4o-mini
Environments: Production, Preview, Development
```

```
SIMILARITY_THRESHOLD
Value: 0.65
Environments: Production, Preview, Development
```

```
WINDOW_HOURS
Value: 24
Environments: Production, Preview, Development
```

```
MAX_SUMMARY_ARTICLES
Value: 5
Environments: Production, Preview, Development
```

```
RSS_CONCURRENCY
Value: 4
Environments: Production, Preview, Development
```

## Step 4: Configure Vercel Cron Jobs

Vercel will automatically detect the cron jobs defined in `vercel.json`:

- **`/api/cron/run`**: Runs every 10 minutes (ingestion pipeline)
- **`/api/cron/cleanup`**: Runs monthly on the 1st (data cleanup)

### Important: Secure Cron Endpoints

The `/api/cron/run` endpoint is protected by the `CRON_SECRET` you set above. Vercel Cron will automatically include this in the `Authorization` header when calling your endpoints.

**To test cron jobs manually**, you'll need to include the header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/run
```

## Step 5: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. This will trigger a new deployment with all environment variables

## Step 6: Verify Deployment

1. **Check the homepage**: Visit your Vercel URL
2. **Test API endpoints**:
   - `https://your-app.vercel.app/api/clusters?feed=home`
   - `https://your-app.vercel.app/api/clusters?feed=recent`
3. **Check cron jobs**: Monitor the Vercel logs to see if cron jobs are running
4. **Verify database**: Check Supabase dashboard to see if articles are being ingested

## Step 7: Monitor Cron Jobs

1. Go to **Deployments** → Select a deployment → **Functions** tab
2. Look for cron job executions in the logs
3. Check for any errors in the pipeline

## Troubleshooting

### Cron Jobs Not Running

- Verify `CRON_SECRET` is set correctly in Vercel
- Check that `vercel.json` is committed to your repository
- Ensure the cron schedule syntax is correct

### Database Connection Issues

- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project is active
- Ensure database migrations have been applied

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is valid and has credits
- Check API rate limits
- Review OpenAI dashboard for usage

### Environment Variables Not Loading

- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Security Checklist

- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Template files are sanitized (no real secrets)
- ✅ `CRON_SECRET` is set and protects cron endpoints
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is kept secret
- ✅ All sensitive keys are in Vercel environment variables only

## Next Steps

1. Monitor the first few cron job runs
2. Check Supabase for ingested articles
3. Verify clustering and summarization are working
4. Test the frontend API endpoints
5. Set up monitoring/alerts if needed

## Support

If you encounter issues:
- Check Vercel function logs
- Review Supabase logs
- Verify all environment variables are set
- Ensure database migrations are applied

