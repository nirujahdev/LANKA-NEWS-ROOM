/**
 * RSS Worker Pool for Parallel Fetching
 * Manages parallel RSS feed fetching with worker pools per language
 */

import { fetchRssFeed, NormalizedItem } from '../../rss';
import { withRetry } from '../../retry';

export interface RSSFetchResult {
  sourceId: string;
  sourceName: string;
  language: 'en' | 'si' | 'ta';
  items: NormalizedItem[];
  success: boolean;
  error?: string;
  duration: number;
}

export interface SourceConfig {
  id: string;
  name: string;
  feed_url: string;
  base_domain: string;
  language: 'en' | 'si' | 'ta';
  priority?: number;
}

/**
 * Fetch RSS feed with error handling
 */
async function fetchRSSWithErrorHandling(
  source: SourceConfig
): Promise<RSSFetchResult> {
  const startTime = Date.now();
  
  try {
    const items = await withRetry(
      () => fetchRssFeed(source.feed_url),
      { maxAttempts: 3, delayMs: 2000 }
    );
    
    return {
      sourceId: source.id,
      sourceName: source.name,
      language: source.language,
      items,
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      sourceId: source.id,
      sourceName: source.name,
      language: source.language,
      items: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Worker function for parallel RSS fetching
 */
async function rssWorker(
  queue: SourceConfig[],
  results: RSSFetchResult[],
  concurrency: number
): Promise<void> {
  while (queue.length > 0) {
    const source = queue.shift();
    if (!source) break;
    
    const result = await fetchRSSWithErrorHandling(source);
    results.push(result);
    
    if (result.success) {
      console.log(`[RSS Worker] ✅ ${source.name} (${source.language}): ${result.items.length} items (${result.duration}ms)`);
    } else {
      console.warn(`[RSS Worker] ❌ ${source.name} (${source.language}): ${result.error}`);
    }
  }
}

/**
 * Fetch RSS feeds in parallel using worker pools
 * 
 * @param sources - Array of source configurations
 * @param concurrency - Number of parallel workers per language (default: 10)
 * @returns Array of fetch results
 */
export async function fetchRSSFeedsParallel(
  sources: SourceConfig[],
  concurrency: number = 10
): Promise<RSSFetchResult[]> {
  const results: RSSFetchResult[] = [];
  
  // Group sources by language
  const sourcesByLanguage: Record<'en' | 'si' | 'ta', SourceConfig[]> = {
    en: [],
    si: [],
    ta: [],
  };
  
  sources.forEach(source => {
    if (source.language in sourcesByLanguage) {
      sourcesByLanguage[source.language].push(source);
    }
  });
  
  // Sort by priority (lower = higher priority)
  Object.keys(sourcesByLanguage).forEach(lang => {
    sourcesByLanguage[lang as 'en' | 'si' | 'ta'].sort((a, b) => {
      const priorityA = a.priority || 100;
      const priorityB = b.priority || 100;
      return priorityA - priorityB;
    });
  });
  
  // Create worker pools for each language
  const workerPromises: Promise<void>[] = [];
  
  for (const [language, langSources] of Object.entries(sourcesByLanguage)) {
    if (langSources.length === 0) continue;
    
    const queue = [...langSources];
    const workers: Promise<void>[] = [];
    
    // Create worker pool for this language
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      workers.push(rssWorker(queue, results, concurrency));
    }
    
    workerPromises.push(...workers);
    console.log(`[RSS Worker Pool] Started ${workers.length} workers for ${language} (${langSources.length} sources)`);
  }
  
  // Wait for all workers to complete
  await Promise.all(workerPromises);
  
  const successful = results.filter(r => r.success).length;
  const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
  
  console.log(`[RSS Worker Pool] ✅ Completed: ${successful}/${results.length} sources, ${totalItems} total items`);
  
  return results;
}

/**
 * Fetch RSS feeds with language-based worker pools
 * Each language gets its own worker pool for better resource management
 */
export async function fetchRSSFeedsByLanguage(
  sources: SourceConfig[],
  concurrencyPerLanguage: number = 10
): Promise<{
  results: RSSFetchResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    byLanguage: Record<string, { total: number; successful: number; items: number }>;
  };
}> {
  const results = await fetchRSSFeedsParallel(sources, concurrencyPerLanguage);
  
  const stats = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    byLanguage: {} as Record<string, { total: number; successful: number; items: number }>,
  };
  
  // Calculate stats by language
  results.forEach(result => {
    if (!stats.byLanguage[result.language]) {
      stats.byLanguage[result.language] = { total: 0, successful: 0, items: 0 };
    }
    stats.byLanguage[result.language].total++;
    if (result.success) {
      stats.byLanguage[result.language].successful++;
      stats.byLanguage[result.language].items += result.items.length;
    }
  });
  
  return { results, stats };
}

