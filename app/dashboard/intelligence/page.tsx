"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Cpu, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  BookOpen, 
  Code2, 
  Compass, 
  ChevronRight, 
  Award,
  RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  module: string;
  recommendation_type: string;
  content: {
    title?: string;
    complexity?: string;
    topic?: string;
    duration?: string;
  };
  explanation: string;
  feedback: string;
}

export default function StudentIntelligenceHub() {
  const [profile, setProfile] = useState<any>(null);
  const [probs, setProbs] = useState<any>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Skill Knowledge Graph Mock
  const graphNodes = [
    { id: "lang", label: "Programming Core", icon: Code2, unlocked: true, status: "Mastered" },
    { id: "backend", label: "REST APIs (Express/FastAPI)", icon: Zap, unlocked: true, status: "In Progress" },
    { id: "db", label: "Relational Queries & Indexing", icon: BookOpen, unlocked: true, status: "Review Needed" },
    { id: "system", label: "System Design (Load Balancing)", icon: Compass, unlocked: false, status: "Locked" },
    { id: "deploy", label: "Docker & Kubernetes Deployment", icon: Award, unlocked: false, status: "Locked" }
  ];

  const loadVitals = async () => {
    try {
      setRefreshing(true);
      const resProfile = await fetch("/api/student/intelligence");
      const dataProfile = await resProfile.json();
      if (dataProfile.success) setProfile(dataProfile.profile);

      const resProbability = await fetch("/api/student/placement-probability");
      const dataProbability = await resProbability.json();
      if (dataProbability.success) {
        setProbs(dataProbability.probabilities);
        setGaps(dataProbability.skillGaps || []);
      }

      const resRecs = await fetch("/api/student/recommendations");
      const dataRecs = await resRecs.json();
      if (dataRecs.success) setRecommendations(dataRecs.recommendations || []);

    } catch (err) {
      console.error("Failed to load intelligence metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVitals();
  }, []);

  const handleFeedback = async (recId: string, choice: "helpful" | "not_helpful") => {
    try {
      const res = await fetch("/api/student/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recId, feedback: choice })
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(recommendations.map(r => r.id === recId ? { ...r, feedback: choice } : r));
      }
    } catch {
      alert("Feedback submission failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-left">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing AI Student Intelligence Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-left">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded border border-blue-100 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              AI Career Coach
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">AI Advisor & Career Vitals</h1>
          <p className="text-xs text-slate-400 font-bold">Review placement odds, forecast preparation timelines, and update knowledge graph checkpoints.</p>
        </div>

        <button 
          onClick={loadVitals}
          disabled={refreshing}
          className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Grid: Probability & Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Placement Probability Models */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900 font-display">Placement Probability Model</h3>
              <p className="text-[11px] text-slate-400 font-bold">Predicted likelihood of clearing placement gates based on candidate statistics.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Interview Shortlist", val: `${probs?.prob_interview}%`, desc: "Resume-role fit" },
              { label: "OA Clearance", val: `${probs?.prob_oa}%`, desc: "Coding tests" },
              { label: "HR Selection", val: `${probs?.prob_hr}%`, desc: "Behavioral" },
              { label: "Overall Placement", val: `${probs?.prob_placement}%`, desc: "Offer index" }
            ].map((prob, idx) => (
              <div key={idx} className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{prob.label}</span>
                <strong className="text-2xl font-black text-slate-950 block">{prob.val}</strong>
                <span className="text-[10px] text-slate-400 font-bold block">{prob.desc}</span>
              </div>
            ))}
          </div>

          {/* Confidence Intervals description */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-2 text-xs leading-normal">
            <div className="flex justify-between items-center font-bold">
              <span>95% Confidence Bounds:</span>
              <span className="text-blue-650 font-black">{probs?.confidence_lower}% — {probs?.confidence_upper}%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Calculations incorporate study patterns consistency, mock interview averages, and resume ATS rating. Real-time updates adapt automatically as user completes assignments.
            </p>
          </div>
        </div>

        {/* Prediction Timeline & Countdown */}
        <div className="lg:col-span-5 bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-widest rounded border border-blue-500/30">
              Readiness Timeline Target
            </span>
            <h3 className="text-lg font-black font-display mt-2 tracking-tight">FAANG Interview Readiness</h3>
          </div>

          <div className="text-center py-4 flex items-center justify-center gap-3">
            <Clock className="w-10 h-10 text-blue-400 animate-pulse" />
            <div>
              <strong className="text-5xl font-black font-display text-blue-400 leading-none">{probs?.readiness_timeline_days} Days</strong>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">Estimated Preparation Target</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-bold bg-slate-900/50 p-4 rounded-xl border border-white/5 leading-relaxed">
            Your current learning speed multiplier is <strong className="text-white">x{profile?.learning_speed}</strong>. Correcting SQL Joins weaknesses can reduce estimated time-to-readiness by up to 12 days.
          </p>
        </div>
      </div>

      {/* AI Knowledge & Skill Graph */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-black text-slate-900 font-display">Student Skill Knowledge Graph</h3>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8">
          {graphNodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <div 
                className={cn(
                  "p-5 border rounded-2xl flex flex-col items-center gap-2 text-center w-[160px] relative transition-all shadow-2xs",
                  node.unlocked ? "bg-slate-50 border-slate-200" : "bg-slate-100/40 border-dashed border-slate-200 opacity-50"
                )}
              >
                <div className={cn("p-3 rounded-xl", node.unlocked ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400")}>
                  <node.icon className="w-5 h-5" />
                </div>
                <strong className="text-[11px] font-black text-slate-800 leading-tight h-8 flex items-center justify-center">
                  {node.label}
                </strong>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                  node.status === "Mastered" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  node.status === "In Progress" && "bg-blue-50 text-blue-600 border border-blue-100",
                  node.status === "Review Needed" && "bg-amber-50 text-amber-600 border border-amber-100",
                  node.status === "Locked" && "bg-slate-100 text-slate-400"
                )}>
                  {node.status}
                </span>
              </div>

              {idx < graphNodes.length - 1 && (
                <ChevronRight className="w-5 h-5 text-slate-350 hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grid: Gaps & AI Advisor Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Forecasted Gaps checklist */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 font-display">Target Skill Gaps Forecast</h3>
            <p className="text-[11px] text-slate-400 font-bold">Skills required by Google / Amazon not yet listed in your profile.</p>
          </div>

          <ul className="space-y-3">
            {gaps.map((gap, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-655">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Explainable AI Advisor logs */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 font-display">Proactive AI Recommendations</h3>
            <p className="text-[11px] text-slate-400 font-bold">Personalized recommendations accompanied by explainable AI reasoning logs.</p>
          </div>

          <div className="space-y-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl space-y-3 relative text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 pb-2">
                  <span>Module: {rec.module}</span>
                  <span className="text-blue-650">{rec.recommendation_type}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800">
                    {rec.content.title || rec.content.topic}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    {rec.explanation}
                  </p>
                </div>

                {/* Feedback Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold">Was this recommendation helpful?</span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback(rec.id, "helpful")}
                      className={cn(
                        "p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer",
                        rec.feedback === "helpful" ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-white hover:bg-slate-50 text-slate-400 border-slate-250"
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(rec.id, "not_helpful")}
                      className={cn(
                        "p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer",
                        rec.feedback === "not_helpful" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-white hover:bg-slate-50 text-slate-400 border-slate-250"
                      )}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
