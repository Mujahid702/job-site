import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export interface DBProfile {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  college: string | null;
  degree: string | null;
  branch: string | null;
  graduation_year: number | null;
  current_semester: number | null;
  cgpa: string | null;
  target_role: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_name: string | null;
  resume_uploaded_at: string | null;
  raw_profile_data: any | null;
  onboarding_completed?: boolean;
  onboarding_status?: string;
  onboarding_step?: number;
  career_goal?: string | null;
  experience_level?: string | null;
  dream_companies?: string[] | null;
  preferred_locations?: string[] | null;
  target_ctc?: string | null;
  profile_completion?: number;
  created_at?: string;
  updated_at?: string;
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

export async function getUserProfile(userId: string, supabaseClient?: any): Promise<DBProfile | null> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile from DB:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getUserProfile:", err);
    return null;
  }
}

export async function upsertUserProfile(userId: string, profileData: any, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  // Parse fields from structured ProfileData if present
  const full_name = profileData.name || profileData.full_name || null;
  const email = profileData.email || null;
  const phone_number = profileData.phone || profileData.phone_number || null;
  
  // Extract college, degree, branch, grad year, semester, and CGPA
  let college = profileData.college || null;
  let branch = profileData.branch || null;
  let degree = profileData.degree || null;
  let graduation_year = profileData.graduation_year ? parseInt(profileData.graduation_year, 10) : null;
  let current_semester = profileData.current_semester ? parseInt(profileData.current_semester, 10) : null;
  let cgpa = profileData.cgpa || null;

  if (profileData.education && profileData.education.length > 0) {
    const firstEdu = profileData.education[0];
    if (!college) college = firstEdu.school || null;
    if (!branch) branch = firstEdu.major || null;
    if (!degree) degree = firstEdu.degree || null;
    if (!cgpa) cgpa = firstEdu.gpa || null;
    if (!graduation_year && firstEdu.date) {
      const parts = firstEdu.date.split("-");
      const endYearStr = (parts[1] || parts[0]).trim();
      const match = endYearStr.match(/\d{4}/);
      if (match) {
        graduation_year = parseInt(match[0], 10);
      }
    }
  }

  // Extract flat list of skills from categories
  let skills: string[] = [];
  if (profileData.skills && Array.isArray(profileData.skills)) {
    profileData.skills.forEach((group: any) => {
      if (typeof group === 'string') {
        skills.push(group);
      } else if (group && typeof group === 'object') {
        if (group.items && Array.isArray(group.items)) {
          skills.push(...group.items);
        } else if (group.name) {
          skills.push(group.name);
        }
      }
    });
  }

  const linkedin_url = profileData.linkedin || profileData.linkedin_url || null;
  const github_url = profileData.github || profileData.github_url || null;
  const portfolio_url = profileData.portfolio || profileData.portfolio_url || null;
  const target_role = profileData.targetRole || profileData.target_role || null;
  
  // Resume details
  const resume_url = profileData.resume_url || null;
  const resume_name = profileData.resume_name || null;
  const resume_uploaded_at = profileData.resume_uploaded_at || null;

  // Onboarding specific fields mapping
  const onboarding_completed = profileData.onboarding_completed ?? false;
  const onboarding_status = profileData.onboarding_status || 'not_started';
  const onboarding_step = profileData.onboarding_step || 1;
  const career_goal = profileData.career_goal || null;
  const experience_level = profileData.experience_level || null;
  const dream_companies = profileData.dream_companies || null;
  const preferred_locations = profileData.preferred_locations || null;
  const target_ctc = profileData.target_ctc || null;
  const profile_completion = profileData.profile_completion || 0;

  const dbPayload: DBProfile = {
    user_id: userId,
    full_name,
    email,
    phone_number,
    college,
    degree,
    branch,
    graduation_year,
    current_semester,
    cgpa,
    target_role,
    skills: skills.length > 0 ? skills : null,
    linkedin_url,
    github_url,
    portfolio_url,
    resume_url,
    resume_name,
    resume_uploaded_at,
    raw_profile_data: profileData,
    onboarding_completed,
    onboarding_status,
    onboarding_step,
    career_goal,
    experience_level,
    dream_companies,
    preferred_locations,
    target_ctc,
    profile_completion,
    updated_at: new Date().toISOString()
  };

  const result = await executeWrite("profiles", "upsert", dbPayload, { user_id: userId }, supabaseClient);
  if (result.success) {
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Profile cache invalidation failed:", err));
  }
  return result;
}
