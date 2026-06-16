import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyDigest } from "@/lib/db/growth";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const cacheKey = `growth_digest:${user.id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, digest: cached });
    }

    const digest = await getDailyDigest(user.id);
    await setCache(cacheKey, digest, 900); // 15-minute TTL

    return NextResponse.json({ success: true, digest });
  } catch (err: any) {
    console.error("API growth digest GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching daily digest" }, { status: 500 });
  }
}
