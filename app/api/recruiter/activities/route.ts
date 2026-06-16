import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterActivities, createRecruiterActivity } from "@/lib/db/recruiters";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get("recruiterId");

    if (!recruiterId) {
      return NextResponse.json({ success: false, message: "recruiterId parameter is required." }, { status: 400 });
    }

    const activities = await getRecruiterActivities(recruiterId, user.id);
    return NextResponse.json({ success: true, activities });
  } catch (err: any) {
    console.error("API activities GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching activities" }, { status: 500 });
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
    const { recruiterId, activityType, notes } = body;

    if (!recruiterId || !activityType) {
      return NextResponse.json({ success: false, message: "recruiterId and activityType are required." }, { status: 400 });
    }

    const result = await createRecruiterActivity(recruiterId, user.id, activityType, notes);

    if (result.success) {
      return NextResponse.json({ success: true, activity: result.data });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to create activity" }, { status: 500 });
  } catch (err: any) {
    console.error("API activities POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error creating activity" }, { status: 500 });
  }
}
