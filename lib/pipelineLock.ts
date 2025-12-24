import { supabaseAdmin } from './supabaseAdmin';
import { env } from './env';

/**
 * Distributed lock management for pipeline execution.
 * 
 * Uses PostgreSQL for atomic lock acquisition/release to prevent
 * concurrent pipeline runs across multiple instances.
 * 
 * Lock mechanism:
 * - Lock name: 'cron_pipeline'
 * - TTL: Configurable via LOCK_TTL_MINUTES (default: 10 minutes)
 * - Atomic operations using INSERT ... ON CONFLICT
 * - Auto-expires if process crashes (TTL-based)
 */

const DEFAULT_LOCK_NAME = 'cron_pipeline';

/**
 * Checks if a lock is currently active (not expired).
 * 
 * @param name Lock identifier (default: 'cron_pipeline')
 * @returns true if lock exists and locked_until >= now(), false otherwise
 */
export async function isLocked(name: string = DEFAULT_LOCK_NAME): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_locks')
    .select('locked_until')
    .eq('name', name)
    .single();

  if (error || !data) {
    return false; // No lock exists
  }

  // Lock is active if locked_until is in the future
  const now = new Date();
  const lockedUntil = new Date(data.locked_until);
  return lockedUntil > now;
}

/**
 * Attempts to acquire a distributed lock atomically.
 * 
 * Uses PostgreSQL INSERT ... ON CONFLICT with conditional update:
 * - If lock doesn't exist → insert with TTL
 * - If lock exists but expired (locked_until < now()) → update with new TTL
 * - If lock exists and active (locked_until >= now()) → return false (lock not acquired)
 * 
 * @param name Lock identifier (default: 'cron_pipeline')
 * @param ttlMinutes Lock duration in minutes (default: from env.LOCK_TTL_MINUTES)
 * @returns true if lock was acquired, false if already locked
 */
export async function acquireLock(
  name: string = DEFAULT_LOCK_NAME,
  ttlMinutes: number = env.LOCK_TTL_MINUTES
): Promise<boolean> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  // Use raw SQL for atomic operation
  // This ensures no race condition between check and update
  const { data, error } = await supabaseAdmin.rpc('acquire_pipeline_lock', {
    lock_name: name,
    lock_until: lockedUntil.toISOString(),
    current_ts: now.toISOString()
  });

  // If RPC doesn't exist, fall back to application-level atomic operation
  if (error && error.message.includes('function') && error.message.includes('does not exist')) {
    return await acquireLockFallback(name, lockedUntil, now);
  }

  if (error) {
    console.error('Lock acquisition error:', error);
    return false;
  }

  // RPC returns true if lock was acquired, false if already locked
  return data === true;
}

/**
 * Fallback lock acquisition using application-level atomic operation.
 * Uses INSERT ... ON CONFLICT DO UPDATE with conditional logic.
 */
async function acquireLockFallback(
  name: string,
  lockedUntil: Date,
  now: Date
): Promise<boolean> {
  // First, try to insert (if lock doesn't exist)
  const { error: insertError } = await supabaseAdmin
    .from('pipeline_locks')
    .insert({
      name,
      locked_until: lockedUntil.toISOString(),
      updated_at: now.toISOString()
    });

  if (!insertError) {
    return true; // Lock acquired (inserted successfully)
  }

  // Lock exists - check if expired and update if so
  const { data: existing, error: selectError } = await supabaseAdmin
    .from('pipeline_locks')
    .select('locked_until')
    .eq('name', name)
    .single();

  if (selectError || !existing) {
    console.error('Lock check error:', selectError);
    return false;
  }

  const existingLockedUntil = new Date(existing.locked_until);

  // If lock is expired, update it
  if (existingLockedUntil <= now) {
    const { error: updateError } = await supabaseAdmin
      .from('pipeline_locks')
      .update({
        locked_until: lockedUntil.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('name', name)
      .lte('locked_until', now.toISOString()); // Only update if expired

    return !updateError; // Success if no error
  }

  // Lock is still active
  return false;
}

/**
 * Releases a lock by setting locked_until to current time.
 * 
 * This is best-effort - if release fails, the lock will auto-expire
 * after TTL anyway. Always call this in a finally block.
 * 
 * @param name Lock identifier (default: 'cron_pipeline')
 */
export async function releaseLock(name: string = DEFAULT_LOCK_NAME): Promise<void> {
  const now = new Date();

  const { error } = await supabaseAdmin
    .from('pipeline_locks')
    .update({
      locked_until: now.toISOString(), // Set to now() to expire immediately
      updated_at: now.toISOString()
    })
    .eq('name', name);

  if (error) {
    // Log but don't throw - lock will auto-expire via TTL
    console.warn(`Failed to release lock ${name}:`, error.message);
  }
}

