/**
 * Agent Orchestrator
 * Coordinates multiple agents and decides when to use agents vs direct API calls
 */

import { shouldUseAgent } from './config';
import { AgentContext, SummaryResult, TranslationResult, SEOResult, ImageResult, CategoryResult } from './types';
import { runSummaryAgent, summaryAgentFallback } from './summaryAgent';
import { runTranslationAgent, translationAgentFallback } from './translationAgent';
import { runSEOAgent } from './seoAgent';
import { runImageAgent } from './imageAgent';
import { runCategoryAgent, categoryAgentFallback } from './categoryAgent';
import { detectLanguage } from '../language';

/**
 * Orchestrate summary generation
 */
export async function orchestrateSummaryGeneration(
  articles: Array<{ title: string; content: string; weight?: number; publishedAt?: string }>,
  previousSummary?: string | null,
  sourceLang?: 'en' | 'si' | 'ta'
): Promise<SummaryResult> {
  // Detect source language if not provided
  let detectedLang = sourceLang;
  if (!detectedLang) {
    const combinedText = articles.map(a => `${a.title} ${a.content.slice(0, 200)}`).join(' ');
    detectedLang = await detectLanguage(combinedText);
  }
  
  // Determine complexity
  const complexity = articles.length > 3 || (previousSummary && previousSummary.length > 500) ? 'complex' : 'simple';
  
  // Use agent for complex cases or if enabled
  if (shouldUseAgent(complexity)) {
    console.log(`[Orchestrator] Using agent for summary generation (complexity: ${complexity}, articles: ${articles.length})`);
    try {
      return await runSummaryAgent(
        articles.map(a => ({
          title: a.title,
          content: a.content,
          weight: a.weight,
          publishedAt: a.publishedAt,
        })),
        previousSummary,
        () => summaryAgentFallback(articles.map(a => ({
          title: a.title,
          content: a.content,
          weight: a.weight,
          publishedAt: a.publishedAt,
        })), detectedLang)
      );
    } catch (error) {
      console.error('[Orchestrator] ❌ Summary agent failed, using fallback:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
        articlesCount: articles.length,
        sourceLang: detectedLang,
        timestamp: new Date().toISOString(),
      });
      return summaryAgentFallback(articles.map(a => ({
        title: a.title,
        content: a.content,
        weight: a.weight,
        publishedAt: a.publishedAt,
      })), detectedLang);
    }
  }
  
  console.log(`[Orchestrator] Using direct function for summary (complexity: ${complexity}, agents disabled or rollout < 100%)`);
  
  // Use direct function for simple cases
  return summaryAgentFallback(articles.map(a => ({
    title: a.title,
    content: a.content,
    weight: a.weight,
    publishedAt: a.publishedAt,
  })), detectedLang);
}

/**
 * Orchestrate translation generation
 */
export async function orchestrateTranslation(
  clusterId: string,
  headlineEn: string,
  summaryEn: string,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
): Promise<TranslationResult> {
  // Always use agent for translations (complex multi-step process)
  if (shouldUseAgent('complex')) {
    console.log(`[Orchestrator] Using agent for translation (clusterId: ${clusterId})`);
    try {
      return await runTranslationAgent(
        clusterId,
        headlineEn,
        summaryEn,
        errors,
        () => translationAgentFallback(clusterId, headlineEn, summaryEn, errors)
      );
    } catch (error) {
      console.error('[Orchestrator] ❌ Translation agent failed, using fallback:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        clusterId,
        headlineLength: headlineEn.length,
        summaryLength: summaryEn.length,
        timestamp: new Date().toISOString(),
      });
      return translationAgentFallback(clusterId, headlineEn, summaryEn, errors);
    }
  }
  
  console.log(`[Orchestrator] Using direct function for translation (agents disabled or rollout < 100%)`);
  // Use direct function
  return translationAgentFallback(clusterId, headlineEn, summaryEn, errors);
}

/**
 * Orchestrate SEO generation
 */
export async function orchestrateSEOGeneration(
  summaryEn: string,
  headlineEn: string,
  articles: Array<{ title: string; content_excerpt?: string | null }>
): Promise<SEOResult> {
  // Use agent for SEO (complex entity extraction)
  if (shouldUseAgent('complex')) {
    console.log(`[Orchestrator] Using agent for SEO generation (articles: ${articles.length})`);
    try {
      return await runSEOAgent(summaryEn, headlineEn, articles);
    } catch (error) {
      console.error('[Orchestrator] ❌ SEO agent failed, using fallback:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        articlesCount: articles.length,
        timestamp: new Date().toISOString(),
      });
      // Fallback is built into runSEOAgent
    }
  }
  
  console.log(`[Orchestrator] Using direct function for SEO (agents disabled or rollout < 100%)`);
  // Use direct function (fallback is in runSEOAgent)
  return await runSEOAgent(summaryEn, headlineEn, articles);
}

/**
 * Orchestrate image selection
 */
export async function orchestrateImageSelection(
  headline: string,
  summary: string,
  articles: Array<{
    image_url?: string | null;
    image_urls?: string[] | null;
    url: string;
    content_html?: string | null;
  }>,
  existingImageUrl?: string | null
): Promise<ImageResult> {
  // Determine complexity
  const imageCount = articles.reduce((count, a) => {
    return count + (a.image_url ? 1 : 0) + (a.image_urls?.length || 0);
  }, 0);
  
  const complexity = imageCount === 0 || imageCount > 5 ? 'complex' : 'simple';
  
  // Use agent for complex cases (no images or many images)
  if (shouldUseAgent(complexity)) {
    console.log(`[Orchestrator] Using agent for image selection (complexity: ${complexity}, imageCount: ${imageCount}, existingImage: ${!!existingImageUrl})`);
    try {
      return await runImageAgent(headline, summary, articles, existingImageUrl);
    } catch (error) {
      console.error('[Orchestrator] ❌ Image agent failed, using fallback:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        imageCount,
        articlesCount: articles.length,
        hasExistingImage: !!existingImageUrl,
        timestamp: new Date().toISOString(),
      });
      // Fallback is built into runImageAgent
    }
  }
  
  console.log(`[Orchestrator] Using direct function for image selection (complexity: ${complexity}, agents disabled or rollout < 100%)`);
  // Use direct function (fallback is in runImageAgent)
  return await runImageAgent(headline, summary, articles, existingImageUrl);
}

/**
 * Orchestrate categorization
 */
export async function orchestrateCategorization(
  articles: Array<{ title: string; content_excerpt?: string | null }>
): Promise<CategoryResult> {
  // Use agent for categorization (simple but can be enhanced)
  if (shouldUseAgent('simple')) {
    try {
      return await runCategoryAgent(
        articles,
        () => categoryAgentFallback(articles)
      );
    } catch (error) {
      console.warn('[Orchestrator] Category agent failed, using fallback:', error);
      return categoryAgentFallback(articles);
    }
  }
  
  // Use direct function
  return categoryAgentFallback(articles);
}

/**
 * Check if operation should use agent based on context
 */
export function shouldUseAgentForOperation(
  operation: 'summary' | 'translation' | 'seo' | 'image' | 'category',
  context: {
    articleCount?: number;
    imageCount?: number;
    hasExistingData?: boolean;
    qualityScore?: number;
  }
): boolean {
  // Always use agents for translations (complex)
  if (operation === 'translation') {
    return shouldUseAgent('complex');
  }
  
  // Use agents for complex cases
  if (operation === 'summary' && (context.articleCount || 0) > 3) {
    return shouldUseAgent('complex');
  }
  
  if (operation === 'image' && ((context.imageCount || 0) === 0 || (context.imageCount || 0) > 5)) {
    return shouldUseAgent('complex');
  }
  
  // Use agents for SEO (always complex)
  if (operation === 'seo') {
    return shouldUseAgent('complex');
  }
  
  // Default: use agent if enabled
  return shouldUseAgent('simple');
}

