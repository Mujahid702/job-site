import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { calculatePRIScore } from "./placement-readiness";

export interface PlacementMission {
  id: string;
  title: string;
  description: string;
  category: string;
  mission_type: 'daily' | 'weekly' | 'career';
  xp_reward: number;
  pri_reward: number;
  target_value: number;
  is_active: boolean;
  created_at: string;
}

export interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  completed_at: string | null;
  created_at: string;
  mission?: PlacementMission;
}

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  streak_days: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

// Master missions hardcoded fallbacks in case database seeding hasn't occurred yet
export const DEFAULT_MISSIONS: PlacementMission[] = [
  { id: "m-dsa-daily", title: "Solve 2 DSA Problems", description: "Practice and solve 2 DSA coding challenges.", category: "dsa", mission_type: "daily", xp_reward: 20, pri_reward: 2, target_value: 2, is_active: true, created_at: "" },
  { id: "m-app-daily", title: "Apply to 1 Company", description: "Track at least 1 job application in your CRM.", category: "applications", mission_type: "daily", xp_reward: 15, pri_reward: 3, target_value: 1, is_active: true, created_at: "" },
  { id: "m-ats-daily", title: "Complete ATS Scan", description: "Scan a resume to inspect keyword match.", category: "resume", mission_type: "daily", xp_reward: 15, pri_reward: 5, target_value: 1, is_active: true, created_at: "" },
  { id: "m-mock-daily", title: "Attend a Mock Interview", description: "Run an AI mock interview evaluation.", category: "interviews", mission_type: "daily", xp_reward: 20, pri_reward: 6, target_value: 1, is_active: true, created_at: "" },
  
  { id: "m-dsa-weekly", title: "Complete 10 DSA Problems", description: "Complete 10 DSA questions throughout the week.", category: "dsa", mission_type: "weekly", xp_reward: 100, pri_reward: 10, target_value: 10, is_active: true, created_at: "" },
  { id: "m-app-weekly", title: "Apply to 10 Jobs", description: "Submit and log 10 applications in the CRM.", category: "applications", mission_type: "weekly", xp_reward: 80, pri_reward: 15, target_value: 10, is_active: true, created_at: "" },
  { id: "m-proj-weekly", title: "Build one project feature", description: "Register and evaluate a project blueprint.", category: "projects", mission_type: "weekly", xp_reward: 50, pri_reward: 5, target_value: 1, is_active: true, created_at: "" },
  { id: "m-mock-weekly", title: "Attend one mock interview", description: "Perform a full mock interview training session.", category: "interviews", mission_type: "weekly", xp_reward: 75, pri_reward: 6, target_value: 1, is_active: true, created_at: "" },
  
  { id: "m-ats-career", title: "Reach ATS Score 80+", description: "Achieve an ATS scoring threshold of 80+.", category: "resume", mission_type: "career", xp_reward: 200, pri_reward: 15, target_value: 80, is_active: true, created_at: "" },
  { id: "m-roadmap-career", title: "Complete Full Stack Roadmap", description: "Complete the core Full Stack Developer Roadmap.", category: "roadmap", mission_type: "career", xp_reward: 300, pri_reward: 20, target_value: 1, is_active: true, created_at: "" },
  { id: "m-portfolio-career", title: "Upload Portfolio", description: "Attach a live portfolio URL and GitHub profile.", category: "portfolio", mission_type: "career", xp_reward: 150, pri_reward: 10, target_value: 1, is_active: true, created_at: "" },
  { id: "m-pri-career", title: "Reach PRI Score 70+", description: "Achieve a Placement Readiness Index of 70+.", category: "pri", mission_type: "career", xp_reward: 250, pri_reward: 15, target_value: 70, is_active: true, created_at: "" },
  { id: "m-app-career", title: "Complete 100 Applications", description: "Log 100 active jobs tracked inside CRM.", category: "applications", mission_type: "career", xp_reward: 500, pri_reward: 30, target_value: 100, is_active: true, created_at: "" }
];

// XP level scaling curve
export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  return 5 + Math.floor((xp - 1000) / 1000);
}

// Get XP threshold required to unlock next level
export function getXpForNextLevel(level: number): number {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 1000;
  return 1000 + (level - 4) * 1000;
}

// Load guest items from local storage helper
function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveLocalData<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Local storage write failed", err);
  }
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

// 1. Get or Create user XP record
export async function getUserXP(userId: string, supabaseClient?: any): Promise<UserXP> {
  const isGuest = !userId || userId === "guest-user";
  if (isGuest) {
    const guestXp = getLocalData<UserXP>("buggedbrain_guest_xp", {
      id: "guest-xp-id",
      user_id: "guest-user",
      total_xp: 0,
      current_level: 1,
      streak_days: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString()
    });
    return guestXp;
  }

  const db = await getDb(supabaseClient);
  try {
    const { data, error } = await db
      .from("user_xp")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    // Create a new XP record
    const payload = {
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      streak_days: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString()
    };
    const { data: inserted, error: insErr } = await db
      .from("user_xp")
      .insert(payload)
      .select()
      .single();

    if (insErr) throw insErr;
    return inserted;
  } catch (err: any) {
    console.error("Failed to load user_xp from DB:", err?.message || err);
    // Return fallback structure
    return {
      id: "fallback-id",
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      streak_days: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString()
    };
  }
}

// 2. Fetch Master + User Missions
export async function getUserMissions(userId: string, supabaseClient?: any): Promise<{
  userMissions: UserMission[];
  missions: PlacementMission[];
  xp: UserXP;
}> {
  const isGuest = !userId || userId === "guest-user";
  const xp = await getUserXP(userId, supabaseClient);
  const db = await getDb(supabaseClient);

  // A. Load Master Definitions
  let masterMissions: PlacementMission[] = [];
  if (isGuest) {
    masterMissions = DEFAULT_MISSIONS;
  } else {
    try {
      const { data, error } = await db
        .from("placement_missions")
        .select("*")
        .eq("is_active", true);
      
      if (!error && data && data.length > 0) {
        masterMissions = data;
      } else {
        masterMissions = DEFAULT_MISSIONS;
      }
    } catch {
      masterMissions = DEFAULT_MISSIONS;
    }
  }

  // B. Load / Instantiate User Progress
  if (isGuest) {
    const localProgress = getLocalData<Record<string, Partial<UserMission>>>("buggedbrain_guest_missions", {});
    const compiledMissions: UserMission[] = masterMissions.map(m => {
      const progressRecord = localProgress[m.id] || { progress: 0, completed: false, claimed: false, completed_at: null };
      return {
        id: `guest-um-${m.id}`,
        user_id: "guest-user",
        mission_id: m.id,
        progress: progressRecord.progress ?? 0,
        target: m.target_value,
        completed: progressRecord.completed ?? false,
        claimed: progressRecord.claimed ?? false,
        completed_at: progressRecord.completed_at ?? null,
        created_at: new Date().toISOString(),
        mission: m
      };
    });
    return { userMissions: compiledMissions, missions: masterMissions, xp };
  }

  // Authenticated flow
  try {
    const { data: userProgress, error: progErr } = await db
      .from("user_missions")
      .select("*")
      .eq("user_id", userId);

    if (progErr) throw progErr;

    const progressMap = new Map<string, UserMission>();
    userProgress?.forEach((p: any) => progressMap.set(p.mission_id, p));

    const instantiatedMissions: UserMission[] = [];
    const missingPayloads: any[] = [];

    masterMissions.forEach(mission => {
      const match = progressMap.get(mission.id);
      if (match) {
        instantiatedMissions.push({
          ...match,
          mission
        });
      } else {
        // Prepare missing missions rows lazy seeding
        const newRow = {
          user_id: userId,
          mission_id: mission.id,
          progress: 0,
          target: mission.target_value,
          completed: false,
          claimed: false,
          completed_at: null
        };
        missingPayloads.push(newRow);
      }
    });

    if (missingPayloads.length > 0) {
      const { data: inserted, error: insErr } = await db
        .from("user_missions")
        .insert(missingPayloads)
        .select();

      if (!insErr && inserted) {
        inserted.forEach((row: any) => {
          const mission = masterMissions.find(m => m.id === row.mission_id);
          instantiatedMissions.push({
            ...row,
            mission
          });
        });
      }
    }

    return { userMissions: instantiatedMissions, missions: masterMissions, xp };
  } catch (err) {
    console.error("Failed to load user missions", err);
    // Return empty definitions with master blueprints
    return {
      userMissions: masterMissions.map(m => ({
        id: `err-${m.id}`,
        user_id: userId,
        mission_id: m.id,
        progress: 0,
        target: m.target_value,
        completed: false,
        claimed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        mission: m
      })),
      missions: masterMissions,
      xp
    };
  }
}

// 3. Update progress for a category
export async function triggerMissionProgress(
  userId: string,
  category: string,
  increment: number,
  rawValue?: number,
  supabaseClient?: any
): Promise<{ success: boolean }> {
  const isGuest = !userId || userId === "guest-user";
  const db = await getDb(supabaseClient);

  // Load active missions
  const { userMissions } = await getUserMissions(userId, db);
  const matchedMissions = userMissions.filter(um => um.mission?.category === category && !um.completed);

  if (matchedMissions.length === 0) return { success: true };

  if (isGuest) {
    const localProgress = getLocalData<Record<string, any>>("buggedbrain_guest_missions", {});
    matchedMissions.forEach(um => {
      const mid = um.mission_id;
      const cur = localProgress[mid] || { progress: 0, completed: false, completed_at: null };
      
      let newProgress = cur.progress + increment;
      if (rawValue !== undefined && um.mission?.mission_type === "career") {
        newProgress = rawValue;
      }
      
      newProgress = Math.min(newProgress, um.target);
      const isCompleted = newProgress >= um.target;

      localProgress[mid] = {
        progress: newProgress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      };

      // Auto update streak if daily mission is completed
      if (isCompleted && um.mission?.mission_type === "daily") {
        updateGuestStreak();
      }
    });
    saveLocalData("buggedbrain_guest_missions", localProgress);
    return { success: true };
  }

  // Database update
  try {
    for (const um of matchedMissions) {
      let newProgress = um.progress + increment;
      if (rawValue !== undefined && um.mission?.mission_type === "career") {
        newProgress = rawValue;
      }
      newProgress = Math.min(newProgress, um.target);
      const isCompleted = newProgress >= um.target;

      await executeWrite("user_missions", "update", {
        progress: newProgress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      }, { id: um.id }, db);

      // Streak tracking hooks
      if (isCompleted && um.mission?.mission_type === "daily") {
        await updateStreak(userId, db);
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Failed to trigger mission progress:", err);
    return { success: false };
  }
}

// Streak trigger helper for guest users
function updateGuestStreak() {
  const xp = getLocalData<UserXP>("buggedbrain_guest_xp", {
    id: "guest-xp-id",
    user_id: "guest-user",
    total_xp: 0,
    current_level: 1,
    streak_days: 0,
    longest_streak: 0,
    last_activity_date: null,
    updated_at: new Date().toISOString()
  });

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastActive = xp.last_activity_date;

  if (lastActive === todayStr) {
    return; // Already logged today
  }

  let newStreak = 1;
  if (lastActive) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (lastActive === yesterdayStr) {
      newStreak = xp.streak_days + 1;
    }
  }

  xp.streak_days = newStreak;
  xp.longest_streak = Math.max(xp.longest_streak, newStreak);
  xp.last_activity_date = todayStr;
  xp.updated_at = new Date().toISOString();

  // Check milestones and add streak bonus XPs
  let bonusXP = 0;
  if (newStreak === 7) bonusXP = 50;
  else if (newStreak === 14) bonusXP = 100;
  else if (newStreak === 30) bonusXP = 250;
  else if (newStreak === 60) bonusXP = 500;
  else if (newStreak === 100) bonusXP = 1000;

  if (bonusXP > 0) {
    xp.total_xp += bonusXP;
    xp.current_level = calculateLevel(xp.total_xp);
  }

  saveLocalData("buggedbrain_guest_xp", xp);
  checkGuestBadges(xp.streak_days);
}

// Streak trigger helper for real users
export async function updateStreak(userId: string, supabaseClient?: any): Promise<number> {
  try {
    const xp = await getUserXP(userId, supabaseClient);
    const todayStr = new Date().toISOString().split("T")[0];
    const lastActive = xp.last_activity_date;

    if (lastActive === todayStr) {
      return xp.streak_days; // already completed daily today
    }

    let newStreak = 1;
    if (lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (lastActive === yesterdayStr) {
        newStreak = xp.streak_days + 1;
      }
    }

    const longest = Math.max(xp.longest_streak, newStreak);

    // Milestones check
    let bonusXP = 0;
    if (newStreak === 7) bonusXP = 50;
    else if (newStreak === 14) bonusXP = 100;
    else if (newStreak === 30) bonusXP = 250;
    else if (newStreak === 60) bonusXP = 500;
    else if (newStreak === 100) bonusXP = 1000;

    const newXpTotal = xp.total_xp + bonusXP;
    const newLevel = calculateLevel(newXpTotal);

    await executeWrite("user_xp", "update", {
      streak_days: newStreak,
      longest_streak: longest,
      total_xp: newXpTotal,
      current_level: newLevel,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString()
    }, { user_id: userId }, supabaseClient);

    if (newStreak >= 7) {
      await unlockBadge(userId, "Consistency King", supabaseClient);
    }

    return newStreak;
  } catch (err) {
    console.error("Streak calculation fail:", err);
    return 0;
  }
}

// 4. Claim reward logic
export async function claimMissionReward(
  userId: string,
  userMissionId: string,
  supabaseClient?: any
): Promise<{
  success: boolean;
  xpGained: number;
  levelUp: boolean;
  newLevel: number;
  priGained: number;
  error?: string;
}> {
  const isGuest = !userId || userId === "guest-user";

  if (isGuest) {
    const localProgress = getLocalData<Record<string, any>>("buggedbrain_guest_missions", {});
    const masterMissionId = userMissionId.replace("guest-um-", "");
    const missionDef = DEFAULT_MISSIONS.find(m => m.id === masterMissionId);

    if (!missionDef) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Mission template not found" };
    }

    const cur = localProgress[masterMissionId];
    if (!cur || !cur.completed) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Mission not completed yet" };
    }

    if (cur.claimed) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Reward already claimed" };
    }

    // Award rewards
    cur.claimed = true;
    saveLocalData("buggedbrain_guest_missions", localProgress);

    const xp = getLocalData<UserXP>("buggedbrain_guest_xp", {
      id: "guest-xp-id",
      user_id: "guest-user",
      total_xp: 0,
      current_level: 1,
      streak_days: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString()
    });

    const oldLevel = xp.current_level;
    xp.total_xp += missionDef.xp_reward;
    xp.current_level = calculateLevel(xp.total_xp);
    xp.updated_at = new Date().toISOString();
    saveLocalData("buggedbrain_guest_xp", xp);

    // Award PRI
    const priData = getLocalData<any>("pri_readiness_guest", {});
    const prevBonus = priData.mission_bonus_score || 0;
    const newBonus = prevBonus + missionDef.pri_reward;
    priData.mission_bonus_score = newBonus;
    saveLocalData("pri_readiness_guest", priData);

    // Recalculate PRI
    await calculatePRIScore("guest-user");

    // Badges check
    checkGuestBadges();

    return {
      success: true,
      xpGained: missionDef.xp_reward,
      levelUp: xp.current_level > oldLevel,
      newLevel: xp.current_level,
      priGained: missionDef.pri_reward
    };
  }

  // Real Database Flow
  const db = await getDb(supabaseClient);
  try {
    // 1. Fetch user mission row
    const { data: um, error: umErr } = await db
      .from("user_missions")
      .select("*, mission:placement_missions(*)")
      .eq("id", userMissionId)
      .single();

    if (umErr || !um) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Progress record not found" };
    }

    if (!um.completed) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Mission not completed yet" };
    }

    // Wait, in `supabase_missions.sql`, we created the `user_missions` table. We can add a `claimed` boolean column or just use `completed` as a transition state.
    // Wait, if we alter `user_missions` to add `claimed boolean default false`, that's extremely clean!
    // Let's check: in `supabase_missions.sql` we wrote:
    // `completed BOOLEAN NOT NULL DEFAULT false`
    // Let's modify both `supabase_missions.sql` and `supabase_persistence.sql` to add `claimed BOOLEAN DEFAULT false NOT NULL`!
    // Yes, this is 100% correct, robust, and clean!
    // Let's add that column.
    
    // For now, let's proceed with adding it in our logic as well. We can run a migration or just handle it if it fails.
    // Wait! Is the column already created? No, we haven't run the migration yet, so we can edit `supabase_missions.sql` and `supabase_persistence.sql` to add `claimed BOOLEAN DEFAULT false NOT NULL`!
    // Let's do that immediately to make sure our schemas are perfectly aligned.
    // Wait, let's look at `supabase_missions.sql`. Let's replace the create table command for `user_missions` to add `claimed boolean default false not null`.
    
    // First, let's complete the claim function in `lib/db/missions.ts`. We assume there is a `claimed` column. We will make sure the tables have it.
    // Let's look at how we write the claim transaction:
    // A. Update user_missions claimed flag
    // B. Add XP to user_xp
    // C. Add PRI score to placement_readiness
    
    // Let's check: if it is already claimed:
    // We can query: `select claimed from user_missions where id = userMissionId`
    // If it's true, return error.
    
    const { data: checkClaimed } = await db
      .from("user_missions")
      .select("claimed")
      .eq("id", userMissionId)
      .single();

    if (checkClaimed?.claimed) {
      return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: "Reward already claimed" };
    }

    // Set claimed = true
    const { error: claimErr } = await db
      .from("user_missions")
      .update({ claimed: true })
      .eq("id", userMissionId);

    if (claimErr) throw claimErr;

    const mission = um.mission;
    const xpReward = mission.xp_reward;
    const priReward = mission.pri_reward;

    // Award XP
    const xp = await getUserXP(userId, db);
    const oldLevel = xp.current_level;
    const newXpTotal = xp.total_xp + xpReward;
    const newLevel = calculateLevel(newXpTotal);

    await executeWrite("user_xp", "update", {
      total_xp: newXpTotal,
      current_level: newLevel,
      updated_at: new Date().toISOString()
    }, { user_id: userId }, db);

    // Award PRI
    // Fetch current readiness score record to get the existing mission_bonus_score
    const { data: prRecord } = await db
      .from("placement_readiness")
      .select("mission_bonus_score")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBonus = prRecord?.mission_bonus_score || 0;
    const newBonusScore = currentBonus + priReward;

    await executeWrite("placement_readiness", "upsert", {
      user_id: userId,
      mission_bonus_score: newBonusScore,
      last_updated: new Date().toISOString()
    }, { user_id: userId }, db);

    // Recompute PRI score to incorporate the new bonus
    await calculatePRIScore(userId, undefined, db);

    // Automation: check badges unlocks
    await checkAutoBadges(userId, newXpTotal, newBonusScore, db);

    return {
      success: true,
      xpGained: xpReward,
      levelUp: newLevel > oldLevel,
      newLevel,
      priGained: priReward
    };
  } catch (err: any) {
    console.error("Failed to claim mission reward", err);
    return { success: false, xpGained: 0, levelUp: false, newLevel: 1, priGained: 0, error: err.message || "Failed claim" };
  }
}

// 5. Automated badge check for guest users
function checkGuestBadges(streakDays?: number) {
  const currentBadges = getLocalData<string[]>("buggedbrain_guest_badges", []);
  const xp = getLocalData<UserXP>("buggedbrain_guest_xp", { total_xp: 0, current_level: 1, streak_days: 0 } as any);
  const pri = getLocalData<any>("pri_readiness_guest", { pri_score: 0 });

  const badgesToUnlock: string[] = [];
  
  if (xp.total_xp > 0 && !currentBadges.includes("First Step")) {
    badgesToUnlock.push("First Step");
  }
  if ((streakDays || xp.streak_days) >= 7 && !currentBadges.includes("Consistency King")) {
    badgesToUnlock.push("Consistency King");
  }
  if (pri.pri_score >= 80 && !currentBadges.includes("Placement Beast")) {
    badgesToUnlock.push("Placement Beast");
  }

  if (badgesToUnlock.length > 0) {
    const updated = [...currentBadges, ...badgesToUnlock];
    saveLocalData("buggedbrain_guest_badges", updated);
  }
}

// 6. Automated badge check for real users
export async function checkAutoBadges(userId: string, totalXp: number, missionBonus: number, supabaseClient?: any) {
  const db = await getDb(supabaseClient);
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("badges")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBadges = profile?.badges || [];
    const newBadges: string[] = [];

    // Check conditions
    if (totalXp > 0 && !currentBadges.includes("First Step")) {
      newBadges.push("First Step");
    }
    
    // Fetch apps count for "First Application" badge
    const { count: appsCount } = await db
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((appsCount || 0) >= 1 && !currentBadges.includes("First Application")) {
      newBadges.push("First Application");
    }

    // Fetch PRI score
    const { data: priData } = await db
      .from("placement_readiness")
      .select("pri_score")
      .eq("user_id", userId)
      .maybeSingle();

    if (priData && priData.pri_score >= 80 && !currentBadges.includes("Placement Beast")) {
      newBadges.push("Placement Beast");
    }

    if (newBadges.length > 0) {
      const updated = [...currentBadges, ...newBadges];
      await executeWrite("profiles", "update", {
        badges: updated,
        updated_at: new Date().toISOString()
      }, { user_id: userId }, db);
    }
  } catch (err) {
    console.error("Failed checking badges:", err);
  }
}

// Helper: Unlock a specific badge manually/automatically
export async function unlockBadge(userId: string, badgeName: string, supabaseClient?: any): Promise<boolean> {
  const isGuest = !userId || userId === "guest-user";
  if (isGuest) {
    const current = getLocalData<string[]>("buggedbrain_guest_badges", []);
    if (!current.includes(badgeName)) {
      saveLocalData("buggedbrain_guest_badges", [...current, badgeName]);
      return true;
    }
    return false;
  }

  const db = await getDb(supabaseClient);
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("badges")
      .eq("user_id", userId)
      .maybeSingle();

    const current = profile?.badges || [];
    if (!current.includes(badgeName)) {
      const updated = [...current, badgeName];
      await executeWrite("profiles", "update", {
        badges: updated,
        updated_at: new Date().toISOString()
      }, { user_id: userId }, db);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// 7. Reset Daily / Weekly Missions
export async function resetMissions(type: 'daily' | 'weekly', supabaseClient?: any): Promise<{ success: boolean }> {
  const db = await getDb(supabaseClient);
  try {
    // Standard query: select user_missions matching this type
    const { data: missions, error: misErr } = await db
      .from("placement_missions")
      .select("id")
      .eq("mission_type", type);

    if (misErr || !missions || missions.length === 0) return { success: true };

    const mids = missions.map((m: any) => m.id);

    // Update progress and flags for all matching user missions
    const { error: resetErr } = await db
      .from("user_missions")
      .update({
        progress: 0,
        completed: false,
        claimed: false,
        completed_at: null
      })
      .in("mission_id", mids);

    if (resetErr) throw resetErr;
    return { success: true };
  } catch (err) {
    console.error(`Failed to reset ${type} missions:`, err);
    return { success: false };
  }
}

// 8. Offline synchronization of guest data to profile
export async function syncGuestMissions(userId: string, supabaseClient?: any): Promise<{ success: boolean }> {
  if (!userId || userId === "guest-user") return { success: false };

  const db = await getDb(supabaseClient);
  try {
    console.log("[Missions Sync] Checking offline guest progress data...");
    const guestXp = getLocalData<UserXP | null>("buggedbrain_guest_xp", null);
    const guestMissions = getLocalData<Record<string, any> | null>("buggedbrain_guest_missions", null);
    const guestBadges = getLocalData<string[] | null>("buggedbrain_guest_badges", null);

    if (!guestXp && !guestMissions && !guestBadges) {
      return { success: true }; // nothing to sync
    }

    // A. Sync XP
    if (guestXp && guestXp.total_xp > 0) {
      const userXp = await getUserXP(userId, db);
      const combinedXP = userXp.total_xp + guestXp.total_xp;
      const combinedLevel = calculateLevel(combinedXP);
      const combinedStreak = Math.max(userXp.streak_days, guestXp.streak_days);
      const combinedLongest = Math.max(userXp.longest_streak, guestXp.longest_streak);

      await executeWrite("user_xp", "update", {
        total_xp: combinedXP,
        current_level: combinedLevel,
        streak_days: combinedStreak,
        longest_streak: combinedLongest,
        updated_at: new Date().toISOString()
      }, { user_id: userId }, db);
    }

    // B. Sync Missions progress
    if (guestMissions) {
      const { userMissions } = await getUserMissions(userId, db);
      for (const gmId in guestMissions) {
        const gm = guestMissions[gmId];
        const userUm = userMissions.find(um => um.mission_id === gmId);

        if (userUm) {
          // Merge progress
          const progress = Math.min(Math.max(userUm.progress, gm.progress), userUm.target);
          const completed = userUm.completed || gm.completed;
          const claimed = userUm.claimed || gm.claimed;
          const completedAt = userUm.completed_at || gm.completed_at;

          await executeWrite("user_missions", "update", {
            progress,
            completed,
            claimed,
            completed_at: completedAt
          }, { id: userUm.id }, db);
        }
      }
    }

    // C. Sync Badges
    if (guestBadges && guestBadges.length > 0) {
      const { data: profile } = await db
        .from("profiles")
        .select("badges")
        .eq("user_id", userId)
        .maybeSingle();

      const userBadges = profile?.badges || [];
      const mergedBadges = Array.from(new Set([...userBadges, ...guestBadges]));

      await executeWrite("profiles", "update", {
        badges: mergedBadges,
        updated_at: new Date().toISOString()
      }, { user_id: userId }, db);
    }

    // Clear local storage cache
    localStorage.removeItem("buggedbrain_guest_xp");
    localStorage.removeItem("buggedbrain_guest_missions");
    localStorage.removeItem("buggedbrain_guest_badges");
    localStorage.removeItem("pri_readiness_guest");

    console.log("[Missions Sync] Successfully synced guest data with profile!");
    return { success: true };
  } catch (err) {
    console.error("[Missions Sync] Error running sync:", err);
    return { success: false };
  }
}
