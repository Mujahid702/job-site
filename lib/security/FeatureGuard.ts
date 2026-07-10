import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// 1. Definition of plan and limits
export const FEATURE_LIMITS: Record<string, { FREE: number; PREMIUM: number; ADMIN: number }> = {
  ats_analyzer: { FREE: 3, PREMIUM: Infinity, ADMIN: Infinity },
  jd_matcher: { FREE: 3, PREMIUM: Infinity, ADMIN: Infinity },
  resume_enhancer: { FREE: 5, PREMIUM: Infinity, ADMIN: Infinity },
  resume_builder: { FREE: 1, PREMIUM: Infinity, ADMIN: Infinity },
  resume_comparison: { FREE: 3, PREMIUM: Infinity, ADMIN: Infinity },
  resume_analytics: { FREE: 5, PREMIUM: Infinity, ADMIN: Infinity },
  project_generation: { FREE: 3, PREMIUM: Infinity, ADMIN: Infinity },
  exam_mode: { FREE: 3, PREMIUM: Infinity, ADMIN: Infinity },
  cover_letter_generation: { FREE: 5, PREMIUM: Infinity, ADMIN: Infinity }
};

export interface QuotaCheckResult {
  allowed: boolean;
  plan: "FREE" | "PREMIUM" | "ADMIN";
  usedCount: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

// Helper to hash IP or Device IDs for privacy
export function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// List of standard disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamail.com",
  "maildrop.cc",
  "getnada.com"
];

/**
 * Lazy retrieves or creates a user's subscription
 */
export async function getOrCreateSubscription(userId: string): Promise<{ plan_type: "FREE" | "PREMIUM" | "ADMIN"; expires_at: string | null }> {
  // Query Supabase
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("plan_type, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[FeatureGuard] Error reading user subscription:", error);
    return { plan_type: "FREE", expires_at: null };
  }

  if (data) {
    return { plan_type: data.plan_type as any, expires_at: data.expires_at };
  }

  // Create default subscription
  const { data: newSub, error: insertError } = await supabase
    .from("user_subscriptions")
    .insert({ user_id: userId, plan_type: "FREE" })
    .select("plan_type, expires_at")
    .single();

  if (insertError) {
    console.error("[FeatureGuard] Error creating default subscription:", insertError);
    return { plan_type: "FREE", expires_at: null };
  }

  return { plan_type: newSub.plan_type as any, expires_at: newSub.expires_at };
}

/**
 * Checks if user is permitted to run a feature based on monthly limits
 */
export async function checkUsage(userId: string, featureName: string): Promise<QuotaCheckResult> {
  const currentMonth = new Date().toISOString().substring(0, 7); // format: 'YYYY-MM'
  
  // Calculate next reset date (1st of next month)
  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  nextMonth.setUTCDate(1);
  nextMonth.setUTCHours(0, 0, 0, 0);
  const resetDate = nextMonth.toISOString();

  // Get User Plan
  const sub = await getOrCreateSubscription(userId);
  const plan = sub.plan_type;
  
  // Look up limit map
  const featureLimitDef = FEATURE_LIMITS[featureName];
  if (!featureLimitDef) {
    // If feature has no specified limits, allow unlimited usage
    return { allowed: true, plan, usedCount: 0, limit: Infinity, remaining: Infinity, resetDate };
  }

  const limit = featureLimitDef[plan];
  if (limit === Infinity) {
    return { allowed: true, plan, usedCount: 0, limit: Infinity, remaining: Infinity, resetDate };
  }

  // Fetch usage count for this month
  const { data, error } = await supabase
    .from("user_usage_limits")
    .select("used_count")
    .eq("user_id", userId)
    .eq("feature_name", featureName)
    .eq("reset_month", currentMonth)
    .maybeSingle();

  if (error) {
    console.error("[FeatureGuard] Error checking usage metrics:", error);
    return { allowed: true, plan, usedCount: 0, limit, remaining: limit, resetDate };
  }

  const usedCount = data ? data.used_count : 0;
  const allowed = usedCount < limit;
  const remaining = Math.max(0, limit - usedCount);

  return { allowed, plan, usedCount, limit, remaining, resetDate };
}

/**
 * Safe transaction-friendly incrementation of usage limits
 */
export async function incrementUsage(
  userId: string,
  featureName: string,
  options?: {
    executionTimeMs?: number;
    aiTokens?: number;
    estimatedCostUsd?: number;
    deviceHash?: string;
    ipHash?: string;
    blockedReason?: string;
  }
): Promise<void> {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const sub = await getOrCreateSubscription(userId);
  const plan = sub.plan_type;

  // Perform limit updates
  const { data: existingLimit } = await supabase
    .from("user_usage_limits")
    .select("id, used_count")
    .eq("user_id", userId)
    .eq("feature_name", featureName)
    .eq("reset_month", currentMonth)
    .maybeSingle();

  if (existingLimit) {
    await supabase
      .from("user_usage_limits")
      .update({ used_count: existingLimit.used_count + 1, last_used: new Date().toISOString() })
      .eq("id", existingLimit.id);
  } else {
    const featureLimitDef = FEATURE_LIMITS[featureName];
    const defaultLimit = featureLimitDef ? featureLimitDef.FREE : 5;
    await supabase
      .from("user_usage_limits")
      .insert({
        user_id: userId,
        feature_name: featureName,
        monthly_limit: defaultLimit,
        used_count: 1,
        reset_month: currentMonth,
        last_used: new Date().toISOString()
      });
  }

  // Insert feature execution telemetry data row
  await supabase
    .from("feature_telemetry")
    .insert({
      user_id: userId,
      feature_name: featureName,
      plan_type: plan,
      execution_time_ms: options?.executionTimeMs || 0,
      ai_tokens: options?.aiTokens || 0,
      estimated_cost_usd: options?.estimatedCostUsd || 0.000000,
      device_hash: options?.deviceHash || null,
      ip_hash: options?.ipHash || null,
      blocked_reason: options?.blockedReason || null
    });
}

/**
 * Registers/evaluates device fingerprints
 */
export async function evaluateDeviceFingerprint(
  userId: string,
  deviceHash: string,
  details: {
    browser?: string;
    os?: string;
    locationCountry?: string;
    ip?: string;
  }
): Promise<{ isTrusted: boolean; requiresVerification: boolean }> {
  // Query Supabase for device record
  const { data: existingDevice, error } = await supabase
    .from("user_devices")
    .select("is_trusted")
    .eq("user_id", userId)
    .eq("device_hash", deviceHash)
    .maybeSingle();

  if (error) {
    console.error("[FeatureGuard] Device verify error:", error);
    return { isTrusted: true, requiresVerification: false };
  }

  const clientIpHash = details.ip ? hashString(details.ip) : null;

  if (existingDevice) {
    // Update last login
    await supabase
      .from("user_devices")
      .update({ last_login: new Date().toISOString(), last_ip: clientIpHash })
      .eq("user_id", userId)
      .eq("device_hash", deviceHash);

    return { isTrusted: existingDevice.is_trusted, requiresVerification: !existingDevice.is_trusted };
  }

  // Check total devices for user
  const { count } = await supabase
    .from("user_devices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const deviceCount = count || 0;
  const isFirstDevice = deviceCount === 0;

  // Insert new device
  await supabase
    .from("user_devices")
    .insert({
      user_id: userId,
      device_hash: deviceHash,
      browser: details.browser || "Unknown",
      os: details.os || "Unknown",
      location_country: details.locationCountry || "Unknown",
      last_ip: clientIpHash,
      is_trusted: isFirstDevice // auto-trust first device
    });

  if (!isFirstDevice) {
    // Multi-device suspicion trigger
    await supabase
      .from("security_events")
      .insert({
        user_id: userId,
        event_type: "Device mismatch",
        risk_score: 40,
        ip_hash: clientIpHash,
        details: {
          msg: "New untrusted device signature detected on account login.",
          browser: details.browser,
          os: details.os
        }
      });

    return { isTrusted: false, requiresVerification: true };
  }

  return { isTrusted: true, requiresVerification: false };
}

/**
 * Calculates identity abuse risk scoring values
 */
export async function evaluateAbuseRisk(
  userId: string,
  details: {
    email?: string;
    deviceHash?: string;
    ip?: string;
    isTemporaryBrowser?: boolean;
    isVpn?: boolean;
  }
): Promise<{ riskScore: number; actionRequired: boolean }> {
  let riskScore = 0;
  const auditDetails: Record<string, any> = {};

  // 1. Disposable Email check (+40)
  if (details.email) {
    const domain = details.email.split("@")[1]?.toLowerCase();
    if (domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      riskScore += 40;
      auditDetails.disposableEmail = domain;
    }
  }

  // 2. Multi-accounts on same device check (+40)
  if (details.deviceHash) {
    const { count } = await supabase
      .from("user_devices")
      .select("user_id", { count: "exact", head: true })
      .eq("device_hash", details.deviceHash);

    const accountsCount = count || 0;
    if (accountsCount >= 5) {
      riskScore += 40;
      auditDetails.accountsOnSameDeviceCount = accountsCount;
    } else if (accountsCount >= 3) {
      riskScore += 20;
      auditDetails.accountsOnSameDeviceCount = accountsCount;
    }
  }

  // 3. VPN Check (+20)
  if (details.isVpn) {
    riskScore += 20;
    auditDetails.vpnDetected = true;
  }

  // 4. Temporary Browser context (+10)
  if (details.isTemporaryBrowser) {
    riskScore += 10;
    auditDetails.temporaryBrowser = true;
  }

  const clientIpHash = details.ip ? hashString(details.ip) : null;

  // Log to database if score triggers
  if (riskScore > 0) {
    await supabase
      .from("security_events")
      .insert({
        user_id: userId,
        event_type: riskScore >= 40 ? "Multiple Accounts" : "Rate limit exceeded",
        risk_score: riskScore,
        ip_hash: clientIpHash,
        details: auditDetails
      });
  }

  return { riskScore, actionRequired: riskScore > 70 };
}
