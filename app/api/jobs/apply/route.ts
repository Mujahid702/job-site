import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidateUserCache } from "@/lib/redis";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { triggerMissionProgress } from "@/lib/db/missions";
import { logInfo, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface PrecheckResult {
  score: number;
  issues: string[];
}

async function performApplyPrecheck(userId: string, supabase: any): Promise<PrecheckResult> {
  const issues: string[] = [];
  let score = 100;

  // 1. Fetch profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // 2. Check Resume
  const hasResume = profile?.resume_url || profile?.resume_name;
  if (!hasResume) {
    score -= 30;
    issues.push("Resume Missing");
  }

  // 3. Check Profile Completeness
  const completion = profile?.profile_completion || 0;
  if (completion < 70) {
    score -= 20;
    issues.push(`Profile Incomplete (Completion: ${completion}%)`);
  }

  // 4. Check LinkedIn
  const hasLinkedIn = profile?.linkedin_url && profile.linkedin_url.includes("linkedin.com");
  if (!hasLinkedIn) {
    score -= 15;
    issues.push("LinkedIn Profile Missing or Invalid");
  }

  // 5. Check GitHub
  const hasGitHub = profile?.github_url && profile.github_url.includes("github.com");
  if (!hasGitHub) {
    score -= 15;
    issues.push("GitHub Link Missing or Invalid");
  }

  // 6. Check ATS Score > 60
  const { data: scans } = await supabase
    .from("resume_scans")
    .select("ats_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const atsScore = scans?.[0]?.ats_score || 0;
  if (atsScore <= 60) {
    score -= 20;
    issues.push(atsScore > 0 ? `Resume ATS Score is low (${atsScore})` : "No Resume ATS Scans found");
  }

  return {
    score: Math.max(score, 0),
    issues
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized. Log in to apply." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { jobId, forceApply = false, matchScore = 75 } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, message: "Missing parameter: jobId" }, { status: 400 });
    }

    // Load job postings details
    const { data: job, error: jobErr } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      logError(`Job not found for ID ${jobId}`, jobErr);
      return NextResponse.json({ success: false, message: "Job opportunity not found" }, { status: 404 });
    }

    // Run Pre-check
    const precheck = await performApplyPrecheck(user.id, supabase);

    if (precheck.score < 70 && !forceApply) {
      return NextResponse.json({
        success: false,
        warning: true,
        readinessToApply: precheck,
        applyLink: job.apply_link,
        message: "Your application readiness score is below 70%. We recommend fixing the issues before applying."
      }, { status: 200 });
    }

    // Verify if already applied to prevent duplicates
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("job_id", jobId)
      .maybeSingle();

    let appId = existingApp?.id;

    if (existingApp) {
      // If already exists, transition to Applied
      if (existingApp.status === "Saved") {
        await supabase
          .from("applications")
          .update({
            status: "Applied",
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", existingApp.id);

        await supabase.from("application_history").insert({
          application_id: existingApp.id,
          status: "Applied",
          changed_at: new Date().toISOString(),
          notes: `Updated to Applied via One-Click Apply. Precheck score: ${precheck.score}`
        });
      }
    } else {
      // Create new application
      const payload = {
        user_id: user.id,
        job_id: jobId,
        job_title: job.drive_title || "Job Opportunity",
        company: job.company_name || "Unknown Company",
        application_link: job.apply_link,
        status: "Applied",
        applied_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        salary: job.salary_range || "",
        location: job.location || "",
        source: "One-Click Apply",
        details: {
          referralStatus: "None",
          recruiter: {},
          schedules: [],
          oas: [],
          interviews: [],
          offer: null,
          matchScore: {
            resumeMatch: matchScore,
            interviewReadiness: 65,
            overallProbability: matchScore
          }
        }
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("applications")
        .insert(payload)
        .select()
        .single();

      if (insertErr) {
        logError("Failed to insert application inside smart apply", insertErr);
        return NextResponse.json({ success: false, message: "Database insert failed" }, { status: 500 });
      }

      appId = inserted.id;

      // Log history
      await supabase.from("application_history").insert({
        application_id: inserted.id,
        status: "Applied",
        changed_at: new Date().toISOString(),
        notes: `Application logged automatically via One-Click Apply. Precheck score: ${precheck.score}`
      });
    }

    // Log telemetry event in analytics_events
    await supabase.from("analytics_events").insert({
      event_type: "job_applied",
      user_id: user.id,
      metadata: {
        jobId,
        company: job.company_name,
        role: job.drive_title,
        precheckScore: precheck.score,
        matchScore
      }
    });

    // Track analytics event: apply_clicked
    await supabase.from("analytics_events").insert({
      event_type: "apply_clicked",
      user_id: user.id,
      metadata: {
        jobId,
        company: job.company_name,
        role: job.drive_title
      }
    });

    // Trigger daily/weekly career mission progress updates
    triggerMissionProgress(user.id, "applications", 1, undefined, supabase).catch(e => {
      console.error("Missions trigger failure in smart apply:", e);
    });

    // Self-healing Referral Conversion Check:
    // If the user has submitted an application, trigger referral conversion check
    try {
      const { processReferralConversion } = await import("@/lib/db/growth");
      await processReferralConversion(user.id, supabase);
    } catch (e) {
      console.error("Failed to run self-healing referral conversion in smart apply:", e);
    }

    // Invalidate caches & recalculate PRI
    await invalidateUserCache(user.id);
    await calculatePRIScore(user.id, undefined, supabase);

    return NextResponse.json({
      success: true,
      readinessToApply: precheck,
      applyLink: job.apply_link,
      appId
    });
  } catch (err: any) {
    logError("Smart Apply API failed", err);
    return NextResponse.json({ success: false, message: "Unexpected server error during Apply workflow" }, { status: 500 });
  }
}
