import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateResponse } from "@/lib/ai/router";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Verify user session
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "guest-user";

    const { questionId, code, language, submissionStatus } = await req.json();

    if (!questionId || !code || !language || !submissionStatus) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // 1. Fetch Question details for context
    const { data: qData, error: qError } = await supabase
      .from("assessment_questions")
      .select("question_text, constraints, correct_answer_text")
      .eq("id", questionId)
      .single();

    let questionText = "Coding / SQL practice problem set";
    let constraints = "Standard bounds";
    let referenceSolution = "";

    if (!qError && qData) {
      questionText = qData.question_text;
      constraints = qData.constraints || "Standard time/memory constraints.";
      referenceSolution = qData.correct_answer_text || "";
    }

    // 2. Build prompt
    const prompt = `
Question:
${questionText}

Constraints:
${constraints}

${referenceSolution ? `Reference Solution:\n${referenceSolution}\n` : ""}

Student's Submitted Code (Language: ${language}, Verdict Status: ${submissionStatus}):
\`\`\`${language}
${code}
\`\`\`
`;

    // 3. System guidelines
    const systemInstruction = `You are the AI Coding Coach. Analyze the student's submitted code for:
1. Correctness: Identify why it succeeded or where it failed (logical traps, indexing errors).
2. Code Quality: Review variable naming, structured modularity, and readable syntax.
3. Time & Space Complexity: Audit the Big-O complexities of their submitted code and suggest optimizations.
4. Alternative Logic: Provide a cleaner snippet or alternative approach if theirs is suboptimal.
5. Placement expectations: Explain what a top tech interviewer (e.g. Google, Amazon) would ask about this code.

Keep the review educational, concise, and structured with clear headers. Focus specifically on the student's script and guide them to understand the underlying patterns.`;

    // 4. Dispatch completion via gateway router (defaults to Gemini/Groq cascade failovers)
    const result = await generateResponse({
      prompt,
      systemInstruction,
      taskType: "ai_coding_coach",
      userId,
      temperature: 0.3
    });

    if (!result.success) {
      throw new Error(result.error || "AI Generation failed.");
    }

    // 5. Log telemetry event
    try {
      const { logAnalyticsEvent } = await import("@/lib/db/admin-analytics");
      await logAnalyticsEvent("ai_coding_coach_review", userId, {
        question_id: questionId,
        language,
        status: submissionStatus,
        model: result.model,
        provider: result.provider
      });
    } catch (dbErr) {
      console.warn("AI review analytics logging failed:", dbErr);
    }

    return NextResponse.json({
      success: true,
      feedback: result.text
    });
  } catch (err: any) {
    console.error("AI Coach API error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to generate AI feedback." }, { status: 500 });
  }
}
