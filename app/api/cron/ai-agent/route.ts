import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { isLocked, acquireLock, releaseLock } from '@/lib/pipelineLock';
import { runAIAgentPipeline } from '@/lib/aiNewsAgentPipeline';

/**
 * AI News Agent Pipeline Endpoint
 * 
 * Secure cron endpoint for running the AI agent-driven news processing pipeline.
 * 
 * This pipeline uses AI agents for:
 * - Summary generation
 * - Translation (multi-language)
 * - SEO metadata generation
 * - Image selection
 * - Categorization
 * 
 * SECURITY:
 * - Only accepts requests with valid Authorization: Bearer token
 * - Token must match CRON_SECRET environment variable
 * 
 * LOCK PROTECTION:
 * - Uses distributed lock (Postgres) to prevent concurrent executions
 * - Lock TTL: 10 minutes
 * - Auto-expires if process crashes
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
  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for force parameter to bypass lock
  const url = new URL(req.url);
  const forceRun = url.searchParams.get('force') === '1';

  // STEP 1: Check if already locked
  const lockName = 'ai_agent_pipeline';
  if (!forceRun && await isLocked(lockName)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'locked',
      message: 'AI Agent Pipeline is already running (locked). Use ?force=1 to override.'
    });
  }

  // STEP 2: Acquire lock
  const lockAcquired = await acquireLock(lockName);
  if (!lockAcquired) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'locked',
      message: 'Failed to acquire lock (another process got it first)'
    });
  }

  // Lock acquired - ensure we release it in finally block
  try {
    // STEP 3: Run AI Agent Pipeline
    const stats = await runAIAgentPipeline();

    // STEP 4: Return success
    return NextResponse.json({
      ok: true,
      message: 'AI Agent Pipeline completed successfully',
      ...stats
    });
  } catch (error: any) {
    // Log error server-side but don't expose details to client
    console.error('[AI Agent Pipeline] Execution error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: 'AI Agent Pipeline execution failed',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    // STEP 5: Always release lock (best-effort)
    await releaseLock(lockName);
  }
}

export const runtime = 'nodejs';

