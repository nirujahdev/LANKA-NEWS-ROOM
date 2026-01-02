/**
 * Parallel AI News Agent Pipeline
 * Implements parallel multitasking architecture for news processing
 */

import { fetchAllSriLankanNews, groupArticlesBySource } from './agents/fetch/sriLankanNewsFetcher';
import { processClustersParallel } from './agents/parallel/parallelProcessor';
import { processCompleteBatch } from './agents/parallel/batchProcessor';
import { MetricsCollector } from './agents/parallel/metrics';
import { ProgressTracker } from './agents/parallel/progressTracker';
import { supabaseAdmin } from './supabaseAdmin';
import { clusterArticles } from './clustering';
import { env } from './env';

export interface PipelineStats {
  fetch: {
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
  };
  insert: {
    inserted: number;
    skipped: number;
    errors: number;
  };
  processing: {
    clustersProcessed: number;
    successful: number;
    failed: number;
    summariesGenerated: number;
    translationsGenerated: number;
    seoGenerated: number;
    imagesSelected: number;
    categoriesAssigned: number;
    duration: number;
  };
  totalDuration: number;
  errors: Array<{ stage: string; message: string }>;
}

/**
 * Run the parallel AI News Agent Pipeline
 */
export async function runParallelAiNewsAgentPipeline(): Promise<PipelineStats> {
  const startTime = Date.now();
  const metrics = new MetricsCollector();
  const progress = new ProgressTracker();
  
  console.log('🚀 Starting Parallel AI News Agent Pipeline');
  console.log('═'.repeat(60));
  
  const stats: PipelineStats = {
    fetch: {
      totalSources: 0,
      successfulSources: 0,
      failedSources: 0,
      totalArticles: 0,
      byLanguage: {
        en: { sources: 0, articles: 0 },
        si: { sources: 0, articles: 0 },
        ta: { sources: 0, articles: 0 },
      },
      duration: 0,
    },
    insert: {
      inserted: 0,
      skipped: 0,
      errors: 0,
    },
    processing: {
      clustersProcessed: 0,
      successful: 0,
      failed: 0,
      summariesGenerated: 0,
      translationsGenerated: 0,
      seoGenerated: 0,
      imagesSelected: 0,
      categoriesAssigned: 0,
      duration: 0,
    },
    totalDuration: 0,
    errors: [],
  };
  
  try {
    // Stage 1: Parallel RSS Fetch
    console.log('\n📥 Stage 1: Parallel RSS Fetch');
    const fetchStartTime = Date.now();
    
    const concurrencyPerLanguage = parseInt(process.env.PARALLEL_FETCH_WORKERS || '10', 10);
    const { results: fetchResults, stats: fetchStats } = await fetchAllSriLankanNews(concurrencyPerLanguage);
    
    stats.fetch = {
      ...fetchStats,
      duration: Date.now() - fetchStartTime,
    };
    
    metrics.recordFetch(stats.fetch);
    progress.emit('fetch', fetchStats.successfulSources, fetchStats.totalSources, `${fetchStats.totalArticles} articles`);
    
    if (fetchStats.totalArticles === 0) {
      console.log('⚠️  No articles fetched, skipping remaining stages');
      stats.totalDuration = Date.now() - startTime;
      return stats;
    }
    
    // Stage 2: Batch Insert Articles
    console.log('\n💾 Stage 2: Batch Insert Articles');
    const insertStartTime = Date.now();
    
    const articlesBySource = groupArticlesBySource(fetchResults);
    const articlesToInsert = articlesBySource.flatMap(({ sourceId, items, language }) =>
      items.map(item => ({
        sourceId,
        item,
        language: language as 'en' | 'si' | 'ta' | undefined,
      }))
    );
    
    const insertStats = await processCompleteBatch(
      articlesToInsert,
      [], // No cluster updates yet
      [], // No summary updates yet
      {
        articleBatchSize: parseInt(process.env.TRANSACTION_BATCH_SIZE || '100', 10),
      }
    );
    
    stats.insert = insertStats.articles;
    progress.emit('insert', insertStats.articles.inserted, articlesToInsert.length, `${insertStats.articles.inserted} inserted`);
    
    if (insertStats.articles.inserted === 0) {
      console.log('⚠️  No new articles inserted, skipping clustering');
      stats.totalDuration = Date.now() - startTime;
      return stats;
    }
    
    // Stage 3: Cluster Articles
    console.log('\n🔗 Stage 3: Cluster Articles');
    const clusterStartTime = Date.now();
    
    // Get newly inserted articles for clustering
    const { data: newArticles } = await supabaseAdmin
      .from('articles')
      .select('id, title, url, content_excerpt, published_at, source_id')
      .in('url', articlesToInsert.map(a => a.item.url))
      .order('published_at', { ascending: false });
    
    if (!newArticles || newArticles.length === 0) {
      console.log('⚠️  No articles found for clustering');
      stats.totalDuration = Date.now() - startTime;
      return stats;
    }
    
    const clusters = await clusterArticles(newArticles);
    console.log(`✅ Created ${clusters.length} clusters from ${newArticles.length} articles`);
    
    // Stage 4: Parallel Cluster Processing
    console.log('\n⚙️  Stage 4: Parallel Cluster Processing');
    const processStartTime = Date.now();
    
    const clusterIds = clusters.map(c => c.id);
    const maxConcurrency = parseInt(process.env.PARALLEL_CLUSTER_WORKERS || '5', 10);
    
    const processingStats = await processClustersParallel(clusterIds, maxConcurrency);
    
    stats.processing = {
      ...processingStats,
      duration: Date.now() - processStartTime,
    };
    
    metrics.recordProcessing(stats.processing);
    progress.emit('process', processingStats.successful, processingStats.clustersProcessed, `${processingStats.summariesGenerated} summaries`);
    
    // Record errors
    processingStats.errors.forEach(err => {
      metrics.recordError(err.stage, err.message, err.clusterId);
      stats.errors.push(err);
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Pipeline error:', errorMessage);
    stats.errors.push({
      stage: 'pipeline',
      message: errorMessage,
    });
    metrics.recordError('pipeline', errorMessage);
  }
  
  stats.totalDuration = Date.now() - startTime;
  
  // Finalize and print metrics
  metrics.finalize();
  metrics.printSummary();
  
  console.log('\n✅ Parallel AI News Agent Pipeline completed');
  console.log(`⏱️  Total duration: ${(stats.totalDuration / 1000).toFixed(2)}s`);
  
  return stats;
}

