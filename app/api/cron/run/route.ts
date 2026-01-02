import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { isLocked, acquireLock, releaseLock } from '@/lib/pipelineLock';
import { checkLastRunTooSoon, checkForNewItems, getLastSuccessfulRun } from '@/lib/pipelineEarlyExit';
import { runFullPipeline } from '@/lib/pipeline';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * DEPRECATED: This endpoint is no longer used.
 * 
 * The pipeline now runs directly in GitHub Actions via scripts/pipeline.ts
 * See .github/workflows/pipeline.yml for the new implementation.
 * 
 * This endpoint is kept for backward compatibility but should not be called.
 * 
 * ---
 * 
 * Secure cron endpoint for data ingestion with lock protection and early-exit optimization.
 * 
 * SECURITY:
 * - Only accepts requests with valid Authorization: Bearer token
 * - Token must match CRON_SECRET environment variable
 * - All sources come from database allowlist (never from request)
 * - Domain validation prevents feed poisoning
 * 
 * LOCK PROTECTION:
 * - Uses distributed lock (Postgres) to prevent concurrent executions
 * - Lock TTL: 10 minutes (configurable via LOCK_TTL_MINUTES)
 * - Auto-expires if process crashes
 * 
 * EARLY EXIT OPTIMIZATION:
 * - Checks if last run was too recent (timestamp check)
 * - Checks if RSS feeds have new items (URL/GUID check)
 * - Skips expensive operations if no new data
 * 
 * @deprecated Use GitHub Actions pipeline worker instead (scripts/pipeline.ts)
 */
export async function GET(req: Request) {
  // Extract Authorization header
  const authHeader = req.headers.get('Authorization');

  // Validate header exists
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
  }

  // Validate Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Authorization format' }, { status: 401 });
  }

  // Extract token (everything after "Bearer ")
  const token = authHeader.substring(7).trim();

  // Validate token matches CRON_SECRET
  // CRON_SECRET is read from environment variables only
  // Never hardcoded, never logged, never exposed to client
  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    // Return generic error to avoid leaking information
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Authorization successful - proceed with pipeline

  // Check for force parameter to bypass cooldown
  const url = new URL(req.url);
  const forceRun = url.searchParams.get('force') === '1';

  // STEP 1: Check if already locked (quick check before expensive operations)
  const lockName = 'cron_pipeline';
  if (await isLocked(lockName)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'locked',
      message: 'Pipeline is already running (locked)'
    });
  }

  // STEP 2: Early exit check 1 - Last run too soon?
  // Skip this check if force=1 is provided
  if (!forceRun) {
    const tooSoonCheck = await checkLastRunTooSoon();
    if (tooSoonCheck?.shouldSkip) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: tooSoonCheck.reason,
        message: 'Last run was too recent, skipping (use ?force=1 to override)'
      });
    }
  }

  // STEP 3: Acquire lock (atomic operation)
  const lockAcquired = await acquireLock(lockName);
  if (!lockAcquired) {
    // Race condition: another process acquired lock between check and acquire
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'locked',
      message: 'Failed to acquire lock (another process got it first)'
    });
  }

  // Lock acquired - ensure we release it in finally block
  try {
    // STEP 4: Early exit check 2 - Are there new items?
    // Load sources first (needed for new items check)
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('sources')
      .select('id, name, feed_url')
      .eq('active', true);

    if (sourcesError) {
      throw new Error(`Failed to load sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      // No sources configured - skip
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'no_new_items',
        message: 'No active sources configured'
      });
    }

    // Check for new items (fetches RSS feeds and compares with database)
    const lastRunTime = await getLastSuccessfulRun();
    const newItemsCheck = await checkForNewItems(sources, lastRunTime);

    if (newItemsCheck?.shouldSkip) {
      // No new items - release lock and exit early
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: newItemsCheck.reason,
        message: 'No new items found in RSS feeds'
      });
    }

    // STEP 5: Run full pipeline (fetch → insert → cluster → categorize → summarize)
    const stats = await runFullPipeline();

    // STEP 6: Return success
    return NextResponse.json({
      ok: true,
      ...stats
    });
  } catch (error: any) {
    // Log error server-side but don't expose details to client
    console.error('Pipeline execution error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: 'Pipeline execution failed'
      },
      { status: 500 }
    );
  } finally {
    // STEP 7: Always release lock (best-effort)
    // If release fails, lock will auto-expire after TTL
    await releaseLock(lockName);
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-running pipeline
