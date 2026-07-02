import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Role validation check
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 2. Fetch recent ingestion logs
    const { data: logs, error } = await supabase
      .from("email_ingestion_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Diagnostics API] Supabase error:", error);
      throw error;
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalLogs: 0,
          parsingAccuracy: 100,
          geminiFallbackRate: 0,
          distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
          failedDetections: [],
          recentLogs: []
        }
      });
    }

    const totalLogs = logs.length;

    // Calculate parsing accuracy: percentage of logs that succeeded (processed = true)
    const successLogsCount = logs.filter(l => l.processed).length;
    const parsingAccuracy = totalLogs > 0 ? (successLogsCount / totalLogs) * 100 : 100;

    // Calculate fallback rate: percentage of logs parsed by Gemini
    const geminiLogsCount = logs.filter(l => l.provider_used === "gemini").length;
    const geminiFallbackRate = totalLogs > 0 ? (geminiLogsCount / totalLogs) * 100 : 0;

    // Calculate confidence distribution bands
    // Excellent (>= 90%), Good (80% - 89%), Fair (50% - 79%), Poor (< 50%)
    const distribution = {
      excellent: logs.filter(l => Number(l.confidence_score) >= 90).length,
      good: logs.filter(l => Number(l.confidence_score) >= 80 && Number(l.confidence_score) < 90).length,
      fair: logs.filter(l => Number(l.confidence_score) >= 50 && Number(l.confidence_score) < 80).length,
      poor: logs.filter(l => Number(l.confidence_score) < 50).length,
    };

    // Failed detections: logs that either have processed = false OR confidence < 80
    const failedDetections = logs.filter(l => !l.processed || Number(l.confidence_score) < 80);

    return NextResponse.json({
      success: true,
      data: {
        totalLogs,
        parsingAccuracy: Number(parsingAccuracy.toFixed(1)),
        geminiFallbackRate: Number(geminiFallbackRate.toFixed(1)),
        distribution,
        failedDetections: failedDetections.slice(0, 50), // Limit to 50 for performance
        recentLogs: logs.slice(0, 50)
      }
    });

  } catch (err: any) {
    console.error("[Admin Gmail Diagnostics GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
