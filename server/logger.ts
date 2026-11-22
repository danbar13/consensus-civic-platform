/**
 * Tracing & Cost Estimation Logger Interface for Gemini AI Calls
 */

export interface AIUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  thoughtsTokenCount?: number;
}

export interface LogAICallParams {
  action: 'Moderation' | 'ConsensusReport' | 'StatementSuggestions' | string;
  model: string;
  durationMs: number;
  usageMetadata?: AIUsageMetadata | null;
  success: boolean;
  error?: string | null;
}

export interface AILogEntry {
  id: number;
  created_at: string;
  action: string;
  model: string;
  duration_ms: number;
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  success: number;
  error: string | null;
}

export interface AIStats {
  totalCalls: number;
  successCount: number;
  failedCount: number;
  successRatePercent: number;
  avgDurationMs: number;
  tokens: {
    prompt: number;
    candidates: number;
    total: number;
  };
  cost: {
    usd: number;
    ils: number;
    usdFormatted: string;
    ilsFormatted: string;
  };
  recentLogs: AILogEntry[];
}

export { logAICall, getAIStats, calculateCost } from './logger.js';
