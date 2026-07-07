import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { calculatePRIScore } from "./placement-readiness";
import { logAnalyticsEvent } from "./admin-analytics";

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

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  invitesSent: number;
  joinedCount: number;
  activatedCount: number;
  convertedCount: number;
  clicksCount: number;
  activationRate: number;
  conversionRate: number;
  referralScore: number;
  topReferralSources: Array<{ source: string; count: number; conversions: number }>;
  growthTrend: Array<{ date: string; count: number }>;
}

export interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  college: string;
  branch: string;
  priScore: number;
  totalXp: number;
  referralCount: number;
  streakDays: number;
}

// 1. Referral Link and Stats Helpers
export async function getUserReferralStats(userId: string, supabaseClient?: any): Promise<ReferralStats> {
  try {
    const db = await getDb(supabaseClient);
    // Get profile to check/generate referral code
    const { data: profile } = await db
      .from("profiles")
      .select("referral_code, full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    let code = profile?.referral_code;
    if (!code) {
      code = await generateUserReferralCode(userId, profile?.full_name || profile?.email || "USER", db);
    }

    const { data: refs } = await db
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", userId);

    const refList = refs || [];
    
    const clicksCount = refList.filter((r: any) => r.status === "Invite Opened").length;
    const joinedCount = refList.filter((r: any) => !["Invited", "Invite Sent", "Invite Opened"].includes(r.status)).length;
    const activatedCount = refList.filter((r: any) => ["Activated", "Activated User", "Converted", "Premium Conversion", "Applications Submitted"].includes(r.status)).length;
    const convertedCount = refList.filter((r: any) => ["Converted", "Premium Conversion", "Applications Submitted"].includes(r.status)).length;
    
    // Total invites sent (clicks + joined)
    const invitesSent = refList.length;

    const activationRate = joinedCount > 0 ? Math.round((activatedCount / joinedCount) * 100) : 0;
    const conversionRate = activatedCount > 0 ? Math.round((convertedCount / activatedCount) * 100) : 0;

    // Referral Score
    const referralScore = Math.round((activatedCount * 15) + (convertedCount * 30));

    // Top sources (mocked based on browser user agents / generic targets)
    const topReferralSources = [
      { source: "WhatsApp Share", count: Math.round(invitesSent * 0.6), conversions: Math.round(joinedCount * 0.6) },
      { source: "Direct Link", count: Math.round(invitesSent * 0.3), conversions: Math.round(joinedCount * 0.3) },
      { source: "LinkedIn Post", count: Math.round(invitesSent * 0.1), conversions: Math.round(joinedCount * 0.1) }
    ];

    // Growth trend over last 7 days
    const growthTrend = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      // Filter joins by date
      const count = refList.filter((r: any) => {
        if (!r.joined_at) return false;
        const joinedDate = new Date(r.joined_at);
        return joinedDate.toDateString() === d.toDateString();
      }).length;

      growthTrend.push({ date: dateStr, count });
    }

    // Build absolute site URL path for referrals
    const siteUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || "https://buggedbrain.com";

    return {
      referralCode: code,
      referralLink: `${siteUrl}/invite/${code}`,
      invitesSent,
      joinedCount,
      activatedCount,
      convertedCount,
      clicksCount,
      activationRate,
      conversionRate,
      referralScore,
      topReferralSources,
      growthTrend
    };
  } catch (err) {
    console.error("Error fetching user referral stats:", err);
    return {
      referralCode: "BBGROWTH",
      referralLink: "https://buggedbrain.com/invite/BBGROWTH",
      invitesSent: 0,
      joinedCount: 0,
      activatedCount: 0,
      convertedCount: 0,
      clicksCount: 0,
      activationRate: 0,
      conversionRate: 0,
      referralScore: 0,
      topReferralSources: [],
      growthTrend: []
    };
  }
}

export async function generateUserReferralCode(userId: string, nameSeed: string, supabaseClient?: any): Promise<string> {
  const db = await getDb(supabaseClient);
  const prefix = nameSeed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 7) || "BB";
  
  let attempts = 0;
  let finalCode = "";
  
  while (attempts < 5) {
    const randomSuffix = Math.floor(100 + Math.random() * 900).toString(); // 3-digit random
    finalCode = `${prefix}${randomSuffix}`;

    // Verify uniqueness
    const { data } = await db
      .from("profiles")
      .select("user_id")
      .eq("referral_code", finalCode)
      .maybeSingle();

    if (!data) {
      // Unused code, save it
      await executeWrite("profiles", "update", { referral_code: finalCode }, { user_id: userId }, db);
      
      const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
      invalidateUserCache(userId).catch(console.error);
      invalidateGrowthCache(userId).catch(console.error);
      
      return finalCode;
    }
    attempts++;
  }
  
  // Final fallback
  finalCode = `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  await executeWrite("profiles", "update", { referral_code: finalCode }, { user_id: userId }, db);
  return finalCode;
}

// 2. Referral Conversion Lifecycle hooks
export async function processReferralClick(
  referralCode: string, 
  options?: { ip?: string; userAgent?: string; deviceFingerprint?: string },
  supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    // 1. Locate referrer
    const { data: referrer } = await db
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer) {
      return { success: false, error: "Invalid referral code." };
    }

    // 2. Insert click log with status 'Invite Opened'
    const clickPayload = {
      referrer_user_id: referrer.user_id,
      referred_user_id: null,
      referral_code: referralCode,
      status: "Invite Opened",
      opened_at: new Date().toISOString(),
      ip_address: options?.ip || null,
      user_agent: options?.userAgent || null,
      device_fingerprint: options?.deviceFingerprint || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const res = await executeWrite("referrals", "insert", clickPayload, undefined, db);
    if (!res.success) throw res.error;

    return { success: true };
  } catch (err: any) {
    console.error("processReferralClick failed:", err);
    return { success: false, error: err?.message || "Failed to process referral click." };
  }
}

export async function processReferralJoin(
  referredUserId: string, 
  referralCode: string,
  options?: { ip?: string; userAgent?: string; deviceFingerprint?: string },
  supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    // 1. Verify if code is valid and locate referrer
    const { data: referrer } = await db
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer || referrer.user_id === referredUserId) {
      return { success: false, error: "Invalid referral code or referring own profile." };
    }

    // 2. Check if this referred user already has a referrer relation
    const { data: existing } = await db
      .from("referrals")
      .select("id, status")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "User already referred." };
    }

    // 3. Find if there was a recent click from the same fingerprint/IP
    let existingClickId: string | null = null;
    if (options?.deviceFingerprint || options?.ip) {
      const query = db
        .from("referrals")
        .select("id")
        .eq("referrer_user_id", referrer.user_id)
        .eq("status", "Invite Opened")
        .is("referred_user_id", null);
      
      if (options.deviceFingerprint) {
        query.eq("device_fingerprint", options.deviceFingerprint);
      } else {
        query.eq("ip_address", options.ip);
      }
      
      const { data: match } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (match) {
        existingClickId = match.id;
      }
    }

    // 4. Check for anti-spam fraud triggers
    let isFlagged = false;
    let flagReason = "";

    // Self-referral logic or device duplication check
    if (options?.deviceFingerprint) {
      const { data: referrerLogs } = await db
        .from("referrals")
        .select("id")
        .eq("referrer_user_id", referrer.user_id)
        .eq("device_fingerprint", options.deviceFingerprint)
        .not("referred_user_id", "is", null);

      if (referrerLogs && referrerLogs.length > 0) {
        isFlagged = true;
        flagReason = "Referrer and referred user share the same device fingerprint (Self-referral check).";
      }
    }

    // Rate limit check: count account registrations from same IP in last 24h
    if (options?.ip) {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count } = await db
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", options.ip)
        .eq("status", "Account Created")
        .gt("created_at", oneDayAgo);

      if (count && count >= 3) {
        isFlagged = true;
        flagReason = "Excessive registrations (3+) from the same IP address in 24 hours.";
      }
    }

    // 5. Update the click log OR insert new record
    const refPayload = {
      referrer_user_id: referrer.user_id,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: "Account Created",
      joined_at: new Date().toISOString(),
      ip_address: options?.ip || null,
      user_agent: options?.userAgent || null,
      device_fingerprint: options?.deviceFingerprint || null,
      is_flagged: isFlagged,
      updated_at: new Date().toISOString()
    };

    let referralRecordId = "";
    if (existingClickId) {
      const updateRes = await executeWrite("referrals", "update", refPayload, { id: existingClickId }, db);
      if (!updateRes.success) throw updateRes.error;
      referralRecordId = existingClickId;
    } else {
      const insertRes = await executeWrite("referrals", "insert", {
        ...refPayload,
        created_at: new Date().toISOString()
      }, undefined, db);
      if (!insertRes.success) throw insertRes.error;
      const { data: newlyCreated } = await db
        .from("referrals")
        .select("id")
        .eq("referred_user_id", referredUserId)
        .single();
      referralRecordId = newlyCreated?.id || "";
    }

    // 6. Log spam flag if suspicious
    if (isFlagged && referralRecordId) {
      await executeWrite("referral_spam_flags", "insert", {
        referral_id: referralRecordId,
        reason: flagReason,
        severity: "Fraud",
        created_at: new Date().toISOString()
      }, undefined, db);
    }

    // 7. Reward Referrer if NOT flagged: fetch from reward rules
    if (!isFlagged) {
      const { data: rule } = await db
        .from("referral_reward_rules")
        .select("reward_xp")
        .eq("action", "Registration")
        .eq("status", "Active")
        .maybeSingle();

      const xpReward = rule?.reward_xp ?? 10;
      await addXpToUser(referrer.user_id, xpReward, db);
      
      // Track Growth event log
      await logAnalyticsEvent("referral_joined", referrer.user_id, {
        referredUserId,
        referralCode,
        xpRewarded: xpReward
      });
    }

    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referrer.user_id).catch(console.error);
    invalidateGrowthCache(referrer.user_id).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("processReferralJoin failed:", err);
    return { success: false, error: err?.message || "Failed to process referral join." };
  }
}

export async function processReferralOnboardingComplete(referredUserId: string, supabaseClient?: any): Promise<{ success: boolean; error?: string }> {
  const db = supabaseClient || supabase;
  try {
    const { data: referral } = await db
      .from("referrals")
      .select("*")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (!referral) {
      return { success: false, error: "No referral record found." };
    }

    if (referral.status === "Invite Opened" || referral.status === "Invite Sent" || referral.status === "Invited") {
      return { success: false, error: "Referral not registered." };
    }

    // Update status to Onboarding Completed
    const updateRes = await executeWrite(
      "referrals",
      "update",
      {
        status: "Onboarding Completed",
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { id: referral.id },
      supabaseClient
    );

    if (!updateRes.success) throw updateRes.error;

    // Reward referrer if not flagged
    if (!referral.is_flagged) {
      const { data: rule } = await db
        .from("referral_reward_rules")
        .select("reward_xp")
        .eq("action", "Onboarding Completed")
        .eq("status", "Active")
        .maybeSingle();

      const xpReward = rule?.reward_xp ?? 20;
      await addXpToUser(referral.referrer_user_id, xpReward, supabaseClient);

      await logAnalyticsEvent("referral_onboarded", referral.referrer_user_id, {
        referredUserId,
        xpRewarded: xpReward
      });
    }

    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referral.referrer_user_id).catch(console.error);
    invalidateGrowthCache(referral.referrer_user_id).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("processReferralOnboardingComplete failed:", err);
    return { success: false, error: err?.message || "Failed to process onboarding referral completion." };
  }
}

export async function processReferralActivation(referredUserId: string, supabaseClient?: any): Promise<{ success: boolean; error?: string }> {
  const db = supabaseClient || supabase;
  try {
    const { data: referral } = await db
      .from("referrals")
      .select("*")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (!referral) {
      return { success: false, error: "No pending referral found to activate." };
    }

    // Allow activating from Account Created or Onboarding Completed status
    if (referral.status !== "Account Created" && referral.status !== "Onboarding Completed" && referral.status !== "Joined") {
      return { success: false, error: "Referral not in state that can be activated." };
    }

    // Update status to Activated User, set activated_at
    const updateRes = await executeWrite(
      "referrals",
      "update",
      {
        status: "Activated User",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { id: referral.id },
      supabaseClient
    );

    if (!updateRes.success) throw updateRes.error;

    if (!referral.is_flagged) {
      // Get reward rule XP
      const { data: rule } = await db
        .from("referral_reward_rules")
        .select("reward_xp")
        .eq("action", "First ATS Scan")
        .eq("status", "Active")
        .maybeSingle();

      const xpReward = rule?.reward_xp ?? 150;
      await addXpToUser(referral.referrer_user_id, xpReward, supabaseClient);
      
      // Add referral bonus to placement_readiness mission_bonus_score
      const { data: priRec } = await db
        .from("placement_readiness")
        .select("mission_bonus_score")
        .eq("user_id", referral.referrer_user_id)
        .maybeSingle();

      const currentBonus = priRec?.mission_bonus_score || 0;
      await executeWrite(
        "placement_readiness",
        "update",
        { mission_bonus_score: currentBonus + 5 },
        { user_id: referral.referrer_user_id },
        supabaseClient
      );

      // Recalculate PRI for referrer to apply the points
      await calculatePRIScore(referral.referrer_user_id, undefined, supabaseClient);

      await logAnalyticsEvent("referral_activated", referral.referrer_user_id, {
        referredUserId,
        pointsAdded: 5,
        xpAdded: xpReward
      });
    }

    // Invalidate caches
    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referral.referrer_user_id).catch(console.error);
    invalidateGrowthCache(referral.referrer_user_id).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("processReferralActivation failed:", err);
    return { success: false, error: err?.message || "Failed to process activation." };
  }
}

export async function processReferralConversion(referredUserId: string, supabaseClient?: any): Promise<{ success: boolean; error?: string }> {
  const db = supabaseClient || supabase;
  try {
    const { data: referral } = await db
      .from("referrals")
      .select("*")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (!referral || (referral.status !== "Activated User" && referral.status !== "Activated")) {
      return { success: false, error: "Referral not active or already converted." };
    }

    // Update status to Premium Conversion
    const updateRes = await executeWrite(
      "referrals",
      "update",
      {
        status: "Premium Conversion",
        updated_at: new Date().toISOString()
      },
      { id: referral.id },
      supabaseClient
    );

    if (!updateRes.success) throw updateRes.error;

    if (!referral.is_flagged) {
      // Get reward rule XP
      const { data: rule } = await db
        .from("referral_reward_rules")
        .select("reward_xp")
        .eq("action", "Premium Upgrade")
        .eq("status", "Active")
        .maybeSingle();

      const xpReward = rule?.reward_xp ?? 100;
      await addXpToUser(referral.referrer_user_id, xpReward, supabaseClient);

      await logAnalyticsEvent("referral_converted", referral.referrer_user_id, {
        referredUserId,
        xpAdded: xpReward
      });
    }

    // Invalidate Cache
    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referral.referrer_user_id).catch(console.error);
    invalidateGrowthCache(referral.referrer_user_id).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("processReferralConversion failed:", err);
    return { success: false, error: err?.message || "Failed to process conversion." };
  }
}

// 3. User Streaks Engine
export async function getUserStreak(userId: string): Promise<any> {
  try {
    const { data: streak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (streak) return streak;

    // Create default streak log
    const payload = {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      streak_level: "Beginner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await executeWrite("user_streaks", "insert", payload);
    return payload;
  } catch (err) {
    console.error("Error getting user streak:", err);
    return { current_streak: 0, longest_streak: 0, streak_level: "Beginner" };
  }
}

export async function recordStreakActivity(userId: string, activityType: string): Promise<number> {
  try {
    const streak = await getUserStreak(userId);
    const todayStr = new Date().toISOString().split("T")[0]; // UTC today
    const lastActiveAt = streak.last_activity_at;

    if (lastActiveAt) {
      const lastActiveDateStr = new Date(lastActiveAt).toISOString().split("T")[0];
      if (lastActiveDateStr === todayStr) {
        return streak.current_streak; // Already active today
      }
    }

    let newStreak = 1;
    if (lastActiveAt) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const lastActiveDateStr = new Date(lastActiveAt).toISOString().split("T")[0];

      if (lastActiveDateStr === yesterdayStr) {
        newStreak = streak.current_streak + 1;
      }
    }

    const longest = Math.max(streak.longest_streak || 0, newStreak);
    
    // Evaluate levels
    let level = "Beginner";
    if (newStreak >= 180) level = "180 Days";
    else if (newStreak >= 90) level = "90 Days";
    else if (newStreak >= 60) level = "60 Days";
    else if (newStreak >= 30) level = "30 Days";
    else if (newStreak >= 7) level = "7 Days";
    else if (newStreak > 1) level = `${newStreak} Days`;

    // Award bonus XP for milestones
    let milestoneXP = 0;
    if (newStreak === 7) milestoneXP = 50;
    else if (newStreak === 30) milestoneXP = 250;
    else if (newStreak === 60) milestoneXP = 500;
    else if (newStreak === 90) milestoneXP = 750;
    else if (newStreak === 180) milestoneXP = 1500;

    if (milestoneXP > 0) {
      await addXpToUser(userId, milestoneXP);
    }

    await executeWrite(
      "user_streaks",
      "update",
      {
        current_streak: newStreak,
        longest_streak: longest,
        streak_level: level,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { user_id: userId }
    );

    // Sync streak with user_xp.streak_days
    await executeWrite(
      "user_xp",
      "update",
      {
        streak_days: newStreak,
        longest_streak: longest,
        last_activity_date: todayStr,
        updated_at: new Date().toISOString()
      },
      { user_id: userId }
    );

    // Recalculate PRI consistency score points
    await calculatePRIScore(userId);

    // Invalidate cache
    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(console.error);
    invalidateGrowthCache(userId).catch(console.error);

    await logAnalyticsEvent("streak_participation", userId, {
      streakDays: newStreak,
      activityType
    });

    return newStreak;
  } catch (err) {
    console.error("Failed to record streak activity:", err);
    return 0;
  }
}

// Helper: adds XP and recalculates level
async function addXpToUser(userId: string, xpToAdd: number, supabaseClient?: any) {
  const db = supabaseClient || supabase;
  try {
    const { data: userXp } = await db
      .from("user_xp")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const currentXp = userXp?.total_xp || 0;
    const nextXp = currentXp + xpToAdd;
    
    // Import calculateLevel dynamically
    const { calculateLevel } = await import("./missions");
    const nextLevel = calculateLevel(nextXp);

    await executeWrite(
      "user_xp",
      "update",
      {
        total_xp: nextXp,
        current_level: nextLevel,
        updated_at: new Date().toISOString()
      },
      { user_id: userId },
      supabaseClient
    );
  } catch (e) {
    console.error("addXpToUser failed:", e);
  }
}

// 4. Community Leaderboard logic
export async function getLeaderboardData(
  college?: string,
  branch?: string
): Promise<LeaderboardUser[]> {
  try {
    // Fetch user profiles, user_xp, placement_readiness, and referrals
    const profilesQuery = supabase
      .from("profiles")
      .select("user_id, full_name, college, branch");
    
    if (college) {
      profilesQuery.eq("college", college);
    }
    if (branch) {
      profilesQuery.eq("branch", branch);
    }

    const { data: usersList, error: pError } = await profilesQuery;
    if (pError) throw pError;

    if (!usersList || usersList.length === 0) return [];

    const userIds = usersList.map(u => u.user_id);

    // Fetch placement readiness indices
    const { data: priList } = await supabase
      .from("placement_readiness")
      .select("user_id, pri_score")
      .in("user_id", userIds);

    // Fetch user XP levels
    const { data: xpList } = await supabase
      .from("user_xp")
      .select("user_id, total_xp, streak_days")
      .in("user_id", userIds);

    // Fetch Referrals received to calculate count
    const { data: refList } = await supabase
      .from("referrals")
      .select("referrer_user_id");

    const referralCounts: Record<string, number> = {};
    if (refList) {
      refList.forEach(r => {
        referralCounts[r.referrer_user_id] = (referralCounts[r.referrer_user_id] || 0) + 1;
      });
    }

    const compiled: LeaderboardUser[] = usersList.map(user => {
      const priObj = priList?.find(p => p.user_id === user.user_id);
      const xpObj = xpList?.find(x => x.user_id === user.user_id);
      
      return {
        rank: 0, // Assigned below
        userId: user.user_id,
        name: user.full_name || "Placement Scholar",
        college: user.college || "Placement Academy",
        branch: user.branch || "Engineering",
        priScore: priObj?.pri_score || 0,
        totalXp: xpObj?.total_xp || 0,
        streakDays: xpObj?.streak_days || 0,
        referralCount: referralCounts[user.user_id] || 0
      };
    });

    // Sort: PRI score desc, total XP desc, referralCount desc, name asc
    compiled.sort((a, b) => {
      if (b.priScore !== a.priScore) return b.priScore - a.priScore;
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return b.referralCount - a.referralCount;
    });

    // Assign dynamic rank indexes
    return compiled.map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));

  } catch (err) {
    console.error("Error compiling leaderboard telemetry:", err);
    return [];
  }
}

// 5. Daily Placement Digest Generator
export async function getDailyDigest(userId: string): Promise<any> {
  try {
    // 1. Fetch active Job postings
    const { data: drives } = await supabase
      .from("job_postings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    const drivesList = drives || [];
    
    // Separate into drives and internships
    const topDrives = drivesList
      .filter(d => !d.job_type?.toLowerCase().includes("intern"))
      .slice(0, 3)
      .map(d => ({
        id: d.id,
        title: d.title,
        company: d.company,
        ctc: d.salary || "N/A",
        deadline: d.deadline || new Date(Date.now() + 86400000 * 5).toISOString(),
        link: `/jobs/${d.slug || d.id}`
      }));

    const topInternships = drivesList
      .filter(d => d.job_type?.toLowerCase().includes("intern"))
      .slice(0, 2)
      .map(d => ({
        id: d.id,
        title: d.title,
        company: d.company,
        duration: "3 - 6 Months",
        stipend: d.salary || "Performance Bonus",
        link: `/jobs/${d.slug || d.id}`
      }));

    // 2. Fetch pending daily missions for this user
    const { data: userMissions } = await supabase
      .from("user_missions")
      .select("*, placement_missions(*)")
      .eq("user_id", userId)
      .eq("completed", false)
      .limit(3);

    const pendingMissions = (userMissions || [])
      .filter(um => um.placement_missions?.mission_type === "daily")
      .map(um => ({
        title: um.placement_missions?.title || "Daily Practice",
        reward: `+${um.placement_missions?.xp_reward || 10} XP`
      }));

    // Fallbacks if no pending daily missions
    if (pendingMissions.length === 0) {
      pendingMissions.push(
        { title: "Complete AI Mock Interview", reward: "+100 XP" },
        { title: "Optimize Resume SDE Gaps", reward: "+50 XP" }
      );
    }

    // 3. Static array of strategic placement tips
    const tipsList = [
      "Quantify SDE achievements. Use the formula: 'Accomplished X, measured by Y, by doing Z.'",
      "Fintech and high-frequency trading SDE hiring rounds prioritize solid memory management, threading, and lower bounds logic.",
      "Send recruiter outreach emails between Tuesday and Thursday at 9:30 AM local time for 60%+ response rate.",
      "Include keywords from the Job Description directly in your resume projects before applying to bypass ATS filters.",
      "Follow up on application status exactly 7 days after submission to show high career consistency."
    ];

    const tip = tipsList[Math.floor(Math.random() * tipsList.length)];

    return {
      topDrives,
      topInternships,
      pendingMissions,
      placementTip: tip,
      generatedDate: new Date().toLocaleDateString()
    };
  } catch (err) {
    console.error("Error compiling daily placement digest:", err);
    return {
      topDrives: [],
      topInternships: [],
      pendingMissions: [],
      placementTip: "Improve SDE project highlights to stand out.",
      generatedDate: new Date().toLocaleDateString()
    };
  }
}

// 6. Campaign & Analytics Helpers
export async function getCampaigns(): Promise<any[]> {
  try {
    const { data: campaigns, error } = await supabase
      .from("whatsapp_campaigns")
      .select("*, campaign_analytics(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return campaigns || [];
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    return [];
  }
}

export async function createCampaign(campaign: any): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const payload = {
      title: campaign.title,
      type: campaign.type,
      status: campaign.status || "Draft",
      message_template: campaign.messageTemplate,
      scheduled_at: campaign.scheduledAt || null,
      target_group: campaign.targetGroup || "all",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Create campaigns analytics tracker shell
    const trackerPayload = {
      campaign_id: data.id,
      sent_count: 0,
      click_count: 0,
      join_count: 0,
      registration_count: 0,
      application_count: 0,
      conversion_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await executeWrite("campaign_analytics", "insert", trackerPayload);

    return { success: true, data };
  } catch (err) {
    console.error("Error creating campaign:", err);
    return { success: false, error: err };
  }
}

export async function sendCampaign(campaignId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { data: campaign } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (!campaign) throw new Error("Campaign not found.");

    // Update status
    await executeWrite(
      "whatsapp_campaigns",
      "update",
      {
        status: "Sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { id: campaignId }
    );

    // Populate mock analytics data to simulate delivery, clicks, and conversions
    const usersCount = 350; // mock target user base
    const sentCount = usersCount;
    const clickCount = Math.round(usersCount * (0.35 + Math.random() * 0.25)); // 35%-60% CTR
    const joinCount = Math.round(clickCount * (0.4 + Math.random() * 0.3)); // 40%-70% Joins
    const registrationCount = Math.round(joinCount * 0.8);
    const applicationCount = Math.round(registrationCount * 0.65);
    const conversionCount = Math.round(applicationCount * 0.45);

    await executeWrite(
      "campaign_analytics",
      "update",
      {
        sent_count: sentCount,
        click_count: clickCount,
        join_count: joinCount,
        registration_count: registrationCount,
        application_count: applicationCount,
        conversion_count: conversionCount,
        updated_at: new Date().toISOString()
      },
      { campaign_id: campaignId }
    );

    return { success: true };
  } catch (err) {
    console.error(`Error sending campaign ${campaignId}:`, err);
    return { success: false, error: err };
  }
}

// Helper: Calculate profile completion score dynamically
function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;
  const fields = [
    'full_name', 'email', 'phone', 'college', 'branch', 
    'graduation_year', 'github_url', 'linkedin_url', 'target_role', 'bio'
  ];
  let filled = 0;
  fields.forEach(field => {
    if (profile[field] && String(profile[field]).trim().length > 0) {
      filled++;
    }
  });
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    filled++;
  } else if (profile.skills && typeof profile.skills === 'string' && profile.skills.trim().length > 0) {
    filled++;
  }
  return Math.round((filled / (fields.length + 1)) * 100);
}

// 7. Community Group Helpers
export async function getCommunityGroups(userId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data: groups, error: gError } = await db
      .from("community_groups")
      .select("*")
      .order("display_order", { ascending: true });

    if (gError) throw gError;

    // Fetch joined status
    const { data: joined } = await db
      .from("community_group_members")
      .select("group_id")
      .eq("user_id", userId);
    const joinedIds = new Set((joined || []).map((j: any) => j.group_id));

    // Fetch saved status
    const { data: saved } = await db
      .from("community_group_saves")
      .select("group_id")
      .eq("user_id", userId);
    const savedIds = new Set((saved || []).map((s: any) => s.group_id));

    // Fetch profile and resume scan context for locks
    const { data: profile } = await db
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: scans } = await db
      .from("resume_scans")
      .select("ats_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestScan = scans && scans.length > 0 ? scans[0] : null;
    const currentAts = latestScan?.ats_score || 0;
    const isResumeUploaded = !!latestScan;
    const currentCompletion = profile?.profile_completion || calculateProfileCompletion(profile);
    const isOnboardingCompleted = profile?.onboarding_completed || false;

    // Map lock statuses
    const mapped = (groups || []).map((group: any) => {
      let isLocked = false;
      const requirements = [];

      if (group.unlock_onboarding_completed && !isOnboardingCompleted) {
        isLocked = true;
        requirements.push("Onboarding Completed");
      }
      if (group.unlock_resume_uploaded && !isResumeUploaded) {
        isLocked = true;
        requirements.push("Resume Uploaded");
      }
      if (group.unlock_min_profile_completion > 0 && currentCompletion < group.unlock_min_profile_completion) {
        isLocked = true;
        requirements.push(`Profile completion > ${group.unlock_min_profile_completion}%`);
      }
      if (group.unlock_min_ats_score > 0 && currentAts < group.unlock_min_ats_score) {
        isLocked = true;
        requirements.push(`ATS Resume Score > ${group.unlock_min_ats_score}`);
      }

      return {
        ...group,
        isJoined: joinedIds.has(group.id),
        isSaved: savedIds.has(group.id),
        isLocked,
        lockDetails: {
          requirements,
          currentAts,
          minAts: group.unlock_min_ats_score,
          currentCompletion,
          minCompletion: group.unlock_min_profile_completion,
          resumeUploaded: isResumeUploaded,
          onboardingCompleted: isOnboardingCompleted
        }
      };
    });

    return { success: true, groups: mapped };
  } catch (err: any) {
    console.error("getCommunityGroups failed:", err);
    return { success: false, message: err.message || "Failed to fetch groups." };
  }
}

export async function joinCommunityGroup(userId: string, groupId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    // 1. Fetch group to check if locked
    const { data: group } = await db
      .from("community_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (!group) throw new Error("Group not found.");

    // Check lock requirements
    const groupsRes = await getCommunityGroups(userId, db);
    if (groupsRes.success) {
      const g = groupsRes.groups?.find((x: any) => x.id === groupId);
      if (g && g.isLocked) {
        return { success: false, error: "This group is locked. Meet the requirements to unlock access." };
      }
    }

    // 2. Add to membership
    const payload = {
      group_id: groupId,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const res = await executeWrite("community_group_members", "insert", payload, undefined, db);
    if (!res.success) {
      if (res.error?.code === "23505") { // Unique constraint
        return { success: true, message: "Already a member." };
      }
      throw res.error;
    }

    // 3. Increment member count
    const nextCount = (group.member_count || 0) + 1;
    await executeWrite("community_groups", "update", { member_count: nextCount }, { id: groupId }, db);

    // Reward XP for Joining community (5 XP)
    await addXpToUser(userId, 5, db);

    return { success: true, nextCount };
  } catch (err: any) {
    console.error("joinCommunityGroup failed:", err);
    return { success: false, error: err.message || "Failed to join group." };
  }
}

export async function leaveCommunityGroup(userId: string, groupId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data: group } = await db
      .from("community_groups")
      .select("member_count")
      .eq("id", groupId)
      .single();

    if (!group) throw new Error("Group not found.");

    const res = await executeWrite(
      "community_group_members",
      "delete",
      null,
      { user_id: userId, group_id: groupId },
      db
    );
    if (!res.success) throw res.error;

    // Decrement member count
    const nextCount = Math.max(0, (group.member_count || 0) - 1);
    await executeWrite("community_groups", "update", { member_count: nextCount }, { id: groupId }, db);

    return { success: true, nextCount };
  } catch (err: any) {
    console.error("leaveCommunityGroup failed:", err);
    return { success: false, error: err.message || "Failed to leave group." };
  }
}

export async function saveCommunityGroup(userId: string, groupId: string, status: boolean, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    if (status) {
      const res = await executeWrite("community_group_saves", "insert", {
        group_id: groupId,
        user_id: userId,
        created_at: new Date().toISOString()
      }, undefined, db);
      if (!res.success && res.error?.code !== "23505") throw res.error;
    } else {
      const res = await executeWrite(
        "community_group_saves",
        "delete",
        null,
        { user_id: userId, group_id: groupId },
        db
      );
      if (!res.success) throw res.error;
    }
    return { success: true };
  } catch (err: any) {
    console.error("saveCommunityGroup failed:", err);
    return { success: false, error: err.message || "Failed to save group." };
  }
}

// 8. Community Event Helpers
export async function getCommunityEvents(userId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data: events, error } = await db
      .from("community_events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Fetch user registrations
    const { data: regs } = await db
      .from("community_event_registrations")
      .select("event_id, status")
      .eq("user_id", userId);
    
    const regMap = new Map((regs || []).map((r: any) => [r.event_id, r.status]));

    const mapped = (events || []).map((event: any) => ({
      ...event,
      isRegistered: regMap.get(event.id) === "Registered",
      isBookmarked: regMap.get(event.id) === "Bookmarked"
    }));

    return { success: true, events: mapped };
  } catch (err: any) {
    console.error("getCommunityEvents failed:", err);
    return { success: false, error: err.message || "Failed to fetch events." };
  }
}

export async function registerForEvent(userId: string, eventId: string, status: "Registered" | "Bookmarked" | "Unregistered", supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    if (status === "Unregistered") {
      const res = await executeWrite(
        "community_event_registrations",
        "delete",
        null,
        { user_id: userId, event_id: eventId },
        db
      );
      if (!res.success) throw res.error;
    } else {
      const res = await executeWrite(
        "community_event_registrations",
        "upsert",
        {
          event_id: eventId,
          user_id: userId,
          status,
          created_at: new Date().toISOString()
        },
        { user_id: userId, event_id: eventId },
        db
      );
      if (!res.success) throw res.error;

      // Small XP bump for registering (5 XP)
      if (status === "Registered") {
        await addXpToUser(userId, 5, db);
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error("registerForEvent failed:", err);
    return { success: false, error: err.message || "Failed to update registration status." };
  }
}

// 9. Ambassador Program Helpers
export async function applyAmbassador(userId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const payload = {
      user_id: userId,
      status: "Pending",
      referred_count: 0,
      community_impact_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const res = await executeWrite("placement_ambassadors", "insert", payload, undefined, db);
    if (!res.success) {
      if (res.error?.code === "23505") {
        return { success: false, error: "Application already exists." };
      }
      throw res.error;
    }

    return { success: true };
  } catch (err: any) {
    console.error("applyAmbassador failed:", err);
    return { success: false, error: err.message || "Failed to submit ambassador request." };
  }
}

export async function getAmbassadorStatus(userId: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("placement_ambassadors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, ambassador: data };
  } catch (err: any) {
    console.error("getAmbassadorStatus failed:", err);
    return { success: false, error: err.message };
  }
}

export async function getAmbassadorList(supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("placement_ambassadors")
      .select("*, profiles(full_name, college, email)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, list: data || [] };
  } catch (err: any) {
    console.error("getAmbassadorList failed:", err);
    return { success: false, error: err.message };
  }
}

export async function updateAmbassadorStatus(id: string, status: "Approved" | "Rejected", supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const res = await executeWrite(
      "placement_ambassadors",
      "update",
      { status, updated_at: new Date().toISOString() },
      { id },
      db
    );
    if (!res.success) throw res.error;

    return { success: true };
  } catch (err: any) {
    console.error("updateAmbassadorStatus failed:", err);
    return { success: false, error: err.message };
  }
}
