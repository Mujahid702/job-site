import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ExecutionProvider } from "@/lib/compiler/ExecutionProvider";
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
    const { attemptId, questionId, code, language, timeSpent = 0 } = await req.json().catch(() => ({}));

    if (!attemptId || !questionId || !code || !language) {
      return NextResponse.json({ success: false, message: "Missing required parameters (attemptId, questionId, code, language)" }, { status: 400 });
    }

    // 2. Validate attempt and active session
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

    // 3. Retrieve question parameters and coding problem extensions
    const { data: question, error: qErr } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("id", questionId)
      .maybeSingle();

    if (qErr || !question) {
      return NextResponse.json({ success: false, message: "Question not found" }, { status: 404 });
    }

    const { data: codingProblem, error: cpErr } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("question_id", questionId)
      .maybeSingle();

    if (cpErr) throw cpErr;

    // 4. Retrieve test cases from database (falls back to sample cases)
    const { data: dbTestCases } = await supabase
      .from("assessment_test_cases")
      .select("*")
      .eq("question_id", questionId);

    let testCases = dbTestCases || [];
    if (testCases.length === 0 && codingProblem?.sample_test_cases && Array.isArray(codingProblem.sample_test_cases)) {
      testCases = codingProblem.sample_test_cases.map((tc: any, index: number) => ({
        id: `sample-${index}`,
        input: tc.input || "",
        expected_output: tc.expected_output || tc.output || "",
        is_hidden: false
      }));
    }

    if (testCases.length === 0) {
      testCases = [{ id: "mock-1", input: "", expected_output: "", is_hidden: false } as any];
    }

    let passedCount = 0;
    const totalCount = testCases.length;
    let maxTimeMs = 0;
    let maxMemoryKb = 0;
    let overallVerdict: string = "Accepted";

    for (const tc of testCases) {
      const runResult = await ExecutionProvider.execute({
        sourceCode: code,
        language,
        stdin: tc.input,
        expectedOutput: tc.expected_output,
        timeoutMs: codingProblem?.time_limit_ms || 5000
      });

      maxTimeMs = Math.max(maxTimeMs, runResult.timeMs);
      maxMemoryKb = Math.max(maxMemoryKb, runResult.memoryKb);

      if (runResult.status === "Accepted") {
        passedCount++;
      } else if (overallVerdict === "Accepted") {
        overallVerdict = runResult.status;
      }
    }

    // 5. Calculate scores via Centralized Scoring Engine
    const evalResult = ScoringEngine.evaluateCoding({
      passedCount,
      totalCount,
      marks: question.marks
    });

    const isCorrect = evalResult.isCorrect;
    const finalVerdict = isCorrect ? "Accepted" : overallVerdict;

    // 6. Log Coding Submission
    const { error: subErr } = await supabase
      .from("coding_submissions")
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        user_id: userId,
        code_content: code,
        language,
        status: finalVerdict,
        execution_time_ms: maxTimeMs,
        memory_used_kb: maxMemoryKb,
        passed_test_cases: passedCount,
        total_test_cases: totalCount
      });

    if (subErr) throw subErr;

    // 7. Upsert Attempt Answer
    const answerPayload = {
      attempt_id: attemptId,
      question_id: questionId,
      answer_text: code,
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
      passedCount,
      totalCount,
      scorePercentage: evalResult.scorePercentage,
      pointsEarned: evalResult.pointsEarned
    });

  } catch (err: any) {
    console.error("[Coding Submit POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to process coding solution" }, { status: 500 });
  }
}
