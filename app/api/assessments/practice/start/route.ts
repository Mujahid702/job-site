import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { topicId, difficulty, limit = 5 } = await req.json().catch(() => ({}));

    if (!topicId) {
      return NextResponse.json({ success: false, message: "Missing topicId parameter" }, { status: 400 });
    }

    // 2. Fetch matching questions
    let query = supabase
      .from("assessment_questions")
      .select(`
        id,
        question_text,
        difficulty,
        type,
        marks,
        negative_marks,
        options:assessment_options(id, option_text)
      `)
      .eq("topic_id", topicId)
      .eq("is_published", true);

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    const { data: questions, error: qErr } = await query;
    if (qErr) throw qErr;

    if (!questions || questions.length === 0) {
      return NextResponse.json({ success: false, message: "No published questions found matching topic filter" }, { status: 404 });
    }

    // Shuffle and slice questions
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const finalQuestions = shuffled.slice(0, limit);

    // 3. Create Assessment Session in DB
    const { data: session, error: sessErr } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id: userId,
        session_type: "Practice",
        status: "Active",
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessErr || !session) {
      throw sessErr || new Error("Failed to insert assessment session record");
    }

    // 4. Create initial Attempt within session
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
      throw attErr || new Error("Failed to create session attempt log");
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      attemptId: attempt.id,
      questions: finalQuestions
    });

  } catch (err: any) {
    console.error("[Practice Start POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to start practice" }, { status: 500 });
  }
}
