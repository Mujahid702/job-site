import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processReferralActivation } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await processReferralActivation(user.id, supabase);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Referral activated successfully." });
    }

    return NextResponse.json({ success: false, message: result.error || "No pending referral found to activate." });
  } catch (err: any) {
    console.error("API growth referrals activate failed:", err);
    return NextResponse.json({ success: false, message: "Server error activating referral" }, { status: 500 });
  }
}
