# 🚀 Production Deployment Checklist

Follow these steps in order to deploy your Lanka News Room application to production.

## ✅ Pre-Deployment Checklist

### 1. Database Setup (CRITICAL - Do this first!)

**Verify your Supabase database is ready:**

- [ ] **Run all migrations** in Supabase SQL Editor:
  - Go to: https://supabase.com/dashboard/project/qisxzgzutfspwqmiqbvn/sql/new
  - Run: `supabase/migrations/0001_init.sql`
  - Run: `supabase/migrations/0002_add_category_and_expiry.sql`
  - Run: `supabase/migrations/0003_secure_sources.sql`
  - Or use the combined script: `scripts/run-all-migrations.sql`

- [ ] **Seed initial sources**:
  - Run: `supabase/seeds/seed_sources.sql` in Supabase SQL Editor

- [ ] **Verify database**:
  - Run: `scripts/verify-migrations.sql` to check everything is set up correctly

### 2. Code Preparation

- [x] ✅ Template files sanitized (no secrets)
- [x] ✅ `.env.local` is in `.gitignore`
- [ ] **Commit and push to GitHub**:
  ```bash
  git add .
  git commit -m "Prepare for production: backend pipeline, sanitized env templates"
  git push origin main
  ```

## 📦 Vercel Deployment Steps

### 3. Create Vercel Project

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click **"Add New..."** → **"Project"**
- [ ] Import your GitHub repository
- [ ] Vercel will auto-detect Next.js
- [ ] **DO NOT deploy yet** - we need to add environment variables first

### 4. Add Environment Variables

- [ ] Go to **Settings** → **Environment Variables**
- [ ] Add all variables from `VERCEL_ENV_VARIABLES.md`
- [ ] For each variable, select **Production**, **Preview**, and **Development**
- [ ] Click **Save** after adding each variable

**Required Variables:**
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **KEEP SECRET**
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` ⚠️ **KEEP SECRET**
- `CRON_SECRET` ⚠️ **KEEP SECRET**

**Optional (with defaults):**
- `SUMMARY_MODEL` (default: `gpt-4o-mini`)
- `SUMMARY_TRANSLATE_MODEL` (default: `gpt-4o-mini`)
- `SIMILARITY_THRESHOLD` (default: `0.65`)
- `WINDOW_HOURS` (default: `24`)
- `MAX_SUMMARY_ARTICLES` (default: `5`)
- `RSS_CONCURRENCY` (default: `4`)

### 5. Deploy to Vercel

- [ ] Click **"Deploy"** button
- [ ] Wait for deployment to complete
- [ ] Note your production URL (e.g., `https://your-app.vercel.app`)

### 6. Verify Deployment

- [ ] **Test homepage**: Visit your Vercel URL
- [ ] **Test API endpoints**:
  - `https://your-app.vercel.app/api/clusters?feed=home`
  - `https://your-app.vercel.app/api/clusters?feed=recent`
- [ ] **Check Vercel logs** for any errors

### 7. Verify Cron Jobs

- [ ] Go to **Deployments** → Select latest deployment → **Functions** tab
- [ ] Wait 10 minutes and check if `/api/cron/run` is executing
- [ ] Check Supabase dashboard to see if articles are being ingested
- [ ] Verify cron jobs are running automatically

### 8. Test the Pipeline

- [ ] **Manual trigger** (optional test):
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://your-app.vercel.app/api/cron/run
  ```
- [ ] **Check Supabase**:
  - Go to Table Editor → `articles` table
  - Verify new articles are being inserted
  - Check `clusters` table for grouped articles
  - Check `summaries` table for generated summaries

## 🔍 Post-Deployment Verification

### 9. Monitor First Run

- [ ] Check Vercel function logs for errors
- [ ] Verify articles are being fetched from RSS feeds
- [ ] Confirm clustering is working
- [ ] Check that summaries are being generated
- [ ] Verify translations (Sinhala/Tamil) are created

### 10. Database Verification

- [ ] Run verification query in Supabase:
  ```sql
  SELECT COUNT(*) FROM articles;
  SELECT COUNT(*) FROM clusters;
  SELECT COUNT(*) FROM summaries;
  SELECT COUNT(*) FROM sources WHERE active = true;
  ```

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Homepage loads without errors
- ✅ API endpoints return data
- ✅ Cron jobs are running automatically
- ✅ Articles are being ingested from RSS feeds
- ✅ Clusters are being created
- ✅ Summaries are being generated in 3 languages
- ✅ No errors in Vercel logs

## 🆘 Troubleshooting

### Cron Jobs Not Running
- Check `CRON_SECRET` matches in Vercel and code
- Verify `vercel.json` is committed
- Check Vercel cron job configuration

### Database Connection Errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project is active
- Ensure migrations are applied

### No Articles Being Ingested
- Check RSS feed URLs are valid
- Verify sources are `active = true` in database
- Check Vercel function logs for errors
- Verify OpenAI API key has credits

### API Endpoints Return Empty
- Check database has data
- Verify `expires_at` filter isn't excluding all clusters
- Check Supabase connection

## 📚 Additional Resources

- **Full Setup Guide**: `docs/vercel-production-setup.md`
- **Environment Variables**: `VERCEL_ENV_VARIABLES.md`
- **Database Setup**: `docs/database-setup.md`
- **Cron Setup**: `docs/cron-setup.md`

---

**Next Action**: Start with Step 1 - Database Setup!

