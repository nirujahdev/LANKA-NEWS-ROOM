/**
 * NewsAPI.org Integration
 * Documentation: https://newsapi.org/docs
 */

import { withRetry } from './retry';

export type NewsAPIArticle = {
  title: string;
  url: string;
  publishedAt: string;
  content: string | null;
  description: string | null;
  urlToImage: string | null;
  source: {
    name: string;
    id?: string;
  };
  author: string | null;
};

export type NewsAPIResponse = {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
};

export type NormalizedNewsAPIItem = {
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
 * Fetch news from NewsAPI.org
 * @param options - Query options
 * @returns Normalized article items
 */
export async function fetchNewsAPI(
  options: {
    country?: string; // ISO 3166-1 alpha-2 code (e.g., 'lk' for Sri Lanka)
    category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
    query?: string; // Search query
    pageSize?: number; // Max 100
    page?: number;
    apiKey: string;
  }
): Promise<NormalizedNewsAPIItem[]> {
  const { country = 'lk', category, query, pageSize = 100, page = 1, apiKey } = options;

  return withRetry(
    async () => {
      let url: string;
      
      if (query) {
        // Use everything endpoint for search
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}&sortBy=publishedAt&apiKey=${apiKey}`;
      } else {
        // Use top headlines endpoint
        url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${pageSize}&page=${page}&apiKey=${apiKey}`;
        if (category) {
          url += `&category=${category}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsAPI error ${response.status}: ${errorText}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned status: ${data.status}`);
      }

      return data.articles.map((article): NormalizedNewsAPIItem => {
        const imageUrls = article.urlToImage ? [article.urlToImage] : [];
        
        return {
          title: article.title || 'Untitled',
          url: article.url,
          publishedAt: article.publishedAt || null,
          content: article.content || article.description || null,
          contentSnippet: article.description || article.content?.substring(0, 200) || null,
          imageUrl: article.urlToImage || null,
          imageUrls: imageUrls.length > 0 ? imageUrls : null,
          guid: article.url // Use URL as GUID since NewsAPI doesn't provide one
        };
      });
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`[NewsAPI] Retry ${attempt}/3: ${error.message}`);
      }
    }
  );
}

/**
 * Fetch Sri Lanka news from multiple categories
 */
export async function fetchSriLankaNews(apiKey: string): Promise<NormalizedNewsAPIItem[]> {
  const categories: Array<'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology'> = [
    'general', 'business', 'health', 'sports', 'technology'
  ];

  const allArticles: NormalizedNewsAPIItem[] = [];
  
  // Fetch from all categories in parallel
  const results = await Promise.allSettled(
    categories.map(category =>
      fetchNewsAPI({
        country: 'lk',
        category,
        pageSize: 20, // Limit per category to avoid rate limits
        apiKey
      })
    )
  );

  // Combine results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.warn(`[NewsAPI] Failed to fetch category: ${result.reason}`);
    }
  }

  // Remove duplicates by URL
  const uniqueArticles = new Map<string, NormalizedNewsAPIItem>();
  for (const article of allArticles) {
    if (!uniqueArticles.has(article.url)) {
      uniqueArticles.set(article.url, article);
    }
  }

  return Array.from(uniqueArticles.values());
}

