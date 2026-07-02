import { NextResponse } from "next/server";
import { processReferralClick } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { referralCode, deviceFingerprint } = body;

    if (!referralCode) {
      return NextResponse.json({ success: false, message: "referralCode is required." }, { status: 400 });
    }

    // Extract IP and User Agent dynamically
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = await processReferralClick(referralCode, {
      ip,
      userAgent,
      deviceFingerprint
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Referral click tracked." });
    }

    return NextResponse.json({ success: false, message: result.error || "Failed to track click." }, { status: 400 });
  } catch (err: any) {
    console.error("API growth referrals click POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error tracking click." }, { status: 500 });
  }
}
