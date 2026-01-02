/**
 * Summary generation tools for agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { summarizeEnglish, summarizeInSourceLanguage, validateSummaryQuality } from '../../openaiClient';
import { detectLanguage } from '../../language';
import { ArticleSource, LanguageCode } from '../types';

/**
 * Tool: Generate summary from articles
 */
export const generateSummaryTool = tool({
  name: 'generate_summary',
  description: 'Generate a comprehensive news summary from multiple article sources. Handles English, Sinhala, and Tamil source languages.',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content: z.string(),
      weight: z.number().optional(),
      publishedAt: z.string().optional(),
    })),
    sourceLang: z.enum(['en', 'si', 'ta']),
    previousSummary: z.string().optional().nullable(),
  }),
  execute: async ({ articles, sourceLang, previousSummary }) => {
    try {
      let summary: string;
      
      if (sourceLang === 'en') {
        summary = await summarizeEnglish(
          articles.map(a => ({ title: a.title, content: a.content })),
          previousSummary || undefined
        );
      } else {
        summary = await summarizeInSourceLanguage(
          articles.map(a => ({
            title: a.title,
            content: a.content,
            weight: a.weight,
            publishedAt: a.publishedAt,
          })),
          sourceLang,
          previousSummary || undefined
        );
      }
      
      return {
        summary,
        length: summary.length,
        wordCount: summary.trim().split(/\s+/).length,
      };
    } catch (error) {
      throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Validate summary quality
 */
export const validateSummaryQualityTool = tool({
  name: 'validate_summary_quality',
  description: 'Validate the quality of a generated summary. Returns quality score (0-100) and list of issues.',
  parameters: z.object({
    summary: z.string(),
  }),
  execute: async ({ summary }) => {
    try {
      const result = validateSummaryQuality(summary);
      return {
        isValid: result.isValid,
        score: result.score,
        issues: result.issues,
        wordCount: summary.trim().split(/\s+/).length,
      };
    } catch (error) {
      throw new Error(`Quality validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Detect source language
 */
export const detectSourceLanguageTool = tool({
  name: 'detect_source_language',
  description: 'Detect the language of article sources (English, Sinhala, or Tamil).',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    sourceHint: z.enum(['en', 'si', 'ta']).optional().nullable(),
  }),
  execute: async ({ articles, sourceHint }) => {
    try {
      const combinedText = articles
        .map(a => `${a.title} ${a.content.slice(0, 200)}`)
        .join(' ');
      
      const detected = await detectLanguage(combinedText, sourceHint || undefined);
      return {
        language: detected,
        confidence: 'high', // Can be enhanced with actual confidence scoring
      };
    } catch (error) {
      // Fallback to English on error
      return {
        language: 'en' as LanguageCode,
        confidence: 'low',
      };
    }
  },
});

/**
 * Tool: Weight sources by importance
 */
export const weightSourcesTool = tool({
  name: 'weight_sources',
  description: 'Apply weighting to article sources based on recency, source type (government/official), and importance.',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content: z.string(),
      url: z.string().optional(),
      publishedAt: z.string().optional(),
    })),
  }),
  execute: async ({ articles }) => {
    try {
      const isGovernmentSource = (url: string): boolean => {
        const govPatterns = [
          /\.gov\.lk/i, /\.gov\./i, /ministry/i, /department/i, /parliament/i,
          /president/i, /prime.?minister/i, /cabinet/i, /official/i,
          /press.?release/i, /announcement/i, /\.go\.jp/i
        ];
        return govPatterns.some(pattern => pattern.test(url));
      };
      
      const weighted = articles.map((article, idx) => {
        // Base weight: first article gets 1.5x
        let weight = idx === 0 ? 1.5 : 1.0;
        
        // Recency boost: more recent = higher weight
        const recency = article.publishedAt
          ? Math.max(0, 1 - (Date.now() - new Date(article.publishedAt).getTime()) / (7 * 24 * 60 * 60 * 1000))
          : 0.5;
        
        // Government source boost: 2x weight
        const isGov = article.url ? isGovernmentSource(article.url) : false;
        if (isGov) {
          weight *= 2.0;
        }
        
        // Final weight with recency adjustment
        const finalWeight = weight * (1 + recency * 0.3);
        
        return {
          ...article,
          weight: finalWeight,
          isGovernmentSource: isGov,
          recencyScore: recency,
        };
      });
      
      // Sort by weight (highest first)
      weighted.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      
      return {
        weightedArticles: weighted,
        totalWeight: weighted.reduce((sum, a) => sum + (a.weight || 0), 0),
        governmentSources: weighted.filter(a => a.isGovernmentSource).length,
      };
    } catch (error) {
      throw new Error(`Source weighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

