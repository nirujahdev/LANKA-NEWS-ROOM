/**
 * Script to check if Tamil and Sinhala sources are enabled in the database
 * Run with: npx tsx scripts/check-sources.ts
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSources() {
  console.log('🔍 Checking sources in database...\n');

  const { data: sources, error } = await supabase
    .from('sources')
    .select('id, name, language, enabled, active, feed_url')
    .order('language', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching sources:', error);
    process.exit(1);
  }

  if (!sources || sources.length === 0) {
    console.warn('⚠️ No sources found in database!');
    return;
  }

  // Group by language
  const byLanguage = {
    en: sources.filter(s => s.language === 'en'),
    si: sources.filter(s => s.language === 'si'),
    ta: sources.filter(s => s.language === 'ta'),
    other: sources.filter(s => !['en', 'si', 'ta'].includes(s.language || ''))
  };

  console.log(`📊 Total sources: ${sources.length}`);
  console.log(`   English: ${byLanguage.en.length}`);
  console.log(`   Sinhala: ${byLanguage.si.length}`);
  console.log(`   Tamil: ${byLanguage.ta.length}`);
  if (byLanguage.other.length > 0) {
    console.log(`   Other: ${byLanguage.other.length}`);
  }
  console.log('');

  // Check enabled/active status
  const enabled = {
    en: byLanguage.en.filter(s => s.enabled && s.active).length,
    si: byLanguage.si.filter(s => s.enabled && s.active).length,
    ta: byLanguage.ta.filter(s => s.enabled && s.active).length
  };

  console.log('✅ Enabled & Active sources:');
  console.log(`   English: ${enabled.en}/${byLanguage.en.length}`);
  console.log(`   Sinhala: ${enabled.si}/${byLanguage.si.length}`);
  console.log(`   Tamil: ${enabled.ta}/${byLanguage.ta.length}`);
  console.log('');

  // Show disabled sources
  const disabled = sources.filter(s => !s.enabled || !s.active);
  if (disabled.length > 0) {
    console.log('⚠️ Disabled or Inactive sources:');
    disabled.forEach(s => {
      const status = [];
      if (!s.enabled) status.push('disabled');
      if (!s.active) status.push('inactive');
      console.log(`   - ${s.name} (${s.language}): ${status.join(', ')}`);
    });
    console.log('');
  }

  // Show Sinhala sources
  if (byLanguage.si.length > 0) {
    console.log('📰 Sinhala Sources:');
    byLanguage.si.forEach(s => {
      const status = s.enabled && s.active ? '✅' : '❌';
      console.log(`   ${status} ${s.name} - ${s.feed_url}`);
    });
    console.log('');
  } else {
    console.warn('⚠️ No Sinhala sources found!');
    console.log('');
  }

  // Show Tamil sources
  if (byLanguage.ta.length > 0) {
    console.log('📰 Tamil Sources:');
    byLanguage.ta.forEach(s => {
      const status = s.enabled && s.active ? '✅' : '❌';
      console.log(`   ${status} ${s.name} - ${s.feed_url}`);
    });
    console.log('');
  } else {
    console.warn('⚠️ No Tamil sources found!');
    console.log('');
  }

  // Recommendations
  if (enabled.si === 0) {
    console.log('💡 Recommendation: Enable Sinhala sources to get Sinhala content');
  }
  if (enabled.ta === 0) {
    console.log('💡 Recommendation: Enable Tamil sources to get Tamil content');
  }
}

checkSources().catch(console.error);

