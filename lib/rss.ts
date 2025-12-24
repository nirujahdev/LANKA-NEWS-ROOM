import Parser from 'rss-parser';
import { createHash } from 'crypto';

export type NormalizedItem = {
  title: string;
  url: string;
  guid: string | null;
  publishedAt: string | null;
  content: string | null;
  contentSnippet: string | null;
  imageUrl: string | null;
};

const parser = new Parser();

/**
 * Safely fetches and parses an RSS feed.
 * 
 * SECURITY: Only call with allowlisted URLs from database.
 * Never accept feed URLs from user input or requests.
 */
export async function fetchRssFeed(feedUrl: string): Promise<NormalizedItem[]> {
  try {
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
  } catch (error) {
    // Re-throw with context for error handling upstream
    throw new Error(`Failed to fetch RSS feed ${feedUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function hashTitle(title: string): string {
  return createHash('md5').update(title.trim().toLowerCase()).digest('hex');
}

