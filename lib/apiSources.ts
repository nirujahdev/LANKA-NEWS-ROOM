/**
 * Unified API Sources Integration
 * Fetches news from multiple API providers and normalizes the data
 */

import { fetchNewsAPI, fetchSriLankaNews, NormalizedNewsAPIItem } from './newsApi';
import { fetchNewsData, fetchSriLankaNewsData, NormalizedNewsDataItem } from './newsData';
import { fetchBingNews, fetchSriLankaBingNews, NormalizedBingNewsItem } from './bingNews';
import { env } from './env';
import { NormalizedItem } from './rss';

export type ApiSourceType = 'newsapi' | 'newsdata' | 'bing';

export type UnifiedApiItem = NormalizedItem; // Same format as RSS items

/**
 * Convert API-specific items to unified format
 */
function normalizeApiItem(item: NormalizedNewsAPIItem | NormalizedNewsDataItem | NormalizedBingNewsItem): UnifiedApiItem {
  return {
    title: item.title,
    url: item.url,
    guid: item.guid || item.url,
    publishedAt: item.publishedAt,
    content: item.content,
    contentSnippet: item.contentSnippet,
    imageUrl: item.imageUrl,
    imageUrls: item.imageUrls
  };
}

/**
 * Fetch news from NewsAPI.org
 */
export async function fetchFromNewsAPI(options?: {
  country?: string;
  category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
  query?: string;
}): Promise<UnifiedApiItem[]> {
  if (!env.NEWSAPI_KEY) {
    throw new Error('NEWSAPI_KEY not configured');
  }

  let items: NormalizedNewsAPIItem[];
  
  if (options?.query) {
    items = await fetchNewsAPI({
      query: options.query,
      apiKey: env.NEWSAPI_KEY
    });
  } else if (options?.country === 'lk' && !options.category) {
    // Fetch all Sri Lanka news
    items = await fetchSriLankaNews(env.NEWSAPI_KEY);
  } else {
    items = await fetchNewsAPI({
      country: options?.country || 'lk',
      category: options?.category,
      apiKey: env.NEWSAPI_KEY
    });
  }

  return items.map(normalizeApiItem);
}

/**
 * Fetch news from NewsData.io
 */
export async function fetchFromNewsData(options?: {
  country?: string;
  category?: 'business' | 'entertainment' | 'environment' | 'food' | 'health' | 'politics' | 'science' | 'sports' | 'technology' | 'top' | 'tourism' | 'world';
  query?: string;
  language?: string;
}): Promise<UnifiedApiItem[]> {
  if (!env.NEWSDATA_API_KEY) {
    throw new Error('NEWSDATA_API_KEY not configured');
  }

  let items: NormalizedNewsDataItem[];
  
  if (options?.country === 'lk' && !options.category && !options.query) {
    // Fetch all Sri Lanka news
    items = await fetchSriLankaNewsData(env.NEWSDATA_API_KEY);
  } else {
    const result = await fetchNewsData({
      country: options?.country || 'lk',
      category: options?.category,
      query: options?.query,
      language: options?.language,
      apiKey: env.NEWSDATA_API_KEY
    });
    items = result.items;
  }

  return items.map(normalizeApiItem);
}

/**
 * Fetch news from Bing News API
 */
export async function fetchFromBingNews(options?: {
  query?: string;
  freshness?: 'Day' | 'Week' | 'Month';
}): Promise<UnifiedApiItem[]> {
  if (!env.BING_NEWS_SUBSCRIPTION_KEY) {
    throw new Error('BING_NEWS_SUBSCRIPTION_KEY not configured');
  }

  let items: NormalizedBingNewsItem[];
  
  if (!options?.query) {
    // Fetch all Sri Lanka news
    items = await fetchSriLankaBingNews(env.BING_NEWS_SUBSCRIPTION_KEY);
  } else {
    items = await fetchBingNews({
      query: options.query,
      freshness: options.freshness || 'Day',
      subscriptionKey: env.BING_NEWS_SUBSCRIPTION_KEY
    });
  }

  return items.map(normalizeApiItem);
}

/**
 * Fetch from all configured API sources
 */
export async function fetchFromAllApis(): Promise<UnifiedApiItem[]> {
  const allItems: UnifiedApiItem[] = [];
  const errors: string[] = [];

  // Fetch from NewsAPI
  if (env.NEWSAPI_KEY) {
    try {
      console.log('[API Sources] Fetching from NewsAPI.org...');
      const newsApiItems = await fetchFromNewsAPI({ country: 'lk' });
      console.log(`[API Sources] NewsAPI: ${newsApiItems.length} articles`);
      allItems.push(...newsApiItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`NewsAPI: ${message}`);
      console.error('[API Sources] NewsAPI error:', message);
    }
  }

  // Fetch from NewsData.io
  if (env.NEWSDATA_API_KEY) {
    try {
      console.log('[API Sources] Fetching from NewsData.io...');
      const newsDataItems = await fetchFromNewsData({ country: 'lk' });
      console.log(`[API Sources] NewsData: ${newsDataItems.length} articles`);
      allItems.push(...newsDataItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`NewsData: ${message}`);
      console.error('[API Sources] NewsData error:', message);
    }
  }

  // Fetch from Bing News
  if (env.BING_NEWS_SUBSCRIPTION_KEY) {
    try {
      console.log('[API Sources] Fetching from Bing News...');
      const bingItems = await fetchFromBingNews();
      console.log(`[API Sources] Bing News: ${bingItems.length} articles`);
      allItems.push(...bingItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Bing News: ${message}`);
      console.error('[API Sources] Bing News error:', message);
    }
  }

  if (errors.length > 0) {
    console.warn('[API Sources] Some API sources failed:', errors);
  }

  // Remove duplicates by URL
  const uniqueItems = new Map<string, UnifiedApiItem>();
  for (const item of allItems) {
    if (!uniqueItems.has(item.url)) {
      uniqueItems.set(item.url, item);
    }
  }

  const finalItems = Array.from(uniqueItems.values());
  console.log(`[API Sources] Total unique articles: ${finalItems.length}`);
  
  return finalItems;
}

