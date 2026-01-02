/**
 * Sri Lankan News Fetcher
 * Parallel RSS fetching for Sri Lankan news sources (English, Tamil, Sinhala)
 */

import { supabaseAdmin } from '../../supabaseAdmin';
import { fetchRSSFeedsByLanguage, SourceConfig, RSSFetchResult } from './rssWorkerPool';
import { NormalizedItem } from '../../rss';

export interface FetchStats {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalArticles: number;
  byLanguage: {
    en: { sources: number; articles: number };
    si: { sources: number; articles: number };
    ta: { sources: number; articles: number };
  };
  duration: number;
  errors: Array<{ sourceId: string; sourceName: string; error: string }>;
}

/**
 * Load active sources from database
 */
async function loadActiveSources(): Promise<SourceConfig[]> {
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('id, name, feed_url, base_domain, language, priority')
    .eq('active', true)
    .eq('enabled', true)
    .eq('type', 'rss')
    .order('priority', { ascending: true, nullsLast: true });
  
  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }
  
  return (data || []).map(source => ({
    id: source.id,
    name: source.name,
    feed_url: source.feed_url,
    base_domain: source.base_domain,
    language: (source.language || 'en') as 'en' | 'si' | 'ta',
    priority: source.priority || 100,
  }));
}

/**
 * Fetch all Sri Lankan news sources in parallel
 * 
 * @param concurrencyPerLanguage - Number of parallel workers per language (default: 10)
 * @returns Fetch results and statistics
 */
export async function fetchAllSriLankanNews(
  concurrencyPerLanguage: number = 10
): Promise<{
  results: RSSFetchResult[];
  stats: FetchStats;
}> {
  const startTime = Date.now();
  
  console.log('[Sri Lankan News Fetcher] Loading active sources...');
  const sources = await loadActiveSources();
  
  if (sources.length === 0) {
    console.warn('[Sri Lankan News Fetcher] No active sources found');
    return {
      results: [],
      stats: {
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalArticles: 0,
        byLanguage: {
          en: { sources: 0, articles: 0 },
          si: { sources: 0, articles: 0 },
          ta: { sources: 0, articles: 0 },
        },
        duration: Date.now() - startTime,
        errors: [],
      },
    };
  }
  
  console.log(`[Sri Lankan News Fetcher] Found ${sources.length} active sources`);
  console.log(`[Sri Lankan News Fetcher] Starting parallel fetch with ${concurrencyPerLanguage} workers per language...`);
  
  // Fetch all sources in parallel
  const { results, stats: fetchStats } = await fetchRSSFeedsByLanguage(
    sources,
    concurrencyPerLanguage
  );
  
  // Build comprehensive stats
  const stats: FetchStats = {
    totalSources: fetchStats.total,
    successfulSources: fetchStats.successful,
    failedSources: fetchStats.failed,
    totalArticles: results.reduce((sum, r) => sum + r.items.length, 0),
    byLanguage: {
      en: {
        sources: fetchStats.byLanguage.en?.total || 0,
        articles: fetchStats.byLanguage.en?.items || 0,
      },
      si: {
        sources: fetchStats.byLanguage.si?.total || 0,
        articles: fetchStats.byLanguage.si?.items || 0,
      },
      ta: {
        sources: fetchStats.byLanguage.ta?.total || 0,
        articles: fetchStats.byLanguage.ta?.items || 0,
      },
    },
    duration: Date.now() - startTime,
    errors: results
      .filter(r => !r.success)
      .map(r => ({
        sourceId: r.sourceId,
        sourceName: r.sourceName,
        error: r.error || 'Unknown error',
      })),
  };
  
  console.log(`[Sri Lankan News Fetcher] ✅ Completed in ${stats.duration}ms`);
  console.log(`[Sri Lankan News Fetcher] Stats: ${stats.successfulSources}/${stats.totalSources} sources, ${stats.totalArticles} articles`);
  console.log(`[Sri Lankan News Fetcher] By language: EN(${stats.byLanguage.en.articles}), SI(${stats.byLanguage.si.articles}), TA(${stats.byLanguage.ta.articles})`);
  
  return { results, stats };
}

/**
 * Get articles grouped by source
 */
export function groupArticlesBySource(
  results: RSSFetchResult[]
): Array<{
  sourceId: string;
  sourceName: string;
  language: 'en' | 'si' | 'ta';
  items: NormalizedItem[];
}> {
  return results
    .filter(r => r.success && r.items.length > 0)
    .map(r => ({
      sourceId: r.sourceId,
      sourceName: r.sourceName,
      language: r.language,
      items: r.items,
    }));
}

