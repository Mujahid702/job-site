"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Briefcase,
  Sliders,
  Award,
  BookOpen,
  Terminal,
  Lock,
  ArrowRight,
  TrendingUp,
  Clock,
  Trash2,
  Info
} from "lucide-react";

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

interface CategoryEvaluation {
  score: number;
  maxScore: number;
  reasons: string[];
  deductions: string[];
}

interface EvaluationData {
  parsedInfo: {
    name: string;
    education: string[];
    skills: string[];
    projects: string[];
    experience: string[];
    certifications: string[];
    achievements: string[];
    contactInformation: {
      email: string;
      phone: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
  };
  overallExplanation: string;
  atsScore: number;
  categories: {
    resumeStructure: CategoryEvaluation;
    atsCompatibility: CategoryEvaluation;
    skillsRelevance: CategoryEvaluation;
    projectQuality: CategoryEvaluation;
    experienceQuality: CategoryEvaluation;
    keywordCoverage: CategoryEvaluation;
    readability: CategoryEvaluation;
    professionalPresentation: CategoryEvaluation;
  };
  roleMatch: {
    matchPercentage: number;
    targetRole: string;
    status: string;
    reasoning: string;
    strongAreas: string[];
    weakAreas: string[];
  };
  roleFitBreakdown: {
    role: string;
    percentage: number;
    status: string;
  }[];
  projectsEvaluation: {
    title: string;
    score: number;
    maxScore: number;
    strengths: string[];
    weaknesses: string[];
    recruiterImpact: string;
  }[];
  missingSkillsDetector: {
    detected: string[];
    missing: string[];
    suggestions: string[];
  };
  atsRisks: {
    risk: string;
    severity: string;
    explanation: string;
  }[];
  improvementRoadmap: {
    id: number;
    improvement: string;
    impact: string;
    explanation: string;
  }[];
}

interface AtsResumeAnalyzerProps {
  onScoreUpdate?: (score: number) => void;
}

export default function AtsResumeAnalyzer({ onScoreUpdate }: AtsResumeAnalyzerProps) {
  const [selectedRole, setSelectedRole] = useState<string>("Software Engineer");
  const [customRole, setCustomRole] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationData | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showPasteText, setShowPasteText] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated professional scanning logs for micro-animations
  const triggerScanSteps = async () => {
    const steps = [
      "Uploading file and parsing content...",
      "Extracting resume structures & sections...",
      "Analyzing experience details & quantified impact...",
      "Evaluating project architectures & technologies...",
      "Detecting skills gaps and keyword density...",
      "Running ATS layout compatibility checks...",
      "Calculating role-fit index against selected profile...",
      "Compiling improvement roadmap suggestions..."
    ];

    for (const step of steps) {
      setScanStep(step);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      alert("Invalid format! Please upload only .pdf or .docx files.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB! Please upload a smaller file.");
      return;
    }
    setUploadedFile(file);
    setErrorMsg(null);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRunEvaluation = async () => {
    if (!uploadedFile && !resumeText.trim()) {
      setErrorMsg("Please upload a PDF/DOCX resume file or paste the resume text first.");
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setResult(null);

    // Run visually engaging scanner logs in parallel
    const logsPromise = triggerScanSteps();

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      } else {
        formData.append("text", resumeText);
      }

      const targetRoleToSend = selectedRole === "Other" ? customRole : selectedRole;
      if (targetRoleToSend.trim()) {
        formData.append("targetRole", targetRoleToSend);
      }

      const res = await fetch("/api/resume/evaluate", {
        method: "POST",
        body: formData,
      });

      const responseData = await res.json();

      // Ensure the scanner logs animation runs for at least some steps to not flicker
      await logsPromise;

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to analyze resume.");
      }

      setResult(responseData.data);
      if (onScoreUpdate && responseData.data.atsScore) {
        onScoreUpdate(responseData.data.atsScore);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong during evaluation. Please try again.");
    } finally {
      setIsScanning(false);
      setScanStep("");
    }
  };

  // Status-based color mapping helpers
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("excellent")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s.includes("good")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (s.includes("needs improvement") || s.includes("improvement")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const getImpactColor = (impact: string) => {
    const imp = impact.toLowerCase();
    if (imp === "high") return "bg-emerald-100 text-emerald-800";
    if (imp === "medium") return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
  };

  const getSeverityColor = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === "high") return "bg-red-50 text-red-700 border border-red-200";
    if (sev === "medium") return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-slate-50 text-slate-600 border border-slate-200";
  };

  const toggleCategory = (catKey: string) => {
    setExpandedCategory(expandedCategory === catKey ? null : catKey);
  };

  // Score indicator radial ring setup
  const getScoreStrokeDash = (score: number) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return { circumference, offset };
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <FileText className="w-3.5 h-3.5 fill-indigo-100" />
          Explainable ATS Audit
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          Premium Resume Evaluation
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Get a fully transparent audit of your CV. Evaluate formatting compatibility, skills relevance, project scores, and receive a customized roadmap to optimize for recruiters.
        </p>
      </div>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload & Options Form (Left) */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-slate-900 font-display">Optimization Settings</h3>

          {/* Target Role Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Target Career Role (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  if (e.target.value !== "Other") setCustomRole("");
                }}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              >
                <option value="">-- Let AI Infer Fit --</option>
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="Other">Other (Type Custom Role)</option>
              </select>

              {/* Custom Target Role Field */}
              {selectedRole === "Other" && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Flutter Developer, Product Manager"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              )}
            </div>
          </div>

          {/* File Drag-and-Drop Zone */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Upload Resume File
            </label>
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer relative group"
              >
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:scale-110 group-hover:text-indigo-500 transition-all" />
                <p className="text-sm font-bold text-slate-800">
                  Drag & Drop your resume (PDF or DOCX)
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  or click to browse local files (max 5MB)
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
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • File Loaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Paste Raw Text Option */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPasteText(!showPasteText)}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{showPasteText ? "Hide Text Editor" : "Or Paste Resume Raw Text Instead"}</span>
              <Sliders className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showPasteText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (uploadedFile) removeFile();
                    }}
                    placeholder="Paste the plain text of your resume here..."
                    rows={8}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm leading-relaxed"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      Pasting raw text will clear the currently selected file attachment.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleRunEvaluation}
            disabled={isScanning || (!uploadedFile && !resumeText.trim())}
            className="w-full py-4.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning (Processing Extraction)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute Complete ATS Evaluation</span>
              </>
            )}
          </button>

          {/* Error Message rendering */}
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-start gap-2.5 text-xs font-bold leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Evaluation Error</strong>
                {errorMsg}
              </div>
            </div>
          )}
        </div>

        {/* Scan step status loader / visual display (Right) */}
        <div className="lg:col-span-6">
          {isScanning && (
            <div className="bg-indigo-50/50 p-10 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] h-full">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-lg font-display">Deep Parsing Resume Content</h4>
                <p className="text-sm text-indigo-700 font-bold px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full inline-block animate-pulse">
                  {scanStep}
                </p>
              </div>
              <p className="text-xs text-slate-400 font-semibold max-w-sm">
                Gemini is auditing structures, comparing keywords, evaluating projects impact indices, and compiling recommendations...
              </p>
            </div>
          )}

          {!isScanning && !result && (
            <div className="bg-slate-50 p-12 rounded-[2.5rem] border border-slate-200/50 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] h-full">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-lg font-display">Evaluation Awaiting</h4>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                  Upload a PDF/DOCX file or paste raw text to run the explainable scoring engine.
                </p>
              </div>
            </div>
          )}

          {/* Quick Info Box in non-loaded state */}
          {!isScanning && !result && (
            <div className="mt-6 p-6 bg-blue-50/50 border border-blue-100/50 rounded-3xl flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-black text-blue-900 uppercase tracking-wider">How evaluations work</h5>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Unlike fake resume scorers, this engine extracts textual entities from your files and processes them through an expert LLM parser scoring exactly against weighted rules.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EVALUATION RESULTS PANELS */}
      {result && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* TOP CARD: MAIN SCORE & ROLE MATCH WIDGET */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ATS Score Card */}
            <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-700">
                  <Award className="w-3.5 h-3.5" />
                  ATS Audit Index
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-display">ATS Compatibility Index</h3>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                  {result.overallExplanation}
                </p>
              </div>

              {/* Score SVG Circular indicator */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Outer Background ring */}
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    className="text-slate-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Score Indicator Ring */}
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    className="text-indigo-600"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    strokeDasharray={getScoreStrokeDash(result.atsScore).circumference}
                    strokeDashoffset={getScoreStrokeDash(result.atsScore).offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-slate-800">{result.atsScore}</span>
                  <span className="text-xs font-black text-slate-400 block -mt-1">/100</span>
                </div>
              </div>
            </div>

            {/* Target Role Match Card */}
            <div className="lg:col-span-5 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Target Role Match
                  </span>
                  <h4 className="text-xl font-black text-slate-900 font-display truncate max-w-[200px]">
                    {result.roleMatch.targetRole}
                  </h4>
                </div>
                <span
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${getStatusColor(
                    result.roleMatch.status
                  )}`}
                >
                  {result.roleMatch.status}
                </span>
              </div>

              {/* Score Progress Ring */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      className="text-slate-100"
                      strokeWidth="7"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      className="text-teal-500"
                      strokeWidth="7"
                      stroke="currentColor"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - result.roleMatch.matchPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-lg font-black text-slate-800">
                    {result.roleMatch.matchPercentage}%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 leading-normal">
                  {result.roleMatch.reasoning}
                </p>
              </div>

              {/* Strong vs Weak breakdown lists */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">
                    ✓ Strong Areas
                  </span>
                  <div className="space-y-1.5">
                    {result.roleMatch.strongAreas.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-[10px] font-bold text-slate-700 truncate">
                        {item.replace(/^✓\s*/, "")}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-rose-600 uppercase tracking-wider block">
                    ✗ Weak Areas
                  </span>
                  <div className="space-y-1.5">
                    {result.roleMatch.weakAreas.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-[10px] font-bold text-slate-700 truncate">
                        {item.replace(/^✗\s*/, "")}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECOND ROW: EXPLAINABLE ACCORDION SECTION CATEGORIES & GENERAL BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 8 Categories detail Accordion list (Left) */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">Scoring Categories Audit</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Toggle each category to view detailed checks (✓) and point deductions (✗).
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {Object.entries(result.categories).map(([key, cat]: [string, CategoryEvaluation]) => {
                  const title = key
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .replace(/^\w/, (c) => c.toUpperCase());
                  const isExpanded = expandedCategory === key;

                  return (
                    <div key={key} className="py-4.5 first:pt-0 last:pb-0">
                      {/* Header triggers collapse */}
                      <div
                        onClick={() => toggleCategory(key)}
                        className="flex items-center justify-between cursor-pointer group select-none"
                      >
                        <div className="space-y-1 flex-grow pr-4">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {title}
                            </h4>
                            <span className="text-xs font-black text-slate-800">
                              {cat.score} <span className="text-[10px] text-slate-400">/ {cat.maxScore}</span>
                            </span>
                          </div>

                          {/* Individual Weight progress bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="p-1 border border-slate-100 rounded-lg text-slate-400 group-hover:text-slate-700">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Reasons / Deductions list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50"
                          >
                            {/* Reasons box (Green Checks) */}
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-3">
                              <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                Helping Your Resume
                              </h5>
                              <div className="space-y-2">
                                {cat.reasons.length > 0 ? (
                                  cat.reasons.map((r, rIdx) => (
                                    <div key={rIdx} className="flex items-start gap-2 text-xs font-bold text-slate-600 leading-normal">
                                      <span className="text-emerald-500 font-black shrink-0">✓</span>
                                      <span>{r.replace(/^✓\s*/, "")}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400 font-medium">No clear benefits detected.</p>
                                )}
                              </div>
                            </div>

                            {/* Deductions box (Red Crosses) */}
                            <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 space-y-3">
                              <h5 className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                                Point Deductions
                              </h5>
                              <div className="space-y-2">
                                {cat.deductions.length > 0 ? (
                                  cat.deductions.map((d, dIdx) => (
                                    <div key={dIdx} className="flex items-start gap-2 text-xs font-bold text-slate-600 leading-normal">
                                      <span className="text-red-500 font-black shrink-0">✗</span>
                                      <span>{d.replace(/^✗\s*/, "")}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-start gap-2 text-xs font-bold text-emerald-600">
                                    <span className="shrink-0 font-black">✓</span>
                                    <span>No deductions! Perfect formatting details detected.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Natural Fit Role breakdown (Right) */}
            <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">Natural Role Fit</h3>
                <p className="text-xs text-slate-400 font-medium">
                  We evaluated your CV credentials across 11 popular tech roles.
                </p>
              </div>

              {/* Roles matrix list */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {result.roleFitBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-slate-100/50"
                  >
                    <div className="space-y-0.5 truncate flex-grow">
                      <span className="text-xs font-black text-slate-800 block truncate">
                        {item.role}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{item.percentage}%</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status.replace(/\s*match/i, "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* THIRD ROW: MISSING SKILLS GAP & PROJECT EVALUATORS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Skills Gap Card (Left) */}
            <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">Skills Gap Detector</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Comparing your resume skills against typical {result.roleMatch.targetRole} criteria.
                </p>
              </div>

              {/* Detected vs Missing splits */}
              <div className="space-y-5">
                {/* Detected */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">
                    Detected Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkillsDetector.detected.length > 0 ? (
                      result.missingSkillsDetector.detected.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">No skills detected. Check format.</p>
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">
                    Missing Target Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkillsDetector.missing.length > 0 ? (
                      result.missingSkillsDetector.missing.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
                        No missing skills! Core stack matching.
                      </span>
                    )}
                  </div>
                </div>

                {/*Suggestions */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">
                    AI Suggestions
                  </span>
                  <div className="space-y-1.5">
                    {result.missingSkillsDetector.suggestions.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold leading-relaxed">
                        <span className="text-indigo-500">•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Project Evaluators (Right) */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">Individual Project Audits</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Analysis of projects found in your resume text.
                </p>
              </div>

              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1">
                {result.projectsEvaluation.length > 0 ? (
                  result.projectsEvaluation.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-5 border border-slate-200/80 rounded-3xl space-y-4 shadow-sm hover:border-indigo-200 transition-all"
                    >
                      {/* Name & score row */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 max-w-[70%]">
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {proj.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${getImpactColor(
                              proj.recruiterImpact
                            )}`}
                          >
                            Recruiter Impact: {proj.recruiterImpact}
                          </span>
                        </div>

                        {/* Project Score pill */}
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-slate-800">
                            {proj.score}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 block -mt-1">
                            / {proj.maxScore}
                          </span>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses splits */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">
                            ✓ Key Strengths
                          </span>
                          <div className="space-y-1.5">
                            {proj.strengths.map((str, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold leading-snug">
                                <span className="text-emerald-500 shrink-0">✓</span>
                                <span>{str.replace(/^✓\s*/, "")}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-wider block">
                            ✗ Areas to Improve
                          </span>
                          <div className="space-y-1.5">
                            {proj.weaknesses.map((weak, wIdx) => (
                              <div key={wIdx} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold leading-snug">
                                <span className="text-red-500 shrink-0">✗</span>
                                <span>{weak.replace(/^✗\s*/, "")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium">No projects detected in the resume text.</p>
                )}
              </div>
            </div>
          </div>

          {/* FOURTH ROW: ATS RISK & WARNINGS & ROADMAP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ATS Layout Risks (Left) */}
            <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">ATS Parsing & Formatting Risks</h3>
                <p className="text-xs text-slate-400 font-medium">
                  We checked layout parameters that might cause parsers to fail.
                </p>
              </div>

              <div className="space-y-4">
                {result.atsRisks.length > 0 ? (
                  result.atsRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5"
                    >
                      <div className="mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs font-black text-slate-800">
                            {risk.risk}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${getSeverityColor(
                              risk.severity
                            )}`}
                          >
                            {risk.severity} Severity
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {risk.explanation}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-xs text-emerald-700 font-black">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    No layout risks detected! Compatible single column parsed successfully.
                  </div>
                )}
              </div>
            </div>

            {/* Improvement Roadmap Card (Right) */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-display">Top 10 Actionable Improvements</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Action steps ordered by impact to improve your score.
                </p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {result.improvementRoadmap.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200/60 hover:border-slate-300 rounded-2xl flex items-start gap-4 transition-all"
                  >
                    {/* Circle rank number */}
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      {item.id}
                    </div>

                    <div className="space-y-1 flex-grow">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-800 leading-snug">
                          {item.improvement}
                        </h4>
                        <span
                          className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${getImpactColor(
                            item.impact
                          )}`}
                        >
                          {item.impact} Impact
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FUTURE PREMIUM PLACEHOLDERS PANEL */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400">
                  <Award className="w-3.5 h-3.5 fill-indigo-400/20" />
                  Premium Upgrades Ready
                </div>
                <h3 className="text-2xl font-black text-white font-display">Upgrade to Pro Features</h3>
                <p className="text-sm text-slate-400 font-medium max-w-xl">
                  Unlock advanced AI utilities powered by Gemini to optimize and write resumes directly for your target jobs.
                </p>
              </div>
              <button className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shrink-0 cursor-pointer shadow-lg shadow-indigo-600/30">
                Unlock Premium Pro
              </button>
            </div>

            {/* Mocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {[
                {
                  title: "AI Bullet Rewrite",
                  desc: "Instantly rephrase bullets with action verbs & metrics.",
                  icon: <Sliders className="w-5 h-5 text-indigo-400" />
                },
                {
                  title: "LaTeX Resume Builder",
                  desc: "Generate clean single-column PDF templates.",
                  icon: <FileText className="w-5 h-5 text-indigo-400" />
                },
                {
                  title: "JD Matcher",
                  desc: "Paste any job posting for targeted score comparison.",
                  icon: <Briefcase className="w-5 h-5 text-indigo-400" />
                },
                {
                  title: "Mock Interview Prep",
                  desc: "Generate customized practice questions for your CV.",
                  icon: <Terminal className="w-5 h-5 text-indigo-400" />
                },
                {
                  title: "Score Comparison",
                  desc: "Track score evolution and changes across uploads.",
                  icon: <TrendingUp className="w-5 h-5 text-indigo-400" />
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-4 hover:bg-white/10 transition-all relative group cursor-not-allowed select-none"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="p-2.5 bg-white/10 rounded-xl">
                      {item.icon}
                    </div>
                    <div className="p-1.5 bg-white/10 rounded-lg text-amber-400 hover:scale-105 transition-transform flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">PRO</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-white">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
