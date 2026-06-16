import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Local in-memory rate limiter fallback for development/offline environments
class InMemoryRateLimiter {
  private cache = new Map<string, { count: number; reset: number }>()

  async limit(identifier: string, limitCount: number, windowMs: number) {
    const now = Date.now()
    const key = `${identifier}`
    const record = this.cache.get(key)

    if (!record || now > record.reset) {
      this.cache.set(key, { count: 1, reset: now + windowMs })
      return {
        success: true,
        remaining: limitCount - 1,
        reset: now + windowMs,
      }
    }

    if (record.count >= limitCount) {
      return {
        success: false,
        remaining: 0,
        reset: record.reset,
      }
    }

    record.count++
    return {
      success: true,
      remaining: limitCount - record.count,
      reset: record.reset,
    }
  }
}

const localLimiter = new InMemoryRateLimiter()

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

let upstashRedis: Redis | null = null
if (redisUrl && redisToken) {
  try {
    upstashRedis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis. Falling back to local rate limiting.', err)
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  headers: Record<string, string>
}

// Map action types to their respective limits and windows (in seconds)
const ACTION_LIMITS: Record<string, { limit: number; window: number }> = {
  ats: { limit: 20, window: 3600 },        // ATS Analyzer: 20 requests/hour
  jd: { limit: 20, window: 3600 },         // JD Matcher: 20 requests/hour
  enhance: { limit: 20, window: 3600 },    // Resume Enhancer: 20 requests/hour
  builder: { limit: 20, window: 3600 },    // Resume Builder: 20 requests/hour
  copilot: { limit: 50, window: 3600 },    // Placement Copilot: 50 requests/hour
  insights: { limit: 50, window: 3600 },   // Placement Insights: 50 requests/hour
  scrape: { limit: 50, window: 3600 },     // Web Scraper: 50 requests/hour
  default: { limit: 60, window: 3600 }
}

export async function rateLimit(
  identifier: string,
  actionType: string
): Promise<RateLimitResult> {
  const config = ACTION_LIMITS[actionType] || ACTION_LIMITS.default
  const limitCount = config.limit
  const windowSeconds = config.window
  const windowMs = windowSeconds * 1000

  const key = `bb_ratelimit:${actionType}:${identifier}`

  if (upstashRedis) {
    try {
      const ratelimit = new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(limitCount, `${windowSeconds} s`),
        analytics: true,
        prefix: '@upstash/ratelimit',
      })
      const result = await ratelimit.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        headers: {
          'X-RateLimit-Limit': limitCount.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
        },
      }
    } catch (err) {
      console.warn('Upstash rate limiting failed. Falling back to local rate limiting.', err)
    }
  }

  // Use local in-memory rate limiter fallback
  const result = await localLimiter.limit(key, limitCount, windowMs)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    headers: {
      'X-RateLimit-Limit': limitCount.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
    },
  }
}
