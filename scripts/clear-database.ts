#!/usr/bin/env tsx
/**
 * Script to clear all clusters, summaries, and articles from the database
 * Run with: npx tsx scripts/clear-database.ts
 */

import { supabaseAdmin } from '../lib/supabaseAdmin';

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup (deleting rows only, keeping table structure)...');
  
  try {
    // Delete in proper order to respect foreign key constraints
    // 1. Delete summaries first (references clusters)
    console.log('Deleting summaries...');
    const { error: summaryError, count: summaryCount } = await supabaseAdmin
      .from('summaries')
      .delete()
      .neq('id', ''); // Delete all rows (condition that's always true)
    
    if (summaryError) {
      console.error('❌ Error deleting summaries:', summaryError);
      throw summaryError;
    } else {
      console.log(`✅ Deleted summaries (count: ${summaryCount || 'unknown'})`);
    }

    // 2. Delete cluster_articles junction table (references both clusters and articles)
    console.log('Deleting cluster_articles...');
    const { error: clusterArticlesError, count: clusterArticlesCount } = await supabaseAdmin
      .from('cluster_articles')
      .delete()
      .neq('id', '');
    
    if (clusterArticlesError) {
      console.error('❌ Error deleting cluster_articles:', clusterArticlesError);
      // Don't throw - this table might not exist
    } else {
      console.log(`✅ Deleted cluster_articles (count: ${clusterArticlesCount || 'unknown'})`);
    }

    // 3. Delete articles (references sources and clusters)
    console.log('Deleting articles...');
    const { error: articleError, count: articleCount } = await supabaseAdmin
      .from('articles')
      .delete()
      .neq('id', '');
    
    if (articleError) {
      console.error('❌ Error deleting articles:', articleError);
      throw articleError;
    } else {
      console.log(`✅ Deleted articles (count: ${articleCount || 'unknown'})`);
    }

    // 4. Delete clusters last (no dependencies on summaries/articles after they're deleted)
    console.log('Deleting clusters...');
    const { error: clusterError, count: clusterCount } = await supabaseAdmin
      .from('clusters')
      .delete()
      .neq('id', '');
    
    if (clusterError) {
      console.error('❌ Error deleting clusters:', clusterError);
      throw clusterError;
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

