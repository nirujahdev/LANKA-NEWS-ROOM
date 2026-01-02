/**
 * Cluster Worker - Processes a single cluster with all tasks in parallel
 */

import { Task, TaskType } from './taskQueue';
import {
  orchestrateSummaryGeneration,
  orchestrateTranslation,
  orchestrateSEOGeneration,
  orchestrateImageSelection,
  orchestrateCategorization,
} from '../orchestrator';
import { supabaseAdmin } from '../../supabaseAdmin';

export interface ClusterData {
  id: string;
  headline: string;
  headline_en?: string;
  articles: Array<{
    id: string;
    title: string;
    content_excerpt?: string;
    content_text?: string;
    image_url?: string;
    image_urls?: string[];
    url: string;
    content_html?: string;
    published_at?: string;
  }>;
  summary?: {
    id?: string;
    summary_en?: string;
    summary_quality_score_en?: number;
  };
}

export interface ClusterProcessingResult {
  clusterId: string;
  success: boolean;
  summary?: { summary: string; qualityScore: number; length: number };
  translations?: {
    headlineSi: string | null;
    headlineTa: string | null;
    summarySi: string;
    summaryTa: string;
    qualityScores: {
      headlineSi: number | null;
      headlineTa: number | null;
      summarySi: number;
      summaryTa: number;
    };
  };
  seo?: {
    seoEn: { title: string; description: string };
    seoSi: { title: string; description: string };
    seoTa: { title: string; description: string };
    topics: string[];
    district?: string | null;
    entities: { primary_entity?: string | null; event_type?: string | null };
    keywords: string[];
    keyFacts: { en: string[]; si: string[]; ta: string[] };
    confirmedVsDiffers: { en: string; si: string; ta: string };
  };
  image?: {
    imageUrl: string | null;
    relevanceScore: number | null;
    qualityScore: number | null;
  };
  category?: {
    category: string;
  };
  errors: Array<{ stage: string; message: string }>;
  duration: number;
}

/**
 * Load cluster data from database
 */
async function loadClusterData(clusterId: string): Promise<ClusterData | null> {
  const { data: cluster, error: clusterError } = await supabaseAdmin
    .from('clusters')
    .select('id, headline, headline_en, headline_si, headline_ta, primary_topic, district, image_url, topics')
    .eq('id', clusterId)
    .single();
  
  if (clusterError || !cluster) {
    return null;
  }
  
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('id, title, content_excerpt, content_text, image_url, image_urls, url, content_html, published_at')
    .eq('cluster_id', clusterId)
    .order('published_at', { ascending: false });
  
  const { data: summary } = await supabaseAdmin
    .from('summaries')
    .select('id, summary_en, summary_quality_score_en')
    .eq('cluster_id', clusterId)
    .maybeSingle();
  
  return {
    id: cluster.id,
    headline: cluster.headline,
    headline_en: cluster.headline_en || cluster.headline,
    articles: (articles || []).map(a => ({
      id: a.id,
      title: a.title,
      content_excerpt: a.content_excerpt || null,
      content_text: a.content_text || null,
      image_url: a.image_url || null,
      image_urls: a.image_urls || null,
      url: a.url,
      content_html: a.content_html || null,
      published_at: a.published_at || null,
    })),
    summary: summary ? {
      id: summary.id,
      summary_en: summary.summary_en || undefined,
      summary_quality_score_en: summary.summary_quality_score_en || undefined,
    } : undefined,
  };
}

/**
 * Process a single cluster with all tasks in parallel
 */
export async function processCluster(
  clusterId: string
): Promise<ClusterProcessingResult> {
  const startTime = Date.now();
  const errors: Array<{ stage: string; message: string }> = [];
  
  // Load cluster data
  const clusterData = await loadClusterData(clusterId);
  if (!clusterData || clusterData.articles.length === 0) {
    return {
      clusterId,
      success: false,
      errors: [{ stage: 'load', message: 'Cluster not found or has no articles' }],
      duration: Date.now() - startTime,
    };
  }
  
  const headlineEn = clusterData.headline_en || clusterData.headline;
  const needsSummary = !clusterData.summary || (clusterData.summary.summary_quality_score_en || 0) < 0.7;
  
  // Run all tasks in parallel
  const tasks = await Promise.allSettled([
    // Summary generation (if needed)
    needsSummary
      ? orchestrateSummaryGeneration(
          clusterData.articles.map(a => ({
            title: a.title,
            content: a.content_excerpt || a.content_text || '',
            weight: 1,
            publishedAt: a.published_at || undefined,
          })),
          clusterData.summary?.summary_en || null,
          undefined,
          { clusterId, summaryId: clusterData.summary?.id }
        ).catch(err => {
          errors.push({ stage: 'summary', message: err instanceof Error ? err.message : 'Unknown error' });
          throw err;
        })
      : Promise.resolve({ summary: clusterData.summary?.summary_en || '', qualityScore: 0.7, length: 0, sourceLang: 'en' as const }),
    
    // Translation (always run, but can use existing if available)
    orchestrateTranslation(
      clusterId,
      headlineEn,
      clusterData.summary?.summary_en || '',
      errors,
      { clusterId, summaryId: clusterData.summary?.id }
    ).catch(err => {
      errors.push({ stage: 'translation', message: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }),
    
    // SEO generation (always run)
    orchestrateSEOGeneration(
      clusterData.summary?.summary_en || headlineEn,
      headlineEn,
      clusterData.articles.map(a => ({
        title: a.title,
        content_excerpt: a.content_excerpt || null,
      })),
      { clusterId, summaryId: clusterData.summary?.id }
    ).catch(err => {
      errors.push({ stage: 'seo', message: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }),
    
    // Image selection (always run)
    orchestrateImageSelection(
      headlineEn,
      clusterData.summary?.summary_en || headlineEn,
      clusterData.articles.map(a => ({
        image_url: a.image_url,
        image_urls: a.image_urls,
        url: a.url,
        content_html: a.content_html || null,
      })),
      null,
      { clusterId, summaryId: clusterData.summary?.id }
    ).catch(err => {
      errors.push({ stage: 'image', message: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }),
    
    // Categorization (always run)
    orchestrateCategorization(
      clusterData.articles.map(a => ({
        title: a.title,
        content_excerpt: a.content_excerpt || null,
      })),
      { clusterId }
    ).catch(err => {
      errors.push({ stage: 'category', message: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }),
  ]);
  
  // Extract results
  const [summaryResult, translationResult, seoResult, imageResult, categoryResult] = tasks;
  
  const result: ClusterProcessingResult = {
    clusterId,
    success: tasks.every(t => t.status === 'fulfilled'),
    errors,
    duration: Date.now() - startTime,
  };
  
  if (summaryResult.status === 'fulfilled') {
    result.summary = summaryResult.value;
  }
  
  if (translationResult.status === 'fulfilled') {
    result.translations = translationResult.value;
  }
  
  if (seoResult.status === 'fulfilled') {
    result.seo = seoResult.value;
  }
  
  if (imageResult.status === 'fulfilled') {
    result.image = imageResult.value;
  }
  
  if (categoryResult.status === 'fulfilled') {
    result.category = categoryResult.value;
  }
  
  return result;
}

