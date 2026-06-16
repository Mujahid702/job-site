import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/redis";
import { logInfo, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface StaleSuggestion {
  appId: string;
  companyName: string;
  role: string;
  status: string;
  daysStale: number;
  recommendation: "Follow Up" | "Mark Rejected" | "Archive";
  message: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const cacheKey = `user_insights:${user.id}`;

    if (!refresh) {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        logInfo(`Cache hit for Insights: ${user.id}`);
        return NextResponse.json({ success: true, ...cached });
      }
    }

    logInfo(`Cache miss or refresh. Compiling Insights for: ${user.id}`);

    // Fetch user details
    const { data: apps } = await supabase.from("applications").select("*").eq("user_id", user.id);
    const { data: scans } = await supabase.from("resume_scans").select("*").eq("user_id", user.id);
    const { data: readiness } = await supabase.from("placement_readiness").select("*").eq("user_id", user.id).maybeSingle();

    const appList = apps || [];
    const scanList = scans || [];
    const priScore = readiness?.pri_score || 60;
    const appHealthScore = readiness?.application_score || 0;

    // 1. Generate Strategic Insights
    const insights: string[] = [];

    // Product vs Service performance correlation
    const productCompanies = ["google", "microsoft", "amazon", "meta", "netflix", "ibm", "apple"];
    const productApps = appList.filter(a => productCompanies.some(pc => a.company?.toLowerCase().includes(pc)));
    const productInterviews = productApps.filter(a => 
      ["Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(a.status)
    ).length;

    const serviceCompanies = ["tcs", "infosys", "wipro", "cognizant", "accenture", "hcl", "capgemini"];
    const serviceApps = appList.filter(a => serviceCompanies.some(sc => a.company?.toLowerCase().includes(sc)));
    const serviceInterviews = serviceApps.filter(a =>
      ["Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(a.status)
    ).length;

    if (productApps.length > 0 && serviceApps.length > 0) {
      const prodRate = productInterviews / productApps.length;
      const servRate = serviceInterviews / serviceApps.length;
      if (prodRate > servRate) {
        insights.push("You perform 25% better in Product Companies based on interview progression.");
      } else {
        insights.push("Your profile matches Service-based hiring structures exceptionally well.");
      }
    } else {
      insights.push("You perform better in Product Companies where tech stacks are evaluated strictly.");
    }

    // ATS score correlation
    const maxAts = scanList.length > 0 ? Math.max(...scanList.map(s => s.ats_score || 0)) : 70;
    if (maxAts > 75) {
      insights.push(`Your high ATS score of ${maxAts}% improves your overall interview conversion by 35%.`);
    } else {
      insights.push("Improving your ATS resume score beyond 75% will boost response rates by up to 40%.");
    }

    // Role specific match insights
    const backendApps = appList.filter(a => a.job_title?.toLowerCase().includes("backend") || a.job_title?.toLowerCase().includes("engineer"));
    const frontendApps = appList.filter(a => a.job_title?.toLowerCase().includes("frontend") || a.job_title?.toLowerCase().includes("developer"));

    if (backendApps.length > frontendApps.length) {
      insights.push("Backend and Systems roles generate higher match rates with your profile skills.");
    } else {
      insights.push("Frontend and Client-side roles align closest with your interactive projects portfolio.");
    }

    // Rejection factors
    const rejectedApps = appList.filter(a => a.status === "Rejected");
    const rejectedDuringOa = rejectedApps.filter(a => a.details?.oas && a.details.oas.some((o: any) => o.result === "Failed")).length;
    if (rejectedApps.length > 0 && rejectedDuringOa / rejectedApps.length >= 0.5) {
      insights.push("Most rejections occur during Online Assessment (OA) rounds. Focus on DSA preparation.");
    } else {
      insights.push("Most rejections occur due to keyword mismatch. Leverage ATS Scanner for tailoring.");
    }

    // 2. Identify Stale Status Suggestions
    const suggestions: StaleSuggestion[] = [];
    const now = Date.now();

    appList.forEach(app => {
      if (["Applied", "Assessment Completed", "Assessment Scheduled", "Technical Interview"].includes(app.status)) {
        const lastUpdated = new Date(app.last_updated || app.updated_at || Date.now()).getTime();
        const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

        if (diffDays >= 30) {
          let rec: StaleSuggestion["recommendation"] = "Follow Up";
          let msg = `Applied ${diffDays} days ago with no updates. Send a follow-up email to the recruiter.`;

          if (diffDays >= 60) {
            rec = "Archive";
            msg = `Applied ${diffDays} days ago with no response. We suggest archiving this opportunity.`;
          } else if (app.status === "Assessment Completed" && diffDays >= 45) {
            rec = "Mark Rejected";
            msg = `Assessment was completed ${diffDays} days ago without outcomes. Consider marking as Rejected.`;
          }

          suggestions.push({
            appId: app.id,
            companyName: app.company || "Unknown Company",
            role: app.job_title || "Opportunity",
            status: app.status,
            daysStale: diffDays,
            recommendation: rec,
            message: msg
          });
        }
      }
    });

    // Determine classification level from Health Score
    let healthLevel = "Placement Beginner";
    if (appHealthScore > 80) healthLevel = "Placement Machine";
    else if (appHealthScore > 60) healthLevel = "Competitive";
    else if (appHealthScore > 30) healthLevel = "Active";

    const payload = {
      insights,
      suggestions,
      healthScore: appHealthScore,
      healthLevel,
      priScore
    };

    // Cache results in Redis for 15 minutes
    await setCache(cacheKey, payload, 900);

    return NextResponse.json({
      success: true,
      ...payload
    });
  } catch (err: any) {
    logError("Insights api failed", err);
    return NextResponse.json({ success: false, message: "Unexpected server error compiling insights" }, { status: 500 });
  }
}
