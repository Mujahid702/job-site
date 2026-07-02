import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { estimateTokens } from './costTracker';

export class GroqProviderAdapter implements AIProviderAdapter {
  private fallbackModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const apiKey = options.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        text: '',
        provider: 'groq',
        model: options.model || 'unknown',
        error: 'Groq API Key is missing.',
      };
    }

    const modelsToTry = options.model 
      ? [options.model, ...this.fallbackModels.filter(m => m !== options.model)] 
      : this.fallbackModels;

    let lastErrorMsg = 'Unknown error';
    let lastModel = modelsToTry[0] || 'llama-3.3-70b-versatile';

    for (const model of modelsToTry) {
      lastModel = model;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
          } else {
            // Groq requires that 'messages' must contain the word 'json' (case-insensitive) to use json_object format.
            const hasJsonKeyword = messages.some(msg => 
              msg.content.toLowerCase().includes('json')
            );
            if (!hasJsonKeyword && messages.length > 0) {
              messages[messages.length - 1].content += '\n\nIMPORTANT: Output your response strictly as a JSON object.';
            }
          }
        }

        const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          lastErrorMsg = errorData?.error?.message || `Groq API returned status ${res.status}`;
          console.warn(`[AI Gateway Groq Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        const data = await res.json();
        const textResponse = data.choices?.[0]?.message?.content;

        if (textResponse === undefined || textResponse === null) {
          lastErrorMsg = 'Invalid response structure from Groq API (no message content).';
          console.warn(`[AI Gateway Groq Adapter] Model ${model} failed: ${lastErrorMsg}`);
          continue;
        }

        // Parse token usage metadata returned by Groq
        const usage = data.usage;
        const promptTokens = usage?.prompt_tokens ?? estimateTokens(options.prompt);
        const completionTokens = usage?.completion_tokens ?? estimateTokens(textResponse);

        return {
          success: true,
          text: textResponse,
          provider: 'groq',
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
        console.error(`[AI Gateway Groq Adapter] Error on model ${model}:`, err);
      }
    }

    return {
      success: false,
      text: '',
      provider: 'groq',
      model: lastModel,
      error: lastErrorMsg,
    };
  }
}
