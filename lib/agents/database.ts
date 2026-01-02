/**
 * Database operations for AI Agents
 * Handles writing agent operations to the database
 */

import { supabaseAdmin } from '../supabaseAdmin';
import { AgentMetrics } from './types';

export interface AgentOperationInput {
  clusterId: string;
  summaryId?: string | null;
  agentType: 'summary' | 'translation' | 'seo' | 'image' | 'category';
  agentVersion?: string;
  operationStatus: 'success' | 'failed' | 'timeout';
  durationMs?: number;
  tokenCount?: number;
  costUsd?: number;
  qualityScore?: number;
  qualityBreakdown?: Record<string, any>;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorMessage?: string | null;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Write agent operation to database
 */
export async function writeAgentOperation(
  operation: AgentOperationInput
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('agent_operations')
      .insert({
        cluster_id: operation.clusterId,
        summary_id: operation.summaryId || null,
        agent_type: operation.agentType,
        agent_version: operation.agentVersion || 'v1.0',
        operation_status: operation.operationStatus,
        duration_ms: operation.durationMs || null,
        token_count: operation.tokenCount || null,
        cost_usd: operation.costUsd || null,
        quality_score: operation.qualityScore || null,
        quality_breakdown: operation.qualityBreakdown || null,
        input_data: operation.inputData || null,
        output_data: operation.outputData || null,
        error_message: operation.errorMessage || null,
        started_at: operation.startedAt?.toISOString() || new Date().toISOString(),
        completed_at: operation.completedAt?.toISOString() || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Agent:DB] Failed to write agent operation:`, {
        error: error.message,
        agentType: operation.agentType,
        clusterId: operation.clusterId,
      });
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error(`[Agent:DB] Error writing agent operation:`, {
      error: error instanceof Error ? error.message : String(error),
      agentType: operation.agentType,
      clusterId: operation.clusterId,
    });
    return null;
  }
}

/**
 * Update agent operation status
 */
export async function updateAgentOperation(
  operationId: string,
  updates: {
    operationStatus?: 'success' | 'failed' | 'timeout';
    durationMs?: number;
    qualityScore?: number;
    outputData?: Record<string, any>;
    errorMessage?: string | null;
    completedAt?: Date;
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('agent_operations')
      .update({
        operation_status: updates.operationStatus,
        duration_ms: updates.durationMs,
        quality_score: updates.qualityScore,
        output_data: updates.outputData,
        error_message: updates.errorMessage,
        completed_at: updates.completedAt?.toISOString() || new Date().toISOString(),
      })
      .eq('id', operationId);

    if (error) {
      console.error(`[Agent:DB] Failed to update agent operation:`, {
        error: error.message,
        operationId,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Agent:DB] Error updating agent operation:`, {
      error: error instanceof Error ? error.message : String(error),
      operationId,
    });
    return false;
  }
}

