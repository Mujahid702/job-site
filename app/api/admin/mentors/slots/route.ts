import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { getMentorSlots, addMentorSlot, deleteMentorSlot } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentorId");
    const date = searchParams.get("date") || undefined;

    if (!mentorId) {
      return NextResponse.json({ success: false, message: "Mentor ID parameter is required" }, { status: 400 });
    }

    const slots = await getMentorSlots(mentorId, date);
    return NextResponse.json({ success: true, slots });
  } catch (err: any) {
    console.error("GET /api/admin/mentors/slots error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { mentor_id, slot_date, slot_time } = body;

    if (!mentor_id || !slot_date || !slot_time) {
      return NextResponse.json({ success: false, message: "Mentor ID, Date, and Time are required fields" }, { status: 400 });
    }

    const result = await addMentorSlot({
      mentor_id,
      slot_date,
      slot_time
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to create slot (duplicate slot may exist)" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Availability slot created successfully" });
  } catch (err: any) {
    console.error("POST /api/admin/mentors/slots error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json({ success: false, message: "Slot ID parameter is required" }, { status: 400 });
    }

    const result = await deleteMentorSlot(slotId);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to delete slot" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Availability slot deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/mentors/slots error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
