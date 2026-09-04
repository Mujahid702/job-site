import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized credentials required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, message: "Missing sessionId parameter" }, { status: 400 });
    }

    // 2. Fetch session details ensuring owner isolation
    const { data: session, error: sessErr } = await supabase
      .from("assessment_sessions")
      .select(`
        *,
        template:assessment_templates(*)
      `)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessErr || !session) {
      return NextResponse.json({ success: false, message: "Assessment session not found" }, { status: 404 });
    }

    // Fetch attempts count
    const { count: attemptsCount } = await supabase
      .from("assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionType: session.session_type,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        scorePercentage: session.score_percentage,
        passed: session.passed,
        template: session.template,
        attemptsCount: attemptsCount || 0
      }
    });

  } catch (err: any) {
    console.error("[Session GET] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load session details" }, { status: 500 });
  }
}
