import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Database } from '@/lib/supabaseTypes';
import { cache, CacheKeys } from '@/lib/cache';

type ClusterRow = Database['public']['Tables']['clusters']['Row'] & {
  slug?: string | null;
  meta_title_en?: string | null;
  meta_description_en?: string | null;
  meta_title_si?: string | null;
  meta_description_si?: string | null;
  meta_title_ta?: string | null;
  meta_description_ta?: string | null;
  published_at?: string | null;
  topic?: string | null; // Primary topic from OpenAI
  topics?: string[] | null; // Multi-topic array
  headline_si?: string | null; // Sinhala headline translation
  headline_ta?: string | null; // Tamil headline translation
};
type SummaryRow = Database['public']['Tables']['summaries']['Row'];
type ArticleRow = Database['public']['Tables']['articles']['Row'] & {
  image_url?: string | null;
};

type ArticleWithSource = ArticleRow & {
  image_url?: string | null;
  sources: { name: string; feed_url: string } | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get('lang') as 'en' | 'si' | 'ta' | null) || 'en';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const category = searchParams.get('category'); // Filter by category
    const feed = searchParams.get('feed'); // 'home' (24h) or 'recent' (30d) or null (all)
    
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      console.error('[API] Supabase admin credentials not configured. Returning empty clusters.');
      return NextResponse.json({ clusters: [] });
    }
    
    // Check cache first
    const cacheKey = CacheKeys.clusters(lang, feed, category);
    try {
      const cached = cache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ clusters: cached });
      }
    } catch (cacheError) {
      // If cache fails, continue without cache
      console.warn('[API] Cache check failed, continuing without cache:', cacheError);
    }

    // Build time filter based on feed type
    let timeFilter: { column: string; operator: string; value: string } | null = null;
    if (feed === 'home') {
      // Home: last 24 hours, ordered by importance (last_updated)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      timeFilter = { column: 'last_seen_at', operator: 'gte', value: yesterday.toISOString() };
    } else if (feed === 'recent') {
      // Recent: last 30 days, ordered by created_at desc
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      timeFilter = { column: 'created_at', operator: 'gte', value: thirtyDaysAgo.toISOString() };
    }

    // Build query
    const now = new Date().toISOString();
    let query = supabaseAdmin
      .from('clusters')
      .select('*')
      .eq('status', 'published')
      .or(`expires_at.is.null,expires_at.gte.${now}`); // Show clusters that haven't expired or have no expiry

    // Apply category filter - check both category and topic fields
    if (category && category !== 'home' && category !== 'recent') {
      // Use OR condition to match either category or topic field
      // This ensures flexibility in how topics are stored
      query = query.or(`category.eq.${category},topic.eq.${category}`);
      console.log(`[API] Filtering by category: ${category} (checking both category and topic fields)`);
    }

    // Apply time filter
    if (timeFilter) {
      query = query.gte(timeFilter.column, timeFilter.value);
    }

    // Order by: home uses last_updated, recent uses created_at, others use updated_at (most recent first)
    const orderBy = feed === 'home' ? 'last_seen_at' : feed === 'recent' ? 'created_at' : 'updated_at';
    query = query.order(orderBy, { ascending: false }).limit(limit);

    const { data: clusters, error } = await query.returns<ClusterRow[]>();
    
    console.log(`[API] Found ${clusters?.length || 0} clusters for category=${category}, feed=${feed}, lang=${lang}`);

    if (error) {
      console.error('Error fetching clusters:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = clusters?.map((c) => c.id) ?? [];
    if (!ids.length) {
      return NextResponse.json({ clusters: [] });
    }

    const [{ data: summaries, error: summariesError }, { data: articles, error: articlesError }] = await Promise.all([
      supabaseAdmin.from('summaries').select('*').in('cluster_id', ids).returns<SummaryRow[]>(),
      supabaseAdmin
        .from('articles')
        .select('cluster_id, source_id, image_url, sources(name, feed_url)')
        .in('cluster_id', ids)
        .returns<ArticleWithSource[]>()
    ]);

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError);
    }
    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    }

    const summariesByCluster = new Map((summaries || []).map((s) => [s.cluster_id, s]));
    const sourcesByCluster = new Map<string, { name: string; feed_url: string }[]>();
    const imagesByCluster = new Map<string, string | null>();

    for (const art of articles || []) {
      const src = art.sources;
      if (!art.cluster_id) continue; // Skip if no cluster_id
      
      // Collect sources
      if (src) {
        const list = sourcesByCluster.get(art.cluster_id) || [];
        if (!list.find((s) => s.feed_url === src.feed_url)) {
          list.push(src);
        }
        sourcesByCluster.set(art.cluster_id, list);
      }
      
      // Collect first available image
      if (art.image_url && !imagesByCluster.has(art.cluster_id)) {
        imagesByCluster.set(art.cluster_id, art.image_url);
      }
    }

    const payload = (clusters || []).map((cluster) => {
      try {
        const summary = summariesByCluster.get(cluster.id);
        // Always fallback to English if language-specific summary is missing
        const summaryText =
          lang === 'si' 
            ? (summary?.summary_si || summary?.summary_en || '')
            : lang === 'ta' 
            ? (summary?.summary_ta || summary?.summary_en || '')
            : (summary?.summary_en || '');
        
        // Get language-specific headline
        const headlineText =
          lang === 'si' ? cluster.headline_si || cluster.headline :
          lang === 'ta' ? cluster.headline_ta || cluster.headline :
          cluster.headline;
        
        // Get topics array (prefer topics array, fallback to single topic)
        const topicsArray = cluster.topics && Array.isArray(cluster.topics) && cluster.topics.length > 0
          ? cluster.topics
          : cluster.topic ? [cluster.topic] : [];
        
        // Ensure all date values are strings (serializable)
        const firstSeen = cluster.first_seen_at 
          ? (typeof cluster.first_seen_at === 'string' ? cluster.first_seen_at : new Date(cluster.first_seen_at).toISOString())
          : null;
        const lastUpdated = cluster.updated_at
          ? (typeof cluster.updated_at === 'string' ? cluster.updated_at : new Date(cluster.updated_at).toISOString())
          : null;
        const createdAt = cluster.created_at
          ? (typeof cluster.created_at === 'string' ? cluster.created_at : new Date(cluster.created_at).toISOString())
          : null;
        
        // Get image URL - prefer cluster image_url, fallback to article images
        const clusterImageUrl = cluster.image_url || null;
        const articleImageUrl = imagesByCluster.get(cluster.id) || null;
        const finalImageUrl = clusterImageUrl || articleImageUrl;
        
        // Ensure image_url is a valid string or null (not undefined)
        const safeImageUrl = finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.trim().length > 0
          ? finalImageUrl.trim()
          : null;
        
        // Ensure sources array is properly formatted
        const clusterSources = sourcesByCluster.get(cluster.id) || [];
        const safeSources = Array.isArray(clusterSources) 
          ? clusterSources.filter(s => s && typeof s === 'object' && s.name && s.feed_url)
          : [];
        
        return {
          id: String(cluster.id || ''),
          slug: cluster.slug && typeof cluster.slug === 'string' ? cluster.slug : null,
          headline: String(headlineText || ''),
          status: (cluster.status === 'draft' || cluster.status === 'published') ? cluster.status : 'published',
          category: cluster.category && typeof cluster.category === 'string' ? cluster.category : null,
          topic: (cluster.topic || cluster.category) && typeof (cluster.topic || cluster.category) === 'string' 
            ? (cluster.topic || cluster.category) 
            : null,
          topics: Array.isArray(topicsArray) ? topicsArray.filter(t => typeof t === 'string') : [],
          first_seen: firstSeen,
          last_updated: lastUpdated,
          created_at: createdAt,
          source_count: typeof cluster.source_count === 'number' ? cluster.source_count : 0,
          summary: String(summaryText || ''),
          summary_version: summary && typeof summary.version === 'number' ? summary.version : null,
          sources: safeSources,
          image_url: safeImageUrl
        };
      } catch (error) {
        console.error(`Error processing cluster ${cluster.id}:`, error);
        // Return a minimal valid object to prevent breaking the entire response
        return {
          id: cluster.id || '',
          slug: null,
          headline: cluster.headline || '',
          status: 'published',
          category: null,
          topic: null,
          topics: [],
          first_seen: null,
          last_updated: null,
          created_at: null,
          source_count: 0,
          summary: '',
          summary_version: null,
          sources: [],
          image_url: null
        };
      }
    }).filter(item => item.id); // Filter out any invalid items

    // Cache result for 5 minutes (with error handling)
    try {
      cache.set(cacheKey, payload, 300);
    } catch (cacheError) {
      // If cache fails, log but don't fail the request
      console.warn('[API] Failed to cache result:', cacheError);
    }
    
    // Ensure payload is serializable before sending
    try {
      // Test serialization
      JSON.stringify(payload);
      return NextResponse.json({ clusters: payload });
    } catch (serializationError) {
      console.error('[API] Serialization error:', serializationError);
      // Return empty array if serialization fails
      return NextResponse.json({ clusters: [] });
    }
  } catch (error) {
    console.error('Error in GET /api/clusters:', error);
    // Always return a valid response, even on error
    // This prevents Server Components from crashing
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', clusters: [] },
      { status: 500 }
    );
  }
}

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

