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

    const quota = await checkUsage(userId, "cover_letter_generation");
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

    // Increment cover letter limits count
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await incrementUsage(userId, "cover_letter_generation", {
      ipHash: ip
    });

    return NextResponse.json({
      success: true,
      allowed: true,
      remaining: quota.remaining - 1
    });

  } catch (err: any) {
    console.error("[Cover Letter Generation API] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Limits verification failed" }, { status: 500 });
  }
}
