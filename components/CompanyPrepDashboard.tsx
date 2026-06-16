"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ArrowLeft,
  Building2,
  Trophy,
  Activity,
  Briefcase,
  DollarSign,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Download,
  Bot,
  User,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyPrepData, QuestionBankItem, StudentExperience } from "@/lib/company-prep-data";

interface CompanyPrepDashboardProps {
  slug: string;
  companyData: CompanyPrepData;
}

const generateMsgId = (role: string): string => {
  return `msg-${Date.now()}-${role}-${Math.random().toString(36).substring(2, 9)}`;
};

const generateExpId = (): string => {
  return `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function CompanyPrepDashboard({ slug, companyData }: CompanyPrepDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  
  // Local storage state keys
  const CHECKLIST_KEY = `company_checklist_${slug}`;
  const EXPERIENCES_KEY = `company_experiences_${slug}`;
  
  // Interactive checklist planner (lazy load from localStorage)
  const [checkedPlanner, setCheckedPlanner] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`company_checklist_${slug}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    const initial: Record<string, boolean> = {};
    companyData.plannerChecklist.forEach((_, idx) => {
      initial[`task-${idx}`] = false;
    });
    return initial;
  });
  
  // Interview experiences state (lazy load from localStorage)
  const [experiences, setExperiences] = useState<StudentExperience[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`company_experiences_${slug}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return companyData.experiences;
  });
  
  const [newExpStudent, setNewExpStudent] = useState("");
  const [newExpRole, setNewExpRole] = useState(companyData.rolesHired[0] || "Software Engineer");
  const [newExpOutcome, setNewExpOutcome] = useState<"Selected" | "Rejected">("Selected");
  const [newExpStory, setNewExpStory] = useState("");
  const [showNewExpModal, setShowNewExpModal] = useState(false);

  // OA practice engine states
  const [oaAnswers, setOaAnswers] = useState<Record<string, string>>({});
  const [oaValidated, setOaValidated] = useState<Record<string, boolean>>({});
  
  // Collapsible question banks
  const [expandedQb, setExpandedQb] = useState<Record<string, boolean>>({});
  
  // Custom company copilot chat states (lazy load welcome message)
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>(() => [
    {
      id: "welcome",
      role: "copilot",
      content: `Hello! I am your **${companyData.name} Placement Strategy Coach**. \n\nI can analyze your readiness metrics, explain the online assessment pattern, outline priority study tasks, or give recommendations to clear interview panels.\n\nClick one of the quick prompts below or ask me any question directly!`
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  const saveChecklist = (updated: Record<string, boolean>) => {
    setCheckedPlanner(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));
    }
  };

  const handleTogglePlanner = (id: string) => {
    const updated = { ...checkedPlanner, [id]: !checkedPlanner[id] };
    saveChecklist(updated);
  };

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpStudent.trim() || !newExpStory.trim()) return;

    const newLog: StudentExperience = {
      id: generateExpId(),
      student: newExpStudent.trim(),
      role: newExpRole,
      year: "2026",
      outcome: newExpOutcome,
      story: newExpStory.trim()
    };

    const updated = [newLog, ...experiences];
    setExperiences(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(updated));
    }

    setNewExpStudent("");
    setNewExpStory("");
    setShowNewExpModal(false);
  };

  // Readiness Index calculation
  const getReadinessScore = () => {
    let score = 30; // base score

    // ATS Resume Score integration (if stored in localStorage)
    if (typeof window !== "undefined") {
      const ats = Number(localStorage.getItem("ats_score") || "0");
      if (ats > 0) {
        score += Math.round(ats * 0.25); // up to 25% contribution
      } else {
        score += 18; // default fallback metric
      }

      // CRM active job applications contribution
      const crm = localStorage.getItem("placement_crm_applications");
      if (crm) {
        try {
          const list = JSON.parse(crm);
          if (list.length > 0) score += 15;
        } catch {}
      }
    }

    // Interactive checklist planner contribution
    const totalChecklist = companyData.plannerChecklist.length;
    if (totalChecklist > 0) {
      const checkedCount = Object.values(checkedPlanner).filter(Boolean).length;
      score += Math.round((checkedCount / totalChecklist) * 30); // up to 30% contribution
    }

    return Math.min(score, 100);
  };

  const readinessScore = getReadinessScore();

  // Custom company copilot chat dispatcher
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    
    const userMsg = {
      id: generateMsgId("user"),
      role: "user" as const,
      content: query
    };

    const updatedMsgs = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMsgs);
    setCopilotLoading(true);

    try {
      // Try calling the copilot API with custom company context
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Specifically answering for ${companyData.name} preparation: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: companyData.rolesHired[0],
            techStack: companyData.mustHaveSkills.join(", "),
            atsScore: typeof window !== "undefined" ? Number(localStorage.getItem("ats_score") || "72") : 72,
            interviewAvg: 60,
            roadmapProgressCount: 2,
            totalRoadmapCount: 10,
            crmApplications: []
          }
        })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateMsgId("copilot"),
          role: "copilot" as const,
          content: responseData.data.reply
        }
      ]);
    } catch {
      // Offline fallback mapping based on query types
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("ready") || q.includes("score")) {
        reply = companyData.copilotAnswers.ready;
      } else if (q.includes("crack") || q.includes("how to prepare")) {
        reply = companyData.copilotAnswers.crack;
      } else if (q.includes("project")) {
        reply = companyData.copilotAnswers.projects;
      } else if (q.includes("skill") || q.includes("learn")) {
        reply = companyData.copilotAnswers.skills;
      } else {
        reply = `I have analyzed your query regarding **${companyData.name}**. I highly recommend completing today's checklist planner tasks (e.g. practicing spatial reasoning or coding palindromes) and matching your core tech stack against the must-have requirements: **${companyData.mustHaveSkills.join(", ")}**. Let me know if you would like to run a mock interview!`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateMsgId("copilot"),
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleSelectOaAnswer = (qId: string, value: string) => {
    setOaAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleValidateOaAnswer = (qId: string) => {
    setOaValidated(prev => ({ ...prev, [qId]: true }));
  };

  const toggleQb = (qbId: string) => {
    setExpandedQb(prev => ({ ...prev, [qbId]: !prev[qbId] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans relative">
      
      {/* Dynamic SEO breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">
        <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard?tab=company" className="hover:text-slate-900 transition-colors">Company Preparation</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900">{companyData.name} Prep OS</span>
      </nav>

      {/* Header card with details */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200/60 shadow-xl shadow-slate-100/30 mb-10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <Building2 className="w-48 h-48" />
        </div>
        
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {companyData.name.charAt(0)}
            </div>
            <div>
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                Prep Workspace Active
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight block mt-1">
                {companyData.name} Preparation Hub
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {companyData.overview}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 shrink-0">
          <Link
            href="/dashboard?tab=company"
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch Company</span>
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("voice_mock_preselected_company", companyData.name);
                window.location.href = "/dashboard?tab=interview-prep";
              }
            }}
            className="px-6 py-3 bg-slate-900 text-white hover:bg-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Sub-Tabs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Sub Navigation */}
          <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
            {[
              { id: "overview", label: "Overview & Process", icon: <Briefcase className="w-4 h-4" /> },
              { id: "oa", label: "Assessment OS", icon: <Zap className="w-4 h-4" /> },
              { id: "qb", label: "Question Bank", icon: <HelpCircle className="w-4 h-4" /> },
              { id: "experiences", label: "Experiences Library", icon: <MessageSquare className="w-4 h-4" /> },
              { id: "skills", label: "Skill Matcher", icon: <Activity className="w-4 h-4" /> },
              { id: "roadmap", label: "Roadmap & Planner", icon: <ClipboardList className="w-4 h-4" /> },
              { id: "resources", label: "Study Vault", icon: <BookOpen className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeSubTab === tab.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-Tab Renders */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: OVERVIEW & PROCESS */}
              {activeSubTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-display">Recruitment Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {[
                        { label: "Salary Range", val: companyData.salaryRange, icon: <DollarSign className="w-5 h-5 text-emerald-500" /> },
                        { label: "Prep Time", val: companyData.prepTime, icon: <Activity className="w-5 h-5 text-indigo-500" /> },
                        { label: "Selection Ratio", val: companyData.selectionRatio, icon: <TrendingUp className="w-5 h-5 text-amber-500" /> },
                        { label: "Process Rounds", val: `${companyData.activeRounds} Rounds`, icon: <Trophy className="w-5 h-5 text-purple-500" /> }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200/50 shadow-sm">
                            {item.icon}
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{item.label}</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">{item.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-900 font-display">Hiring Process Timeline</h2>
                    <div className="space-y-6 mt-6">
                      {companyData.hiringProcess.map((round, idx) => (
                        <div key={idx} className="flex gap-4 relative group">
                          {idx !== companyData.hiringProcess.length - 1 && (
                            <span className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                          )}
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 font-black text-sm z-10 shadow-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 group-hover:border-indigo-100 transition-colors">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-black text-slate-800">{round.name}</h3>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200/50 px-2 py-0.5 rounded">
                                {round.duration} • Diff: {round.difficulty}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              {round.tips}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: ONLINE ASSESSMENT OS */}
              {activeSubTab === "oa" && (
                <motion.div
                  key="oa"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-indigo-900 text-white rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                      <Zap className="w-48 h-48 text-yellow-300" />
                    </div>
                    <span className="px-2.5 py-1 bg-white/10 text-yellow-300 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Online Assessment Guidelines
                    </span>
                    <h2 className="text-2xl font-black font-display tracking-tight mt-1">
                      {companyData.name} OA Pattern OS
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest block">Expected Cutoff</span>
                        <strong className="text-sm font-black mt-1 block">{companyData.oaPattern.cutoff}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest block">Time Limit</span>
                        <strong className="text-sm font-black mt-1 block">{companyData.oaPattern.timeLimit}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest block">Test Structures</span>
                        <strong className="text-sm font-black mt-1 block">{companyData.oaPattern.sections.join(", ")}</strong>
                      </div>
                    </div>
                  </div>

                  {/* OA Practice Engine */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 font-display">OA Practice Simulation Engine</h3>
                    <div className="space-y-6">
                      {companyData.oaQuestions.map((q) => {
                        const isMCQ = q.type !== "coding";
                        const hasSubmitted = oaValidated[q.id];
                        const selectedAnswer = oaAnswers[q.id] || "";
                        const isCorrect = selectedAnswer === q.answer;

                        return (
                          <div key={q.id} className="border border-slate-200/60 rounded-3xl p-6 space-y-4 hover:border-slate-300 transition-colors bg-slate-50/30">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200/50">
                                {q.type} Question
                              </span>
                              {hasSubmitted && (
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded",
                                  isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                  {isCorrect ? "Correct ✓" : "Incorrect ✗"}
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold text-slate-800 whitespace-pre-line">{q.question}</p>

                            {/* Option list if MCQ */}
                            {isMCQ && q.options && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {q.options.map((opt) => (
                                  <button
                                    key={opt}
                                    disabled={hasSubmitted}
                                    onClick={() => handleSelectOaAnswer(q.id, opt)}
                                    className={cn(
                                      "p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                                      selectedAnswer === opt
                                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Coding Codebox if coding question */}
                            {!isMCQ && (
                              <div className="space-y-3 pt-2">
                                <textarea
                                  disabled={hasSubmitted}
                                  rows={5}
                                  placeholder="Write your solution functions here..."
                                  value={selectedAnswer}
                                  onChange={(e) => handleSelectOaAnswer(q.id, e.target.value)}
                                  className="w-full p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                              <span className="text-[10px] text-slate-400 font-bold">Auto Graded Section</span>
                              <button
                                disabled={!selectedAnswer || hasSubmitted}
                                onClick={() => handleValidateOaAnswer(q.id)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-40"
                              >
                                Submit & Verify Answer
                              </button>
                            </div>

                            {/* Explanation Box */}
                            {hasSubmitted && (
                              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs space-y-2">
                                <strong className="text-indigo-900 font-black block">Explanation:</strong>
                                <p className="text-slate-600 font-medium">{q.explanation}</p>
                                {!isMCQ && (
                                  <>
                                    <strong className="text-indigo-900 font-black block mt-2">Optimal Answer Code:</strong>
                                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto mt-1">
                                      {q.answer}
                                    </pre>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: QUESTION BANK */}
              {activeSubTab === "qb" && (
                <motion.div
                  key="qb"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                    <h2 className="text-xl font-black text-slate-900 font-display">Interview Question Bank</h2>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {companyData.questionBank.length} Questions Compiled
                    </span>
                  </div>

                  <div className="space-y-4">
                    {companyData.questionBank.map((qb: QuestionBankItem) => {
                      const isOpen = expandedQb[qb.id];
                      return (
                        <div key={qb.id} className="border border-slate-200/60 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all">
                          <button
                            onClick={() => toggleQb(qb.id)}
                            className="w-full p-4 bg-slate-50/50 text-left flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex gap-2">
                                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded">
                                  {qb.category}
                                </span>
                                <span className="px-2 py-0.5 bg-white border border-slate-200 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded">
                                  {qb.type}
                                </span>
                              </div>
                              <strong className="text-sm font-black text-slate-800 leading-snug block pt-1">
                                {qb.question}
                              </strong>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                              >
                                <div className="p-5 text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-line">
                                  <strong className="text-slate-850 font-black block mb-2">Model Answer Suggestion:</strong>
                                  {qb.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: EXPERIENCES LIBRARY */}
              {activeSubTab === "experiences" && (
                <motion.div
                  key="experiences"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900 font-display">Candidate Placement Experiences</h2>
                    <button
                      onClick={() => setShowNewExpModal(true)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all cursor-pointer"
                    >
                      Log Your Experience
                    </button>
                  </div>

                  <div className="space-y-6 mt-6">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="border border-slate-200/60 p-6 rounded-3xl space-y-4 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-sm font-black text-slate-800">{exp.student}</strong>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              Role: {exp.role} • Batch: {exp.year}
                            </span>
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                            exp.outcome === "Selected" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {exp.outcome}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">
                          {exp.story}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Submit Modal */}
                  {showNewExpModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 max-w-xl w-full shadow-2xl space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 font-display">Log Interview Experience</h3>
                        
                        <form onSubmit={handleAddExperience} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Your Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Rahul Verma"
                              value={newExpStudent}
                              onChange={(e) => setNewExpStudent(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Role</label>
                              <select
                                value={newExpRole}
                                onChange={(e) => setNewExpRole(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                              >
                                {companyData.rolesHired.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Outcome</label>
                              <select
                                value={newExpOutcome}
                                onChange={(e) => setNewExpOutcome(e.target.value as "Selected" | "Rejected")}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                              >
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Experience Story</label>
                            <textarea
                              required
                              rows={5}
                              placeholder="Detail the OA coding questions, difficulty, interview rounds, and tips for future students..."
                              value={newExpStory}
                              onChange={(e) => setNewExpStory(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowNewExpModal(false)}
                              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                            >
                              Save Experience
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 5: SKILL MATCHER */}
              {activeSubTab === "skills" && (
                <motion.div
                  key="skills"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-black text-slate-900 font-display">Company Skill Matcher</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    We compare your profile technologies against {companyData.name}&apos;s recruitment index to check your compatibility.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <strong className="text-xs font-black text-slate-400 uppercase tracking-widest block">Core Skills Inventory</strong>
                      {[
                        { title: "Must Have Skills", list: companyData.mustHaveSkills, status: "Critical" },
                        { title: "Good To Have Skills", list: companyData.goodToHaveSkills, status: "Recommended" },
                        { title: "Bonus Skills", list: companyData.bonusSkills, status: "Plus" }
                      ].map((skillGrp, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <strong className="text-xs font-black text-slate-800">{skillGrp.title}</strong>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-600">
                              {skillGrp.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {skillGrp.list.map(s => (
                              <span key={s} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg shadow-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 flex flex-col justify-between space-y-6">
                      <div className="space-y-2">
                        <strong className="text-xs font-black text-slate-400 uppercase tracking-widest block">Priority Learning Tasks</strong>
                        <p className="text-xs text-slate-500 font-medium">To optimize matching ratios, complete these checkpoints first:</p>
                      </div>

                      <div className="space-y-3">
                        {companyData.mustHaveSkills.slice(0, 3).map((skill, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700">
                            <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center font-black">
                              {idx + 1}
                            </div>
                            <span>Revise standard {skill} interview coding patterns.</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-400">Match score index</span>
                        <span className="text-indigo-600 font-black uppercase tracking-wider">85% Match</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 6: ROADMAPS & DAILY CHECKLIST */}
              {activeSubTab === "roadmap" && (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-900 font-display">Target Preparation Timeline</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      {[
                        { title: "30-Day Plan", list: companyData.roadmap30, color: "border-indigo-100 bg-indigo-50/20" },
                        { title: "60-Day Plan", list: companyData.roadmap60, color: "border-amber-100 bg-amber-50/10" },
                        { title: "90-Day Plan", list: companyData.roadmap90, color: "border-emerald-100 bg-emerald-50/10" }
                      ].map((plan, idx) => (
                        <div key={idx} className={cn("p-5 border rounded-3xl space-y-4", plan.color)}>
                          <strong className="text-sm font-black text-slate-800 block">{plan.title}</strong>
                          <ul className="space-y-3 text-[11px] text-slate-500 font-semibold leading-relaxed">
                            {plan.list.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex gap-2">
                                <span className="text-slate-800">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily checklist planner */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Task Planner</strong>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                        {Object.values(checkedPlanner).filter(Boolean).length} / {companyData.plannerChecklist.length} Checked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companyData.plannerChecklist.map((task, idx) => {
                        const taskId = `task-${idx}`;
                        const isDone = checkedPlanner[taskId];

                        return (
                          <div
                            key={taskId}
                            onClick={() => handleTogglePlanner(taskId)}
                            className={cn(
                              "p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none",
                              isDone
                                ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold"
                                : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-600"
                            )}
                          >
                            <span className="text-xs font-bold leading-relaxed">{task}</span>
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 7: STUDY NOTE RESOURCES */}
              {activeSubTab === "resources" && (
                <motion.div
                  key="resources"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-black text-slate-900 font-display">Resources & Study Vault</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Download targeted preparation PDFs, interview cheat sheets, and practice lists compiled specifically for {companyData.name}.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {[
                      { name: `${companyData.name} Placement Playbook 2026.pdf`, size: "2.4 MB", desc: "Comprehensive review of patterns and interview queries." },
                      { name: `${companyData.name} OA Aptitude Practice Sheet.xlsx`, size: "1.8 MB", desc: "150+ solved numerical and quantitative questions." },
                      { name: `${companyData.name} DSA Coding Questions.pdf`, size: "1.1 MB", desc: "Most repeated algorithmic arrays and dynamic codes." },
                      { name: `${companyData.name} HR Behavioral STAR Bank.pdf`, size: "950 KB", desc: "STAR format responses optimized for HR managers." }
                    ].map((file, idx) => (
                      <div key={idx} className="border border-slate-200/60 p-5 rounded-2xl flex items-start justify-between gap-4 bg-slate-50/20 hover:border-slate-300 transition-colors">
                        <div className="space-y-1">
                          <strong className="text-xs font-black text-slate-800 block">{file.name}</strong>
                          <span className="text-[10px] text-slate-400 font-bold block">{file.desc}</span>
                          <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block pt-1">{file.size}</span>
                        </div>
                        <button
                          onClick={() => alert(`Simulating file download for: ${file.name}`)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-950 text-slate-500 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-200"
                        >
                          <Download className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Readiness Panel & Interactive Copilot Strategy Coach */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Readiness Score Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-500 shrink-0" />
              <h3 className="text-base font-black text-slate-900 font-display">Target Readiness Score</h3>
            </div>

            <div className="flex items-center justify-between gap-6 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Score</span>
                <span className="text-xs text-slate-500 font-bold block leading-relaxed">
                  Completing daily task checklist increases readiness.
                </span>
              </div>
              
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                  <circle cx="40" cy="40" r="32" className="text-indigo-600" strokeWidth="6" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - readinessScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-black text-slate-850">{readinessScore}%</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Readiness Audit Report</strong>
              <div className="space-y-2 text-xs font-semibold leading-relaxed">
                <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-emerald-800">
                  <span className="font-black">Strong Areas:</span> {companyData.mustHaveSkills.slice(0,2).join(", ")}
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-amber-800">
                  <span className="font-black">Missing Gaps:</span> {companyData.mustHaveSkills[2] || "DBMS System Design"}
                </div>
              </div>
            </div>

            {/* Achievement Badge Shelf */}
            <div className="pt-4 border-t border-slate-150 space-y-3">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Company Badge Shelf</strong>
              <div className="flex gap-4 items-center bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shrink-0",
                  readinessScore >= 75
                    ? "bg-indigo-50 border-indigo-150 text-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-slate-100 border-slate-200 text-slate-350 filter grayscale"
                )}>
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-800 block">
                    {companyData.name} Ready Badge
                  </strong>
                  <span className="text-[9px] text-slate-400 font-bold block">
                    {readinessScore >= 75 ? "Unlocked ✓" : "Unlock at 75% Readiness Score"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Copilot Strategy Coach */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[520px]">
            
            {/* Copilot Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
                <Bot className="w-4.5 h-4.5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>
              <div>
                <strong className="text-xs font-black text-slate-850 block">{companyData.name} Copilot</strong>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Strategic Career Mentor</span>
              </div>
            </div>

            {/* Messages Drawer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
              {copilotMessages.map((msg) => {
                const isCopilot = msg.role === "copilot";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[85%] text-xs font-semibold leading-relaxed",
                      isCopilot ? "self-start" : "ml-auto flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[10px]",
                      isCopilot ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-900 border-slate-900 text-white"
                    )}>
                      {isCopilot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                      isCopilot ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                    )}>
                      {msg.content.split("\n").map((line, idx) => {
                        if (line.startsWith("### ")) {
                          return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                        }
                        if (line.startsWith("- ") || line.startsWith("* ")) {
                          return <li key={idx} className="ml-3 list-disc text-slate-600 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                        }
                        if (line.startsWith("1. ") || line.startsWith("2. ")) {
                          return <li key={idx} className="ml-3 list-decimal text-slate-600 font-bold my-0.5">{line.replace(/^\d+\.\s+/, "")}</li>;
                        }
                        const boldMatch = line.match(/\*\*(.*?)\*\*/g);
                        if (boldMatch) {
                          let parsedLine: React.ReactNode = line;
                          boldMatch.forEach((match) => {
                            const clean = match.replace(/\*\*/g, "");
                            const parts = (parsedLine as string).split(match);
                            parsedLine = (
                              <>
                                {parts[0]}
                                <strong className="text-slate-900 font-black">{clean}</strong>
                                {parts.slice(1).join(match)}
                              </>
                            );
                          });
                          return <p key={idx} className="my-1">{parsedLine}</p>;
                        }
                        return <p key={idx} className="my-1">{line}</p>;
                      })}
                    </div>
                  </div>
                );
              })}

              {copilotLoading && (
                <div className="flex gap-3 max-w-[80%] self-start animate-pulse text-xs">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                    <span>Analyzing target requirements...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Prompts */}
            <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
              {[
                { label: "Am I Ready?", query: "Am I ready?" },
                { label: "How to Crack?", query: "How to prepare?" },
                { label: "Suggested Projects", query: "Suggest projects" }
              ].map(prompt => (
                <button
                  key={prompt.label}
                  disabled={copilotLoading}
                  onClick={() => handleCopilotSend(prompt.query)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-650 hover:text-indigo-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                disabled={copilotLoading}
                placeholder={`Ask Copilot about ${companyData.name} prep...`}
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
                }}
                className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                disabled={copilotLoading || !copilotInput.trim()}
                onClick={() => handleCopilotSend()}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
