/**
 * Translation Agent
 * Coordinates multi-language translations with quality assurance
 */

import { Agent } from '@openai/agents';
import { createBaseAgent, runAgentWithTimeout, logAgentMetrics, withAgentFallback } from './base';
import { agentModels, agentTimeouts } from './config';
import { TranslationResult } from './types';
import {
  translateTextTool,
  translateHeadlineTool,
  translateSummaryTool,
  validateTranslationQualityTool,
  validateHeadlineTranslationQualityTool,
} from './tools/translationTools';
import { ensureHeadlineTranslations, ensureSummaryTranslations } from '../pipelineEnhanced';

/**
 * Create Translation Agent
 */
export function createTranslationAgent(): Agent {
  return createBaseAgent({
    name: 'TranslationAgent',
    instructions: `You are an expert translator for a Sri Lankan news platform.

Your task: Ensure 100% translation coverage (EN, SI, TA) with quality >= 0.7.

QUALITY REQUIREMENTS:
- All translations must have quality score >= 0.7
- Preserve all facts, numbers, dates, and names accurately
- Maintain formal news analysis style
- Preserve structure (paragraphs, bullet points, sections)
- Use proper grammar and vocabulary for target language

WORKFLOW:
1. Check existing translations and quality scores
2. Generate missing translations (SI, TA) using appropriate tools
3. Validate quality for each translation
4. Retry if quality < 0.7 (max 2 retries per language)
5. Ensure 100% coverage (fallback to English if needed)
6. Return all translations with quality scores

CRITICAL: Always ensure quality >= 0.7 and 100% coverage before returning.`,
    model: agentModels.translation,
  });
}

/**
 * Run Translation Agent for headlines and summaries
 */
export async function runTranslationAgent(
  clusterId: string,
  headlineEn: string,
  summaryEn: string,
  errors: Array<{ sourceId?: string; stage: string; message: string }>,
  fallbackFn?: () => Promise<TranslationResult>
): Promise<TranslationResult> {
  const agent = createTranslationAgent();
  
  // Add tools to agent
  agent.tools = [
    translateTextTool,
    translateHeadlineTool,
    translateSummaryTool,
    validateTranslationQualityTool,
    validateHeadlineTranslationQualityTool,
  ];
  
  const agentFn = async (): Promise<TranslationResult> => {
    const startTime = Date.now();
    
    try {
      const input = {
        headlineEn,
        summaryEn,
        clusterId,
      };
      
      const result = await runAgentWithTimeout(
        agent,
        JSON.stringify(input),
        agentTimeouts.translation,
        'TranslationAgent'
      );
      
      const output = result.finalOutput;
      
      // Parse agent output or use enhanced functions
      let headlineSi: string;
      let headlineTa: string;
      let summarySi: string;
      let summaryTa: string;
      let qualityScores: TranslationResult['qualityScores'];
      
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          headlineSi = parsed.headlineSi || headlineEn;
          headlineTa = parsed.headlineTa || headlineEn;
          summarySi = parsed.summarySi || summaryEn;
          summaryTa = parsed.summaryTa || summaryEn;
          qualityScores = parsed.qualityScores || {
            headlineSi: 0.7,
            headlineTa: 0.7,
            summarySi: 0.7,
            summaryTa: 0.7,
          };
        } catch {
          // Use enhanced functions as fallback
          const headlineResult = await ensureHeadlineTranslations(clusterId, headlineEn, errors);
          const summaryResult = await ensureSummaryTranslations(clusterId, summaryEn, errors);
          
          headlineSi = headlineResult.headlineSi;
          headlineTa = headlineResult.headlineTa;
          summarySi = summaryResult.summarySi;
          summaryTa = summaryResult.summaryTa;
          qualityScores = {
            headlineSi: headlineResult.qualitySi,
            headlineTa: headlineResult.qualityTa,
            summarySi: summaryResult.qualitySi,
            summaryTa: summaryResult.qualityTa,
          };
        }
      } else {
        // Use enhanced functions
        const headlineResult = await ensureHeadlineTranslations(clusterId, headlineEn, errors);
        const summaryResult = await ensureSummaryTranslations(clusterId, summaryEn, errors);
        
        headlineSi = headlineResult.headlineSi;
        headlineTa = headlineResult.headlineTa;
        summarySi = summaryResult.summarySi;
        summaryTa = summaryResult.summaryTa;
        qualityScores = {
          headlineSi: headlineResult.qualitySi,
          headlineTa: headlineResult.qualityTa,
          summarySi: summaryResult.qualitySi,
          summaryTa: summaryResult.qualityTa,
        };
      }
      
      const duration = Date.now() - startTime;
      const avgQuality = (
        qualityScores.headlineSi +
        qualityScores.headlineTa +
        qualityScores.summarySi +
        qualityScores.summaryTa
      ) / 4;
      
      logAgentMetrics({
        agentName: 'TranslationAgent',
        success: true,
        qualityScore: avgQuality,
        duration,
        timestamp: new Date(),
      });
      
      return {
        headlineSi,
        headlineTa,
        summarySi,
        summaryTa,
        qualityScores,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logAgentMetrics({
        agentName: 'TranslationAgent',
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
    return withAgentFallback(agentFn, fallbackFn, 'TranslationAgent');
  }
  
  return agentFn();
}

/**
 * Fallback function for translations
 */
export async function translationAgentFallback(
  clusterId: string,
  headlineEn: string,
  summaryEn: string,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
): Promise<TranslationResult> {
  const headlineResult = await ensureHeadlineTranslations(clusterId, headlineEn, errors);
  const summaryResult = await ensureSummaryTranslations(clusterId, summaryEn, errors);
  
  return {
    headlineSi: headlineResult.headlineSi,
    headlineTa: headlineResult.headlineTa,
    summarySi: summaryResult.summarySi,
    summaryTa: summaryResult.summaryTa,
    qualityScores: {
      headlineSi: headlineResult.qualitySi,
      headlineTa: headlineResult.qualityTa,
      summarySi: summaryResult.qualitySi,
      summaryTa: summaryResult.qualityTa,
    },
  };
}

