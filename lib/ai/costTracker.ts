import { AIProvider } from './types';
import { logInfo, logError, logWarning } from '../logger';

// Prices are per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-3.5-pro': { input: 1.25, output: 5.00 },
  'default-gemini': { input: 0.075, output: 0.30 },
};

/**
 * Calculates estimated cost in USD based on token counts
 */
export function calculateCost(provider: AIProvider, model: string, promptTokens: number, completionTokens: number): number {
  if (provider !== 'gemini') {
    return 0; // Free models for Groq / OpenRouter / Local
  }

  // Normalize model name
  const modelKey = Object.keys(PRICING).find(key => model.toLowerCase().includes(key)) || 'default-gemini';
  const pricing = PRICING[modelKey];

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return Number((inputCost + outputCost).toFixed(8));
}

/**
 * Heuristic estimation of tokens based on character length when API response doesn't provide it
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // standard rule of thumb: ~4 characters per English token
  return Math.ceil(text.length / 4);
}

interface LogUsageDetails {
  provider: AIProvider;
  model: string;
  taskType: string;
  promptTokens: number;
  completionTokens: number;
  responseTimeMs: number;
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Logs usage to telemetry systems (Sentry/console) and prepares hooks for the future dashboard (Phase 8)
 */
export async function logUsage(details: LogUsageDetails) {
  const { provider, model, taskType, promptTokens, completionTokens, responseTimeMs, success, error, userId } = details;
  const totalTokens = promptTokens + completionTokens;
  const cost = calculateCost(provider, model, promptTokens, completionTokens);

  const logPayload = {
    provider,
    model,
    taskType,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    responseTimeMs,
    success,
    error,
    userId,
  };

  if (success) {
    logInfo(`[AI Gateway] Task: ${taskType} | Provider: ${provider} | Model: ${model} | Tokens: ${totalTokens} | Cost: $${cost.toFixed(6)} | Time: ${responseTimeMs}ms`, logPayload);
  } else {
    logWarning(`[AI Gateway Failed] Task: ${taskType} | Error: ${error || 'Unknown'}`, logPayload);
  }

  // In Phase 8, this hook will also perform database inserts into `ai_usage_logs`.
  try {
    const { insertAiUsageLog } = await import('@/lib/db/ai-analytics');
    await insertAiUsageLog({
      userId,
      provider,
      model,
      taskType,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      responseTimeMs,
      success,
      errorMessage: error || undefined
    });
  } catch (err) {
    console.error('Failed to write to ai_usage_logs from AI Gateway:', err);
  }

  // For Phase 1, we can optionally log to `analytics_events` if it exists.
  try {
    const { logAnalyticsEvent } = await import('@/lib/db/admin-analytics');
    await logAnalyticsEvent(`ai_usage:${taskType}`, userId, {
      provider,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost,
      response_time_ms: responseTimeMs,
      success,
      error_message: error || null,
    });
  } catch (err) {
    console.error('Failed to write to analytics_events from AI Gateway:', err);
  }
}
