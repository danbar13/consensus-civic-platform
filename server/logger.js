import { db } from './db.js';

/**
 * Tracing & Cost Estimation Logger for Gemini AI Calls
 * Tracks prompt tokens, candidates tokens, execution latency, and calculates estimated USD/ILS cost.
 */

// Gemini Flash standard pricing estimate (approximate)
// $0.075 per 1 million input tokens
// $0.30 per 1 million output tokens
const COST_PER_INPUT_TOKEN = 0.075 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 0.30 / 1_000_000;
const USD_TO_ILS = 3.7;

export function calculateCost(promptTokens = 0, candidatesTokens = 0) {
  const costUsd = (promptTokens * COST_PER_INPUT_TOKEN) + (candidatesTokens * COST_PER_OUTPUT_TOKEN);
  return {
    costUsd,
    costIls: costUsd * USD_TO_ILS
  };
}

/**
 * Record an AI execution into SQLite
 */
export function logAICall({
  action,
  model,
  durationMs,
  usageMetadata = null,
  success = true,
  error = null
}) {
  try {
    const now = new Date().toISOString();
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + candidatesTokens);
    const { costUsd } = calculateCost(promptTokens, candidatesTokens);

    const stmt = db.prepare(`
      INSERT INTO ai_logs (
        created_at, action, model, duration_ms, 
        prompt_tokens, candidates_tokens, total_tokens, 
        estimated_cost_usd, success, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      now,
      action || 'Unknown',
      model || 'gemini',
      durationMs || 0,
      promptTokens,
      candidatesTokens,
      totalTokens,
      costUsd,
      success ? 1 : 0,
      error ? String(error).slice(0, 500) : null
    );

    return {
      recorded: true,
      timestamp: now,
      action,
      model,
      durationMs,
      totalTokens,
      costUsd
    };
  } catch (err) {
    console.error('Failed to write AI log to database:', err.message);
    return { recorded: false, error: err.message };
  }
}

/**
 * Get aggregated statistics for AI calls
 */
export function getAIStats() {
  try {
    const totalRows = db.prepare('SELECT COUNT(*) as c FROM ai_logs').get()?.c || 0;
    const successRows = db.prepare('SELECT COUNT(*) as c FROM ai_logs WHERE success = 1').get()?.c || 0;
    const failedRows = db.prepare('SELECT COUNT(*) as c FROM ai_logs WHERE success = 0').get()?.c || 0;
    
    const tokenAgg = db.prepare(`
      SELECT 
        SUM(prompt_tokens) as totalPromptTokens,
        SUM(candidates_tokens) as totalCandidatesTokens,
        SUM(total_tokens) as totalTokens,
        SUM(estimated_cost_usd) as totalCostUsd,
        AVG(duration_ms) as avgDurationMs
      FROM ai_logs
    `).get() || {};

    const totalCostUsd = tokenAgg.totalCostUsd || 0;
    const totalCostIls = totalCostUsd * USD_TO_ILS;
    const successRate = totalRows > 0 ? Math.round((successRows / totalRows) * 100) : 100;

    // Recent 50 logs
    const recentLogs = db.prepare(`
      SELECT * FROM ai_logs ORDER BY id DESC LIMIT 50
    `).all();

    return {
      totalCalls: totalRows,
      successCount: successRows,
      failedCount: failedRows,
      successRatePercent: successRate,
      avgDurationMs: Math.round(tokenAgg.avgDurationMs || 0),
      tokens: {
        prompt: tokenAgg.totalPromptTokens || 0,
        candidates: tokenAgg.totalCandidatesTokens || 0,
        total: tokenAgg.totalTokens || 0
      },
      cost: {
        usd: Number(totalCostUsd.toFixed(6)),
        ils: Number(totalCostIls.toFixed(4)),
        usdFormatted: `$${totalCostUsd.toFixed(5)}`,
        ilsFormatted: `₪${totalCostIls.toFixed(4)}`
      },
      recentLogs
    };
  } catch (err) {
    console.error('Failed to fetch AI stats:', err.message);
    return {
      totalCalls: 0,
      successCount: 0,
      failedCount: 0,
      successRatePercent: 100,
      avgDurationMs: 0,
      tokens: { prompt: 0, candidates: 0, total: 0 },
      cost: { usd: 0, ils: 0, usdFormatted: '$0.00', ilsFormatted: '₪0.00' },
      recentLogs: []
    };
  }
}
