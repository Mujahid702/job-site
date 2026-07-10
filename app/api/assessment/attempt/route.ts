import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsage, incrementUsage } from "@/lib/security/FeatureGuard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const { action } = await req.json().catch(() => ({}));

    if (!action || !["check", "start"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action parameter" }, { status: 400 });
    }

    const quota = await checkUsage(userId, "exam_mode");

    if (action === "check") {
      return NextResponse.json({
        success: true,
        allowed: quota.allowed,
        remaining: quota.remaining,
        limit: quota.limit,
        resetDate: quota.resetDate
      });
    }

    // action === "start"
    if (!quota.allowed) {
      return NextResponse.json({
        success: false,
        message: "Monthly Free Limit Reached. Upgrade to Premium to continue immediately.",
        quotaExhausted: true,
        remaining: 0,
        limit: quota.limit,
        resetDate: quota.resetDate
      });
    }

    // Increment monthly exam limit
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await incrementUsage(userId, "exam_mode", {
      ipHash: ip
    });

    return NextResponse.json({
      success: true,
      allowed: true,
      remaining: quota.remaining - 1
    });

  } catch (err: any) {
    console.error("[Assessment Attempt API] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Attempt verification failed" }, { status: 500 });
  }
}
