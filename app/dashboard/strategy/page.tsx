"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Percent,
  CheckCircle,
  RefreshCw,
  Target,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CareerStrategyPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/placement/intelligence");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setStrategy(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to load career strategy:", err);
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
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading strategy recommendations...</p>
      </div>
    );
  }

  if (!strategy || !strategy.activePipelines) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Back to Command Center
          </Link>
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <Target className="w-12 h-12 text-slate-350 mx-auto animate-pulse" />
            <h3 className="text-lg font-black text-slate-900">Career Insights Awaiting Pipeline</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Log active interview, OA, or recruiter pipelines in your Application Tracker OS to generate success probabilities and custom career roadmap recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { activePipelines, fitScores, recommendations } = strategy;

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

        {/* Hero Header */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Target className="w-3.5 h-3.5" />
              Strategic Career Advisor
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Career Strategy Command
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Track conversion probabilities across active pipelines, analyze role & company fits, and consume tailored placement strategies.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recalculate
          </button>
        </div>

        {/* AI Recommendations Center */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-4 text-left">
            <h3 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100 animate-pulse" />
              Coaching Recommendations Center
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec: any) => (
                <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex gap-4 items-start relative group">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0",
                    rec.priority === "High" ? "bg-rose-50 text-rose-550 border border-rose-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  )}>
                    {rec.priority === "High" ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.category}</span>
                      <span className={cn("px-2 py-0.2 text-[8px] font-black uppercase rounded", rec.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-indigo-50 text-indigo-700 border border-indigo-150")}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-850 tracking-tight">{rec.title}</h4>
                    <p className="text-xs text-slate-550 font-medium leading-relaxed">{rec.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active pipeline probabilities */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Pipeline Conversion Probability
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Calculated conversion probabilities for active application schedules.</p>
            </div>

            {activePipelines.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-3xl text-center">
                <span className="text-xs font-semibold text-slate-450">Advance applications to Assessment or Interview stages to compile probabilities.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activePipelines.map((pipe: any) => (
                  <div key={pipe.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-800">{pipe.role}</h4>
                        <span className="text-[10px] text-slate-450 font-bold">{pipe.company}</span>
                      </div>
                      <span className="px-2.5 py-0.5 text-[8px] font-black uppercase bg-indigo-50 border border-indigo-150 text-indigo-750 rounded-md">
                        {pipe.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-slate-600">
                        <span>Landing Probability:</span>
                        <span className="text-indigo-650 font-extrabold">{pipe.successProbability}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full" style={{ width: `${pipe.successProbability}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role & Company Fit Scores */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Role & Company Fit Analysis
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Measures of profile alignment against targets in active job positions.</p>
            </div>

            {fitScores.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-3xl text-center">
                <span className="text-xs font-semibold text-slate-450">Log job listings to execute profile alignment checks.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {fitScores.slice(0, 5).map((fit: any) => (
                  <div key={fit.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{fit.role}</h4>
                        <span className="text-[10px] text-slate-450 font-bold">{fit.company}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Overall Fit</span>
                        <span className="text-xs font-black text-slate-800">{fit.overallFit}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-2.5">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Company Match</span>
                        <div className="flex items-center gap-2">
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fit.companyFit}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-slate-700">{fit.companyFit}%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Role Fit Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${fit.roleFit}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-slate-700">{fit.roleFit}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
