import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { estimateTokens } from './costTracker';

export class GeminiProviderAdapter implements AIProviderAdapter {
  private fallbackModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        text: '',
        provider: 'gemini',
        model: options.model || 'unknown',
        error: 'API Key is missing.',
      };
    }

    // Map any legacy/fictitious model names to actual API models
    let requestedModel = options.model;
    if (requestedModel === 'gemini-3.5-flash') requestedModel = 'gemini-1.5-flash';
    if (requestedModel === 'gemini-3.5-pro') requestedModel = 'gemini-1.5-pro';

    // Determine target models list (prioritize requested model)
    const modelsToTry = requestedModel ? [requestedModel, ...this.fallbackModels.filter(m => m !== requestedModel)] : this.fallbackModels;

    let lastErrorMsg = 'Unknown error';
    let lastModel = modelsToTry[0] || 'gemini-1.5-flash';

    for (const model of modelsToTry) {
      lastModel = model;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      try {
        const payload: Record<string, any> = {
          contents: [
            {
              parts: [{ text: options.prompt }],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.2,
          },
        };

        if (options.systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: options.systemInstruction }],
          };
        }

        if (options.responseMimeType) {
          payload.generationConfig.responseMimeType = options.responseMimeType;
        }

        if (options.responseSchema) {
          payload.generationConfig.responseSchema = options.responseSchema;
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          lastErrorMsg = errorData?.error?.message || `Gemini API returned status ${res.status}`;
          console.warn(`[AI Gateway Gemini Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        const data = await res.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
          lastErrorMsg = 'Invalid response structure from Gemini API (no content text).';
          console.warn(`[AI Gateway Gemini Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        // Handle Token usage metadata
        const metadata = data.usageMetadata;
        const promptTokens = metadata?.promptTokenCount ?? estimateTokens(options.prompt);
        const completionTokens = metadata?.candidatesTokenCount ?? estimateTokens(textResponse);

        return {
          success: true,
          text: textResponse,
          provider: 'gemini',
          model,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const errorMessage = err?.name === 'AbortError' ? 'AI request timed out.' : (err instanceof Error ? err.message : String(err));
        lastErrorMsg = errorMessage;
        console.error(`[AI Gateway Gemini Adapter] Error on model ${model}:`, err);
      }
    }

    return {
      success: false,
      text: '',
      provider: 'gemini',
      model: lastModel,
      error: lastErrorMsg,
    };
  }
}
