/**
 * Summary Generation Agent
 * Generates high-quality news summaries with automatic quality control
 */

import { Agent } from '@openai/agents';
import { createBaseAgent, runAgentWithTimeout, logAgentMetrics, withAgentFallback } from './base';
import { agentModels, agentTimeouts } from './config';
import { SummaryResult, ArticleSource, LanguageCode } from './types';
import {
  generateSummaryTool,
  validateSummaryQualityTool,
  detectSourceLanguageTool,
  weightSourcesTool,
} from './tools/summaryTools';
import { generateQualityControlledSummary } from '../pipelineEnhanced';

/**
 * Create Summary Generation Agent
 */
export function createSummaryAgent(): Agent {
  return createBaseAgent({
    name: 'SummaryGenerationAgent',
    instructions: `You are an expert news analyst for a Sri Lankan news aggregation platform.

Your task: Generate high-quality analytical news summaries from multiple article sources.

QUALITY REQUIREMENTS:
- Summary quality score must be >= 0.7 (70%)
- Summary length: 400-1000 words (comprehensive, detailed coverage)
- Structure: Lead paragraph, main body, "Why this matters", "What to watch next"
- Tone: Calm, factual, professional, neutral, analytical
- Multi-source verification: Prioritize facts confirmed by 2+ sources
- Source attribution: Note "according to one source" for single-source facts

WORKFLOW:
1. Detect source language (EN/SI/TA)
2. Weight sources (government sources 2x, recent articles higher)
3. Generate summary using generate_summary tool
4. Validate quality using validate_summary_quality tool
5. If quality < 0.7, regenerate with adjusted approach (max 3 attempts)
6. Return summary with quality score

CRITICAL: Always ensure quality score >= 0.7 before returning.`,
    model: agentModels.summary,
  });
}

/**
 * Run Summary Generation Agent
 */
export async function runSummaryAgent(
  articles: ArticleSource[],
  previousSummary?: string | null,
  fallbackFn?: () => Promise<SummaryResult>,
  context?: { clusterId?: string; summaryId?: string }
): Promise<SummaryResult> {
  const agent = createSummaryAgent();
  
  // Add tools to agent
  agent.tools = [
    generateSummaryTool,
    validateSummaryQualityTool,
    detectSourceLanguageTool,
    weightSourcesTool,
  ];
  
  const agentFn = async (): Promise<SummaryResult> => {
    const startTime = Date.now();
    
    try {
      const input = {
        articles: articles.map(a => ({
          title: a.title,
          content: a.content || a.content_excerpt || '',
          weight: a.weight,
          publishedAt: a.publishedAt,
        })),
        previousSummary: previousSummary || null,
      };
      
      const result = await runAgentWithTimeout(
        agent,
        JSON.stringify(input),
        agentTimeouts.summary,
        'SummaryGenerationAgent'
      );
      
      const output = result.finalOutput;
      
      // Parse agent output
      let summary: string;
      let qualityScore = 0;
      let sourceLang: LanguageCode = 'en';
      
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          summary = parsed.summary || output;
          qualityScore = parsed.qualityScore || 0.7;
          sourceLang = parsed.sourceLang || 'en';
        } catch {
          summary = output;
          // Validate quality
          const qualityCheck = await validateSummaryQualityTool.execute({ summary });
          qualityScore = qualityCheck.score / 100;
        }
      } else {
        summary = JSON.stringify(output);
        qualityScore = 0.7;
      }
      
      const duration = Date.now() - startTime;
      
      await logAgentMetrics({
        agentName: 'SummaryGenerationAgent',
        success: true,
        qualityScore,
        duration,
        timestamp: new Date(),
      }, {
        clusterId: context?.clusterId,
        summaryId: context?.summaryId,
        inputData: {
          articleCount: articles.length,
          previousSummary: previousSummary ? 'exists' : 'none',
        },
        outputData: {
          summaryLength: summary.length,
          qualityScore,
          sourceLang,
        },
      });
      
      return {
        summary,
        qualityScore,
        length: summary.length,
        sourceLang,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await logAgentMetrics({
        agentName: 'SummaryGenerationAgent',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date(),
      }, {
        clusterId: context?.clusterId,
        summaryId: context?.summaryId,
        inputData: {
          articleCount: articles.length,
        },
      });
      
      throw error;
    }
  };
  
  // Use fallback if provided
  if (fallbackFn) {
    return withAgentFallback(agentFn, fallbackFn, 'SummaryGenerationAgent');
  }
  
  return agentFn();
}

/**
 * Fallback function for summary generation
 */
export async function summaryAgentFallback(
  articles: ArticleSource[],
  sourceLang: LanguageCode
): Promise<SummaryResult> {
  const result = await generateQualityControlledSummary(
    articles.map(a => ({
      title: a.title,
      content_excerpt: a.content || a.content_excerpt || '',
      content_text: a.content || a.content_excerpt || '',
    })),
    sourceLang,
    500
  );
  
  return {
    summary: result.summary,
    qualityScore: result.qualityScore,
    length: result.length,
    sourceLang,
  };
}

