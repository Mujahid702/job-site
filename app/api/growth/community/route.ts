import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const cacheKey = "growth_community_groups";
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, groups: cached });
    }

    const { data, error } = await supabase
      .from("community_groups")
      .select("*")
      .order("member_count", { ascending: false });

    if (error) throw error;

    await setCache(cacheKey, data || [], 900); // 15-minute TTL

    return NextResponse.json({ success: true, groups: data || [] });
  } catch (err: any) {
    console.error("API growth community GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching community groups" }, { status: 500 });
  }
}
