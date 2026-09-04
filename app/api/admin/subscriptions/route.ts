import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if the current user is an admin or staff member
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .maybeSingle();

    // Let developers view admin features in development mode, restrict in production
    if (process.env.NODE_ENV === "production" && !profile?.is_premium) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Fetch all user subscriptions with profile metadata details
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*, profiles!left(raw_profile_data)")
      .order("purchase_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || []
    });
  } catch (err: any) {
    console.error("[Admin Subscriptions API Error]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, planId } = await req.json();
    if (!targetUserId || !planId) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    // Update plan manually
    const { error } = await supabase
      .from("subscriptions")
      .update({
        subscription_plan: planId.toLowerCase(),
        status: planId.toLowerCase() === "free" ? "active" : "active",
        expiry_date: planId.toLowerCase() === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq("user_id", targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Plan updated successfully by administrator." });
  } catch (err: any) {
    console.error("[Admin Subscription Manual Update Error]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
