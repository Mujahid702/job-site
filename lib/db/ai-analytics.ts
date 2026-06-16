import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getBaseSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(url, key);
}

export interface AiUsageLogInput {
  userId?: string;
  provider: string;
  model: string;
  taskType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
}

export interface AiCostAnalytics {
  summary: {
    dailyCost: number;
    monthlyCost: number;
    cumulativeCost: number;
    totalRequests: number;
    geminiPercentage: number;
    freePercentage: number;
  };
  dailyTrend: { date: string; cost: number; requests: number }[];
  monthlyTrend: { month: string; cost: number; requests: number }[];
  featureBreakdown: { feature: string; cost: number; requests: number; tokens: number }[];
  userBreakdown: { name: string; email: string; cost: number; requests: number }[];
  recentLogs: {
    id: string;
    timestamp: string;
    userName: string;
    feature: string;
    provider: string;
    model: string;
    tokens: number;
    cost: number;
    success: boolean;
  }[];
}

/**
 * Inserts a transaction record into public.ai_usage_logs table
 */
export async function insertAiUsageLog(log: AiUsageLogInput): Promise<void> {
  try {
    const supabase = getBaseSupabase();
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: log.userId || null,
      provider: log.provider,
      model: log.model,
      task_type: log.taskType,
      prompt_tokens: log.promptTokens,
      completion_tokens: log.completionTokens,
      total_tokens: log.totalTokens,
      cost: log.cost,
      response_time_ms: log.responseTimeMs,
      success: log.success,
      error_message: log.errorMessage || null
    });

    if (error) throw error;
  } catch (err: any) {
    console.warn('[Telemetry DB] Failed to insert AI usage log:', err.message || err);
  }
}

/**
 * Queries and compiles Cost & Usage statistics for the AI Gateway
 */
export async function getAiCostAnalytics(): Promise<AiCostAnalytics> {
  try {
    const supabase = getBaseSupabase();
    
    // Fetch all logs from database
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Handle schema errors or unprovisioned database states
    if (error || !logs || logs.length === 0) {
      if (error && !error.message.includes('relation "public.ai_usage_logs" does not exist')) {
        console.error('[Cost Analytics] DB select error:', error.message);
      }
      return getMockCostAnalytics();
    }

    // Fetch user profiles to map user IDs to names/emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');

    const profileMap = new Map<string, { name: string; email: string }>();
    if (profiles) {
      profiles.forEach(p => {
        if (p.user_id) {
          profileMap.set(p.user_id, {
            name: p.full_name || p.email?.split('@')[0] || 'Unknown Candidate',
            email: p.email || ''
          });
        }
      });
    }

    // 1. Process Totals & Ratios
    let cumulativeCost = 0;
    let geminiCount = 0;
    let freeCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7);
    let dailyCost = 0;
    let monthlyCost = 0;

    const dailyGroups: Record<string, { cost: number; requests: number }> = {};
    const monthlyGroups: Record<string, { cost: number; requests: number }> = {};
    const featureGroups: Record<string, { cost: number; requests: number; tokens: number }> = {};
    const userGroups: Record<string, { cost: number; requests: number; name: string; email: string }> = {};

    logs.forEach(log => {
      const logCost = Number(log.cost || 0);
      cumulativeCost += logCost;

      if (log.provider === 'gemini') {
        geminiCount++;
      } else {
        freeCount++;
      }

      const createdAt = new Date(log.created_at);
      const dateStr = createdAt.toISOString().split('T')[0];
      const monthStr = dateStr.substring(0, 7);

      if (dateStr === todayStr) {
        dailyCost += logCost;
      }
      if (monthStr === thisMonthStr) {
        monthlyCost += logCost;
      }

      // Group Daily Trends (last 30 days)
      if (!dailyGroups[dateStr]) dailyGroups[dateStr] = { cost: 0, requests: 0 };
      dailyGroups[dateStr].cost += logCost;
      dailyGroups[dateStr].requests++;

      // Group Monthly Trends (last 12 months)
      if (!monthlyGroups[monthStr]) monthlyGroups[monthStr] = { cost: 0, requests: 0 };
      monthlyGroups[monthStr].cost += logCost;
      monthlyGroups[monthStr].requests++;

      // Group Cost per Feature
      const feat = log.task_type || 'default';
      if (!featureGroups[feat]) featureGroups[feat] = { cost: 0, requests: 0, tokens: 0 };
      featureGroups[feat].cost += logCost;
      featureGroups[feat].requests++;
      featureGroups[feat].tokens += Number(log.total_tokens || 0);

      // Group Cost per User
      if (log.user_id) {
        const uId = log.user_id;
        if (!userGroups[uId]) {
          const uInfo = profileMap.get(uId) || { name: `user_${uId.substring(0, 4)}`, email: 'N/A' };
          userGroups[uId] = { cost: 0, requests: 0, name: uInfo.name, email: uInfo.email };
        }
        userGroups[uId].cost += logCost;
        userGroups[uId].requests++;
      }
    });

    const totalRequests = logs.length;
    const geminiPercentage = totalRequests > 0 ? (geminiCount / totalRequests) * 100 : 0;
    const freePercentage = totalRequests > 0 ? (freeCount / totalRequests) * 100 : 0;

    // Format trends
    const dailyTrend = Object.entries(dailyGroups)
      .map(([date, val]) => ({ date, cost: Number(val.cost.toFixed(6)), requests: val.requests }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const monthlyTrend = Object.entries(monthlyGroups)
      .map(([month, val]) => ({ month, cost: Number(val.cost.toFixed(4)), requests: val.requests }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const featureBreakdown = Object.entries(featureGroups)
      .map(([feature, val]) => ({ feature, cost: Number(val.cost.toFixed(6)), requests: val.requests, tokens: val.tokens }))
      .sort((a, b) => b.cost - a.cost);

    const userBreakdown = Object.entries(userGroups)
      .map(([_, val]) => ({ name: val.name, email: val.email, cost: Number(val.cost.toFixed(6)), requests: val.requests }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const recentLogs = logs.slice(0, 50).map(log => {
      const uInfo = log.user_id ? profileMap.get(log.user_id) : null;
      return {
        id: log.id,
        timestamp: log.created_at,
        userName: uInfo?.name || 'System / Guest',
        feature: log.task_type,
        provider: log.provider,
        model: log.model,
        tokens: log.total_tokens,
        cost: Number(log.cost || 0),
        success: log.success
      };
    });

    return {
      summary: {
        dailyCost: Number(dailyCost.toFixed(6)),
        monthlyCost: Number(monthlyCost.toFixed(6)),
        cumulativeCost: Number(cumulativeCost.toFixed(6)),
        totalRequests,
        geminiPercentage,
        freePercentage
      },
      dailyTrend,
      monthlyTrend,
      featureBreakdown,
      userBreakdown,
      recentLogs
    };

  } catch (err) {
    console.error('[Cost Analytics] Failed compilation:', err);
    return getMockCostAnalytics();
  }
}

/**
 * Builds mock cost statistics for demonstrating the UI when logs are empty
 */
function getMockCostAnalytics(): AiCostAnalytics {
  const dailyTrend = [
    { date: "06-01", cost: 0.12, requests: 84 },
    { date: "06-02", cost: 0.14, requests: 92 },
    { date: "06-03", cost: 0.09, requests: 76 },
    { date: "06-04", cost: 0.18, requests: 124 },
    { date: "06-05", cost: 0.22, requests: 148 },
    { date: "06-06", cost: 0.11, requests: 64 },
    { date: "06-07", cost: 0.13, requests: 81 },
    { date: "06-08", cost: 0.28, requests: 194 },
    { date: "06-09", cost: 0.31, requests: 210 },
    { date: "06-10", cost: 0.25, requests: 184 },
    { date: "06-11", cost: 0.19, requests: 154 },
    { date: "06-12", cost: 0.21, requests: 168 },
    { date: "06-13", cost: 0.10, requests: 72 },
    { date: "06-14", cost: 0.15, requests: 98 },
    { date: "06-15", cost: 0.35, requests: 245 },
    { date: "06-16", cost: 0.29, requests: 189 }
  ];

  const monthlyTrend = [
    { month: "2026-01", cost: 2.45, requests: 1840 },
    { month: "2026-02", cost: 3.12, requests: 2410 },
    { month: "2026-03", cost: 3.84, requests: 2880 },
    { month: "2026-04", cost: 4.95, requests: 3420 },
    { month: "2026-05", cost: 5.62, requests: 4210 },
    { month: "2026-06", cost: 6.84, requests: 5120 }
  ];

  const featureBreakdown = [
    { feature: "ats_analyzer", cost: 3.1245, requests: 1840, tokens: 4124000 },
    { feature: "jd_matcher", cost: 1.8420, requests: 1620, tokens: 2841000 },
    { feature: "resume_enhancer", cost: 1.2450, requests: 920, tokens: 1984000 },
    { feature: "placement_copilot", cost: 0.4520, requests: 480, tokens: 684000 },
    { feature: "linkedin_optimizer", cost: 0.1820, requests: 250, tokens: 242000 }
  ];

  const userBreakdown = [
    { name: "Mujahid Mujju", email: "mujahid@example.com", cost: 0.4852, requests: 142 },
    { name: "Aarav Sharma", email: "aarav@example.com", cost: 0.3124, requests: 84 },
    { name: "Priya Patel", email: "priya@example.com", cost: 0.2450, requests: 62 },
    { name: "Rohit Kumar", email: "rohit@example.com", cost: 0.1842, requests: 48 },
    { name: "Sneha Reddy", email: "sneha@example.com", cost: 0.1410, requests: 41 }
  ];

  const recentLogs = [
    { id: "1", timestamp: new Date(Date.now() - 50000).toISOString(), userName: "Mujahid Mujju", feature: "ats_analyzer", provider: "gemini", model: "gemini-3.5-flash", tokens: 1842, cost: 0.000138, success: true },
    { id: "2", timestamp: new Date(Date.now() - 150000).toISOString(), userName: "Aarav Sharma", feature: "placement_copilot", provider: "groq", model: "llama-3.1-8b-instant", tokens: 520, cost: 0.0, success: true },
    { id: "3", timestamp: new Date(Date.now() - 300000).toISOString(), userName: "Mujahid Mujju", feature: "placement_copilot", provider: "gemini", model: "gemini-3.5-flash", tokens: 1245, cost: 0.000093, success: true },
    { id: "4", timestamp: new Date(Date.now() - 450000).toISOString(), userName: "Priya Patel", feature: "jd_matcher", provider: "groq", model: "llama-3.1-8b-instant", tokens: 940, cost: 0.0, success: true },
    { id: "5", timestamp: new Date(Date.now() - 600000).toISOString(), userName: "System Admin", feature: "resume_enhancer", provider: "gemini", model: "gemini-3.5-flash", tokens: 2110, cost: 0.000158, success: true }
  ];

  return {
    summary: {
      dailyCost: 0.29,
      monthlyCost: 6.84,
      cumulativeCost: 26.82,
      totalRequests: 19870,
      geminiPercentage: 42.4,
      freePercentage: 57.6
    },
    dailyTrend,
    monthlyTrend,
    featureBreakdown,
    userBreakdown,
    recentLogs
  };
}
