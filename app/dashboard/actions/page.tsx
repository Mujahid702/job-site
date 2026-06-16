"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  UserCheck,
  Award,
  ChevronRight,
  Mail,
  X,
  Check,
  Edit2,
  RefreshCw,
  Info,
  Archive,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplication, updateApplicationStatus } from "@/lib/db/applications";

interface ActionItem {
  id: string;
  appId: string;
  companyName: string;
  role: string;
  type: "deadline" | "assessment" | "interview" | "offer_expiry";
  date: string;
  message: string;
}

interface StaleSuggestion {
  appId: string;
  companyName: string;
  role: string;
  status: string;
  daysStale: number;
  recommendation: "Follow Up" | "Mark Rejected" | "Archive";
  message: string;
}

interface ActionsData {
  critical: ActionItem[];
  high: ActionItem[];
  medium: ActionItem[];
  low: ActionItem[];
}

export default function ActionsCenterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actions, setActions] = useState<ActionsData>({
    critical: [],
    high: [],
    medium: [],
    low: []
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<StaleSuggestion[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [healthLevel, setHealthLevel] = useState<string>("Placement Beginner");
  const [priScore, setPriScore] = useState<number>(60);

  // Editing state for timeline date
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");

  // Follow-up email modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<StaleSuggestion | null>(null);
  const [followUpEmail, setFollowUpEmail] = useState<{ subject: string; body: string }>({
    subject: "",
    body: ""
  });
  const [copied, setCopied] = useState<boolean>(false);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      // 1. Fetch upcoming action items
      const actionsRes = await fetch("/api/jobs/actions?refresh=true");
      if (actionsRes.ok) {
        const result = await actionsRes.json();
        if (result.success) {
          setActions(result.actions || { critical: [], high: [], medium: [], low: [] });
        }
      }

      // 2. Fetch insights and suggestions
      const insightsRes = await fetch("/api/jobs/insights?refresh=true");
      if (insightsRes.ok) {
        const result = await insightsRes.json();
        if (result.success) {
          setInsights(result.insights || []);
          setSuggestions(result.suggestions || []);
          setHealthScore(result.healthScore || 0);
          setHealthLevel(result.healthLevel || "Placement Beginner");
          setPriScore(result.priScore || 60);
        }
      }
    } catch (err) {
      console.error("Failed to load actions & insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadData(user.id);
      } else {
        setLoading(false);
      }
    }
    initUser();
  }, []);

  // Update dates inline
  const handleEditClick = (item: ActionItem) => {
    setEditingId(item.id);
    setEditingDate(item.date ? item.date.split("T")[0] : "");
  };

  const handleSaveDate = async (appId: string, type: ActionItem["type"]) => {
    if (!user) return;
    try {
      const payload: any = {};
      const normalizedDate = editingDate || null;
      
      if (type === "deadline") payload.deadline = normalizedDate;
      else if (type === "assessment") payload.assessmentDate = normalizedDate;
      else if (type === "interview") payload.interviewDate = normalizedDate;
      else if (type === "offer_expiry") payload.offerExpiry = normalizedDate;

      const res = await updateApplication(appId, payload, user.id);
      if (res.success) {
        setEditingId(null);
        await loadData(user.id);
      } else {
        alert("Failed to update date");
      }
    } catch (err) {
      console.error("Failed to update date", err);
    }
  };

  // Resolve Stale Applications
  const handleResolveSuggestion = async (suggestion: StaleSuggestion) => {
    if (!user) return;
    try {
      let success = false;
      if (suggestion.recommendation === "Mark Rejected") {
        const res = await updateApplicationStatus(suggestion.appId, "Rejected", user.id, "Auto suggested stale archive");
        success = res.success;
      } else if (suggestion.recommendation === "Archive") {
        const res = await updateApplicationStatus(suggestion.appId, "Withdrawn", user.id, "Auto suggested stale withdraw");
        success = res.success;
      } else if (suggestion.recommendation === "Follow Up") {
        // Trigger professional email modal
        setFollowUpEmail({
          subject: `Application Status Inquiry: ${suggestion.role} at ${suggestion.companyName}`,
          body: `Dear Recruiting Team,\n\nI hope this email finds you well.\n\nI am writing to politely follow up on my application for the ${suggestion.role} opportunity at ${suggestion.companyName}. I submitted my application details/completed my latest rounds a few weeks ago and remain highly enthusiastic about joining your team.\n\nPlease let me know if there are any updates or if I can provide any further materials to help with your review.\n\nThank you for your time and support.\n\nBest regards,\n${user.user_metadata?.full_name || user.email?.split("@")[0] || "Placement OS Candidate"}`
        });
        setSelectedSuggestion(suggestion);
        setShowFollowUpModal(true);
        return;
      }

      if (success) {
        await loadData(user.id);
      }
    } catch (err) {
      console.error("Failed to resolve stale suggestion", err);
    }
  };

  const handleMarkFollowedUp = async () => {
    if (!user || !selectedSuggestion) return;
    try {
      // Perform no-op update to touch 'last_updated' timestamp, which resets the stale clock
      const res = await updateApplication(selectedSuggestion.appId, {}, user.id);
      if (res.success) {
        setShowFollowUpModal(false);
        setSelectedSuggestion(null);
        await loadData(user.id);
      }
    } catch (err) {
      console.error("Failed to mark followed up", err);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(followUpEmail.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if we have any action items at all
  const hasActions = 
    actions.critical.length > 0 || 
    actions.high.length > 0 || 
    actions.medium.length > 0 || 
    actions.low.length > 0;

  // Health Score Style helper
  const getHealthTheme = (score: number) => {
    if (score > 80) return { text: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" };
    if (score > 60) return { text: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" };
    if (score > 30) return { text: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200", bar: "bg-indigo-500" };
    return { text: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", bar: "bg-slate-500" };
  };

  const healthTheme = getHealthTheme(healthScore);

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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Real-time Task Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Actions & Insights
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Track critical task deadlines, OAs, interviews, and explore data-driven strategy insights based on application telemetry.
            </p>
          </div>

          <button
            onClick={() => user && loadData(user.id)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-350 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh Strategy
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Analyzing application pipelines...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: ACTION ITEMS & STALE SUGGESTIONS (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* ACTION ITEMS BLOCK */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-650" />
                    Timeline Priorities
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">Grouped by real-time urgency and calendar schedules.</p>
                </div>

                {!hasActions ? (
                  <div className="bg-slate-50 p-10 rounded-3xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Your schedule is clean!</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">No upcoming deadlines or scheduled assessments are tracked. Set schedules in your Kanban CRM to show them here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* CRITICAL ACTIONS */}
                    {actions.critical.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          Critical urgency (Today)
                        </span>
                        <div className="space-y-3">
                          {actions.critical.map((item) => renderActionCard(item, "border-rose-100 bg-rose-50/10 text-rose-800"))}
                        </div>
                      </div>
                    )}

                    {/* HIGH ACTIONS */}
                    {actions.high.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          High Priority (Tomorrow)
                        </span>
                        <div className="space-y-3">
                          {actions.high.map((item) => renderActionCard(item, "border-amber-100 bg-amber-50/10 text-amber-800"))}
                        </div>
                      </div>
                    )}

                    {/* MEDIUM ACTIONS */}
                    {actions.medium.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Medium Priority (Within 3 days)
                        </span>
                        <div className="space-y-3">
                          {actions.medium.map((item) => renderActionCard(item, "border-indigo-100 bg-indigo-50/10 text-indigo-800"))}
                        </div>
                      </div>
                    )}

                    {/* LOW ACTIONS */}
                    {actions.low.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Low Priority (Later schedule)
                        </span>
                        <div className="space-y-3">
                          {actions.low.map((item) => renderActionCard(item, "border-slate-150 bg-slate-50/20 text-slate-650"))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STALE STATUS SUGGESTIONS */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Clean-Up Recommendations
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">Applications that are stale or have no updates for 30+ days.</p>
                </div>

                {suggestions.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-3xl text-center">
                    <p className="text-xs font-bold text-slate-400">All applications are active and updated!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((sug, idx) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{sug.companyName}</span>
                            <span className="text-slate-400 font-bold text-xs">—</span>
                            <span className="text-xs font-bold text-slate-500">{sug.role}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">{sug.message}</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          {sug.recommendation === "Follow Up" ? (
                            <button
                              onClick={() => handleResolveSuggestion(sug)}
                              className="flex-grow sm:flex-none px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Follow Up
                            </button>
                          ) : sug.recommendation === "Mark Rejected" ? (
                            <button
                              onClick={() => handleResolveSuggestion(sug)}
                              className="flex-grow sm:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Mark Rejected
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResolveSuggestion(sug)}
                              className="flex-grow sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: APPLICATION HEALTH SCORE & STRATEGIC INSIGHTS (4 COLS) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* APPLICATION HEALTH SCORE CARD */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Application Health
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">Measures performance and response quality.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  {/* Progress dial structure */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG Circular stroke */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        className="stroke-slate-100 fill-none"
                        strokeWidth="10"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        className={cn("fill-none transition-all duration-1000", {
                          "stroke-emerald-500": healthScore > 80,
                          "stroke-amber-500": healthScore > 60 && healthScore <= 80,
                          "stroke-indigo-500": healthScore > 30 && healthScore <= 60,
                          "stroke-slate-400": healthScore <= 30
                        })}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 64}
                        strokeDashoffset={2 * Math.PI * 64 * (1 - healthScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Center text score display */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-slate-900 leading-none">{healthScore}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Index</span>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <span className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm", healthTheme.text, healthTheme.bg, healthTheme.border)}>
                      {healthLevel}
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold pt-1">
                      Placement Readiness Score: <strong className="text-slate-800">{priScore} PRI</strong>
                    </p>
                  </div>
                </div>

                {/* Score breakdown parameters */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Metrics evaluation checklist:</span>
                  
                  {/* Submitted Volume */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-650">
                      <span>Submitted Volume (30%)</span>
                      <span className="font-black">Active Apps</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: "80%" }} />
                    </div>
                  </div>

                  {/* Interview Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-650">
                      <span>Interview Conversion (25%)</span>
                      <span className="font-black">Stage conversions</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>

                  {/* Offer conversion */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-650">
                      <span>Offer Conversion (20%)</span>
                      <span className="font-black">Final offers</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: "50%" }} />
                    </div>
                  </div>

                  {/* Response Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-650">
                      <span>Response Rate (15%)</span>
                      <span className="font-black">Actioned response</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* STRATEGIC PLACEMENT INSIGHTS */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                    Strategic Insights
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">Correlation statistics compiled by the AI placement bot.</p>
                </div>

                {insights.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-3xl text-center">
                    <p className="text-xs font-semibold text-slate-400">Complete application logs to generate trends analyses.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((ins, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl">
                        <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{ins}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

      {/* RENDER ACTION TIMELINE DETAIL CARD */}
      {showFollowUpModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-lg w-full text-left relative overflow-hidden space-y-6">
            <button
              onClick={() => {
                setShowFollowUpModal(false);
                setSelectedSuggestion(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none font-display">
                  Follow Up Template
                </h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest mt-1.5">
                  Tailored inquiry email for {selectedSuggestion.companyName}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Subject:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800">
                  {followUpEmail.subject}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Message:</span>
                <textarea
                  readOnly
                  value={followUpEmail.body}
                  className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleCopyEmail}
                className="flex-grow py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-slate-400" />
                    Copy Email Content
                  </>
                )}
              </button>

              <button
                onClick={handleMarkFollowedUp}
                className="flex-grow py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
              >
                Mark as Followed Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Mini renderer for upcoming task items
  function renderActionCard(item: ActionItem, colorClasses: string) {
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className={cn("p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-sm", colorClasses)}
      >
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider">{item.companyName}</span>
            <span className="text-[10px] opacity-60 font-bold">—</span>
            <span className="text-xs font-bold opacity-80">{item.role}</span>
          </div>
          <p className="text-xs font-semibold leading-relaxed">{item.message}</p>
          <span className="text-[9px] font-black opacity-60 block uppercase tracking-wider pt-1">
            Date: {item.date ? new Date(item.date).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Unscheduled"}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <button
                onClick={() => handleSaveDate(item.appId, item.type)}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 bg-slate-250 hover:bg-slate-300 text-slate-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleEditClick(item)}
              className="p-2 border border-slate-200/50 bg-white/70 hover:bg-white text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider shadow-sm w-full sm:w-auto"
            >
              <Edit2 className="w-3 h-3 text-slate-400" />
              Change Date
            </button>
          )}
        </div>
      </div>
    );
  }
}
