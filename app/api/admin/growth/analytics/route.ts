import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    throw new Error("Forbidden. Admin role required.");
  }
}

export async function GET() {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    // 1. Fetch community groups stats
    const { data: groups } = await supabase
      .from("community_groups")
      .select("id, group_name, member_count, group_status, platform_type");

    const totalGroups = groups?.length || 0;
    const activeGroups = groups?.filter(g => g.group_status === "Active").length || 0;
    const totalJoins = groups?.reduce((sum, g) => sum + (g.member_count || 0), 0) || 0;

    const popularGroups = [...(groups || [])]
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        name: g.group_name,
        memberCount: g.member_count,
        platform: g.platform_type
      }));

    // 2. Fetch referrals stats
    const { data: refs } = await supabase
      .from("referrals")
      .select("status, is_flagged, joined_at");

    const totalRefs = refs?.length || 0;
    const flaggedRefs = refs?.filter(r => r.is_flagged).length || 0;
    
    // Funnel stats
    const clicksCount = refs?.filter(r => r.status === "Invite Opened").length || 0;
    const registeredCount = refs?.filter(r => !["Invited", "Invite Sent", "Invite Opened"].includes(r.status)).length || 0;
    const activatedCount = refs?.filter(r => ["Activated", "Activated User", "Converted", "Premium Conversion", "Applications Submitted"].includes(r.status)).length || 0;
    const convertedCount = refs?.filter(r => ["Converted", "Premium Conversion", "Applications Submitted"].includes(r.status)).length || 0;

    // 3. Fetch top referrers / ambassadors
    const { data: ambassadors } = await supabase
      .from("placement_ambassadors")
      .select("*, profiles(full_name, college)")
      .eq("status", "Approved")
      .order("referred_count", { ascending: false })
      .limit(5);

    const topAmbassadors = (ambassadors || []).map((a: any) => ({
      name: a.profiles?.full_name || "Ambassador",
      college: a.profiles?.college || "Placement Academy",
      referrals: a.referred_count,
      impact: a.community_impact_score
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        totalGroups,
        activeGroups,
        totalJoins,
        popularGroups,
        referrals: {
          total: totalRefs,
          flagged: flaggedRefs,
          clicks: clicksCount,
          registrations: registeredCount,
          activations: activatedCount,
          conversions: convertedCount
        },
        topAmbassadors
      }
    });
  } catch (err: any) {
    console.error("API admin growth analytics failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Unauthorized" }, { status: 403 });
  }
}
