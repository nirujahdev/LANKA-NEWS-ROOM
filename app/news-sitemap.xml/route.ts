/**
 * Google News Sitemap
 * 
 * Specifically for news content - includes only articles from last 2 days.
 * Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  
  // Get articles from last 2 days only (Google News requirement)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: clusters, error } = await supabaseAdmin
    .from('clusters')
    .select('slug, headline, published_at, language, category')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .gte('published_at', twoDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(1000)
    .returns<Array<{
      slug: string;
      headline: string;
      published_at: string | null;
      language: string | null;
      category: string | null;
    }>>();

  if (error || !clusters) {
    return new Response('Error generating news sitemap', { status: 500 });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${clusters
  .map((cluster) => {
    const url = `${baseUrl}/news/${cluster.slug}`;
    const pubDate = cluster.published_at 
      ? new Date(cluster.published_at).toISOString()
      : new Date().toISOString();
    const lang = cluster.language || 'en';

    return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>Lanka News Room</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${cluster.headline}]]></news:title>
    </news:news>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300'
    }
  });
}

