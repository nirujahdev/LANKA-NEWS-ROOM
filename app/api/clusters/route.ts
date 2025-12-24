import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Database } from '@/lib/supabaseTypes';

type ClusterRow = Database['public']['Tables']['clusters']['Row'];
type SummaryRow = Database['public']['Tables']['summaries']['Row'];
type ArticleRow = Database['public']['Tables']['articles']['Row'];

type ArticleWithSource = ArticleRow & {
  sources: { name: string; feed_url: string } | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get('lang') as 'en' | 'si' | 'ta' | null) || 'en';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const category = searchParams.get('category'); // Filter by category
  const feed = searchParams.get('feed'); // 'home' (24h) or 'recent' (30d) or null (all)

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
  let query = supabaseAdmin
    .from('clusters')
    .select('*')
    .eq('status', 'published')
    .gte('expires_at', new Date().toISOString()); // Only show non-expired clusters

  // Apply category filter
  if (category && category !== 'home' && category !== 'recent') {
    query = query.eq('category', category);
  }

  // Apply time filter
  if (timeFilter) {
    query = query.gte(timeFilter.column, timeFilter.value);
  }

  // Order by: home uses last_updated, recent uses created_at, others use updated_at
  const orderBy = feed === 'home' ? 'last_seen_at' : feed === 'recent' ? 'created_at' : 'updated_at';
  query = query.order(orderBy, { ascending: false }).limit(limit);

  const { data: clusters, error } = await query.returns<ClusterRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = clusters?.map((c) => c.id) ?? [];
  if (!ids.length) {
    return NextResponse.json({ clusters: [] });
  }

  const [{ data: summaries }, { data: articles }] = await Promise.all([
    supabaseAdmin.from('summaries').select('*').in('cluster_id', ids).returns<SummaryRow[]>(),
    supabaseAdmin
      .from('articles')
      .select('cluster_id, source_id, sources(name, feed_url)')
      .in('cluster_id', ids)
      .returns<ArticleWithSource[]>()
  ]);

  const summariesByCluster = new Map((summaries || []).map((s) => [s.cluster_id, s]));
  const sourcesByCluster = new Map<string, { name: string; feed_url: string }[]>();

  for (const art of articles || []) {
    const src = art.sources;
    if (!src || !art.cluster_id) continue; // Skip if no source or no cluster_id
    const list = sourcesByCluster.get(art.cluster_id) || [];
    if (!list.find((s) => s.feed_url === src.feed_url)) {
      list.push(src);
    }
    sourcesByCluster.set(art.cluster_id, list);
  }

  const payload = (clusters || []).map((cluster) => {
    const summary = summariesByCluster.get(cluster.id);
    const summaryText =
      lang === 'si' ? summary?.summary_si : lang === 'ta' ? summary?.summary_ta : summary?.summary_en;
    return {
      id: cluster.id,
      slug: cluster.slug, // Add slug for SEO-friendly URLs
      headline: cluster.headline,
      status: cluster.status,
      category: cluster.category,
      first_seen: cluster.first_seen_at,
      last_updated: cluster.updated_at,
      created_at: cluster.created_at,
      source_count: cluster.source_count,
      summary: summaryText,
      summary_version: summary?.version,
      sources: sourcesByCluster.get(cluster.id) || []
    };
  });

  return NextResponse.json({ clusters: payload });
}

export const runtime = 'edge';

