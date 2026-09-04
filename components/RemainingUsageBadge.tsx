"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageDetails {
  limit: number;
  used: number;
  remaining: number;
  resetDate: string;
  plan: string;
}

// Simple in-memory client-side cache to avoid parallel duplicate fetches
let cachedStatus: any = null;
let pendingFetch: Promise<any> | null = null;

async function fetchUsageStatus() {
  if (cachedStatus) return cachedStatus;
  if (pendingFetch) return pendingFetch;

  pendingFetch = fetch("/api/student/usage-status")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    })
    .then((data) => {
      cachedStatus = data;
      pendingFetch = null;
      return data;
    })
    .catch((err) => {
      pendingFetch = null;
      throw err;
    });

  return pendingFetch;
}

// Global subscription listener trigger for updates
const badgeListeners = new Set<() => void>();
export function triggerBadgeRefresh() {
  cachedStatus = null;
  badgeListeners.forEach(listener => listener());
}

export default function RemainingUsageBadge({
  featureName,
  className
}: {
  featureName: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageDetails | null>(null);

  const loadData = () => {
    fetchUsageStatus()
      .then((data) => {
        if (data && data.success) {
          const feat = data.features.find((f: any) => f.feature_name === featureName);
          if (feat) {
            setUsage({
              limit: feat.limit,
              used: feat.used,
              remaining: feat.remaining,
              resetDate: data.resetDate,
              plan: data.plan
            });
          }
        }
      })
      .catch((e) => console.warn("[RemainingUsageBadge] Error fetching usage:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    badgeListeners.add(loadData);
    return () => {
      badgeListeners.delete(loadData);
    };
  }, [featureName]);

  if (loading) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full animate-pulse", className)}>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        <div className="w-24 h-2 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!usage) return null;

  const isUnlimited = usage.limit === Infinity || usage.limit === -1 || usage.limit >= 99999;
  const isExpired = usage.remaining <= 0 && !isUnlimited;
  
  // Calculate remaining days
  const reset = new Date(usage.resetDate);
  const diffDays = Math.max(0, Math.ceil((reset.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl border transition-all select-none font-sans text-left",
        isUnlimited
          ? "bg-emerald-50/50 border-emerald-100/50 text-emerald-800"
          : isExpired
          ? "bg-rose-50/50 border-rose-100/50 text-rose-800"
          : "bg-slate-50 border-slate-200/60 text-slate-700",
        className
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isUnlimited ? "bg-emerald-500 animate-pulse" : isExpired ? "bg-rose-500" : "bg-indigo-500"
        )}
      />
      
      <div className="text-[10px] leading-tight font-semibold">
        {isUnlimited ? (
          <p className="font-black uppercase tracking-wider text-[8px] text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Unlimited access
          </p>
        ) : (
          <>
            <p className="font-bold text-slate-800">
              <span className="font-black text-indigo-650 text-xs">{usage.remaining}</span> of {usage.limit} left this month
            </p>
            <p className="text-slate-400 font-medium font-mono text-[8px] flex items-center gap-0.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-350" />
              Resets in {diffDays} {diffDays === 1 ? 'day' : 'days'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
