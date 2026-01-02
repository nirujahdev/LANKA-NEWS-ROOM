/**
 * Category Agent
 * Categorizes news clusters by topic
 */

import { Agent } from '@openai/agents';
import { createBaseAgent, runAgentWithTimeout, logAgentMetrics, withAgentFallback } from './base';
import { agentModels, agentTimeouts } from './config';
import { CategoryResult } from './types';
import { categorizeClusterTool, extractTopicsTool } from './tools/categoryTools';
import { categorizeCluster } from '../categorize';

/**
 * Create Category Agent
 */
export function createCategoryAgent(): Agent {
  return createBaseAgent({
    name: 'CategoryAgent',
    instructions: `You are an expert at categorizing news articles into appropriate topics.

Your task: Determine the primary category for a news cluster.

ALLOWED CATEGORIES:
- politics: Government, elections, policy, parliament
- economy: Finance, markets, prices, business
- sports: Cricket, football, matches, tournaments
- technology: Digital, cyber, computers, internet
- health: Disease, hospitals, medical services
- education: Schools, universities, exams

WORKFLOW:
1. Analyze cluster articles using categorize_cluster tool
2. Determine primary category
3. Extract additional topics if applicable
4. Return category

CRITICAL: Always return exactly one category from the allowed list. Default to 'politics' if uncertain.`,
    model: agentModels.category,
  });
}

/**
 * Run Category Agent
 */
export async function runCategoryAgent(
  articles: Array<{ title: string; content_excerpt?: string | null }>,
  fallbackFn?: () => Promise<CategoryResult>,
  context?: { clusterId?: string; summaryId?: string }
): Promise<CategoryResult> {
  const agent = createCategoryAgent();
  
  // Add tools to agent
  agent.tools = [
    categorizeClusterTool,
    extractTopicsTool,
  ];
  
  const agentFn = async (): Promise<CategoryResult> => {
    const startTime = Date.now();
    
    try {
      const input = {
        articles,
      };
      
      const result = await runAgentWithTimeout(
        agent,
        JSON.stringify(input),
        agentTimeouts.category,
        'CategoryAgent'
      );
      
      const output = result.finalOutput;
      
      // Parse agent output or use direct function
      let categoryResult: CategoryResult;
      
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          categoryResult = {
            category: parsed.category || 'politics',
            topics: parsed.topics,
          };
        } catch {
          // Use direct function as fallback
          const category = await categorizeCluster(articles);
          categoryResult = { category };
        }
      } else {
        // Use direct function
        const category = await categorizeCluster(articles);
        categoryResult = { category };
      }
      
      const duration = Date.now() - startTime;
      
      await logAgentMetrics({
        agentName: 'CategoryAgent',
        success: true,
        qualityScore: 0.8, // Default quality for category
        duration,
        timestamp: new Date(),
      }, {
        clusterId: context?.clusterId,
        summaryId: context?.summaryId,
        inputData: {
          articleCount: articles.length,
        },
        outputData: {
          category: categoryResult.category,
          topics: categoryResult.topics,
        },
      });
      
      return categoryResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await logAgentMetrics({
        agentName: 'CategoryAgent',
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
    return withAgentFallback(agentFn, fallbackFn, 'CategoryAgent');
  }
  
  return agentFn();
}

/**
 * Fallback function for categorization
 */
export async function categoryAgentFallback(
  articles: Array<{ title: string; content_excerpt?: string | null }>
): Promise<CategoryResult> {
  const category = await categorizeCluster(articles);
  return { category };
}

