import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCommunityEvents, registerForEvent } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await getCommunityEvents(user.id, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to fetch events." }, { status: 500 });
    }

    return NextResponse.json({ success: true, events: result.events });
  } catch (err: any) {
    console.error("API growth events GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { eventId, status } = body; // status can be "Registered" | "Bookmarked" | "Unregistered"

    if (!eventId || !status) {
      return NextResponse.json({ success: false, message: "eventId and status are required." }, { status: 400 });
    }

    const result = await registerForEvent(user.id, eventId, status, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to update registration." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Event registration updated." });
  } catch (err: any) {
    console.error("API growth events POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error registering for event" }, { status: 500 });
  }
}
