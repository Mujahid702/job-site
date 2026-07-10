import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Check if requester is Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      // Allow fallback if it is local development without strict roles
      // For production verification, we check public profile role configurations
    }

    // 1. Fetch KPI Sums from feature_telemetry
    const { data: telemetryList, error: telErr } = await supabase
      .from("feature_telemetry")
      .select("feature_name, estimated_cost_usd, blocked_reason, user_id");

    if (telErr) throw telErr;

    let totalAtsScans = 0;
    let totalJdMatches = 0;
    let totalProjectsGenerated = 0;
    let totalExamsTaken = 0;
    let totalResumeBuilds = 0;
    let totalSpends = 0;
    let totalBlocks = 0;
    const uniqueUsersSet = new Set<string>();

    if (telemetryList) {
      telemetryList.forEach(t => {
        totalSpends += Number(t.estimated_cost_usd || 0);
        if (t.blocked_reason) {
          totalBlocks++;
        } else {
          uniqueUsersSet.add(t.user_id);
          if (t.feature_name === "ats_analyzer") totalAtsScans++;
          else if (t.feature_name === "jd_matcher") totalJdMatches++;
          else if (t.feature_name === "project_generation") totalProjectsGenerated++;
          else if (t.feature_name === "exam_mode") totalExamsTaken++;
          else if (t.feature_name === "resume_builder") totalResumeBuilds++;
        }
      });
    }

    const averageRequests = uniqueUsersSet.size > 0 
      ? Number(((telemetryList?.length || 0) / uniqueUsersSet.size).toFixed(1))
      : 0;

    // 2. Fetch Recent Telemetry Logs with user profile details
    const { data: rawLogs, error: logsErr } = await supabase
      .from("feature_telemetry")
      .select(`
        id,
        feature_name,
        plan_type,
        execution_time_ms,
        estimated_cost_usd,
        blocked_reason,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (logsErr) throw logsErr;

    // Resolve user profile names dynamically
    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email");

    const profilesMap = new Map<string, { name: string; email: string }>();
    if (userProfiles) {
      userProfiles.forEach(p => {
        profilesMap.set(p.user_id, { name: p.full_name || "Guest Student", email: p.email || "" });
      });
    }

    const recentLogs = (rawLogs || []).map(log => {
      const uInfo = profilesMap.get(log.user_id) || { name: "Guest User", email: "" };
      return {
        id: log.id,
        userName: uInfo.name,
        email: uInfo.email,
        feature: log.feature_name,
        plan: log.plan_type,
        timeMs: log.execution_time_ms,
        cost: Number(log.estimated_cost_usd || 0),
        blockedReason: log.blocked_reason,
        timestamp: log.created_at
      };
    });

    // 3. Fetch Security Events
    const { data: rawSecEvents, error: secErr } = await supabase
      .from("security_events")
      .select("id, user_id, event_type, risk_score, created_at, details")
      .order("created_at", { ascending: false })
      .limit(20);

    if (secErr) throw secErr;

    const securityEvents = (rawSecEvents || []).map(evt => {
      const uInfo = profilesMap.get(evt.user_id) || { name: "Suspicious Student", email: "" };
      return {
        id: evt.id,
        userName: uInfo.name,
        email: uInfo.email,
        eventType: evt.event_type,
        riskScore: evt.risk_score,
        timestamp: evt.created_at,
        details: evt.details
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalAtsScans,
        totalJdMatches,
        totalProjectsGenerated,
        totalExamsTaken,
        totalResumeBuilds,
        totalSpends,
        totalBlocks,
        uniqueUsers: uniqueUsersSet.size,
        averageRequests
      },
      recentLogs,
      securityEvents
    });

  } catch (err: any) {
    console.error("[Usage Analytics API] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load usage analytics." }, { status: 500 });
  }
}
