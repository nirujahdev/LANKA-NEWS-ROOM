import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { env } from '@/lib/env';
import { runIngestionPipeline } from '@/lib/ingestion';

/**
 * Secure cron endpoint for data ingestion.
 * 
 * SECURITY:
 * - Only accepts requests with valid Authorization: Bearer token
 * - Token must match CRON_SECRET environment variable
 * - All sources come from database allowlist (never from request)
 * - Domain validation prevents feed poisoning
 * 
 * This endpoint is called by Vercel Cron automatically.
 * Never expose CRON_SECRET to client code.
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
  if (token !== env.CRON_SECRET) {
    // Return generic error to avoid leaking information
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Authorization successful - run ingestion pipeline
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    // Log error server-side but don't expose details to client
    console.error('Ingestion pipeline error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

