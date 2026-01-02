/**
 * Image selection tools for agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { analyzeImageRelevance } from '../../imageSelection';
import { extractAllImagesFromHtml, fetchArticleImages } from '../../imageExtraction';

/**
 * Tool: Analyze image relevance
 */
export const analyzeImageRelevanceTool = tool({
  name: 'analyze_image_relevance',
  description: 'Analyze how relevant an image URL is to news content. Returns relevance score and reasoning.',
  parameters: z.object({
    imageUrl: z.string(),
    headline: z.string(),
    summary: z.string(),
  }),
  execute: async ({ imageUrl, headline, summary }) => {
    try {
      // Use existing analyzeImageRelevance function
      const result = await analyzeImageRelevance([imageUrl], headline, summary);
      
      return {
        relevanceScore: result.selectedIndex === 0 ? 0.8 : 0.0, // Simplified scoring
        reason: result.reason,
        isRelevant: result.selectedIndex === 0,
      };
    } catch (error) {
      throw new Error(`Image relevance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Extract images from articles
 */
export const extractImagesFromArticlesTool = tool({
  name: 'extract_images_from_articles',
  description: 'Extract image URLs from RSS feeds and article content. Returns array of image URLs with source information.',
  parameters: z.object({
    articles: z.array(z.object({
      image_url: z.string().nullable().optional(),
      image_urls: z.array(z.string()).nullable().optional(),
      url: z.string(),
      content_html: z.string().nullable().optional(),
    })),
  }),
  execute: async ({ articles }) => {
    try {
      const imageUrls: Array<{ url: string; source: string; priority: number }> = [];
      
      // Priority 1: RSS feed images
      articles.forEach(article => {
        if (article.image_url) {
          imageUrls.push({
            url: article.image_url,
            source: 'RSS Feed',
            priority: 1.0,
          });
        }
        
        if (article.image_urls && Array.isArray(article.image_urls)) {
          article.image_urls.forEach(url => {
            imageUrls.push({
              url,
              source: 'RSS Feed',
              priority: 1.0,
            });
          });
        }
      });
      
      // Priority 2: Extract from HTML content
      articles.forEach(article => {
        if (article.content_html && article.url) {
          const extracted = extractAllImagesFromHtml(article.content_html, article.url);
          extracted.forEach(url => {
            imageUrls.push({
              url,
              source: 'Article Content',
              priority: 0.8,
            });
          });
        }
      });
      
      // Deduplicate
      const uniqueImages = Array.from(
        new Map(imageUrls.map(img => [img.url, img])).values()
      );
      
      return {
        images: uniqueImages,
        count: uniqueImages.length,
        rssCount: uniqueImages.filter(img => img.source === 'RSS Feed').length,
        contentCount: uniqueImages.filter(img => img.source === 'Article Content').length,
      };
    } catch (error) {
      throw new Error(`Image extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Fetch images from article page
 */
export const fetchArticlePageImagesTool = tool({
  name: 'fetch_article_page_images',
  description: 'Fetch and extract images from an article page HTML. Use when RSS feeds don\'t have images.',
  parameters: z.object({
    articleUrl: z.string(),
  }),
  execute: async ({ articleUrl }) => {
    try {
      const images = await fetchArticleImages(articleUrl);
      
      return {
        images,
        count: images.length,
      };
    } catch (error) {
      // Return empty array on error, don't throw
      console.warn(`[ImageTool] Failed to fetch images from ${articleUrl}:`, error);
      return {
        images: [],
        count: 0,
      };
    }
  },
});

/**
 * Tool: Search web for images (placeholder - can be enhanced with actual web search API)
 */
export const searchWebForImagesTool = tool({
  name: 'search_web_for_images',
  description: 'Search the web for relevant news images when none are found in articles. Returns array of image URLs.',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    try {
      // TODO: Implement actual web search API integration
      // For now, return empty array - this can be enhanced with:
      // - Google Image Search API
      // - Bing Image Search API
      // - Unsplash API
      // - Other image search services
      
      console.log(`[ImageTool] Web search requested for: ${query} (max: ${maxResults})`);
      console.log('[ImageTool] Web search not yet implemented - returning empty results');
      
      return {
        images: [],
        count: 0,
        note: 'Web search not yet implemented',
      };
    } catch (error) {
      throw new Error(`Web image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Validate image URL
 */
export const validateImageUrlTool = tool({
  name: 'validate_image_url',
  description: 'Validate that an image URL is valid and accessible.',
  parameters: z.object({
    imageUrl: z.string(),
  }),
  execute: async ({ imageUrl }) => {
    try {
      // Basic URL validation
      const url = new URL(imageUrl);
      const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
      
      // Check if it looks like an image URL
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const hasImageExtension = imageExtensions.some(ext => url.pathname.toLowerCase().includes(ext));
      const hasImagePath = /\/images?\//i.test(url.pathname) || /\/photos?\//i.test(url.pathname) || /\/media\//i.test(url.pathname);
      
      return {
        isValid: isValidProtocol && (hasImageExtension || hasImagePath),
        protocol: url.protocol,
        hasImageExtension,
        hasImagePath,
      };
    } catch {
      return {
        isValid: false,
        protocol: null,
        hasImageExtension: false,
        hasImagePath: false,
      };
    }
  },
});

/**
 * Tool: Filter non-content images
 */
export const filterNonContentImagesTool = tool({
  name: 'filter_non_content_images',
  description: 'Filter out logos, icons, ads, and other non-content images from a list of image URLs.',
  parameters: z.object({
    imageUrls: z.array(z.string()),
  }),
  execute: async ({ imageUrls }) => {
    try {
      const nonContentPatterns = [
        /logo/i, /icon/i, /avatar/i, /badge/i, /button/i,
        /spinner/i, /loading/i, /placeholder/i, /ad[s]?/i,
        /banner/i, /tracking/i, /pixel/i, /beacon/i, /analytics/i,
        /facebook/i, /twitter/i, /instagram/i, /social/i, /share/i,
        /widget/i, /\.ico$/i, /favicon/i
      ];
      
      const filtered = imageUrls.filter(url => {
        const urlLower = url.toLowerCase();
        return !nonContentPatterns.some(pattern => pattern.test(urlLower));
      });
      
      return {
        filteredUrls: filtered,
        removedCount: imageUrls.length - filtered.length,
        keptCount: filtered.length,
      };
    } catch (error) {
      throw new Error(`Image filtering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

