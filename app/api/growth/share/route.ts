import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";
import { recordStreakActivity } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { shareType, shareTarget, metadata } = body;

    if (!shareType) {
      return NextResponse.json({ success: false, message: "shareType is required." }, { status: 400 });
    }

    // 1. Log growth analytics event
    await logAnalyticsEvent("whatsapp_share", user.id, {
      shareType,
      shareTarget: shareTarget || "unknown",
      ...metadata
    });

    // 2. Increment user streaks activity
    const nextStreak = await recordStreakActivity(user.id, `whatsapp_share:${shareType}`);

    return NextResponse.json({
      success: true,
      message: "Share logged successfully.",
      currentStreak: nextStreak
    });
  } catch (err: any) {
    console.error("API growth share POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error logging share event" }, { status: 500 });
  }
}
