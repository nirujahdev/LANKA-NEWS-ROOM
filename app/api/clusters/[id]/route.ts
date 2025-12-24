import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const { id } = params;

  const { data: cluster, error } = await supabaseAdmin
    .from('clusters')
    .select('*')
    .eq('id', id)
    .gte('expires_at', new Date().toISOString()) // Only show non-expired clusters
    .single();

  if (error || !cluster || cluster.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [{ data: summary }, { data: articles }] = await Promise.all([
    supabaseAdmin.from('summaries').select('*').eq('cluster_id', id).maybeSingle(),
    supabaseAdmin
      .from('articles')
      .select('id, title, url, published_at, content_text, content_excerpt, lang, source_id, sources(name, feed_url)')
      .eq('cluster_id', id)
      .order('published_at', { ascending: false })
  ]);

  const sourcesMap = new Map<string, { name: string; feed_url: string }>();
  for (const a of articles || []) {
    const s = (a as any).sources as { name: string; feed_url: string } | null;
    if (s) sourcesMap.set(s.feed_url, s);
  }

  return NextResponse.json({
    cluster: {
      ...cluster,
      sources: Array.from(sourcesMap.values())
    },
    summary,
    articles: (articles || []).map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      published_at: a.published_at,
      content: a.content_excerpt || a.content_text,
      lang: a.lang,
      source: (a as any).sources
    }))
  });
}

export const runtime = 'edge';

