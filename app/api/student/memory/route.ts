import { NextResponse } from "next/server";
import { getStudentMemories, deleteStudentMemory, resetStudentPersonalization } from "@/lib/ai/memory";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Retrieve all active memories for the logged in user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const list = await getStudentMemories(user.id);
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("[Student Memory API GET] Error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Internal server error." }, { status: 500 });
  }
}

// DELETE: Delete a specific memory node
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Memory Node ID is required." }, { status: 400 });
    }

    const success = await deleteStudentMemory(user.id, id);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("[Student Memory API DELETE] Error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Internal server error." }, { status: 500 });
  }
}

// POST: Reset entire personalization index
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const success = await resetStudentPersonalization(user.id);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("[Student Memory API POST] Error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Internal server error." }, { status: 500 });
  }
}
