"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Award,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function DailyDigestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [digest, setDigest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser) {
          const res = await fetch("/api/growth/digest");
          if (res.ok) {
            const data = await res.json();
            if (data.success) setDigest(data.digest);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const handleShareDigest = async () => {
    if (!digest) return;
    setSharing(true);
    try {
      const driveNames = digest.topDrives?.map((d: any) => `${d.company} (${d.title})`).join(", ");
      const shareText = `🚀 Daily Placement Digest highlights: Top job openings at ${driveNames || "partner firms"} and fresh placement tips. Read more at https://buggedbrain.com`;
      
      await fetch("/api/growth/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType: "daily_digest",
          shareTarget: "WhatsApp",
          metadata: { driveCount: digest.topDrives?.length }
        })
      });

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Generating daily placement digest...</p>
      </div>
    );
  }

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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
              Daily Placement Digest
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Career Digest
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Fresh engineering roles, internships, DSA practice reminders, and corporate tips aggregated for {digest?.generatedDate || "Today"}.
            </p>
          </div>

          <button
            onClick={handleShareDigest}
            disabled={sharing}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all shrink-0 w-full md:w-auto"
          >
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
            Share Digest
          </button>
        </div>

        {/* STRATEGIC COACH TIP BANNER */}
        {digest?.placementTip && (
          <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[2rem] text-left flex gap-4 items-start shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 fill-indigo-150" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Coaching Digest Tip</h4>
              <p className="text-slate-700 text-xs font-bold leading-relaxed">{digest.placementTip}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* DRIVES AND OPENINGS FEED */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TOP PLACEMENT DRIVES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Featured Placement Drives
              </h3>

              {digest?.topDrives?.length === 0 ? (
                <p className="text-slate-400 text-xs font-bold py-6 text-center">No active drives today.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {digest?.topDrives?.map((drive: any) => (
                    <div key={drive.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{drive.company}</span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">{drive.title}</h4>
                        <div className="flex gap-4 text-[10px] text-slate-500 font-semibold items-center">
                          <span>Package: <strong className="text-slate-700">{drive.ctc}</strong></span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Closes: {new Date(drive.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={drive.link}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-200"
                      >
                        Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FEATURED INTERNSHIPS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                Trending Internship Leads
              </h3>

              {digest?.topInternships?.length === 0 ? (
                <p className="text-slate-400 text-xs font-bold py-6 text-center">No active internships today.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {digest?.topInternships?.map((intern: any) => (
                    <div key={intern.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{intern.company}</span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">{intern.title}</h4>
                        <div className="flex gap-4 text-[10px] text-slate-500 font-semibold items-center">
                          <span>Duration: <strong className="text-slate-700">{intern.duration}</strong></span>
                          <span>Stipend: <strong className="text-slate-700">{intern.stipend}</strong></span>
                        </div>
                      </div>

                      <Link
                        href={intern.link}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-200"
                      >
                        Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR: DAILY CHALLENGES AND REMINDERS */}
          <div className="space-y-8">
            
            {/* PRACTICE CHALLENGES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500" />
                Practice Action Center
              </h3>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Complete these goals today to secure consistency streak bonuses.
              </p>

              <div className="space-y-3">
                {digest?.pendingMissions?.map((m: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                    <div className="space-y-0.5 max-w-[70%]">
                      <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{m.title}</h4>
                      <span className="text-[8px] font-black text-indigo-650 uppercase tracking-widest">Streak Goal</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150 shrink-0">
                      {m.reward}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard/missions"
                className="flex items-center justify-center gap-1.5 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all"
              >
                Go to Mission Center
              </Link>
            </div>

            {/* STREAKS PROMPT CARD */}
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-md">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-black tracking-tight leading-none">Streaks Active</h3>
                <span className="px-2 py-0.5 bg-white/20 text-[9px] font-black uppercase rounded border border-white/10">Streak Tracker</span>
              </div>
              <p className="text-white/80 text-xs font-semibold leading-relaxed">
                Consistently check daily digests, submit resumes, or complete code audits to unlock 7-Day, 30-Day and 90-Day milestone awards!
              </p>
              <Link
                href="/dashboard/placement-readiness"
                className="block text-center w-full py-2.5 bg-white text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
              >
                Inspect Streaks
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
