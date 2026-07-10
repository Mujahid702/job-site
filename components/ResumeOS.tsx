"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getResumeScans, addResumeScan, getPlacementScores, upsertPlacementScores } from "@/lib/db/resume";
import { getRoadmapProgress } from "@/lib/db/roadmaps";
import { getUserProfile, upsertUserProfile } from "@/lib/db/profiles";
import { saveAnalyticsFromScan } from "@/lib/db/resume-analytics";
import { calculatePRIScore } from "@/lib/db/placement-readiness";

import {
  Sparkles,
  FileText,
  FileCheck,
  FileSearch,
  Award,
  History,
  Activity,
  RefreshCw,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowLeftRight,
  ShieldAlert,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import AtsResumeAnalyzer from "./AtsResumeAnalyzer";
import JdMatchAnalyzer from "./JdMatchAnalyzer";
import AiResumeEnhancer from "./AiResumeEnhancer";
import ResumeBuilder from "./ResumeBuilder";

// Snapshot structure
interface Snapshot {
  id: string;
  version: string;
  date: string;
  atsScore: number;
  jdMatchScore: number;
  healthScore: number;
  roleTargeted: string;
  rawText: string;
  completeness: number;
  keywordCoverage: number;
  skillsRelevance: number;
  projectStrength: number;
  roleMatch: number;
  readability: number;
}

interface ResumeOSProps {
  onScoreUpdate?: (score: number) => void;
  subTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export default function ResumeOS({ onScoreUpdate, subTab = "overview", onSubTabChange }: ResumeOSProps) {
  const router = useRouter();
  // Local active tab override if no parent tab control is passed
  const [localTab, setLocalTab] = useState<string>("overview");
  const activeTab = onSubTabChange ? subTab : localTab;
  const setTab = (t: string) => {
    if (onSubTabChange) {
      onSubTabChange(t);
    } else {
      setLocalTab(t);
    }
  };

  const [userId, setUserId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [completedGoalsCount, setCompletedGoalsCount] = useState<number>(1);
  const [completedRoadmapStepsCount, setCompletedRoadmapStepsCount] = useState<number>(1);
  const [avgInterviewScore, setAvgInterviewScore] = useState<number>(50);

  // Listen to Auth State
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch snapshots and scores from Supabase/localStorage
  useEffect(() => {
    async function loadData() {
      if (!userId) {
        // Fallback to local storage for guest
        // Fallback to local storage for guest
        const saved = localStorage.getItem("resume_os_snapshots_" + (userId || "guest"));
        if (saved) {
          try { setSnapshots(JSON.parse(saved)); } catch {}
        } else {
          setSnapshots([
            {
              id: "snap-1",
              version: "Resume V1",
              date: "May 10, 2026",
              atsScore: 58,
              jdMatchScore: 65,
              healthScore: 61,
              roleTargeted: "Software Developer",
              rawText: "John Doe. Contact: john.doe@example.com. Education: State University. Experience: Intern at TechCorp. Projects: Whiteboard.",
              completeness: 75,
              keywordCoverage: 50,
              skillsRelevance: 60,
              projectStrength: 55,
              roleMatch: 60,
              readability: 65
            },
            {
              id: "snap-2",
              version: "Resume V2",
              date: "May 25, 2026",
              atsScore: 72,
              jdMatchScore: 75,
              healthScore: 73,
              roleTargeted: "Software Developer",
              rawText: "John Doe. Contact: john.doe@example.com, github.com/johndoe. Education: State University, BS in Computer Science. Experience: Software Engineer Intern at TechCorp. Built admin dashboard used by 150+ agents. Projects: Whiteboard using React, Node.js.",
              completeness: 85,
              keywordCoverage: 68,
              skillsRelevance: 75,
              projectStrength: 70,
              roleMatch: 75,
              readability: 72
            }
          ]);
        }

        // Local daily goals
        const savedGoals = localStorage.getItem("completed_daily_goals_" + (userId || "guest"));
        if (savedGoals) {
          try {
            const parsed = JSON.parse(savedGoals);
            setCompletedGoalsCount(Object.values(parsed).filter(Boolean).length);
          } catch {}
        }
        // Local roadmap progress
        const savedRoadmap = localStorage.getItem("completed_roadmap_steps_" + (userId || "guest"));
        if (savedRoadmap) {
          try {
            const parsed = JSON.parse(savedRoadmap);
            setCompletedRoadmapStepsCount(Object.values(parsed).filter(Boolean).length);
          } catch {}
        }
        // Local interview history
        const savedInterview = localStorage.getItem("interview_history_" + (userId || "guest"));
        if (savedInterview) {
          try {
            const list = JSON.parse(savedInterview);
            if (list.length > 0) {
              const sum = list.reduce((acc: number, curr: { overallScore?: number }) => acc + (curr.overallScore || 0), 0);
              setAvgInterviewScore(Math.round(sum / list.length));
            }
          } catch {}
        }
        return;
      }

      // Load from Supabase
      const scans = await getResumeScans(userId);
      if (scans && scans.length > 0) {
        const loaded = scans.map(scan => ({
          id: scan.id!,
          version: scan.resume_name || "Resume Version",
          date: new Date(scan.created_at || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          atsScore: scan.ats_score || 0,
          jdMatchScore: scan.role_fit_score || 0,
          healthScore: scan.analysis?.healthScore || 0,
          roleTargeted: scan.analysis?.roleTargeted || "",
          rawText: scan.analysis?.rawText || "",
          completeness: scan.analysis?.completeness || 0,
          keywordCoverage: scan.analysis?.keywordCoverage || 0,
          skillsRelevance: scan.analysis?.skillsRelevance || 0,
          projectStrength: scan.analysis?.projectStrength || 0,
          roleMatch: scan.analysis?.roleMatch || 0,
          readability: scan.analysis?.readability || 0
        }));
        setSnapshots(loaded);
      } else {
        // Check local storage to migrate to Supabase
        // Check local storage to migrate to Supabase
        const saved = localStorage.getItem("resume_os_snapshots_" + (userId || "guest"));
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as Snapshot[];
            setSnapshots(parsed);
            for (const snap of parsed) {
              await addResumeScan(userId, {
                resume_name: snap.version,
                ats_score: snap.atsScore,
                role_fit_score: snap.jdMatchScore,
                analysis: {
                  healthScore: snap.healthScore,
                  roleTargeted: snap.roleTargeted,
                  rawText: snap.rawText,
                  completeness: snap.completeness,
                  keywordCoverage: snap.keywordCoverage,
                  skillsRelevance: snap.skillsRelevance,
                  projectStrength: snap.projectStrength,
                  roleMatch: snap.roleMatch,
                  readability: snap.readability
                }
              });
            }
          } catch {}
        }
      }

      // Load completed roadmap progress from DB
      const progress = await getRoadmapProgress(userId);
      const completedSteps = progress.filter(item => item.completed).length;
      setCompletedRoadmapStepsCount(completedSteps || 1);

      // Load goals & interviews from profile / local history
      const savedGoals = localStorage.getItem("completed_daily_goals_" + (userId || "guest"));
      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          setCompletedGoalsCount(Object.values(parsed).filter(Boolean).length);
        } catch {}
      }
      const savedInterview = localStorage.getItem("interview_history_" + (userId || "guest"));
      if (savedInterview) {
        try {
          const list = JSON.parse(savedInterview);
          if (list.length > 0) {
            const sum = list.reduce((acc: number, curr: { overallScore?: number }) => acc + (curr.overallScore || 0), 0);
            setAvgInterviewScore(Math.round(sum / list.length));
          }
        } catch {}
      }
    }
    loadData();
  }, [userId]);

  // Save snapshots
  const saveSnapshotsToStorage = async (updated: Snapshot[]) => {
    setSnapshots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("resume_os_snapshots_" + (userId || "guest"), JSON.stringify(updated));
    }
    if (userId) {
      const latest = updated[updated.length - 1];
      if (latest) {
        await addResumeScan(userId, {
          resume_name: latest.version,
          ats_score: latest.atsScore,
          role_fit_score: latest.jdMatchScore,
          analysis: {
            healthScore: latest.healthScore,
            roleTargeted: latest.roleTargeted,
            rawText: latest.rawText,
            completeness: latest.completeness,
            keywordCoverage: latest.keywordCoverage,
            skillsRelevance: latest.skillsRelevance,
            projectStrength: latest.projectStrength,
            roleMatch: latest.roleMatch,
            readability: latest.readability
          }
        });
        await saveAnalyticsFromScan(userId, latest);
        calculatePRIScore(userId).catch(console.error);
      }
    }
  };

  // 1. Health Score Metrics
  const latestSnapshot = snapshots[snapshots.length - 1];
  const atsScore = latestSnapshot ? latestSnapshot.atsScore : 0;
  const jdMatchScore = latestSnapshot ? latestSnapshot.jdMatchScore : 0;
  const keywordCoverage = latestSnapshot ? latestSnapshot.keywordCoverage : 0;
  const completeness = latestSnapshot ? latestSnapshot.completeness : 0;
  
  const healthScore = latestSnapshot 
    ? Math.round((atsScore + jdMatchScore + keywordCoverage + completeness) / 4) 
    : 0;

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (score >= 75) return { label: "Strong", color: "text-blue-600 bg-blue-50 border-blue-100" };
    if (score >= 50) return { label: "Average", color: "text-amber-600 bg-amber-50 border-amber-100" };
    return { label: "Needs Polish", color: "text-rose-600 bg-rose-50 border-rose-100" };
  };

  const roadmapPercent = Math.round((completedRoadmapStepsCount / 4) * 100);
  const goalsPercent = Math.round((completedGoalsCount / 4) * 100);

  const readinessScore = Math.min(
    Math.round((healthScore * 0.4) + (avgInterviewScore * 0.3) + (goalsPercent * 0.15) + (roadmapPercent * 0.15)),
    100
  );

  // Sync computed placement scores to Supabase
  useEffect(() => {
    if (userId && readinessScore > 0) {
      upsertPlacementScores(userId, {
        score: readinessScore,
        resume_score: healthScore,
        linkedin_score: 85,
        project_score: Math.round(avgInterviewScore),
        interview_score: Math.round(avgInterviewScore)
      });
    }
  }, [readinessScore, healthScore, avgInterviewScore, userId]);

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: "Placement Ready", color: "text-emerald-500" };
    if (score >= 60) return { label: "Almost Ready", color: "text-indigo-500" };
    return { label: "Needs Preparation", color: "text-amber-500" };
  };

  // 3. Version Comparison Engine
  const [olderVersionId, setOlderVersionId] = useState<string>("snap-1");
  const [newerVersionId, setNewerVersionId] = useState<string>("snap-2");
  
  interface CompareResult {
    atsScoreDelta: number;
    improvements: string[];
    regressions: string[];
    summary: string;
  }

  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const handleCompareAnalysis = async () => {
    const olderSnap = snapshots.find(s => s.id === olderVersionId);
    const newerSnap = snapshots.find(s => s.id === newerVersionId);

    if (!olderSnap || !newerSnap) {
      setCompareError("Please select two valid resume versions to compare.");
      return;
    }

    setIsComparing(true);
    setCompareError(null);
    setCompareData(null);

    const currentApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key_" + (userId || "guest")) || "" : "";

    try {
      const res = await fetch("/api/resume/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": currentApiKey
        },
        body: JSON.stringify({
          olderResumeText: olderSnap.rawText,
          newerResumeText: newerSnap.rawText
        })
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to compare versions.");
      }

      setCompareData(responseData.data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate comparison insights. Please check your network or API Key.";
      setCompareError(errMsg);
    } finally {
      setIsComparing(false);
    }
  };

  // 4. Milestones tracker
  const milestones = [
    { id: "uploaded", title: "First Resume Uploaded", desc: "Successfully scanned a CV template.", unlocked: snapshots.length >= 1 },
    { id: "ats70", title: "ATS Score Above 70", desc: "Cleared the basic recruiter line.", unlocked: snapshots.some(s => s.atsScore >= 70) },
    { id: "ats80", title: "ATS Score Above 80", desc: "Unlocked premium resume visibility.", unlocked: snapshots.some(s => s.atsScore >= 80) },
    { id: "jd85", title: "JD Match Above 85", desc: "Perfect role alignment index achieved.", unlocked: snapshots.some(s => s.jdMatchScore >= 85) },
    { id: "first_interview", title: "Completed First Interview", desc: "Passed a simulation playground session.", unlocked: avgInterviewScore > 50 || snapshots.length > 2 }, // default unlocks or from history
    { id: "solved_questions", title: "100 Interview Questions Solved", desc: "Mock practice challenges completed.", unlocked: avgInterviewScore >= 80, progress: avgInterviewScore >= 80 ? 100 : Math.round((avgInterviewScore / 80) * 100) }
  ];

  // Callback handlers for child components
  const handleSaveAtsSnapshot = (data: {
    atsScore: number;
    rawText: string;
    categories: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    roleMatch: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }) => {
    const nextVerNumber = snapshots.length + 1;
    const skillsScore = Number(data.categories.skillsRelevance?.score || 12);
    const projectScore = Number(data.categories.projectQuality?.score || 12);
    const readabilityScore = Number(data.categories.readability?.score || 8);

    const completenessScore = Math.round(
      (data.rawText.includes("Skills") || data.rawText.includes("SKILLS") ? 25 : 0) +
      (data.rawText.includes("Projects") || data.rawText.includes("PROJECTS") ? 25 : 0) +
      (data.rawText.includes("Experience") || data.rawText.includes("EXPERIENCE") ? 30 : 0) +
      (data.rawText.includes("Education") || data.rawText.includes("EDUCATION") ? 20 : 0)
    );

    const keywordScore = Number(data.categories.keywordCoverage?.score || 7);
    const keywordPct = Math.round((keywordScore / 10) * 100);

    const inferredHealthScore = Math.round((data.atsScore + jdMatchScore + keywordPct + completenessScore) / 4);

    const newSnapshot: Snapshot = {
      id: "snap-" + Date.now(),
      version: `Resume V${nextVerNumber}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      atsScore: data.atsScore,
      jdMatchScore: jdMatchScore || 70, // default if none run
      healthScore: inferredHealthScore,
      roleTargeted: String(data.roleMatch.targetRole || "Software Developer"),
      rawText: data.rawText,
      completeness: completenessScore,
      keywordCoverage: keywordPct,
      skillsRelevance: Math.round((skillsScore / 15) * 100),
      projectStrength: Math.round((projectScore / 15) * 100),
      roleMatch: Number(data.roleMatch.matchPercentage || 70),
      readability: Math.round((readabilityScore / 10) * 100)
    };

    const updated = [...snapshots, newSnapshot];
    saveSnapshotsToStorage(updated);
    
    if (onScoreUpdate) {
      onScoreUpdate(data.atsScore);
    }
  };

  const handleSaveJdSnapshot = (data: {
    overallScore: number;
    competitiveness: string;
    competitivenessReasoning: string;
  }) => {
    if (snapshots.length === 0) return;
    
    // Update the latest version snapshot's JD match score and re-compute health score
    const updated = snapshots.map((snap, idx) => {
      if (idx === snapshots.length - 1) {
        const inferredHealthScore = Math.round((snap.atsScore + data.overallScore + snap.keywordCoverage + snap.completeness) / 4);
        return {
          ...snap,
          jdMatchScore: data.overallScore,
          healthScore: inferredHealthScore
        };
      }
      return snap;
    });

    saveSnapshotsToStorage(updated);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = snapshots.filter(item => item.id !== id);
    saveSnapshotsToStorage(updated);
  };

  const restoreHistoryItem = (snap: Snapshot) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_analyzed_resume_text_" + (userId || "guest"), snap.rawText);
      localStorage.setItem("last_analyzed_resume_name_" + (userId || "guest"), snap.version);
      localStorage.setItem("last_analyzed_resume_timestamp_" + (userId || "guest"), new Date().toISOString());
      localStorage.removeItem("jd_match_history_" + (userId || "guest"));
      localStorage.removeItem("resume_enhance_result_" + (userId || "guest"));
      localStorage.removeItem("resume_builder_cache_" + (userId || "guest"));
      window.dispatchEvent(new Event("active_resume_updated"));
      alert(`Success! "${snap.version}" has been restored as the active resume. Scans will now reference this text.`);
    }
  };

  const duplicateHistoryItem = (snap: Snapshot) => {
    const nextVerNumber = snapshots.length + 1;
    const duplicated: Snapshot = {
      ...snap,
      id: "snap-" + Date.now(),
      version: `Resume V${nextVerNumber} (Copy)`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    const updated = [...snapshots, duplicated];
    saveSnapshotsToStorage(updated);
  };

  // Custom visual SVG Trend line chart drawing
  const renderTrendChart = () => {
    if (snapshots.length < 2) {
      return (
        <div className="h-44 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 font-bold text-xs">
          Analyze more resume versions to see score trends!
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 25;
    
    const points = snapshots.map((s, idx) => {
      const x = padding + (idx / (snapshots.length - 1)) * (width - 2 * padding);
      const y = height - padding - (s.atsScore / 100) * (height - 2 * padding);
      return { x, y, score: s.atsScore, label: s.version };
    });

    const d = points.reduce((acc, p, idx) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    return (
      <div className="space-y-4">
        <div className="relative bg-slate-50 p-6 border border-slate-200 rounded-3xl overflow-x-auto">
          <svg className="w-full min-w-[400px]" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="2" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="2" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Trend line */}
            <path d={d} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Dots & Labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="cursor-pointer hover:r-8 transition-all" />
                <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-black fill-slate-800 font-sans">{p.score}%</text>
                <text x={p.x} y={height - 8} textAnchor="middle" className="text-[9px] font-bold fill-slate-400 font-sans">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Tab routing redirect mapping
  const handleChildTabChange = (targetTab: string) => {
    if (targetTab === "resume" || targetTab === "ats") {
      setTab("ats");
    } else if (targetTab === "enhancer") {
      setTab("enhancer");
    } else if (targetTab === "jd-match" || targetTab === "jdMatcher") {
      setTab("jd-match");
    } else if (targetTab === "builder") {
      setTab("builder");
    } else {
      setTab("overview");
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* HUB INNER TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "overview", label: "Resume OS Hub", icon: <Activity className="w-4 h-4" /> },
          { id: "ats", label: "ATS Resume Analyzer", icon: <FileCheck className="w-4 h-4" /> },
          { id: "jd-match", label: "JD Matcher", icon: <FileSearch className="w-4 h-4" /> },
          { id: "enhancer", label: "AI Resume Enhancer", icon: <Sparkles className="w-4 h-4" /> },
          { id: "builder", label: "Resume Builder", icon: <FileText className="w-4 h-4" /> },
          { id: "comparison", label: "Resume Comparison", icon: <ArrowLeftRight className="w-4 h-4" /> },
          { id: "analytics-route", label: "Resume Analytics", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "history", label: "Resume History", icon: <History className="w-4 h-4" /> }
        ].map(navItem => (
          <button
            key={navItem.id}
            onClick={() => {
              if (navItem.id === "analytics-route") {
                router.push("/dashboard/resume-analytics");
              } else {
                setTab(navItem.id);
              }
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border",
              activeTab === navItem.id
                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
            )}
          >
            {navItem.icon}
            <span>{navItem.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* OVERVIEW LANDING SCREEN */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            {/* Header section */}
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Flame className="w-3.5 h-3.5 fill-indigo-100" />
                CENTRALIZED CAREER HUB
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                Resume OS Command Center
              </h1>
              <p className="text-slate-500 font-medium text-base leading-relaxed">
                Unlock explainable ATS audits, dynamic keyword analysis, JD tailoring, visual improvement graphs, and placement readiness timelines all in one centralized hub.
              </p>
            </div>

            {/* Health Score Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Resume Health Score Gauge */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resume Health Score</p>
                  <p className="text-2xl font-black text-slate-900">{healthScore}/100</p>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block", getHealthStatus(healthScore).color)}>
                    {getHealthStatus(healthScore).label}
                  </span>
                </div>
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                    <circle cx="32" cy="32" r="26" className="text-indigo-600" strokeWidth="6" stroke="currentColor" fill="transparent"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - healthScore / 100)} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-800">{healthScore}%</span>
                </div>
              </div>

              {/* Latest Resume Version */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Version</p>
                <p className="text-2xl font-black text-slate-900">{latestSnapshot ? latestSnapshot.version : "No version"}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">Target: {latestSnapshot ? latestSnapshot.roleTargeted : "N/A"}</p>
              </div>

              {/* Recent ATS Score */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Most Recent ATS Score</p>
                <p className="text-3xl font-black text-indigo-600">{atsScore}%</p>
                <p className="text-[10px] text-slate-400 font-bold">From: {latestSnapshot ? latestSnapshot.date : "N/A"}</p>
              </div>

              {/* Recent JD Match Score */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent JD Match Score</p>
                <p className="text-3xl font-black text-teal-600">{jdMatchScore}%</p>
                <p className="text-[10px] text-slate-400 font-bold">Keyword coverage: {keywordCoverage}%</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 font-display">Resume OS Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: "Analyze Resume", tab: "ats", desc: "Run ATS audit checks", color: "hover:border-indigo-400 hover:bg-indigo-50/20" },
                  { label: "Match With JD", tab: "jd-match", desc: "Compare against job lists", color: "hover:border-teal-400 hover:bg-teal-50/20" },
                  { label: "Improve Resume", tab: "enhancer", desc: "Rewrite weak accomplishments", color: "hover:border-purple-400 hover:bg-purple-50/20" },
                  { label: "Build Resume", tab: "builder", desc: "Create high-fidelity LaTeX sources", color: "hover:border-orange-400 hover:bg-orange-50/20" },
                  { label: "Compare Versions", tab: "comparison", desc: "Audit version differences", color: "hover:border-emerald-400 hover:bg-emerald-50/20" },
                  { label: "Resume Analytics", tab: "analytics-route", desc: "Track performance growth", color: "hover:border-rose-400 hover:bg-rose-50/20" }
                ].map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (act.tab === "analytics-route") {
                        router.push("/dashboard/resume-analytics");
                      } else {
                        setTab(act.tab);
                      }
                    }}
                    className={cn("p-6 border border-slate-200 rounded-3xl flex flex-col justify-between items-start text-left transition-all group cursor-pointer", act.color)}
                  >
                    <div className="space-y-1">
                      <strong className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{act.label}</strong>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">{act.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform mt-4 self-end" />
                  </button>
                ))}
              </div>
            </div>

            {/* Placement Readiness Score & Milestones */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Placement Readiness Gauge */}
              <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 font-display">Placement Readiness Index</h3>
                <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                      <circle cx="48" cy="48" r="38" className="text-indigo-600" strokeWidth="8" stroke="currentColor" fill="transparent"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - readinessScore / 100)} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-slate-800">{readinessScore}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Readiness Status</span>
                    <strong className={cn("text-lg font-black block mt-0.5", getReadinessStatus(readinessScore).color)}>
                      {getReadinessStatus(readinessScore).label}
                    </strong>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Goal: Unlock milestones and mock interviews to hit 80%+ ready index.</p>
                  </div>
                </div>

                {/* Placement Timeline */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Placement Readiness Timeline</p>
                  <div className="relative border-l-2 border-indigo-100 ml-3 pl-6 space-y-6 py-2">
                    {[
                      { title: "Resume Quality", value: `${healthScore}/100`, status: healthScore >= 75 ? "Passed" : "In Progress", unlocked: healthScore > 0 },
                      { title: "Interview Performance", value: `${avgInterviewScore}%`, status: avgInterviewScore >= 70 ? "Passed" : "Needs Mock", unlocked: avgInterviewScore > 50 },
                      { title: "Job Description Match", value: `${jdMatchScore}%`, status: jdMatchScore >= 80 ? "Passed" : "Needs Match", unlocked: jdMatchScore > 0 },
                      { title: "Learning Roadmaps Progress", value: `${roadmapPercent}%`, status: roadmapPercent >= 75 ? "Passed" : "Needs Study", unlocked: completedRoadmapStepsCount > 0 }
                    ].map((step, sIdx) => (
                      <div key={sIdx} className="relative group">
                        <div className={cn(
                          "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow flex items-center justify-center",
                          step.unlocked ? "bg-indigo-600" : "bg-slate-300"
                        )} />
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{step.title}</h4>
                          <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            <span>Score: <strong className="text-slate-600">{step.value}</strong></span>
                            <span>•</span>
                            <span className={cn(step.status === "Passed" ? "text-emerald-500 font-black" : "text-slate-400")}>{step.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestones Card grid */}
              <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 font-display">Career Milestone Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {milestones.map((ms, msIdx) => (
                    <div
                      key={msIdx}
                      className={cn(
                        "p-4 border rounded-2xl flex gap-3 transition-all",
                        ms.unlocked 
                          ? "bg-indigo-50/40 border-indigo-200 text-indigo-900" 
                          : "bg-slate-50 border-slate-200 opacity-60"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-inner shrink-0 border border-slate-100">
                        {ms.unlocked ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Award className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <strong className="text-xs font-black text-slate-800 leading-tight block">{ms.title}</strong>
                        <p className="text-[10px] text-slate-400 font-bold leading-normal">{ms.desc}</p>
                        {ms.progress !== undefined && (
                          <div className="w-24 bg-slate-200 h-1 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${ms.progress}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ATS RESUME ANALYZER TAB */}
        {activeTab === "ats" && (
          <motion.div
            key="ats"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <AtsResumeAnalyzer onScoreUpdate={onScoreUpdate} onTabChange={handleChildTabChange} onAnalysisComplete={handleSaveAtsSnapshot} />
          </motion.div>
        )}

        {/* JD MATCHER TAB */}
        {activeTab === "jd-match" && (
          <motion.div
            key="jd-match"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <JdMatchAnalyzer onScoreUpdate={onScoreUpdate} onTabChange={handleChildTabChange} onMatchComplete={handleSaveJdSnapshot} />
          </motion.div>
        )}

        {/* AI RESUME ENHANCER TAB */}
        {activeTab === "enhancer" && (
          <motion.div
            key="enhancer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <AiResumeEnhancer onScoreUpdate={onScoreUpdate} onTabChange={handleChildTabChange} userId={userId} />
          </motion.div>
        )}

        {/* RESUME BUILDER TAB */}
        {activeTab === "builder" && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <ResumeBuilder onScoreUpdate={onScoreUpdate} onTabChange={handleChildTabChange} />
          </motion.div>
        )}

        {/* RESUME COMPARISON TAB */}
        {activeTab === "comparison" && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ArrowLeftRight className="w-3.5 h-3.5 fill-indigo-100" />
                Resume Version Comparison
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                Differential Version Audit
              </h1>
              <p className="text-slate-500 font-medium text-base">
                Cross-reference technical scores, project details, keyword density levels, and call Gemini API to run intelligent AI change audits and regression checks.
              </p>
            </div>

            {/* Selection dropdowns row */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 font-display">Compare Snapshots</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Older Resume Version</label>
                  <select
                    value={olderVersionId}
                    onChange={(e) => setOlderVersionId(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {snapshots.map(s => (
                      <option key={s.id} value={s.id}>{s.version} ({s.date})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Newer Resume Version</label>
                  <select
                    value={newerVersionId}
                    onChange={(e) => setNewerVersionId(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {snapshots.map(s => (
                      <option key={s.id} value={s.id}>{s.version} ({s.date})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCompareAnalysis}
                disabled={isComparing || olderVersionId === newerVersionId}
                className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isComparing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing differences (calling Gemini)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Difference Analysis</span>
                  </>
                )}
              </button>

              {olderVersionId === newerVersionId && (
                <p className="text-[10px] text-amber-600 font-bold text-center">
                  ⚠️ Select two different resume versions to compare.
                </p>
              )}

              {compareError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-start gap-2.5 text-xs font-bold leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5">Execution Failed</strong>
                    {compareError}
                  </div>
                </div>
              )}
            </div>

            {/* Score Delta and Side-by-Side metrics table */}
            {snapshots.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Metric Differences table */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h4 className="text-lg font-black text-slate-900 font-display">Side-by-Side Comparison</h4>
                  
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Metric Category</th>
                          <th className="px-6 py-4">Older Version</th>
                          <th className="px-6 py-4">Newer Version</th>
                          <th className="px-6 py-4 text-right">Delta Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {[
                          {
                            label: "ATS Score",
                            older: (snapshots.find(s => s.id === olderVersionId)?.atsScore || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.atsScore || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.atsScore || 0) - (snapshots.find(s => s.id === olderVersionId)?.atsScore || 0),
                            isPercent: true
                          },
                          {
                            label: "JD Match Score",
                            older: (snapshots.find(s => s.id === olderVersionId)?.jdMatchScore || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.jdMatchScore || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.jdMatchScore || 0) - (snapshots.find(s => s.id === olderVersionId)?.jdMatchScore || 0),
                            isPercent: true
                          },
                          {
                            label: "Keyword Coverage",
                            older: (snapshots.find(s => s.id === olderVersionId)?.keywordCoverage || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.keywordCoverage || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.keywordCoverage || 0) - (snapshots.find(s => s.id === olderVersionId)?.keywordCoverage || 0),
                            isPercent: true
                          },
                          {
                            label: "Resume Completeness",
                            older: (snapshots.find(s => s.id === olderVersionId)?.completeness || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.completeness || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.completeness || 0) - (snapshots.find(s => s.id === olderVersionId)?.completeness || 0),
                            isPercent: true
                          },
                          {
                            label: "Skills Relevance",
                            older: (snapshots.find(s => s.id === olderVersionId)?.skillsRelevance || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.skillsRelevance || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.skillsRelevance || 0) - (snapshots.find(s => s.id === olderVersionId)?.skillsRelevance || 0),
                            isPercent: true
                          },
                          {
                            label: "Project Quality Strength",
                            older: (snapshots.find(s => s.id === olderVersionId)?.projectStrength || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.projectStrength || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.projectStrength || 0) - (snapshots.find(s => s.id === olderVersionId)?.projectStrength || 0),
                            isPercent: true
                          },
                          {
                            label: "Readability Score",
                            older: (snapshots.find(s => s.id === olderVersionId)?.readability || 0) + "%",
                            newer: (snapshots.find(s => s.id === newerVersionId)?.readability || 0) + "%",
                            delta: (snapshots.find(s => s.id === newerVersionId)?.readability || 0) - (snapshots.find(s => s.id === olderVersionId)?.readability || 0),
                            isPercent: true
                          }
                        ].map((metric, mIdx) => (
                          <tr key={mIdx}>
                            <td className="px-6 py-4 text-slate-800">{metric.label}</td>
                            <td className="px-6 py-4">{metric.older}</td>
                            <td className="px-6 py-4 text-indigo-600">{metric.newer}</td>
                            <td className="px-6 py-4 text-right">
                              {metric.delta > 0 ? (
                                <span className="text-emerald-500 font-black">+{metric.delta} points</span>
                              ) : metric.delta < 0 ? (
                                <span className="text-red-500 font-black">{metric.delta} points</span>
                              ) : (
                                <span className="text-slate-400">0 change</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Change analysis side insights */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Visual Improvement Timeline trend */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-sm font-black text-slate-900 font-display">Resume Improvement Trend</h4>
                    {renderTrendChart()}
                  </div>

                  {/* AI Change Analysis & Regression alert box */}
                  <AnimatePresence mode="wait">
                    {compareData && (
                      <motion.div
                        key="compare-results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                        {/* Summary overview */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">AI comparison summary</span>
                            <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                              Score change: {compareData.atsScoreDelta >= 0 ? `+${compareData.atsScoreDelta}` : compareData.atsScoreDelta}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                            {compareData.summary}
                          </p>
                        </div>

                        {/* Improvements list */}
                        <div className="bg-emerald-50/50 border border-emerald-200 p-6 rounded-3xl space-y-3">
                          <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">✓ Version Upgrades (Improvements)</h5>
                          <div className="space-y-2">
                            {compareData.improvements.map((imp, impIdx) => (
                              <p key={impIdx} className="text-xs text-slate-600 font-bold leading-normal flex items-start gap-1.5">
                                <span className="text-emerald-500 font-black">✓</span>
                                <span>{imp}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Regressions list */}
                        {compareData.regressions.length > 0 && (
                          <div className="bg-red-50/60 border border-red-200 p-6 rounded-3xl space-y-3">
                            <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                              ⚠️ Regressions & Drop Detection
                            </h5>
                            <div className="space-y-2">
                              {compareData.regressions.map((reg, regIdx) => (
                                <p key={regIdx} className="text-xs text-slate-600 font-bold leading-normal flex items-start gap-1.5">
                                  <span className="text-red-500 font-black">✗</span>
                                  <span>{reg}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* RESUME HISTORY TAB */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <History className="w-3.5 h-3.5 fill-indigo-100" />
                Resume Version Database
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                Resume Version History
              </h1>
              <p className="text-slate-500 font-medium text-base">
                Restore older resume templates to the active workspace, create copy iterations, and track scores across time.
              </p>
            </div>

            {/* History Table */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 font-display">Snapshot History Center</h3>
              
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Upload Date</th>
                      <th className="px-6 py-4">Target Role</th>
                      <th className="px-6 py-4">ATS Score</th>
                      <th className="px-6 py-4">JD Match</th>
                      <th className="px-6 py-4">Health Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {snapshots.map(snap => (
                      <tr key={snap.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-900">{snap.version}</td>
                        <td className="px-6 py-4 text-slate-500">{snap.date}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-[150px] truncate">{snap.roleTargeted}</td>
                        <td className="px-6 py-4">
                          <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                            {snap.atsScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-1.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-600 rounded">
                            {snap.jdMatchScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-600 rounded">
                            {snap.healthScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => restoreHistoryItem(snap)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                            title="Set as active workspace resume"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => duplicateHistoryItem(snap)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                            title="Duplicate version"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => deleteHistoryItem(snap.id, e)}
                            className="p-1.5 hover:text-red-500 text-slate-400 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Delete version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {snapshots.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-bold">
                          No resume version history found. Complete an ATS resume scan to save snapshots.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
