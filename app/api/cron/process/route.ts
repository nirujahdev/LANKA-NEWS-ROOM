import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Use /api/cron/ingest for pipeline' }, { status: 410 });
}

export const runtime = 'nodejs';

