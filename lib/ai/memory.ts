import { supabase } from "../supabase";
import { getStudentIntelligenceProfile } from "./intelligence";

/**
 * lib/ai/memory.ts
 * Context Engine 2.0 (Adaptive AI Memory & Continuous Personalization Engine)
 * Handles permanent, long-term, working, and episodic memories, RLS enforcement, and GDPR privacy actions.
 */

export interface StudentMemory {
  id: string;
  user_id: string;
  memory_type: "permanent" | "long_term" | "working" | "episodic";
  key: string;
  value: any;
  confidence_score: number;
  expires_at?: string;
  created_at: string;
}

/**
 * Fetches all active non-expired memories for a student candidate.
 */
export async function getStudentMemories(userId: string): Promise<StudentMemory[]> {
  try {
    const { data, error } = await supabase
      .from("student_memories")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.warn("[Memory Engine] Failed to select memories:", error.message);
      return [];
    }

    const now = new Date();
    // Filter out expired working memories dynamically
    return (data || []).filter((mem: any) => {
      if (mem.expires_at && new Date(mem.expires_at) < now) {
        return false;
      }
      return true;
    });
  } catch (err) {
    console.error("[Memory Engine] Error fetching memories:", err);
    return [];
  }
}

/**
 * Saves or updates a memory node dynamically.
 */
export async function saveStudentMemory(
  userId: string,
  type: "permanent" | "long_term" | "working" | "episodic",
  key: string,
  value: any,
  confidence = 1.0,
  expiresAt?: Date
): Promise<boolean> {
  try {
    const { error } = await supabase.from("student_memories").upsert(
      {
        user_id: userId,
        memory_type: type,
        key,
        value,
        confidence_score: confidence,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,memory_type,key" }
    );

    if (error) {
      console.error("[Memory Engine] Upsert failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Memory Engine] Exception in saveStudentMemory:", err);
    return false;
  }
}

/**
 * GDPR Privacy: Delete a specific memory item.
 */
export async function deleteStudentMemory(userId: string, memoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("student_memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Memory Engine] Delete memory failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Memory Engine] Exception in deleteStudentMemory:", err);
    return false;
  }
}

/**
 * GDPR Privacy: Reset all recommendation states and purge episodic/working memories.
 */
export async function resetStudentPersonalization(userId: string): Promise<boolean> {
  try {
    // Delete working and episodic memories
    const { error: memError } = await supabase
      .from("student_memories")
      .delete()
      .eq("user_id", userId)
      .in("memory_type", ["working", "episodic"]);

    // Reset recommendation feedback loops back to default
    const { error: recError } = await supabase
      .from("ai_recommendations")
      .delete()
      .eq("user_id", userId);

    if (memError || recError) {
      console.error("[Memory Engine] Reset personalization database error:", memError || recError);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Memory Engine] Exception in resetStudentPersonalization:", err);
    return false;
  }
}

/**
 * Context Builder 2.0
 * Formulates a complete structured memory payload to inject into LLM prompts.
 */
export async function buildEnhancedAIContext(
  userId: string,
  currentModule: string,
  currentTask: string
): Promise<string> {
  try {
    // 1. Gather student intelligence metrics
    const profile = await getStudentIntelligenceProfile(userId);
    
    // 2. Fetch active memory records
    const memories = await getStudentMemories(userId);

    // 3. Separate memory layers
    const permanent = memories.filter(m => m.memory_type === "permanent");
    const longTerm = memories.filter(m => m.memory_type === "long_term");
    const working = memories.filter(m => m.memory_type === "working");
    const episodic = memories.filter(m => m.memory_type === "episodic");

    let context = `### SYSTEM ADAPTIVE STUDENT MEMORY (CONTEXT ENGINE 2.0) ###\n`;
    context += `Active Module: ${currentModule} | Current Task: ${currentTask}\n\n`;

    // Candidate Identity Core
    context += `[STUDENT INTEGRATION METRICS]\n`;
    context += `- Target Roles: ${profile.target_roles?.join(", ") || "Software Engineer"}\n`;
    context += `- Target Companies: ${profile.preferred_companies?.join(", ") || "FAANG"}\n`;
    context += `- Strong Topics: ${profile.strong_topics?.join(", ") || "None recorded"}\n`;
    context += `- Weak Topics: ${profile.weak_topics?.join(", ") || "None recorded"}\n`;
    context += `- Study Consistency Score: ${profile.study_consistency}x\n\n`;

    if (permanent.length > 0) {
      context += `[PERMANENT MEMORY]\n`;
      permanent.forEach(m => {
        context += `- ${m.key}: ${JSON.stringify(m.value)}\n`;
      });
      context += `\n`;
    }

    if (longTerm.length > 0) {
      context += `[LONG-TERM EVOLVING MEMORY]\n`;
      longTerm.forEach(m => {
        context += `- ${m.key}: ${JSON.stringify(m.value)} (Confidence: ${m.confidence_score})\n`;
      });
      context += `\n`;
    }

    if (working.length > 0) {
      context += `[WORKING CHAT CONTEXT]\n`;
      working.forEach(m => {
        context += `- Active Focus: ${m.key} -> ${JSON.stringify(m.value)}\n`;
      });
      context += `\n`;
    }

    if (episodic.length > 0) {
      context += `[EPISODIC STUDENT MILESTONES]\n`;
      episodic.forEach(m => {
        context += `- Milestone: ${m.key} completed on ${new Date(m.created_at).toLocaleDateString()}\n`;
      });
      context += `\n`;
    }

    context += `----------------------------------------------------------\n`;
    return context;
  } catch (err) {
    console.error("[Memory Engine] Failed to build enhanced AI context:", err);
    return "";
  }
}
