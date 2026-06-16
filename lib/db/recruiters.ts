import { supabase } from "@/lib/supabase";

export interface Recruiter {
  id: string;
  user_id: string;
  name: string;
  company: string;
  designation?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  hiring_roles?: string;
  relationship_strength: "Cold" | "Connected" | "Messaged" | "Responded" | "Referral Possible" | "Strong Connection";
  pipeline_stage: "Lead Found" | "Connection Sent" | "Connected" | "Conversation Started" | "Follow Up" | "Referral Requested" | "Referral Received" | "Interview Opportunity" | "Hired" | "Lost";
  last_interaction?: string;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  verification?: {
    verification_status: "Pending" | "Under Review" | "Verified" | "Rejected" | "Suspended";
    trust_score: number;
    reputation_score: number;
    fraud_risk_score: number;
    email_verified: boolean;
    linkedin_verified: boolean;
  };
}

export interface RecruiterActivity {
  id: string;
  recruiter_id: string;
  user_id: string;
  activity_type: string;
  notes?: string;
  created_at: string;
}

export interface RecruiterFollowup {
  id: string;
  recruiter_id: string;
  user_id: string;
  followup_date: string;
  message?: string;
  reminder: boolean;
  priority: "Low" | "Medium" | "High" | "Critical";
  completed: boolean;
  created_at: string;
}

export interface RecruiterTemplate {
  id: string;
  user_id?: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  created_at: string;
}

// Calculate 0-100 relationship score
export function calculateRelationshipScore(recruiter: Partial<Recruiter>, activities: RecruiterActivity[] = []): number {
  let score = 0;

  // 1. Pipeline Stage points (max 40)
  const stagePoints: Record<string, number> = {
    "Lead Found": 5,
    "Connection Sent": 10,
    "Connected": 20,
    "Conversation Started": 25,
    "Follow Up": 30,
    "Referral Requested": 32,
    "Referral Received": 35,
    "Interview Opportunity": 38,
    "Hired": 40,
    "Lost": 5
  };
  score += stagePoints[recruiter.pipeline_stage || "Lead Found"] || 5;

  // 2. Relationship Strength points (max 40)
  const strengthPoints: Record<string, number> = {
    "Cold": 5,
    "Connected": 15,
    "Messaged": 20,
    "Responded": 30,
    "Referral Possible": 35,
    "Strong Connection": 40
  };
  score += strengthPoints[recruiter.relationship_strength || "Cold"] || 5;

  // 3. Activity interaction points (max 10)
  score += Math.min(activities.length * 2, 10);

  // 4. Recency bonus points (max 10)
  const lastDateStr = recruiter.last_interaction || recruiter.updated_at || recruiter.created_at;
  if (lastDateStr) {
    const lastDate = new Date(lastDateStr).getTime();
    const diffDays = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) {
      score += 10;
    } else if (diffDays <= 14) {
      score += 5;
    }
  }

  // 5. Trust / Verification Bonus (max 15)
  if (recruiter.verification) {
    if (recruiter.verification.verification_status === "Verified") {
      score += 15;
    } else if (recruiter.verification.trust_score >= 81) {
      score += 15;
    } else if (recruiter.verification.trust_score >= 61) {
      score += 10;
    }
  }

  return Math.min(Math.max(score, 0), 100);
}

export function classifyRelationshipLevel(score: number): "Weak" | "Developing" | "Active" | "Strong" | "Advocate" {
  if (score <= 20) return "Weak";
  if (score <= 40) return "Developing";
  if (score <= 60) return "Active";
  if (score <= 80) return "Strong";
  return "Advocate";
}

// Fetch Recruiters with search/filter queries
export async function getRecruiters(
  userId: string,
  params?: {
    search?: string;
    company?: string;
    stage?: string;
    strength?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
    verifiedOnly?: boolean;
    minTrustScore?: number;
    minReputationScore?: number;
  }
): Promise<Recruiter[]> {
  try {
    let query = supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", userId);

    if (params?.company) {
      query = query.eq("company", params.company);
    }
    if (params?.stage) {
      query = query.eq("pipeline_stage", params.stage);
    }
    if (params?.strength) {
      query = query.eq("relationship_strength", params.strength);
    }
    
    // Sort ordering
    const sortField = params?.sortField || "created_at";
    const sortOrder = params?.sortOrder || "desc";
    
    // Only apply Postgres ordering if it's a standard field on recruiters
    const isStandardField = ["created_at", "updated_at", "name", "company", "relationship_strength", "pipeline_stage"].includes(sortField);
    if (isStandardField) {
      query = query.order(sortField, { ascending: sortOrder === "asc" });
    }

    const { data, error } = await query;
    if (error) throw error;

    let result: Recruiter[] = data || [];

    // Local filter for search query
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(searchLower) ||
          r.company.toLowerCase().includes(searchLower) ||
          (r.designation && r.designation.toLowerCase().includes(searchLower)) ||
          r.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Fetch and join verifications
    const { data: verifications } = await supabase
      .from("recruiter_verifications")
      .select("*");

    const verMap = new Map<string, any>();
    if (verifications) {
      verifications.forEach(v => verMap.set(v.recruiter_id, v));
    }

    result = result.map(r => ({
      ...r,
      verification: verMap.get(r.id) || {
        verification_status: "Pending",
        trust_score: 0,
        reputation_score: 0,
        fraud_risk_score: 0,
        email_verified: false,
        linkedin_verified: false
      }
    }));

    // Filter verification parameters
    if (params?.verifiedOnly) {
      result = result.filter(r => r.verification?.verification_status === "Verified");
    }
    if (params?.minTrustScore !== undefined) {
      result = result.filter(r => (r.verification?.trust_score || 0) >= params.minTrustScore!);
    }
    if (params?.minReputationScore !== undefined) {
      result = result.filter(r => (r.verification?.reputation_score || 0) >= params.minReputationScore!);
    }

    // Local sorting for verification fields or non-standard fields
    if (!isStandardField) {
      result.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === "trust_score") {
          valA = a.verification?.trust_score || 0;
          valB = b.verification?.trust_score || 0;
        } else if (sortField === "reputation_score") {
          valA = Number(a.verification?.reputation_score || 0);
          valB = Number(b.verification?.reputation_score || 0);
        }
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return result;
  } catch (err) {
    console.error("Error fetching recruiters:", err);
    return [];
  }
}

// Fetch single recruiter with activities
export async function getRecruiterById(id: string, userId: string): Promise<Recruiter | null> {
  try {
    const { data: rec, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!rec) return null;

    const { data: ver } = await supabase
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", id)
      .maybeSingle();

    return {
      ...rec,
      verification: ver || {
        verification_status: "Pending",
        trust_score: 0,
        reputation_score: 0,
        fraud_risk_score: 0,
        email_verified: false,
        linkedin_verified: false
      }
    };
  } catch (err) {
    console.error(`Error fetching recruiter ${id}:`, err);
    return null;
  }
}

// Create Recruiter
export async function createRecruiter(
  userId: string,
  rec: Partial<Recruiter>
): Promise<{ success: boolean; data?: Recruiter; error?: any }> {
  try {
    const payload = {
      user_id: userId,
      name: rec.name || "Unknown Recruiter",
      company: rec.company || "Unknown Company",
      designation: rec.designation || "",
      linkedin_url: rec.linkedin_url || "",
      email: rec.email || "",
      phone: rec.phone || "",
      location: rec.location || "",
      hiring_roles: rec.hiring_roles || "",
      relationship_strength: rec.relationship_strength || "Cold",
      pipeline_stage: rec.pipeline_stage || "Lead Found",
      last_interaction: rec.last_interaction || new Date().toISOString(),
      notes: rec.notes || "",
      tags: rec.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("recruiters")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Log default activity: Recruiter Added
    await createRecruiterActivity(data.id, userId, "Connection Profile Created", "Added recruiter profile to database");

    // Invalidate Redis cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true, data };
  } catch (err) {
    console.error("Error creating recruiter:", err);
    return { success: false, error: err };
  }
}

// Update Recruiter details
export async function updateRecruiter(
  id: string,
  rec: Partial<Recruiter>,
  userId: string
): Promise<{ success: boolean; data?: Recruiter; error?: any }> {
  try {
    const payload = {
      ...rec,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("recruiters")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate Cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true, data };
  } catch (err) {
    console.error(`Error updating recruiter ${id}:`, err);
    return { success: false, error: err };
  }
}

// Delete Recruiter
export async function deleteRecruiter(id: string, userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from("recruiters")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    // Invalidate Cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error(`Error deleting recruiter ${id}:`, err);
    return { success: false, error: err };
  }
}

// Fetch Activities for a Recruiter
export async function getRecruiterActivities(recruiterId: string, userId: string): Promise<RecruiterActivity[]> {
  try {
    const { data, error } = await supabase
      .from("recruiter_activities")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error fetching recruiter activities for ${recruiterId}:`, err);
    return [];
  }
}

// Log new Activity
export async function createRecruiterActivity(
  recruiterId: string,
  userId: string,
  activityType: string,
  notes?: string
): Promise<{ success: boolean; data?: RecruiterActivity; error?: any }> {
  try {
    const payload = {
      recruiter_id: recruiterId,
      user_id: userId,
      activity_type: activityType,
      notes: notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("recruiter_activities")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Update recruiter last_interaction timestamp
    await supabase
      .from("recruiters")
      .update({ 
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", recruiterId);

    // Invalidate cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true, data };
  } catch (err) {
    console.error("Error creating recruiter activity:", err);
    return { success: false, error: err };
  }
}

// Fetch follow-ups
export async function getRecruiterFollowups(userId: string, completed?: boolean): Promise<RecruiterFollowup[]> {
  try {
    let query = supabase
      .from("recruiter_followups")
      .select("*")
      .eq("user_id", userId)
      .order("followup_date", { ascending: true });

    if (completed !== undefined) {
      query = query.eq("completed", completed);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching recruiter followups:", err);
    return [];
  }
}

// Create follow-up reminder
export async function createRecruiterFollowup(
  userId: string,
  follow: Partial<RecruiterFollowup>
): Promise<{ success: boolean; data?: RecruiterFollowup; error?: any }> {
  try {
    const payload = {
      user_id: userId,
      recruiter_id: follow.recruiter_id,
      followup_date: follow.followup_date,
      message: follow.message || "",
      reminder: follow.reminder ?? true,
      priority: follow.priority || "Medium",
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("recruiter_followups")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Invalidate Cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true, data };
  } catch (err) {
    console.error("Error creating recruiter followup:", err);
    return { success: false, error: err };
  }
}

// Complete follow-up task
export async function completeRecruiterFollowup(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from("recruiter_followups")
      .update({
        completed: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    // Invalidate Cache
    const { invalidateRecruiterCache } = await import("@/lib/redis");
    invalidateRecruiterCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error(`Error completing followup ${id}:`, err);
    return { success: false, error: err };
  }
}

// Fetch templates
export async function getTemplates(userId: string): Promise<RecruiterTemplate[]> {
  try {
    const { data, error } = await supabase
      .from("recruiter_templates")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching templates:", err);
    return [];
  }
}
