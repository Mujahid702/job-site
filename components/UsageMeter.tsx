"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, HelpCircle, ShieldAlert, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageFeature {
  feature_name: string;
  limit: number;
  used: number;
  remaining: number;
  percentage_used: number;
}

const FEATURE_LABELS: Record<string, string> = {
  ats_analyzer: "ATS Resume Scan",
  jd_matcher: "JD Matching Audit",
  resume_enhancer: "AI Bullet Enhancer",
  resume_builder: "AI Resume Builder",
  resume_comparison: "Resume Version Compare",
  resume_analytics: "Resume Insights Analysis",
  project_generation: "Project Blueprint Generator",
  exam_mode: "Mock Assessment Exam",
  cover_letter_generation: "Cover Letter Generator"
};

export default function UsageMeter({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"FREE" | "PREMIUM" | "ADMIN">("FREE");
  const [resetDate, setResetDate] = useState<string>("");
  const [features, setFeatures] = useState<UsageFeature[]>([]);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/student/usage-status");
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
          setResetDate(data.resetDate);
          setFeatures(data.features || []);
        }
      } catch (err) {
        console.error("Failed to load user usage stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className={cn("p-6 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm space-y-4 animate-pulse", className)}>
        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
        <div className="h-8 bg-slate-100 rounded w-2/3"></div>
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-slate-100 rounded w-full"></div>
          <div className="h-3 bg-slate-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const isPremium = plan === "PREMIUM" || plan === "ADMIN";
  const formattedResetDate = resetDate
    ? new Date(resetDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "next month";

  // Check if any feature has exhausted limit (used >= limit)
  const exhaustedFeatures = features.filter(f => f.limit !== Infinity && f.used >= f.limit);
  const nearExhaustedFeatures = features.filter(f => f.limit !== Infinity && f.used / f.limit >= 0.8 && f.used < f.limit);

  return (
    <div className={cn("bg-white border border-slate-200/60 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6 text-left", className)}>
      {/* Header Info */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Membership Tier</span>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight font-display flex items-center gap-1.5">
              {plan === "ADMIN" ? "Admin Console" : plan === "PREMIUM" ? "BuggedBrain Premium" : "Free Explorer Account"}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono",
              isPremium ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-600 border border-slate-200"
            )}>
              {plan}
            </span>
          </div>
        </div>

        {!isPremium && (
          <button
            onClick={() => alert("Premium memberships will launch soon! Payment gateways Razorpay & Stripe integrations are pending release.")}
            className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-750 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>Go Premium</span>
          </button>
        )}
      </div>

      {/* Progressive Warning Banner */}
      {exhaustedFeatures.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex gap-3 text-xs font-semibold leading-relaxed animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-rose-950 uppercase tracking-wide text-[10px]">Monthly Free Limit Reached!</p>
            <p>You have exhausted your monthly free allotment for: <strong className="font-black">{exhaustedFeatures.map(f => FEATURE_LABELS[f.feature_name]).join(", ")}</strong>.</p>
            <p className="text-[10px] text-rose-500 font-mono">Limits will automatically reset on {formattedResetDate} 00:00 UTC.</p>
          </div>
        </div>
      )}

      {exhaustedFeatures.length === 0 && nearExhaustedFeatures.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex gap-3 text-xs font-semibold leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-amber-950 uppercase tracking-wide text-[10px]">Approaching Limit Capacity</p>
            <p>You are running low on: <strong className="font-black">{nearExhaustedFeatures.map(f => FEATURE_LABELS[f.feature_name]).join(", ")}</strong>.</p>
          </div>
        </div>
      )}

      {/* Quota Progress Bars */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">Resource Consumption</h4>
        
        {isPremium ? (
          <div className="py-4 text-center text-xs text-slate-400 font-bold bg-slate-50 border border-slate-150 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />
            <p>Unlimited Premium Credentials Active.</p>
            <p className="text-[9px] font-mono text-slate-400">All monthly resource restrictions bypassed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {features.map((feat) => {
              const label = FEATURE_LABELS[feat.feature_name] || feat.feature_name;
              const isExhausted = feat.limit !== Infinity && feat.used >= feat.limit;
              
              return (
                <div key={feat.feature_name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span className="truncate max-w-[180px]">{label}</span>
                    <span className="font-mono text-[10px] font-black text-slate-800">
                      {feat.used} / {feat.limit}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isExhausted
                          ? "bg-rose-500"
                          : feat.percentage_used >= 80
                          ? "bg-amber-500"
                          : "bg-indigo-650"
                      )}
                      style={{ width: `${Math.min(100, feat.percentage_used)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer reset info */}
      {!isPremium && (
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Next automatic reset:</span>
          </span>
          <span className="text-slate-700 font-black">{formattedResetDate}</span>
        </div>
      )}
    </div>
  );
}
