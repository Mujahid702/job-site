import { supabase } from "@/lib/supabase";

export interface SubscriptionDetails {
  id: string;
  user_id: string;
  subscription_plan: string;
  billing_cycle: string;
  payment_provider: string | null;
  payment_reference: string | null;
  purchase_date: string;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'cancelled' | 'past_due';
  auto_renew: boolean;
  plan: {
    id: string;
    name: string;
    price: number;
    billing_cycle: string;
    allowed_features: string[];
    monthly_limits: Record<string, number>;
    priority_ai: boolean;
    storage: string;
    assessment_limits: number;
    resume_limits: number;
    project_limits: number;
  };
}

async function getDb(supabaseClient?: any) {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== "undefined") {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      return createClient();
    } catch {
      return supabase;
    }
  }
  return supabase;
}

/**
 * Calculates current billing period start, end, and days remaining based on the purchase date.
 */
export function getBillingPeriod(purchaseDateStr: string, billingCycle: string = 'monthly'): {
  periodStart: Date;
  periodEnd: Date;
  daysRemaining: number;
} {
  const purchaseDate = new Date(purchaseDateStr);
  const now = new Date();

  if (billingCycle === 'lifetime') {
    return {
      periodStart: purchaseDate,
      periodEnd: new Date(now.getFullYear() + 50, now.getMonth(), now.getDate()),
      daysRemaining: 365 * 50
    };
  }

  let periodStart = new Date(purchaseDate);
  let periodEnd = new Date(purchaseDate);

  if (billingCycle === 'yearly') {
    let yearsElapsed = now.getFullYear() - purchaseDate.getFullYear();
    periodStart.setFullYear(purchaseDate.getFullYear() + yearsElapsed);
    
    if (periodStart > now) {
      yearsElapsed--;
      periodStart = new Date(purchaseDate);
      periodStart.setFullYear(purchaseDate.getFullYear() + yearsElapsed);
    }
    
    periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodStart.getFullYear() + 1);
  } else {
    // Default: Monthly
    let monthsElapsed = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
    periodStart.setMonth(purchaseDate.getMonth() + monthsElapsed);
    
    if (periodStart > now) {
      monthsElapsed--;
      periodStart = new Date(purchaseDate);
      periodStart.setMonth(purchaseDate.getMonth() + monthsElapsed);
    }
    
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodStart.getMonth() + 1);
  }

  const msRemaining = periodEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    periodStart,
    periodEnd,
    daysRemaining
  };
}

/**
 * Retrieves the user's active subscription, automatically reverting to Free if expired.
 */
export async function getUserSubscription(userId: string, supabaseClient?: any): Promise<SubscriptionDetails> {
  const db = await getDb(supabaseClient);

  // 1. Fetch user subscription row
  const { data: subData, error: subError } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (subError) {
    if (subError.code === 'PGRST205') {
      return await getUserSubscriptionLegacy(userId, db);
    }
    console.error("[SubscriptionEngine] Error loading user subscription:", subError);
    return getDefaultFreeSubscription(userId);
  }

  let activeSub = subData;

  // 2. If no subscription exists, create a default FREE subscription
  if (!activeSub) {
    const { data: newSub, error: insertError } = await db
      .from("subscriptions")
      .insert({
        user_id: userId,
        subscription_plan: 'free',
        billing_cycle: 'monthly',
        status: 'active',
        auto_renew: true
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[SubscriptionEngine] Error creating default subscription:", insertError);
      return getDefaultFreeSubscription(userId);
    }
    activeSub = newSub;
  }

  // 3. Check for Expiry
  if (activeSub.subscription_plan !== 'free' && activeSub.expiry_date) {
    const expiry = new Date(activeSub.expiry_date);
    const now = new Date();
    
    if (expiry < now) {
      console.log(`[SubscriptionEngine] User ${userId} subscription plan ${activeSub.subscription_plan} expired on ${activeSub.expiry_date}. Reverting to Free.`);
      
      const { data: updatedSub, error: downgradeError } = await db
        .from("subscriptions")
        .update({
          subscription_plan: 'free',
          billing_cycle: 'monthly',
          payment_provider: null,
          payment_reference: null,
          status: 'active',
          auto_renew: true,
          expiry_date: null,
          purchase_date: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (!downgradeError && updatedSub) {
        activeSub = updatedSub;
      }
    }
  }

  // 4. Fetch the plan details
  const { data: planData, error: planError } = await db
    .from("subscription_plans")
    .select("*")
    .eq("id", activeSub.subscription_plan)
    .single();

  if (planError) {
    console.error("[SubscriptionEngine] Error loading plan details:", planError);
    return {
      ...activeSub,
      plan: getFallbackPlanDetails(activeSub.subscription_plan)
    };
  }

  return {
    ...activeSub,
    plan: planData
  };
}

/**
 * Returns whether a user has premium access (non-free active subscription)
 */
export async function isPremium(userId: string, supabaseClient?: any): Promise<boolean> {
  try {
    const sub = await getUserSubscription(userId, supabaseClient);
    return sub.subscription_plan !== 'free' && sub.status === 'active';
  } catch (err) {
    console.error("[SubscriptionEngine] isPremium check failed:", err);
    return false;
  }
}

/**
 * Checks if user is permitted to use a feature and has remaining limits.
 */
export async function canUseFeature(
  userId: string,
  featureName: string,
  supabaseClient?: any
): Promise<{ allowed: boolean; limit: number; used: number; remaining: number; resetDate: string }> {
  try {
    const db = await getDb(supabaseClient);
    const sub = await getUserSubscription(userId, supabaseClient);

    // Bypass limits for admins or PRO/ULTIMATE unlimited features
    const planId = sub.subscription_plan;
    const planLimits = sub.plan.monthly_limits || {};
    const limit = planLimits[featureName] !== undefined ? planLimits[featureName] : -1;

    // Calculate billing period
    const { periodStart, periodEnd } = getBillingPeriod(sub.purchase_date, sub.billing_cycle);
    const periodStartStr = periodStart.toISOString().substring(0, 10); // 'YYYY-MM-DD'
    const resetDate = periodEnd.toISOString();

    if (limit === -1) {
      // Unlimited
      return { allowed: true, limit: Infinity, used: 0, remaining: Infinity, resetDate };
    }

    // Check allowed features list
    if (sub.plan.allowed_features && !sub.plan.allowed_features.includes(featureName)) {
      return { allowed: false, limit: 0, used: 0, remaining: 0, resetDate };
    }

    // Fetch usage counts for user's custom billing cycle start
    let usageData = null;
    const { data: rawUsage, error: usageError } = await db
      .from("feature_usage")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("feature_name", featureName)
      .eq("current_month", periodStartStr)
      .maybeSingle();

    if (usageError) {
      if (usageError.code === 'PGRST205') {
        const { data: legacyUsage, error: legacyError } = await db
          .from("user_usage_limits")
          .select("used_count")
          .eq("user_id", userId)
          .eq("feature_name", featureName)
          .eq("reset_month", periodStartStr.substring(0, 7))
          .maybeSingle();
        
        if (!legacyError && legacyUsage) {
          usageData = { usage_count: legacyUsage.used_count };
        }
      } else {
        console.error("[SubscriptionEngine] error reading feature usage:", usageError);
      }
    } else {
      usageData = rawUsage;
    }

    const used = usageData ? usageData.usage_count : 0;
    const remaining = Math.max(0, limit - used);
    const allowed = used < limit;

    return {
      allowed,
      limit,
      used,
      remaining,
      resetDate
    };
  } catch (err) {
    console.error("[SubscriptionEngine] canUseFeature exception:", err);
    return { allowed: true, limit: Infinity, used: 0, remaining: Infinity, resetDate: new Date().toISOString() };
  }
}

/**
 * Returns remaining trial allocation counts.
 */
export async function getRemainingFreeTrials(
  userId: string,
  featureName: string,
  supabaseClient?: any
): Promise<{ limit: number; used: number; remaining: number; resetDate: string }> {
  const result = await canUseFeature(userId, featureName, supabaseClient);
  return {
    limit: result.limit,
    used: result.used,
    remaining: result.remaining,
    resetDate: result.resetDate
  };
}

/**
 * Decrements remaining usage count after successful operation completion.
 */
export async function incrementUsage(
  userId: string,
  featureName: string,
  supabaseClient?: any
): Promise<void> {
  try {
    const db = await getDb(supabaseClient);
    const sub = await getUserSubscription(userId, supabaseClient);
    
    const planLimits = sub.plan.monthly_limits || {};
    const limit = planLimits[featureName] !== undefined ? planLimits[featureName] : -1;

    if (limit === -1) {
      // Unlimited features don't require tracking usage increments
      return;
    }

    const { periodStart, periodEnd } = getBillingPeriod(sub.purchase_date, sub.billing_cycle);
    const periodStartStr = periodStart.toISOString().substring(0, 10); // 'YYYY-MM-DD'
    const resetDate = periodEnd.toISOString();

    const { data: existingUsage, error: usageError } = await db
      .from("feature_usage")
      .select("id, usage_count")
      .eq("user_id", userId)
      .eq("feature_name", featureName)
      .eq("current_month", periodStartStr)
      .maybeSingle();

    if (usageError && usageError.code === 'PGRST205') {
      const resetMonth = periodStartStr.substring(0, 7);
      const { data: legacyUsage } = await db
        .from("user_usage_limits")
        .select("id, used_count")
        .eq("user_id", userId)
        .eq("feature_name", featureName)
        .eq("reset_month", resetMonth)
        .maybeSingle();

      if (legacyUsage) {
        await db
          .from("user_usage_limits")
          .update({
            used_count: legacyUsage.used_count + 1,
            last_used: new Date().toISOString()
          })
          .eq("id", legacyUsage.id);
      } else {
        await db
          .from("user_usage_limits")
          .insert({
            user_id: userId,
            feature_name: featureName,
            used_count: 1,
            monthly_limit: limit,
            reset_month: resetMonth,
            last_used: new Date().toISOString()
          });
      }
    } else if (existingUsage) {
      await db
        .from("feature_usage")
        .update({
          usage_count: existingUsage.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingUsage.id);
    } else {
      await db
        .from("feature_usage")
        .insert({
          user_id: userId,
          feature_name: featureName,
          usage_count: 1,
          monthly_limit: limit,
          current_month: periodStartStr,
          reset_date: resetDate
        });
    }

    // Telemetry Sync support
    try {
      await db.from("feature_telemetry").insert({
        user_id: userId,
        feature_name: featureName,
        plan_type: planIdToUpper(sub.subscription_plan),
        execution_time_ms: 0
      });
    } catch {}
  } catch (err) {
    console.error("[SubscriptionEngine] Failed to increment usage:", err);
  }
}

/**
 * Renews/Upgrades subscription details after verified checkout.
 */
export async function renewSubscription(
  userId: string,
  planId: string,
  reference: string,
  provider: string,
  supabaseClient?: any
): Promise<boolean> {
  try {
    const db = await getDb(supabaseClient);
    const now = new Date();
    
    // Calculate expiry (1 month from now)
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    const { error } = await db
      .from("subscriptions")
      .upsert({
        user_id: userId,
        subscription_plan: planId,
        billing_cycle: 'monthly',
        payment_provider: provider,
        payment_reference: reference,
        purchase_date: now.toISOString(),
        expiry_date: expiry.toISOString(),
        status: 'active',
        auto_renew: true,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      if (error.code === 'PGRST205') {
        const legacyPlan = planId === 'free' ? 'FREE' : 'PREMIUM';
        const { error: legacyError } = await db
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan_type: legacyPlan,
            status: 'Active',
            starts_at: now.toISOString(),
            expires_at: expiry.toISOString(),
            updated_at: now.toISOString()
          }, { onConflict: 'user_id' });
        
        if (legacyError) {
          console.error("[SubscriptionEngine] Legacy renew subscription failed:", legacyError);
          return false;
        }
      } else {
        console.error("[SubscriptionEngine] renewSubscription DB Error:", error);
        return false;
      }
    }

    // Synchronize to profiles isPremium flag
    try {
      const { data: profile } = await db
        .from("profiles")
        .select("raw_profile_data")
        .eq("user_id", userId)
        .maybeSingle();

      const raw = profile?.raw_profile_data || {};
      await db
        .from("profiles")
        .update({
          raw_profile_data: {
            ...raw,
            isPremium: planId !== 'free'
          }
        })
        .eq("user_id", userId);
    } catch (e) {
      console.error("[SubscriptionEngine] Profile flag sync failure:", e);
    }

    return true;
  } catch (err) {
    console.error("[SubscriptionEngine] renewSubscription Exception:", err);
    return false;
  }
}

/**
 * Cancels auto-renewal or disables active plan.
 */
export async function cancelSubscription(userId: string, supabaseClient?: any): Promise<boolean> {
  try {
    const db = await getDb(supabaseClient);
    const { error } = await db
      .from("subscriptions")
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (error) {
      if (error.code === 'PGRST205') {
        const { error: legacyError } = await db
          .from("user_subscriptions")
          .update({
            status: 'Cancelled',
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
        return !legacyError;
      }
      console.error("[SubscriptionEngine] cancelSubscription failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[SubscriptionEngine] cancelSubscription failed:", err);
    return false;
  }
}

// Fallback Helper Functions

async function getUserSubscriptionLegacy(userId: string, db: any): Promise<SubscriptionDetails> {
  const { data: subData, error: subError } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (subError) {
    console.error("[SubscriptionEngine] Legacy load error:", subError);
    return getDefaultFreeSubscription(userId);
  }

  let activeSub = subData;

  if (!activeSub) {
    const { data: newSub, error: insertError } = await db
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_type: 'FREE',
        status: 'Active'
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[SubscriptionEngine] Legacy insert error:", insertError);
      return getDefaultFreeSubscription(userId);
    }
    activeSub = newSub;
  }

  if (activeSub.plan_type !== 'FREE' && activeSub.expires_at) {
    const expiry = new Date(activeSub.expires_at);
    const now = new Date();
    if (expiry < now) {
      const { data: updatedSub } = await db
        .from("user_subscriptions")
        .update({
          plan_type: 'FREE',
          status: 'Active',
          expires_at: null,
          starts_at: now.toISOString()
        })
        .eq("user_id", userId)
        .select("*")
        .single();
      if (updatedSub) activeSub = updatedSub;
    }
  }

  const mappedPlan = activeSub.plan_type.toLowerCase() === 'premium' ? 'pro' : activeSub.plan_type.toLowerCase();

  return {
    id: activeSub.id,
    user_id: activeSub.user_id,
    subscription_plan: mappedPlan,
    billing_cycle: 'monthly',
    payment_provider: null,
    payment_reference: null,
    purchase_date: activeSub.starts_at || activeSub.created_at,
    expiry_date: activeSub.expires_at || null,
    status: activeSub.status.toLowerCase() === 'active' ? 'active' : 'cancelled',
    auto_renew: activeSub.status.toLowerCase() === 'active',
    plan: getFallbackPlanDetails(mappedPlan)
  };
}

function planIdToUpper(planId: string): 'FREE' | 'PREMIUM' | 'ADMIN' {
  if (planId === 'free') return 'FREE';
  if (planId === 'admin') return 'ADMIN';
  return 'PREMIUM';
}

function getDefaultFreeSubscription(userId: string): SubscriptionDetails {
  return {
    id: 'free_sub_id',
    user_id: userId,
    subscription_plan: 'free',
    billing_cycle: 'monthly',
    payment_provider: null,
    payment_reference: null,
    purchase_date: new Date().toISOString(),
    expiry_date: null,
    status: 'active',
    auto_renew: true,
    plan: getFallbackPlanDetails('free')
  };
}

function getFallbackPlanDetails(planId: string) {
  const plans: Record<string, any> = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      billing_cycle: 'monthly',
      allowed_features: ['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community'],
      monthly_limits: { ats_analyzer: 3, jd_matcher: 3, resume_builder: 1, resume_enhancer: 2, resume_comparison: 2, resume_analytics: -1, project_generation: 3, practice_mode: -1, exam_mode: 3, cover_letter_generation: 5, mock_interview_mins: 0, community: -1 },
      priority_ai: false,
      storage: '100MB',
      assessment_limits: 3,
      resume_limits: 3,
      project_limits: 3
    },
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      billing_cycle: 'monthly',
      allowed_features: ['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
      monthly_limits: { ats_analyzer: 10, jd_matcher: 10, resume_builder: 5, resume_enhancer: 10, resume_comparison: 10, resume_analytics: -1, project_generation: 10, practice_mode: -1, exam_mode: 10, cover_letter_generation: 15, mock_interview_mins: 30, community: -1 },
      priority_ai: false,
      storage: '500MB',
      assessment_limits: 10,
      resume_limits: 10,
      project_limits: 10
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      billing_cycle: 'monthly',
      allowed_features: ['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
      monthly_limits: { ats_analyzer: -1, jd_matcher: -1, resume_builder: -1, resume_enhancer: -1, resume_comparison: -1, resume_analytics: -1, project_generation: -1, practice_mode: -1, exam_mode: -1, cover_letter_generation: -1, mock_interview_mins: -1, community: -1 },
      priority_ai: true,
      storage: '2GB',
      assessment_limits: -1,
      resume_limits: -1,
      project_limits: -1
    },
    ultimate: {
      id: 'ultimate',
      name: 'Ultimate',
      price: 79.99,
      billing_cycle: 'monthly',
      allowed_features: ['ats_analyzer', 'jd_matcher', 'resume_builder', 'resume_enhancer', 'resume_comparison', 'resume_analytics', 'project_generation', 'exam_mode', 'cover_letter_generation', 'community', 'mock_interview'],
      monthly_limits: { ats_analyzer: -1, jd_matcher: -1, resume_builder: -1, resume_enhancer: -1, resume_comparison: -1, resume_analytics: -1, project_generation: -1, practice_mode: -1, exam_mode: -1, cover_letter_generation: -1, mock_interview_mins: -1, community: -1 },
      priority_ai: true,
      storage: '10GB',
      assessment_limits: -1,
      resume_limits: -1,
      project_limits: -1
    }
  };
  return plans[planId] || plans.free;
}
