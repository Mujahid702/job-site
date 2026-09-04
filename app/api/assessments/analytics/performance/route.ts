import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsIntelligenceService } from "@/lib/services/analyticsIntelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized credentials required" }, { status: 401 });
    }

    const userId = user.id;

    // 2. Fetch Time series performance trends
    const { data: trends, error: trErr } = await supabase
      .from("assessment_performance")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(30); // Last 30 active days

    if (trErr) throw trErr;

    // 3. Compute Real-time Performance Intelligence Report
    const report = await AnalyticsIntelligenceService.getPerformanceReport(userId);

    return NextResponse.json({
      success: true,
      report,
      performanceTrends: trends || []
    });

  } catch (err: any) {
    console.error("[Performance Analytics GET] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load performance analytics" }, { status: 500 });
  }
}

