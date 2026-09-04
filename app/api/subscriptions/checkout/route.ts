import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StripeAdapter } from "@/lib/services/payments/stripeAdapter";
import { RazorpayAdapter } from "@/lib/services/payments/razorpayAdapter";

export const dynamic = "force-dynamic";

const stripe = new StripeAdapter();
const razorpay = new RazorpayAdapter();

const PLAN_PRICES: Record<string, { price: number; currency: string }> = {
  starter: { price: 9.99, currency: "USD" },
  pro: { price: 29.99, currency: "USD" },
  ultimate: { price: 79.99, currency: "USD" }
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { planId, provider } = await req.json();

    if (!planId || !provider || !['stripe', 'razorpay'].includes(provider)) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    const planConfig = PLAN_PRICES[planId.toLowerCase()];
    if (!planConfig) {
      return NextResponse.json({ success: false, message: "Invalid subscription plan selected" }, { status: 400 });
    }

    let order;
    if (provider === "stripe") {
      order = await stripe.createOrder(user.id, planId, planConfig.price, planConfig.currency);
    } else {
      order = await razorpay.createOrder(user.id, planId, planConfig.price, planConfig.currency);
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("[Checkout Route Error]:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to create order" }, { status: 500 });
  }
}
