import { env } from './env';

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis or similar distributed cache
 */
class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Max entries to prevent memory issues

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds (default from env)
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    const ttl = ttlSeconds ?? env.CACHE_TTL_SECONDS;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl * 1000)
    });
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Delete all cache entries matching a pattern
   * @param pattern - String pattern to match (simple includes check)
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}

// Export singleton instance
export const cache = new SimpleCache();

/**
 * Filter options for search
 */
export interface SearchFilterOptions {
  topic?: string[];
  dateFrom?: string;
  dateTo?: string;
  district?: string;
  eventType?: string;
}

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  clusters: (lang: string, feed: string | null, category: string | null) => 
    `clusters:${lang}:${feed || 'all'}:${category || 'all'}`,
  
  clusterDetail: (slug: string, lang: string) => 
    `cluster:${slug}:${lang}`,
  
  search: (query: string, lang: string, limit: number, filters?: SearchFilterOptions) => {
    const filterStr = filters ? JSON.stringify(filters) : 'none';
    return `search:${lang}:${query}:${limit}:${filterStr}`;
  },
  
  searchFilters: () => 'search:filters',
  
  userFeedback: (clusterId: string, userId: string | null) => 
    `feedback:${clusterId}:${userId || 'anon'}`
};

// For production with Redis, use this interface:
// import Redis from 'ioredis';
// const redis = new Redis(process.env.REDIS_URL);
// 
// export const cache = {
//   async get<T>(key: string): Promise<T | null> {
//     const data = await redis.get(key);
//     return data ? JSON.parse(data) : null;
//   },
//   
//   async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
//     const ttl = ttlSeconds ?? env.CACHE_TTL_SECONDS;
//     await redis.setex(key, ttl, JSON.stringify(data));
//   },
//   
//   async delete(key: string): Promise<void> {
//     await redis.del(key);
//   },
//   
//   async clear(): Promise<void> {
//     await redis.flushdb();
//   },
//   
//   async deletePattern(pattern: string): Promise<number> {
//     const keys = await redis.keys(`*${pattern}*`);
//     if (keys.length > 0) {
//       return await redis.del(...keys);
//     }
//     return 0;
//   }
// };

