import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (err) {
    console.warn("Failed to initialize Redis client. Falling back to memory cache.", err);
  }
}

// Simple thread-safe, in-memory cache to prevent app crashes in offline/dev environments
class MemoryCache {
  private store = new Map<string, { value: any; expiry: number }>();
  private stats = { hits: 0, misses: 0, saved_tokens: 0 };

  incrementStats(type: 'hit' | 'miss', savedTokens = 0) {
    if (type === 'hit') {
      this.stats.hits++;
      this.stats.saved_tokens += savedTokens;
    } else {
      this.stats.misses++;
    }
  }

  getStats() {
    return { ...this.stats };
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, options?: { ex: number }): Promise<void> {
    const ttl = options?.ex ? options.ex * 1000 : 15 * 60 * 1000;
    this.store.set(key, { value, expiry: Date.now() + ttl });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const result: string[] = [];
    const now = Date.now();
    // Translate simple Redis wildcard (*) pattern to RegExp for matching
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const [key, item] of this.store.entries()) {
      if (now <= item.expiry && regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }
}

const localCache = new MemoryCache();

export async function getCache<T>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return (typeof data === "string" ? JSON.parse(data) : data) as T;
      }
      return null;
    } catch (err) {
      console.warn(`Redis get cache error for key ${key}:`, err);
    }
  }
  return localCache.get<T>(key);
}

export async function setCache(key: string, value: any, ttlSeconds = 900): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn(`Redis set cache error for key ${key}:`, err);
    }
  }
  await localCache.set(key, value, { ex: ttlSeconds });
}

export async function invalidateCache(key: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.warn(`Redis delete cache error for key ${key}:`, err);
    }
  }
  await localCache.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return;
    } catch (err) {
      console.warn(`Redis delete pattern error for pattern ${pattern}:`, err);
    }
  }
  const keys = await localCache.keys(pattern);
  for (const k of keys) {
    await localCache.del(k);
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  const keys = [
    `user_recommendations:${userId}`,
    `user_insights:${userId}`,
    `user_action_center:${userId}`,
    `user_health_score:${userId}`
  ];
  for (const key of keys) {
    await invalidateCache(key);
  }
  // Invalidate any role/job specific match score cache
  await invalidateCachePattern(`user_match_score:${userId}:*`);
}

export async function invalidateRecruiterCache(userId: string): Promise<void> {
  const keys = [
    `recruiter_dashboard:${userId}`,
    `recruiter_pipeline:${userId}`,
    `recruiter_insights:${userId}`,
    `recruiter_scores:${userId}`
  ];
  for (const key of keys) {
    await invalidateCache(key);
  }
  await invalidateCachePattern(`recruiter_match_score:${userId}:*`);
}

export async function invalidateGrowthCache(userId: string): Promise<void> {
  const keys = [
    `growth_referral_stats:${userId}`,
    `growth_digest:${userId}`,
    `growth_streaks:${userId}`
  ];
  for (const key of keys) {
    await invalidateCache(key);
  }
  await invalidateCachePattern(`growth_leaderboard:*`);
}

export async function invalidateVerificationCache(recruiterId: string): Promise<void> {
  const keys = [
    `recruiter_verification:${recruiterId}`,
    `recruiter_ratings:${recruiterId}`,
    `recruiter_trust_score:${recruiterId}`,
    `recruiter_fraud_risk:${recruiterId}`,
    `admin_verification_queue`
  ];
  for (const key of keys) {
    await invalidateCache(key);
  }
}

export async function incrementCacheStats(type: 'hit' | 'miss', savedTokens = 0): Promise<void> {
  if (redisClient) {
    try {
      if (type === 'hit') {
        await redisClient.hincrby('ai_cache_stats', 'hits', 1);
        if (savedTokens > 0) {
          await redisClient.hincrby('ai_cache_stats', 'saved_tokens', savedTokens);
        }
      } else {
        await redisClient.hincrby('ai_cache_stats', 'misses', 1);
      }
      return;
    } catch (err) {
      console.warn('Redis increment cache stats error:', err);
    }
  }
  localCache.incrementStats(type, savedTokens);
}

export async function getCacheStats(): Promise<{ hits: number; misses: number; saved_tokens: number }> {
  if (redisClient) {
    try {
      const stats = await redisClient.hgetall('ai_cache_stats');
      return {
        hits: Number(stats?.hits || 0),
        misses: Number(stats?.misses || 0),
        saved_tokens: Number(stats?.saved_tokens || 0)
      };
    } catch (err) {
      console.warn('Redis get cache stats error:', err);
    }
  }
  return localCache.getStats();
}
