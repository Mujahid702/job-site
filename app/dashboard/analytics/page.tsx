"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  Layers,
  Percent,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlacementAnalyticsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/placement/intelligence");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setAnalytics(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to load placement analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadData();
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading analytics data...</p>
      </div>
    );
  }

  if (!analytics || !analytics.funnel) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Back to Command Center
          </Link>
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <Layers className="w-12 h-12 text-slate-350 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Awaiting CRM Data</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tailor and track at least 2 active job opportunities in your Application Tracker OS to compile conversion metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { funnel, insights } = analytics;
  const maxFunnelVal = Math.max(funnel.applied || 1);

  // Compute funnel steps percentage relative to applied stage
  const funnelSteps = [
    { label: "Applications Submitted", count: funnel.applied, color: "from-blue-500 to-indigo-500" },
    { label: "Assessments (OA) Cleared", count: funnel.assessment, color: "from-indigo-500 to-purple-500" },
    { label: "Technical Interview Rounds", count: funnel.technical, color: "from-purple-500 to-pink-500" },
    { label: "HR / Managerial Round", count: funnel.hr, color: "from-pink-500 to-rose-500" },
    { label: "Offers Received", count: funnel.offer, color: "from-rose-500 to-emerald-500" },
    { label: "Joined / Closed", count: funnel.joined, color: "from-emerald-500 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* Hero Title Header */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              Conversion Telemetry Panel
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Placement Analytics
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Understand conversion pass rates, track ATS screening performance, and optimize application submission schedules.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Top Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ATS Screening Pass Rate</span>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{insights.atsPassRate}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interview to Offer Ratio</span>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{insights.interviewToOfferRate}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Best Application Schedule</span>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{insights.bestDay}s</p>
            </div>
          </div>
        </div>

        {/* Funnel chart and Submission schedule grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Progression Funnel Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Pipeline Recruitment Funnel
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Conversion funnel representing drop-off indices between major interview stages.</p>
            </div>

            <div className="space-y-4">
              {funnelSteps.map((step, idx) => {
                const percent = Math.max(0, Math.min(100, Math.round((step.count / maxFunnelVal) * 100)));
                return (
                  <div key={idx} className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[9px] text-slate-500 font-black">{idx + 1}</span>
                        {step.label}
                      </span>
                      <span className="font-black text-slate-850">{step.count} ({percent}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", step.color)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Schedule Stats */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-4 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Submission Timing Metrics
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Success tracking mapping applications to the days of the week they were submitted.</p>
            </div>

            {insights.timingAnalytics && (
              <div className="space-y-4">
                {Object.entries(insights.timingAnalytics).map(([day, val]: [string, any]) => {
                  const passRate = val.total > 0 ? Math.round((val.advanced / val.total) * 100) : 0;
                  return (
                    <div key={day} className="flex items-center justify-between gap-4 text-xs font-bold border-b border-slate-100 pb-2">
                      <span className="text-slate-650 font-black">{day}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-indigo-550 rounded-full" style={{ width: `${passRate}%` }} />
                        </div>
                        <span className="text-slate-400 min-w-8 text-right font-black">{passRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-indigo-800 leading-relaxed">
                Applying on <strong>{insights.bestDay}s</strong> yields a higher rate of progression beyond the initial screening. We recommend batching your outreach submissions accordingly.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
