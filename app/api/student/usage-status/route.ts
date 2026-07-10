import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_LIMITS, getOrCreateSubscription } from "@/lib/security/FeatureGuard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const sub = await getOrCreateSubscription(userId);
    const plan = sub.plan_type;
    
    const currentMonth = new Date().toISOString().substring(0, 7); // format: 'YYYY-MM'
    
    // Fetch user limits rows from Supabase
    const { data: limitsList, error: limitsError } = await supabase
      .from("user_usage_limits")
      .select("feature_name, used_count")
      .eq("user_id", userId)
      .eq("reset_month", currentMonth);

    if (limitsError) throw limitsError;

    const limitsMap = new Map<string, number>();
    if (limitsList) {
      limitsList.forEach(item => {
        limitsMap.set(item.feature_name, item.used_count);
      });
    }

    // Next reset date (1st of next month)
    const nextMonth = new Date();
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    nextMonth.setUTCDate(1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    const resetDate = nextMonth.toISOString();

    const featuresQuota = Object.keys(FEATURE_LIMITS).map(featureName => {
      const limitDef = FEATURE_LIMITS[featureName];
      const limit = limitDef[plan];
      const used = limitsMap.get(featureName) || 0;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

      return {
        feature_name: featureName,
        limit,
        used,
        remaining,
        percentage_used: limit === Infinity ? 0 : Math.round((used / limit) * 100)
      };
    });

    return NextResponse.json({
      success: true,
      plan,
      resetDate,
      features: featuresQuota
    });

  } catch (err: any) {
    console.error("[Student Usage Status API] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to retrieve usage status" }, { status: 500 });
  }
}
