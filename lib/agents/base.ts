/**
 * Base utilities for AI Agents
 */

import { Agent, run, RunResult } from '@openai/agents';
import { AgentConfig, AgentMetrics } from './types';
import { getAgentConfig, agentTimeouts } from './config';

/**
 * Base agent error class
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public agentName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Run agent with timeout and error handling
 */
export async function runAgentWithTimeout<T>(
  agent: Agent,
  input: string | object,
  timeout: number,
  agentName: string
): Promise<RunResult> {
  const timeoutPromise = new Promise<RunResult>((_, reject) => {
    setTimeout(() => {
      const error = new AgentError(`Agent timeout after ${timeout}ms`, agentName);
      console.error(`[Agent:${agentName}] ⏱️ TIMEOUT ERROR:`, {
        timeout: `${timeout}ms`,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      reject(error);
    }, timeout);
  });

  const agentPromise = run(agent, input);

  try {
    return await Promise.race([agentPromise, timeoutPromise]);
  } catch (error) {
    console.error(`[Agent:${agentName}] ❌ EXECUTION ERROR:`, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      inputType: typeof input,
      inputPreview: typeof input === 'string' ? input.substring(0, 200) : JSON.stringify(input).substring(0, 200),
      timestamp: new Date().toISOString(),
    });
    
    if (error instanceof AgentError) {
      throw error;
    }
    throw new AgentError(
      `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      agentName,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Log agent metrics
 */
export function logAgentMetrics(metrics: AgentMetrics): void {
  const config = getAgentConfig();
  
  if (!config.enabled) {
    return;
  }
  
  const logData = {
    agent: metrics.agentName,
    success: metrics.success,
    quality: metrics.qualityScore,
    cost: metrics.cost,
    duration: metrics.duration,
    error: metrics.error,
    timestamp: metrics.timestamp.toISOString(),
  };
  
  if (metrics.success) {
    console.log(`[Agent:${metrics.agentName}] ✅ Success`, {
      quality: metrics.qualityScore,
      duration: `${metrics.duration}ms`,
      cost: metrics.cost ? `~${metrics.cost.toFixed(4)} tokens` : 'unknown',
    });
  } else {
    console.error(`[Agent:${metrics.agentName}] ❌ Failed`, {
      error: metrics.error,
      duration: metrics.duration ? `${metrics.duration}ms` : 'unknown',
    });
  }
}

/**
 * Create agent with default configuration
 */
export function createBaseAgent(config: {
  name: string;
  instructions: string;
  model?: string;
}): Agent {
  return new Agent({
    name: config.name,
    instructions: config.instructions,
    model: config.model || 'gpt-4o-mini',
  });
}

/**
 * Extract final output from agent result
 */
export function extractAgentOutput(result: RunResult): string {
  if (typeof result.finalOutput === 'string') {
    return result.finalOutput;
  }
  
  if (typeof result.finalOutput === 'object') {
    return JSON.stringify(result.finalOutput);
  }
  
  return '';
}

/**
 * Handle agent errors with fallback
 */
export async function withAgentFallback<T>(
  agentFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  agentName: string
): Promise<T> {
  const startTime = Date.now();
  try {
    console.log(`[Agent:${agentName}] 🚀 Starting agent execution...`);
    const result = await agentFn();
    const duration = Date.now() - startTime;
    console.log(`[Agent:${agentName}] ✅ Agent execution completed successfully in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Agent:${agentName}] ⚠️ AGENT FAILED - Using fallback:`, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    logAgentMetrics({
      agentName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date(),
    });
    
    try {
      console.log(`[Agent:${agentName}] 🔄 Executing fallback function...`);
      const fallbackResult = await fallbackFn();
      console.log(`[Agent:${agentName}] ✅ Fallback executed successfully`);
      return fallbackResult;
    } catch (fallbackError) {
      console.error(`[Agent:${agentName}] ❌ FALLBACK ALSO FAILED:`, {
        errorType: fallbackError instanceof Error ? fallbackError.constructor.name : typeof fallbackError,
        errorMessage: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        timestamp: new Date().toISOString(),
      });
      throw fallbackError;
    }
  }
}

