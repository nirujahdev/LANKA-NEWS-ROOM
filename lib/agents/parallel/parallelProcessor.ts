/**
 * Parallel Processor - Main orchestrator for parallel cluster processing
 */

import { supabaseAdmin } from '../../supabaseAdmin';
import { processCluster, ClusterProcessingResult } from './clusterWorker';
import { TaskQueue, Task } from './taskQueue';
import { WorkerPool, WorkerConfig } from './workerPool';

export interface ParallelProcessingStats {
  clustersProcessed: number;
  successful: number;
  failed: number;
  summariesGenerated: number;
  translationsGenerated: number;
  seoGenerated: number;
  imagesSelected: number;
  categoriesAssigned: number;
  totalDuration: number;
  errors: Array<{ clusterId: string; stage: string; message: string }>;
}

/**
 * Process clusters in parallel
 * 
 * @param clusterIds - Array of cluster IDs to process
 * @param maxConcurrency - Maximum number of clusters to process simultaneously
 * @returns Processing statistics
 */
export async function processClustersParallel(
  clusterIds: string[],
  maxConcurrency: number = 5
): Promise<ParallelProcessingStats> {
  const startTime = Date.now();
  const stats: ParallelProcessingStats = {
    clustersProcessed: 0,
    successful: 0,
    failed: 0,
    summariesGenerated: 0,
    translationsGenerated: 0,
    seoGenerated: 0,
    imagesSelected: 0,
    categoriesAssigned: 0,
    totalDuration: 0,
    errors: [],
  };
  
  console.log(`[Parallel Processor] Processing ${clusterIds.length} clusters with ${maxConcurrency} workers...`);
  
  // Process clusters in batches
  const batches: string[][] = [];
  for (let i = 0; i < clusterIds.length; i += maxConcurrency) {
    batches.push(clusterIds.slice(i, i + maxConcurrency));
  }
  
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(clusterId => processCluster(clusterId))
    );
    
    batchResults.forEach((result, index) => {
      const clusterId = batch[index];
      stats.clustersProcessed++;
      
      if (result.status === 'fulfilled') {
        const clusterResult = result.value;
        
        if (clusterResult.success) {
          stats.successful++;
          
          if (clusterResult.summary) stats.summariesGenerated++;
          if (clusterResult.translations) stats.translationsGenerated++;
          if (clusterResult.seo) stats.seoGenerated++;
          if (clusterResult.image?.imageUrl) stats.imagesSelected++;
          if (clusterResult.category) stats.categoriesAssigned++;
          
          // Save results to database
          saveClusterResults(clusterId, clusterResult).catch(err => {
            console.error(`[Parallel Processor] Failed to save results for cluster ${clusterId}:`, err);
            stats.errors.push({
              clusterId,
              stage: 'save',
              message: err instanceof Error ? err.message : 'Unknown error',
            });
          });
        } else {
          stats.failed++;
          stats.errors.push(...clusterResult.errors.map(e => ({
            clusterId,
            stage: e.stage,
            message: e.message,
          })));
        }
      } else {
        stats.failed++;
        stats.errors.push({
          clusterId,
          stage: 'processing',
          message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });
    
    console.log(`[Parallel Processor] Batch progress: ${stats.successful}/${stats.clustersProcessed} successful`);
  }
  
  stats.totalDuration = Date.now() - startTime;
  
  console.log(`[Parallel Processor] ✅ Completed: ${stats.successful}/${stats.clustersProcessed} clusters in ${stats.totalDuration}ms`);
  
  return stats;
}

/**
 * Save cluster processing results to database
 */
async function saveClusterResults(
  clusterId: string,
  result: ClusterProcessingResult
): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  
  // Update translations
  if (result.translations) {
    updates.headline_si = result.translations.headlineSi;
    updates.headline_ta = result.translations.headlineTa;
    updates.headline_translation_quality_si = result.translations.qualityScores.headlineSi;
    updates.headline_translation_quality_ta = result.translations.qualityScores.headlineTa;
  }
  
  // Update SEO
  if (result.seo) {
    updates.meta_title_en = result.seo.seoEn.title;
    updates.meta_description_en = result.seo.seoEn.description;
    updates.meta_title_si = result.seo.seoSi.title;
    updates.meta_description_si = result.seo.seoSi.description;
    updates.meta_title_ta = result.seo.seoTa.title;
    updates.meta_description_ta = result.seo.seoTa.description;
    updates.primary_topic = result.seo.topics.find(t => t !== 'sri-lanka' && t !== 'world') || 'politics';
    updates.topic = updates.primary_topic;
    updates.topics = result.seo.topics;
    updates.district = result.seo.district;
    updates.primary_entity = result.seo.entities.primary_entity;
    updates.event_type = result.seo.entities.event_type;
    updates.keywords = result.seo.keywords;
  }
  
  // Update image
  if (result.image) {
    updates.image_url = result.image.imageUrl;
    updates.image_relevance_score = result.image.relevanceScore;
    updates.image_quality_score = result.image.qualityScore;
  }
  
  // Update category
  if (result.category) {
    updates.category = result.category.category;
    updates.primary_topic = result.category.category;
    updates.topic = result.category.category;
  }
  
  // Update cluster
  await supabaseAdmin
    .from('clusters')
    .update(updates)
    .eq('id', clusterId);
  
  // Update summary
  if (result.summary) {
    const { data: existingSummary } = await supabaseAdmin
      .from('summaries')
      .select('id')
      .eq('cluster_id', clusterId)
      .maybeSingle();
    
    if (existingSummary) {
      await supabaseAdmin
        .from('summaries')
        .update({
          summary_en: result.summary.summary,
          summary_quality_score_en: result.summary.qualityScore,
          summary_length_en: result.summary.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSummary.id);
    } else {
      await supabaseAdmin
        .from('summaries')
        .insert({
          cluster_id: clusterId,
          summary_en: result.summary.summary,
          summary_quality_score_en: result.summary.qualityScore,
          summary_length_en: result.summary.length,
        });
    }
  }
  
  // Update summary translations
  if (result.translations) {
    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('id')
      .eq('cluster_id', clusterId)
      .maybeSingle();
    
    if (summary) {
      await supabaseAdmin
        .from('summaries')
        .update({
          summary_si: result.translations.summarySi,
          summary_ta: result.translations.summaryTa,
          summary_quality_score_si: result.translations.qualityScores.summarySi,
          summary_quality_score_ta: result.translations.qualityScores.summaryTa,
          updated_at: new Date().toISOString(),
        })
        .eq('id', summary.id);
    }
  }
  
  // Update summary SEO fields
  if (result.seo) {
    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('id')
      .eq('cluster_id', clusterId)
      .maybeSingle();
    
    if (summary) {
      await supabaseAdmin
        .from('summaries')
        .update({
          key_facts_en: result.seo.keyFacts.en,
          key_facts_si: result.seo.keyFacts.si,
          key_facts_ta: result.seo.keyFacts.ta,
          confirmed_vs_differs_en: result.seo.confirmedVsDiffers.en,
          confirmed_vs_differs_si: result.seo.confirmedVsDiffers.si,
          confirmed_vs_differs_ta: result.seo.confirmedVsDiffers.ta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', summary.id);
    }
  }
}

