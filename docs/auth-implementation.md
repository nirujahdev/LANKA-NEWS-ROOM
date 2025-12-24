# Authentication & Onboarding Implementation Summary

## ✅ What's Been Implemented

### 1. Database Schema (Migration)
- **File**: `supabase/migrations/0007_add_user_profiles.sql`
- **Tables Created**:
  - `profiles`: Stores user name, language, city
  - `user_preferences`: Stores exactly 3 favourite topics
- **RLS Policies**: Users can only access their own data
- **Trigger**: Auto-creates profile on user signup

### 2. Supabase Client Setup
- **File**: `lib/supabaseClient.ts`
- Frontend client with RLS support
- Singleton pattern for client reuse

### 3. Sign-In Components
- **SignInPrompt** (`components/SignInPrompt.tsx`): Modal with Google OAuth and Email options
- **EmailAuth** (`components/EmailAuth.tsx`): Sign up/Sign in tabs with form
- **SignInPromptManager** (`components/SignInPromptManager.tsx`): 
  - Shows modal after 60 seconds on public pages
  - Respects 24h dismissal localStorage
  - Only shows on public routes

### 4. Onboarding Page
- **File**: `app/onboarding/page.tsx`
- Collects: name, language (en/si/ta), city (dropdown), exactly 3 topics
- Validates all fields before submission
- Redirects to `/for-you` after completion

### 5. For You Page
- **File**: `app/for-you/page.tsx`
- Fetches news based on user's 3 favourite topics
- Limits to 50 articles, sorted by recency
- Fills remaining slots with recent news if needed
- Protected route (redirects if not authenticated/onboarded)

### 6. Auth Callback
- **File**: `app/auth/callback/route.ts`
- Handles OAuth redirects
- Checks onboarding status
- Redirects to `/onboarding` if incomplete

### 7. Weather Widget
- **File**: `components/WeatherWidget.tsx`
- Uses OpenWeatherMap API (with fallback)
- Displays weather for user's city
- Falls back to Colombo if not signed in

### 8. Middleware
- **File**: `middleware.ts`
- Protects `/for-you`, `/onboarding`, `/profile` routes
- Allows `/auth/callback`

### 9. Integration Updates
- **app/page.tsx**: 
  - Shows "For You" tab for authenticated users
  - Uses WeatherWidget with user's city
  - Redirects to `/for-you` when tab clicked
- **app/layout.tsx**: Wraps app with SignInPromptManager

## 🔧 Setup Required

### 1. Run Database Migration
Execute in Supabase SQL Editor:
```sql
-- Run: supabase/migrations/0007_add_user_profiles.sql
```

### 2. Configure Google OAuth in Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add redirect URL: `https://lankanewsroom.xyz/auth/callback`
4. Add redirect URL for local dev: `http://localhost:3000/auth/callback`

### 3. Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key  # Optional
```

### 4. OpenWeatherMap API (Optional)
1. Sign up at https://openweathermap.org/api
2. Get free API key
3. Add to environment variables
4. If not provided, widget shows fallback data

## 🎯 User Flow

1. **Visitor** → Browsing public pages
2. **After 60s** → Sign-in modal appears (can dismiss for 24h)
3. **Sign In** → Google OAuth or Email/Password
4. **First Login** → Redirected to `/onboarding`
5. **Onboarding** → Enter name, select language, city, 3 topics
6. **Complete** → Redirected to `/for-you` with personalized feed
7. **Subsequent Logins** → Direct to `/for-you` or homepage

## 📝 Notes

- Weather widget requires OpenWeatherMap API key (optional, has fallback)
- "For You" tab only appears for authenticated users
- Onboarding is enforced - users cannot access `/for-you` without completing it
- All user data is protected by RLS policies
- Sign-in prompt respects localStorage dismissal (24h)

## 🐛 Known Issues / Future Improvements

- Email confirmation flow could be improved
- Could add "Remember me" option
- Could add password reset flow
- Could add profile editing page
- Could add topic re-selection

