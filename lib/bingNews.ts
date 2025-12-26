/**
 * Bing News Search API Integration
 * Documentation: https://learn.microsoft.com/en-us/bing/search-apis/bing-news-search/
 * 
 * Note: Bing News Search API requires Azure subscription
 * Alternative: Use Bing Web Search API or Bing Custom Search
 */

import { withRetry } from './retry';

export type BingNewsArticle = {
  name: string;
  url: string;
  datePublished: string;
  description: string | null;
  image?: {
    thumbnail?: {
      contentUrl?: string;
      width?: number;
      height?: number;
    };
  };
  provider: Array<{
    name: string;
  }>;
  category?: string;
};

export type BingNewsResponse = {
  _type: string;
  readLink: string;
  queryContext: {
    originalQuery: string;
  };
  totalEstimatedMatches: number;
  value: BingNewsArticle[];
};

export type NormalizedBingNewsItem = {
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
 * Fetch news from Bing News Search API
 * @param options - Query options
 * @returns Normalized article items
 */
export async function fetchBingNews(
  options: {
    query: string; // Search query (e.g., "Sri Lanka news")
    count?: number; // Number of results (max 100)
    offset?: number; // Pagination offset
    freshness?: 'Day' | 'Week' | 'Month'; // Time filter
    market?: string; // Market code (e.g., 'en-US', 'en-LK')
    sortBy?: 'Date' | 'Relevance'; // Sort order
    subscriptionKey: string; // Azure subscription key
    endpoint?: string; // Custom endpoint (optional)
  }
): Promise<NormalizedBingNewsItem[]> {
  const {
    query,
    count = 50,
    offset = 0,
    freshness,
    market = 'en-US',
    sortBy = 'Date',
    subscriptionKey,
    endpoint = 'https://api.bing.microsoft.com/v7.0/news/search'
  } = options;

  return withRetry(
    async () => {
      let url = `${endpoint}?q=${encodeURIComponent(query)}&count=${count}&offset=${offset}&sortBy=${sortBy}&mkt=${market}`;
      
      if (freshness) {
        url += `&freshness=${freshness}`;
      }

      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bing News API error ${response.status}: ${errorText}`);
      }

      const data: BingNewsResponse = await response.json();

      if (!data.value || !Array.isArray(data.value)) {
        throw new Error('Bing News API returned invalid response format');
      }

      return data.value.map((article): NormalizedBingNewsItem => {
        const imageUrls: string[] = [];
        if (article.image?.thumbnail?.contentUrl) {
          imageUrls.push(article.image.thumbnail.contentUrl);
        }
        
        return {
          title: article.name || 'Untitled',
          url: article.url,
          publishedAt: article.datePublished || null,
          content: article.description || null,
          contentSnippet: article.description || null,
          imageUrl: article.image?.thumbnail?.contentUrl || null,
          imageUrls: imageUrls.length > 0 ? imageUrls : null,
          guid: article.url // Use URL as GUID
        };
      });
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`[Bing News] Retry ${attempt}/3: ${error.message}`);
      }
    }
  );
}

/**
 * Fetch Sri Lanka news using Bing News Search
 */
export async function fetchSriLankaBingNews(subscriptionKey: string): Promise<NormalizedBingNewsItem[]> {
  const queries = [
    'Sri Lanka news',
    'Sri Lanka politics',
    'Sri Lanka economy',
    'Sri Lanka sports',
    'Sri Lanka technology'
  ];

  const allArticles: NormalizedBingNewsItem[] = [];
  
  // Fetch from all queries in parallel
  const results = await Promise.allSettled(
    queries.map(query =>
      fetchBingNews({
        query,
        count: 20, // Limit per query to avoid rate limits
        freshness: 'Day', // Get today's news
        market: 'en-US',
        sortBy: 'Date',
        subscriptionKey
      })
    )
  );

  // Combine results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.warn(`[Bing News] Failed to fetch query: ${result.reason}`);
    }
  }

  // Remove duplicates by URL
  const uniqueArticles = new Map<string, NormalizedBingNewsItem>();
  for (const article of allArticles) {
    if (!uniqueArticles.has(article.url)) {
      uniqueArticles.set(article.url, article);
    }
  }

  return Array.from(uniqueArticles.values());
}

/**
 * Alternative: Bing Custom Search API (if you have a custom search instance)
 * This allows more control over sources and results
 */
export async function fetchBingCustomSearch(
  options: {
    query: string;
    customConfig: string; // Custom search configuration ID
    count?: number;
    subscriptionKey: string;
  }
): Promise<NormalizedBingNewsItem[]> {
  const { query, customConfig, count = 50, subscriptionKey } = options;

  return withRetry(
    async () => {
      const url = `https://api.bing.microsoft.com/v7.0/custom/search?q=${encodeURIComponent(query)}&customconfig=${customConfig}&count=${count}`;

      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bing Custom Search API error ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();

      if (!data.webPages?.value || !Array.isArray(data.webPages.value)) {
        return []; // No results
      }

      return data.webPages.value.map((item: any): NormalizedBingNewsItem => {
        return {
          title: item.name || 'Untitled',
          url: item.url,
          publishedAt: item.datePublished || null,
          content: item.snippet || null,
          contentSnippet: item.snippet || null,
          imageUrl: null, // Custom search doesn't always include images
          imageUrls: null,
          guid: item.url
        };
      });
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`[Bing Custom Search] Retry ${attempt}/3: ${error.message}`);
      }
    }
  );
}

