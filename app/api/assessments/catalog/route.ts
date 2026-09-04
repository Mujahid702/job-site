import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized credentials required" }, { status: 401 });
    }

    // 2. Query published content catalog
    const { data: categories } = await supabase
      .from("assessment_categories")
      .select("*")
      .order("name", { ascending: true });

    const { data: topics } = await supabase
      .from("assessment_topics")
      .select("*")
      .order("name", { ascending: true });

    const { data: subtopics } = await supabase
      .from("assessment_subtopics")
      .select("*")
      .order("name", { ascending: true });

    const { data: templates } = await supabase
      .from("assessment_templates")
      .select(`
        *,
        company_details:company_assessment_templates(*)
      `)
      .eq("is_published", true)
      .order("title", { ascending: true });

    return NextResponse.json({
      success: true,
      categories: categories || [],
      topics: topics || [],
      subtopics: subtopics || [],
      templates: templates || []
    });

  } catch (err: any) {
    console.error("[Assessments Catalog GET] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to load catalog" }, { status: 500 });
  }
}
