import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ExecutionProvider } from "@/lib/compiler/ExecutionProvider";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { questionId, language, code, customInput } = await req.json();

    if (!questionId || !language || !code) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // 1. Handle Custom Input Execution
    if (customInput !== undefined) {
      const result = await ExecutionProvider.execute({
        sourceCode: code,
        language,
        stdin: customInput,
        timeoutMs: 5000
      });
      return NextResponse.json({ success: true, isCustom: true, result });
    }

    // 2. Fetch Visible Test Cases from DB
    const { data: testCases, error: tcError } = await supabase
      .from("assessment_test_cases")
      .select("*")
      .eq("question_id", questionId)
      .eq("is_hidden", false);

    if (tcError) throw tcError;

    // 3. Fallback: If no DB seeded test cases, check sample_test_cases column
    let visibleCases = testCases || [];
    if (visibleCases.length === 0) {
      const { data: qData } = await supabase
        .from("assessment_questions")
        .select("sample_test_cases")
        .eq("id", questionId)
        .single();
      
      if (qData?.sample_test_cases && Array.isArray(qData.sample_test_cases)) {
        visibleCases = qData.sample_test_cases.map((tc: any, idx: number) => ({
          id: `sample-${idx}`,
          input: tc.input || "",
          expected_output: tc.expected_output || tc.output || ""
        }));
      }
    }

    // If still no test cases, return simulated basic run success
    if (visibleCases.length === 0) {
      visibleCases = [{ id: "mock-1", input: "", expected_output: "" }];
    }

    // 4. Run execution driver sequentially for visible cases
    const results = [];
    for (const tc of visibleCases) {
      const run = await ExecutionProvider.execute({
        sourceCode: code,
        language,
        stdin: tc.input,
        expectedOutput: tc.expected_output,
        timeoutMs: 5000
      });
      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.expected_output,
        actual: run.stdout,
        status: run.status,
        timeMs: run.timeMs,
        memoryKb: run.memoryKb,
        error: run.stderr
      });
    }

    return NextResponse.json({
      success: true,
      isCustom: false,
      results
    });
  } catch (err: any) {
    console.error("Run code endpoint error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to execute code." }, { status: 500 });
  }
}
