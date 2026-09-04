import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/services/subscription";
import { invalidateUserCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const cancelSuccess = await cancelSubscription(user.id, supabase);

    if (!cancelSuccess) {
      return NextResponse.json({ success: false, message: "Failed to update subscription auto-renewal settings" }, { status: 500 });
    }

    try {
      await invalidateUserCache(user.id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Auto-renewal successfully cancelled. Access remains active until current billing cycle expiry."
    });
  } catch (err: any) {
    console.error("[Cancel API Route Error]:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to cancel subscription" }, { status: 500 });
  }
}
