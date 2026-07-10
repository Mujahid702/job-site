import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

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

export interface CompanyProfile {
  id?: string;
  name: string;
  priority_skills: string[];
  focus: string;
  description: string;
  created_at?: string;
  hiring_process?: string[];
  role_requirements?: string[];
  skill_weightages?: Record<string, number>;
}

export interface StudentProject {
  id?: string;
  user_id: string;
  title: string;
  role: string;
  company: string;
  difficulty: string;
  interest_area: string;
  blueprint: any;
  readiness_checklist: Record<string, boolean>;
  created_at?: string;
}

// 1. Fetch target companies
export async function getProjectCompanies(supabaseClient?: any): Promise<CompanyProfile[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("project_companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching project companies:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getProjectCompanies:", err);
    return [];
  }
}

// 2. Add / Edit target company (Admin)
export async function saveCompany(
  company: Omit<CompanyProfile, "created_at">,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  if (company.id) {
    return executeWrite("project_companies", "update", company, { id: company.id }, db);
  } else {
    const payload = {
      ...company,
      created_at: new Date().toISOString()
    };
    return executeWrite("project_companies", "insert", payload, undefined, db);
  }
}

// 3. Delete target company (Admin)
export async function deleteCompany(id: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  return executeWrite("project_companies", "delete", undefined, { id }, db);
}

// 4. Fetch user's saved projects
export async function getStudentProjects(userId: string, supabaseClient?: any): Promise<StudentProject[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("student_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student projects:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getStudentProjects:", err);
    return [];
  }
}

// 5. Save student project blueprint
export async function saveStudentProject(
  userId: string,
  project: Omit<StudentProject, "user_id">,
  supabaseClient?: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    const payload = {
      ...project,
      user_id: userId
    };

    let result;
    if (project.id) {
      result = await executeWrite("student_projects", "update", payload, { id: project.id, user_id: userId }, db);
      if (result.success) {
        // Check if project is completed (all checklist items are true)
        const checklist = project.readiness_checklist || {};
        const keys = Object.keys(checklist);
        const isCompleted = keys.length > 0 && keys.every(k => checklist[k] === true);
        if (isCompleted) {
          import("./missions").then(async ({ awardActivityXP }) => {
            await awardActivityXP(userId, "project_completed", db);
            const { calculatePRIScore } = await import("./placement-readiness");
            await calculatePRIScore(userId, undefined, db);
          }).catch(e => console.error("Project completion XP trigger failed:", e));
        }
        return { success: true, data: payload };
      }
    } else {
      const newId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
      const fullPayload = { ...payload, id: newId, created_at: new Date().toISOString() };
      result = await executeWrite("student_projects", "insert", fullPayload, undefined, db);
      if (result.success) {
        // Check if project is completed (all checklist items are true)
        const checklist = project.readiness_checklist || {};
        const keys = Object.keys(checklist);
        const isCompleted = keys.length > 0 && keys.every(k => checklist[k] === true);
        if (isCompleted) {
          import("./missions").then(async ({ awardActivityXP }) => {
            await awardActivityXP(userId, "project_completed", db);
            const { calculatePRIScore } = await import("./placement-readiness");
            await calculatePRIScore(userId, undefined, db);
          }).catch(e => console.error("Project completion XP trigger failed:", e));
        }
        return { success: true, data: fullPayload };
      }
    }
    return { success: false, error: result.error };
  } catch (err) {
    console.error("Exception in saveStudentProject:", err);
    return { success: false, error: err };
  }
}

// 6. Delete student project blueprint
export async function deleteStudentProject(id: string, userId: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  return executeWrite("student_projects", "delete", undefined, { id, user_id: userId }, db);
}
