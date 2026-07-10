import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { triggerMissionProgress } from "./missions";

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

export interface ResumeScan {
  id?: string;
  user_id: string;
  resume_name: string;
  ats_score: number;
  role_fit_score: number;
  analysis: any;
  created_at?: string;
}

export interface JdMatch {
  id?: string;
  user_id: string;
  job_role: string;
  match_score: number;
  analysis: any;
  created_at?: string;
}

export interface PlacementScores {
  id?: string;
  user_id: string;
  score: number;
  resume_score: number;
  linkedin_score: number;
  project_score: number;
  interview_score: number;
  updated_at?: string;
}

export async function getResumeScans(userId: string, supabaseClient?: any): Promise<ResumeScan[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("resume_scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resume scans:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getResumeScans:", err);
    return [];
  }
}

export async function addResumeScan(userId: string, scan: Omit<ResumeScan, "user_id">, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  const payload = {
    ...scan,
    user_id: userId,
    created_at: new Date().toISOString()
  };
  const result = await executeWrite("resume_scans", "insert", payload, undefined, db);
  if (result.success) {
    // Trigger mission progress for resume scans
    triggerMissionProgress(userId, "resume", 1, scan.ats_score, db).catch(e => {
      console.error("Failed to trigger mission progress for scan:", e);
    });

    // Award activity XP & update Placement Readiness
    import("./missions").then(async ({ awardActivityXP }) => {
      const { data: existingScans } = await db
        .from("resume_scans")
        .select("id")
        .eq("user_id", userId);
      
      if (!existingScans || existingScans.length <= 1) {
        await awardActivityXP(userId, "resume_uploaded", db);
      }
      
      await awardActivityXP(userId, "resume_ats_scan", db);
      
      if (scan.ats_score >= 80) {
        await awardActivityXP(userId, "resume_score_above_80", db);
      }
      
      const { calculatePRIScore } = await import("./placement-readiness");
      await calculatePRIScore(userId, undefined, db);
    }).catch(e => console.error("XP triggering failed:", e));
  }
  return result;
}

export async function getJdMatches(userId: string, supabaseClient?: any): Promise<JdMatch[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("jd_matches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching JD matches:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getJdMatches:", err);
    return [];
  }
}

export async function addJdMatch(userId: string, match: Omit<JdMatch, "user_id">, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  const payload = {
    ...match,
    user_id: userId,
    created_at: new Date().toISOString()
  };
  const result = await executeWrite("jd_matches", "insert", payload, undefined, db);
  if (result.success) {
    import("./missions").then(async ({ awardActivityXP }) => {
      await awardActivityXP(userId, "jd_match", db);
      
      const { calculatePRIScore } = await import("./placement-readiness");
      await calculatePRIScore(userId, undefined, db);
    }).catch(e => console.error("JD Match XP award failed:", e));
  }
  return result;
}

export async function getPlacementScores(userId: string, supabaseClient?: any): Promise<PlacementScores | null> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("placement_scores")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching placement scores:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getPlacementScores:", err);
    return null;
  }
}

export async function upsertPlacementScores(userId: string, scores: Omit<PlacementScores, "user_id" | "id" | "updated_at">, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  const payload = {
    ...scores,
    user_id: userId,
    updated_at: new Date().toISOString()
  };
  return executeWrite("placement_scores", "upsert", payload, { user_id: userId }, db);
}
