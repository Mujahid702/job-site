import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StripeAdapter } from "@/lib/services/payments/stripeAdapter";
import { RazorpayAdapter } from "@/lib/services/payments/razorpayAdapter";
import { renewSubscription } from "@/lib/services/subscription";
import { invalidateUserCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

const stripe = new StripeAdapter();
const razorpay = new RazorpayAdapter();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await req.json();
    const { provider, planId } = body;

    if (!provider || !planId) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    let verificationResult;
    if (provider === "stripe") {
      const { sessionId } = body;
      if (!sessionId) {
        return NextResponse.json({ success: false, message: "Session ID missing" }, { status: 400 });
      }
      verificationResult = await stripe.verifyPayment({ sessionId });
    } else if (provider === "razorpay") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, message: "Razorpay signature fields missing" }, { status: 400 });
      }
      verificationResult = await razorpay.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });
    } else {
      return NextResponse.json({ success: false, message: "Unsupported provider" }, { status: 400 });
    }

    if (!verificationResult.success) {
      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 });
    }

    // 1. Update subscription details via Subscription Engine
    const reference = verificationResult.reference;
    const renewSuccess = await renewSubscription(user.id, planId.toLowerCase(), reference, provider, supabase);

    if (!renewSuccess) {
      return NextResponse.json({ success: false, message: "Failed to update subscription in database" }, { status: 500 });
    }

    // 2. Insert Payment Record
    const { data: paymentData, error: payError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        provider,
        order_reference: reference,
        amount: verificationResult.amount,
        currency: verificationResult.currency,
        status: "succeeded",
        transaction_id: verificationResult.transactionId,
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      })
      .select("*")
      .single();

    if (payError) {
      console.error("[Verify Route] Payment recording error:", payError);
    }

    // 3. Insert Invoice Record
    if (paymentData) {
      const { error: invError } = await supabase
        .from("invoices")
        .insert({
          payment_id: paymentData.payment_id,
          user_id: user.id,
          invoice_number: paymentData.invoice_number,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: "paid",
          pdf_url: `/dashboard/subscription/invoice/${paymentData.invoice_number}`
        });

      if (invError) {
        console.error("[Verify Route] Invoice creation error:", invError);
      }
    }

    // 4. Force invalidate Redis Cache for the user
    try {
      await invalidateUserCache(user.id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Subscription successfully upgraded!",
      plan: planId
    });
  } catch (err: any) {
    console.error("[Verify API Route Exception]:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to verify transaction" }, { status: 500 });
  }
}
