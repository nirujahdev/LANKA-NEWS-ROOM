# Domain & Cron Setup Verification Guide

## 1. Domain Configuration Checklist

### In Vercel Dashboard:
1. Go to **Project → Settings → Domains**
2. Verify `lankanewsroom.xyz` is listed ✅
3. Check status shows **"Valid Configuration"** ✅
4. Ensure it's assigned to **Production** (not only Preview) ✅

### DNS Configuration (if status shows "Invalid configuration"):

**Option A (Recommended - A Record):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto (or 3600)
```

**Option B (CNAME):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```
Then in Vercel, set www as primary or redirect @ → www

### Domain Consistency:
- ✅ Use `lankanewsroom.xyz` everywhere (or `www.lankanewsroom.xyz` if that's your primary)
- ✅ Update GitHub Actions workflow to use your chosen domain
- ✅ Update OAuth redirect URLs in Supabase to match

## 2. Test Cron Endpoint Manually

Run this command in your terminal (replace YOUR_CRON_SECRET with actual value):

```bash
curl -i \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://lankanewsroom.xyz/api/cron/run
```

**Expected Results:**
- ✅ `HTTP/2 200` - Success (even if skipped)
- ❌ `401 Unauthorized` - CRON_SECRET mismatch
- ❌ `404 Not Found` - Endpoint path wrong or domain not configured
- ❌ `500 Internal Server Error` - Bug in route handler
- ❌ `Could not resolve host` - DNS not configured

## 3. GitHub Actions Configuration

### Required Secret:
1. Go to **GitHub Repo → Settings → Secrets and variables → Actions**
2. Add secret:
   - **Name**: `CRON_SECRET`
   - **Value**: Exact same value as Vercel Production `CRON_SECRET`
   - **Important**: Must match character-for-character

### Workflow File:
- ✅ Updated to use `lankanewsroom.xyz` directly
- ✅ Uses `/api/cron/run` endpoint
- ✅ Includes proper error handling

## 4. Vercel Environment Variables (CRITICAL)

### Required Variables (Production):
1. Go to **Vercel → Project → Settings → Environment Variables**
2. Verify these are set for **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL` ⚠️ **REQUIRED** (fixes "Missing Supabase environment variables" error)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⚠️ **REQUIRED** (fixes "Missing Supabase environment variables" error)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `CRON_SECRET` - Must match GitHub secret exactly
   - `NEXT_PUBLIC_GOOGLE_API_KEY` (optional)
   - All other required env vars

3. **Redeploy** after adding/updating environment variables

**See**: `docs/environment-variables-setup.md` for complete list

## 5. Common Mistakes Checklist

- [ ] Calling wrong endpoint: `/api/cron/run` vs `/api/cron/ingest`
- [ ] Domain mismatch: Using `www.lankanewsroom.xyz` but calling `lankanewsroom.xyz` (or vice versa)
- [ ] CRON_SECRET set in Preview but not Production
- [ ] CRON_SECRET has trailing spaces or different casing
- [ ] Endpoint returns non-200 on "no new news" (should return 200 even if skipped)
- [ ] DNS not propagated (wait 24-48 hours after changes)

## 6. Verification Steps

### Step 1: Test Domain
```bash
curl -I https://lankanewsroom.xyz
```
Should return `200 OK` or `301/302` redirect

### Step 2: Test Cron Endpoint
```bash
curl -i \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://lankanewsroom.xyz/api/cron/run
```

### Step 3: Test GitHub Actions
1. Go to **GitHub → Actions → Trigger Pipeline Cron (15 min)**
2. Click **"Run workflow"** → **"Run workflow"** button
3. Check logs for success/failure

### Step 4: Verify Secrets Match
- Compare `CRON_SECRET` in GitHub Secrets with Vercel Production env vars
- They must be identical (copy-paste to avoid typos)

## 7. Supabase OAuth Redirect URL

Update in Supabase Dashboard → Authentication → URL Configuration:
- **Redirect URLs**: `https://lankanewsroom.xyz/auth/callback`
- Also add for local dev: `http://localhost:3000/auth/callback`

## 8. Monitoring

### Check GitHub Actions:
- Go to **Actions** tab
- Look for "Trigger Pipeline Cron (15 min)" workflow
- Should run every 15 minutes automatically
- Green checkmark = Success (even if skipped)

### Check Vercel Logs:
- Go to **Deployments** → Latest → **Functions** tab
- Look for `/api/cron/run` executions
- Check for errors

### Check Database:
```sql
-- Check last successful run
SELECT * FROM pipeline_settings WHERE name = 'main';

-- Check if locked
SELECT * FROM pipeline_locks WHERE name = 'cron_pipeline';
```

