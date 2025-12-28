/**
 * Validation Script for Quality Metrics
 * 
 * This script validates that all success criteria are met:
 * - Image relevance > 80%
 * - All headlines translated (100%)
 * - All summaries translated (100%)
 * - Summary quality > 0.7
 * 
 * Run with: tsx scripts/validate-quality-metrics.ts
 */

import { supabaseAdmin } from '../lib/supabaseAdmin';

async function validateMetrics() {
  console.log('🔍 Validating quality metrics...\n');

  // Get total counts
  const { count: totalClusters } = await supabaseAdmin
    .from('clusters')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: totalSummaries } = await supabaseAdmin
    .from('summaries')
    .select('id', { count: 'exact', head: true });

  // Check headline translation coverage
  const { count: headlineCoverage } = await supabaseAdmin
    .from('clusters')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('headline_si', 'is', null)
    .not('headline_ta', 'is', null);

  // Check summary translation coverage
  const { count: summaryCoverage } = await supabaseAdmin
    .from('summaries')
    .select('id', { count: 'exact', head: true })
    .not('summary_si', 'is', null)
    .not('summary_ta', 'is', null);

  // Check image relevance > 80%
  const { count: imageRelevance } = await supabaseAdmin
    .from('clusters')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .gte('image_relevance_score', 0.8);

  // Check summary quality > 0.7
  const { count: summaryQuality } = await supabaseAdmin
    .from('summaries')
    .select('id', { count: 'exact', head: true })
    .gte('summary_quality_score_en', 0.7);

  // Calculate percentages
  const headlineCoveragePercent = totalClusters ? (headlineCoverage / totalClusters) * 100 : 0;
  const summaryCoveragePercent = totalSummaries ? (summaryCoverage / totalSummaries) * 100 : 0;
  const imageRelevancePercent = totalClusters ? (imageRelevance / totalClusters) * 100 : 0;
  const summaryQualityPercent = totalSummaries ? (summaryQuality / totalSummaries) * 100 : 0;

  console.log('📊 Quality Metrics Report:\n');
  console.log(`Total Clusters: ${totalClusters}`);
  console.log(`Total Summaries: ${totalSummaries}\n`);

  console.log('✅ Success Criteria:');
  console.log(`  Headline Translation Coverage: ${headlineCoveragePercent.toFixed(1)}% (${headlineCoverage}/${totalClusters}) ${headlineCoveragePercent >= 100 ? '✅' : '❌'}`);
  console.log(`  Summary Translation Coverage: ${summaryCoveragePercent.toFixed(1)}% (${summaryCoverage}/${totalSummaries}) ${summaryCoveragePercent >= 100 ? '✅' : '❌'}`);
  console.log(`  Image Relevance >80%: ${imageRelevancePercent.toFixed(1)}% (${imageRelevance}/${totalClusters}) ${imageRelevancePercent >= 80 ? '✅' : '❌'}`);
  console.log(`  Summary Quality >0.7: ${summaryQualityPercent.toFixed(1)}% (${summaryQuality}/${totalSummaries}) ${summaryQualityPercent >= 100 ? '✅' : '❌'}\n`);

  // Check for issues
  const issues: string[] = [];
  if (headlineCoveragePercent < 100) {
    issues.push(`Missing headline translations: ${totalClusters - headlineCoverage} clusters`);
  }
  if (summaryCoveragePercent < 100) {
    issues.push(`Missing summary translations: ${totalSummaries - summaryCoverage} summaries`);
  }
  if (imageRelevancePercent < 80) {
    issues.push(`Low image relevance: ${totalClusters - imageRelevance} clusters below 80%`);
  }
  if (summaryQualityPercent < 100) {
    issues.push(`Low summary quality: ${totalSummaries - summaryQuality} summaries below 0.7`);
  }

  if (issues.length > 0) {
    console.log('⚠️ Issues Found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\n💡 Run backfill script to fix: tsx scripts/backfill-translations-complete.ts\n');
    return false;
  } else {
    console.log('🎉 All success criteria met!\n');
    return true;
  }
}

async function main() {
  try {
    const success = await validateMetrics();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();

