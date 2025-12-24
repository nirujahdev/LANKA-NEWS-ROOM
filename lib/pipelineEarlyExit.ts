// @ts-nocheck
import { supabaseAdmin } from './supabaseAdmin';
import { fetchRssFeed } from './rss';
import { makeArticleHash } from './hash';

const SETTINGS_NAME = 'main';
const MIN_RUN_INTERVAL_MINUTES = 10; // Minimum time between runs

export type EarlyExitResult = {
  shouldSkip: boolean;
  reason?: 'too_soon' | 'no_new_items';
};

/**
 * Checks if the last successful run was too recent.
 * Quick timestamp check before doing any expensive operations.
 * 
 * @param minMinutes Minimum minutes since last run (default: 10)
 * @returns Early exit result if too soon, null if OK to proceed
 */
export async function checkLastRunTooSoon(
  minMinutes: number = MIN_RUN_INTERVAL_MINUTES
): Promise<EarlyExitResult | null> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_settings')
    .select('last_successful_run')
    .eq('name', SETTINGS_NAME)
    .single();

  if (error || !data || !data.last_successful_run) {
    // No previous run or error - proceed
    return null;
  }

  const lastRun = new Date(data.last_successful_run);
  const now = new Date();
  const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60);

  if (minutesSinceLastRun < minMinutes) {
    return {
      shouldSkip: true,
      reason: 'too_soon'
    };
  }

  return null; // OK to proceed
}

/**
 * Checks if there are any new items in RSS feeds since last run.
 * 
 * Fetches RSS feeds and checks if any URLs or GUIDs don't exist in database.
 * This is more expensive than timestamp check but prevents unnecessary processing.
 * 
 * @param sources Array of source records from database
 * @param lastRunTime Timestamp of last successful run (null if never run)
 * @returns Early exit result if no new items, null if new items found
 */
export async function checkForNewItems(
  sources: Array<{ id: string; feed_url: string; name: string }>,
  lastRunTime: Date | null
): Promise<EarlyExitResult | null> {
  if (!sources || sources.length === 0) {
    return {
      shouldSkip: true,
      reason: 'no_new_items' // No sources = no new items
    };
  }

  // Fetch RSS feeds for all sources (limited concurrency)
  const feedPromises = sources.map(async (source) => {
    try {
      const items = await fetchRssFeed(source.feed_url);
      return { sourceId: source.id, sourceName: source.name, items };
    } catch (error) {
      // If fetch fails, assume there might be new items (don't skip)
      console.warn(`Failed to fetch feed for ${source.name}:`, error);
      return { sourceId: source.id, sourceName: source.name, items: [] };
    }
  });

  const feedResults = await Promise.all(feedPromises);

  // Collect all URLs and GUIDs from feeds
  const feedUrls = new Set<string>();
  const feedGuids = new Set<string>();
  const feedHashes = new Set<string>();

  for (const result of feedResults) {
    for (const item of result.items) {
      if (item.url) {
        feedUrls.add(item.url);
      }
      if (item.guid) {
        feedGuids.add(item.guid);
      }
      // Also check hash (URL + GUID + title)
      const hash = makeArticleHash({
          url: item.url,
          guid: item.guid,
          title: item.title
        });
      feedHashes.add(hash);
    }
  }

  if (feedUrls.size === 0 && feedGuids.size === 0) {
    // No items in feeds
    return {
      shouldSkip: true,
      reason: 'no_new_items'
    };
  }

  // Check which URLs/GUIDs/hashes already exist in database
  // Use efficient queries with IN clauses
  const urlArray = Array.from(feedUrls);
  const guidArray = Array.from(feedGuids);
  const hashArray = Array.from(feedHashes);

  const checks: Promise<{ count: number }>[] = [];

  // Check URLs
  if (urlArray.length > 0) {
    const urlCheck = supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .in('url', urlArray.slice(0, 100)); // Limit to avoid query size issues
    checks.push(urlCheck.then((r) => ({ count: r.count || 0 })));
  }

  // Check GUIDs (if any)
  if (guidArray.length > 0) {
    const guidCheck = supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .in('guid', guidArray.slice(0, 100))
      .not('guid', 'is', null);
    checks.push(guidCheck.then((r) => ({ count: r.count || 0 })));
  }

  // Check hashes
  if (hashArray.length > 0) {
    const hashCheck = supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .in('hash', hashArray.slice(0, 100));
    checks.push(hashCheck.then((r) => ({ count: r.count || 0 })));
  }

  const results = await Promise.all(checks);
  const totalExisting = results.reduce((sum, r) => sum + r.count, 0);

  // If all items already exist, skip
  const totalItems = Math.max(feedUrls.size, feedGuids.size, feedHashes.size);
  
  // Conservative check: if we have many existing items, likely no new ones
  // But allow some margin for error (e.g., if hash check misses some)
  if (totalExisting >= totalItems * 0.95) {
    return {
      shouldSkip: true,
      reason: 'no_new_items'
    };
  }

  // New items found - proceed with pipeline
  return null;
}

/**
 * Gets the last successful run timestamp from settings.
 * 
 * @returns Date of last successful run, or null if never run
 */
export async function getLastSuccessfulRun(): Promise<Date | null> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_settings')
    .select('last_successful_run')
    .eq('name', SETTINGS_NAME)
    .single();

  if (error || !data || !data.last_successful_run) {
    return null;
  }

  return new Date(data.last_successful_run);
}

/**
 * Updates the last successful run timestamp.
 * 
 * @param timestamp Timestamp to set (default: now())
 */
export async function updateLastSuccessfulRun(timestamp?: Date): Promise<void> {
  const now = timestamp || new Date();

  const { error } = await supabaseAdmin
    .from('pipeline_settings')
    .upsert(
      {
        name: SETTINGS_NAME,
        last_successful_run: now.toISOString(),
        updated_at: now.toISOString()
      },
      { onConflict: 'name' }
    );

  if (error) {
    console.error('Failed to update last successful run:', error);
    // Don't throw - this is best-effort tracking
  }
}

