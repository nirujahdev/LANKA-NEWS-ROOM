import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cache, CacheKeys } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    // Check cache for filter options (cache for 1 hour since they change infrequently)
    const cacheKey = CacheKeys.searchFilters();
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    // Get available filter options from database
    // Note: get_search_filter_options RPC exists but types need regeneration
    const { data, error } = await (supabaseAdmin as any).rpc('get_search_filter_options');
    
    if (error) {
      console.error('Filter options error:', error);
      // Fallback to default options
      return NextResponse.json({
        topics: ['politics', 'economy', 'sports', 'technology', 'health', 'education', 'crime', 'environment', 'culture', 'other'],
        cities: ['colombo', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'matara', 'negombo', 'anuradhapura'],
        eventTypes: ['election', 'court', 'accident', 'protest', 'announcement', 'budget', 'policy', 'crime', 'disaster', 'sports_event', 'other'],
        dateMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        dateMax: new Date().toISOString()
      });
    }
    
    const result = {
      topics: (data?.topics || []).filter((t: string) => t).sort(),
      cities: (data?.cities || []).filter((c: string) => c).sort(),
      eventTypes: (data?.event_types || []).filter((e: string) => e).sort(),
      dateMin: data?.date_min || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateMax: data?.date_max || new Date().toISOString()
    };
    
    // Cache for 1 hour (3600 seconds)
    cache.set(cacheKey, result, 3600);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Filter options error:', error);
    return NextResponse.json({ 
      error: 'Failed to get filter options',
      topics: [],
      cities: [],
      eventTypes: [],
      dateMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateMax: new Date().toISOString()
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

