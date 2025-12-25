/**
 * Backfill script to generate missing translations for existing summaries
 * 
 * This script finds all summaries that are missing translations in any language
 * and generates the missing translations using OpenAI.
 * 
 * Usage: npx tsx scripts/backfill-translations.ts
 */

import { supabaseAdmin } from '../lib/supabaseAdmin';
import { translateToMultipleLanguages, translateFromTo } from '../lib/openaiClient';

interface SummaryRow {
  cluster_id: string;
  summary_en: string | null;
  summary_si: string | null;
  summary_ta: string | null;
}

async function backfillTranslations() {
  console.log('🔍 Finding summaries with missing translations...');

  // Find all summaries that are missing at least one language translation
  const { data: summaries, error } = await supabaseAdmin
    .from('summaries')
    .select('cluster_id, summary_en, summary_si, summary_ta')
    .or('summary_en.is.null,summary_si.is.null,summary_ta.is.null');

  if (error) {
    console.error('❌ Error fetching summaries:', error);
    process.exit(1);
  }

  if (!summaries || summaries.length === 0) {
    console.log('✅ All summaries already have translations in all 3 languages!');
    return;
  }

  console.log(`📊 Found ${summaries.length} summaries with missing translations`);

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const summary of summaries as SummaryRow[]) {
    processed++;
    const clusterId = summary.cluster_id;
    
    console.log(`\n[${processed}/${summaries.length}] Processing cluster ${clusterId}...`);

    // Determine which languages are missing
    const hasEn = !!summary.summary_en;
    const hasSi = !!summary.summary_si;
    const hasTa = !!summary.summary_ta;

    if (hasEn && hasSi && hasTa) {
      console.log('  ✅ All translations present, skipping');
      success++;
      continue;
    }

    // Determine source language (prefer English if available)
    let sourceLang: 'en' | 'si' | 'ta';
    let sourceText: string;

    if (hasEn) {
      sourceLang = 'en';
      sourceText = summary.summary_en!;
    } else if (hasSi) {
      sourceLang = 'si';
      sourceText = summary.summary_si!;
    } else if (hasTa) {
      sourceLang = 'ta';
      sourceText = summary.summary_ta!;
    } else {
      console.log('  ⚠️  No source text available, skipping');
      failed++;
      continue;
    }

    console.log(`  📝 Source language: ${sourceLang}, missing: ${!hasEn ? 'en ' : ''}${!hasSi ? 'si ' : ''}${!hasTa ? 'ta ' : ''}`);

    try {
      // Generate all translations
      const translations = await translateToMultipleLanguages(sourceText, sourceLang);

      // Prepare update object
      const update: Partial<SummaryRow> = {};
      
      if (!hasEn && translations.en) {
        update.summary_en = translations.en;
      }
      if (!hasSi && translations.si) {
        update.summary_si = translations.si;
      }
      if (!hasTa && translations.ta) {
        update.summary_ta = translations.ta;
      }

      // Update the summary
      if (Object.keys(update).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('summaries')
          .update(update)
          .eq('cluster_id', clusterId);

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
          failed++;
        } else {
          console.log(`  ✅ Updated with missing translations`);
          success++;
        }
      } else {
        console.log('  ⚠️  No translations generated');
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Error processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${processed}`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('\n✨ Backfill complete!');
}

// Run the backfill
backfillTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

