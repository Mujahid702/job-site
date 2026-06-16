"use client";

import React, { useState, useEffect } from "react";
import { enqueueTask, startWorker } from "@/lib/queue";
import { motion, AnimatePresence } from "framer-motion";
import { saveAnalyticsSnapshot } from "@/lib/db/resume-analytics";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileText,
  Sliders,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ArrowLeftRight,
  Info,
  Lock,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cyber Security Analyst",
  "Business Analyst"
];

interface EnhancedVersion {
  title: string;
  content: string;
  score: number;
  rating: string;
  explanations: string[];
}

interface EnhanceResult {
  originalScore: number;
  originalRating: string;
  originalReasoning: string;
  versions: {
    version1: EnhancedVersion;
    version2: EnhancedVersion;
    version3: EnhancedVersion;
  };
  weakVerbs: {
    verb: string;
    suggestions: string[];
  }[];
  impactQuantification: {
    before: string;
    after: string;
    explanation: string;
  };
}

interface AiResumeEnhancerProps {
  onScoreUpdate?: (score: number) => void;
  onTabChange?: (tab: string) => void;
  userId?: string | null;
}

export default function AiResumeEnhancer({ onScoreUpdate, onTabChange, userId }: AiResumeEnhancerProps) {
  const [inputType, setInputType] = useState<"bullet" | "project" | "experience">("bullet");
  const [content, setContent] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [customRole, setCustomRole] = useState<string>("");
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceStep, setEnhanceStep] = useState<string>("");
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [activeVersionKey, setActiveVersionKey] = useState<"version1" | "version2" | "version3">("version1");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [explanationExpanded, setExplanationExpanded] = useState<boolean>(true);
  
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  
  useEffect(() => {
    if (!activeTaskId) return;

    const handleTaskUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedTask = customEvent.detail;
      if (updatedTask.id === activeTaskId) {
        setTaskProgress(updatedTask.progress);
        if (updatedTask.status === "PROCESSING") {
          setEnhanceStep(`Enhancing Content: ${updatedTask.progress}%`);
        } else if (updatedTask.status === "PENDING") {
          setEnhanceStep("Queued (Waiting for background thread)...");
        } else if (updatedTask.status === "COMPLETED") {
          setIsEnhancing(false);
          const resData = updatedTask.result.data || updatedTask.result;
          setResult(resData);
          setActiveVersionKey("version1");
          
          if (onScoreUpdate) {
            const avgScore = Math.round(
              (resData.versions.version1.score +
                resData.versions.version2.score +
                resData.versions.version3.score) /
                3
            );
            onScoreUpdate(avgScore);
          }

          if (userId && resData?.versions?.version1) {
            const bestVersion = resData.versions.version1;
            saveAnalyticsSnapshot(userId, {
              resume_id: null,
              ats_score: bestVersion.score,
              role_fit_score: 80,
              target_role: targetRole === "Other" ? customRole : targetRole,
              keyword_score: 85,
              format_score: 90,
              readability_score: 85,
              skills_score: 80,
              projects_score: 80,
              experience_score: 80,
              analysis_date: new Date().toISOString()
            }).then(() => calculatePRIScore(userId).catch(console.error)).catch(err => console.error("Error saving enhancer snapshot:", err));
          }
          
          setActiveTaskId(null);
        } else if (updatedTask.status === "FAILED") {
          setIsEnhancing(false);
          setErrorMsg(updatedTask.error || "Enhancement failed. Please try again.");
          setActiveTaskId(null);
        }
      }
    };

    window.addEventListener("bb_task_updated", handleTaskUpdate);
    return () => {
      window.removeEventListener("bb_task_updated", handleTaskUpdate);
    };
  }, [activeTaskId, onScoreUpdate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey);
    }
  }, []);

  const handleEnhance = async () => {
    if (!content.trim()) {
      setErrorMsg("Please provide some text to enhance.");
      return;
    }

    setIsEnhancing(true);
    setErrorMsg(null);
    setResult(null);
    setEnhanceStep("Queuing enhance task...");
    setTaskProgress(0);

    try {
      const payload = {
        inputType,
        content,
        targetRole: targetRole === "Other" ? customRole : targetRole
      };

      const task = enqueueTask("enhance", payload);
      setActiveTaskId(task.id);
      startWorker();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to queue enhance task.");
      setIsEnhancing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getRatingBadgeColor = (rating: string) => {
    const r = rating.toLowerCase();
    if (r === "excellent") return "bg-emerald-500 text-white";
    if (r === "strong") return "bg-blue-500 text-white";
    if (r === "average") return "bg-amber-500 text-white";
    return "bg-rose-500 text-white";
  };

  const highlightWeakVerbs = (text: string, weakVerbs: { verb: string }[]) => {
    if (!weakVerbs || weakVerbs.length === 0) return text;
    let highlighted = text;
    weakVerbs.forEach(({ verb }) => {
      const regex = new RegExp(`\\b(${verb})\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="bg-amber-100 text-amber-900 px-1 rounded font-bold border border-amber-200">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
          AI Enhancement Suite
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          AI Resume Enhancer & Bullet Rewriter
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Transform weak resume statements, unstructured project drafts, and thin experience bullet points into high-impact, recruiter-friendly accomplishments optimized for applicant tracking systems.
        </p>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Draft Input & Settings */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-slate-900 font-display">Draft Builder</h3>

          {/* Input Method Tabs */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Input Method
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              {[
                { id: "bullet", label: "Single Bullet" },
                { id: "project", label: "Project Draft" },
                { id: "experience", label: "Experience Block" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-select-${tab.id}`}
                  onClick={() => setInputType(tab.id as any)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    inputType === tab.id
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Role Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Target Role Alignment
            </label>
            <div className="grid grid-cols-1 gap-3">
              <select
                id="role-alignment-select"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  if (e.target.value !== "Other") setCustomRole("");
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="Other">Custom Role...</option>
              </select>

              {targetRole === "Other" && (
                <input
                  type="text"
                  id="custom-role-input"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Mobile Developer, Product Owner"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              )}
            </div>
          </div>

          {/* Draft Input Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {inputType === "bullet" && "Paste Weak Bullet Point"}
              {inputType === "project" && "Describe Your Project Draft"}
              {inputType === "experience" && "Paste Experience Section Details"}
            </label>
            <textarea
              id="draft-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                inputType === "bullet"
                  ? "e.g. Worked on a web application using React."
                  : inputType === "project"
                    ? "e.g. Made an ML project using Python that detects images. Used flask to show it on a site."
                    : "e.g. Developed features for clients. Worked with teams to deploy code. Helped users with bugs."
              }
              rows={6}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <button
            id="enhance-submit-button"
            onClick={handleEnhance}
            disabled={isEnhancing || !content.trim()}
            className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isEnhancing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{enhanceStep || "Analyzing details..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Optimize Content Now</span>
              </>
            )}
          </button>

          {/* Local API Key Info */}
          {!apiKey && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-[10px] text-amber-700 font-bold leading-normal">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <div>
                No custom Gemini API key configured. Utilizing default environment key. Add a key in the Admin settings if you hit rate limits.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-start gap-2.5 text-xs font-bold leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Execution Failed</strong>
                {errorMsg}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Rewritten Output / Feedback Panels */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {isEnhancing && (
              <motion.div
                key="loading-enhancer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-indigo-50/50 p-12 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center justify-center text-center space-y-6 min-h-[450px]"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800 text-lg font-display">Enhancement Engine Running</h4>
                  <p className="text-sm text-indigo-700 font-black px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full inline-block animate-pulse">
                    {enhanceStep}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-semibold max-w-sm">
                  Rewriting sentences to follow ATS formats, scoring recruiter impact, and evaluating action verbs...
                </p>
              </motion.div>
            )}

            {!isEnhancing && !result && (
              <motion.div
                key="empty-enhancer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 p-12 rounded-[2.5rem] border border-slate-200/50 flex flex-col items-center justify-center text-center space-y-5 min-h-[450px]"
              >
                <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center shadow-sm">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-lg font-display">Awaiting Input Content</h4>
                  <p className="text-sm text-slate-400 font-semibold max-w-sm mx-auto">
                    Type or paste a draft bullet point, project, or work experience on the left to see structured ATS evaluations and rewrites.
                  </p>
                </div>
              </motion.div>
            )}

            {!isEnhancing && result && (
              <motion.div
                key="result-enhancer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Score Comparison Panel */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black text-slate-900 font-display">Bullet Strength Meter</h4>
                    
                    {/* Compare Mode Toggle */}
                    <button
                      id="compare-mode-toggle"
                      onClick={() => setCompareMode(!compareMode)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                        compareMode
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{compareMode ? "Output View" : "Compare Mode"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {/* Original Score */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 relative">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Original Draft</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-700">{result.originalScore}</span>
                        <span className="text-xs font-black text-slate-400">/100</span>
                      </div>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block", getRatingBadgeColor(result.originalRating))}>
                        {result.originalRating}
                      </span>
                    </div>

                    {/* Version 1 Score */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 relative">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{result.versions.version1.title}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-600">{result.versions.version1.score}</span>
                        <span className="text-xs font-black text-slate-400">/100</span>
                      </div>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block", getRatingBadgeColor(result.versions.version1.rating))}>
                        {result.versions.version1.rating}
                      </span>
                    </div>

                    {/* Version 2 Score */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 relative">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{result.versions.version2.title}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-600">{result.versions.version2.score}</span>
                        <span className="text-xs font-black text-slate-400">/100</span>
                      </div>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block", getRatingBadgeColor(result.versions.version2.rating))}>
                        {result.versions.version2.rating}
                      </span>
                    </div>

                    {/* Version 3 Score */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 relative">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{result.versions.version3.title}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-600">{result.versions.version3.score}</span>
                        <span className="text-xs font-black text-slate-400">/100</span>
                      </div>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block", getRatingBadgeColor(result.versions.version3.rating))}>
                        {result.versions.version3.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-500 leading-relaxed">
                    <strong className="text-slate-800 font-bold block mb-1">Score Analysis:</strong>
                    {result.originalReasoning}
                  </div>
                </div>

                {/* Compare Mode view */}
                {compareMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original side */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Draft</span>
                        <span className="text-xs font-black text-slate-500">Score: {result.originalScore}</span>
                      </div>
                      <div className="text-sm text-slate-700 font-medium leading-relaxed min-h-[120px] whitespace-pre-wrap">
                        {highlightWeakVerbs(content, result.weakVerbs)}
                      </div>
                      <div className="text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                        ⚠️ Weak action verbs highlighted in yellow.
                      </div>
                    </div>

                    {/* Rewritten side */}
                    <div className="bg-white p-6 rounded-[2rem] border border-indigo-200 shadow-lg shadow-indigo-50/20 space-y-4 relative">
                      <div className="flex justify-between items-center pb-3 border-b border-indigo-50">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {result.versions[activeVersionKey].title}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] bg-indigo-500 text-white rounded font-bold uppercase tracking-wider">
                            Active
                          </span>
                        </div>
                        <span className="text-xs font-black text-indigo-600">
                          Score: {result.versions[activeVersionKey].score}
                        </span>
                      </div>
                      <div className="text-sm text-slate-800 font-semibold leading-relaxed min-h-[120px] whitespace-pre-wrap">
                        {result.versions[activeVersionKey].content}
                      </div>

                      {/* Version Selector for comparison */}
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        {(["version1", "version2", "version3"] as const).map((key) => (
                          <button
                            key={key}
                            onClick={() => setActiveVersionKey(key)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                              activeVersionKey === key
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {key === "version1" && "Version 1"}
                            {key === "version2" && "Version 2"}
                            {key === "version3" && "Version 3"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Result Panels (Tabs view) */
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                    {/* Rewritten Versions Header tabs */}
                    <div className="border-b border-slate-100 flex flex-wrap gap-2 pb-4">
                      {(["version1", "version2", "version3"] as const).map((key) => (
                        <button
                          key={key}
                          id={`version-tab-select-${key}`}
                          onClick={() => setActiveVersionKey(key)}
                          className={cn(
                            "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                            activeVersionKey === key
                              ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                          )}
                        >
                          {result.versions[key].title}
                        </button>
                      ))}
                    </div>

                    {/* Active Version Details */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative group">
                        {/* Copy Button */}
                        <button
                          id={`copy-button-${activeVersionKey}`}
                          onClick={() => handleCopy(result.versions[activeVersionKey].content, activeVersionKey)}
                          className="absolute top-4 right-4 p-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-sm group-hover:scale-105"
                          title="Copy to Clipboard"
                        >
                          {copiedKey === activeVersionKey ? (
                            <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-4 pr-10">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Enhanced Output
                            </span>
                            <span className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider", getScoreColor(result.versions[activeVersionKey].score))}>
                              Score: {result.versions[activeVersionKey].score} ({result.versions[activeVersionKey].rating})
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {result.versions[activeVersionKey].content}
                          </p>
                        </div>
                      </div>

                      {/* Explanation Engine Accordion */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setExplanationExpanded(!explanationExpanded)}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 text-left select-none font-bold text-xs text-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span>Why This Version is Stronger</span>
                          </span>
                          {explanationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <AnimatePresence>
                          {explanationExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-white border-t border-slate-100"
                            >
                              <div className="p-5 space-y-2">
                                {result.versions[activeVersionKey].explanations.map((reason, rIdx) => (
                                  <div key={rIdx} className="flex items-start gap-2 text-xs font-bold text-slate-600 leading-relaxed">
                                    <span className="text-emerald-500 font-black">✓</span>
                                    <span>{reason.replace(/^✓\s*/, "")}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Row grid: Action Verb Analysis & Impact Quantification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Action Verb Analysis Panel */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                    <h4 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                      Action Verb Analysis
                    </h4>

                    {result.weakVerbs.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                          We detected weak, passive, or common verbs in your draft and suggested stronger alternatives:
                        </p>
                        <div className="space-y-3">
                          {result.weakVerbs.map(({ verb, suggestions }, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-red-500 line-through">{verb}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-black text-slate-700">Better Choices:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {suggestions.map((sug, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:border-indigo-400 transition-colors">
                                    {sug}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 font-black">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        No weak action verbs detected! Outstanding word choice.
                      </div>
                    )}
                  </div>

                  {/* Impact Quantification Engine Panel */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                    <h4 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Impact Quantification
                    </h4>

                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Quantified bullets grab the attention of tech recruiters. Look at how this statement can be enhanced with placeholders:
                      </p>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Before (Draft)</span>
                          <p className="text-xs text-slate-500 font-medium">{result.impactQuantification.before}</p>
                        </div>

                        <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
                          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-1">After (Quantified Pattern)</span>
                          <p className="text-xs text-indigo-900 font-bold leading-relaxed">{result.impactQuantification.after}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 leading-relaxed">
                        <strong className="text-slate-700 block mb-0.5">Quantifier Pro Tip:</strong>
                        {result.impactQuantification.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
