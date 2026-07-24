"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getJdMatches, addJdMatch } from "@/lib/db/resume";
import { getScopedKey } from "@/lib/security/LocalStorage";
import RemainingUsageBadge from "./RemainingUsageBadge";
import UpgradeBanner from "./UpgradeBanner";

import { enqueueTask, startWorker, fileToBase64 } from "@/lib/queue";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  UploadCloud,
  FileText,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Info,
  Calendar,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileSearch,
  Search,
  Lock,
  Layers,
  Heart,
  History,
  Cpu
} from "lucide-react";
import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import { cn } from "@/lib/utils";

interface MatchBreakdownItem {
  score: number;
  explanation: string;
  detected?: string[];
  missing?: string[];
}

interface MatchResult {
  overallScore: number;
  competitiveness: string;
  competitivenessReasoning: string;
  breakdown: {
    skillsMatch: MatchBreakdownItem;
    keywordsMatch: MatchBreakdownItem;
    experienceMatch: MatchBreakdownItem;
    educationMatch: MatchBreakdownItem;
    projectRelevance: MatchBreakdownItem;
    atsAlignment: MatchBreakdownItem;
  };
  keywordAnalysis: {
    coverage: number;
    keywords: {
      word: string;
      present: boolean;
    }[];
  };
  missingSkills: {
    skill: string;
    priority: string; // "High" | "Medium" | "Low"
  }[];
  projectsRelevance: {
    title: string;
    score: number;
    explanation: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  recruiterPerspective: {
    helps: string[];
    concerns: string[];
  };
  roadmap: {
    improvement: string;
    impact: string; // "High" | "Medium" | "Low"
  }[];
}

interface OptimizationResult {
  missingKeywords: string[];
  optimizedBullets: {
    before: string;
    after: string;
    explanation: string;
  }[];
  tailoredSummary: string;
  atsRecommendations: string[];
}

interface HistoryItem {
  id: string;
  date: string;
  jdTitle: string;
  company: string;
  score: number;
  resumeText: string;
  jdText: string;
  result: MatchResult;
}

interface JdMatchAnalyzerProps {
  onScoreUpdate?: (score: number) => void;
  onTabChange?: (tab: string) => void;
  onMatchComplete?: (data: {
    overallScore: number;
    competitiveness: string;
    competitivenessReasoning: string;
  }) => void;
}

export default function JdMatchAnalyzer({ onScoreUpdate, onTabChange, onMatchComplete }: JdMatchAnalyzerProps) {
  const { savedJobs } = useSavedJobs();

  const [userId, setUserId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

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
  
  // Input settings states
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "saved">("upload");
  const [jdInputMode, setJdInputMode] = useState<"paste" | "url" | "platform">("paste");
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState<string>("");
  const [jdUrl, setJdUrl] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  
  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeStep, setAnalyzeStep] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  
  const [result, setResult] = useState<MatchResult | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cached resume metadata state
  const [cachedResumeName, setCachedResumeName] = useState<string>("");
  const [cachedResumeTimestamp, setCachedResumeTimestamp] = useState<string>("");
  const [jdValidationError, setJdValidationError] = useState<string | null>(null);

  // Synchronize resume scan cache
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedText = localStorage.getItem(getScopedKey("last_analyzed_resume_text", userId));
      if (savedText) {
        setResumeInputMode("saved");
        setCachedResumeName(localStorage.getItem(getScopedKey("last_analyzed_resume_name", userId)) || "Resume");
        setCachedResumeTimestamp(localStorage.getItem(getScopedKey("last_analyzed_resume_timestamp", userId)) || "");
      } else {
        setResumeInputMode("upload");
        setCachedResumeName("");
        setCachedResumeTimestamp("");
      }
    }
  }, [userId]);

  useEffect(() => {
    const handleResumeUpdate = () => {
      setResult(null);
      setOptimizeResult(null);
      if (typeof window !== "undefined") {
        const savedText = localStorage.getItem(getScopedKey("last_analyzed_resume_text", userId));
        if (savedText) {
          setResumeInputMode("saved");
          setCachedResumeName(localStorage.getItem(getScopedKey("last_analyzed_resume_name", userId)) || "Resume");
          setCachedResumeTimestamp(localStorage.getItem(getScopedKey("last_analyzed_resume_timestamp", userId)) || "");
        } else {
          setResumeInputMode("upload");
          setCachedResumeName("");
          setCachedResumeTimestamp("");
        }
      }
    };

    window.addEventListener("active_resume_updated", handleResumeUpdate);
    return () => {
      window.removeEventListener("active_resume_updated", handleResumeUpdate);
    };
  }, [userId]);

  useEffect(() => {
    if (!activeTaskId) return;

    const handleTaskUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedTask = customEvent.detail;
      if (updatedTask.id === activeTaskId) {
        setTaskProgress(updatedTask.progress);
        if (updatedTask.status === "PROCESSING") {
          setAnalyzeStep(`Analyzing Match: ${updatedTask.progress}%`);
        } else if (updatedTask.status === "PENDING") {
          setAnalyzeStep("Queued (Waiting for background thread)...");
        } else if (updatedTask.status === "COMPLETED") {
          setIsAnalyzing(false);
          const resData = updatedTask.result.data || updatedTask.result;
          setResult(resData);
          
          // Infer Title and Company for history logging
          const matchTitle = jdText.match(/(?:title|job|role)\s*:\s*([^\n]+)/i)?.[1]?.trim() || "Job Description";
          const matchCompany = jdText.match(/(?:company|employer|firm)\s*:\s*([^\n]+)/i)?.[1]?.trim() || "Target Employer";
          
          let resumeTextToSend = "";
          if (resumeInputMode === "saved") {
            resumeTextToSend = localStorage.getItem(getScopedKey("last_analyzed_resume_text", userId)) || "";
          }

          saveToHistory(
            matchTitle.substring(0, 40),
            matchCompany.substring(0, 30),
            resData.overallScore,
            resumeTextToSend || "Uploaded File",
            jdText,
            resData
          );

          if (onMatchComplete) {
            onMatchComplete({
              overallScore: resData.overallScore,
              competitiveness: resData.competitiveness,
              competitivenessReasoning: resData.competitivenessReasoning
            });
          }

          if (onScoreUpdate) {
            onScoreUpdate(resData.overallScore);
          }
          import("@/components/RemainingUsageBadge").then(({ triggerBadgeRefresh }) => triggerBadgeRefresh());
          setActiveTaskId(null);
        } else if (updatedTask.status === "FAILED") {
          setIsAnalyzing(false);
          const err = updatedTask.error || "";
          if (err.toLowerCase().includes("limit reached") || err.toLowerCase().includes("upgrade to premium")) {
            setShowUpgradeModal(true);
          } else {
            setErrorMsg(err || "Matching audit failed. Please try again.");
          }
          setActiveTaskId(null);
        }
      }
    };

    window.addEventListener("bb_task_updated", handleTaskUpdate);
    return () => {
      window.removeEventListener("bb_task_updated", handleTaskUpdate);
    };
  }, [activeTaskId, jdText, resumeInputMode, onMatchComplete, onScoreUpdate, userId]);



  // Load from local storage / Supabase
  useEffect(() => {
    async function loadHistory() {
      if (typeof window !== "undefined") {
        const savedKey = localStorage.getItem(getScopedKey("gemini_api_key", userId)) || "";
        setApiKey(savedKey);
      }

      if (!userId) {
        const savedHistory = localStorage.getItem(getScopedKey("jd_match_history", userId));
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch (e) {
            console.error("Failed to parse history", e);
          }
        }
        return;
      }

      const matches = await getJdMatches(userId);
      if (matches && matches.length > 0) {
        const loadedHistory = matches.map(match => ({
          id: match.id!,
          date: new Date(match.created_at || "").toLocaleDateString(),
          jdTitle: match.job_role || "",
          company: match.analysis?.company || "",
          score: match.match_score || 0,
          resumeText: match.analysis?.resumeText || "",
          jdText: match.analysis?.jdText || "",
          result: match.analysis?.result
        }));
        setHistory(loadedHistory);
      } else {
        // Migrate local storage history
        const savedHistory = localStorage.getItem(getScopedKey("jd_match_history", userId));
        if (savedHistory) {
          try {
            const parsed = JSON.parse(savedHistory) as HistoryItem[];
            setHistory(parsed);
            for (const item of parsed) {
              await addJdMatch(userId, {
                job_role: item.jdTitle,
                match_score: item.score,
                analysis: {
                  company: item.company,
                  resumeText: item.resumeText,
                  jdText: item.jdText,
                  result: item.result
                }
              });
            }
          } catch (e) {}
        }
      }
    }
    loadHistory();
  }, [userId]);

  // Update history items to localStorage & Supabase
  const saveToHistory = async (jdTitle: string, company: string, score: number, resumeText: string, rawJd: string, matchData: MatchResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      jdTitle,
      company,
      score,
      resumeText,
      jdText: rawJd,
      result: matchData
    };
    
    const updatedHistory = [newItem, ...history.slice(0, 19)]; // Keep last 20 scans
    setHistory(updatedHistory);
    localStorage.setItem(getScopedKey("jd_match_history", userId), JSON.stringify(updatedHistory));

    if (userId) {
      await addJdMatch(userId, {
        job_role: jdTitle,
        match_score: score,
        analysis: {
          company,
          resumeText,
          jdText: rawJd,
          result: matchData
        }
      });
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(getScopedKey("jd_match_history", userId), JSON.stringify(updated));
    if (result && history.find(h => h.id === id)?.result === result) {
      setResult(null);
      setOptimizeResult(null);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setJdText(item.jdText);
    setOptimizeResult(null);
    setErrorMsg(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      alert("Invalid format! Please upload only PDF or DOCX.");
      return;
    }
    setUploadedFile(file);
    setErrorMsg(null);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle URL Scraping
  const handleUrlScrape = async () => {
    if (!jdUrl || !jdUrl.startsWith("http")) {
      setErrorMsg("Please enter a valid hiring page URL starting with http:// or https://");
      return;
    }
    setIsScraping(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      const res = await fetch("/api/admin/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scrape URL.");
      
      setJdText(`Job Title: ${data.title}\n\n${data.text}`);
      setSuccessMsg(`Successfully scraped details from: "${data.title}"`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not extract text. Please paste the job description manually.");
    } finally {
      setIsScraping(false);
    }
  };

  // Select job from platform saved list
  const handlePlatformJobSelect = (id: string) => {
    setSelectedJobId(id);
    const job = savedJobs.find(j => j.id === id);
    if (job) {
      const compiledText = `Job Title: ${job.drive_title}\nCompany: ${job.company_name}\n\nDescription:\n${job.drive_description || ""}\n\nEligibility Criteria:\n${job.eligibility_criteria || ""}\n\nResponsibilities:\n${job.key_responsibilities || ""}\n\nSkills:\n${job.required_skills || ""}`;
      setJdText(compiledText);
    }
  };

  // Job Description validation utility
  const validateJobDescription = (text: string): { valid: boolean; message: string } => {
    const trimmed = text.trim();

    // Minimum content length check
    if (trimmed.length < 50) {
      return { valid: false, message: "The provided content is too short to be a valid job description. Please paste a complete job posting." };
    }

    const lowerText = trimmed.toLowerCase();
    let matchedCategories = 0;

    // Check for job title markers
    const titleMarkers = ["role", "position", "title", "job", "opening", "hiring", "vacancy", "opportunity"];
    if (titleMarkers.some(m => lowerText.includes(m))) matchedCategories++;

    // Check for responsibility markers
    const responsibilityMarkers = ["responsib", "duties", "tasks", "you will", "what you'll do", "what you will", "day-to-day", "key activities"];
    if (responsibilityMarkers.some(m => lowerText.includes(m))) matchedCategories++;

    // Check for requirements markers
    const requirementMarkers = ["require", "qualif", "experience", "skill", "proficien", "must have", "nice to have", "minimum", "preferred", "essential", "competenc"];
    if (requirementMarkers.some(m => lowerText.includes(m))) matchedCategories++;

    // Check for education markers
    const educationMarkers = ["degree", "bachelor", "master", "education", "certif", "diploma", "graduate"];
    if (educationMarkers.some(m => lowerText.includes(m))) matchedCategories++;

    // Check for compensation/application markers
    const applicationMarkers = ["apply", "submit", "resume", "cover letter", "salary", "benefits", "compensation", "deadline", "equal opportunity"];
    if (applicationMarkers.some(m => lowerText.includes(m))) matchedCategories++;

    // Require at least 2 distinct categories of hiring markers
    if (matchedCategories < 2) {
      return {
        valid: false,
        message: "The provided content does not appear to be a valid job description. Please paste an authentic job posting containing role responsibilities, required skills, qualifications, or hiring requirements."
      };
    }

    return { valid: true, message: "" };
  };

  // Execute Matcher
  const handleRunMatch = async () => {
    setErrorMsg(null);
    setJdValidationError(null);
    setResult(null);
    setOptimizeResult(null);
    
    let resumeTextToSend = "";
    if (resumeInputMode === "saved") {
      const savedText = localStorage.getItem(getScopedKey("last_analyzed_resume_text", userId));
      if (!savedText) {
        setErrorMsg("No previously analyzed resume text found. Please upload a resume file instead, or complete a scan in the ATS Resume Analyzer first.");
        return;
      }
      resumeTextToSend = savedText;
    }

    if (resumeInputMode === "upload" && !uploadedFile) {
      setErrorMsg("Please upload your resume file (.pdf or .docx).");
      return;
    }

    if (!jdText.trim()) {
      setErrorMsg("Please select or paste a job description first.");
      return;
    }

    // Validate job description content before analysis
    const jdValidation = validateJobDescription(jdText);
    if (!jdValidation.valid) {
      setJdValidationError(jdValidation.message);
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeStep("Queuing match task...");
    setTaskProgress(0);

    try {
      let fileData = null;
      let fileName = "";
      let fileType = "";

      if (resumeInputMode === "upload" && uploadedFile) {
        fileData = await fileToBase64(uploadedFile);
        fileName = uploadedFile.name;
        fileType = uploadedFile.type;
      }

      const payload = {
        fileData,
        fileName,
        fileType,
        resumeText: resumeTextToSend,
        jdText,
        targetRole
      };

      const task = enqueueTask("jd", payload);
      setActiveTaskId(task.id);
      startWorker();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to queue match task.");
      setIsAnalyzing(false);
    }
  };

  // Run Resume Optimizer for this JD
  const handleOptimizeResume = async () => {
    if (!result) return;
    setIsOptimizing(true);
    setErrorMsg(null);
    
    let resumeTextToSend = "";
    if (resumeInputMode === "saved") {
      resumeTextToSend = localStorage.getItem(getScopedKey("last_analyzed_resume_text", userId)) || "";
    } else {
      // Re-use mock or cached if uploaded
      resumeTextToSend = "Uploaded resume content";
    }

    try {
      const res = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          resumeText: resumeTextToSend || "Extracted resume content",
          jdText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tailored optimization.");

      setOptimizeResult(data.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not generate optimization suggestions.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCompetitivenessColor = (comp: string) => {
    const c = comp.toLowerCase();
    if (c.includes("very")) return "bg-emerald-500 text-white";
    if (c === "competitive") return "bg-blue-500 text-white";
    if (c === "moderate") return "bg-amber-500 text-white";
    return "bg-rose-500 text-white";
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <FileSearch className="w-3.5 h-3.5 fill-indigo-100" />
          Jobscan-Style JD Audit
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          AI Job Description Matcher
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Analyze how well your credentials line up against any target job posting. Instantly scan missing keywords, prioritize skill gaps, review recruiter concerns, and generate tailored bullet points before applying.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Builder */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-xl font-black text-slate-900 font-display">Scan Configuration</h3>
              <RemainingUsageBadge featureName="jd_matcher" />
            </div>

            {/* Input A: Resume Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                1. Select Resume Source
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <button
                  onClick={() => setResumeInputMode("upload")}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    resumeInputMode === "upload"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setResumeInputMode("saved")}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    resumeInputMode === "saved"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Cached Scan
                </button>
              </div>
            </div>

            {/* Resume Upload or Cache view */}
            {resumeInputMode === "upload" ? (
              <div className="space-y-2">
                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:scale-105 group-hover:text-indigo-500 transition-all" />
                    <p className="text-xs font-bold text-slate-800">
                      Drag & Drop Resume (PDF, DOCX)
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      or click to browse local files
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.docx"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {(uploadedFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <button onClick={removeFile} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Active Resume Loaded</span>
                </div>
                {cachedResumeName ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 truncate">{cachedResumeName}</span>
                    </div>
                    {cachedResumeTimestamp && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Scanned: {new Date(cachedResumeTimestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
                      This resume will be used for JD comparison. Upload a new resume in ATS Analyzer to update.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                    No resume has been scanned yet. Please complete a scan in the ATS Resume Analyzer first, or upload a file above.
                  </p>
                )}
              </div>
            )}

            {/* Input B: Job Description Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                2. Select Job Source
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {[
                  { id: "paste", label: "Paste JD" },
                  { id: "url", label: "Careers URL" },
                  { id: "platform", label: "Saved Jobs" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setJdInputMode(tab.id as any)}
                    className={cn(
                      "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      jdInputMode === tab.id
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description details selector */}
            {jdInputMode === "url" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="Paste job listing URL (e.g. LinkedIn, Greenhouse)"
                    className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  />
                  <button
                    onClick={handleUrlScrape}
                    disabled={isScraping || !jdUrl}
                    className="px-4 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isScraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Scrape"}
                  </button>
                </div>
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-700 font-bold leading-normal">
                    {successMsg}
                  </div>
                )}
              </div>
            )}

            {jdInputMode === "platform" && (
              <div className="space-y-3">
                <select
                  value={selectedJobId}
                  onChange={(e) => handlePlatformJobSelect(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="">-- Choose Saved Job --</option>
                  {savedJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.company_name} | {job.drive_title}
                    </option>
                  ))}
                </select>
                {savedJobs.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-bold">
                    ⚠️ You haven't saved any job opportunities on the platform yet.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Job Description Text
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description details (responsibilities, skills, requirements) here..."
                rows={7}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold leading-relaxed"
              />
            </div>

            {/* Run comparison action */}
            <button
              onClick={handleRunMatch}
              disabled={isAnalyzing || !jdText.trim() || (resumeInputMode === "upload" && !uploadedFile)}
              className="w-full py-4.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{analyzeStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Matching Scan</span>
                </>
              )}
            </button>

            {jdValidationError && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs font-bold leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Invalid Job Description</strong>
                  {jdValidationError}
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

          {/* History Storage Panel */}
          {history.length > 0 && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Scan History ({history.length})
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center group text-left",
                      result && result.overallScore === item.result.overallScore && jdText === item.jdText
                        ? "bg-indigo-50/50 border-indigo-200"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/30"
                    )}
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-black text-slate-800 truncate leading-tight">
                        {item.jdTitle}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">
                        {item.company} • {item.date}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {item.score}%
                      </span>
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-1 hover:text-red-500 text-slate-400 hover:bg-white rounded transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                key="loading-match"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-indigo-50/50 p-12 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center justify-center text-center space-y-6 min-h-[480px]"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800 text-lg font-display">Job description scanner executing</h4>
                  <p className="text-sm text-indigo-700 font-black px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full inline-block animate-pulse">
                    {analyzeStep}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-semibold max-w-sm">
                  We are cross-referencing education, projects relevance, keyword coverage, and ATS alignment indices...
                </p>
              </motion.div>
            )}

            {!isAnalyzing && !result && (
              <motion.div
                key="empty-match"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 p-12 rounded-[2.5rem] border border-slate-200/50 flex flex-col items-center justify-center text-center space-y-5 min-h-[480px]"
              >
                <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center shadow-sm">
                  <FileSearch className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-lg font-display">Awaiting Match Configuration</h4>
                  <p className="text-sm text-slate-400 font-semibold max-w-sm mx-auto">
                    Select a resume source and paste/scrape a job description to perform a complete applicant competitiveness matching scan.
                  </p>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && result && (
              <motion.div
                key="result-match"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Score Circular gauge & Competitiveness */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 flex-grow">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Scan Completed
                      </span>
                      <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg", getCompetitivenessColor(result.competitiveness))}>
                        {result.competitiveness} Fit
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 font-display">Application Competitiveness</h3>
                    <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                      {result.competitivenessReasoning}
                    </p>
                  </div>

                  {/* Circular Score Gauge */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="48" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                      <circle cx="64" cy="64" r="48" className="text-indigo-600" strokeWidth="8" stroke="currentColor" fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - result.overallScore / 100)} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-slate-800">{result.overallScore}%</span>
                      <span className="text-[9px] font-black text-slate-400 block -mt-1">Match Index</span>
                    </div>
                  </div>
                </div>

                {/* Match Breakdown & Explanations Accordion */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h4 className="text-lg font-black text-slate-900 font-display">Match Breakdown</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.breakdown).map(([key, item]: [string, MatchBreakdownItem]) => {
                      const label = key.replace(/([A-Z])/g, " $1").trim().replace(/^\w/, c => c.toUpperCase());
                      const isExpanded = expandedBreakdown === key;
                      return (
                        <div key={key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between group">
                          <div>
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="text-xs font-black text-slate-700">{label}</span>
                              <span className="text-xs font-black text-indigo-600">{item.score}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${item.score}%` }}></div>
                            </div>
                            
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>

                          <button
                            onClick={() => setExpandedBreakdown(isExpanded ? null : key)}
                            className="mt-3 text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer self-start"
                          >
                            <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {/* Expandable detected/missing items */}
                          <AnimatePresence>
                            {isExpanded && (item.detected || item.missing) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 pt-3 border-t border-slate-200/50 space-y-2"
                              >
                                {item.detected && item.detected.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">✓ Matched</span>
                                    <div className="flex flex-wrap gap-1">
                                      {item.detected.map((det, dIdx) => (
                                        <span key={dIdx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold rounded">
                                          {det}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {item.missing && item.missing.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black text-red-600 uppercase tracking-wider block">✗ Missing</span>
                                    <div className="flex flex-wrap gap-1">
                                      {item.missing.map((mis, mIdx) => (
                                        <span key={mIdx} className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-100 text-[8px] font-bold rounded">
                                          {mis}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Keyword Analysis & Missing Skills Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Keyword Match Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Keyword Analysis</h4>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {result.keywordAnalysis.coverage}% Coverage
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2 max-h-[200px] overflow-y-auto pr-1">
                      {result.keywordAnalysis.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1",
                            kw.present
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : "bg-red-50 border-red-100 text-red-700"
                          )}
                        >
                          {kw.present ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <span className="text-red-500 font-bold shrink-0">✗</span>}
                          {kw.word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills Gap Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Critical Missing Skills</h4>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {result.missingSkills.map((sk, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-xs font-semibold text-slate-800">{sk.skill}</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded",
                              sk.priority === "High"
                                ? "bg-red-100 text-red-700"
                                : sk.priority === "Medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {sk.priority} Priority
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recruiter Perspective & Project Relevance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recruiter Perspective Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Recruiter Perspective</h4>
                    
                    <div className="space-y-4">
                      {/* What Helps */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">✓ Strengths / Helps App</span>
                        <div className="space-y-1.5">
                          {result.recruiterPerspective.helps.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs font-semibold text-slate-600 leading-normal">
                              <span className="text-emerald-500 font-black shrink-0">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Concerns */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">✗ Flags / Concerns</span>
                        <div className="space-y-1.5">
                          {result.recruiterPerspective.concerns.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs font-semibold text-slate-600 leading-normal">
                              <span className="text-red-500 font-black shrink-0">✗</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Relevance Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Project Relevance</h4>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {result.projectsRelevance.map((proj, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-xs font-black text-slate-800 truncate">{proj.title}</span>
                            <span className="text-xs font-black text-indigo-600 shrink-0">{proj.score}% Match</span>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            {proj.explanation}
                          </p>

                          <div className="space-y-1">
                            {proj.strengths.slice(0, 1).map((s, sIdx) => (
                              <div key={sIdx} className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                <span>✓</span> <span>{s}</span>
                              </div>
                            ))}
                            {proj.weaknesses.slice(0, 1).map((w, wIdx) => (
                              <div key={wIdx} className="text-[9px] font-bold text-red-600 flex items-center gap-1">
                                <span>✗</span> <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Improvement Roadmap Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                  <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Match Improvement Roadmap</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* High Impact */}
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 space-y-2">
                      <span className="text-[9px] font-black text-red-700 uppercase tracking-widest block">🔥 High Impact</span>
                      <div className="space-y-1.5">
                        {result.roadmap.filter(r => r.impact === "High").map((item, idx) => (
                          <div key={idx} className="text-xs font-semibold text-slate-600 leading-normal flex items-start gap-1">
                            <span className="text-red-500">•</span>
                            <span>{item.improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medium Impact */}
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-2">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block">⭐ Medium Impact</span>
                      <div className="space-y-1.5">
                        {result.roadmap.filter(r => r.impact === "Medium").map((item, idx) => (
                          <div key={idx} className="text-xs font-semibold text-slate-600 leading-normal flex items-start gap-1">
                            <span className="text-amber-500">•</span>
                            <span>{item.improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Low Impact */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">🔧 Low Impact</span>
                      <div className="space-y-1.5">
                        {result.roadmap.filter(r => r.impact === "Low").map((item, idx) => (
                          <div key={idx} className="text-xs font-semibold text-slate-600 leading-normal flex items-start gap-1">
                            <span className="text-slate-400">•</span>
                            <span>{item.improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Resume Optimization Card */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-white/10">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400">
                        <Cpu className="w-3.5 h-3.5 fill-indigo-400/20" />
                        AI Resume Tailoring
                      </div>
                      <h3 className="text-2xl font-black text-white font-display">Resume Optimization Assistant</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed">
                        Instantly customize your resume summary, rewrite your bullets to include target keywords, and audit formatting settings for this job.
                      </p>
                    </div>

                    <button
                      onClick={handleOptimizeResume}
                      disabled={isOptimizing}
                      className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0"
                    >
                      {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Optimize Resume For This JD"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {optimizeResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-6 pt-4 text-left"
                      >
                        {/* Summary */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Tailored Resume Summary</span>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative">
                            <button
                              onClick={() => handleCopy(optimizeResult.tailoredSummary, "opt-summary")}
                              className="absolute top-3 right-3 p-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                            >
                              {copiedKey === "opt-summary" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <p className="text-xs font-medium text-slate-200 leading-relaxed pr-8">{optimizeResult.tailoredSummary}</p>
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Keyword-Aligned Bullet Rewrites</span>
                          <div className="space-y-3">
                            {optimizeResult.optimizedBullets.map((b, idx) => (
                              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 relative">
                                <button
                                  onClick={() => handleCopy(b.after, `opt-bullet-${idx}`)}
                                  className="absolute top-3 right-3 p-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                                >
                                  {copiedKey === `opt-bullet-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <div className="space-y-1 text-xs pr-8">
                                  <p className="text-slate-400 font-medium line-through">Before: {b.before}</p>
                                  <p className="text-slate-100 font-bold">After: {b.after}</p>
                                </div>
                                <p className="text-[9px] text-indigo-300 font-semibold">{b.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Keyword list & recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Insert These Target Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {optimizeResult.missingKeywords.map((k, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-white/10 text-[9px] font-semibold rounded">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">ATS Formatting Advice</span>
                            <div className="space-y-1">
                              {optimizeResult.atsRecommendations.map((r, idx) => (
                                <p key={idx} className="text-[10px] text-slate-300 font-medium leading-relaxed flex items-start gap-1">
                                  <span>•</span> <span>{r}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Premium ready placeholders section */}
                <div className="p-6 bg-slate-900/5 border border-slate-200/50 rounded-[2rem] space-y-4">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider inline-block">Premium Ready Upgrades</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: "Cover Letter Builder", desc: "Auto-generate tailored letters for this JD" },
                      { name: "Bulk JD Comparison", desc: "Scan resume against 5+ job posts at once" },
                      { name: "Interview Q&A Generator", desc: "Custom mock questions for this JD match" },
                      { name: "Success Probability", desc: "Forecast hire probability using market metrics" }
                    ].map((upg, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-col justify-between cursor-not-allowed select-none">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-800 leading-tight">{upg.name}</span>
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold leading-normal">{upg.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <UpgradeBanner isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="jd_matcher" />
    </div>
  );
}
