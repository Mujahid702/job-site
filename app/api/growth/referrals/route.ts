import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserReferralStats, processReferralJoin } from "@/lib/db/growth";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const cacheKey = `growth_referral_stats:${user.id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    const stats = await getUserReferralStats(user.id);
    await setCache(cacheKey, stats, 60); // 1-minute TTL for active growth tracking

    return NextResponse.json({ success: true, ...stats });
  } catch (err: any) {
    console.error("API growth referrals GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching referral stats" }, { status: 500 });
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
    const { referralCode, deviceFingerprint } = body;

    if (!referralCode) {
      return NextResponse.json({ success: false, message: "referralCode is required." }, { status: 400 });
    }

    // Extract IP and User Agent dynamically
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = await processReferralJoin(user.id, referralCode, {
      ip,
      userAgent,
      deviceFingerprint
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Referral code applied successfully." });
    }

    return NextResponse.json({ success: false, message: result.error || "Failed to apply referral code." }, { status: 400 });
  } catch (err: any) {
    console.error("API growth referrals POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error applying referral code" }, { status: 500 });
  }
}
