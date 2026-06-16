import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { PlacementApplication } from "@/types/crm";
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

// Map database row to PlacementApplication frontend object
function mapRowToApplication(row: any): PlacementApplication {
  const details = row.details || {};
  
  // Normalize date format from ISO/Timestamptz to YYYY-MM-DD
  const formatDbDate = (dbDate: string | null | undefined) => {
    if (!dbDate) return "";
    return dbDate.split("T")[0];
  };

  return {
    id: row.id,
    companyName: row.company || "",
    role: row.job_title || "",
    location: row.location || "",
    package: row.salary || "",
    applicationDate: formatDbDate(row.applied_date),
    jobUrl: row.application_link || undefined,
    referralStatus: details.referralStatus || "None",
    status: row.status as PlacementApplication["status"],
    notes: row.notes || undefined,
    recruiter: details.recruiter || undefined,
    schedules: details.schedules || [],
    offer: details.offer || undefined,
    oas: details.oas || [],
    interviews: details.interviews || [],
    matchScore: details.matchScore || {
      resumeMatch: 75,
      interviewReadiness: 65,
      overallProbability: 70
    },
    deadline: details.deadline || undefined,
    assessmentDate: details.assessmentDate || undefined,
    interviewDate: details.interviewDate || undefined,
    offerExpiry: details.offerExpiry || undefined
  };
}

// Fetch all applications for a user
export async function getApplications(userId: string, supabaseClient?: any): Promise<PlacementApplication[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("last_updated", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return [];
    }

    return (data || []).map(mapRowToApplication);
  } catch (err) {
    console.error("Exception fetching applications:", err);
    return [];
  }
}

// Fetch application by ID and its history logs
export async function getApplicationById(id: string, userId: string, supabaseClient?: any): Promise<{
  application: PlacementApplication | null;
  history: any[];
}> {
  try {
    const db = await getDb(supabaseClient);
    // 1. Get Application
    const { data: appData, error: appError } = await db
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (appError || !appData) {
      console.error("Error fetching application details:", appError);
      return { application: null, history: [] };
    }

    const application = mapRowToApplication(appData);

    // 2. Get history logs
    const { data: historyData, error: historyError } = await db
      .from("application_history")
      .select("*")
      .eq("application_id", id)
      .order("changed_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching application history:", historyError);
      return { application, history: [] };
    }

    return {
      application,
      history: historyData || []
    };
  } catch (err) {
    console.error("Exception fetching application by ID:", err);
    return { application: null, history: [] };
  }
}

// Create new application
export async function createApplication(
  userId: string,
  app: Partial<PlacementApplication>,
  supabaseClient?: any
): Promise<{ success: boolean; data?: PlacementApplication; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    const defaultDetails = {
      referralStatus: app.referralStatus || "None",
      recruiter: app.recruiter || {},
      schedules: app.schedules || [],
      offer: app.offer || null,
      oas: app.oas || [],
      interviews: app.interviews || [],
      matchScore: app.matchScore || {
        resumeMatch: 75,
        interviewReadiness: 65,
        overallProbability: 70
      },
      deadline: app.deadline || null,
      assessmentDate: app.assessmentDate || null,
      interviewDate: app.interviewDate || null,
      offerExpiry: app.offerExpiry || null
    };

    const payload = {
      user_id: userId,
      company: app.companyName || "Unknown",
      job_title: app.role || "Job Opportunity",
      location: app.location || "",
      salary: app.package || "",
      application_link: app.jobUrl || "",
      status: app.status || "Applied",
      applied_date: app.applicationDate ? new Date(app.applicationDate).toISOString() : new Date().toISOString(),
      last_updated: new Date().toISOString(),
      notes: app.notes || "",
      details: defaultDetails,
      source: "Manual"
    };

    // Use direct insert first, or fallback via executeWrite if needed
    const { data, error } = await db
      .from("applications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error inserting application:", error);
      return { success: false, error };
    }

    const createdApp = mapRowToApplication(data);

    // Log to history
    await db
      .from("application_history")
      .insert({
        application_id: createdApp.id,
        status: createdApp.status,
        changed_at: new Date().toISOString(),
        notes: "Application created manually"
      });

    // Trigger mission progress if not just saved
    if (createdApp.status !== "Saved") {
      triggerMissionProgress(userId, "applications", 1, undefined, db).catch(e => {
        console.error("Failed to trigger mission progress for application:", e);
      });
    }

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true, data: createdApp };
  } catch (err) {
    console.error("Exception creating application:", err);
    return { success: false, error: err };
  }
}

// Update existing application
export async function updateApplication(
  id: string,
  app: Partial<PlacementApplication>,
  userId: string,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    // 1. Get current status to check for transition logs
    const { data: current, error: fetchErr } = await db
      .from("applications")
      .select("status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !current) {
      return { success: false, error: fetchErr || new Error("Application not found") };
    }

    // 2. Prepare payload
    const detailsPayload: any = {};
    if (app.referralStatus !== undefined) detailsPayload.referralStatus = app.referralStatus;
    if (app.recruiter !== undefined) detailsPayload.recruiter = app.recruiter;
    if (app.schedules !== undefined) detailsPayload.schedules = app.schedules;
    if (app.offer !== undefined) detailsPayload.offer = app.offer;
    if (app.oas !== undefined) detailsPayload.oas = app.oas;
    if (app.interviews !== undefined) detailsPayload.interviews = app.interviews;
    if (app.matchScore !== undefined) detailsPayload.matchScore = app.matchScore;
    if (app.deadline !== undefined) detailsPayload.deadline = app.deadline;
    if (app.assessmentDate !== undefined) detailsPayload.assessmentDate = app.assessmentDate;
    if (app.interviewDate !== undefined) detailsPayload.interviewDate = app.interviewDate;
    if (app.offerExpiry !== undefined) detailsPayload.offerExpiry = app.offerExpiry;

    // Fetch existing details to merge
    const { data: existingApp } = await db
      .from("applications")
      .select("details")
      .eq("id", id)
      .single();
    
    const mergedDetails = {
      ...(existingApp?.details || {}),
      ...detailsPayload
    };

    const payload: any = {
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (app.companyName !== undefined) payload.company = app.companyName;
    if (app.role !== undefined) payload.job_title = app.role;
    if (app.location !== undefined) payload.location = app.location;
    if (app.package !== undefined) payload.salary = app.package;
    if (app.jobUrl !== undefined) payload.application_link = app.jobUrl;
    if (app.notes !== undefined) payload.notes = app.notes;
    if (app.status !== undefined) payload.status = app.status;
    if (app.applicationDate !== undefined) payload.applied_date = new Date(app.applicationDate).toISOString();
    
    payload.details = mergedDetails;

    const { error } = await db
      .from("applications")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating application:", error);
      return { success: false, error };
    }

    // Log to history if status has changed
    if (app.status && app.status !== current.status) {
      await db
          .from("application_history")
          .insert({
            application_id: id,
            status: app.status,
            changed_at: new Date().toISOString(),
            notes: `Status updated to ${app.status}`
          });
    }

    // Invalidate user cache
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error("Exception updating application:", err);
    return { success: false, error: err };
  }
}

// Fast update status only (used for Kanban drag-and-drop actions)
export async function updateApplicationStatus(
  id: string,
  status: string,
  userId: string,
  notes?: string,
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    const { data: current, error: fetchErr } = await db
      .from("applications")
      .select("status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !current) {
      return { success: false, error: fetchErr || new Error("Application not found") };
    }

    if (current.status === status) {
      return { success: true };
    }

    const { error } = await db
      .from("applications")
      .update({
        status,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating status:", error);
      return { success: false, error };
    }

    // Log status transition
    await db
      .from("application_history")
      .insert({
        application_id: id,
        status,
        changed_at: new Date().toISOString(),
        notes: notes || `Status changed from ${current.status} to ${status}`
      });

    // Trigger mission progress if it transitioned from Saved to an active tracking status
    if (current.status === "Saved" && status !== "Saved") {
      triggerMissionProgress(userId, "applications", 1, undefined, db).catch(e => {
        console.error("Failed to trigger mission progress on status update:", e);
      });
    }

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error("Exception updating status:", err);
    return { success: false, error: err };
  }
}

// Delete an application
export async function deleteApplication(id: string, userId: string, supabaseClient?: any): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    const { error } = await db
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting application:", error);
      return { success: false, error };
    }

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error("Exception deleting application:", err);
    return { success: false, error: err };
  }
}

// Track saved job (from job board integrations) - prevents duplicates
export async function trackSavedJob(
  userId: string,
  job: any,
  status: string = "Saved",
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  try {
    const db = await getDb(supabaseClient);
    // Check if application record already exists for this job_id
    const { data: existing, error: checkErr } = await db
      .from("applications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();

    if (checkErr) {
      console.error("Error checking existing tracked job:", checkErr);
      return { success: false, error: checkErr };
    }

    if (existing) {
      // Avoid downgrading 'Applied' to 'Saved'
      if (status === "Applied" && existing.status === "Saved") {
        return updateApplicationStatus(
          existing.id,
          "Applied",
          userId,
          "Updated to Applied via platform actions",
          db
        );
      }
      return { success: true };
    }

    const payload = {
      user_id: userId,
      job_id: job.id,
      job_title: job.drive_title || job.title || "Job Opportunity",
      company: job.company_name || job.company || "Unknown Company",
      application_link: job.apply_link || `/jobs/${job.drive_slug}`,
      status: status,
      applied_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      salary: job.salary_range || job.salary || "",
      location: job.location || "",
      source: "BuggedBrain",
      details: {
        referralStatus: "None",
        schedules: [],
        oas: [],
        interviews: [],
        recruiter: {},
        matchScore: {
          resumeMatch: 78,
          interviewReadiness: 65,
          overallProbability: 70
        }
      }
    };

    const { data, error } = await db
      .from("applications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating tracked job:", error);
      return { success: false, error };
    }

    // Log history
    await db
      .from("application_history")
      .insert({
        application_id: data.id,
        status: status,
        changed_at: new Date().toISOString(),
        notes: status === "Saved" 
          ? "Job saved from BuggedBrain listings" 
          : "Opportunity marked as Applied from BuggedBrain listings"
      });

    // Trigger mission progress if not just saved
    if (status !== "Saved") {
      triggerMissionProgress(userId, "applications", 1, undefined, db).catch(e => {
        console.error("Failed to trigger mission progress on trackSavedJob:", e);
      });
    }

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    invalidateUserCache(userId).catch(err => console.error("Cache invalidation error:", err));

    return { success: true };
  } catch (err) {
    console.error("Exception in trackSavedJob:", err);
    return { success: false, error: err };
  }
}

// Get admin aggregates analytics (Anonymized)
export async function getAdminAnalytics(supabaseClient?: any): Promise<{
  totalApplications: number;
  totalActiveUsers: number;
  mostAppliedCompanies: Array<{ company: string; count: number }>;
  averageOfferRate: number;
  mostPopularRoles: Array<{ role: string; count: number }>;
}> {
  try {
    const db = await getDb(supabaseClient);
    const { data: apps, error } = await db
      .from("applications")
      .select("user_id, status, company, job_title");

    if (error || !apps) {
      console.error("Error fetching admin aggregates:", error);
      return {
        totalApplications: 0,
        totalActiveUsers: 0,
        mostAppliedCompanies: [],
        averageOfferRate: 0,
        mostPopularRoles: []
      };
    }

    const typedApps = (apps || []) as { user_id: string; status: string; company: string | null; job_title: string | null }[];
    const totalApplications = typedApps.length;

    // Distinct Active Users count
    const activeUsersSet = new Set(typedApps.map(a => a.user_id));
    const totalActiveUsers = activeUsersSet.size;

    // Most applied companies counts
    const companyCounts: Record<string, number> = {};
    typedApps.forEach(a => {
      if (a.company) {
        const norm = a.company.trim();
        companyCounts[norm] = (companyCounts[norm] || 0) + 1;
      }
    });
    const mostAppliedCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most popular roles counts
    const roleCounts: Record<string, number> = {};
    typedApps.forEach(a => {
      if (a.job_title) {
        const norm = a.job_title.trim();
        roleCounts[norm] = (roleCounts[norm] || 0) + 1;
      }
    });
    const mostPopularRoles = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Offer Rate = (Offers Received + Joined) / Total Apps
    const offersCount = typedApps.filter(a => a.status === "Offer Received" || a.status === "Joined").length;
    const averageOfferRate = totalApplications > 0
      ? Math.round((offersCount / totalApplications) * 100)
      : 0;

    return {
      totalApplications,
      totalActiveUsers,
      mostAppliedCompanies,
      averageOfferRate,
      mostPopularRoles
    };
  } catch (err) {
    console.error("Exception in getAdminAnalytics:", err);
    return {
      totalApplications: 0,
      totalActiveUsers: 0,
      mostAppliedCompanies: [],
      averageOfferRate: 0,
      mostPopularRoles: []
    };
  }
}
