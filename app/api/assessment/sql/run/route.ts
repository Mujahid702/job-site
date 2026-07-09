import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SqlSandbox } from "@/lib/compiler/SqlSandbox";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { questionId, query } = await req.json();

    if (!questionId || !query) {
      return NextResponse.json({ success: false, message: "Missing questionId or query." }, { status: 400 });
    }

    // 1. Fetch Question details (mock seed schema and official answer query)
    const { data: qData, error: qError } = await supabase
      .from("assessment_questions")
      .select("sql_schema_seed, correct_answer_text, difficulty")
      .eq("id", questionId)
      .single();

    if (qError || !qData) {
      return NextResponse.json({ success: false, message: "Question not found." }, { status: 404 });
    }

    // 2. Execute SQL query sandbox comparison
    const result = await SqlSandbox.execute(
      qData.sql_schema_seed || "",
      query,
      qData.correct_answer_text
    );

    // 3. Save to submissions log (if authenticated user)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "guest-user";

    if (userId !== "guest-user") {
      try {
        await supabase
          .from("assessment_submissions")
          .insert({
            user_id: userId,
            question_id: questionId,
            language: "sql",
            code_content: query,
            status: result.match ? "Accepted" : "Wrong Answer",
            execution_time_ms: 10,
            memory_used_kb: 4000,
            passed_test_cases: result.match ? 1 : 0,
            total_test_cases: 1
          });
      } catch (err) {
        console.error("Failed to log SQL submission:", err);
      }
    }

    return NextResponse.json({
      success: true,
      match: result.match,
      error: result.error,
      columns: result.columns || [],
      rows: result.rows || [],
      expectedColumns: result.expectedColumns || [],
      expectedRows: result.expectedRows || []
    });
  } catch (err: any) {
    console.error("SQL Run API error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to execute query." }, { status: 500 });
  }
}
