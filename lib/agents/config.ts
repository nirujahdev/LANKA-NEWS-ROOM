/**
 * Agent configuration and settings
 */

import { env } from '../env';
import { AgentConfig } from './types';

/**
 * Default agent configuration
 */
export const defaultAgentConfig: AgentConfig = {
  enabled: process.env.AGENT_ENABLED === 'true' || false,
  rolloutPercentage: Number(process.env.AGENT_ROLLOUT_PERCENTAGE) || 0,
  useAgentsForComplexCases: process.env.AGENT_USE_FOR_COMPLEX === 'true' || true,
  qualityThreshold: Number(process.env.AGENT_QUALITY_THRESHOLD) || 0.7,
  maxRetries: Number(process.env.AGENT_MAX_RETRIES) || 3,
  timeout: Number(process.env.AGENT_TIMEOUT) || 60000, // 60 seconds
};

/**
 * Get current agent configuration
 */
export function getAgentConfig(): AgentConfig {
  return defaultAgentConfig;
}

/**
 * Check if agents should be used for a specific operation
 */
export function shouldUseAgent(complexity: 'simple' | 'complex' = 'simple'): boolean {
  const config = getAgentConfig();
  
  if (!config.enabled) {
    return false;
  }
  
  // Check rollout percentage
  if (config.rolloutPercentage < 100) {
    const random = Math.random() * 100;
    if (random > config.rolloutPercentage) {
      return false;
    }
  }
  
  // For complex cases, always use agents if enabled
  if (complexity === 'complex' && config.useAgentsForComplexCases) {
    return true;
  }
  
  // For simple cases, use agents only if fully enabled
  return config.enabled && config.rolloutPercentage === 100;
}

/**
 * Agent model configurations
 * IMPORTANT: Use gpt-4o-mini for all operations EXCEPT image selection (use gpt-4o)
 */
export const agentModels = {
  summary: process.env.AGENT_SUMMARY_MODEL || env.SUMMARY_MODEL || 'gpt-4o-mini',
  translation: process.env.AGENT_TRANSLATION_MODEL || env.SUMMARY_TRANSLATE_MODEL || 'gpt-4o-mini',
  seo: process.env.AGENT_SEO_MODEL || 'gpt-4o-mini',
  image: process.env.AGENT_IMAGE_MODEL || 'gpt-4o', // Use gpt-4o for image analysis
  category: process.env.AGENT_CATEGORY_MODEL || 'gpt-4o-mini',
};

/**
 * Agent timeout configurations (in milliseconds)
 * Increased timeouts to allow agents to complete complex multi-step operations
 */
export const agentTimeouts = {
  summary: 120000, // 120 seconds (2 minutes) - agents need time for multiple tool calls
  translation: 120000, // 120 seconds (2 minutes) - translating to multiple languages
  seo: 90000, // 90 seconds - comprehensive SEO generation
  image: 90000, // 90 seconds - image analysis and selection
  category: 30000, // 30 seconds - simple categorization
};

