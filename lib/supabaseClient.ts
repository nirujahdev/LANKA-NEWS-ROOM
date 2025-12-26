import { createClient } from '@supabase/supabase-js';
import { Database } from './supabaseTypes';

// Frontend Supabase client (uses anon key, respects RLS)
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time or if env vars are missing, return a mock client that won't crash
  // This prevents React errors during hydration when env vars aren't set
  if (!supabaseUrl || !supabaseAnonKey) {
    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Missing Supabase environment variables!');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
      console.error('   Please set these in your .env.local file or Vercel environment variables.');
    }
    
    // Return a minimal client that won't crash but will fail gracefully on API calls
    // In production, this should never happen - fail loudly
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please configure environment variables in Vercel.');
    }
    
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Client-side singleton instance
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  // Only create client on client-side or if env vars are available
  if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!supabaseClient) {
      supabaseClient = createSupabaseClient();
    }
    return supabaseClient;
  }
  
  // Fallback for server-side build
  return createSupabaseClient();
}

