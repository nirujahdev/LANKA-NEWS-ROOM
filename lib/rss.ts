import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { withRetry } from './retry';

export type NormalizedItem = {
  title: string;
  url: string;
  guid: string | null;
  publishedAt: string | null;
  content: string | null;
  contentSnippet: string | null;
  imageUrl: string | null;
};

// Configure parser with custom headers to avoid 403 errors
const parser = new Parser({
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0; +https://lankanewsroom.xyz)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
});

/**
 * Safely fetches and parses an RSS feed.
 * 
 * SECURITY: Only call with allowlisted URLs from database.
 * Never accept feed URLs from user input or requests.
 */
export async function fetchRssFeed(feedUrl: string): Promise<NormalizedItem[]> {
  // Wrap with retry logic for reliability
  return withRetry(
    async () => {
      const feed = await parser.parseURL(feedUrl);
      return (feed.items || [])
        .map((item) => {
        // Extract image URL from various RSS feed formats
        let imageUrl: string | null = null;
        
        // Check for media:content or media:thumbnail (common RSS image formats)
        if ((item as any).media?.content?.[0]?.$?.url) {
          imageUrl = (item as any).media.content[0].$.url;
        } else if ((item as any).media?.thumbnail?.[0]?.$?.url) {
          imageUrl = (item as any).media.thumbnail[0].$.url;
        } else if ((item as any)['media:content']?.[0]?.['$']?.url) {
          imageUrl = (item as any)['media:content'][0]['$'].url;
        } else if ((item as any)['media:thumbnail']?.[0]?.['$']?.url) {
          imageUrl = (item as any)['media:thumbnail'][0]['$'].url;
        } else if ((item as any).enclosure?.type?.startsWith('image/')) {
          imageUrl = (item as any).enclosure.url;
        } else if (item.content) {
          // Try to extract image from HTML content
          const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        return {
          title: item.title?.trim() || 'Untitled',
          url: (item.link || '').trim(),
          guid: item.guid || item.id || null,
          publishedAt: item.isoDate || item.pubDate || null,
          content: item.content || null,
          contentSnippet: item.contentSnippet || null,
          imageUrl: imageUrl?.trim() || null
        };
        })
        .filter((item) => item.url && item.url.startsWith('http')); // Only valid HTTP(S) URLs
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`[RSS] Retry ${attempt}/3 for ${feedUrl}: ${error.message}`);
      }
    }
  ).catch((error) => {
    // Re-throw with context for error handling upstream
    throw new Error(`Failed to fetch RSS feed ${feedUrl} after retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  });
}

export function hashTitle(title: string): string {
  return createHash('md5').update(title.trim().toLowerCase()).digest('hex');
}

