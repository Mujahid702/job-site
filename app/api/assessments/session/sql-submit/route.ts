import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SqlSandbox } from "@/lib/compiler/SqlSandbox";
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
    const { attemptId, questionId, query, timeSpent = 0 } = await req.json().catch(() => ({}));

    if (!attemptId || !questionId || !query) {
      return NextResponse.json({ success: false, message: "Missing required parameters (attemptId, questionId, query)" }, { status: 400 });
    }

    // 2. Validate attempt and active session status
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

    // Check timer expiration
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
          await supabase
            .from("assessment_sessions")
            .update({ status: "Abandoned", completed_at: new Date().toISOString() })
            .eq("id", session.id);
          return NextResponse.json({ success: false, message: "Time limit expired. Session aborted." }, { status: 400 });
        }
      }
    }

    // 3. Retrieve question parameters and SQL problem extension fields
    const { data: question, error: qErr } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("id", questionId)
      .maybeSingle();

    if (qErr || !question) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    const { data: sqlProblem, error: spErr } = await supabase
      .from("sql_problems")
      .select("*")
      .eq("question_id", questionId)
      .maybeSingle();

    if (spErr || !sqlProblem) {
      return NextResponse.json({ success: false, message: "SQL problem parameters not found" }, { status: 404 });
    }

    // 4. Run SQLite WASM Sandbox evaluation
    const runResult = await SqlSandbox.execute(
      sqlProblem.sql_schema_seed || "",
      query,
      sqlProblem.correct_query
    );

    // 5. Calculate score using Centralized Scoring Engine
    const evalResult = ScoringEngine.evaluateSQL({
      match: runResult.match,
      marks: question.marks
    });

    const isCorrect = evalResult.isCorrect;
    const finalVerdict = isCorrect ? "Accepted" : runResult.error ? "Compile Error" : "Wrong Answer";

    // 6. Log SQL Submission
    const { error: subErr } = await supabase
      .from("sql_submissions")
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        user_id: userId,
        submitted_query: query,
        status: finalVerdict
      });

    if (subErr) throw subErr;

    // 7. Upsert Attempt Answer
    const answerPayload = {
      attempt_id: attemptId,
      question_id: questionId,
      answer_text: query,
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
      status: finalVerdict,
      isCorrect,
      scorePercentage: evalResult.scorePercentage,
      pointsEarned: evalResult.pointsEarned,
      sandboxOutput: runResult
    });

  } catch (err: any) {
    console.error("[SQL Submit POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to execute SQL query" }, { status: 500 });
  }
}
