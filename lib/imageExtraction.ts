/**
 * Image extraction utilities for extracting images from HTML content
 */

/**
 * Extract all image URLs from HTML content
 * @param html - HTML content string
 * @param baseUrl - Base URL for resolving relative URLs
 * @returns Array of absolute image URLs
 */
export function extractAllImagesFromHtml(html: string, baseUrl: string): string[] {
  if (!html || !baseUrl) return [];

  const imageUrls: string[] = [];

  try {
    // Extract from src attribute
    const srcMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of srcMatches) {
      if (match[1]) {
        imageUrls.push(resolveUrl(match[1], baseUrl));
      }
    }

    // Extract from data-src (lazy-loaded images)
    const dataSrcMatches = html.matchAll(/<img[^>]+data-src=["']([^"']+)["']/gi);
    for (const match of dataSrcMatches) {
      if (match[1]) {
        imageUrls.push(resolveUrl(match[1], baseUrl));
      }
    }

    // Extract from data-lazy-src
    const lazySrcMatches = html.matchAll(/<img[^>]+data-lazy-src=["']([^"']+)["']/gi);
    for (const match of lazySrcMatches) {
      if (match[1]) {
        imageUrls.push(resolveUrl(match[1], baseUrl));
      }
    }

    // Extract from data-original (another lazy-load pattern)
    const dataOriginalMatches = html.matchAll(/<img[^>]+data-original=["']([^"']+)["']/gi);
    for (const match of dataOriginalMatches) {
      if (match[1]) {
        imageUrls.push(resolveUrl(match[1], baseUrl));
      }
    }

    // Extract from background-image in style attributes
    const styleMatches = html.matchAll(/style=["'][^"']*background-image:\s*url\(["']?([^"')]+)["']?\)/gi);
    for (const match of styleMatches) {
      if (match[1]) {
        imageUrls.push(resolveUrl(match[1], baseUrl));
      }
    }
  } catch (error) {
    console.error('[ImageExtraction] Error extracting images from HTML:', error);
  }

  // Deduplicate and filter
  const uniqueUrls = Array.from(new Set(imageUrls))
    .filter(url => {
      if (!url) return false;
      try {
        new URL(url);
        return url.startsWith('http') && isValidImageUrl(url);
      } catch {
        return false;
      }
    })
    .filter(url => !isNonContentImage(url)); // Filter out logos, icons, ads

  return uniqueUrls;
}

/**
 * Resolve relative URL to absolute URL
 * @param url - URL (may be relative)
 * @param baseUrl - Base URL
 * @returns Absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return '';

  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative
  if (url.startsWith('//')) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    } catch {
      return url;
    }
  }

  // Relative URL
  try {
    const base = new URL(baseUrl);
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/**
 * Check if URL is a valid image URL
 * @param url - URL to check
 * @returns True if valid image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const urlLower = url.toLowerCase();

  // Check extension
  const hasImageExtension = imageExtensions.some(ext => urlLower.includes(ext));

  // Check if URL contains image-related paths
  const hasImagePath = /\/images?\//i.test(url) || 
                      /\/photos?\//i.test(url) || 
                      /\/media\//i.test(url) ||
                      /\/img\//i.test(url);

  // Must have either extension or image path, and not be a data URL
  return (hasImageExtension || hasImagePath) && !url.startsWith('data:');
}

/**
 * Filter out non-content images (logos, icons, ads, etc.)
 * @param url - URL to check
 * @returns True if should be filtered out
 */
function isNonContentImage(url: string): boolean {
  if (!url) return true;

  const urlLower = url.toLowerCase();

  // Common patterns for non-content images
  const nonContentPatterns = [
    /logo/i,
    /icon/i,
    /avatar/i,
    /badge/i,
    /button/i,
    /spinner/i,
    /loading/i,
    /placeholder/i,
    /ad[s]?/i,
    /banner/i,
    /tracking/i,
    /pixel/i,
    /beacon/i,
    /analytics/i,
    /facebook/i,
    /twitter/i,
    /instagram/i,
    /social/i,
    /share/i,
    /widget/i,
    /\.ico$/i, // Favicons
    /favicon/i
  ];

  return nonContentPatterns.some(pattern => pattern.test(urlLower));
}

/**
 * Fetch article page and extract images
 * @param articleUrl - URL of the article page
 * @returns Array of image URLs found on the page
 */
export async function fetchArticleImages(articleUrl: string): Promise<string[]> {
  if (!articleUrl || !articleUrl.startsWith('http')) {
    return [];
  }

  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LankaNewsRoom/1.0; +https://lankanewsroom.xyz)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`[ImageExtraction] Failed to fetch article: ${response.status} ${response.statusText}`);
      return [];
    }

    const html = await response.text();
    return extractAllImagesFromHtml(html, articleUrl);
  } catch (error) {
    console.error(`[ImageExtraction] Error fetching article images from ${articleUrl}:`, error);
    return [];
  }
}

