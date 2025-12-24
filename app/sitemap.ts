import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  
  // Get published clusters from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: clusters, error } = await supabaseAdmin
    .from('clusters')
    .select('slug, published_at, updated_at')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .gte('published_at', thirtyDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(1000); // Limit to prevent sitemap from being too large

  if (error || !clusters) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1
      }
    ];
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1
    },
    {
      url: `${baseUrl}/for-you`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8
    }
  ];

  // Add news articles with language variants
  for (const cluster of clusters) {
    if (!cluster.slug) continue;

    const lastModified = cluster.updated_at 
      ? new Date(cluster.updated_at)
      : cluster.published_at
      ? new Date(cluster.published_at)
      : new Date();

    // English (canonical)
    entries.push({
      url: `${baseUrl}/news/${cluster.slug}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/news/${cluster.slug}?lang=en`,
          si: `${baseUrl}/news/${cluster.slug}?lang=si`,
          ta: `${baseUrl}/news/${cluster.slug}?lang=ta`
        }
      }
    });
  }

  return entries;
}

