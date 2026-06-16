import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterFollowups, createRecruiterFollowup, completeRecruiterFollowup } from "@/lib/db/recruiters";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const completedParam = searchParams.get("completed");
    const completed = completedParam !== null ? completedParam === "true" : undefined;

    const followups = await getRecruiterFollowups(user.id, completed);
    return NextResponse.json({ success: true, followups });
  } catch (err: any) {
    console.error("API followups GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching followups" }, { status: 500 });
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
    const { recruiterId, followupDate, message, priority, reminder } = body;

    if (!recruiterId || !followupDate) {
      return NextResponse.json({ success: false, message: "recruiterId and followupDate are required." }, { status: 400 });
    }

    const result = await createRecruiterFollowup(user.id, {
      recruiter_id: recruiterId,
      followup_date: followupDate,
      message,
      priority,
      reminder
    });

    if (result.success && result.data) {
      // Log event
      await logAnalyticsEvent("followup_created", user.id, {
        followupId: result.data.id,
        recruiterId,
        priority
      });

      return NextResponse.json({ success: true, followup: result.data });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to create followup" }, { status: 500 });
  } catch (err: any) {
    console.error("API followups POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error creating followup" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { followupId } = body;

    if (!followupId) {
      return NextResponse.json({ success: false, message: "followupId is required." }, { status: 400 });
    }

    const result = await completeRecruiterFollowup(followupId, user.id);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Follow-up marked as completed." });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to complete followup" }, { status: 500 });
  } catch (err: any) {
    console.error("API followups PATCH failed:", err);
    return NextResponse.json({ success: false, message: "Server error updating followup" }, { status: 500 });
  }
}
