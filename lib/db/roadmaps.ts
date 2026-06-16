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

export interface RoadmapProgressItem {
  id?: string;
  user_id: string;
  roadmap_name: string;
  step_name: string;
  completed: boolean;
  completed_at: string;
}

export async function getRoadmapProgress(userId: string, supabaseClient?: any): Promise<RoadmapProgressItem[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("roadmap_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading roadmap progress:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getRoadmapProgress:", err);
    return [];
  }
}

export async function updateRoadmapProgress(
  userId: string,
  roadmapName: string,
  stepName: string,
  completed: boolean,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  const db = await getDb(supabaseClient);
  if (completed) {
    const payload = {
      user_id: userId,
      roadmap_name: roadmapName,
      step_name: stepName,
      completed: true,
      completed_at: new Date().toISOString()
    };
    const result = await executeWrite("roadmap_progress", "upsert", payload, {
      user_id: userId,
      roadmap_name: roadmapName,
      step_name: stepName
    }, db);
    if (result.success) {
      triggerMissionProgress(userId, "roadmap", 1, undefined, db).catch(e => {
        console.error("Failed to trigger mission progress for roadmap step:", e);
      });
    }
    return result;
  } else {
    return executeWrite("roadmap_progress", "delete", null, {
      user_id: userId,
      roadmap_name: roadmapName,
      step_name: stepName
    }, db);
  }
}
