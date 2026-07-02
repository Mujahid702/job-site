import { supabase } from './supabase';

/**
 * lib/telemetry.ts
 * Global helper for logging errors, performance metrics, and verifying active Feature Flags.
 */

/**
 * Saves frontend or backend exceptions to public.error_logs
 */
export async function logError(params: {
  userId?: string | null;
  page?: string;
  browser?: string;
  device?: string;
  stackTrace: string;
  apiEndpoint?: string;
  latency?: number;
}) {
  try {
    const { error } = await supabase.from('error_logs').insert([
      {
        user_id: params.userId || null,
        page: params.page || null,
        browser: params.browser || null,
        device: params.device || null,
        stack_trace: params.stackTrace,
        api_endpoint: params.apiEndpoint || null,
        latency: params.latency || null
      }
    ]);
    if (error) throw error;
  } catch (err) {
    console.error('[Telemetry Error Logging Failed]:', err);
  }
}

/**
 * Saves load time metrics and CPU/Memory statistics
 */
export async function logPerformance(params: {
  userId?: string | null;
  pageLoadMs?: number;
  lcpMs?: number;
  fidMs?: number;
  apiLatencyMs?: number;
  aiLatencyMs?: number;
  dbLatencyMs?: number;
  redisLatencyMs?: number;
  memoryUsageMb?: number;
  cpuUsagePct?: number;
}) {
  try {
    const { error } = await supabase.from('performance_metrics').insert([
      {
        user_id: params.userId || null,
        page_load_ms: params.pageLoadMs || null,
        lcp_ms: params.lcpMs || null,
        fid_ms: params.fidMs || null,
        api_latency_ms: params.apiLatencyMs || null,
        ai_latency_ms: params.aiLatencyMs || null,
        db_latency_ms: params.dbLatencyMs || null,
        redis_latency_ms: params.redisLatencyMs || null,
        memory_usage_mb: params.memoryUsageMb || null,
        cpu_usage_pct: params.cpuUsagePct || null
      }
    ]);
    if (error) throw error;
  } catch (err) {
    console.error('[Telemetry Performance Logging Failed]:', err);
  }
}

/**
 * Evaluates if a platform module feature is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .single();
    
    if (error || !data) return true; // Default fallback: enable feature if flags database lookup fails
    return data.enabled;
  } catch {
    return true;
  }
}
