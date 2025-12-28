/**
 * Complete Backfill Script for Translations and Quality Scores
 * 
 * This script backfills:
 * 1. Missing headline translations (headline_si, headline_ta)
 * 2. Missing summary translations (summary_si, summary_ta)
 * 3. Quality scores for all translations
 * 4. Image relevance scores
 * 
 * Run with: tsx scripts/backfill-translations-complete.ts
 */

import { supabaseAdmin } from '../lib/supabaseAdmin';
import { ensureHeadlineTranslations, ensureSummaryTranslations, selectBestImageWithQuality } from '../lib/pipelineEnhanced';
import { detectLanguage } from '../lib/language';

async function backfillHeadlineTranslations() {
  console.log('\n📝 Backfilling headline translations...');
  
  // Find clusters missing translations or with low quality
  const { data: clusters, error } = await supabaseAdmin
    .from('clusters')
    .select('id, headline, headline_si, headline_ta, headline_translation_quality_si, headline_translation_quality_ta')
    .eq('status', 'published')
    .or('headline_si.is.null,headline_ta.is.null,headline_translation_quality_si.lt.0.7,headline_translation_quality_ta.lt.0.7');

  if (error) {
    console.error('Error fetching clusters:', error);
    return 0;
  }

  if (!clusters || clusters.length === 0) {
    console.log('✅ All clusters already have translations');
    return 0;
  }

  console.log(`Found ${clusters.length} clusters needing headline translations`);

  let processed = 0;
  const errors: Array<{ stage: string; message: string }> = [];

  for (const cluster of clusters) {
    try {
      await ensureHeadlineTranslations(cluster.id, cluster.headline, errors);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  Processed ${processed}/${clusters.length} clusters...`);
      }
    } catch (error) {
      console.error(`Failed to backfill headlines for cluster ${cluster.id}:`, error);
      errors.push({ stage: 'headline_backfill', message: `Cluster ${cluster.id}: ${error}` });
    }
  }

  console.log(`✅ Backfilled ${processed}/${clusters.length} headline translations`);
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} errors occurred`);
  }

  return processed;
}

async function backfillSummaryTranslations() {
  console.log('\n📄 Backfilling summary translations...');
  
  // Find summaries missing translations or with low quality
  const { data: summaries, error } = await supabaseAdmin
    .from('summaries')
    .select('cluster_id, summary_en, summary_si, summary_ta, summary_quality_score_si, summary_quality_score_ta')
    .or('summary_si.is.null,summary_ta.is.null,summary_quality_score_si.lt.0.7,summary_quality_score_ta.lt.0.7');

  if (error) {
    console.error('Error fetching summaries:', error);
    return 0;
  }

  if (!summaries || summaries.length === 0) {
    console.log('✅ All summaries already have translations');
    return 0;
  }

  console.log(`Found ${summaries.length} summaries needing translations`);

  let processed = 0;
  const errors: Array<{ stage: string; message: string }> = [];

  for (const summary of summaries) {
    if (!summary.summary_en || summary.summary_en.trim().length === 0) {
      console.warn(`Skipping cluster ${summary.cluster_id} - no English summary`);
      continue;
    }

    try {
      await ensureSummaryTranslations(summary.cluster_id, summary.summary_en, errors);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  Processed ${processed}/${summaries.length} summaries...`);
      }
    } catch (error) {
      console.error(`Failed to backfill summaries for cluster ${summary.cluster_id}:`, error);
      errors.push({ stage: 'summary_backfill', message: `Cluster ${summary.cluster_id}: ${error}` });
    }
  }

  console.log(`✅ Backfilled ${processed}/${summaries.length} summary translations`);
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} errors occurred`);
  }

  return processed;
}

async function backfillImageRelevance() {
  console.log('\n🖼️ Backfilling image relevance scores...');
  
  // Find clusters with images but missing or low relevance scores
  const { data: clusters, error } = await supabaseAdmin
    .from('clusters')
    .select('id, headline, image_url, image_relevance_score')
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .or('image_relevance_score.is.null,image_relevance_score.lt.0.8');

  if (error) {
    console.error('Error fetching clusters:', error);
    return 0;
  }

  if (!clusters || clusters.length === 0) {
    console.log('✅ All clusters already have image relevance scores');
    return 0;
  }

  console.log(`Found ${clusters.length} clusters needing image relevance scores`);

  let processed = 0;
  const errors: Array<{ stage: string; message: string }> = [];

  for (const cluster of clusters) {
    try {
      // Get summary for image selection
      const { data: summary } = await supabaseAdmin
        .from('summaries')
        .select('summary_en')
        .eq('cluster_id', cluster.id)
        .single();

      if (!summary?.summary_en) {
        console.warn(`Skipping cluster ${cluster.id} - no summary for image selection`);
        continue;
      }

      // Get articles for image context
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('image_url, image_urls, url, content_html')
        .eq('cluster_id', cluster.id)
        .limit(5);

      await selectBestImageWithQuality(
        cluster.id,
        cluster.headline || '',
        summary.summary_en,
        (articles || []).map(a => ({
          image_url: a.image_url,
          image_urls: a.image_urls,
          url: a.url,
          content_html: a.content_html || null
        }))
      );

      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  Processed ${processed}/${clusters.length} clusters...`);
      }
    } catch (error) {
      console.error(`Failed to backfill image relevance for cluster ${cluster.id}:`, error);
      errors.push({ stage: 'image_backfill', message: `Cluster ${cluster.id}: ${error}` });
    }
  }

  console.log(`✅ Backfilled ${processed}/${clusters.length} image relevance scores`);
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} errors occurred`);
  }

  return processed;
}

async function main() {
  console.log('🚀 Starting complete translation and quality backfill...\n');

  try {
    const headlineCount = await backfillHeadlineTranslations();
    const summaryCount = await backfillSummaryTranslations();
    const imageCount = await backfillImageRelevance();

    console.log('\n📊 Backfill Summary:');
    console.log(`  Headlines: ${headlineCount} processed`);
    console.log(`  Summaries: ${summaryCount} processed`);
    console.log(`  Images: ${imageCount} processed`);
    console.log('\n✅ Backfill complete!');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

main();

