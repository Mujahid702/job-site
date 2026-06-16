"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Flame,
  Award,
  Zap,
  CheckCircle,
  Trophy,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bookmark,
  ShieldAlert,
  HelpCircle,
  Lock,
  Unlock,
  Users,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserMissions,
  getUserXP,
  claimMissionReward,
  calculateLevel,
  getXpForNextLevel,
  syncGuestMissions,
  UserMission,
  UserXP,
  PlacementMission
} from "@/lib/db/missions";
import { getPlacementReadiness } from "@/lib/db/placement-readiness";

const BADGES_CONFIG = [
  { name: "First Step", desc: "Initiated career onboarding and logged first activity.", icon: "🚀", color: "from-blue-500 to-indigo-600" },
  { name: "First Application", desc: "Logged your first job application inside the CRM.", icon: "💼", color: "from-teal-500 to-emerald-600" },
  { name: "ATS Warrior", desc: "Scanned and verified an ATS resume score of 80+.", icon: "🛡️", color: "from-indigo-500 to-purple-600" },
  { name: "Resume Master", desc: "Optimized your resume scores and keyword fits.", icon: "📝", color: "from-purple-500 to-pink-600" },
  { name: "Consistency King", desc: "Built a learning streak of 7 days or more.", icon: "👑", color: "from-amber-500 to-yellow-600" },
  { name: "Interview Champion", desc: "Scored 85%+ or ran 5 sessions in technical mock trials.", icon: "🎙️", color: "from-rose-500 to-red-600" },
  { name: "Placement Beast", desc: "Achieved a placement readiness index score of 80+.", icon: "🦁", color: "from-emerald-500 to-teal-600" }
];

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "career">("daily");

  // State loaded from DB/Cache
  const [xpRecord, setXpRecord] = useState<UserXP | null>(null);
  const [missionsList, setMissionsList] = useState<UserMission[]>([]);
  const [priScore, setPriScore] = useState<number>(60);
  const [badges, setBadges] = useState<string[]>([]);

  // Interactive UI states
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number } | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<Array<{ id: string; x: number; y: number; xp: number; pri: number }>>([]);

  // Check and run synchronization if user logs in
  const runSync = async (uid: string) => {
    if (typeof window === "undefined") return;
    const guestXp = localStorage.getItem("buggedbrain_guest_xp");
    const guestMissions = localStorage.getItem("buggedbrain_guest_missions");
    const guestBadges = localStorage.getItem("buggedbrain_guest_badges");

    if (guestXp || guestMissions || guestBadges) {
      console.log("[Missions Dashboard] Running guest synchronization triggers...");
      const result = await syncGuestMissions(uid);
      if (result.success) {
        // Refresh calculations
        console.log("[Missions Dashboard] Sync successful! Reloading stats...");
      }
    }
  };

  const loadData = async (uid: string | null) => {
    setLoading(true);
    try {
      const actualUid = uid || "guest-user";
      
      // Load user missions & XP
      const { userMissions, xp } = await getUserMissions(actualUid);
      setMissionsList(userMissions);
      setXpRecord(xp);

      // Load PRI
      const pr = await getPlacementReadiness(actualUid);
      if (pr) {
        setPriScore(pr.pri_score);
      }

      // Load Badges from profile
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("badges")
          .eq("user_id", uid)
          .maybeSingle();
        if (profile?.badges) {
          setBadges(profile.badges);
        }
      } else {
        if (typeof window !== "undefined") {
          const guestBadges = localStorage.getItem("buggedbrain_guest_badges");
          setBadges(guestBadges ? JSON.parse(guestBadges) : ["First Step"]);
        }
      }
    } catch (err) {
      console.error("Failed to load missions data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await runSync(user.id);
      }
      await loadData(user ? user.id : null);
    }
    init();
  }, []);

  // Filtered lists
  const dailyMissions = useMemo(() => missionsList.filter(m => m.mission?.mission_type === "daily"), [missionsList]);
  const weeklyMissions = useMemo(() => missionsList.filter(m => m.mission?.mission_type === "weekly"), [missionsList]);
  const careerMissions = useMemo(() => missionsList.filter(m => m.mission?.mission_type === "career"), [missionsList]);

  // Claim handler
  const handleClaim = async (e: React.MouseEvent, um: UserMission) => {
    e.stopPropagation();
    if (claimingId || um.claimed || !um.completed) return;

    setClaimingId(um.id);

    // Render floating text indicator at click point
    const rect = e.currentTarget.getBoundingClientRect();
    const floatId = `float-${Date.now()}`;
    const newFloat = {
      id: floatId,
      x: rect.left + rect.width / 2,
      y: rect.top,
      xp: um.mission?.xp_reward || 10,
      pri: um.mission?.pri_reward || 2
    };
    setFloatingRewards(prev => [...prev, newFloat]);

    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(f => f.id !== floatId));
    }, 2000);

    const actualUid = user ? user.id : "guest-user";

    try {
      const result = await claimMissionReward(actualUid, um.id);

      if (result.success) {
        // Optimistic refresh
        if (result.levelUp) {
          setLevelUpData({ newLevel: result.newLevel });
        }
        await loadData(user ? user.id : null);
      } else {
        alert(result.error || "Claim failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  // XP Progress math
  const levelProgress = useMemo(() => {
    if (!xpRecord) return { percent: 0, currentXP: 0, nextLevelXP: 100 };
    const level = xpRecord.current_level;
    const prevThreshold = level === 1 ? 0 : level === 2 ? 100 : level === 3 ? 250 : level === 4 ? 500 : 1000 + (level - 5) * 1000;
    const nextThreshold = getXpForNextLevel(level);
    
    const xpInLevel = xpRecord.total_xp - prevThreshold;
    const xpNeededForLevel = nextThreshold - prevThreshold;

    return {
      percent: Math.min(Math.max((xpInLevel / xpNeededForLevel) * 100, 0), 100),
      currentXP: xpRecord.total_xp,
      nextLevelXP: nextThreshold
    };
  }, [xpRecord]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left relative overflow-hidden">
      
      {/* Floating particles animations */}
      <AnimatePresence>
        {floatingRewards.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x - 20 }}
            animate={{ opacity: 0, y: f.y - 120, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed z-[999] pointer-events-none flex flex-col items-center gap-1 font-black text-sm drop-shadow"
          >
            <span className="text-amber-500">+{f.xp} XP</span>
            <span className="text-emerald-500">+{f.pri} PRI</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Level Up Pop-up overlay */}
      <AnimatePresence>
        {levelUpData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="w-full max-w-md bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-4xl font-black text-slate-950 tracking-tighter">LEVEL UP!</h2>
              <p className="text-slate-500 font-bold max-w-xs mx-auto">
                Congratulations! You climbed the ranking ladders. You are now:
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-3xl font-black text-2xl shadow-xl shadow-amber-500/20">
                <Trophy className="w-7 h-7 fill-white" />
                Level {levelUpData.newLevel}
              </div>

              <div>
                <button
                  onClick={() => setLevelUpData(null)}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl w-full cursor-pointer transition-all"
                >
                  Continue Journey
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back navigation header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HERO HEADER TITLE CARD */}
        <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest block w-fit">
              🏆 Progression Center
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display">
              Placement Missions
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Unlock daily, weekly, and career challenges to upgrade your skills profile, gather XP points, and elevate your Placement Readiness Index (PRI).
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Placement Score</span>
              <span className="text-3xl font-black text-white font-display block mt-0.5">{priScore}%</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-24 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[350px]">
            <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Evaluating progression cabinets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PROFILE CABINET COLUMN (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Level & XP progression bar card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm text-center space-y-6">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Level Cabin</span>
                  <strong className="text-4xl font-black text-slate-900 font-display block mt-1">
                    Level {xpRecord?.current_level || 1}
                  </strong>
                </div>

                {/* Progress bar container */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                    <span>{levelProgress.currentXP} XP</span>
                    <span className="text-slate-400">Next Level: {levelProgress.nextLevelXP} XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto">
                  Earn {levelProgress.nextLevelXP - levelProgress.currentXP} more XP to reach Level {(xpRecord?.current_level || 1) + 1} and claim premium level rewards.
                </p>
              </div>

              {/* Streaks Panel card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Activity streak</span>
                  <h3 className="text-xl font-black text-slate-900 font-display block">
                    {xpRecord?.streak_days || 0} Days Active
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                    Longest Active Streak: <strong className="text-slate-700">{xpRecord?.longest_streak || 0} days</strong>
                  </p>
                </div>

                <div className="relative flex items-center justify-center shrink-0">
                  <Flame className={cn("w-14 h-14", (xpRecord?.streak_days || 0) > 0 ? "text-amber-500 fill-amber-50" : "text-slate-300")} />
                  <span className="absolute text-xs font-black text-slate-800 mt-1">{(xpRecord?.streak_days || 0)}</span>
                </div>
              </div>

              {/* Badges cabinet checklist */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-950 font-display flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 fill-amber-50" />
                    Badges Cabinet
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Badges earned through career milestones and activity loops</p>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {BADGES_CONFIG.map(b => {
                    const isUnlocked = badges.includes(b.name);
                    return (
                      <div key={b.name} className="relative group flex flex-col items-center">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow border relative overflow-hidden",
                            isUnlocked 
                              ? `bg-gradient-to-tr ${b.color} text-white border-transparent rotate-0 shadow-lg shadow-indigo-100` 
                              : "bg-slate-50 text-slate-350 border-slate-200"
                          )}
                        >
                          {!isUnlocked && <div className="absolute inset-0 bg-slate-950/[0.02] flex items-center justify-center" />}
                          <span>{b.icon}</span>
                        </div>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-14 hidden group-hover:block w-48 bg-slate-900 text-white p-3 rounded-xl text-left shadow-2xl z-50 text-[10px] leading-relaxed">
                          <p className="font-black text-white">{b.name}</p>
                          <p className="text-slate-350 mt-1 font-semibold">{b.desc}</p>
                          <span className={cn("inline-block mt-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", isUnlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400")}>
                            {isUnlocked ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT MISSIONS CLASSIFICATION PANEL (8 cols) */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-8 text-left">
              
              {/* Tab Navigation header */}
              <div className="flex border-b border-slate-100 pb-2">
                {[
                  { id: "daily", label: "Daily Missions" },
                  { id: "weekly", label: "Weekly Targets" },
                  { id: "career", label: "Career Milestones" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "pb-4 px-6 text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                      activeTab === tab.id 
                        ? "border-slate-900 text-slate-950" 
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* LIST VIEWS */}
              <div className="space-y-4">
                
                {/* DAILY TAB */}
                {activeTab === "daily" && (
                  dailyMissions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      No active daily challenges found. Check back tomorrow!
                    </div>
                  ) : (
                    dailyMissions.map(um => (
                      <div
                        key={um.id}
                        className={cn(
                          "p-6 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all select-none relative overflow-hidden",
                          um.completed
                            ? "bg-slate-50/50 border-slate-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{um.mission?.title}</h4>
                            {um.claimed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200/60">
                                Claimed
                              </span>
                            ) : um.completed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Completed
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 font-bold leading-normal">{um.mission?.description}</p>
                          
                          {/* Progress text & bar */}
                          <div className="space-y-1 max-w-xs">
                            <div className="text-[10px] text-slate-400 font-bold">
                              Progress: {um.progress} / {um.target}
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", um.completed ? "bg-emerald-500" : "bg-indigo-500")}
                                style={{ width: `${(um.progress / um.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Reward CTA Panel */}
                        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rewards</span>
                            <div className="flex gap-2 mt-1">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100">
                                +{um.mission?.xp_reward} XP
                              </span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                                +{um.mission?.pri_reward} PRI
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleClaim(e, um)}
                            disabled={claimingId !== null || um.claimed || !um.completed}
                            className={cn(
                              "px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow flex items-center justify-center",
                              um.claimed
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
                                : um.completed
                                  ? "bg-slate-900 text-white hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-0 shadow-lg shadow-slate-900/10"
                                  : "bg-slate-50 text-slate-350 cursor-not-allowed border border-slate-200/40 shadow-none"
                            )}
                          >
                            {claimingId === um.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : um.claimed ? (
                              "Claimed ✓"
                            ) : (
                              "Claim"
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* WEEKLY TAB */}
                {activeTab === "weekly" && (
                  weeklyMissions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      No active weekly challenges found.
                    </div>
                  ) : (
                    weeklyMissions.map(um => (
                      <div
                        key={um.id}
                        className={cn(
                          "p-6 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all select-none relative overflow-hidden",
                          um.completed
                            ? "bg-slate-50/50 border-slate-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{um.mission?.title}</h4>
                            {um.claimed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200/60">
                                Claimed
                              </span>
                            ) : um.completed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Completed
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 font-bold leading-normal">{um.mission?.description}</p>
                          
                          {/* Progress text & bar */}
                          <div className="space-y-1 max-w-xs">
                            <div className="text-[10px] text-slate-400 font-bold">
                              Progress: {um.progress} / {um.target}
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", um.completed ? "bg-emerald-500" : "bg-indigo-500")}
                                style={{ width: `${(um.progress / um.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Reward CTA Panel */}
                        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rewards</span>
                            <div className="flex gap-2 mt-1">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100">
                                +{um.mission?.xp_reward} XP
                              </span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                                +{um.mission?.pri_reward} PRI
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleClaim(e, um)}
                            disabled={claimingId !== null || um.claimed || !um.completed}
                            className={cn(
                              "px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow flex items-center justify-center",
                              um.claimed
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
                                : um.completed
                                  ? "bg-slate-900 text-white hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-0 shadow-lg shadow-slate-900/10"
                                  : "bg-slate-50 text-slate-350 cursor-not-allowed border border-slate-200/40 shadow-none"
                            )}
                          >
                            {claimingId === um.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : um.claimed ? (
                              "Claimed ✓"
                            ) : (
                              "Claim"
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* CAREER TAB */}
                {activeTab === "career" && (
                  careerMissions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      No active career milestone missions.
                    </div>
                  ) : (
                    careerMissions.map(um => (
                      <div
                        key={um.id}
                        className={cn(
                          "p-6 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all select-none relative overflow-hidden",
                          um.completed
                            ? "bg-slate-50/50 border-slate-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{um.mission?.title}</h4>
                            {um.claimed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200/60">
                                Claimed
                              </span>
                            ) : um.completed ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Completed
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 font-bold leading-normal">{um.mission?.description}</p>
                          
                          {/* Progress text & bar */}
                          <div className="space-y-1 max-w-xs">
                            <div className="text-[10px] text-slate-400 font-bold">
                              Progress: {um.progress} / {um.target}
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", um.completed ? "bg-emerald-500" : "bg-indigo-500")}
                                style={{ width: `${(um.progress / um.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Reward CTA Panel */}
                        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rewards</span>
                            <div className="flex gap-2 mt-1">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100">
                                +{um.mission?.xp_reward} XP
                              </span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                                +{um.mission?.pri_reward} PRI
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleClaim(e, um)}
                            disabled={claimingId !== null || um.claimed || !um.completed}
                            className={cn(
                              "px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow flex items-center justify-center",
                              um.claimed
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
                                : um.completed
                                  ? "bg-slate-900 text-white hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-0 shadow-lg shadow-slate-900/10"
                                  : "bg-slate-50 text-slate-350 cursor-not-allowed border border-slate-200/40 shadow-none"
                            )}
                          >
                            {claimingId === um.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : um.claimed ? (
                              "Claimed ✓"
                            ) : (
                              "Claim"
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
