import { AIRequestOptions, AIResponse } from './types';
import { getProvider } from './providers';
import { logUsage, estimateTokens } from './costTracker';
import { getCache, setCache, incrementCacheStats } from '../redis';
import crypto from 'crypto';

const CACHEABLE_TASKS: Record<string, string> = {
  'ats_analyzer': 'ats',
  'jd_matcher': 'jd',
  'linkedin_optimizer': 'linkedin',
  'resume_enhancer': 'enhance',
};

/**
 * Entry point for all AI Gateway request dispatches.
 * Handles timings, defaults, adapter resolution, and logs cost / telemetry data.
 */
export async function generateResponse(options: AIRequestOptions): Promise<AIResponse> {
  const startTime = Date.now();
  const provider = options.provider || 'gemini';
  const taskType = options.taskType || 'default';
  
  // Resolve model name for logging if not specified
  const model = options.model || (provider === 'gemini' ? 'gemini-3.5-flash' : 'default');

  const cachePrefix = CACHEABLE_TASKS[taskType];
  let cacheKey = '';

  if (cachePrefix) {
    try {
      const hashInput = JSON.stringify({
        prompt: options.prompt,
        systemInstruction: options.systemInstruction,
        model,
        temperature: options.temperature,
        responseMimeType: options.responseMimeType,
        responseSchema: options.responseSchema,
      });
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
      cacheKey = `${cachePrefix}:${hash}`;

      const cached = await getCache<AIResponse>(cacheKey);
      if (cached) {
        const responseTimeMs = Date.now() - startTime;
        console.warn(`[AI Cache Hit] Key: ${cacheKey} | Task: ${taskType} | Saved latency: ${responseTimeMs}ms`);

        const promptTokens = cached.usage?.promptTokens || 0;
        const completionTokens = cached.usage?.completionTokens || 0;
        const savedTokens = promptTokens + completionTokens;

        await incrementCacheStats('hit', savedTokens);

        // Log usage telemetry with 0 cost override
        await logUsage({
          provider: cached.provider,
          model: cached.model,
          taskType,
          promptTokens,
          completionTokens,
          responseTimeMs,
          success: true,
          userId: options.userId,
        });

        return {
          ...cached,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: savedTokens,
            cost: 0,
          },
        };
      }
    } catch (err) {
      console.warn(`[AI Cache] Failed to read cache for key ${cacheKey}:`, err);
    }
  }

  try {
    const adapter = getProvider(provider);
    const result = await adapter.generate({
      ...options,
      provider,
      model,
      taskType,
    });

    const responseTimeMs = Date.now() - startTime;

    // Log telemetry and usage details
    const usage = result.usage || {
      promptTokens: estimateTokens(options.prompt + (options.systemInstruction || '')),
      completionTokens: estimateTokens(result.text),
      totalTokens: 0,
    };
    
    // Fill usage properties
    usage.totalTokens = usage.promptTokens + usage.completionTokens;

    // Save to Cache on successful completion
    if (result.success && cacheKey) {
      try {
        await incrementCacheStats('miss');
        await setCache(cacheKey, result, 86400); // 24 hours TTL
      } catch (err) {
        console.warn(`[AI Cache] Failed to set cache for key ${cacheKey}:`, err);
      }
    }

    await logUsage({
      provider: result.provider,
      model: result.model,
      taskType,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      responseTimeMs,
      success: result.success,
      error: result.error,
      userId: options.userId,
    });

    return {
      ...result,
      usage,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    const promptTokens = estimateTokens(options.prompt + (options.systemInstruction || ''));

    // Log the execution failure
    await logUsage({
      provider,
      model,
      taskType,
      promptTokens,
      completionTokens: 0,
      responseTimeMs,
      success: false,
      error: errorMsg,
      userId: options.userId,
    });

    return {
      success: false,
      text: '',
      provider,
      model,
      error: errorMsg,
      usage: {
        promptTokens,
        completionTokens: 0,
        totalTokens: promptTokens,
        cost: 0,
      },
    };
  }
}
export type { AIProvider, AIResponse, AIRequestOptions, TokenUsage } from './types';
