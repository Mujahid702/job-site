import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, targetUserId } = await req.json();

    if (!paymentId || !targetUserId) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    // 1. Update subscription status to Free
    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        subscription_plan: "free",
        status: "active",
        expiry_date: null,
        payment_reference: null,
        payment_provider: null,
        auto_renew: false
      })
      .eq("user_id", targetUserId);

    if (subError) throw subError;

    // 2. Mark Payment Record as refunded
    const { error: payError } = await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("payment_id", paymentId);

    if (payError) throw payError;

    // 3. Mark Invoice Record as refunded
    const { error: invError } = await supabase
      .from("invoices")
      .update({ status: "refunded" })
      .eq("payment_id", paymentId);

    if (invError) throw invError;

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully. Subscriber account downgraded to free tier."
    });
  } catch (err: any) {
    console.error("[Admin Refund API Error]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
