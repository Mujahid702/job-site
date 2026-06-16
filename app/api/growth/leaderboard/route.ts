import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboardData } from "@/lib/db/growth";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const college = searchParams.get("college") || undefined;
    const branch = searchParams.get("branch") || undefined;

    const cacheKey = `growth_leaderboard:${college || "global"}:${branch || "global"}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, leaderboard: cached });
    }

    const leaderboard = await getLeaderboardData(college, branch);
    await setCache(cacheKey, leaderboard, 900); // 15-minute TTL

    return NextResponse.json({ success: true, leaderboard });
  } catch (err: any) {
    console.error("API growth leaderboard GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching leaderboard data" }, { status: 500 });
  }
}
