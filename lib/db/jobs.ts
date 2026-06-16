import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export async function getSavedJobs(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*, job:job_postings(*)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading saved jobs:", error);
      return [];
    }
    return (data || [])
      .map(item => {
        if (!item.job) return null;
        return {
          ...item.job,
          saved_at: item.saved_at
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Exception in getSavedJobs:", err);
    return [];
  }
}

export async function saveJob(userId: string, jobId: string): Promise<{ success: boolean; error?: any }> {
  const payload = {
    user_id: userId,
    job_id: jobId,
    saved_at: new Date().toISOString()
  };
  const result = await executeWrite("saved_jobs", "upsert", payload, { user_id: userId, job_id: jobId });

  try {
    const { data: job } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", jobId)
      .single();

    if (job) {
      const { trackSavedJob } = await import("./applications");
      await trackSavedJob(userId, job, "Saved");
    }
  } catch (err) {
    console.error("Failed to sync saved job to tracker:", err);
  }

  return result;
}

export async function unsaveJob(userId: string, jobId: string): Promise<{ success: boolean; error?: any }> {
  return executeWrite("saved_jobs", "delete", null, { user_id: userId, job_id: jobId });
}
