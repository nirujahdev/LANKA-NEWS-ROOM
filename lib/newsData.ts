/**
 * NewsData.io Integration
 * Documentation: https://newsdata.io/documentation
 */

import { withRetry } from './retry';

export type NewsDataArticle = {
  article_id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  source_id: string;
  source_name: string;
  source_url: string;
  source_icon: string | null;
  source_priority: number;
  category: string[];
  country: string[];
  language: string;
  creator: string[] | null;
  video_url: string | null;
  keywords: string[] | null;
};

export type NewsDataResponse = {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  nextPage?: string;
};

export type NormalizedNewsDataItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  content: string | null;
  contentSnippet: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  guid: string | null;
};

/**
 * Fetch news from NewsData.io
 * @param options - Query options
 * @returns Normalized article items
 */
export async function fetchNewsData(
  options: {
    country?: string; // ISO 3166-1 alpha-2 code (e.g., 'lk' for Sri Lanka)
    category?: 'business' | 'entertainment' | 'environment' | 'food' | 'health' | 'politics' | 'science' | 'sports' | 'technology' | 'top' | 'tourism' | 'world';
    query?: string; // Search query
    language?: string; // 'en', 'si', 'ta'
    page?: string; // Next page token from previous response
    apiKey: string;
  }
): Promise<{ items: NormalizedNewsDataItem[]; nextPage?: string }> {
  const { country = 'lk', category, query, language, page, apiKey } = options;

  return withRetry(
    async () => {
      let url = `https://newsdata.io/api/1/news?apikey=${apiKey}`;
      
      if (country) {
        url += `&country=${country}`;
      }
      if (category) {
        url += `&category=${category}`;
      }
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }
      if (language) {
        url += `&language=${language}`;
      }
      if (page) {
        url += `&page=${page}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsData.io error ${response.status}: ${errorText}`);
      }

      const data: NewsDataResponse = await response.json();

      if (data.status !== 'success') {
        throw new Error(`NewsData.io returned status: ${data.status}`);
      }

      const items: NormalizedNewsDataItem[] = data.results.map((article): NormalizedNewsDataItem => {
        const imageUrls = article.image_url ? [article.image_url] : [];
        
        return {
          title: article.title || 'Untitled',
          url: article.link,
          publishedAt: article.pubDate || null,
          content: article.content || article.description || null,
          contentSnippet: article.description || article.content?.substring(0, 200) || null,
          imageUrl: article.image_url || null,
          imageUrls: imageUrls.length > 0 ? imageUrls : null,
          guid: article.article_id || article.link
        };
      });

      return {
        items,
        nextPage: data.nextPage
      };
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`[NewsData] Retry ${attempt}/3: ${error.message}`);
      }
    }
  );
}

/**
 * Fetch Sri Lanka news from multiple categories
 */
export async function fetchSriLankaNewsData(apiKey: string): Promise<NormalizedNewsDataItem[]> {
  const categories: Array<'business' | 'entertainment' | 'environment' | 'food' | 'health' | 'politics' | 'science' | 'sports' | 'technology' | 'top' | 'tourism' | 'world'> = [
    'top', 'politics', 'business', 'health', 'sports', 'technology'
  ];

  const allArticles: NormalizedNewsDataItem[] = [];
  
  // Fetch from all categories in parallel
  const results = await Promise.allSettled(
    categories.map(category =>
      fetchNewsData({
        country: 'lk',
        category,
        apiKey
      }).then(result => result.items)
    )
  );

  // Combine results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.warn(`[NewsData] Failed to fetch category: ${result.reason}`);
    }
  }

  // Remove duplicates by URL
  const uniqueArticles = new Map<string, NormalizedNewsDataItem>();
  for (const article of allArticles) {
    if (!uniqueArticles.has(article.url)) {
      uniqueArticles.set(article.url, article);
    }
  }

  return Array.from(uniqueArticles.values());
}

