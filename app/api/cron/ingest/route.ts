import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { runFullPipeline } from '@/lib/pipeline';

/**
 * Legacy cron endpoint for full pipeline execution.
 * 
 * This endpoint uses x-cron-secret header (legacy format).
 * The main endpoint is /api/cron/run which uses Bearer token.
 * 
 * Refactored to use shared runFullPipeline() function.
 */
export async function GET(req: Request) {
  // Legacy authentication check
  const secret = req.headers.get('x-cron-secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await runFullPipeline();
    return NextResponse.json({
      ok: true,
      ...stats
    });
  } catch (err: any) {
    return NextResponse.json(
      { 
        ok: false, 
        error: err?.message || 'unknown',
        message: 'Pipeline execution failed'
      }, 
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
