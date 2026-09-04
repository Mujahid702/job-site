import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renewSubscription, getUserSubscription } from "@/lib/services/subscription";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersList = req.headers;

    // Detect Stripe vs Razorpay
    const stripeSignature = headersList.get("stripe-signature");
    const razorpaySignature = headersList.get("x-razorpay-signature");

    const supabase = await createClient();

    if (stripeSignature) {
      // Stripe Webhook Event
      const event = JSON.parse(rawBody);
      console.log(`[Stripe Webhook] Received event: ${event.type}`);

      // Basic Stripe Webhook Verification / Processing
      const dataObject = event.data.object;

      if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
        const userId = dataObject.client_reference_id || dataObject.metadata?.userId;
        const planId = dataObject.metadata?.planId || "pro";
        const reference = dataObject.subscription || dataObject.id;
        
        if (userId) {
          console.log(`[Stripe Webhook] Upgrading user ${userId} to plan ${planId}`);
          await renewSubscription(userId, planId.toLowerCase(), reference, 'stripe', supabase);
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const reference = dataObject.id;
        // Query user with this reference to downgrade to free
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("payment_reference", reference)
          .maybeSingle();

        if (subData) {
          console.log(`[Stripe Webhook] Subscription deleted. Downgrading user ${subData.user_id} to Free.`);
          await supabase
            .from("subscriptions")
            .update({
              subscription_plan: 'free',
              payment_provider: null,
              payment_reference: null,
              expiry_date: null,
              status: 'active'
            })
            .eq("user_id", subData.user_id);
        }
      }

      return NextResponse.json({ received: true });
    }

    if (razorpaySignature) {
      // Razorpay Webhook Event
      const event = JSON.parse(rawBody);
      console.log(`[Razorpay Webhook] Received event: ${event.event}`);

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
      if (secret) {
        // Optional signature verification check
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(rawBody)
          .digest("hex");
          
        if (expectedSig !== razorpaySignature) {
          console.warn("[Razorpay Webhook] Signature verification failed.");
          return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
        }
      }

      const payload = event.payload;

      if (event.event === "payment.captured" || event.event === "order.paid") {
        const payment = payload.payment?.entity || payload.order?.entity;
        const notes = payment?.notes || {};
        const userId = notes.userId;
        const planId = notes.planId || "starter";
        const reference = payment?.order_id || payment?.id;

        if (userId) {
          console.log(`[Razorpay Webhook] Upgrading user ${userId} to plan ${planId}`);
          await renewSubscription(userId, planId.toLowerCase(), reference, 'razorpay', supabase);
        }
      }

      if (event.event === "subscription.cancelled" || event.event === "refund.created") {
        const subscription = payload.subscription?.entity;
        const reference = subscription?.id || payload.payment?.entity?.order_id;
        
        if (reference) {
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("payment_reference", reference)
            .maybeSingle();

          if (subData) {
            console.log(`[Razorpay Webhook] Downgrading user ${subData.user_id} to Free.`);
            await supabase
              .from("subscriptions")
              .update({
                subscription_plan: 'free',
                payment_provider: null,
                payment_reference: null,
                expiry_date: null,
                status: 'active'
              })
              .eq("user_id", subData.user_id);
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ success: false, message: "No signature header detected" }, { status: 400 });
  } catch (err: any) {
    console.error("[Webhook Endpoint Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
