/**
 * Batch Processor with Transaction Support
 * Handles batch processing of articles, clusters, and summaries with transactional safety
 */

import { batchInsertArticles, batchUpdateClusters, batchUpdateSummaries } from './transactionManager';
import { supabaseAdmin } from '../../supabaseAdmin';
import { NormalizedItem } from '../../rss';

export interface ArticleInsert {
  source_id: string;
  title: string;
  url: string;
  content_excerpt?: string;
  content_text?: string;
  content_html?: string;
  image_url?: string;
  image_urls?: string[];
  published_at?: string;
  language?: string;
}

export interface ClusterUpdate {
  clusterId: string;
  updates: Record<string, any>;
}

export interface SummaryUpdate {
  clusterId: string;
  summaryId?: string;
  updates: Record<string, any>;
}

/**
 * Process and insert articles in batches with deduplication
 */
export async function processArticleBatch(
  articles: Array<{
    sourceId: string;
    item: NormalizedItem;
    language?: string;
  }>,
  batchSize: number = 100
): Promise<{
  inserted: number;
  skipped: number;
  errors: number;
  articleIds: string[];
}> {
  const articleInserts: ArticleInsert[] = articles.map(({ sourceId, item, language }) => ({
    source_id: sourceId,
    title: item.title,
    url: item.url,
    content_excerpt: item.description || item.content?.substring(0, 500) || null,
    content_text: item.content || null,
    content_html: item.contentHtml || null,
    image_url: item.imageUrl || null,
    image_urls: item.imageUrls || null,
    published_at: item.publishedAt || null,
    language: language || 'en',
  }));
  
  const stats = await batchInsertArticles(articleInserts, batchSize);
  
  // Get inserted article IDs
  const urls = articleInserts.map(a => a.url);
  const { data: insertedArticles } = await supabaseAdmin
    .from('articles')
    .select('id, url')
    .in('url', urls);
  
  const articleIds = (insertedArticles || []).map(a => a.id);
  
  return {
    ...stats,
    articleIds,
  };
}

/**
 * Process cluster updates in batches
 */
export async function processClusterBatch(
  updates: ClusterUpdate[],
  batchSize: number = 50
): Promise<{
  updated: number;
  errors: number;
}> {
  return await batchUpdateClusters(updates, batchSize);
}

/**
 * Process summary updates in batches
 */
export async function processSummaryBatch(
  updates: SummaryUpdate[],
  batchSize: number = 50
): Promise<{
  updated: number;
  created: number;
  errors: number;
}> {
  return await batchUpdateSummaries(updates, batchSize);
}

/**
 * Complete batch processing pipeline
 * 1. Insert articles
 * 2. Cluster articles
 * 3. Update clusters
 * 4. Update summaries
 */
export async function processCompleteBatch(
  articles: Array<{
    sourceId: string;
    item: NormalizedItem;
    language?: string;
  }>,
  clusterUpdates: ClusterUpdate[],
  summaryUpdates: SummaryUpdate[],
  options: {
    articleBatchSize?: number;
    clusterBatchSize?: number;
    summaryBatchSize?: number;
  } = {}
): Promise<{
  articles: { inserted: number; skipped: number; errors: number; articleIds: string[] };
  clusters: { updated: number; errors: number };
  summaries: { updated: number; created: number; errors: number };
}> {
  console.log(`[BatchProcessor] Processing batch: ${articles.length} articles, ${clusterUpdates.length} clusters, ${summaryUpdates.length} summaries`);
  
  // Process articles
  const articleStats = await processArticleBatch(
    articles,
    options.articleBatchSize || 100
  );
  
  // Process clusters
  const clusterStats = await processClusterBatch(
    clusterUpdates,
    options.clusterBatchSize || 50
  );
  
  // Process summaries
  const summaryStats = await processSummaryBatch(
    summaryUpdates,
    options.summaryBatchSize || 50
  );
  
  console.log(`[BatchProcessor] ✅ Batch complete: ${articleStats.inserted} articles, ${clusterStats.updated} clusters, ${summaryStats.updated + summaryStats.created} summaries`);
  
  return {
    articles: articleStats,
    clusters: clusterStats,
    summaries: summaryStats,
  };
}

