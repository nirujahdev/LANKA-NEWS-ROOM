/**
 * SEO generation tools for agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { generateComprehensiveSEO, generateSEOMetadata, generateKeywords, generateKeyFacts, generateConfirmedVsDiffers } from '../../openaiClient';
import { LanguageCode } from '../types';

/**
 * Tool: Generate comprehensive SEO metadata
 */
export const generateSEOTool = tool({
  name: 'generate_seo',
  description: 'Generate comprehensive SEO metadata including titles, descriptions, topics, entities, and districts.',
  parameters: z.object({
    summary: z.string(),
    headline: z.string(),
    articles: z.array(z.object({
      title: z.string(),
      content_excerpt: z.string().nullable().optional(),
    })),
    language: z.enum(['en', 'si', 'ta']),
    preserveTopic: z.string().nullable().optional(),
  }),
  execute: async ({ summary, headline, articles, language, preserveTopic }) => {
    try {
      const result = await generateComprehensiveSEO(
        summary,
        headline,
        articles,
        language,
        preserveTopic
      );
      
      return {
        seoTitle: result.seo_title,
        metaDescription: result.meta_description,
        slug: result.slug,
        ogTitle: result.og_title,
        ogDescription: result.og_description,
        topic: result.topic,
        topics: result.topics,
        district: result.district,
        primaryEntity: result.primary_entity,
        eventType: result.event_type,
      };
    } catch (error) {
      throw new Error(`SEO generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Extract topics from content
 */
export const extractTopicsTool = tool({
  name: 'extract_topics',
  description: 'Extract topics from news content. Returns array with geographic scope (sri-lanka/world) and content topics.',
  parameters: z.object({
    summary: z.string(),
    headline: z.string(),
    articles: z.array(z.object({
      title: z.string(),
      content_excerpt: z.string().optional().nullable(),
    })),
  }),
  execute: async ({ summary, headline, articles }) => {
    try {
      // Use comprehensive SEO to extract topics
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

/**
 * Tool: Extract entities (district, primary entity, event type)
 */
export const extractEntitiesTool = tool({
  name: 'extract_entities',
  description: 'Extract entities from news content: district, primary entity (person/organization), and event type.',
  parameters: z.object({
    summary: z.string(),
    headline: z.string(),
    articles: z.array(z.object({
      title: z.string(),
      content_excerpt: z.string().optional().nullable(),
    })),
  }),
  execute: async ({ summary, headline, articles }) => {
    try {
      const seoResult = await generateComprehensiveSEO(summary, headline, articles, 'en');
      
      return {
        district: seoResult.district,
        primaryEntity: seoResult.primary_entity,
        eventType: seoResult.event_type,
      };
    } catch (error) {
      throw new Error(`Entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Generate keywords
 */
export const generateKeywordsTool = tool({
  name: 'generate_keywords',
  description: 'Generate search keywords from headline, summary, topic, district, and entities.',
  parameters: z.object({
    headline: z.string(),
    summary: z.string(),
    topic: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    primaryEntity: z.string().optional().nullable(),
    eventType: z.string().optional().nullable(),
  }),
  execute: async ({ headline, summary, topic, district, primaryEntity, eventType }) => {
    try {
      const keywords = await generateKeywords(headline, summary, topic || null, district || null, primaryEntity || null, eventType || null);
      
      return {
        keywords,
        count: keywords.length,
      };
    } catch (error) {
      throw new Error(`Keyword generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Generate key facts
 */
export const generateKeyFactsTool = tool({
  name: 'generate_key_facts',
  description: 'Generate key facts array from article sources and summary.',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    summary: z.string(),
    language: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ articles, summary, language }) => {
    try {
      const keyFacts = await generateKeyFacts(
        articles.map(a => ({ title: a.title, content: a.content })),
        summary,
        language
      );
      
      return {
        keyFacts,
        count: keyFacts.length,
      };
    } catch (error) {
      throw new Error(`Key facts generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Generate confirmed vs differs section
 */
export const generateConfirmedVsDiffersTool = tool({
  name: 'generate_confirmed_vs_differs',
  description: 'Generate confirmed vs differs section comparing multiple sources.',
  parameters: z.object({
    articles: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    summary: z.string(),
    language: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ articles, summary, language }) => {
    try {
      const confirmedVsDiffers = await generateConfirmedVsDiffers(
        articles.map(a => ({ title: a.title, content: a.content })),
        summary,
        language
      );
      
      return {
        confirmedVsDiffers,
        length: confirmedVsDiffers.length,
      };
    } catch (error) {
      throw new Error(`Confirmed vs differs generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

