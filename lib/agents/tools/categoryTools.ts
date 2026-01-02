/**
 * Category classification tools for agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { categorizeCluster } from '../../categorize';
import { generateComprehensiveSEO } from '../../openaiClient';

/**
 * Tool: Categorize cluster
 */
export const categorizeClusterTool = tool({
  name: 'categorize_cluster',
  description: 'Determine the primary category for a news cluster from allowed categories: politics, economy, sports, technology, health, education.',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content_excerpt: z.string().nullable().optional(),
    })),
  }),
  execute: async ({ articles }) => {
    try {
      const category = await categorizeCluster(articles);
      
      return {
        category,
        confidence: 'high', // Can be enhanced with actual confidence scoring
      };
    } catch (error) {
      // Default to politics on error
      return {
        category: 'politics',
        confidence: 'low',
      };
    }
  },
});

/**
 * Tool: Extract topics (uses SEO generation for topic extraction)
 */
export const extractTopicsTool = tool({
  name: 'extract_topics',
  description: 'Extract topics from news content. Returns array with geographic scope and content topics.',
  parameters: z.object({
    summary: z.string(),
    headline: z.string(),
    articles: z.array(z.object({
      title: z.string(),
      content_excerpt: z.string().nullable().optional(),
    })),
  }),
  execute: async ({ summary, headline, articles }) => {
    try {
      const seoResult = await generateComprehensiveSEO(summary, headline, articles, 'en');
      
      return {
        topics: seoResult.topics,
        primaryTopic: seoResult.topic,
        geographicScope: seoResult.topics.find(t => t === 'sri-lanka' || t === 'world') || 'sri-lanka',
        contentTopics: seoResult.topics.filter(t => t !== 'sri-lanka' && t !== 'world'),
      };
    } catch (error) {
      throw new Error(`Topic extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

