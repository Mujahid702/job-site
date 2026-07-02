import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    // 1. Fetch Email Trust Logs
    const { data: trustLogs, error: trustError } = await supabase
      .from("email_trust_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (trustError) {
      return NextResponse.json({ success: false, message: trustError.message }, { status: 500 });
    }

    // 2. Fetch Scam Detection Logs
    const { data: scamLogs, error: scamError } = await supabase
      .from("scam_detection_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (scamError) {
      return NextResponse.json({ success: false, message: scamError.message }, { status: 500 });
    }

    // 3. Compute Analytics
    const { data: allLogs } = await supabase
      .from("email_trust_logs")
      .select("decision, trust_score, classification");

    const analytics = {
      totalEmails: allLogs?.length || 0,
      decisionBreakdown: {
        verified: allLogs?.filter((l: any) => l.decision === "Verified Recruitment Email").length || 0,
        likely: allLogs?.filter((l: any) => l.decision === "Likely Recruitment Email").length || 0,
        suspicious: allLogs?.filter((l: any) => l.decision === "Suspicious").length || 0,
        scam: allLogs?.filter((l: any) => l.decision === "Potential Scam").length || 0,
      },
      averageScore: allLogs?.length
        ? Math.round(allLogs.reduce((sum: number, l: any) => sum + (l.trust_score || 0), 0) / allLogs.length)
        : 0
    };

    return NextResponse.json({
      success: true,
      trustLogs,
      scamLogs,
      analytics
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
