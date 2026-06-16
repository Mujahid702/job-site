import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { estimateTokens } from './costTracker';

export class LocalProviderAdapter implements AIProviderAdapter {
  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const isJson = options.responseMimeType === 'application/json' || options.responseSchema;
    let text = '';

    if (isJson) {
      // Return a basic mock structure conforming to simple request styles
      const schemaType = options.responseSchema?.type || 'OBJECT';
      if (schemaType === 'OBJECT') {
        const mockObj: Record<string, any> = {};
        const props = options.responseSchema?.properties || {};
        for (const key of Object.keys(props)) {
          const prop = props[key];
          if (prop.type === 'INTEGER' || prop.type === 'NUMBER') {
            mockObj[key] = 85;
          } else if (prop.type === 'STRING') {
            mockObj[key] = `Heuristic response for ${key}`;
          } else if (prop.type === 'ARRAY') {
            mockObj[key] = prop.items?.type === 'OBJECT' ? [{}] : [`Sample ${key}`];
          } else if (prop.type === 'OBJECT') {
            mockObj[key] = {};
          } else {
            mockObj[key] = null;
          }
        }
        text = JSON.stringify(mockObj);
      } else {
        text = '{}';
      }
    } else {
      text = `Offline heuristic fallback response for task: ${options.taskType || 'default'}`;
    }

    const promptTokens = estimateTokens(options.prompt + (options.systemInstruction || ''));
    const completionTokens = estimateTokens(text);

    return {
      success: true,
      text,
      provider: 'local',
      model: options.model || 'local-heuristic',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost: 0,
      },
    };
  }
}
