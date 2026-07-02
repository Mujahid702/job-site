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

export interface PortfolioGeneration {
  id?: string;
  user_id: string;
  theme: string;
  font_family: string;
  color_scheme: string;
  profile_image_url?: string | null;
  structured_schema: any;
  ai_enhanced?: boolean;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioProject {
  id?: string;
  generation_id: string;
  user_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string | null;
  live_url?: string | null;
  impact_score?: number | null;
  problem_statement?: string | null;
  solution_description?: string | null;
  challenges_faced?: string | null;
  is_visible?: boolean;
  created_at?: string;
}

export interface PortfolioTemplate {
  id?: string;
  name: string;
  theme: string;
  font_family: string;
  color_scheme: string;
  sections_config?: any;
  is_active?: boolean;
  created_at?: string;
}

// Fetch user's latest portfolio generation
export async function getPortfolioGeneration(userId: string, supabaseClient?: any): Promise<PortfolioGeneration | null> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("portfolio_generations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching portfolio generation:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getPortfolioGeneration:", err);
    return null;
  }
}

// Fetch a portfolio generation by UUID
export async function getPortfolioGenerationById(id: string, supabaseClient?: any): Promise<PortfolioGeneration | null> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("portfolio_generations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching portfolio generation by id:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getPortfolioGenerationById:", err);
    return null;
  }
}

// Save portfolio generation
export async function savePortfolioGeneration(
  userId: string,
  generation: Omit<PortfolioGeneration, "user_id">,
  supabaseClient?: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  const db = await getDb(supabaseClient);
  
  // Check if one already exists
  const existing = await getPortfolioGeneration(userId, db);
  
  const payload = {
    ...generation,
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing && existing.id) {
    result = await executeWrite("portfolio_generations", "update", payload, { id: existing.id }, db);
    if (result.success) {
      return { success: true, data: { ...existing, ...payload } };
    }
  } else {
    const newId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
    const fullPayload = { ...payload, id: newId, created_at: new Date().toISOString() };
    result = await executeWrite("portfolio_generations", "insert", fullPayload, undefined, db);
    if (result.success) {
      return { success: true, data: fullPayload };
    }
  }

  return { success: false, error: result.error };
}

// Fetch projects for a given generation
export async function getPortfolioProjects(generationId: string, supabaseClient?: any): Promise<PortfolioProject[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("portfolio_projects")
      .select("*")
      .eq("generation_id", generationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching portfolio projects:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getPortfolioProjects:", err);
    return [];
  }
}

// Save/Sync portfolio projects
export async function savePortfolioProjects(
  userId: string,
  generationId: string,
  projects: Omit<PortfolioProject, "user_id" | "generation_id">[],
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    
    // Deleting existing projects for this generation to sync cleanly
    const { error: deleteError } = await db
      .from("portfolio_projects")
      .delete()
      .eq("generation_id", generationId);

    if (deleteError) {
      console.error("Error clearing old portfolio projects:", deleteError);
      return { success: false, error: deleteError };
    }

    if (projects.length === 0) return { success: true };

    const payload = projects.map(p => ({
      ...p,
      user_id: userId,
      generation_id: generationId,
      created_at: new Date().toISOString()
    }));

    const result = await executeWrite("portfolio_projects", "insert", payload, undefined, db);
    return result;
  } catch (err) {
    console.error("Exception in savePortfolioProjects:", err);
    return { success: false, error: err };
  }
}

// Templates management
export async function getTemplates(supabaseClient?: any): Promise<PortfolioTemplate[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("portfolio_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching portfolio templates:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getTemplates:", err);
    return [];
  }
}

export async function saveTemplate(
  template: Omit<PortfolioTemplate, "created_at">,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  if (template.id) {
    return executeWrite("portfolio_templates", "update", template, { id: template.id }, db);
  } else {
    const payload = {
      ...template,
      created_at: new Date().toISOString()
    };
    return executeWrite("portfolio_templates", "insert", payload, undefined, db);
  }
}

export async function deleteTemplate(templateId: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  return executeWrite("portfolio_templates", "delete", undefined, { id: templateId }, db);
}
