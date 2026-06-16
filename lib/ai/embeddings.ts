import { estimateTokens } from './costTracker';

/**
 * Generates a 768-dimensional embedding vector for the given text using Gemini's text-embedding-004 API.
 * Falls back to a deterministic offline heuristic vector generator if the API key is not configured or fails.
 */
export async function generateEmbedding(text: string, customApiKey?: string): Promise<number[]> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[Embeddings] Gemini API Key is missing. Falling back to deterministic offline heuristic embedding.');
    return generateFallbackEmbedding(text);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Gemini Embedding API returned status ${response.status}`;
      console.warn(`[Embeddings] Gemini API call failed: ${errorMsg}. Using offline fallback.`);
      return generateFallbackEmbedding(text);
    }

    const data = await response.json();
    const values = data.embedding?.values;

    if (!values || !Array.isArray(values) || values.length !== 768) {
      console.warn('[Embeddings] Invalid embedding output format from API. Using offline fallback.');
      return generateFallbackEmbedding(text);
    }

    return values;
  } catch (err: any) {
    const errorMsg = err?.name === 'AbortError' ? 'Embedding request timed out.' : (err instanceof Error ? err.message : String(err));
    console.warn(`[Embeddings] Error generating embedding: ${errorMsg}. Using offline fallback.`);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Generates a deterministic, normalized 768-dimension heuristic vector based on character code hashing.
 * Useful for local verification, unit tests, and offline development.
 */
export function generateFallbackEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalizedText = text.trim().toLowerCase();
  
  if (normalizedText.length === 0) {
    // Return unit vector for empty strings
    vector[0] = 1.0;
    return vector;
  }

  // Populate deterministic values in vector
  for (let i = 0; i < normalizedText.length; i++) {
    const code = normalizedText.charCodeAt(i);
    // Distribute weights pseudo-randomly over dimensions
    const index1 = (i * 17 + code * 3) % 768;
    const index2 = (i * 31 + code * 7) % 768;
    
    vector[index1] += (code / 256.0);
    vector[index2] -= (code / 512.0);
  }

  // Normalize vector to unit length
  let sumSquares = 0;
  for (let i = 0; i < 768; i++) {
    sumSquares += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSquares) || 1.0;
  
  for (let i = 0; i < 768; i++) {
    vector[i] /= magnitude;
  }

  return vector;
}
