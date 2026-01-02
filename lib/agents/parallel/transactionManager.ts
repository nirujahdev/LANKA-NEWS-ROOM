/**
 * Transaction Manager for Database Operations
 * Provides transactional support for batch operations
 */

import { supabaseAdmin } from '../../supabaseAdmin';
import { PostgrestError } from '@supabase/supabase-js';

export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retries: number;
}

/**
 * Execute a database operation within a transaction
 * Note: Supabase doesn't support explicit transactions, so we use batch operations
 * and error handling to simulate transactional behavior
 */
export async function executeInTransaction<T>(
  operations: Array<() => Promise<any>>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T[]>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
  } = options;
  
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // Execute all operations sequentially
      // In a real transaction system, these would be atomic
      const results: T[] = [];
      
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      
      return {
        success: true,
        data: results,
        retries,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      retries++;
      
      if (retries < maxRetries) {
        console.warn(`[TransactionManager] Operation failed, retrying (${retries}/${maxRetries}):`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      }
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Transaction failed after max retries',
    retries,
  };
}

/**
 * Batch insert articles with deduplication
 */
export async function batchInsertArticles(
  articles: Array<{
    source_id: string;
    title: string;
    url: string;
    content_excerpt?: string;
    content_text?: string;
    content_html?: string;
    image_url?: string;
    image_urls?: string[];
    published_at?: string;
    language?: string;
  }>,
  batchSize: number = 100
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const stats = {
    inserted: 0,
    skipped: 0,
    errors: 0,
  };
  
  // Process in batches
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    try {
      // Check for existing articles by URL
      const urls = batch.map(a => a.url);
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('url')
        .in('url', urls);
      
      const existingUrls = new Set(existing?.map(a => a.url) || []);
      const newArticles = batch.filter(a => !existingUrls.has(a.url));
      
      if (newArticles.length > 0) {
        const { error } = await supabaseAdmin
          .from('articles')
          .insert(newArticles);
        
        if (error) {
          console.error(`[TransactionManager] Batch insert error:`, error);
          stats.errors += newArticles.length;
        } else {
          stats.inserted += newArticles.length;
        }
      }
      
      stats.skipped += batch.length - newArticles.length;
    } catch (error) {
      console.error(`[TransactionManager] Batch insert failed:`, error);
      stats.errors += batch.length;
    }
  }
  
  return stats;
}

/**
 * Batch update clusters with transaction-like behavior
 */
export async function batchUpdateClusters(
  updates: Array<{
    clusterId: string;
    updates: Record<string, any>;
  }>,
  batchSize: number = 50
): Promise<{ updated: number; errors: number }> {
  const stats = {
    updated: 0,
    errors: 0,
  };
  
  // Process in batches
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    try {
      // Update each cluster individually (Supabase doesn't support bulk updates with different data)
      const updatePromises = batch.map(async ({ clusterId, updates: clusterUpdates }) => {
        const { error } = await supabaseAdmin
          .from('clusters')
          .update({
            ...clusterUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clusterId);
        
        if (error) {
          throw error;
        }
      });
      
      await Promise.all(updatePromises);
      stats.updated += batch.length;
    } catch (error) {
      console.error(`[TransactionManager] Batch update error:`, error);
      stats.errors += batch.length;
    }
  }
  
  return stats;
}

/**
 * Batch update summaries with transaction-like behavior
 */
export async function batchUpdateSummaries(
  updates: Array<{
    clusterId: string;
    summaryId?: string;
    updates: Record<string, any>;
  }>,
  batchSize: number = 50
): Promise<{ updated: number; created: number; errors: number }> {
  const stats = {
    updated: 0,
    created: 0,
    errors: 0,
  };
  
  // Process in batches
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    try {
      const updatePromises = batch.map(async ({ clusterId, summaryId, updates: summaryUpdates }) => {
        if (summaryId) {
          // Update existing summary
          const { error } = await supabaseAdmin
            .from('summaries')
            .update({
              ...summaryUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', summaryId);
          
          if (error) throw error;
          stats.updated++;
        } else {
          // Create new summary
          const { error } = await supabaseAdmin
            .from('summaries')
            .insert({
              cluster_id: clusterId,
              ...summaryUpdates,
            });
          
          if (error) throw error;
          stats.created++;
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error(`[TransactionManager] Batch summary update error:`, error);
      stats.errors += batch.length;
    }
  }
  
  return stats;
}

/**
 * Check for deadlocks and retry if needed
 */
export async function withDeadlockRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if it's a deadlock or lock timeout error
      const errorMessage = lastError.message.toLowerCase();
      const isDeadlock = errorMessage.includes('deadlock') || 
                         errorMessage.includes('lock') ||
                         errorMessage.includes('timeout');
      
      if (isDeadlock && retries < maxRetries - 1) {
        retries++;
        const delay = retryDelay * (retries + Math.random()); // Add jitter
        console.warn(`[TransactionManager] Deadlock detected, retrying in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error('Operation failed after max retries');
}

