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
  imageUrls: string[] | null; // All extracted images
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
        // Extract image URLs from various RSS feed formats
        const imageUrls: string[] = [];
        
        // Check for media:content or media:thumbnail (common RSS image formats)
        if ((item as any).media?.content) {
          const mediaContent = Array.isArray((item as any).media.content) 
            ? (item as any).media.content 
            : [(item as any).media.content];
          mediaContent.forEach((media: any) => {
            if (media?.$?.url && media?.$?.type?.startsWith('image/')) {
              imageUrls.push(media.$.url);
            }
          });
        }
        
        if ((item as any).media?.thumbnail) {
          const thumbnails = Array.isArray((item as any).media.thumbnail) 
            ? (item as any).media.thumbnail 
            : [(item as any).media.thumbnail];
          thumbnails.forEach((thumb: any) => {
            if (thumb?.$?.url) {
              imageUrls.push(thumb.$.url);
            }
          });
        }
        
        // Check alternative media formats
        if ((item as any)['media:content']) {
          const mediaContent = Array.isArray((item as any)['media:content']) 
            ? (item as any)['media:content'] 
            : [(item as any)['media:content']];
          mediaContent.forEach((media: any) => {
            if (media?.['$']?.url && media?.['$']?.type?.startsWith('image/')) {
              imageUrls.push(media['$'].url);
            }
          });
        }
        
        if ((item as any)['media:thumbnail']) {
          const thumbnails = Array.isArray((item as any)['media:thumbnail']) 
            ? (item as any)['media:thumbnail'] 
            : [(item as any)['media:thumbnail']];
          thumbnails.forEach((thumb: any) => {
            if (thumb?.['$']?.url) {
              imageUrls.push(thumb['$'].url);
            }
          });
        }
        
        // Check enclosure
        if ((item as any).enclosure?.type?.startsWith('image/')) {
          imageUrls.push((item as any).enclosure.url);
        }
        
        // Extract ALL images from HTML content (not just the first one)
        const articleUrl = (item.link || '').trim();
        if (item.content && articleUrl) {
          // Extract from src attribute
          const srcMatches = item.content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
          for (const match of srcMatches) {
            if (match[1]) {
              const resolved = resolveImageUrl(match[1], articleUrl);
              if (resolved) imageUrls.push(resolved);
            }
          }
          
          // Extract from data-src (lazy-loaded images)
          const dataSrcMatches = item.content.matchAll(/<img[^>]+data-src=["']([^"']+)["']/gi);
          for (const match of dataSrcMatches) {
            if (match[1]) {
              const resolved = resolveImageUrl(match[1], articleUrl);
              if (resolved) imageUrls.push(resolved);
            }
          }
          
          // Extract from data-lazy-src
          const lazySrcMatches = item.content.matchAll(/<img[^>]+data-lazy-src=["']([^"']+)["']/gi);
          for (const match of lazySrcMatches) {
            if (match[1]) {
              const resolved = resolveImageUrl(match[1], articleUrl);
              if (resolved) imageUrls.push(resolved);
            }
          }
        }
        
        // Deduplicate and filter invalid URLs
        const validImageUrls = Array.from(new Set(imageUrls))
          .map(url => url?.trim())
          .filter(url => {
            if (!url) return false;
            try {
              new URL(url);
              return url.startsWith('http');
            } catch {
              return false;
            }
          });
        
        // Primary image (first valid one) for backward compatibility
        const imageUrl = validImageUrls.length > 0 ? validImageUrls[0] : null;
        
        return {
          title: item.title?.trim() || 'Untitled',
          url: (item.link || '').trim(),
          guid: item.guid || item.id || null,
          publishedAt: item.isoDate || item.pubDate || null,
          content: item.content || null,
          contentSnippet: item.contentSnippet || null,
          imageUrl: imageUrl,
          imageUrls: validImageUrls.length > 0 ? validImageUrls : null // All images
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

/**
 * Resolve relative image URL to absolute URL
 * @param url - URL (may be relative)
 * @param baseUrl - Base URL of the article
 * @returns Absolute URL or null if invalid
 */
function resolveImageUrl(url: string, baseUrl: string): string | null {
  if (!url || !baseUrl) return null;
  
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Protocol-relative (//example.com/image.jpg)
  if (url.startsWith('//')) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    } catch {
      return null;
    }
  }
  
  // Relative URL
  try {
    const base = new URL(baseUrl);
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

export function hashTitle(title: string): string {
  return createHash('md5').update(title.trim().toLowerCase()).digest('hex');
}

