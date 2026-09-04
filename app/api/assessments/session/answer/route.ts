import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScoringEngine } from "@/lib/services/scoringEngine";

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
    const { attemptId, questionId, selectedOptionId, answerText, timeSpent = 0 } = await req.json().catch(() => ({}));

    if (!attemptId || !questionId) {
      return NextResponse.json({ success: false, message: "Missing attemptId or questionId parameters" }, { status: 400 });
    }

    // 2. Validate attempt and session status
    const { data: attempt, error: attErr } = await supabase
      .from("assessment_attempts")
      .select(`
        *,
        session:assessment_sessions(*)
      `)
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attErr || !attempt) {
      return NextResponse.json({ success: false, message: "Assessment attempt not found" }, { status: 404 });
    }

    const session = attempt.session;
    if (!session || session.status !== "Active") {
      return NextResponse.json({ success: false, message: "Assessment session is no longer active" }, { status: 400 });
    }

    // Check timed exam constraints
    if (session.template_id) {
      const { data: template } = await supabase
        .from("assessment_templates")
        .select("duration_minutes")
        .eq("id", session.template_id)
        .maybeSingle();

      if (template) {
        const startMillis = new Date(session.started_at).getTime();
        const durationMillis = template.duration_minutes * 60 * 1000;
        if (Date.now() > startMillis + durationMillis) {
          // Timer expired
          await supabase
            .from("assessment_sessions")
            .update({ status: "Abandoned", completed_at: new Date().toISOString() })
            .eq("id", session.id);
          return NextResponse.json({ success: false, message: "Time limit expired. Session aborted." }, { status: 400 });
        }
      }
    }

    // 3. Retrieve question options for MCQ validation
    const { data: question, error: qErr } = await supabase
      .from("assessment_questions")
      .select(`
        *,
        options:assessment_options(*)
      `)
      .eq("id", questionId)
      .maybeSingle();

    if (qErr || !question) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    let isCorrect = false;
    let pointsEarned = 0;
    let scorePercentage = 0;

    if (question.type === "MCQ") {
      if (!selectedOptionId) {
        return NextResponse.json({ success: false, message: "selectedOptionId is required for MCQ questions" }, { status: 400 });
      }

      const evalResult = ScoringEngine.evaluateMCQ({
        selectedOptionId,
        options: question.options || [],
        marks: question.marks,
        negativeMarks: question.negative_marks
      });

      isCorrect = evalResult.isCorrect;
      pointsEarned = evalResult.pointsEarned;
      scorePercentage = evalResult.scorePercentage;
    } else {
      // General text-matching validation (fallback for simple QA input)
      isCorrect = (answerText || "").trim().toLowerCase() === (question.correct_answer_text || "").trim().toLowerCase();
      pointsEarned = isCorrect ? question.marks : 0;
      scorePercentage = isCorrect ? 100 : 0;
    }

    // 4. Save/Upsert answer record
    const answerPayload = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: selectedOptionId || null,
      answer_text: answerText || null,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent
    };

    const { data: existingAnswer } = await supabase
      .from("assessment_answers")
      .select("id")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (existingAnswer) {
      const { error: updErr } = await supabase
        .from("assessment_answers")
        .update(answerPayload)
        .eq("id", existingAnswer.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from("assessment_answers")
        .insert(answerPayload);
      if (insErr) throw insErr;
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      scorePercentage,
      pointsEarned
    });

  } catch (err: any) {
    console.error("[Session Answer POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to submit answer" }, { status: 500 });
  }
}
