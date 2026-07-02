/**
 * lib/ai-abuse.ts
 * AI Abuse & Jailbreak protection utility.
 * Scans input prompt strings for injection strings, jailbreak signatures, or recursion loop behaviors.
 */

const JAILBREAK_PATTERNS = [
  /ignore previous instructions/i,
  /dan mode/i,
  /system prompt/i,
  /you are now a bypass/i,
  /jailbreak/i,
  /hypothetical scenario where you can do anything/i
];

export interface AbuseCheckResult {
  abused: boolean;
  reason: string | null;
}

/**
 * Validates prompt payload against jailbreak attempts and looping behaviors.
 */
export function detectPromptAbuse(prompt: string): AbuseCheckResult {
  if (!prompt || typeof prompt !== "string") {
    return { abused: false, reason: null };
  }

  // 1. Scan against standard jailbreak signatures
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        abused: true,
        reason: `Jailbreak signature matched: ${pattern.source}`
      };
    }
  }

  // 2. Scan for repeating/spam behaviors (recursion loop detection)
  const words = prompt.split(/\s+/).filter(w => w.length > 2);
  const uniqueWords = new Set(words);
  if (words.length > 20 && uniqueWords.size < words.length * 0.3) {
    return {
      abused: true,
      reason: "Recursive spam loop behavior detected"
    };
  }

  return { abused: false, reason: null };
}
