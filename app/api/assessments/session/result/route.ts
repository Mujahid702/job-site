import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ResultIntelligenceService } from "@/lib/services/resultIntelligence";

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
    const attemptId = searchParams.get("attemptId");

    if (!attemptId) {
      return NextResponse.json({ success: false, message: "Missing attemptId parameter" }, { status: 400 });
    }

    // 2. Fetch score record ensuring owner isolation
    const { data: score, error: scoreErr } = await supabase
      .from("assessment_scores")
      .select(`
        *,
        attempt:assessment_attempts (
          id,
          started_at,
          completed_at,
          session:assessment_sessions (
            id,
            session_type,
            template:assessment_templates (
              id,
              title
            )
          )
        )
      `)
      .eq("attempt_id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (scoreErr || !score) {
      return NextResponse.json({ success: false, message: "Score details not found" }, { status: 404 });
    }

    // 3. Fetch answered questions detail logs
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select(`
        id,
        is_correct,
        time_spent_seconds,
        selected_option_id,
        answer_text,
        question:assessment_questions (
          id,
          question_text,
          difficulty,
          type,
          marks
        )
      `)
      .eq("attempt_id", attemptId);

    // 4. Generate Calculated Result Intelligence Report
    const report = await ResultIntelligenceService.getResultReport(attemptId, user.id);

    return NextResponse.json({
      success: true,
      score: {
        id: score.id,
        attemptId: score.attempt_id,
        totalQuestions: score.total_questions,
        correctAnswers: score.correct_answers,
        scorePercentage: score.score_percentage,
        passed: score.passed,
        createdAt: score.created_at
      },
      attempt: score.attempt,
      answers: answers || [],
      report
    });

  } catch (err: any) {
    console.error("[Session Result GET] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load attempt result details" }, { status: 500 });
  }
}

