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
    
    // Check cache first
    const cacheKey = CacheKeys.clusters(lang, feed, category);
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ clusters: cached });
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
      
      return {
        id: cluster.id,
        slug: cluster.slug, // Add slug for SEO-friendly URLs
        headline: headlineText,
        status: cluster.status,
        category: cluster.category,
        topic: cluster.topic || cluster.category || null, // Use topic field if available, fallback to category
        topics: topicsArray, // Add topics array
        first_seen: cluster.first_seen_at,
        last_updated: cluster.updated_at,
        created_at: cluster.created_at,
        source_count: cluster.source_count,
        summary: summaryText,
        summary_version: summary?.version,
        sources: sourcesByCluster.get(cluster.id) || [],
        image_url: imagesByCluster.get(cluster.id) || null
      };
    });

    // Cache result for 5 minutes
    cache.set(cacheKey, payload, 300);
    
    return NextResponse.json({ clusters: payload });
  } catch (error) {
    console.error('Error in GET /api/clusters:', error);
    return NextResponse.json(
      { error: 'Internal server error', clusters: [] },
      { status: 500 }
    );
  }
}

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

