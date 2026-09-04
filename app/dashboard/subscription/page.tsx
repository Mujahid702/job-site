"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ShieldCheck, CreditCard, Receipt, Clock, AlertTriangle, ArrowRight, Printer, XCircle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import RemainingUsageBadge, { triggerBadgeRefresh } from "@/components/RemainingUsageBadge";

interface SubscriptionDetails {
  subscription_plan: string;
  status: string;
  purchase_date: string;
  expiry_date: string | null;
  auto_renew: boolean;
  payment_provider: string | null;
}

interface PaymentLog {
  payment_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: string;
  transaction_id: string;
  invoice_number: string;
  provider: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter Candidate",
    price: 9.99,
    currency: "USD",
    billing: "monthly",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-200/50",
    textColor: "text-blue-600",
    features: ["5 ATS Resume Scans / mo", "5 JD Match Audits / mo", "2 Project Blueprints / mo", "Standard AI priority support"]
  },
  {
    id: "pro",
    name: "Pro Engineer",
    price: 29.99,
    currency: "USD",
    billing: "monthly",
    color: "from-indigo-500/20 to-purple-500/20 border-indigo-200/50 relative shadow-xl shadow-indigo-500/5",
    textColor: "text-indigo-600",
    features: ["50 ATS Resume Scans / mo", "50 JD Match Audits / mo", "10 Project Blueprints / mo", "10 Assessment Exam Modes / mo", "Priority AI priority queue"],
    popular: true
  },
  {
    id: "ultimate",
    name: "Ultimate Elite",
    price: 79.99,
    currency: "USD",
    billing: "monthly",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-200/50",
    textColor: "text-emerald-600",
    features: ["Unlimited ATS Resume Scans", "Unlimited JD Match Audits", "Unlimited Project Blueprints", "Unlimited Assessment Exam Modes", "Dedicated 1-on-1 resume consultant slot"]
  }
];

export default function DashboardSubscriptionPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Data states
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Checkout states
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "razorpay">("stripe");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Modal invoice print state
  const [activeInvoice, setActiveInvoice] = useState<PaymentLog | null>(null);

  const loadData = async (uId: string) => {
    try {
      // 1. Fetch current subscription
      const resSub = await fetch("/api/student/usage-status");
      const subData = await resSub.json();
      if (subData && subData.success) {
        // Query more specifics from DB
        const { data: dbSub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", uId)
          .maybeSingle();
        
        if (dbSub) {
          setSub({
            subscription_plan: dbSub.subscription_plan,
            status: dbSub.status,
            purchase_date: dbSub.purchase_date,
            expiry_date: dbSub.expiry_date,
            auto_renew: dbSub.auto_renew,
            payment_provider: dbSub.payment_provider
          });
        }
      }

      // 2. Fetch payments history
      const resPay = await fetch("/api/subscriptions/invoices");
      const payData = await resPay.json();
      if (payData && payData.success) {
        setPayments(payData.payments || []);
      }
    } catch (err) {
      console.error("[Dashboard Sub Page Load Error]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadData(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id || null;
      setUserId(id);
      if (id) loadData(id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCancelAutoRenew = async () => {
    if (!confirm("Are you sure you want to disable auto-renewal for your subscription? Your access remains active until the end of your billing cycle.")) {
      return;
    }

    setCancelling(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess("Auto-renewal successfully disabled.");
        if (userId) loadData(userId);
        triggerBadgeRefresh();
      } else {
        setActionError(data.message || "Failed to cancel renewal.");
      }
    } catch {
      setActionError("Failed to communicate with cancellation api.");
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planId: selectedPlan,
          provider: paymentProvider
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.order?.checkoutUrl) {
        // Redirect to gateway checkout url (simulated checkout or real stripe/razorpay)
        window.location.href = data.order.checkoutUrl;
      } else {
        setActionError(data.message || "Failed to initialize payment order.");
        setCheckoutLoading(false);
      }
    } catch {
      setActionError("Failed to establish checkout request.");
      setCheckoutLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!activeInvoice) return;
    const printContent = document.getElementById("invoice-print-area")?.innerHTML;
    const windowPrint = window.open("", "", "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0");
    if (windowPrint && printContent) {
      windowPrint.document.write(`
        <html>
          <head>
            <title>Invoice #${activeInvoice.invoice_number}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="p-10 bg-white" onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      windowPrint.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-800">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Billing Dashboard...</p>
      </div>
    );
  }

  const isPremium = sub && sub.subscription_plan !== "free";

  return (
    <div className="space-y-12 max-w-5xl mx-auto p-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest">
          <CreditCard className="w-3.5 h-3.5" />
          Production Subscription Management
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          Billing & Subscriptions
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Upgrade your plan, update payment methods, disable auto-renew, and download printable invoices.
        </p>
      </div>

      {actionError && (
        <div className="p-4.5 bg-rose-50 border border-rose-200 rounded-3xl text-xs font-bold text-rose-800 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4.5 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs font-bold text-emerald-800 flex gap-3 items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid of Current Plan and Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Current Subscription Status */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-slate-950 text-white rounded-[2.5rem] border border-slate-900 p-8 shadow-xl relative overflow-hidden text-left">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />

            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono block mb-2">
              Your Current Status
            </span>
            <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white mb-6">
              {sub?.subscription_plan || "Free Tier"} Candidate
            </h3>

            <div className="space-y-4 text-xs font-medium font-mono text-slate-400">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Payment Plan:</span>
                <span className="text-white capitalize">{sub?.subscription_plan || "Free"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Billing Status:</span>
                <span className={cn(
                  "font-bold uppercase tracking-wider",
                  sub?.status === "active" ? "text-emerald-450" : "text-amber-500"
                )}>
                  {sub?.status || "Free Account"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Anniversary Date:</span>
                <span className="text-white">
                  {sub?.purchase_date ? new Date(sub.purchase_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
              {sub?.expiry_date && (
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span>Cycle Expiry:</span>
                  <span className="text-white">{new Date(sub.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
              {isPremium && (
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span>Auto-Renew:</span>
                  <span className={cn(
                    "font-bold",
                    sub?.auto_renew ? "text-emerald-450" : "text-rose-400"
                  )}>
                    {sub?.auto_renew ? "Enabled" : "Disabled"}
                  </span>
                </div>
              )}
            </div>

            {/* Cancel auto renew button */}
            {isPremium && sub?.auto_renew && (
              <button
                onClick={handleCancelAutoRenew}
                disabled={cancelling}
                className="w-full mt-8 py-3.5 bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-350 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {cancelling ? "Processing..." : "Cancel Auto-Renewal"}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Upgrades Channels */}
        <div className="md:col-span-8 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-8 text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 font-display">Upgrade Options</h3>
            <p className="text-xs text-slate-400 font-semibold">Select your ideal candidate track. Processing runs securely via Stripe/Razorpay gateways.</p>
          </div>

          {/* Plan selection grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "border-2 rounded-[2rem] p-5 cursor-pointer transition-all flex flex-col justify-between select-none bg-gradient-to-br",
                    isSelected ? "border-indigo-650 bg-indigo-50/10 scale-[1.02]" : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", plan.textColor)}>
                        {plan.name}
                      </span>
                      {plan.popular && (
                        <span className="text-[7px] font-black uppercase tracking-widest bg-indigo-650 text-white px-1.5 py-0.5 rounded-md">
                          Best value
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900">${plan.price}</span>
                      <span className="text-[10px] text-slate-400 font-bold block lowercase">/{plan.billing}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mt-4 border-t border-slate-100 pt-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-[10px] text-slate-500 font-semibold leading-tight flex items-start gap-1">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Checkout Controls */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="space-y-2.5 text-left w-full sm:w-auto">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">
                Payment Processor Gateway
              </span>
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl max-w-xs gap-1">
                <button
                  onClick={() => setPaymentProvider("stripe")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    paymentProvider === "stripe" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Stripe
                </button>
                <button
                  onClick={() => setPaymentProvider("razorpay")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    paymentProvider === "razorpay" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Razorpay
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-150 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {checkoutLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to gateway...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-350 fill-yellow-350" />
                  <span>Proceed to Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Billing Logs */}
      <div className="bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Receipt className="w-5 h-5 text-slate-400" />
          <h3 className="text-xl font-black text-slate-900 font-display">Invoices & Billing History</h3>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-bold font-mono">
            No past transactions or invoices found for this candidate profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-mono">{p.invoice_number}</td>
                    <td className="py-3.5">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      {p.currency === "INR" ? "₹" : "$"}
                      {p.amount}
                    </td>
                    <td className="py-3.5 capitalize">{p.provider}</td>
                    <td className="py-3.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono",
                        p.status === "succeeded" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setActiveInvoice(p)}
                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-650 border border-slate-200 hover:border-indigo-150 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal Overlay */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setActiveInvoice(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-[2.5rem] shadow-2xl p-8 z-10 text-slate-800 text-left">
            <button onClick={() => setActiveInvoice(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
              ✕
            </button>

            {/* Printable Area Wrapper */}
            <div id="invoice-print-area" className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-xl font-black text-slate-900 font-display">Invoice Statement</h4>
                  <p className="text-[10px] font-semibold text-slate-400 font-mono mt-0.5">Invoice: {activeInvoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-lg">
                    Paid
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Billed To</span>
                  <p className="text-slate-800 mt-0.5">Mujahid Candidate</p>
                  <p className="text-slate-500 font-medium">Class of 2026 Engineer</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Issued Date</span>
                  <p className="text-slate-800 mt-0.5">{new Date(activeInvoice.payment_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-6 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-700">
                    <tr>
                      <td className="p-3 leading-relaxed">
                        <p>Candidate Premium Plan Access Upgrade</p>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono block">Cycle: 30 Days (Anniversary Billing)</span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {activeInvoice.currency === "INR" ? "₹" : "$"}
                        {activeInvoice.amount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 font-mono">
                <div className="flex justify-between text-slate-800">
                  <span>Grand Total Paid:</span>
                  <span className="font-black">
                    {activeInvoice.currency === "INR" ? "₹" : "$"}
                    {activeInvoice.amount}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Transaction ID:</span>
                  <span className="text-slate-400 truncate max-w-[200px]">{activeInvoice.transaction_id}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Payment Gateway:</span>
                  <span className="text-slate-400 capitalize">{activeInvoice.provider}</span>
                </div>
              </div>
            </div>

            {/* Print trigger */}
            <div className="flex gap-3 justify-end pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => setActiveInvoice(null)}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-655 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintInvoice}
                className="px-6 py-3 bg-slate-900 hover:bg-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
