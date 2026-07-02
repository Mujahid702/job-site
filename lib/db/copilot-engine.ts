import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export interface StudentFullContext {
  atsScore: number;
  priScore: number;
  targetRole: string;
  targetCompanies: string[];
  techStack: string[];
  placementLevel: string;
  applicationsCount: number;
  applications: any[];
  assessmentAccuracy: number;
  mockInterviewsAvg: number;
  projectsCount: number;
  portfolioStatus: { portfolio: boolean; github: boolean };
  roadmapProgressCount: number;
  totalRoadmapCount: number;
  strengths: string[];
  weaknesses: string[];
  repeatedMistakes: string[];
}

export interface CopilotMemory {
  user_id: string;
  strengths: string[];
  weaknesses: string[];
  repeated_mistakes: string[];
}

// 1. Gathers full student workspace context across all OS tables
export async function loadStudentFullContext(
  userId: string,
  supabaseClient?: any
): Promise<StudentFullContext> {
  const isBrowser = typeof window !== "undefined";
  const db = supabaseClient || supabase;
  
  // Base default fallbacks
  let atsVal = 70;
  let priScore = 40;
  let targetRole = "Software Engineer";
  let targetCompanies = ["Deloitte", "TCS", "Accenture"];
  let techStack: string[] = ["JavaScript", "React"];
  let placementLevel = "Placement Beginner";
  let applicationsCount = 0;
  let applications: any[] = [];
  let assessmentAccuracy = 50;
  let mockInterviewsAvg = 60;
  let projectsCount = 1;
  let portfolioStatus = { portfolio: false, github: false };
  let roadmapProgressCount = 0;
  const totalRoadmapCount = 10;
  let strengths: string[] = ["Communication", "Basic Coding"];
  let weaknesses: string[] = ["System Design", "SQL joins"];
  let repeatedMistakes: string[] = ["Weak resume metrics"];

  if (userId && userId !== "guest-user") {
    try {
      // A. Profile info
      const { data: profile } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (profile) {
        if (profile.target_role) targetRole = profile.target_role;
        if (profile.skills) techStack = profile.skills;
        if (profile.portfolio_url) portfolioStatus.portfolio = true;
        if (profile.github_url) portfolioStatus.github = true;
        if (profile.raw_profile_data?.projects) {
          projectsCount = profile.raw_profile_data.projects.length;
        }
        if (profile.raw_profile_data?.target_companies) {
          targetCompanies = profile.raw_profile_data.target_companies;
        }
      }

      // B. Placement Readiness metrics
      const { data: pri } = await db
        .from("placement_readiness")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (pri) {
        priScore = pri.pri_score || priScore;
        placementLevel = pri.placement_level || placementLevel;
        if (pri.resume_score !== undefined) {
          atsVal = Math.round((pri.resume_score / 20) * 100);
        }
        if (pri.interview_score !== undefined) {
          mockInterviewsAvg = Math.round((pri.interview_score / 10) * 100);
        }
      }

      // C. Applications
      const { data: apps } = await db
        .from("applications")
        .select("*")
        .eq("user_id", userId);
      if (apps) {
        applications = apps;
        applicationsCount = apps.filter((a: any) => a.status !== "Saved").length;
      }

      // D. Roadmap Completed count
      const { count: completedRoadmaps } = await db
        .from("roadmap_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed", true);
      roadmapProgressCount = completedRoadmaps || 0;

      // E. Copilot Memory
      const { data: mem } = await db
        .from("copilot_memory")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (mem) {
        strengths = mem.strengths || strengths;
        weaknesses = mem.weaknesses || weaknesses;
        repeatedMistakes = mem.repeated_mistakes || repeatedMistakes;
      }

      // F. Assessment OS statistics
      try {
        const { getUserAssessmentAnalytics } = await import("./assessment");
        const analytics = await getUserAssessmentAnalytics(userId, db);
        assessmentAccuracy = analytics.overallAccuracy || 50;
      } catch {}

    } catch (err) {
      console.error("Failed to query full context, relying on presets", err);
    }
  } else {
    // Guest Fallback checking
    if (isBrowser) {
      atsVal = Number(localStorage.getItem("ats_score") || "70");
      priScore = Number(localStorage.getItem("placement_readiness_score") || "40");
      
      const guestMemory = localStorage.getItem("placement_copilot_guest_memory");
      if (guestMemory) {
        try {
          const parsed = JSON.parse(guestMemory);
          strengths = parsed.strengths || strengths;
          weaknesses = parsed.weaknesses || weaknesses;
          repeatedMistakes = parsed.repeatedMistakes || repeatedMistakes;
        } catch {}
      }

      const crmApps = localStorage.getItem("placement_crm_applications");
      if (crmApps) {
        try {
          const parsed = JSON.parse(crmApps);
          applications = parsed;
          applicationsCount = parsed.filter((a: any) => a.status !== "Saved").length;
        } catch {}
      }
    }
  }

  return {
    atsScore: atsVal,
    priScore,
    targetRole,
    targetCompanies,
    techStack,
    placementLevel,
    applicationsCount,
    applications,
    assessmentAccuracy,
    mockInterviewsAvg,
    projectsCount,
    portfolioStatus,
    roadmapProgressCount,
    totalRoadmapCount,
    strengths,
    weaknesses,
    repeatedMistakes
  };
}

// 2. Persists copilot memory strengths, weaknesses, and repeated mistakes
export async function updateCopilotMemory(
  userId: string,
  memory: { strengths: string[]; weaknesses: string[]; repeatedMistakes: string[] },
  supabaseClient?: any
): Promise<boolean> {
  const isBrowser = typeof window !== "undefined";
  const db = supabaseClient || supabase;

  if (userId && userId !== "guest-user") {
    try {
      const payload = {
        user_id: userId,
        strengths: memory.strengths,
        weaknesses: memory.weaknesses,
        repeated_mistakes: memory.repeatedMistakes,
        updated_at: new Date().toISOString()
      };
      await executeWrite("copilot_memory", "upsert", payload, { user_id: userId }, db);
      return true;
    } catch (err) {
      console.error("Memory saving in DB failed:", err);
      return false;
    }
  } else {
    if (isBrowser) {
      localStorage.setItem("placement_copilot_guest_memory", JSON.stringify(memory));
      return true;
    }
    return false;
  }
}

// 3. Fetches company specific hiring guidelines
export async function getCompanyKnowledge(
  company: string,
  role?: string,
  supabaseClient?: any
): Promise<any | null> {
  const db = supabaseClient || supabase;
  try {
    let query = db.from("company_knowledge").select("*").ilike("company", `%${company}%`);
    if (role) {
      query = query.ilike("role", `%${role}%`);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch company knowledge template from DB:", err);
    return null;
  }
}

// 4. Action execution layer running direct database updates
export async function executeCopilotAction(
  userId: string,
  actionType: string,
  payload: any,
  supabaseClient?: any
): Promise<{ success: boolean; message: string }> {
  const isBrowser = typeof window !== "undefined";
  const db = supabaseClient || supabase;

  if (!userId || userId === "guest-user") {
    // Offline local storage actions simulation
    if (isBrowser) {
      if (actionType === "SAVE_JOB") {
        const list = JSON.parse(localStorage.getItem("placement_crm_applications") || "[]");
        const newApp = {
          id: `app-guest-${Date.now()}`,
          company: payload.company || "Google",
          role: payload.role || "Software Engineer",
          status: payload.status || "Saved",
          applied_date: new Date().toISOString()
        };
        list.push(newApp);
        localStorage.setItem("placement_crm_applications", JSON.stringify(list));
        return { success: true, message: `Successfully saved ${newApp.role} at ${newApp.company} to guest CRM.` };
      }
    }
    return { success: false, message: "Action simulation not supported in offline guest mode." };
  }

  try {
    if (actionType === "SAVE_JOB") {
      const payloadData = {
        user_id: userId,
        company: payload.company || "Google",
        role: payload.role || "Software Engineer",
        status: payload.status || "Saved",
        applied_date: new Date().toISOString()
      };
      await executeWrite("applications", "insert", payloadData, {}, db);
      return { success: true, message: `Saved ${payloadData.role} at ${payloadData.company} directly to CRM Applications!` };
    }

    if (actionType === "SCHEDULE_ROADMAP") {
      const { triggerMissionProgress } = await import("./missions");
      await triggerMissionProgress(userId, "learning", 1, undefined, db);
      return { success: true, message: "Custom carrier preparation path generated. Added learning mission!" };
    }

    return { success: false, message: `Action type '${actionType}' is not supported.` };
  } catch (err: any) {
    console.error(`Failed to execute copilot action: ${actionType}`, err);
    return { success: false, message: `Database update failed: ${err?.message || "Unknown write error"}` };
  }
}
