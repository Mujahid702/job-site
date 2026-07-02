import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveSessionNotes } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

// Retrieve session notes for a booking
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "Booking ID parameter is required" }, { status: 400 });
    }

    const { data: notes, error } = await supabase
      .from("mentor_session_notes")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      console.error("Error loading session notes:", error);
      return NextResponse.json({ success: false, message: "Failed to load session notes" }, { status: 400 });
    }

    return NextResponse.json({ success: true, notes });
  } catch (err: any) {
    console.error("GET /api/mentorship/notes error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

// Upload/Post session notes (Admin / Mentor)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, mentor_id, user_id, feedback, roadmap, resources, questions, improvement_areas } = body;

    if (!booking_id || !mentor_id || !user_id || !feedback) {
      return NextResponse.json({ success: false, message: "Missing required session notes details" }, { status: 400 });
    }

    const result = await saveSessionNotes({
      booking_id,
      mentor_id,
      user_id,
      feedback,
      roadmap: roadmap || {},
      resources: resources || [],
      questions: questions || [],
      improvement_areas: improvement_areas || ""
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to save session notes" }, { status: 400 });
    }

    // Set the booking as completed automatically since notes have been submitted!
    await supabase
      .from("mentor_bookings")
      .update({ status: "Completed" })
      .eq("id", booking_id);

    return NextResponse.json({ success: true, message: "Session notes registered successfully" });
  } catch (err: any) {
    console.error("POST /api/mentorship/notes error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
