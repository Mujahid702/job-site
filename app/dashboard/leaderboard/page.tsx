"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Trophy, 
  Search, 
  Users, 
  Flame, 
  Award,
  Globe,
  BookOpen,
  School,
  Loader2,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  college: string;
  branch: string;
  priScore: number;
  totalXp: number;
  referralCount: number;
  streakDays: number;
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"global" | "college" | "branch">("global");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("college, branch, full_name")
            .eq("user_id", authUser.id)
            .maybeSingle();
          setUserProfile(profile);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [supabase]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (scope === "college" && userProfile?.college) {
        queryParams.set("college", userProfile.college);
      }
      if (scope === "branch" && userProfile?.branch) {
        queryParams.set("branch", userProfile.branch);
      }

      const res = await fetch(`/api/growth/leaderboard?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard || []);
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user, scope, userProfile]);

  // Filter list locally for search query
  const filteredList = leaderboard.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.college.toLowerCase().includes(search.toLowerCase()) ||
    item.branch.toLowerCase().includes(search.toLowerCase())
  );

  // Locate current user in the leaderboard list
  const currentUserItem = leaderboard.find(item => item.userId === user?.id);

  const handleShareLeaderboard = async () => {
    if (!currentUserItem || !user) return;
    setSharing(true);
    try {
      const shareText = `🏆 Check this out! My Placement Readiness rank is #${currentUserItem.rank} with a PRI score of ${currentUserItem.priScore}/100! Target SDE placements here:\nhttps://buggedbrain.com`;
      
      await fetch("/api/growth/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType: "achievement_leaderboard",
          shareTarget: "WhatsApp",
          metadata: { rank: currentUserItem.rank, score: currentUserItem.priScore }
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
              <Trophy className="w-3.5 h-3.5" />
              Community Leaderboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Placement Rankings
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Compare your scores globally, in your college campus, or within your academic branch. Maximize consistency to claim the top ranks!
            </p>
          </div>

          {currentUserItem && (
            <button
              onClick={handleShareLeaderboard}
              disabled={sharing}
              className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all shrink-0 w-full md:w-auto"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 text-amber-400" />}
              Share Rank
            </button>
          )}
        </div>

        {/* CURRENT USER STATUS CALLOUT BOX */}
        {currentUserItem && (
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-amber-400 text-xl font-black shadow-inner">
                #{currentUserItem.rank}
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">Your Standings</span>
                <h3 className="text-lg font-black tracking-tight">{currentUserItem.name}</h3>
                <p className="text-[10px] text-indigo-200/60 font-semibold">{currentUserItem.college} • {currentUserItem.branch}</p>
              </div>
            </div>

            <div className="flex gap-6 items-center shrink-0">
              <div className="text-center">
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">PRI Score</span>
                <span className="text-xl font-black text-amber-400">{currentUserItem.priScore}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">XP Milestones</span>
                <span className="text-xl font-black text-indigo-200">{currentUserItem.totalXp.toLocaleString()}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Streak</span>
                <span className="text-xl font-black text-rose-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-rose-500/10 text-rose-500" />
                  {currentUserItem.streakDays}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION SCOPES AND SEARCH FILTER */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Scope Filters */}
          <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs shrink-0 w-full md:w-auto">
            {[
              { id: "global", label: "Global Rank", icon: Globe },
              { id: "college", label: "College Rank", icon: School },
              { id: "branch", label: "Branch Rank", icon: BookOpen }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setScope(btn.id as any)}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] cursor-pointer transition-all",
                  scope === btn.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <btn.icon className="w-3.5 h-3.5" />
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rankings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* LEADERBOARD DATA GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCwIcon className="w-10 h-10 animate-spin text-indigo-650" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Compiling placement ranks...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">No Ranks Found</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              No candidates fit this criteria. Try changing your filters or inviting class members to compile listings.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-center w-16">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Institute Details</th>
                    <th className="px-6 py-4 text-center w-28">Streak</th>
                    <th className="px-6 py-4 text-center w-28">Referrals</th>
                    <th className="px-6 py-4 text-center w-28">PRI Score</th>
                    <th className="px-6 py-4 text-center w-28">XP Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs font-bold text-slate-650">
                  {filteredList.map((item) => {
                    const isCurrentUser = item.userId === user?.id;
                    return (
                      <tr key={item.userId} className={cn("hover:bg-slate-50/50", isCurrentUser && "bg-indigo-50/20")}>
                        <td className="px-6 py-4 text-center">
                          {item.rank === 1 ? (
                            <Trophy className="w-5 h-5 text-amber-500 mx-auto fill-amber-100" />
                          ) : item.rank === 2 ? (
                            <Trophy className="w-5 h-5 text-slate-400 mx-auto fill-slate-50" />
                          ) : item.rank === 3 ? (
                            <Trophy className="w-5 h-5 text-amber-700 mx-auto fill-amber-50" />
                          ) : (
                            <span className="font-black text-slate-400 text-sm">{item.rank}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0 uppercase">
                              {item.name.substring(0, 2)}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-black text-slate-800 text-sm block flex items-center gap-1.5">
                                {item.name}
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 bg-indigo-650 text-white rounded text-[8px] font-black uppercase tracking-wider leading-none">You</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-700 block">{item.college}</span>
                            <span className="text-[10px] text-slate-450 font-semibold">{item.branch}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border",
                            item.streakDays > 0 ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                            <Flame className="w-3.5 h-3.5 fill-rose-500/10 text-rose-500" />
                            {item.streakDays}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-slate-750 text-sm">{item.referralCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-indigo-650 text-base">{item.priScore}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-slate-900 text-sm">{item.totalXp.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Simple fallback icon
function RefreshCwIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
