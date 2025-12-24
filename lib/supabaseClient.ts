import { createClient } from '@supabase/supabase-js';
import { Database } from './supabaseTypes';

// Frontend Supabase client (uses anon key, respects RLS)
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time, env vars might not be available
  // Return a mock client that won't work but won't crash
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side: return a minimal client that won't crash
      return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    }
    throw new Error('Missing Supabase environment variables');
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

