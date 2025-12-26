// @ts-nocheck
import { supabaseAdmin } from './supabaseAdmin';
import { fetchRssFeed } from './rss';

/**
 * Source record from database allowlist.
 * All ingestion sources MUST come from this table.
 * Never accept URLs from user input or request parameters.
 */
type SourceRecord = {
  id: string;
  name: string;
  type: 'rss' | 'twitter' | 'facebook';
  feed_url: string;
  base_domain: string;
  active: boolean;
};

/**
 * Normalized article data ready for database insertion.
 */
type ArticleData = {
  source_id: string;
  title: string;
  url: string;
  content: string | null;
  content_html: string | null;
  published_at: string | null;
  guid: string | null;
  image_url: string | null;
  image_urls: string[] | null;
};

/**
 * Extracts hostname from a URL for domain validation.
 * Returns null if URL is invalid.
 */
function extractHostname(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates that an article URL belongs to the source's allowed domain.
 * This prevents feed poisoning and malicious redirects.
 * 
 * SECURITY: If domain doesn't match, the article is discarded.
 */
function validateDomain(articleUrl: string, allowedDomain: string): boolean {
  const hostname = extractHostname(articleUrl);
  if (!hostname) {
    return false; // Invalid URL
  }

  const normalizedAllowed = allowedDomain.toLowerCase().trim();
  
  // Exact match
  if (hostname === normalizedAllowed) {
    return true;
  }

  // Subdomain match (e.g., www.adaderana.lk matches adaderana.lk)
  if (hostname.endsWith('.' + normalizedAllowed)) {
    return true;
  }

  return false;
}

/**
 * Strips HTML tags and normalizes content to plain text.
 * Used for safe content storage.
 */
function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  
  // Simple HTML tag removal (for production, consider using a proper HTML parser)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Main ingestion pipeline.
 * 
 * SECURITY RULES:
 * 1. Only fetches from database allowlist (sources table)
 * 2. Validates article URLs match source's base_domain
 * 3. Never accepts URLs from requests or user input
 * 4. Fails safely (one bad source doesn't stop the pipeline)
 */
export async function runIngestionPipeline() {
  const stats = {
    sourcesProcessed: 0,
    articlesFetched: 0,
    articlesInserted: 0,
    articlesRejected: 0,
    errors: [] as Array<{ sourceId: string; source: string; stage: string; error: string }>
  };

  // STEP 1: Load allowlisted sources from database
  // CRITICAL: All sources come from database, never from request
  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from('sources')
    .select('id, name, type, feed_url, base_domain, active')
    .eq('active', true);

  if (sourcesError) {
    throw new Error(`Failed to load sources: ${sourcesError.message}`);
  }

  if (!sources || sources.length === 0) {
    return { ...stats, message: 'No active sources found' };
  }

  // STEP 2: Process each source independently
  // If one source fails, others continue (fail-safe design)
  for (const source of sources as SourceRecord[]) {
    // Validate source has required fields
    if (!source.feed_url || !source.base_domain) {
      stats.errors.push({
        sourceId: source.id,
        source: source.name,
        stage: 'validation',
        error: 'Missing feed_url or base_domain'
      });
      continue;
    }

    try {
      // STEP 3: Fetch RSS feed from allowlisted URL only
      // Never fetch from any other URL
      const items = await fetchRssFeed(source.feed_url);
      stats.articlesFetched += items.length;

      // STEP 4: Process each article item
      const articlesToInsert: ArticleData[] = [];

      for (const item of items) {
        // STEP 5: DOMAIN VALIDATION (MANDATORY SECURITY CHECK)
        // Extract hostname from article URL
        // Ensure it matches the source's base_domain
        // If it does NOT match → discard the item
        if (!validateDomain(item.url, source.base_domain)) {
          stats.articlesRejected += 1;
          continue; // Discard item - domain doesn't match
        }

        // STEP 6: Normalize article data
        const articleData: ArticleData = {
          source_id: source.id,
          title: item.title || 'Untitled',
          url: item.url,
          content: stripHtml(item.content || item.contentSnippet), // Plain text for search
          content_html: item.content || item.contentSnippet || null, // Raw HTML for image extraction
          published_at: item.publishedAt || null,
          guid: item.guid || null,
          image_url: item.imageUrl || null,
          image_urls: item.imageUrls || null // All images from RSS
        };

        articlesToInsert.push(articleData);
      }

      // STEP 7: Insert articles into database
      // Only insert if URL doesn't already exist (deduplication)
      if (articlesToInsert.length > 0) {
        // TypeScript can't infer type for upsert with mapped array - this is a known limitation
        // @ts-ignore - Supabase type inference fails with upsert() on mapped arrays
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('articles')
          .upsert(
            articlesToInsert.map((a) => ({
              ...a,
              content_text: a.content,
              content_excerpt: a.content?.slice(0, 400) || null,
              content_html: a.content_html,
              image_urls: a.image_urls
            })),
            {
              onConflict: 'url', // Deduplicate by URL
              ignoreDuplicates: false
            }
          )
          .select('id');

        if (insertError) {
          stats.errors.push({
            sourceId: source.id,
            source: source.name,
            stage: 'insert',
            error: `Insert failed: ${insertError.message}`
          });
        } else {
          stats.articlesInserted += inserted?.length || 0;
        }
      }

      stats.sourcesProcessed += 1;
    } catch (error: any) {
      // Fail safely: log error but continue with other sources
      stats.errors.push({
        sourceId: source.id,
        source: source.name,
        stage: 'fetch',
        error: error?.message || 'Unknown error'
      });
      // Continue processing other sources
    }
  }

  return stats;
}

