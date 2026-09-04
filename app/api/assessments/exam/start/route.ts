import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsage, incrementUsage } from "@/lib/security/FeatureGuard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized credentials required" }, { status: 401 });
    }

    const userId = user.id;
    const { templateId } = await req.json().catch(() => ({}));

    if (!templateId) {
      return NextResponse.json({ success: false, message: "Missing templateId parameter" }, { status: 400 });
    }

    // 2. Fetch template details
    const { data: template, error: tErr } = await supabase
      .from("assessment_templates")
      .select(`
        *,
        company_details:company_assessment_templates(*)
      `)
      .eq("id", templateId)
      .eq("is_published", true)
      .maybeSingle();

    if (tErr || !template) {
      return NextResponse.json({ success: false, message: "Assessment template not found" }, { status: 404 });
    }

    // 3. Enforce monthly limits using FeatureGuard
    const checkResult = await checkUsage(userId, "exam_mode");
    if (!checkResult.allowed) {
      return NextResponse.json({
        success: false,
        message: "Free exam quota limit reached. Upgrade to Premium for unlimited assessment attempts."
      }, { status: 403 });
    }

    // 4. Retrieve template questions via template questions junction
    const { data: tQuestions, error: tqErr } = await supabase
      .from("assessment_template_questions")
      .select(`
        points,
        question:assessment_questions (
          id,
          question_text,
          difficulty,
          type,
          marks,
          negative_marks,
          options:assessment_options(id, option_text)
        )
      `)
      .eq("template_id", templateId);

    if (tqErr || !tQuestions || tQuestions.length === 0) {
      return NextResponse.json({ success: false, message: "No questions configured in this exam template" }, { status: 404 });
    }

    // Determine session type (Exam vs Company assessment)
    const sessionType = template.company_details ? "Company" : "Exam";

    // 5. Create Assessment Session
    const { data: session, error: sessErr } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id: userId,
        template_id: templateId,
        session_type: sessionType,
        status: "Active",
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessErr || !session) {
      throw sessErr || new Error("Failed to create assessment session record");
    }

    // 6. Create Attempt log
    const { data: attempt, error: attErr } = await supabase
      .from("assessment_attempts")
      .insert({
        session_id: session.id,
        user_id: userId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attErr || !attempt) {
      throw attErr || new Error("Failed to insert attempt tracking log");
    }

    const mappedQuestions = tQuestions.map(tq => ({
      ...tq.question,
      points: tq.points
    }));

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      attemptId: attempt.id,
      durationMinutes: template.duration_minutes,
      questions: mappedQuestions
    });

  } catch (err: any) {
    console.error("[Exam Start POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to launch exam" }, { status: 500 });
  }
}
