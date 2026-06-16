"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Sparkles,
  Award,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Compass,
  Trophy,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePRIScore, getPlacementReadiness, getAdminPRIStats, PlacementReadiness } from "@/lib/db/placement-readiness";

export default function PlacementReadinessPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [priData, setPriData] = useState<PlacementReadiness | null>(null);
  
  // Custom Slider Overrides (Mocking Engine for interactive testing)
  const [sliderOverrides, setSliderOverrides] = useState<Record<string, number>>({});
  const [useManualOverrides, setUseManualOverrides] = useState<boolean>(false);

  // AI Coach Insights state
  const [isGeneratingCoach, setIsGeneratingCoach] = useState<boolean>(false);
  const [coachInsights, setCoachInsights] = useState<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    roadmapSteps: string[];
  } | null>(null);

  // Weekly Missions Checklist State
  const [missions, setMissions] = useState([
    { id: "m1", text: "Complete ATS Resume Scan (adds points to Resume)", completed: false, category: "resume" },
    { id: "m2", text: "Submit 5 Job Applications in CRM (adds points to Applications)", completed: false, category: "applications" },
    { id: "m3", text: "Fill LinkedIn headline and summary details (adds points to LinkedIn)", completed: false, category: "linkedin" },
    { id: "m4", text: "Complete 1 full Mock Interview session (adds points to Interview)", completed: false, category: "interview" },
    { id: "m5", text: "Complete 1 Section in Roadmap (adds points to Skills)", completed: false, category: "skills" }
  ]);

  // Real-Time Notification Log
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; type: "success" | "warning"; timestamp: string }>>([]);

  // Leaderboard data
  const leaderboardList = useMemo(() => {
    return [
      { rank: 1, name: "student_4920", score: 94, badges: ["Elite", "Warrior"], avatarColor: "bg-amber-500" },
      { rank: 2, name: "student_9810", score: 89, badges: ["Ready", "Pro"], avatarColor: "bg-indigo-500" },
      { rank: 3, name: "student_2290", score: 84, badges: ["Ready", "Beast"], avatarColor: "bg-teal-500" },
      { rank: 4, name: "student_0128", score: 79, badges: ["Ready", "Master"], avatarColor: "bg-blue-500" },
      { rank: 5, name: "student_7314", score: 72, badges: ["Ready"], avatarColor: "bg-slate-400" }
    ];
  }, []);

  // Admin stats
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Initialize Data
  const loadPRIData = async (uid: string | null) => {
    setLoading(true);
    try {
      // Load current PRI calculations
      const data = await getPlacementReadiness(uid || "guest-user");
      setPriData(data);
      
      // Check admin status
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("raw_profile_data")
          .eq("user_id", uid)
          .maybeSingle();

        const role = profile?.raw_profile_data?.role || "";
        if (role === "admin" || role === "super_admin") {
          setIsAdmin(true);
          const stats = await getAdminPRIStats();
          setAdminStats(stats);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await loadPRIData(user ? user.id : null);
    }
    initUser();
  }, []);

  // Load alert logs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_readiness_alerts");
      if (stored) {
        try {
          setAlerts(JSON.parse(stored));
        } catch {}
      } else {
        setAlerts([
          { id: "a1", message: "Initial Placement Readiness Index calculation successfully completed.", type: "success", timestamp: new Date().toISOString() }
        ]);
      }
    }
  }, [priData]);

  // Recalculate score handler
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const overrides = useManualOverrides ? sliderOverrides : undefined;
      const data = await calculatePRIScore(user ? user.id : "guest-user", overrides);
      setPriData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle manual overrides for testing
  const handleToggleOverrides = (val: boolean) => {
    setUseManualOverrides(val);
    if (!val) {
      setSliderOverrides({});
    }
  };

  // Slider change helper
  const handleSliderChange = (metric: string, val: number) => {
    const updated = { ...sliderOverrides, [metric]: val };
    setSliderOverrides(updated);
  };

  // Dynamic values based on data / overrides
  const scoresObj = useMemo(() => {
    const d = priData;
    const ov = sliderOverrides;
    const useOv = useManualOverrides;

    const resume = useOv && ov.resume_score !== undefined ? ov.resume_score : (d?.resume_score ?? 12);
    const apps = useOv && ov.application_score !== undefined ? ov.application_score : (d?.application_score ?? 4);
    const skills = useOv && ov.skills_score !== undefined ? ov.skills_score : (d?.skills_score ?? 8);
    const portfolio = useOv && ov.portfolio_score !== undefined ? ov.portfolio_score : (d?.portfolio_score ?? 3);
    const linkedin = useOv && ov.linkedin_score !== undefined ? ov.linkedin_score : (d?.linkedin_score ?? 4);
    const interview = useOv && ov.interview_score !== undefined ? ov.interview_score : (d?.interview_score ?? 6);
    const comm = useOv && ov.community_score !== undefined ? ov.community_score : (d?.community_score ?? 2);
    const consist = useOv && ov.consistency_score !== undefined ? ov.consistency_score : (d?.consistency_score ?? 3);

    const total = resume + apps + skills + portfolio + linkedin + interview + comm + consist;
    const finalScore = Math.min(Math.max(total, 0), 100);

    let level = "Placement Beginner";
    if (finalScore > 20) level = "Placement Explorer";
    if (finalScore > 40) level = "Placement Builder";
    if (finalScore > 60) level = "Placement Ready";
    if (finalScore > 80) level = "Interview Ready";
    if (finalScore > 90) level = "Placement Elite";

    return {
      resume,
      apps,
      skills,
      portfolio,
      linkedin,
      interview,
      comm,
      consist,
      total: finalScore,
      level
    };
  }, [priData, sliderOverrides, useManualOverrides]);

  // AI Placement Coach Trigger
  const handleRunAICoach = async () => {
    setIsGeneratingCoach(true);
    setCoachInsights(null);

    const payload = {
      task: "placement-readiness",
      priScore: scoresObj.total,
      resumeScore: scoresObj.resume,
      applicationScore: scoresObj.apps,
      skillsScore: scoresObj.skills,
      portfolioScore: scoresObj.portfolio,
      linkedinScore: scoresObj.linkedin,
      interviewScore: scoresObj.interview,
      communityScore: scoresObj.comm,
      consistencyScore: scoresObj.consist,
      targetRole: user ? undefined : "Software Engineer"
    };

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed AI Coach run");
      setCoachInsights(responseData.data);
    } catch (err) {
      console.warn("API AI Coach failed, running client heuristics fallback", err);
      // Construct detailed offline AI recommendations based on scoresObj
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const recommendations: string[] = [];
      const roadmapSteps: string[] = [];

      // Resume Score Analysis
      if (scoresObj.resume >= 15) {
        strengths.push("Excellent Resume Readiness: High ATS parse ratings and format structures.");
      } else {
        weaknesses.push("Incomplete Resume Keywords: ATS scoring is below targeted FAANG thresholds.");
        recommendations.push("Utilize the JD Matcher tool to align keywords with live job post constraints.");
        roadmapSteps.push("Step 1: Re-evaluate resume ATS alignment against Deloitte SDE tracks");
      }

      // Applications Score Analysis
      if (scoresObj.apps >= 10) {
        strengths.push("High Application Activity: Consistently tracking multiple recruiting loops.");
      } else {
        weaknesses.push("Low CRM Tracking: Insufficient job logging activity in the Recruitment CRM.");
        recommendations.push("Apply to at least 5 new listings on the jobs board and drag them into Kanban lanes.");
        roadmapSteps.push("Step 2: Apply to 5 full stack developer internships");
      }

      // Interview Score Analysis
      if (scoresObj.interview >= 10) {
        strengths.push("Good Interview Confidence: Successful timed trial evaluations.");
      } else {
        weaknesses.push("Weak Interview Readiness: Lack of mock practice sessions and speech logs.");
        recommendations.push("Take at least one Technical Interview Simulation inside AI Interview Prep.");
        roadmapSteps.push("Step 3: Complete a Technical Mock Interview session to verify OOP query structures");
      }

      // Portfolio Score Analysis
      if (scoresObj.portfolio >= 7) {
        strengths.push("Solid Project Blueprint Cabinet: live portfolio URL links verified.");
      } else {
        weaknesses.push("Missing Portfolio links: GitHub link missing or no live server deployment tags.");
        recommendations.push("Save your GitHub handle inside Onboarding / settings fields.");
        roadmapSteps.push("Step 4: Connect GitHub handle to populate recent project advisory pipelines");
      }

      // Fallbacks to fill lists
      if (strengths.length < 3) strengths.push("Strong login consistency stats.");
      if (weaknesses.length < 3) weaknesses.push("Sub-optimal community forum posting counts.");
      if (recommendations.length < 3) recommendations.push("Ask for student referrals on community channels.");
      if (roadmapSteps.length < 5) {
        roadmapSteps.push("Step 5: Unlock placement readiness milestone badges");
      }

      setCoachInsights({
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3),
        recommendations: recommendations.slice(0, 3),
        roadmapSteps: roadmapSteps.slice(0, 5)
      });
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  // Toggle missions
  const handleToggleMission = (id: string, isCompleted: boolean) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    
    // Simulate score increase
    const targetMission = missions.find(m => m.id === id);
    if (!targetMission) return;
    
    if (useManualOverrides) {
      const cat = targetMission.category;
      if (cat === "resume") handleSliderChange("resume_score", isCompleted ? Math.max(0, scoresObj.resume - 4) : Math.min(20, scoresObj.resume + 4));
      if (cat === "applications") handleSliderChange("application_score", isCompleted ? Math.max(0, scoresObj.apps - 3) : Math.min(15, scoresObj.apps + 3));
      if (cat === "skills") handleSliderChange("skills_score", isCompleted ? Math.max(0, scoresObj.skills - 4) : Math.min(20, scoresObj.skills + 4));
      if (cat === "linkedin") handleSliderChange("linkedin_score", isCompleted ? Math.max(0, scoresObj.linkedin - 2) : Math.min(10, scoresObj.linkedin + 2));
      if (cat === "interview") handleSliderChange("interview_score", isCompleted ? Math.max(0, scoresObj.interview - 3) : Math.min(15, scoresObj.interview + 3));
    } else {
      // Alert user
      alert("Recalculating score based on live database values. Set 'Toggle Testing Sliders' to manually simulate changes!");
    }
  };

  // Badges Cabinet List
  const badgesCabinet = useMemo(() => {
    const total = scoresObj.total;
    return [
      { id: "b_beg", title: "Placement Explorer", desc: "Unlock 20+ PRI Index rating points.", unlocked: total >= 20 },
      { id: "b_res", title: "Resume Master", desc: "Unlock 15+ Resume score points.", unlocked: scoresObj.resume >= 15 },
      { id: "b_int", title: "Interview Warrior", desc: "Unlock 10+ Interview score points.", unlocked: scoresObj.interview >= 10 },
      { id: "b_app", title: "Application Beast", desc: "Unlock 10+ CRM application points.", unlocked: scoresObj.apps >= 10 },
      { id: "b_lnk", title: "LinkedIn Pro", desc: "Unlock 8+ LinkedIn score points.", unlocked: scoresObj.linkedin >= 8 },
      { id: "b_eli", title: "Placement Elite", desc: "Unlock 80+ PRI Index rating points.", unlocked: total >= 80 }
    ];
  }, [scoresObj]);

  // Predictive Models
  const placementProbability = useMemo(() => {
    const total = scoresObj.total;
    if (total <= 20) return { percent: 15, label: "Low Confidence", desc: "Candidate needs primary resume updates and mock training.", color: "text-rose-500", border: "border-rose-100", bg: "bg-rose-50/20" };
    if (total <= 40) return { percent: 35, label: "Low Confidence", desc: "Initial steps taken. Start tracking applications in the CRM.", color: "text-amber-600", border: "border-amber-100", bg: "bg-amber-50/20" };
    if (total <= 60) return { percent: 58, label: "Medium Confidence", desc: "A strong candidate in tech skills, but needs interview practice.", color: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50/20" };
    if (total <= 80) return { percent: 78, label: "High Confidence", desc: "Resume ATS scans verified. Applications consistency is high.", color: "text-emerald-600", border: "border-emerald-100", bg: "bg-emerald-50/20" };
    return { percent: 92, label: "High Confidence", desc: "FAANG ready. Exceptional mock outcomes, high networking reputation.", color: "text-teal-600", border: "border-teal-100", bg: "bg-teal-50/20" };
  }, [scoresObj.total]);

  // Job readiness index calculator
  const jobReadinessList = useMemo(() => {
    const total = scoresObj.total;
    return [
      { role: "Google SDE Intern", match: Math.min(Math.max(total - 8, 10), 99), status: total >= 80 ? "Ready" : total >= 60 ? "Almost Ready" : "Not Ready" },
      { role: "Deloitte Technology Analyst", match: Math.min(Math.max(total + 5, 15), 99), status: total >= 65 ? "Ready" : total >= 45 ? "Almost Ready" : "Not Ready" },
      { role: "TCS Systems Engineer", match: Math.min(Math.max(total + 12, 20), 99), status: total >= 55 ? "Ready" : total >= 35 ? "Almost Ready" : "Not Ready" }
    ];
  }, [scoresObj.total]);

  // Company prep metrics
  const companyReadinessList = useMemo(() => {
    const total = scoresObj.total;
    return [
      { name: "IBM preparation", rate: Math.min(Math.max(scoresObj.skills * 5 + 10, 20), 98) },
      { name: "Infosys mock tests", rate: Math.min(Math.max(scoresObj.interview * 6 + 8, 15), 98) },
      { name: "Deloitte case studies", rate: Math.min(Math.max(scoresObj.apps * 6 + 12, 20), 98) }
    ];
  }, [scoresObj.skills, scoresObj.interview, scoresObj.apps]);

  // SVG Area Chronological History Coordinate calculations
  const historyPoints = useMemo(() => {
    const width = 600;
    const height = 150;
    const padding = 25;
    
    // Static historical mocks representing monthly progress
    const mockHist = [
      { date: "Jan", val: 32 },
      { date: "Feb", val: 46 },
      { date: "Mar", val: 58 },
      { date: "Apr", val: 71 },
      { date: "May", val: scoresObj.total }
    ];

    const points = mockHist.map((h, idx) => {
      const x = padding + (idx / (mockHist.length - 1)) * (width - 2 * padding);
      const y = height - padding - (h.val / 100) * (height - 2 * padding);
      return { x, y, val: h.val, date: h.date };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return { path: pathD, area: areaD, dots: points };
  }, [scoresObj.total]);

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
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-emerald-950 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
              P
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 items-center">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">
                  Placement Readiness Index (PRI)
                </h1>
                <span className="px-2.5 py-0.5 rounded-[10px] text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-600">
                  Core Intelligence
                </span>
              </div>
              <p className="text-slate-500 font-medium text-sm">
                Compute aggregate career metrics dynamically across all platform modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="w-full md:w-auto px-5 py-3.5 bg-slate-900 hover:bg-emerald-650 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              <span>Recalculate Index</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: HERO ANIMATED PRI GAUGE & BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main PRI Radial Gauge Circle (5 cols) */}
          <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none" />
            <div className="w-full text-left">
              <h3 className="text-lg font-black text-slate-900 font-display">Placement Index (PRI)</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Continuous evaluation model preparedness index score</p>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" />
                <circle cx="96" cy="96" r="80" stroke="#059669" strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - scoresObj.total / 100)} 
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute text-center space-y-0.5">
                <span className="text-5xl font-black text-slate-800 block leading-none font-display">{scoresObj.total}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ 100</span>
              </div>
            </div>

            <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Placement Level Class</span>
              <strong className="text-lg font-black uppercase tracking-wider block mt-0.5 text-emerald-650">
                {scoresObj.level}
              </strong>
            </div>
          </div>

          {/* Section 2: Contribution Breakdown submodules (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">Weighted Submodule Contribution</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Subscores weights breakdown that compile the overall Index</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Resume Readiness", val: scoresObj.resume, max: 20, color: "bg-indigo-600", desc: "ATS, JD optimization" },
                { label: "CRM App Activity", val: scoresObj.apps, max: 15, color: "bg-blue-600", desc: "Applications tracked" },
                { label: "Skills Readiness", val: scoresObj.skills, max: 20, color: "bg-emerald-600", desc: "Roadmap milestones checked" },
                { label: "Portfolio Strength", val: scoresObj.portfolio, max: 10, color: "bg-teal-600", desc: "Live projects, GitHub" },
                { label: "LinkedIn readiness", val: scoresObj.linkedin, max: 10, color: "bg-sky-500", desc: "Profile summary setup" },
                { label: "Interview Readiness", val: scoresObj.interview, max: 15, color: "bg-indigo-700", desc: "Mock practice sessions" },
                { label: "Community hub", val: scoresObj.comm, max: 5, color: "bg-purple-600", desc: "Posts and comment counts" },
                { label: "Streaks Consistency", val: scoresObj.consist, max: 5, color: "bg-amber-500", desc: "Daily learning streaks" }
              ].map((sub, sIdx) => (
                <div key={sIdx} className="space-y-1.5 text-left">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[11px] font-black text-slate-800 block leading-tight">{sub.label}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{sub.desc}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-650">
                      {sub.val} <span className="text-[9px] text-slate-400 font-bold">/ {sub.max}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                    <div className={cn("h-full rounded-full transition-all duration-500", sub.color)} style={{ width: `${(sub.val / sub.max) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Override Controls block for testing */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Simulate Score Tuning (Testing Sliders)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useManualOverrides} 
                  onChange={(e) => handleToggleOverrides(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: SLIDERS MANUAL TESTING OVERRIDES (RENDER DYNAMICALLY IF CHECKED) */}
        <AnimatePresence>
          {useManualOverrides && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 overflow-hidden text-left"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Simulated Score Tuning Dashboard</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Drag sub-scores to preview level jumps and predictive adjustments</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { key: "resume_score", label: "Resume Score (0-20)", max: 20, val: scoresObj.resume },
                  { key: "application_score", label: "Application Score (0-15)", max: 15, val: scoresObj.apps },
                  { key: "skills_score", label: "Skills Score (0-20)", max: 20, val: scoresObj.skills },
                  { key: "portfolio_score", label: "Portfolio Score (0-10)", max: 10, val: scoresObj.portfolio },
                  { key: "linkedin_score", label: "LinkedIn Score (0-10)", max: 10, val: scoresObj.linkedin },
                  { key: "interview_score", label: "Interview Score (0-15)", max: 15, val: scoresObj.interview },
                  { key: "community_score", label: "Community Score (0-5)", max: 5, val: scoresObj.comm },
                  { key: "consistency_score", label: "Consistency Score (0-5)", max: 5, val: scoresObj.consist }
                ].map((slider) => (
                  <div key={slider.key} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                      <span>{slider.label}</span>
                      <span className="font-black text-slate-950">{slider.val}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={slider.max}
                      value={slider.val}
                      onChange={(e) => handleSliderChange(slider.key, parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE COLUMN GRID ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 8-COLUMN COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 3: PRI CHRONOLOGICAL HISTORY TIMELINE */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Placement Index (PRI) History</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Chronological evolution of candidate readiness scores</p>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="relative w-full h-[160px] overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 600 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="priAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((gridVal) => {
                    const y = 150 - 25 - (gridVal / 100) * 100;
                    return (
                      <line key={gridVal} x1="25" y1={y} x2="575" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    );
                  })}

                  {/* Shaded Area */}
                  {historyPoints.dots.length > 0 && (
                    <path d={historyPoints.area} fill="url(#priAreaGrad)" />
                  )}

                  {/* Progress Line */}
                  <path d={historyPoints.path} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                  {/* Dots & Labels */}
                  {historyPoints.dots.map((dot, dIdx) => (
                    <g key={dIdx}>
                      <circle cx={dot.x} cy={dot.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" className="shadow" />
                      <text x={dot.x} y={dot.y - 12} textAnchor="middle" className="text-[10px] font-black text-slate-700 fill-current">
                        {dot.val}
                      </text>
                      <text x={dot.x} y="142" textAnchor="middle" className="text-[9px] font-black text-slate-400 uppercase tracking-widest fill-current">
                        {dot.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* SECTION 4: AI PLACEMENT COACH PANEL */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500 fill-indigo-50" />
                    AI Placement Coach
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Gemini powered analysis of candidate scores, resume, and tracker actions</p>
                </div>

                <button
                  onClick={handleRunAICoach}
                  disabled={isGeneratingCoach}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 border border-indigo-100 disabled:opacity-40 cursor-pointer"
                >
                  {isGeneratingCoach ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>Ask AI Coach</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isGeneratingCoach && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]"
                  >
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider animate-pulse">Analyzing placement indicators...</p>
                  </motion.div>
                )}

                {!isGeneratingCoach && coachInsights && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
                  >
                    <div className="p-5 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block font-display">✓ Key Strengths</span>
                      <ul className="space-y-2">
                        {coachInsights.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-slate-650 font-bold flex items-start gap-2">
                            <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 bg-rose-50/20 border border-rose-100/50 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block font-display">⚠️ Core Weaknesses</span>
                      <ul className="space-y-2">
                        {coachInsights.weaknesses.map((weak, idx) => (
                          <li key={idx} className="text-xs text-slate-650 font-bold flex items-start gap-2">
                            <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block font-display">💡 AI Recommendations</span>
                      <ul className="space-y-2">
                        {coachInsights.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-650 font-bold flex items-start gap-2">
                            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {!isGeneratingCoach && !coachInsights && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center"
                  >
                    <p className="text-xs text-slate-500 font-bold">
                      Click the "Ask AI Coach" button to retrieve automated Gemini diagnostics diagnosing your strengths and weaknesses.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 5: PERSONALIZED ROADMAP GENERATOR */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display">PRI Score Target Roadmap</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Personalized pathway steps to hit a PRI score of 85+</p>
              </div>

              <div className="space-y-4 text-left">
                {coachInsights?.roadmapSteps ? (
                  coachInsights.roadmapSteps.map((step, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-700">{step}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-teal-50 border border-teal-100 text-teal-600">
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  [
                    "Step 1: Increase ATS Resume Scan score above 80+.",
                    "Step 2: Connect GitHub link and register at least 2 project blueprints.",
                    "Step 3: Submit mock interviews in AI Interview Prep to audit filler words.",
                    "Step 4: Connect LinkedIn handle URL parameters.",
                    "Step 5: Apply to at least 10 high-match job opportunities."
                  ].map((step, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-200 text-slate-500 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{step}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-400">
                        Incomplete
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 9: WEEKLY PLACEMENT MISSIONS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display">Weekly Placement Missions</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Complete tasks to increase subscores and overall index rating</p>
              </div>

              <div className="space-y-3 text-left">
                {missions.map((mission) => (
                  <div 
                    key={mission.id}
                    onClick={() => handleToggleMission(mission.id, mission.completed)}
                    className={cn(
                      "p-4 border rounded-2xl cursor-pointer flex items-center justify-between gap-4 transition-all select-none",
                      mission.completed 
                        ? "bg-emerald-50/30 border-emerald-200 text-slate-700" 
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        mission.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                      )}>
                        {mission.completed && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-black">{mission.text}</span>
                    </div>
                    {mission.completed && (
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Completed ✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 4-COLUMN SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* SECTION 8: PLACEMENT PROBABILITY PREDICTOR */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Placement Probability</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Job search forecast prediction model rating</p>
              </div>

              <div className={cn("p-5 rounded-2xl border flex flex-col items-center justify-center space-y-4 text-center", placementProbability.bg, placementProbability.border)}>
                <span className={cn("text-5xl font-black font-display leading-none", placementProbability.color)}>
                  {placementProbability.percent}%
                </span>
                
                <div>
                  <span className={cn("text-xs font-black uppercase tracking-wider block", placementProbability.color)}>
                    {placementProbability.label}
                  </span>
                  <p className="text-xs text-slate-500 font-bold leading-normal mt-1">
                    {placementProbability.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 6: JOB MATCH READINESS METER */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Job Match Readiness</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Readiness rating evaluated against target roles</p>
              </div>

              <div className="space-y-4">
                {jobReadinessList.map((job, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-bold text-slate-700">
                      <span className="font-black truncate max-w-[170px]">{job.role}</span>
                      <span className="font-black">{job.match}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 flex justify-between items-stretch">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${job.match}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        job.status === "Ready" ? "text-emerald-600" : job.status === "Almost Ready" ? "text-blue-500" : "text-rose-500"
                      )}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 7: COMPANY READINESS PROGRESS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Company Readiness</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Syllabus test scores matching targeted prep</p>
              </div>

              <div className="space-y-4">
                {companyReadinessList.map((comp, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="font-black capitalize">{comp.name}</span>
                      <span className="font-black text-emerald-600">{comp.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${comp.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 10: ACHIEVEMENTS milestons badges cabinet */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Milestones Achievements</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Trophy milestone cabinet unlocked via indices levels</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {badgesCabinet.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 relative group cursor-pointer",
                      badge.unlocked 
                        ? "bg-amber-50/20 border-amber-200 text-amber-600 shadow-sm" 
                        : "bg-slate-50/50 border-slate-200 text-slate-300"
                    )}
                  >
                    <Trophy className={cn("w-6 h-6", badge.unlocked ? "text-amber-500 fill-amber-50" : "text-slate-300")} />
                    <span className="text-[9px] font-black leading-tight truncate w-full">{badge.title}</span>
                    
                    {/* Hover detail tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] rounded-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl leading-normal font-bold">
                      <strong className="block mb-0.5 text-amber-400">{badge.title}</strong>
                      {badge.desc}
                      <span className="block mt-1 font-black uppercase text-[8px] text-slate-400">
                        Status: {badge.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 11: ANONYMIZED PLACEMENT LEADERBOARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Readiness Leaderboard</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Ranked positioning by dynamic placement PRI indexes</p>
              </div>

              <div className="space-y-3">
                {leaderboardList.map((student) => (
                  <div key={student.rank} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[10px] font-black text-slate-400 w-4">{student.rank}</span>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs uppercase shadow", student.avatarColor)}>
                        {student.name.substring(8, 9)}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-black text-slate-800 block truncate">{student.name}</span>
                        <div className="flex gap-1 mt-0.5">
                          {student.badges.map((b, bIdx) => (
                            <span key={bIdx} className="px-1.5 py-0.5 rounded text-[7px] font-black bg-white border border-slate-200 text-slate-500 uppercase tracking-widest">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-xs font-black text-slate-950 shrink-0 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                      {student.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 12: REAL-TIME NOTIFICATIONS ALERTS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">System Alerts & Logs</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">Milestone log alerts from index engines</p>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {alerts.map((alertItem) => (
                  <div 
                    key={alertItem.id} 
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-2 text-xs font-bold leading-normal",
                      alertItem.type === "success" 
                        ? "bg-emerald-50/30 border-emerald-100/50 text-emerald-800" 
                        : "bg-amber-50/30 border-amber-100/50 text-amber-800"
                    )}
                  >
                    {alertItem.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p>{alertItem.message}</p>
                      <span className="text-[8px] text-slate-400 font-black uppercase mt-1 block">
                        {new Date(alertItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 13: ADMIN CONSOLE AGGREGATES PANEL */}
        <AnimatePresence>
          {isAdmin && adminStats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md text-left space-y-6"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Consolidated Platform PRI aggregates
                </h3>
                <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">System-wide candidate performance indices indicators (Admin access only)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Average Platform PRI", val: `${adminStats.averagePRI} %`, desc: "Weighted overall index mean score" },
                  { label: "Highest Active PRI", val: `${adminStats.highestPRI} %`, desc: "Peak preparation score registered" },
                  { label: "Placement Ready Users", val: `${adminStats.placementReadyCount} Candidates`, desc: "Index scores between 61 and 80" },
                  { label: "Interview Ready Users", val: `${adminStats.interviewReadyCount} Candidates`, desc: "Index scores above 80" }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                    <strong className="text-2xl font-black text-slate-800 block my-1 font-display">{stat.val}</strong>
                    <span className="text-[9px] text-slate-400 font-bold block leading-normal">{stat.desc}</span>
                  </div>
                ))}
              </div>

              {/* Levels distribution count cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Candidate Levels Distribution</span>
                  <div className="space-y-2">
                    {adminStats.levelCounts?.map((lvl: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 p-2 bg-slate-50/50 rounded-lg">
                        <span>{lvl.level}</span>
                        <span className="font-black text-slate-950">{lvl.count} students</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 md:pl-6 md:border-l md:border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Core Platform Gaps</span>
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Most Common Weakness: <strong>{adminStats.mostCommonWeakness}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Compass className="w-4 h-4 text-indigo-500" />
                        <span>Most Common Skill Gap: <strong>{adminStats.mostCommonSkillGap}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold leading-relaxed">
                    Note: Administrators are restricted from viewing individual candidate details on this aggregate console tab to preserve student security parameters.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
