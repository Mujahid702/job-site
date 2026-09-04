import { AIRequestOptions, AIResponse, AIProvider } from './types';
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
  const provider: AIProvider = options.provider || 'gemini';
  const taskType = options.taskType || 'default';
  
  // Resolve model name for logging if not specified
  const model = options.model || (provider === 'gemini' ? 'gemini-3.5-flash' : 'default');

  // Dynamically resolve userId if missing or anonymous for secure caching isolation
  let userId = options.userId;
  if (!userId || userId === 'anonymous') {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Bypassed if createClient/auth is unavailable (e.g. build time)
    }
  }
  userId = userId || 'anonymous';

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
        userId: userId,
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
          userId: userId,
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
    let result = await adapter.generate({
      ...options,
      provider,
      model,
      taskType,
    });

    // Failover/redundancy fallback chain if the primary model fails (e.g. due to Gemini spikes/demands)
    if (!result.success) {
      console.warn(`[AI Router] Primary provider "${provider}" failed with error: ${result.error || 'Unknown error'}. Initiating failover fallback chain...`);
      
      const fallbackProviders = (['groq', 'openrouter', 'gemini'] as AIProvider[]).filter(p => p !== provider);
      for (const fallbackProvider of fallbackProviders) {
        console.warn(`[AI Router] Attempting failover to fallback provider: "${fallbackProvider}"...`);
        try {
          const fbAdapter = getProvider(fallbackProvider);
          // Strip primary provider's API key when falling back to a different provider
          // so the fallback adapter defaults to its own environment variable key.
          const { apiKey: primaryApiKey, ...fbOptions } = options;
          const fbResult = await fbAdapter.generate({
            ...fbOptions,
            provider: fallbackProvider,
            model: undefined, // Let the fallback adapter select its default models
          });

          if (fbResult.success) {
            console.warn(`[AI Router] Failover succeeded using fallback provider: "${fallbackProvider}"!`);
            result = fbResult;
            break;
          } else {
            console.warn(`[AI Router] Fallback provider "${fallbackProvider}" also failed: ${fbResult.error}`);
          }
        } catch (fbErr: any) {
          console.error(`[AI Router] Fallback provider "${fallbackProvider}" threw error:`, fbErr);
        }
      }
    }

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
      userId: userId,
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
      userId: userId,
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
