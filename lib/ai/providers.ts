import { AIProvider, AIProviderAdapter } from './types';
import { GeminiProviderAdapter } from './gemini';
import { LocalProviderAdapter } from './local';
import { GroqProviderAdapter } from './groq';
import { OpenRouterProviderAdapter } from './openrouter';

const registry: Record<AIProvider, AIProviderAdapter> = {
  gemini: new GeminiProviderAdapter(),
  local: new LocalProviderAdapter(),
  groq: new GroqProviderAdapter(),
  openrouter: new OpenRouterProviderAdapter(),
};

/**
 * Resolves a provider adapter by name
 */
export function getProvider(provider: AIProvider): AIProviderAdapter {
  const adapter = registry[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter;
}
