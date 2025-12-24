# Environment Variables Setup Guide

## ⚠️ Important: Two Different Places

### 1. GitHub Actions Secrets (for cron workflow only)
- **Location**: GitHub Repo → Settings → Secrets and variables → Actions
- **Purpose**: Only used by the GitHub Actions cron workflow
- **Required**: `CRON_SECRET` only

### 2. Vercel Environment Variables (for application runtime)
- **Location**: Vercel → Project → Settings → Environment Variables
- **Purpose**: Used by your Next.js application at runtime
- **Required**: All variables listed below

---

## 🔧 Step 1: GitHub Actions Secrets

**Go to**: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

### Required Secret:
```
Name: CRON_SECRET
Value: [Same value as Vercel CRON_SECRET]
```

**Important**: 
- This must match your Vercel Production `CRON_SECRET` exactly
- Only used for the cron workflow, not for the app

---

## 🔧 Step 2: Vercel Environment Variables (CRITICAL - Fixes Your Error)

**Go to**: Vercel → Your Project → Settings → Environment Variables

### Add these variables (select Production, Preview, and Development for each):

#### Required for Authentication (Fixes the error you're seeing):
```
NEXT_PUBLIC_SUPABASE_URL=https://qisxzgzutfspwqmiqbvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase anon key]
```

#### Required for Backend:
```
SUPABASE_URL=https://qisxzgzutfspwqmiqbvn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Your service role key]
SUPABASE_ANON_KEY=[Your anon key]
OPENAI_API_KEY=[Your OpenAI API key]
CRON_SECRET=[Your cron secret - same as GitHub]
```

#### Optional but Recommended:
```
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyCTj58E6CTnalkWwTwXGsx_6XXCflznaOA
NEXT_PUBLIC_OPENWEATHER_API_KEY=[Optional - for weather widget]
```

#### Optional (with defaults):
```
SUMMARY_MODEL=gpt-4o-mini
SUMMARY_TRANSLATE_MODEL=gpt-4o-mini
SIMILARITY_THRESHOLD=0.65
WINDOW_HOURS=24
MAX_SUMMARY_ARTICLES=5
RSS_CONCURRENCY=4
```

### After Adding Variables:
1. ✅ Click "Save" for each variable
2. ✅ Ensure "Production" is selected
3. ✅ **Redeploy** your project (Deployments → ... → Redeploy)

---

## 🔍 Where to Get Values

### Supabase Keys:
1. Go to: https://supabase.com/dashboard/project/qisxzgzutfspwqmiqbvn/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### OpenAI Key:
1. Go to: https://platform.openai.com/api-keys
2. Create or copy your API key → `OPENAI_API_KEY`

### CRON_SECRET:
- Generate: `openssl rand -hex 32`
- Use the same value in both GitHub Actions and Vercel

---

## ✅ Quick Checklist

### GitHub Actions:
- [ ] `CRON_SECRET` secret added
- [ ] Value matches Vercel exactly

### Vercel Environment Variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added (Production)
- [ ] `SUPABASE_URL` added (Production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added (Production)
- [ ] `SUPABASE_ANON_KEY` added (Production)
- [ ] `OPENAI_API_KEY` added (Production)
- [ ] `CRON_SECRET` added (Production)
- [ ] Project redeployed after adding variables

---

## 🐛 Fixing the Current Error

The error "Missing Supabase environment variables" happens because:
- `NEXT_PUBLIC_SUPABASE_URL` is not set in Vercel Production
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not set in Vercel Production

**Solution**:
1. Add both variables to Vercel (see Step 2 above)
2. Ensure "Production" environment is selected
3. Redeploy your project
4. The error should disappear

---

## 📝 Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser (safe for public keys)
- **Non-NEXT_PUBLIC_*** variables are server-only (keep secrets like SERVICE_ROLE_KEY private)
- Always redeploy after adding/updating environment variables
- GitHub Actions secrets are separate from Vercel env vars

