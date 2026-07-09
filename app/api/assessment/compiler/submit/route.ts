import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ExecutionProvider } from "@/lib/compiler/ExecutionProvider";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get user authentication context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "guest-user";

    const { questionId, language, code, attemptId } = await req.json();

    if (!questionId || !language || !code) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // 1. Fetch All Test Cases from DB
    const { data: testCases, error: tcError } = await supabase
      .from("assessment_test_cases")
      .select("*")
      .eq("question_id", questionId);

    if (tcError) throw tcError;

    // 2. Fetch expected sample fallback if DB is empty
    let allCases = testCases || [];
    if (allCases.length === 0) {
      const { data: qData } = await supabase
        .from("assessment_questions")
        .select("sample_test_cases, difficulty")
        .eq("id", questionId)
        .single();
      
      if (qData?.sample_test_cases && Array.isArray(qData.sample_test_cases)) {
        allCases = qData.sample_test_cases.map((tc: any, idx: number) => ({
          id: `sample-${idx}`,
          input: tc.input || "",
          expected_output: tc.expected_output || tc.output || "",
          is_hidden: false
        }));
      }
    }

    // If still empty, supply mock test cases
    if (allCases.length === 0) {
      allCases = [
        { id: "mock-1", input: "", expected_output: "", is_hidden: false },
        { id: "mock-2", input: "1", expected_output: "1", is_hidden: true }
      ];
    }

    // Fetch question difficulty to calculate XP
    const { data: question } = await supabase
      .from("assessment_questions")
      .select("difficulty, marks")
      .eq("id", questionId)
      .maybeSingle();

    const difficulty = question?.difficulty || "Medium";
    const baseMarks = question?.marks || 4;

    // 3. Run execution sequentially against all test cases
    let passedCount = 0;
    const results = [];
    let overallStatus: any = "Accepted";
    let maxTimeMs = 0;
    let maxMemoryKb = 0;

    for (const tc of allCases) {
      const run = await ExecutionProvider.execute({
        sourceCode: code,
        language,
        stdin: tc.input,
        expectedOutput: tc.expected_output,
        timeoutMs: 5000
      });

      const passed = run.status === "Accepted";
      if (passed) {
        passedCount++;
      } else if (overallStatus === "Accepted") {
        // Log first failure status as overall submission status
        overallStatus = run.status;
      }

      if (run.timeMs > maxTimeMs) maxTimeMs = run.timeMs;
      if (run.memoryKb > maxMemoryKb) maxMemoryKb = run.memoryKb;

      results.push({
        testCaseId: tc.id,
        isHidden: tc.is_hidden,
        passed,
        status: run.status,
        timeMs: run.timeMs,
        memoryKb: run.memoryKb,
        error: run.stderr
      });
    }

    // Calculate XP reward
    let xpGained = 0;
    if (overallStatus === "Accepted") {
      xpGained = difficulty === "Easy" ? 20 : difficulty === "Medium" ? 50 : 100;
    }

    // 4. Save to Submissions log
    const submissionPayload = {
      user_id: userId,
      question_id: questionId,
      attempt_id: attemptId || null,
      language,
      code_content: code,
      status: overallStatus,
      execution_time_ms: maxTimeMs,
      memory_used_kb: maxMemoryKb,
      passed_test_cases: passedCount,
      total_test_cases: allCases.length
    };

    const { error: subError } = await supabase
      .from("assessment_submissions")
      .insert(submissionPayload);

    if (subError) {
      console.error("Failed to log submission:", subError);
    }

    // 5. Update user XP ledger & Daily Streak (if user authenticated and success)
    if (userId !== "guest-user" && overallStatus === "Accepted") {
      try {
        // Update XP
        const { data: xpRecord } = await supabase
          .from("user_xp")
          .select("total_xp")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (xpRecord) {
          const newXp = (xpRecord.total_xp || 0) + xpGained;
          const { calculateLevel } = await import("@/lib/db/missions");
          const newLevel = calculateLevel(newXp);
          
          await supabase
            .from("user_xp")
            .update({
              total_xp: newXp,
              current_level: newLevel,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
          
          const { addLedgerEntry } = await import("@/lib/db/ledger");
          await addLedgerEntry(userId, `Completed Coding Question`, xpGained, 0, null, supabase);
        }

        // Update Daily Streak
        await updateStreak(userId, supabase);
      } catch (streakErr) {
        console.error("Streak/XP updates failed:", streakErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: overallStatus,
      passedCount,
      totalCount: allCases.length,
      maxTimeMs,
      maxMemoryKb,
      xpGained,
      results
    });
  } catch (err: any) {
    console.error("Submit code API error:", err);
    return NextResponse.json({ success: false, message: err.message || "Submission failed." }, { status: 500 });
  }
}

/**
 * Update daily solving streak sequence
 */
async function updateStreak(userId: string, supabase: any) {
  const today = new Date().toISOString().split("T")[0];

  const { data: streak } = await supabase
    .from("assessment_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streak) {
    await supabase.from("assessment_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_solved_date: today
    });
  } else {
    const lastSolved = streak.last_solved_date;
    if (lastSolved === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let current = streak.current_streak;
    let longest = streak.longest_streak;

    if (lastSolved === yesterdayStr) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }

    await supabase
      .from("assessment_streaks")
      .update({
        current_streak: current,
        longest_streak: longest,
        last_solved_date: today
      })
      .eq("user_id", userId);
  }
}
