"use client";

import React, { useEffect, useState } from "react";
import { Search, ShieldAlert, Sparkles, RefreshCw, Filter, RefreshCcw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionRecord {
  subscription_id: string;
  user_id: string;
  subscription_plan: string;
  status: string;
  purchase_date: string;
  expiry_date: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  profiles: {
    raw_profile_data?: {
      name?: string;
      email?: string;
    };
  } | null;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePlan = async (targetUserId: string, currentPlan: string) => {
    const nextPlan = currentPlan === "free" ? "pro" : "free";
    if (!confirm(`Are you sure you want to change this subscriber's plan to ${nextPlan.toUpperCase()}?`)) return;

    setActionLoading(targetUserId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, planId: nextPlan })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Subscription plan successfully updated!");
        loadData();
      } else {
        alert(data.message || "Failed to update plan.");
      }
    } catch {
      alert("Failed to communicate with update api.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerRefund = async (targetUserId: string, paymentRef: string) => {
    if (!paymentRef) {
      alert("This subscription does not have an active payment transaction reference associated.");
      return;
    }
    if (!confirm("Are you sure you want to issue a refund? This will downgrade the user to the Free tier immediately.")) return;

    setActionLoading(targetUserId + "-refund");
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: paymentRef, targetUserId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Refund successfully completed!");
        loadData();
      } else {
        alert(data.message || "Failed to issue refund.");
      }
    } catch {
      alert("Failed to establish communication with refund api.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRecords = subscriptions.filter(record => {
    const name = record.profiles?.raw_profile_data?.name?.toLowerCase() || "";
    const email = record.profiles?.raw_profile_data?.email?.toLowerCase() || "";
    const id = record.user_id.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || email.includes(query) || id.includes(query);
    const matchesFilter = planFilter === "all" || record.subscription_plan === planFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-12 max-w-6xl mx-auto p-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left border-b border-slate-100 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 text-red-650 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            Administrative Portal Gating
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Candidate Subscriptions
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Manually alter user plans, check billing references, and issue simulated refunds.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reload Data"
          >
            <RefreshCcw className="w-4 h-4 text-slate-600" />
          </button>
          <a
            href="/admin/subscriptions/revenue"
            className="px-5 py-3 bg-slate-900 hover:bg-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-yellow-350 fill-yellow-350" />
            <span>Revenue Analytics</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-800">
          <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Subscriber Records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate name, email, or user id..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs gap-1 border border-slate-200">
              {["all", "free", "starter", "pro", "ultimate"].map(plan => (
                <button
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    planFilter === plan ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Candidate Profile</th>
                    <th className="p-4">Active Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Billing Provider</th>
                    <th className="p-4">Anniversary Start</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold font-mono">
                        No subscriber accounts match the selected parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const name = r.profiles?.raw_profile_data?.name || "Active Candidate";
                      const email = r.profiles?.raw_profile_data?.email || "candidate@jobsite.com";
                      
                      return (
                        <tr key={r.subscription_id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div>
                              <p className="text-slate-800 font-black">{name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{email}</p>
                            </div>
                          </td>
                          <td className="p-4 uppercase tracking-wider text-indigo-650">{r.subscription_plan}</td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono",
                              r.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            )}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {r.payment_provider ? (
                              <span className="capitalize">{r.payment_provider}</span>
                            ) : (
                              <span className="text-slate-450 font-semibold">Free Account</span>
                            )}
                          </td>
                          <td className="p-4">{new Date(r.purchase_date).toLocaleDateString()}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              disabled={actionLoading === r.user_id}
                              onClick={() => handleUpdatePlan(r.user_id, r.subscription_plan)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                            >
                              <RefreshCw className={cn("w-3 h-3", actionLoading === r.user_id && "animate-spin")} />
                              <span>Toggle Plan</span>
                            </button>

                            {r.subscription_plan !== "free" && r.payment_reference && (
                              <button
                                disabled={actionLoading === r.user_id + "-refund"}
                                onClick={() => handleTriggerRefund(r.user_id, r.payment_reference!)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-xl transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Issue Refund</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
