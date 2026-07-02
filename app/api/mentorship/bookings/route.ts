import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMentorBookings, bookSession, updateBooking } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

// Load bookings for current student
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const bookings = await getMentorBookings(user.id);
    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    console.error("GET /api/mentorship/bookings error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

// Book a session
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await request.json();
    const { mentor_id, mentor_name, session_type, booking_date, booking_time, price_paid, payment_method, notes } = body;

    if (!mentor_id || !mentor_name || !session_type || !booking_date || !booking_time) {
      return NextResponse.json({ success: false, message: "Missing required booking details" }, { status: 400 });
    }

    const result = await bookSession(user.id, {
      mentor_id,
      mentor_name,
      session_type,
      booking_date,
      booking_time,
      price_paid: Number(price_paid || 0),
      payment_method: payment_method || "Free Access",
      notes
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to log booking session" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Booking registered successfully" });
  } catch (err: any) {
    console.error("POST /api/mentorship/bookings error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

// Reschedule or Cancel booking
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, status, booking_date, booking_time, notes } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "Booking ID is required" }, { status: 400 });
    }

    const result = await updateBooking(user.id, bookingId, {
      status,
      booking_date,
      booking_time,
      notes
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to update booking" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Booking updated successfully" });
  } catch (err: any) {
    console.error("PUT /api/mentorship/bookings error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
