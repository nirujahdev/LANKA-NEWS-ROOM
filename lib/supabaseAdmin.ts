import { createClient } from '@supabase/supabase-js';
import { Database } from './supabaseTypes';

// Get env vars directly to avoid crashing if env.ts validation fails
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a safe admin client that handles missing env vars gracefully
function createSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Return a mock client that will fail gracefully on API calls
    // This prevents crashes during build or when env vars are missing
    // Only log in development to reduce console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Supabase admin credentials not found. Using placeholder client.');
    }
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    });
  }

  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    }
  );
}

export const supabaseAdmin = createSupabaseAdmin();

