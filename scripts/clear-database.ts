#!/usr/bin/env tsx
/**
 * Script to clear all clusters, summaries, and articles from the database
 * Run with: npx tsx scripts/clear-database.ts
 */

import { supabaseAdmin } from '../lib/supabaseAdmin';

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...');
  
  try {
    // Delete summaries first (foreign key constraint)
    console.log('Deleting summaries...');
    const { error: summaryError, count: summaryCount } = await supabaseAdmin
      .from('summaries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
    
    if (summaryError) {
      console.error('❌ Error deleting summaries:', summaryError);
    } else {
      console.log(`✅ Deleted summaries (count: ${summaryCount || 'unknown'})`);
    }

    // Delete articles
    console.log('Deleting articles...');
    const { error: articleError, count: articleCount } = await supabaseAdmin
      .from('articles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (articleError) {
      console.error('❌ Error deleting articles:', articleError);
    } else {
      console.log(`✅ Deleted articles (count: ${articleCount || 'unknown'})`);
    }

    // Delete clusters
    console.log('Deleting clusters...');
    const { error: clusterError, count: clusterCount } = await supabaseAdmin
      .from('clusters')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (clusterError) {
      console.error('❌ Error deleting clusters:', clusterError);
    } else {
      console.log(`✅ Deleted clusters (count: ${clusterCount || 'unknown'})`);
    }

    // Verify deletion
    const { count: finalSummaryCount } = await supabaseAdmin
      .from('summaries')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalArticleCount } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalClusterCount } = await supabaseAdmin
      .from('clusters')
      .select('*', { count: 'exact', head: true });

    console.log('\n📊 Final counts:');
    console.log(`   Summaries: ${finalSummaryCount || 0}`);
    console.log(`   Articles: ${finalArticleCount || 0}`);
    console.log(`   Clusters: ${finalClusterCount || 0}`);
    
    if (finalSummaryCount === 0 && finalArticleCount === 0 && finalClusterCount === 0) {
      console.log('\n✅ Database cleanup completed successfully!');
    } else {
      console.log('\n⚠️  Some records may still exist. Please check manually.');
    }
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
  }
}

clearDatabase();

