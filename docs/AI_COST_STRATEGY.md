# AI cost Optimization & Caching Strategy

This guide describes model routing rules, failover pricing structures, Redis token caches, and token budget estimations to minimize credit costs.

---

## 1. AI Model Selection Policy

The platform uses a cost-aware routing algorithm that routes calls to models based on task complexity:

| Complexity | Task Type | Primary Model | Fallback Model | Pricing Logic |
| :--- | :--- | :--- | :--- | :--- |
| **High** | Resume Parsing & ATS | `gemini-3.5-pro` | `openrouter-gpt-4o` | Higher cost per query. Requires caching. |
| **Medium** | System Design blueprinter | `gemini-3.5-flash` | `groq-llama-3-70b` | Balance speed and structure output. |
| **Low** | Quick chat copilot | `groq-llama-3-8b` | `gemini-3.5-flash` | Ultra-low latency. Caching disabled. |

---

## 2. Redis Caching & Cache Hits Optimization

The Upstash Redis caching proxy plays a key role in cost optimization:
-   **ATS Analyzer & JD Matcher caching**: Hashing input texts prevents repeat scans of unmodified files.
-   **Latency Savings**: A cache hit completes in **~120ms** with **0 tokens** consumed, compared to 4500ms and ~20k tokens for a full LLM execution.
-   **Cache TTL**: Set to **24 hours** for resume tasks and roadmaps to account for incremental resume updates during study sessions.

---

## 3. Token & Prompt Optimization Rules

To avoid waste, prompt designs must follow these token reduction rules:
1.  **Strict Context Windows**: Do not append historical chat messages beyond a depth of 6.
2.  **No Fluff Instructions**: Avoid verbose system prompts. Use compact markdown structures.
3.  **JSON compression**: Minimize whitespace in target schema examples.

---

## 4. Cost Telemetry & Budget Monitoring

-   **Background Cost Auditor**: Every completed LLM call records metrics (input/output tokens, calculated cost in USD) via the cost tracker (`lib/ai/costTracker.ts`).
-   **Telemetry Database**: Records are stored in `public.analytics_events` and reviewed weekly on the Admin Dashboard.
-   **Cost caps limits**: Admin can configure total daily/monthly spend limits. If usage approaches limits, the router fails over to local mock templates automatically.
