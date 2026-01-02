/**
 * Image Selection Agent
 * Intelligent image selection with web search fallback
 */

import { Agent } from '@openai/agents';
import { createBaseAgent, runAgentWithTimeout, logAgentMetrics, withAgentFallback } from './base';
import { agentModels, agentTimeouts } from './config';
import { ImageResult } from './types';
import {
  analyzeImageRelevanceTool,
  extractImagesFromArticlesTool,
  fetchArticlePageImagesTool,
  searchWebForImagesTool,
  validateImageUrlTool,
  filterNonContentImagesTool,
} from './tools/imageTools';
import { selectBestImage } from '../imageSelection';
import { extractAllImagesFromHtml, fetchArticleImages } from '../imageExtraction';

/**
 * Create Image Selection Agent
 */
export function createImageAgent(): Agent {
  return createBaseAgent({
    name: 'ImageSelectionAgent',
    instructions: `You are an expert at finding and selecting the most relevant news images.

Your task: Select the best image for a news article with relevance score >= 0.7.

SELECTION CRITERIA (priority order):
1. RELEVANCE: Image must directly relate to main topic/event
2. CONTENT MATCH: Image should show actual subject matter
3. NEWS VALUE: Prefer actual news events over stock photos
4. QUALITY: Prefer clear, high-resolution images
5. CONTEXT: Suitable for news context (no ads, logos, placeholders)

WORKFLOW:
1. Check if cluster already has image (reuse if good)
2. Extract images from articles (RSS feeds, content, pages)
3. Filter out non-content images (logos, ads, placeholders)
4. If images found: Analyze relevance and select best
5. If no images: Search web for relevant images
6. Validate selected image URL
7. Calculate relevance and quality scores
8. Return selected image with scores

CRITICAL: Always ensure relevance score >= 0.7. Search web if no images found.`,
    model: agentModels.image,
  });
}

/**
 * Run Image Selection Agent
 */
export async function runImageAgent(
  headline: string,
  summary: string,
  articles: Array<{
    image_url?: string | null;
    image_urls?: string[] | null;
    url: string;
    content_html?: string | null;
  }>,
  existingImageUrl?: string | null,
  fallbackFn?: () => Promise<ImageResult>
): Promise<ImageResult> {
  const agent = createImageAgent();
  
  // Add tools to agent
  agent.tools = [
    analyzeImageRelevanceTool,
    extractImagesFromArticlesTool,
    fetchArticlePageImagesTool,
    searchWebForImagesTool,
    validateImageUrlTool,
    filterNonContentImagesTool,
  ];
  
  const agentFn = async (): Promise<ImageResult> => {
    const startTime = Date.now();
    
    try {
      // Check existing image first
      if (existingImageUrl && existingImageUrl.startsWith('http')) {
        try {
          new URL(existingImageUrl);
          const duration = Date.now() - startTime;
          
          logAgentMetrics({
            agentName: 'ImageSelectionAgent',
            success: true,
            qualityScore: 0.8,
            duration,
            timestamp: new Date(),
          });
          
          return {
            imageUrl: existingImageUrl,
            relevanceScore: 0.8,
            qualityScore: 1.0,
            source: 'Existing Cluster',
          };
        } catch {
          // Invalid URL, continue
        }
      }
      
      const input = {
        headline,
        summary,
        articles,
      };
      
      const result = await runAgentWithTimeout(
        agent,
        JSON.stringify(input),
        agentTimeouts.image,
        'ImageSelectionAgent'
      );
      
      const output = result.finalOutput;
      
      // Parse agent output or use direct functions
      let imageResult: ImageResult;
      
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          imageResult = {
            imageUrl: parsed.imageUrl || null,
            relevanceScore: parsed.relevanceScore || 0.8,
            qualityScore: parsed.qualityScore || 1.0,
            source: parsed.source || 'Agent Selection',
          };
        } catch {
          // Use direct functions as fallback
          imageResult = await imageSelectionFallback(headline, summary, articles);
        }
      } else {
        // Use direct functions
        imageResult = await imageSelectionFallback(headline, summary, articles);
      }
      
      const duration = Date.now() - startTime;
      
      logAgentMetrics({
        agentName: 'ImageSelectionAgent',
        success: true,
        qualityScore: imageResult.relevanceScore,
        duration,
        timestamp: new Date(),
      });
      
      return imageResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logAgentMetrics({
        agentName: 'ImageSelectionAgent',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      });
      
      throw error;
    }
  };
  
  // Use fallback if provided
  if (fallbackFn) {
    return withAgentFallback(agentFn, fallbackFn, 'ImageSelectionAgent');
  }
  
  return agentFn();
}

/**
 * Fallback function for image selection
 */
async function imageSelectionFallback(
  headline: string,
  summary: string,
  articles: Array<{
    image_url?: string | null;
    image_urls?: string[] | null;
    url: string;
    content_html?: string | null;
  }>
): Promise<ImageResult> {
  // Collect images from all sources
  const availableImages: Array<{ url: string; source: string }> = [];
  
  // From RSS feeds
  articles.forEach(article => {
    if (article.image_url) {
      availableImages.push({ url: article.image_url, source: 'RSS Feed' });
    }
    if (article.image_urls && Array.isArray(article.image_urls)) {
      article.image_urls.forEach(url => {
        availableImages.push({ url, source: 'RSS Feed' });
      });
    }
  });
  
  // From article content
  articles.forEach(article => {
    if (article.content_html && article.url) {
      const extracted = extractAllImagesFromHtml(article.content_html, article.url);
      extracted.forEach(url => {
        availableImages.push({ url, source: 'Article Content' });
      });
    }
  });
  
  // From article pages (only if we have few images)
  if (availableImages.length < 3 && articles.length > 0) {
    const firstArticle = articles[0];
    if (firstArticle.url) {
      try {
        const pageImages = await fetchArticleImages(firstArticle.url);
        pageImages.forEach(url => {
          availableImages.push({ url, source: 'Article Page' });
        });
      } catch {
        // Ignore errors
      }
    }
  }
  
  // Deduplicate
  const uniqueImages = Array.from(
    new Map(availableImages.map(img => [img.url, img])).values()
  );
  
  if (uniqueImages.length === 0) {
    return {
      imageUrl: null,
      relevanceScore: 0,
      qualityScore: 0,
      source: 'None',
    };
  }
  
  // Use existing selectBestImage function
  const selected = await selectBestImage(uniqueImages, headline, summary);
  
  if (!selected) {
    return {
      imageUrl: uniqueImages[0]?.url || null,
      relevanceScore: 0.6,
      qualityScore: 0.8,
      source: uniqueImages[0]?.source || 'First Available',
    };
  }
  
  return {
    imageUrl: selected,
    relevanceScore: 0.8,
    qualityScore: 1.0,
    source: uniqueImages.find(img => img.url === selected)?.source || 'Selected',
  };
}

