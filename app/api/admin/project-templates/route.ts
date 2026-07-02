import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 1. Fetch all templates
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("project_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load project templates." }, { status: 500 });
  }
}

// 2. Insert or update template (Admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      id,
      title,
      role,
      difficulty,
      tech,
      summary,
      recommended_stack,
      architecture,
      learning_outcomes,
      recruiter_value,
      is_featured,
      is_trending,
      is_beginner_friendly,
      is_high_demand,
      version
    } = body;

    if (!title || !role || !difficulty || !tech || !summary || !recommended_stack || !architecture) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const payload = {
      title,
      role,
      difficulty,
      tech: Array.isArray(tech) ? tech : tech.split(",").map((s: string) => s.trim()).filter(Boolean),
      summary,
      recommended_stack,
      architecture,
      learning_outcomes: Array.isArray(learning_outcomes) ? learning_outcomes : (learning_outcomes || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      recruiter_value: recruiter_value || "",
      is_featured: !!is_featured,
      is_trending: !!is_trending,
      is_beginner_friendly: !!is_beginner_friendly,
      is_high_demand: !!is_high_demand,
      version: version ? Number(version) : 1
    };

    let result;
    if (id) {
      result = await supabase
        .from("project_templates")
        .update(payload)
        .eq("id", id);
    } else {
      result = await supabase
        .from("project_templates")
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true, message: "Project template saved successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save project template." }, { status: 500 });
  }
}

// 3. Delete template (Admin only)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project Template ID parameter is missing." }, { status: 400 });
    }

    const { error } = await supabase
      .from("project_templates")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Project template deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete project template." }, { status: 500 });
  }
}
