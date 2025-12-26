export type ClusterListItem = {
  id: string;
  slug?: string | null; // SEO-friendly URL slug
  headline: string;
  status: 'draft' | 'published';
  category?: string | null;
  topic?: string | null; // Primary topic from OpenAI
  topics?: string[]; // Array of topics (multi-topic support)
  first_seen: string | null;
  last_updated: string | null;
  created_at?: string | null;
  source_count: number | null;
  summary?: string | null;
  summary_version?: number | null;
  sources: { name: string; feed_url: string }[];
  image_url?: string | null;
};

export type FeedType = 'home' | 'recent' | null;
export type CategoryType = 'politics' | 'economy' | 'sports' | 'technology' | 'health' | 'education' | 'science' | null;

// Import cache utilities
import { cache, CacheKeys } from './cache';

/**
 * Load clusters with optional feed type and category filter
 * @param lang - Language for summaries
 * @param feed - 'home' (24h), 'recent' (30d), or null (all)
 * @param category - Filter by category, or null for all
 */
export async function loadClusters(
  lang: 'en' | 'si' | 'ta' = 'en',
  feed: FeedType = null,
  category: CategoryType = null
): Promise<ClusterListItem[]> {
  // Check cache first
  const cacheKey = CacheKeys.clusters(lang, feed, category);
  const cached = cache.get<ClusterListItem[]>(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for ${cacheKey}`);
    return cached;
  }
  
  const params = new URLSearchParams({ lang });
  if (feed) params.append('feed', feed);
  if (category) params.append('category', category);

  const res = await fetch(`/api/clusters?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = 'Failed to fetch clusters';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // If not JSON, use the text or default message
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  const json = await res.json();
  const clusters = (json.clusters || []) as ClusterListItem[];
  
  // Cache for 5 minutes
  cache.set(cacheKey, clusters, 300);
  console.log(`[Cache] Set for ${cacheKey}`);
  
  return clusters;
}

export type ClusterDetail = {
  cluster: ClusterListItem;
  summary: {
    summary_en: string | null;
    summary_si: string | null;
    summary_ta: string | null;
    version?: number | null;
  } | null;
  articles: {
    id: string;
    title: string;
    url: string;
    published_at: string | null;
    content: string | null;
    lang: 'en' | 'si' | 'ta' | 'unk';
    source?: { name: string; feed_url: string } | null;
  }[];
};

export async function loadClusterDetail(id: string): Promise<ClusterDetail> {
  const res = await fetch(`/api/clusters/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Not found');
  }
  return (await res.json()) as ClusterDetail;
}

