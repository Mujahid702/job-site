import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ success: false, message: "Missing type or id parameters" }, { status: 400 });
    }

    if (type === "template") {
      // Fetch Template Details
      const { data: template, error: tErr } = await supabase
        .from("assessment_templates")
        .select(`
          *,
          company_details:company_assessment_templates(*)
        `)
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();

      if (tErr || !template) {
        return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
      }

      // Fetch questions associated with this template via template_questions
      const { data: tempQuestions, error: tqErr } = await supabase
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
        .eq("template_id", id);

      if (tqErr) throw tqErr;

      return NextResponse.json({
        success: true,
        template,
        questions: tempQuestions?.map(tq => ({
          ...tq.question,
          points: tq.points
        })) || []
      });
    } 
    
    if (type === "topic") {
      // Fetch Topic and Subtopics
      const { data: topic, error: topErr } = await supabase
        .from("assessment_topics")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (topErr || !topic) {
        return NextResponse.json({ success: false, message: "Topic not found" }, { status: 404 });
      }

      const { data: subtopics } = await supabase
        .from("assessment_subtopics")
        .select("*")
        .eq("topic_id", id);

      const { data: questions } = await supabase
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
        .eq("topic_id", id)
        .eq("is_published", true);

      return NextResponse.json({
        success: true,
        topic,
        subtopics: subtopics || [],
        questions: questions || []
      });
    }

    return NextResponse.json({ success: false, message: "Invalid details request type" }, { status: 400 });

  } catch (err: any) {
    console.error("[Assessments Details GET] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load details" }, { status: 500 });
  }
}
