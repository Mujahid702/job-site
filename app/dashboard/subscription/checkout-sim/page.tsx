"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { triggerBadgeRefresh } from "@/components/RemainingUsageBadge";

export default function CheckoutSimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-white">
        <div className="text-slate-400 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading checkout simulation...</span>
        </div>
      </div>
    }>
      <CheckoutSim />
    </Suspense>
  );
}

function CheckoutSim() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const provider = searchParams.get("provider") || "stripe";
  const planId = searchParams.get("planId") || "pro";
  const amount = searchParams.get("amount") || "29.99";
  const currency = searchParams.get("currency") || "USD";
  const sessionId = searchParams.get("sessionId") || "";
  const orderId = searchParams.get("orderId") || "";

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSimulatePayment = async (shouldSucceed: boolean) => {
    setProcessing(true);
    setError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!shouldSucceed) {
      setError("Payment failed or was cancelled by the user.");
      setProcessing(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        provider,
        planId
      };

      if (provider === "stripe") {
        payload.sessionId = sessionId;
      } else {
        payload.razorpay_order_id = orderId;
        payload.razorpay_payment_id = `pay_sim_${Math.random().toString(36).substring(2, 10)}`;
        payload.razorpay_signature = "simulated_valid_signature";
      }

      const res = await fetch("/api/subscriptions/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        triggerBadgeRefresh();
        setTimeout(() => {
          router.push("/dashboard/subscription?status=success");
        }, 1500);
      } else {
        setError(data.message || "Simulated payment verification failed on server.");
      }
    } catch (err: any) {
      setError("Failed to communicate with the verification endpoint.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-white">
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="text-center space-y-6 relative z-10">
          <div className="w-14 h-14 bg-indigo-950 border border-indigo-850/60 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CreditCard className="w-6 h-6 text-indigo-400" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-indigo-455 uppercase tracking-widest font-mono block">
              Sandbox Payment Gateway
            </span>
            <h2 className="text-xl font-black font-display text-white capitalize">
              Simulated {provider} Checkout
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You are simulating a checkout flow for the <strong className="text-white uppercase">{planId}</strong> plan.
            </p>
          </div>

          {/* Amount Display */}
          <div className="py-6 bg-slate-900 border border-slate-850 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Amount Due</p>
            <p className="text-3xl font-black mt-1 font-display">
              {currency === "INR" ? "₹" : "$"}
              {amount}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-left text-xs text-red-300 font-bold flex gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl text-xs text-emerald-300 font-bold flex flex-col items-center justify-center gap-1.5">
              <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
              <span>Payment Verified! Redirecting...</span>
            </div>
          )}

          {!success && (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSimulatePayment(true)}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-350 fill-yellow-350" />
                    <span>Complete Payment Success</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSimulatePayment(false)}
                disabled={processing}
                className="w-full py-4 bg-slate-900 hover:bg-slate-850 text-slate-350 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer border border-slate-800"
              >
                Cancel / Simulate Failure
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
