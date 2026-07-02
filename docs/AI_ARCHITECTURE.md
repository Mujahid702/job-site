# AI Gateway Architecture & Caching Reference

This document describes the design of the platform's AI routing gateway, provider adapters, failover policies, prompt caching, and cost tracking system.

---

## 1. AI Gateway Router Lifecycle Flow

The gateway (`lib/ai/router.ts`) acts as a central proxy for all LLM calls:

```
[UI Component / API Route]
            │
            ▼
┌───────────────────────┐
│     AI Router API     │
└───────────┬───────────┘
            │
            ▼
   [Is Task Cacheable?] ──(Yes)──> [Hash prompt input parameters]
            │                                     │
          (No)                                    ▼
            │                         [Upstash Redis Cache lookup]
            │                            ├── (Hit) ──> [Return Cache result (Cost 0)]
            │                            └── (Miss) ──┐
            ├─────────────────────────────────────────┘
            ▼
┌───────────────────────┐
│   Primary Provider    │ ──(Success)──> [Save output in Cache (TTL 24h)] ──> [Return]
│  (Gemini-3.5-Flash)   │
└───────────┬───────────┘
            │
         (Fail)
            ▼
┌───────────────────────┐
│ Failover Model Chain  │ ──(Success)──> [Return and log failover event]
│ (Groq -> OpenRouter)  │
└───────────┬───────────┘
            │
         (Fail)
            ▼
   [Return Offline Fallback Templates]
```

---

## 2. Supported Provider Adapters

-   **Gemini Adapter (`lib/ai/gemini.ts`)**: Resolves requests targeting Google's Gemini Models. Defaults to `gemini-3.5-flash` for high-speed indexing, and `gemini-3.5-pro` for complex resume evaluations.
-   **Groq Adapter (`lib/ai/groq.ts`)**: Manages sub-second inference calls. Utilizes LLaMA models. Primarily handles quick chat queries and syntax checks.
-   **OpenRouter Adapter (`lib/ai/openrouter.ts`)**: Third-party aggregator backup connecting to Anthropic Claude or OpenAI GPT systems if primary accounts encounter limits.
-   **Local Mock Adapter (`lib/ai/local.ts`)**: Offline model parsing using pre-written templates if external networks are unavailable.

---

## 3. Redundancy Failover Logic

If an API call fails (e.g. rate limit codes `429` or gateway outages `503`), the AI Router launches sequential retries:
1.  Logs primary provider failure.
2.  Iterates through `['groq', 'openrouter', 'gemini']`, choosing the next available model.
3.  Strips primary API keys from headers so the fallback adapter defaults to its own server env variables.
4.  Logs failover latency telemetry.

---

## 4. Token Caching & Rate Limiting

-   **Caching Engine**: Upstash Redis REST endpoints.
-   **Cache keys naming**: Uses prefix tags (`ats:*`, `jd:*`, `linkedin:*`) combined with a SHA-256 hash of the prompt, model, system instruction, and parameters.
-   **TTL Config**: Successful responses are cached for **86,400 seconds (24 hours)**.
-   **Rate Limiter**: `@upstash/ratelimit` monitors IP request rates inside Vercel Edge Middleware.

---

## 5. Cost Tracker & Telemetry System

All AI interactions trigger background cost logging:
-   **Method**: `logUsage()` inside `lib/ai/costTracker.ts`.
-   **Logged Metrics**: response time (ms), provider, model name, status, input tokens, output tokens, and calculated dollar cost.
-   **Tokens estimation**: If models don't return usage counts, the platform counts words via `estimateTokens()` (defaulting to 1 token per 3.8 characters).
-   **Database table**: Logs are stored in `public.analytics_events` for administrative auditing.
