import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { getMentorById, updateMentor, deleteMentor } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;
    const mentor = await getMentorById(id);

    if (!mentor) {
      return NextResponse.json({ success: false, message: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, mentor });
  } catch (err: any) {
    console.error("GET /api/admin/mentors/[id] error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = await updateMentor(id, body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to update mentor profile" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mentor profile updated successfully" });
  } catch (err: any) {
    console.error("PUT /api/admin/mentors/[id] error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;
    const result = await deleteMentor(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to delete mentor profile" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mentor profile deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/mentors/[id] error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
