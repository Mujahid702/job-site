export type AIProvider = 'gemini' | 'openrouter' | 'groq' | 'local';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface AIResponse {
  success: boolean;
  text: string;
  provider: AIProvider;
  model: string;
  usage?: TokenUsage;
  error?: string;
}

export interface AIRequestOptions {
  provider?: AIProvider;
  model?: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  responseSchema?: any;
  taskType?: string;
  userId?: string;
  apiKey?: string; // Client-passed API Key (e.g. from x-gemini-api-key)
}

export interface AIProviderAdapter {
  generate(options: AIRequestOptions): Promise<AIResponse>;
}
