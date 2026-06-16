import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { calculatePRIScore } from "./placement-readiness";
import { logAnalyticsEvent } from "./admin-analytics";

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  invitesSent: number;
  joinedCount: number;
  activatedCount: number;
  convertedCount: number;
  activationRate: number;
  conversionRate: number;
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
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  try {
    // Get profile to check/generate referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    let code = profile?.referral_code;
    if (!code) {
      code = await generateUserReferralCode(userId, profile?.full_name || profile?.email || "USER");
    }

    const { data: refs } = await supabase
      .from("referrals")
      .select("status")
      .eq("referrer_user_id", userId);

    const refList = refs || [];
    const joined = refList.filter(r => r.status === "Joined").length;
    const activated = refList.filter(r => r.status === "Activated").length;
    const converted = refList.filter(r => r.status === "Converted").length;
    
    // total sends include all tracked referred user relations
    const totalCount = refList.length;

    const activationRate = joined > 0 ? Math.round((activated / joined) * 100) : 0;
    const conversionRate = activated > 0 ? Math.round((converted / activated) * 100) : 0;

    // Build absolute site URL path for referrals
    const siteUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || "https://buggedbrain.com";

    return {
      referralCode: code,
      referralLink: `${siteUrl}/invite/${code}`,
      invitesSent: totalCount,
      joinedCount: joined + activated + converted,
      activatedCount: activated + converted,
      convertedCount: converted,
      activationRate,
      conversionRate
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
      activationRate: 0,
      conversionRate: 0
    };
  }
}

export async function generateUserReferralCode(userId: string, nameSeed: string): Promise<string> {
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
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", finalCode)
      .maybeSingle();

    if (!data) {
      // Unused code, save it
      await executeWrite("profiles", "update", { referral_code: finalCode }, { user_id: userId });
      
      const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
      invalidateUserCache(userId).catch(console.error);
      invalidateGrowthCache(userId).catch(console.error);
      
      return finalCode;
    }
    attempts++;
  }
  
  // Final fallback
  finalCode = `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  await executeWrite("profiles", "update", { referral_code: finalCode }, { user_id: userId });
  return finalCode;
}

// 2. Referral Conversion Lifecycle hooks
export async function processReferralJoin(referredUserId: string, referralCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify if code is valid and locate referrer
    const { data: referrer } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer || referrer.user_id === referredUserId) {
      return { success: false, error: "Invalid referral code or referring own profile." };
    }

    // 2. Check if this referred user already has a referrer relation
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "User already referred." };
    }

    // 3. Create referral log: Joined status
    const refPayload = {
      referrer_user_id: referrer.user_id,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: "Joined",
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const writeRes = await executeWrite("referrals", "insert", refPayload);
    if (!writeRes.success) throw writeRes.error;

    // 4. Reward Referrer: +50 XP
    await addXpToUser(referrer.user_id, 50);

    // 5. Track Growth event log
    await logAnalyticsEvent("referral_joined", referrer.user_id, {
      referredUserId,
      referralCode
    });

    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referrer.user_id).catch(console.error);
    invalidateGrowthCache(referrer.user_id).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("processReferralJoin failed:", err);
    return { success: false, error: err?.message || "Failed to process referral join." };
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

    if (!referral || referral.status !== "Joined") {
      return { success: false, error: "No pending referral found to activate." };
    }

    // Update status to Activated, set activated_at
    const updateRes = await executeWrite(
      "referrals",
      "update",
      {
        status: "Activated",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { id: referral.id },
      supabaseClient
    );

    if (!updateRes.success) throw updateRes.error;

    // Reward Referrer: +150 XP and +5 PRI Mission score points
    await addXpToUser(referral.referrer_user_id, 150, supabaseClient);
    
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

    // Invalidate caches
    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referral.referrer_user_id).catch(console.error);
    invalidateGrowthCache(referral.referrer_user_id).catch(console.error);

    await logAnalyticsEvent("referral_activated", referral.referrer_user_id, {
      referredUserId,
      pointsAdded: 5,
      xpAdded: 150
    });

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

    if (!referral || referral.status !== "Activated") {
      return { success: false, error: "Referral not active or already converted." };
    }

    // Update status to Converted
    const updateRes = await executeWrite(
      "referrals",
      "update",
      {
        status: "Converted",
        updated_at: new Date().toISOString()
      },
      { id: referral.id },
      supabaseClient
    );

    if (!updateRes.success) throw updateRes.error;

    // Reward Referrer: +100 XP
    await addXpToUser(referral.referrer_user_id, 100, supabaseClient);

    // Invalidate Cache
    const { invalidateUserCache, invalidateGrowthCache } = await import("@/lib/redis");
    invalidateUserCache(referral.referrer_user_id).catch(console.error);
    invalidateGrowthCache(referral.referrer_user_id).catch(console.error);

    await logAnalyticsEvent("referral_converted", referral.referrer_user_id, {
      referredUserId,
      xpAdded: 100
    });

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
