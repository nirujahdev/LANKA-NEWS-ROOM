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
    .limit(1000)
    .returns<Array<{
      slug: string;
      published_at: string | null;
      updated_at: string | null;
    }>>(); // Limit to prevent sitemap from being too large

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
      priority: 1,
      alternates: {
        languages: {
          'en-LK': baseUrl,
          'si-LK': `${baseUrl}?lang=si`,
          'ta-LK': `${baseUrl}?lang=ta`,
          'x-default': baseUrl
        }
      }
    },
    {
      url: `${baseUrl}/for-you`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8
    }
  ];

  // Add programmatic SEO pages (topics)
  const topics = ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture'];
  const languages = ['en', 'si', 'ta'];
  for (const topic of topics) {
    for (const lang of languages) {
      entries.push({
        url: `${baseUrl}/lk/${lang}/${topic}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.8,
        alternates: {
          languages: {
            'en-LK': `${baseUrl}/lk/en/${topic}`,
            'si-LK': `${baseUrl}/lk/si/${topic}`,
            'ta-LK': `${baseUrl}/lk/ta/${topic}`,
            'x-default': `${baseUrl}/lk/en/${topic}`
          }
        }
      });
    }
  }

  // Add programmatic SEO pages (cities)
  const cities = ['colombo', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'matara', 'negombo', 'anuradhapura'];
  for (const city of cities) {
    for (const lang of languages) {
      entries.push({
        url: `${baseUrl}/lk/${lang}/city/${city}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.7,
        alternates: {
          languages: {
            'en-LK': `${baseUrl}/lk/en/city/${city}`,
            'si-LK': `${baseUrl}/lk/si/city/${city}`,
            'ta-LK': `${baseUrl}/lk/ta/city/${city}`,
            'x-default': `${baseUrl}/lk/en/city/${city}`
          }
        }
      });
    }
  }

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
          'en-LK': `${baseUrl}/news/${cluster.slug}?lang=en`,
          'si-LK': `${baseUrl}/news/${cluster.slug}?lang=si`,
          'ta-LK': `${baseUrl}/news/${cluster.slug}?lang=ta`,
          'x-default': `${baseUrl}/news/${cluster.slug}?lang=en`
        }
      }
    });
  }

  return entries;
}

