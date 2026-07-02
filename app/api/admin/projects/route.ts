import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCompany, deleteCompany, getProjectCompanies } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getProjectCompanies();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load companies." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, name, priority_skills, focus, description } = body;

    if (!name || !priority_skills || !focus || !description) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const result = await saveCompany({ id, name, priority_skills, focus, description }, supabase);
    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true, message: "Company saved successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save company." }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Company ID parameter is missing." }, { status: 400 });
    }

    const result = await deleteCompany(id, supabase);
    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true, message: "Company deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete company." }, { status: 500 });
  }
}
