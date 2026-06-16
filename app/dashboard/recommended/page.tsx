"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Sparkles,
  DollarSign,
  MapPin,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Heart,
  Loader2,
  Zap,
  Info,
  Clock,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchDetails {
  matchScore: number;
  missingSkills: string[];
  strengths: string[];
}

interface JobPosting {
  id: string;
  drive_title: string;
  drive_slug: string;
  company_name: string;
  company_logo: string | null;
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  apply_link: string;
  created_at: string;
  matchDetails: MatchDetails;
}

export default function RecommendedJobsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<"bestMatches" | "highSalary" | "fastApplying" | "recentlyAdded">("bestMatches");
  
  // Job groups
  const [jobsData, setJobsData] = useState<{
    bestMatches: JobPosting[];
    highSalary: JobPosting[];
    fastApplying: JobPosting[];
    recentlyAdded: JobPosting[];
  }>({
    bestMatches: [],
    highSalary: [],
    fastApplying: [],
    recentlyAdded: []
  });

  // Saved Jobs tracking (by job ID)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Pre-check warning modal states
  const [showPrecheckModal, setShowPrecheckModal] = useState<boolean>(false);
  const [precheckData, setPrecheckData] = useState<{ score: number; issues: string[] } | null>(null);
  const [precheckJob, setPrecheckJob] = useState<JobPosting | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Load User, Job Recommendations, and Saved status
  const loadDashboardData = async (uid: string | null) => {
    setLoading(true);
    try {
      // Fetch recommendations
      const response = await fetch(`/api/jobs/recommend?refresh=true`);
      const result = await response.json();
      if (response.ok && result.success) {
        setJobsData({
          bestMatches: result.bestMatches || [],
          highSalary: result.highSalary || [],
          fastApplying: result.fastApplying || [],
          recentlyAdded: result.recentlyAdded || []
        });
      }

      // Fetch saved jobs to highlight saved icons
      if (uid) {
        const { data: saved } = await supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("user_id", uid);
        
        if (saved) {
          setSavedJobIds(new Set(saved.map(s => s.job_id)));
        }
      }
    } catch (err) {
      console.error("Failed to load recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await loadDashboardData(user ? user.id : null);
    }
    initUser();
  }, []);

  // Save / Unsave optimistic handler
  const handleToggleSaveJob = async (job: JobPosting) => {
    if (!user) {
      alert("Please log in to save opportunities.");
      return;
    }

    const isCurrentlySaved = savedJobIds.has(job.id);
    const newSavedSet = new Set(savedJobIds);
    
    // Optimistic Update
    if (isCurrentlySaved) {
      newSavedSet.delete(job.id);
    } else {
      newSavedSet.add(job.id);
    }
    setSavedJobIds(newSavedSet);
    setSavingJobId(job.id);

    try {
      if (isCurrentlySaved) {
        // Unsave
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", job.id);
        
        if (error) throw error;
      } else {
        // Save
        const { error } = await supabase
          .from("saved_jobs")
          .insert({
            user_id: user.id,
            job_id: job.id,
            saved_at: new Date().toISOString()
          });

        if (error) throw error;

        // Sync to applications tracker as Saved
        const { error: appError } = await supabase
          .from("applications")
          .insert({
            user_id: user.id,
            job_id: job.id,
            job_title: job.drive_title,
            company: job.company_name,
            application_link: job.apply_link,
            status: "Saved",
            applied_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            salary: job.salary_range || "",
            location: job.location || "",
            source: "BuggedBrain",
            details: {
              referralStatus: "None",
              schedules: [],
              oas: [],
              interviews: [],
              recruiter: {},
              matchScore: {
                resumeMatch: job.matchDetails.matchScore,
                interviewReadiness: 65,
                overallProbability: job.matchDetails.matchScore
              }
            }
          });

        if (appError && appError.code !== "23505") { // Ignore duplicate key errors
          console.warn("CRM Application sync failed", appError);
        }

        // Log save event
        await supabase.from("analytics_events").insert({
          event_type: "job_saved",
          user_id: user.id,
          metadata: {
            jobId: job.id,
            company: job.company_name,
            role: job.drive_title
          }
        });
      }
    } catch (err) {
      console.error("Failed to toggle save status", err);
      // Rollback optimistic update
      const rollbackSet = new Set(savedJobIds);
      if (isCurrentlySaved) {
        rollbackSet.add(job.id);
      } else {
        rollbackSet.delete(job.id);
      }
      setSavedJobIds(rollbackSet);
    } finally {
      setSavingJobId(null);
    }
  };

  // Smart precheck + Apply workflow
  const handleApplyClick = async (job: JobPosting, forceApply = false) => {
    if (!user) {
      alert("Please log in to apply.");
      return;
    }

    setApplyingJobId(job.id);
    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          forceApply,
          matchScore: job.matchDetails.matchScore
        })
      });

      const result = await response.json();
      if (response.ok) {
        if (result.warning && !forceApply) {
          // Trigger low readiness warning overlay
          setPrecheckData(result.readinessToApply);
          setPrecheckJob(job);
          setShowPrecheckModal(true);
        } else if (result.success && result.applyLink) {
          // Close modal and open redirect external link
          setShowPrecheckModal(false);
          window.open(result.applyLink, "_blank");
          // Refresh data to update match details or streak
          loadDashboardData(user.id);
        }
      } else {
        alert(result.message || "Smart Apply workflow failed.");
      }
    } catch (err) {
      console.error("Apply workflow error", err);
    } finally {
      setApplyingJobId(null);
    }
  };

  const currentJobs = jobsData[activeFilter] || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back Link navigation header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HERO TITLE SECTION CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-indigo-150" />
              Auto Matching Engine Active
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Personalized Recommendations
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Platform AI continuously checks your profile target role, skills, location, ATS score, and PRI index to recommend the best job drives.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs gap-1 border border-slate-250 shrink-0">
            {[
              { id: "bestMatches", label: "🔥 Best Match" },
              { id: "highSalary", label: "🚀 High Salary" },
              { id: "fastApplying", label: "🎯 Fast Apply" },
              { id: "recentlyAdded", label: "📈 New Drives" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer text-[10px] sm:text-xs",
                  activeFilter === tab.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* JOBS GRID DISPLAY */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Matching jobs against your profile...</p>
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">No opportunities matched</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              We couldn't compile recommendations. Review and update your tech stack skills and target roles in your settings to trigger recommendations.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Update Settings Settings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentJobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const score = job.matchDetails?.matchScore || 0;
              const hasSalary = job.salary_range;

              // Color coordinate dial bounds
              const scoreColor = score >= 85 
                ? "text-emerald-600 border-emerald-100 bg-emerald-50/20" 
                : score >= 70 
                  ? "text-blue-600 border-blue-100 bg-blue-50/20" 
                  : "text-slate-500 border-slate-250 bg-slate-50/20";

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-[2.2rem] border border-slate-200 hover:border-indigo-300 transition-all duration-350 shadow-sm hover:shadow-xl hover:shadow-indigo-50/20 p-6 flex flex-col justify-between space-y-6 relative group overflow-hidden"
                >
                  {/* Absolute subtle background match highlight */}
                  {score >= 85 && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 overflow-hidden">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block leading-none">
                        {job.job_type || "Opportunity"}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight truncate max-w-[180px] block leading-tight">
                        {job.drive_title}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold truncate max-w-[185px]">
                        {job.company_name}
                      </p>
                    </div>

                    {/* Circular visual score dial */}
                    <div className={cn("w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-sm", scoreColor)}>
                      <span className="text-lg font-black leading-none">{score}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Match</span>
                    </div>
                  </div>

                  {/* Skills lists */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{job.location || "Remote / Any"}</span>
                    </div>
                    {hasSalary && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
                        <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-900 font-black">{job.salary_range}</span>
                      </div>
                    )}

                    {/* Strengths & Missing tag lines */}
                    <div className="pt-2 border-t border-slate-100/80 space-y-2">
                      {job.matchDetails?.strengths && job.matchDetails.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider shrink-0 mt-1 mr-1">Match:</span>
                          {job.matchDetails.strengths.map((str, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-md border border-emerald-100/30">
                              {str}
                            </span>
                          ))}
                        </div>
                      )}
                      {job.matchDetails?.missingSkills && job.matchDetails.missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider shrink-0 mt-1 mr-1">Gap:</span>
                          {job.matchDetails.missingSkills.map((gap, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded-md border border-slate-200">
                              {gap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApplyClick(job)}
                      disabled={applyingJobId === job.id}
                      className="flex-grow py-3 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {applyingJobId === job.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                      )}
                      <span>One-Click Apply</span>
                    </button>

                    <button
                      onClick={() => handleToggleSaveJob(job)}
                      disabled={savingJobId === job.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50",
                        isSaved
                          ? "bg-red-50 border-red-200 text-red-500 shadow-sm"
                          : "bg-white border-slate-200 text-slate-400 hover:text-red-400 hover:border-red-200"
                      )}
                    >
                      {savingJobId === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SMART PRECHECK WARNING OVERLAY MODAL */}
      <AnimatePresence>
        {showPrecheckModal && precheckData && precheckJob && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowPrecheckModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none font-display">
                      Low Apply Readiness
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none">
                      Readiness Score: {precheckData.score}%
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/20 border border-amber-100/50 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed">
                  We ran an automatic checklist pre-check against your profile and identified missing criteria that might reduce response rates.
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Failed Checkpoints:</span>
                  <div className="space-y-2">
                    {precheckData.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50/20 p-2.5 border border-rose-100/30 rounded-xl">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decisions row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowPrecheckModal(false)}
                    className="flex-grow py-3 border border-slate-200 text-slate-650 hover:bg-slate-50 font-black text-xs uppercase tracking-widest rounded-xl text-center cursor-pointer transition-all"
                  >
                    Fix Profile Settings
                  </Link>

                  <button
                    onClick={() => handleApplyClick(precheckJob, true)}
                    className="flex-grow py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Apply Anyway</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
