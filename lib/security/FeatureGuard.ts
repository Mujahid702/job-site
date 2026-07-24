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
  const { getUserSubscription } = await import("@/lib/services/subscription");
  const sub = await getUserSubscription(userId);
  let plan_type: "FREE" | "PREMIUM" | "ADMIN" = "FREE";
  
  if (sub.subscription_plan === "admin") {
    plan_type = "ADMIN";
  } else if (sub.subscription_plan !== "free") {
    plan_type = "PREMIUM";
  }

  return {
    plan_type,
    expires_at: sub.expiry_date
  };
}

/**
 * Checks if user is permitted to run a feature based on monthly limits
 */
export async function checkUsage(userId: string, featureName: string): Promise<QuotaCheckResult> {
  const { canUseFeature, getUserSubscription } = await import("@/lib/services/subscription");
  const result = await canUseFeature(userId, featureName);
  const sub = await getUserSubscription(userId);
  
  let plan: "FREE" | "PREMIUM" | "ADMIN" = "FREE";
  if (sub.subscription_plan === "admin") {
    plan = "ADMIN";
  } else if (sub.subscription_plan !== "free") {
    plan = "PREMIUM";
  }

  return {
    allowed: result.allowed,
    plan,
    usedCount: result.used,
    limit: result.limit === Infinity ? 999999 : result.limit,
    remaining: result.remaining === Infinity ? 999999 : result.remaining,
    resetDate: result.resetDate
  };
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
  const { incrementUsage: incUsage } = await import("@/lib/services/subscription");
  await incUsage(userId, featureName);
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
