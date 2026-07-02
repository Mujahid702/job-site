import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { estimateTokens } from './costTracker';

export class OpenRouterProviderAdapter implements AIProviderAdapter {
  private fallbackModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-4-31b-it:free'
  ];

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        text: '',
        provider: 'openrouter',
        model: options.model || 'unknown',
        error: 'OpenRouter API Key is missing.',
      };
    }

    const modelsToTry = options.model 
      ? [options.model, ...this.fallbackModels.filter(m => m !== options.model)] 
      : this.fallbackModels;

    let lastErrorMsg = 'Unknown error';
    let lastModel = modelsToTry[0] || 'meta-llama/llama-3.3-70b-instruct:free';

    for (const model of modelsToTry) {
      lastModel = model;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      try {
        const messages: Record<string, string>[] = [];
        
        if (options.systemInstruction) {
          messages.push({
            role: 'system',
            content: options.systemInstruction,
          });
        }

        messages.push({
          role: 'user',
          content: options.prompt,
        });

        const payload: Record<string, any> = {
          model,
          messages,
          temperature: options.temperature ?? 0.2,
        };

        // If JSON output or specific response schema is requested, configure response format
        if (options.responseMimeType === 'application/json' || options.responseSchema) {
          payload.response_format = { type: 'json_object' };
          
          if (options.responseSchema && messages.length > 0) {
            messages[messages.length - 1].content += `\n\nIMPORTANT: You MUST respond with a JSON object that conforms EXACTLY to this schema:\n${JSON.stringify(options.responseSchema, null, 2)}`;
          }
        }

        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Job-Site AI Portal',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          lastErrorMsg = errorData?.error?.message || `OpenRouter API returned status ${res.status}`;
          console.warn(`[AI Gateway OpenRouter Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        const data = await res.json();
        const textResponse = data.choices?.[0]?.message?.content;

        if (textResponse === undefined || textResponse === null) {
          lastErrorMsg = 'Invalid response structure from OpenRouter API (no message content).';
          console.warn(`[AI Gateway OpenRouter Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        // Parse token usage metadata returned by OpenRouter
        const usage = data.usage;
        const promptTokens = usage?.prompt_tokens ?? estimateTokens(options.prompt);
        const completionTokens = usage?.completion_tokens ?? estimateTokens(textResponse);

        return {
          success: true,
          text: textResponse,
          provider: 'openrouter',
          model,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const errorMessage = err?.name === 'AbortError' 
          ? 'AI request timed out.' 
          : (err instanceof Error ? err.message : String(err));
        lastErrorMsg = errorMessage;
        console.error(`[AI Gateway OpenRouter Adapter] Error on model ${model}:`, err);
      }
    }

    return {
      success: false,
      text: '',
      provider: 'openrouter',
      model: lastModel,
      error: lastErrorMsg,
    };
  }
}
