/**
 * AI News Agent Pipeline
 * 
 * A dedicated pipeline that uses AI agents for all processing tasks:
 * - Summary generation via Summary Agent
 * - Translation via Translation Agent
 * - SEO generation via SEO Agent
 * - Image selection via Image Agent
 * - Categorization via Category Agent
 * 
 * This pipeline is optimized for agent-driven processing and provides
 * comprehensive tracking of agent operations and metrics.
 */

import { supabaseAdmin } from './supabaseAdmin';
import { env } from './env';
import { detectLanguage } from './language';
import { generateSlug } from './text';
import {
  orchestrateSummaryGeneration,
  orchestrateTranslation,
  orchestrateSEOGeneration,
  orchestrateImageSelection,
  orchestrateCategorization,
} from './agents/orchestrator';
import { getAgentConfig } from './agents/config';

export type AIAgentPipelineStats = {
  runId?: string;
  clustersProcessed: number;
  summariesGenerated: number;
  translationsGenerated: number;
  seoGenerated: number;
  imagesSelected: number;
  categoriesAssigned: number;
  agentOperations: number;
  errors: Array<{ clusterId?: string; stage: string; message: string }>;
};

/**
 * Run AI News Agent Pipeline
 * 
 * Processes clusters that need AI agent processing:
 * - Clusters without summaries
 * - Clusters with low-quality summaries
 * - Clusters missing translations
 * - Clusters missing SEO metadata
 * - Clusters missing images
 * - Clusters needing categorization
 */
export async function runAIAgentPipeline(): Promise<AIAgentPipelineStats> {
  const config = getAgentConfig();
  
  // Check if agents are enabled
  if (!config.enabled) {
    console.warn('[AI Agent Pipeline] Agents are disabled. Enable AGENT_ENABLED=true to use this pipeline.');
    return {
      clustersProcessed: 0,
      summariesGenerated: 0,
      translationsGenerated: 0,
      seoGenerated: 0,
      imagesSelected: 0,
      categoriesAssigned: 0,
      agentOperations: 0,
      errors: [{ stage: 'config', message: 'Agents are disabled' }],
    };
  }

  const runId = await startRun();
  const errors: Array<{ clusterId?: string; stage: string; message: string }> = [];
  
  let clustersProcessed = 0;
  let summariesGenerated = 0;
  let translationsGenerated = 0;
  let seoGenerated = 0;
  let imagesSelected = 0;
  let categoriesAssigned = 0;
  let agentOperations = 0;

  try {
    console.log('[AI Agent Pipeline] Starting AI agent-driven processing...');
    
    // Get clusters that need processing
    const { data: clusters, error: clustersError } = await supabaseAdmin
      .from('clusters')
      .select('id, headline, headline_en, article_count, source_count, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(50); // Process up to 50 clusters per run

    if (clustersError) {
      throw new Error(`Failed to load clusters: ${clustersError.message}`);
    }

    if (!clusters || clusters.length === 0) {
      console.log('[AI Agent Pipeline] No clusters to process');
      await finishRun(runId, 'success', 'No clusters to process');
      return {
        runId,
        clustersProcessed: 0,
        summariesGenerated: 0,
        translationsGenerated: 0,
        seoGenerated: 0,
        imagesSelected: 0,
        categoriesAssigned: 0,
        agentOperations: 0,
        errors: [],
      };
    }

    console.log(`[AI Agent Pipeline] Processing ${clusters.length} clusters...`);

    // Process each cluster with AI agents
    for (const cluster of clusters) {
      try {
        clustersProcessed++;
        
        // Get cluster details
        const { data: clusterData } = await supabaseAdmin
          .from('clusters')
          .select('headline_en, headline_si, headline_ta, primary_topic, district, image_url, topics')
          .eq('id', cluster.id)
          .single();

        // Get summary
        const { data: summary } = await supabaseAdmin
          .from('summaries')
          .select('*')
          .eq('cluster_id', cluster.id)
          .maybeSingle();

        // Get articles
        const { data: articles } = await supabaseAdmin
          .from('articles')
          .select('title, content_excerpt, content_text, content_html, published_at, image_url, image_urls, url')
          .eq('cluster_id', cluster.id)
          .order('published_at', { ascending: false });

        if (!articles || articles.length === 0) {
          console.log(`[AI Agent Pipeline] Skipping cluster ${cluster.id} - no articles`);
          continue;
        }

        const headlineEn = clusterData?.headline_en || cluster.headline || '';
        const needsSummary = !summary || (summary.summary_quality_score_en || 0) < 0.7;
        const needsTranslations = !clusterData?.headline_si || !clusterData?.headline_ta || 
                                 !summary?.summary_si || !summary?.summary_ta;
        const needsSEO = !clusterData?.topics || (clusterData.topics.length || 0) < 2;
        const needsImage = !clusterData?.image_url;
        const needsCategory = !clusterData?.primary_topic;

        // STEP 1: Generate Summary (if needed)
        if (needsSummary) {
          try {
            const sourceLang = await detectLanguage(
              articles.map(a => `${a.title} ${a.content_excerpt || a.content_text || ''}`).join(' ')
            );
            
            const summaryResult = await orchestrateSummaryGeneration(
              articles.map(a => ({
                title: a.title,
                content: a.content_excerpt || a.content_text || '',
                weight: 1,
                publishedAt: a.published_at || undefined,
              })),
              summary?.summary_en || null,
              sourceLang,
              { clusterId: cluster.id, summaryId: summary?.id }
            );

            // Save summary
            if (summary) {
              await supabaseAdmin
                .from('summaries')
                .update({
                  summary_en: summaryResult.summary,
                  summary_quality_score_en: summaryResult.qualityScore,
                  summary_length_en: summaryResult.length,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', summary.id);
            } else {
              await supabaseAdmin
                .from('summaries')
                .insert({
                  cluster_id: cluster.id,
                  summary_en: summaryResult.summary,
                  summary_quality_score_en: summaryResult.qualityScore,
                  summary_length_en: summaryResult.length,
                });
            }

            summariesGenerated++;
            agentOperations++;
            console.log(`[AI Agent Pipeline] ✅ Generated summary for cluster ${cluster.id} (quality: ${summaryResult.qualityScore})`);
          } catch (error) {
            console.error(`[AI Agent Pipeline] ❌ Summary generation failed for cluster ${cluster.id}:`, error);
            errors.push({
              clusterId: cluster.id,
              stage: 'summary',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Get updated summary
        const { data: updatedSummary } = await supabaseAdmin
          .from('summaries')
          .select('*')
          .eq('cluster_id', cluster.id)
          .maybeSingle();

        const summaryEn = updatedSummary?.summary_en || summary?.summary_en || '';

        // STEP 2: Generate Translations (if needed)
        if (needsTranslations && summaryEn) {
          try {
            const summaryId = updatedSummary?.id || summary?.id;
            
            const translationResult = await orchestrateTranslation(
              cluster.id,
              headlineEn,
              summaryEn,
              errors,
              { clusterId: cluster.id, summaryId }
            );

            // Update cluster with translations
            await supabaseAdmin
              .from('clusters')
              .update({
                headline_si: translationResult.headlineSi,
                headline_ta: translationResult.headlineTa,
                headline_translation_quality_si: translationResult.qualityScores.headlineSi,
                headline_translation_quality_ta: translationResult.qualityScores.headlineTa,
                updated_at: new Date().toISOString(),
              })
              .eq('id', cluster.id);

            // Update summary with translations
            if (updatedSummary || summary) {
              await supabaseAdmin
                .from('summaries')
                .update({
                  summary_si: translationResult.summarySi,
                  summary_ta: translationResult.summaryTa,
                  summary_quality_score_si: translationResult.qualityScores.summarySi,
                  summary_quality_score_ta: translationResult.qualityScores.summaryTa,
                  updated_at: new Date().toISOString(),
                })
                .eq('cluster_id', cluster.id);
            }

            translationsGenerated++;
            agentOperations++;
            console.log(`[AI Agent Pipeline] ✅ Generated translations for cluster ${cluster.id}`);
          } catch (error) {
            console.error(`[AI Agent Pipeline] ❌ Translation failed for cluster ${cluster.id}:`, error);
            errors.push({
              clusterId: cluster.id,
              stage: 'translation',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // STEP 3: Generate SEO (if needed)
        if (needsSEO && summaryEn) {
          try {
            const seoResult = await orchestrateSEOGeneration(
              summaryEn,
              headlineEn,
              articles.map(a => ({
                title: a.title,
                content_excerpt: a.content_excerpt || null,
              })),
              { clusterId: cluster.id, summaryId: updatedSummary?.id || summary?.id }
            );

            // Update cluster with SEO data
            const primaryTopic = seoResult.topics.find(t => t !== 'sri-lanka' && t !== 'world') || 'politics';
            await supabaseAdmin
              .from('clusters')
              .update({
                meta_title_en: seoResult.seoEn.title,
                meta_description_en: seoResult.seoEn.description,
                meta_title_si: seoResult.seoSi.title,
                meta_description_si: seoResult.seoSi.description,
                meta_title_ta: seoResult.seoTa.title,
                meta_description_ta: seoResult.seoTa.description,
                primary_topic: primaryTopic,
                topic: primaryTopic, // Backward compatibility
                topics: seoResult.topics,
                district: seoResult.district,
                primary_entity: seoResult.entities.primary_entity,
                event_type: seoResult.entities.event_type,
                keywords: seoResult.keywords,
                updated_at: new Date().toISOString(),
              })
              .eq('id', cluster.id);

            // Update summary with key facts
            if (updatedSummary || summary) {
              await supabaseAdmin
                .from('summaries')
                .update({
                  key_facts_en: seoResult.keyFacts.en,
                  key_facts_si: seoResult.keyFacts.si,
                  key_facts_ta: seoResult.keyFacts.ta,
                  confirmed_vs_differs_en: seoResult.confirmedVsDiffers.en,
                  confirmed_vs_differs_si: seoResult.confirmedVsDiffers.si,
                  confirmed_vs_differs_ta: seoResult.confirmedVsDiffers.ta,
                  updated_at: new Date().toISOString(),
                })
                .eq('cluster_id', cluster.id);
            }

            seoGenerated++;
            agentOperations++;
            console.log(`[AI Agent Pipeline] ✅ Generated SEO for cluster ${cluster.id} (topics: ${seoResult.topics.join(', ')})`);
          } catch (error) {
            console.error(`[AI Agent Pipeline] ❌ SEO generation failed for cluster ${cluster.id}:`, error);
            errors.push({
              clusterId: cluster.id,
              stage: 'seo',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // STEP 4: Select Image (if needed)
        if (needsImage && summaryEn) {
          try {
            const imageResult = await orchestrateImageSelection(
              headlineEn,
              summaryEn,
              articles.map(a => ({
                image_url: a.image_url,
                image_urls: a.image_urls,
                url: a.url,
                content_html: a.content_html || null,
              })),
              clusterData?.image_url || null,
              { clusterId: cluster.id, summaryId: updatedSummary?.id || summary?.id }
            );

            if (imageResult.imageUrl) {
              await supabaseAdmin
                .from('clusters')
                .update({
                  image_url: imageResult.imageUrl,
                  image_relevance_score: imageResult.relevanceScore,
                  image_quality_score: imageResult.qualityScore,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', cluster.id);

              imagesSelected++;
              agentOperations++;
              console.log(`[AI Agent Pipeline] ✅ Selected image for cluster ${cluster.id} (relevance: ${imageResult.relevanceScore})`);
            }
          } catch (error) {
            console.error(`[AI Agent Pipeline] ❌ Image selection failed for cluster ${cluster.id}:`, error);
            errors.push({
              clusterId: cluster.id,
              stage: 'image',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // STEP 5: Categorize (if needed)
        if (needsCategory) {
          try {
            const categoryResult = await orchestrateCategorization(
              articles.map(a => ({
                title: a.title,
                content_excerpt: a.content_excerpt || null,
              })),
              { clusterId: cluster.id }
            );

            await supabaseAdmin
              .from('clusters')
              .update({
                category: categoryResult.category,
                primary_topic: categoryResult.category,
                topic: categoryResult.category, // Backward compatibility
                updated_at: new Date().toISOString(),
              })
              .eq('id', cluster.id);

            categoriesAssigned++;
            agentOperations++;
            console.log(`[AI Agent Pipeline] ✅ Categorized cluster ${cluster.id} as ${categoryResult.category}`);
          } catch (error) {
            console.error(`[AI Agent Pipeline] ❌ Categorization failed for cluster ${cluster.id}:`, error);
            errors.push({
              clusterId: cluster.id,
              stage: 'category',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

      } catch (error) {
        console.error(`[AI Agent Pipeline] ❌ Failed to process cluster ${cluster.id}:`, error);
        errors.push({
          clusterId: cluster.id,
          stage: 'processing',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await finishRun(runId, 'success', 
      `Processed ${clustersProcessed} clusters, ${agentOperations} agent operations`);

    console.log(`[AI Agent Pipeline] ✅ Completed: ${clustersProcessed} clusters, ${agentOperations} agent operations`);

    return {
      runId,
      clustersProcessed,
      summariesGenerated,
      translationsGenerated,
      seoGenerated,
      imagesSelected,
      categoriesAssigned,
      agentOperations,
      errors,
    };
  } catch (err: any) {
    await finishRun(runId, 'error', err?.message || 'unknown');
    throw err;
  }
}

async function startRun(): Promise<string | undefined> {
  const { data } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({ status: 'started', notes: 'AI Agent Pipeline' })
    .select('id')
    .single();

  return data?.id;
}

async function finishRun(runId: string | undefined, status: 'success' | 'error', notes: string) {
  if (!runId) return;
  
  await supabaseAdmin
    .from('pipeline_runs')
    .update({ status, finished_at: new Date().toISOString(), notes })
    .eq('id', runId);
}

