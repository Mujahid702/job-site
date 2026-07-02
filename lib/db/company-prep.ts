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

export interface CompanyPrep {
  id?: string;
  slug: string;
  name: string;
  overview?: string;
  difficulty: "Medium" | "Hard" | "Extreme";
  salary_range: string;
  eligibility_cgpa?: number;
  eligibility_branches?: string[];
  eligibility_criteria?: string;
  hiring_frequency?: string;
  roles_hired?: string[];
  must_have_skills?: string[];
  good_to_have_skills?: string[];
  bonus_skills?: string[];
  package_value?: string;
  active_rounds?: number;
  role_details?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyPrepRound {
  id?: string;
  company_prep_id: string;
  round_number: number;
  name: string;
  duration?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tips?: string;
  created_at?: string;
}

export interface CompanyPrepResource {
  id?: string;
  company_prep_id: string;
  round_number: number;
  name: string;
  type: "pdf" | "link" | "video" | "sheet";
  url: string;
  description?: string;
  created_at?: string;
}

export interface CompanyPrepUserRoadmap {
  id?: string;
  user_id: string;
  company_prep_id: string;
  target_role: string;
  personalized_roadmap: any;
  completed_steps: string[];
  created_at?: string;
  updated_at?: string;
}

// Fetch list of active company preps
export async function getCompanyPreps(supabaseClient?: any): Promise<CompanyPrep[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("company_preps")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching company preps:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getCompanyPreps:", err);
    return [];
  }
}

// Fetch a single company prep by slug including rounds and resources
export async function getCompanyPrepBySlug(slug: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    
    // 1. Fetch metadata
    const { data: prep, error: prepError } = await db
      .from("company_preps")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (prepError || !prep) {
      return null;
    }

    // 2. Fetch rounds
    const { data: rounds, error: roundsError } = await db
      .from("company_prep_rounds")
      .select("*")
      .eq("company_prep_id", prep.id)
      .order("round_number", { ascending: true });

    // 3. Fetch resources
    const { data: resources, error: resourcesError } = await db
      .from("company_prep_resources")
      .select("*")
      .eq("company_prep_id", prep.id)
      .order("round_number", { ascending: true });

    return {
      ...prep,
      rounds: rounds || [],
      resources: resources || []
    };
  } catch (err) {
    console.error("Exception in getCompanyPrepBySlug:", err);
    return null;
  }
}

// Upsert company prep structure (admin action)
export async function upsertCompanyPrep(
  prep: Omit<CompanyPrep, "created_at" | "updated_at">,
  rounds: Omit<CompanyPrepRound, "id" | "company_prep_id" | "created_at">[],
  resources: Omit<CompanyPrepResource, "id" | "company_prep_id" | "created_at">[],
  supabaseClient?: any
): Promise<{ success: boolean; prepId?: string; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    
    // Check if company exists by slug
    const existing = await db
      .from("company_preps")
      .select("id")
      .eq("slug", prep.slug)
      .maybeSingle();
      
    let prepId = existing.data?.id;
    const payload = {
      ...prep,
      updated_at: new Date().toISOString()
    };

    let result;
    if (prepId) {
      result = await executeWrite("company_preps", "update", payload, { id: prepId }, db);
    } else {
      prepId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
      const fullPayload = { ...payload, id: prepId, created_at: new Date().toISOString() };
      result = await executeWrite("company_preps", "insert", fullPayload, undefined, db);
    }

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Replace rounds
    const { error: delRoundsError } = await db
      .from("company_prep_rounds")
      .delete()
      .eq("company_prep_id", prepId);

    if (delRoundsError) {
      return { success: false, error: delRoundsError };
    }

    if (rounds.length > 0) {
      const roundsPayload = rounds.map((r, idx) => ({
        ...r,
        company_prep_id: prepId,
        round_number: r.round_number || (idx + 1),
        created_at: new Date().toISOString()
      }));
      const roundsResult = await executeWrite("company_prep_rounds", "insert", roundsPayload, undefined, db);
      if (!roundsResult.success) {
        return { success: false, error: roundsResult.error };
      }
    }

    // Replace resources
    const { error: delResError } = await db
      .from("company_prep_resources")
      .delete()
      .eq("company_prep_id", prepId);

    if (delResError) {
      return { success: false, error: delResError };
    }

    if (resources.length > 0) {
      const resourcesPayload = resources.map(r => ({
        ...r,
        company_prep_id: prepId,
        created_at: new Date().toISOString()
      }));
      const resourcesResult = await executeWrite("company_prep_resources", "insert", resourcesPayload, undefined, db);
      if (!resourcesResult.success) {
        return { success: false, error: resourcesResult.error };
      }
    }

    // Seed analytics row if missing
    const { data: hasAnalytics } = await db
      .from("company_prep_analytics")
      .select("id")
      .eq("company_prep_id", prepId)
      .maybeSingle();

    if (!hasAnalytics) {
      await executeWrite("company_prep_analytics", "insert", {
        company_prep_id: prepId,
        views_count: 0,
        attempts_count: 0,
        completion_count: 0,
        updated_at: new Date().toISOString()
      }, undefined, db);
    }

    return { success: true, prepId };
  } catch (err) {
    console.error("Exception in upsertCompanyPrep:", err);
    return { success: false, error: err };
  }
}

// Delete company prep
export async function deleteCompanyPrep(id: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    return executeWrite("company_preps", "delete", undefined, { id }, db);
  } catch (err) {
    console.error("Exception in deleteCompanyPrep:", err);
    return { success: false, error: err };
  }
}

// Increment page views analytic
export async function incrementCompanyPrepView(prepId: string, supabaseClient?: any): Promise<void> {
  try {
    const db = await getDb(supabaseClient);
    const { data } = await db
      .from("company_prep_analytics")
      .select("views_count")
      .eq("company_prep_id", prepId)
      .maybeSingle();

    const currentViews = data?.views_count || 0;
    await executeWrite(
      "company_prep_analytics",
      "update",
      { views_count: currentViews + 1, updated_at: new Date().toISOString() },
      { company_prep_id: prepId },
      db
    );
  } catch (err) {
    console.error("Error incrementing company prep view:", err);
  }
}

// Track/increment attempted personalizations count
export async function trackCompanyPrepAttempt(prepId: string, supabaseClient?: any): Promise<void> {
  try {
    const db = await getDb(supabaseClient);
    const { data } = await db
      .from("company_prep_analytics")
      .select("attempts_count")
      .eq("company_prep_id", prepId)
      .maybeSingle();

    const currentAttempts = data?.attempts_count || 0;
    await executeWrite(
      "company_prep_analytics",
      "update",
      { attempts_count: currentAttempts + 1, updated_at: new Date().toISOString() },
      { company_prep_id: prepId },
      db
    );
  } catch (err) {
    console.error("Error tracking company prep attempt:", err);
  }
}

// Fetch user roadmap for a company prep
export async function getUserCompanyRoadmap(
  userId: string,
  companyPrepId: string,
  targetRole: string,
  supabaseClient?: any
): Promise<CompanyPrepUserRoadmap | null> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("company_prep_user_roadmaps")
      .select("*")
      .eq("user_id", userId)
      .eq("company_prep_id", companyPrepId)
      .eq("target_role", targetRole)
      .maybeSingle();

    if (error) {
      console.error("Error getting user roadmap:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getUserCompanyRoadmap:", err);
    return null;
  }
}

// Save personalized AI roadmap
export async function saveUserCompanyRoadmap(
  userId: string,
  companyPrepId: string,
  targetRole: string,
  roadmap: any,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    const existing = await getUserCompanyRoadmap(userId, companyPrepId, targetRole, db);

    const payload = {
      user_id: userId,
      company_prep_id: companyPrepId,
      target_role: targetRole,
      personalized_roadmap: roadmap,
      updated_at: new Date().toISOString()
    };

    if (existing && existing.id) {
      return executeWrite("company_prep_user_roadmaps", "update", payload, { id: existing.id }, db);
    } else {
      const fullPayload = {
        ...payload,
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        completed_steps: []
      };
      return executeWrite("company_prep_user_roadmaps", "insert", fullPayload, undefined, db);
    }
  } catch (err) {
    console.error("Exception in saveUserCompanyRoadmap:", err);
    return { success: false, error: err };
  }
}

// Admin fetch analytics aggregates
export async function getCompanyPrepAnalyticsList(supabaseClient?: any): Promise<any[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("company_preps")
      .select(`
        id,
        name,
        slug,
        company_prep_analytics (
          views_count,
          attempts_count,
          completion_count
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching analytics aggregates:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      views: c.company_prep_analytics?.views_count || 0,
      attempts: c.company_prep_analytics?.attempts_count || 0,
      completions: c.company_prep_analytics?.completion_count || 0
    }));
  } catch (err) {
    console.error("Exception in getCompanyPrepAnalyticsList:", err);
    return [];
  }
}
