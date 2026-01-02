/**
 * SEO Generation Agent
 * Generates comprehensive SEO metadata with entity extraction
 */

import { Agent } from '@openai/agents';
import { createBaseAgent, runAgentWithTimeout, logAgentMetrics, withAgentFallback } from './base';
import { agentModels, agentTimeouts } from './config';
import { SEOResult } from './types';
import {
  generateSEOTool,
  extractTopicsTool,
  extractEntitiesTool,
  generateKeywordsTool,
  generateKeyFactsTool,
  generateConfirmedVsDiffersTool,
} from './tools/seoTools';
import { generateComprehensiveSEO, generateSEOMetadata, generateKeywords, generateKeyFacts, generateConfirmedVsDiffers } from '../openaiClient';

/**
 * Create SEO Generation Agent
 */
export function createSEOAgent(): Agent {
  return createBaseAgent({
    name: 'SEOGenerationAgent',
    instructions: `You are an SEO expert for a Sri Lankan news platform.

Your task: Generate comprehensive SEO metadata including titles, descriptions, topics, entities, and keywords.

SEO REQUIREMENTS:
- Meta titles: 50-65 chars, insight-based phrasing
- Meta descriptions: 150-160 chars, focus on public impact
- Topics: Always include geographic scope (sri-lanka/world) + content topic
- Entities: Extract district, primary entity, event type
- Keywords: Generate relevant search keywords
- Key facts: Extract key facts in all languages
- Confirmed vs differs: Compare sources for all languages

WORKFLOW:
1. Generate comprehensive SEO (EN) using generate_seo tool
2. Extract topics ensuring 2-topic system (geographic + content)
3. Extract entities (district, primary_entity, event_type)
4. Generate keywords
5. Generate key facts (EN, SI, TA)
6. Generate confirmed vs differs (EN, SI, TA)
7. Generate SEO for SI and TA languages
8. Return complete SEO package

CRITICAL: Always ensure topics array has at least 2 topics (geographic + content).`,
    model: agentModels.seo,
  });
}

/**
 * Run SEO Generation Agent
 */
export async function runSEOAgent(
  summaryEn: string,
  headlineEn: string,
  articles: Array<{ title: string; content_excerpt?: string | null }>,
  fallbackFn?: () => Promise<SEOResult>
): Promise<SEOResult> {
  const agent = createSEOAgent();
  
  // Add tools to agent
  agent.tools = [
    generateSEOTool,
    extractTopicsTool,
    extractEntitiesTool,
    generateKeywordsTool,
    generateKeyFactsTool,
    generateConfirmedVsDiffersTool,
  ];
  
  const agentFn = async (): Promise<SEOResult> => {
    const startTime = Date.now();
    
    try {
      const input = {
        summaryEn,
        headlineEn,
        articles,
      };
      
      const result = await runAgentWithTimeout(
        agent,
        JSON.stringify(input),
        agentTimeouts.seo,
        'SEOGenerationAgent'
      );
      
      const output = result.finalOutput;
      
      // Parse agent output or use direct functions
      let seoResult: SEOResult;
      
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          seoResult = parsed;
        } catch {
          // Use direct functions as fallback
          seoResult = await generateSEOFallback(summaryEn, headlineEn, articles);
        }
      } else {
        // Use direct functions
        seoResult = await generateSEOFallback(summaryEn, headlineEn, articles);
      }
      
      const duration = Date.now() - startTime;
      
      logAgentMetrics({
        agentName: 'SEOGenerationAgent',
        success: true,
        duration,
        timestamp: new Date(),
      });
      
      return seoResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logAgentMetrics({
        agentName: 'SEOGenerationAgent',
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
    return withAgentFallback(agentFn, fallbackFn, 'SEOGenerationAgent');
  }
  
  return agentFn();
}

/**
 * Fallback function for SEO generation
 */
async function generateSEOFallback(
  summaryEn: string,
  headlineEn: string,
  articles: Array<{ title: string; content_excerpt?: string | null }>
): Promise<SEOResult> {
  // Generate comprehensive SEO for English
  const seoEnResult = await generateComprehensiveSEO(summaryEn, headlineEn, articles, 'en');
  
  // Generate SEO for SI and TA
  const [seoSi, seoTa] = await Promise.all([
    generateSEOMetadata(summaryEn, headlineEn, 'si').catch(() => ({
      title: headlineEn.slice(0, 60),
      description: summaryEn.slice(0, 160),
    })),
    generateSEOMetadata(summaryEn, headlineEn, 'ta').catch(() => ({
      title: headlineEn.slice(0, 60),
      description: summaryEn.slice(0, 160),
    })),
  ]);
  
  // Generate key facts and confirmed vs differs
  const sourcePayload = articles.map(a => ({
    title: a.title,
    content: a.content_excerpt || '',
  }));
  
  const [keyFactsEn, keyFactsSi, keyFactsTa] = await Promise.all([
    generateKeyFacts(sourcePayload, summaryEn, 'en').catch(() => []),
    generateKeyFacts(sourcePayload, summaryEn, 'si').catch(() => []),
    generateKeyFacts(sourcePayload, summaryEn, 'ta').catch(() => []),
  ]);
  
  const [confirmedDiffersEn, confirmedDiffersSi, confirmedDiffersTa] = await Promise.all([
    generateConfirmedVsDiffers(sourcePayload, summaryEn, 'en').catch(() => ''),
    generateConfirmedVsDiffers(sourcePayload, summaryEn, 'si').catch(() => ''),
    generateConfirmedVsDiffers(sourcePayload, summaryEn, 'ta').catch(() => ''),
  ]);
  
  // Generate keywords
  const keywords = await generateKeywords(
    headlineEn,
    summaryEn,
    seoEnResult.topic,
    seoEnResult.district,
    seoEnResult.primary_entity,
    seoEnResult.event_type
  ).catch(() => ['Sri Lanka']);
  
  return {
    seoEn: {
      title: seoEnResult.seo_title,
      description: seoEnResult.meta_description,
    },
    seoSi: {
      title: seoSi.title,
      description: seoSi.description,
    },
    seoTa: {
      title: seoTa.title,
      description: seoTa.description,
    },
    topics: seoEnResult.topics,
    district: seoEnResult.district,
    entities: {
      primary_entity: seoEnResult.primary_entity,
      event_type: seoEnResult.event_type,
    },
    keywords,
    keyFacts: {
      en: keyFactsEn,
      si: keyFactsSi,
      ta: keyFactsTa,
    },
    confirmedVsDiffers: {
      en: confirmedDiffersEn,
      si: confirmedDiffersSi,
      ta: confirmedDiffersTa,
    },
  };
}

