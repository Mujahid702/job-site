import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePlacementProbability, predictSkillGaps } from "@/lib/ai/intelligence";

/**
 * app/api/student/placement-probability/route.ts
 * GET: Runs calculations to predict interview, OA, and final placement probabilities,
 *      forecasts readiness timelines, and extracts future skill gaps checklists.
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Trigger calculations
    const stats = await calculatePlacementProbability(user.id);
    const gaps = await predictSkillGaps(user.id);

    return NextResponse.json({
      success: true,
      probabilities: stats,
      skillGaps: gaps
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
