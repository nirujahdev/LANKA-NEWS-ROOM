import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    // Check cache
    const cacheKey = 'topics:list';
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get distinct topics with article counts
    const { data, error } = await supabaseAdmin
      .from('clusters')
      .select('topic')
      .eq('status', 'published')
      .not('topic', 'is', null);

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json({ 
        error: error.message,
        topics: [] 
      }, { status: 500 });
    }

    // Count articles per topic
    const topicCounts = new Map<string, number>();
    (data || []).forEach((item: any) => {
      if (item.topic) {
        topicCounts.set(item.topic, (topicCounts.get(item.topic) || 0) + 1);
      }
    });

    // Convert to array and sort by count
    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const result = { topics };

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Topics API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch topics',
      topics: [] 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

