/**
 * Session Management Utilities
 * 
 * Provides utilities for managing user sessions, authentication state,
 * and protected route handling.
 */

import { getSupabaseClient } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface SessionResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

/**
 * Gets the current user session
 * @returns Current session data or null if not authenticated
 */
export async function getCurrentSession(): Promise<SessionResult> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    return {
      user: session?.user ?? null,
      session: session,
      error: error ? new Error(error.message) : null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error('Failed to get session'),
    };
  }
}

/**
 * Gets the current user
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    return {
      user: user ?? null,
      error: error ? new Error(error.message) : null,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to get user'),
    };
  }
}

/**
 * Refreshes the current session
 * @returns Refreshed session data or null if refresh failed
 */
export async function refreshSession(): Promise<SessionResult> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        user: null,
        session: null,
        error: new Error(error.message),
      };
    }

    return {
      user: session?.user ?? null,
      session: session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error('Failed to refresh session'),
    };
  }
}

/**
 * Signs out the current user
 * @returns Success status and any error
 */
export async function signOut(): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: new Error(error.message),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to sign out'),
    };
  }
}

/**
 * Checks if user is authenticated
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user, error } = await getCurrentUser();
  return user !== null && error === null;
}

/**
 * Requires authentication - throws error if not authenticated
 * @param redirectTo - Optional redirect URL if not authenticated
 * @returns User object if authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Gets session expiration time
 * @returns Expiration timestamp or null if no session
 */
export async function getSessionExpiration(): Promise<number | null> {
  const { session } = await getCurrentSession();
  return session?.expires_at ? session.expires_at * 1000 : null;
}

/**
 * Checks if session is expired or will expire soon
 * @param bufferSeconds - Buffer time in seconds before expiration to consider as "expiring soon"
 * @returns True if expired or expiring soon
 */
export async function isSessionExpiring(bufferSeconds: number = 300): Promise<boolean> {
  const expiration = await getSessionExpiration();
  
  if (!expiration) {
    return true; // No session means "expired"
  }

  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  
  return expiration <= now + bufferMs;
}

/**
 * Auto-refreshes session if it's expiring soon
 * @param bufferSeconds - Buffer time in seconds before expiration
 * @returns True if session was refreshed or didn't need refreshing
 */
export async function autoRefreshSession(bufferSeconds: number = 300): Promise<boolean> {
  const isExpiring = await isSessionExpiring(bufferSeconds);
  
  if (!isExpiring) {
    return true; // Session is still valid
  }

  const result = await refreshSession();
  return result.error === null;
}

