import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cache, CacheKeys, SearchFilterOptions } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const lang = (searchParams.get('lang') as 'en' | 'si' | 'ta') || 'en';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    
    // Parse filter parameters
    const topicParam = searchParams.get('topic');
    const topics = topicParam ? topicParam.split(',').filter(t => t.trim()) : undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const city = searchParams.get('city') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    
    // Build filter options
    const filters: SearchFilterOptions = {};
    if (topics && topics.length > 0) filters.topic = topics;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (city) filters.city = city;
    if (eventType) filters.eventType = eventType;
    
    // Allow empty query if filters are provided
    if (!query && Object.keys(filters).length === 0) {
      return NextResponse.json({ 
        error: 'Query or filters required',
        results: [] 
      }, { status: 400 });
    }
    
    if (query && query.length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters',
        results: [] 
      }, { status: 400 });
    }
    
    // Check cache
    const cacheKey = CacheKeys.search(query, lang, limit, filters);
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ results: cached, query, total: cached.length, filters });
    }
    
    // Use enhanced search function with filters
    const { data, error } = await supabaseAdmin.rpc('search_clusters', {
      search_query: query || '',
      lang_code: lang,
      topic_filter: topics || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      city_filter: city || undefined,
      event_type_filter: eventType || undefined,
      result_limit: limit
    });
    
    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ 
        error: error.message,
        results: [] 
      }, { status: 500 });
    }
    
    // Get summaries and sources for results
    const clusterIds = (data || []).slice(0, limit).map((r: any) => r.id);
    
    if (clusterIds.length === 0) {
      return NextResponse.json({ results: [], query, total: 0 });
    }
    
    const [{ data: summaries }, { data: articles }] = await Promise.all([
      supabaseAdmin
        .from('summaries')
        .select('cluster_id, summary_en, summary_si, summary_ta')
        .in('cluster_id', clusterIds),
      supabaseAdmin
        .from('articles')
        .select('cluster_id, source_id, sources(name, feed_url)')
        .in('cluster_id', clusterIds)
    ]);
    
    const summariesMap = new Map((summaries || []).map((s: any) => [s.cluster_id, s]));
    const sourcesMap = new Map<string, any[]>();
    
    (articles || []).forEach((art: any) => {
      if (!art.cluster_id) return;
      const list = sourcesMap.get(art.cluster_id) || [];
      if (art.sources && !list.find((s: any) => s.feed_url === art.sources.feed_url)) {
        list.push(art.sources);
      }
      sourcesMap.set(art.cluster_id, list);
    });
    
    const results = (data || []).map((item: any) => {
      const summary = summariesMap.get(item.id);
      return {
        id: item.id,
        slug: item.slug,
        headline: item.headline,
        summary: lang === 'si' 
          ? (summary?.summary_si || summary?.summary_en || item.summary || '')
          : lang === 'ta' 
          ? (summary?.summary_ta || summary?.summary_en || item.summary || '')
          : (summary?.summary_en || item.summary || ''),
        sourceCount: item.source_count,
        sources: sourcesMap.get(item.id) || [],
        publishedAt: item.published_at,
        category: item.category,
        topic: item.topic,
        city: item.city,
        eventType: item.event_type,
        imageUrl: item.image_url,
        rank: item.rank
      };
    });
    
    // Cache for 5 minutes
    cache.set(cacheKey, results, 300);
    
    return NextResponse.json({ results, query, total: results.length, filters });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      results: [] 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

