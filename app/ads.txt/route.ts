import { NextResponse } from 'next/server';

/**
 * Ads.txt route handler
 * 
 * Serves the ads.txt file for Google AdSense verification
 * This ensures the file is always accessible at /ads.txt
 * 
 * Format: google.com, pub-8312977389353751, DIRECT, f08c47fec0942fa0
 * 
 * According to IAB Tech Lab ads.txt specification:
 * - Domain: google.com (authorized seller)
 * - Publisher ID: pub-8312977389353751 (your AdSense publisher ID)
 * - Relationship: DIRECT (direct relationship with the seller)
 * - Certification Authority ID: f08c47fec0942fa0 (Google's certification ID)
 */
export async function GET() {
  const adsTxtContent = `google.com, pub-8312977389353751, DIRECT, f08c47fec0942fa0`;

  return new NextResponse(adsTxtContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Ensure this route is not cached incorrectly
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

