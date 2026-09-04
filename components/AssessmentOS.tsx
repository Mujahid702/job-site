"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Plus, ClipboardList, BookOpen, AlertCircle, Award, FileText, CheckCircle, 
  HelpCircle, Terminal, Play, Lock, ChevronRight, ChevronLeft, Flag, History, BarChart2, 
  BookOpenCheck, Compass, Check, AlertTriangle, PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Topic {
  id: string;
  category_slug: string;
  name: string;
  slug: string;
  difficulty?: string;
  estimated_time_minutes?: number;
  prerequisite_topics?: string[];
  skill_tags?: string[];
}

interface Question {
  id: string;
  question_text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "MCQ" | "Coding" | "SQL";
  marks: number;
  negative_marks: number;
  options?: { id: string; option_text: string }[];
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sql_details?: { sql_schema_seed?: string };
}

interface Template {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  passing_percentage: number;
  visibility: "Free" | "Premium";
  company_details?: {
    company_name: string;
    target_role: string;
  };
}

export default function AssessmentOS() {
  const [activeTab, setActiveTab] = useState<"home" | "practice" | "exams" | "analytics" | "history">("home");
  const [loading, setLoading] = useState(true);

  // Catalog cache state
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // User performance state
  const [performance, setPerformance] = useState<any>({
    topicScores: [],
    performanceTrends: [],
    recommendations: [],
    overallAccuracy: 0,
    averageResponseTimeSeconds: 0,
    codingSuccessRate: 0,
    sqlSuccessRate: 0,
    examSuccessRate: 0,
    consistencyScore: 0,
    difficultyAccuracy: { Easy: 0, Medium: 0, Hard: 0 }
  });

  // User history list
  const [historyAttempts, setHistoryAttempts] = useState<any[]>([]);

  // Scorecard modal states
  const [selectedAttemptIdForScorecard, setSelectedAttemptIdForScorecard] = useState<string | null>(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardData, setScorecardData] = useState<any>(null);

  const handleOpenScorecard = async (attemptId: string) => {
    setSelectedAttemptIdForScorecard(attemptId);
    setScorecardLoading(true);
    setScorecardData(null);
    try {
      const res = await fetch(`/api/assessments/session/result?attemptId=${attemptId}`);
      const data = await res.json();
      if (data.success) {
        setScorecardData(data);
      }
    } catch (err) {
      console.error("Failed to load scorecard metrics details", err);
    } finally {
      setScorecardLoading(false);
    }
  };

  // Practice Configuration Form state
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("aptitude");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [questionsLimit, setQuestionsLimit] = useState(5);

  // Active Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, any>>({});
  const [sessionStatus, setSessionStatus] = useState<"Idle" | "Active" | "Completed">("Idle");
  const [sessionType, setSessionType] = useState<"Practice" | "Exam">("Practice");

  // Timer states
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

  // Editor states
  const [editorLanguage, setEditorLanguage] = useState("python");
  const [codeContent, setCodeContent] = useState("");
  const [sqlQueryContent, setSqlQueryContent] = useState("");
  const [sandboxVerdicts, setSandboxVerdicts] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Load catalog & analytics data
  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments/catalog");
      const catalog = await res.json();
      if (catalog.success) {
        setCategories(catalog.categories || []);
        setTopics(catalog.topics || []);
        setTemplates(catalog.templates || []);

        const aptTopics = (catalog.topics || []).filter((t: any) => t.category_slug === "aptitude");
        if (aptTopics.length > 0) {
          setSelectedTopicId(aptTopics[0].id);
        }
      }

      // Fetch analytics
      const analRes = await fetch("/api/assessments/analytics/performance");
      const analytics = await analRes.json();
      if (analytics.success && analytics.report) {
        setPerformance({
          topicScores: analytics.report.topicMetrics || [],
          performanceTrends: analytics.performanceTrends || [],
          recommendations: analytics.report.weakTopics || [],
          overallAccuracy: analytics.report.overallAccuracy || 0,
          averageResponseTimeSeconds: analytics.report.averageResponseTimeSeconds || 0,
          codingSuccessRate: analytics.report.codingSuccessRate || 0,
          sqlSuccessRate: analytics.report.sqlSuccessRate || 0,
          examSuccessRate: analytics.report.examSuccessRate || 0,
          consistencyScore: analytics.report.consistencyScore || 0,
          difficultyAccuracy: analytics.report.difficultyAccuracy || { Easy: 0, Medium: 0, Hard: 0 }
        });
      }

      // Fetch attempts history
      const { data: dbAttempts } = await (await import("@/lib/supabase")).supabase
        .from("assessment_attempts")
        .select(`
          id,
          started_at,
          completed_at,
          is_completed,
          session:assessment_sessions(
            session_type,
            score_percentage,
            passed,
            template:assessment_templates(title)
          )
        `)
        .order("started_at", { ascending: false });

      setHistoryAttempts(dbAttempts || []);

    } catch (err) {
      console.error("Failed to load student dashboard catalogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  // Update topics select options on category update
  useEffect(() => {
    const filtered = topics.filter(t => t.category_slug === selectedCategorySlug);
    if (filtered.length > 0) {
      setSelectedTopicId(filtered[0].id);
    } else {
      setSelectedTopicId("");
    }
  }, [selectedCategorySlug, topics]);

  // Set default templates starter codes or queries when shifting questions
  useEffect(() => {
    if (sessionQuestions.length > 0 && sessionQuestions[currentQuestionIdx]) {
      const q = sessionQuestions[currentQuestionIdx];
      if (q.type === "Coding") {
        setCodeContent(
          editorLanguage === "python" 
            ? "def solution():\n    # Write python solution code here\n    pass" 
            : "function solution() {\n    // Write javascript code here\n}"
        );
        setSandboxVerdicts(null);
      } else if (q.type === "SQL") {
        setSqlQueryContent("SELECT * FROM users LIMIT 5;");
        setSandboxVerdicts(null);
      }
    }
  }, [currentQuestionIdx, sessionQuestions, editorLanguage]);

  // Timer interval scheduler
  useEffect(() => {
    if (sessionStatus === "Active" && timeLeftSeconds !== null && timeLeftSeconds > 0) {
      const timer = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitSession();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionStatus, timeLeftSeconds]);

  // Auto finalize session when timer expires
  const handleAutoSubmitSession = async () => {
    if (activeAttemptId) {
      await fetch("/api/assessments/session/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttemptId })
      });
      setSessionStatus("Completed");
      alert("Exam time limit exceeded. Your answers have been submitted automatically.");
      loadCatalogData();
    }
  };

  // Start Practice session
  const handleStartPractice = async () => {
    if (!selectedTopicId) return alert("Select a topic to practice.");
    setLoading(true);
    try {
      const res = await fetch("/api/assessments/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopicId,
          difficulty: selectedDifficulty,
          limit: questionsLimit
        })
      });
      const data = await res.json();
      if (data.success) {
        setSessionQuestions(data.questions || []);
        setActiveSessionId(data.sessionId);
        setActiveAttemptId(data.attemptId);
        setCurrentQuestionIdx(0);
        setSessionAnswers({});
        setSessionType("Practice");
        setSessionStatus("Active");
        setTimeLeftSeconds(null);
      } else {
        alert(`Failed to initialize: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error starting practice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Start Exam session
  const handleStartExam = async (templateId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId })
      });
      const data = await res.json();
      if (data.success) {
        setSessionQuestions(data.questions || []);
        setActiveSessionId(data.sessionId);
        setActiveAttemptId(data.attemptId);
        setCurrentQuestionIdx(0);
        setSessionAnswers({});
        setSessionType("Exam");
        setSessionStatus("Active");
        setTimeLeftSeconds(data.durationMinutes * 60);

        // Enter fullscreen for lock security
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        }
      } else {
        alert(`Failed to start exam: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error starting exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer (MCQ Choice Option)
  const handleSubmitMCQAnswer = async (optionId: string) => {
    if (!activeAttemptId || sessionStatus !== "Active") return;
    const q = sessionQuestions[currentQuestionIdx];

    // optimistically log locally
    setSessionAnswers(prev => ({
      ...prev,
      [q.id]: { optionId, isCorrect: false }
    }));

    try {
      const res = await fetch("/api/assessments/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttemptId,
          questionId: q.id,
          selectedOptionId: optionId,
          timeSpent: 20
        })
      });
      const data = await res.json();
      if (data.success) {
        setSessionAnswers(prev => ({
          ...prev,
          [q.id]: { optionId, isCorrect: data.isCorrect }
        }));
      }
    } catch (err) {
      console.error("Failed to submit MCQ answer choice:", err);
    }
  };

  // Submit Coding Challenge
  const handleRunCode = async () => {
    if (!activeAttemptId || evaluating) return;
    const q = sessionQuestions[currentQuestionIdx];
    setEvaluating(true);
    setSandboxVerdicts(null);

    try {
      const res = await fetch("/api/assessments/session/coding-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttemptId,
          questionId: q.id,
          code: codeContent,
          language: editorLanguage,
          timeSpent: 30
        })
      });
      const data = await res.json();
      if (data.success) {
        setSandboxVerdicts(data);
        setSessionAnswers(prev => ({
          ...prev,
          [q.id]: { code: codeContent, isCorrect: data.isCorrect }
        }));
      } else {
        alert(data.message || "Compilation failed.");
      }
    } catch (err: any) {
      alert(`Execution Error: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Submit SQL query
  const handleRunSQL = async () => {
    if (!activeAttemptId || evaluating) return;
    const q = sessionQuestions[currentQuestionIdx];
    setEvaluating(true);
    setSandboxVerdicts(null);

    try {
      const res = await fetch("/api/assessments/session/sql-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttemptId,
          questionId: q.id,
          query: sqlQueryContent,
          timeSpent: 30
        })
      });
      const data = await res.json();
      if (data.success) {
        setSandboxVerdicts(data);
        setSessionAnswers(prev => ({
          ...prev,
          [q.id]: { query: sqlQueryContent, isCorrect: data.isCorrect }
        }));
      } else {
        alert(data.message || "Query failed.");
      }
    } catch (err: any) {
      alert(`Query execution failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Complete/Finish the Session
  const handleFinishSession = async () => {
    if (!activeAttemptId) return;
    if (!window.confirm("Are you sure you want to finish the session and compute your scorecard?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/assessments/session/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttemptId })
      });
      const data = await res.json();
      if (data.success) {
        setSessionStatus("Completed");
        alert(`Session completed! Score: ${data.score?.score_percentage}% | Result: ${data.score?.passed ? "PASSED" : "FAILED"}`);

        // Exit fullscreen lock
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        
        loadCatalogData();
        setActiveTab("history");
      }
    } catch (err: any) {
      alert(`Finalization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render Format Timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remains = secs % 60;
    return `${mins}:${remains < 10 ? "0" : ""}${remains}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-800">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading Assessment OS...</p>
      </div>
    );
  }

  // ====================================================
  // SCREEN: ACTIVE SESSION RUNNING VIEW
  // ====================================================
  if (sessionStatus === "Active" && sessionQuestions.length > 0) {
    const q = sessionQuestions[currentQuestionIdx];
    const loggedAnswer = sessionAnswers[q.id];

    return (
      <div className="space-y-6 text-slate-800 text-left min-h-screen pb-20">
        {/* Session Header Deck */}
        <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-[2rem] border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-indigo-650 text-white rounded text-[8px] font-mono font-black uppercase tracking-wider">
              {sessionType} Mode Active
            </span>
            <h2 className="text-lg font-black tracking-tight font-display">
              {sessionType === "Exam" ? "Recruitment Mock Assessment" : "Learning Practice Ground"}
            </h2>
          </div>

          <div className="flex items-center gap-6 font-mono">
            {timeLeftSeconds !== null && (
              <div className="flex items-center gap-2 bg-indigo-950 border border-indigo-800 px-4 py-2 rounded-xl text-indigo-300">
                <Lock className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-sm font-black">Time Left: {formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleFinishSession}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-750 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              Finish Assessment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Questions Navigation & Prompt */}
          <div className="lg:col-span-2 space-y-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-400 uppercase font-mono">
                Question {currentQuestionIdx + 1} of {sessionQuestions.length}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono",
                q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                {q.difficulty}
              </span>
            </div>

            {/* Prompt body */}
            <div className="space-y-4">
              <h3 className="text-base font-black text-slate-900 leading-normal font-mono">
                {q.question_text}
              </h3>

              {q.constraints && (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[10px] font-mono text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wide">Constraints & Limits:</p>
                  <p>{q.constraints}</p>
                </div>
              )}
            </div>

            {/* ==================== WORKSPACE FOR MCQ ==================== */}
            {q.type === "MCQ" && (
              <div className="space-y-3 pt-4">
                {q.options?.map((opt, optIdx) => {
                  const isSelected = loggedAnswer?.optionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSubmitMCQAnswer(opt.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-indigo-50 border-indigo-200 text-indigo-650 font-black shadow-sm"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <span>{opt.option_text}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ==================== WORKSPACE FOR CODING ==================== */}
            {q.type === "Coding" && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center bg-slate-900 px-4 py-2 border border-slate-800 rounded-xl text-white">
                  <span className="text-[10px] font-black font-mono text-indigo-400 uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Interactive Code Sandbox
                  </span>
                  <select
                    value={editorLanguage}
                    onChange={(e) => setEditorLanguage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider focus:outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 min-h-[250px]">
                  <Editor
                    height="250px"
                    language={editorLanguage}
                    theme="vs-dark"
                    value={codeContent}
                    onChange={(val) => setCodeContent(val || "")}
                    options={{ fontSize: 12, minimap: { enabled: false } }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono">Boilerplate functions loaded. Ready to run.</span>
                  <button
                    disabled={evaluating}
                    onClick={handleRunCode}
                    className="px-6 py-2.5 bg-slate-950 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{evaluating ? "Evaluating..." : "Run Test Cases"}</span>
                  </button>
                </div>

                {/* Sandbox outputs display */}
                {sandboxVerdicts && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-mono text-slate-600 space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1 text-[9px] font-black uppercase">
                      <span>Sandbox execution output:</span>
                      <span className={sandboxVerdicts.isCorrect ? "text-emerald-600" : "text-rose-500"}>
                        {sandboxVerdicts.status}
                      </span>
                    </div>
                    <p>Passed test cases: <strong className="text-slate-800">{sandboxVerdicts.passedCount} / {sandboxVerdicts.totalCount}</strong></p>
                    {sandboxVerdicts.status !== "Accepted" && (
                      <p className="text-rose-500 font-bold bg-rose-50 p-2.5 rounded border border-rose-100 mt-1">
                        Verdicts: Correct expected outputs are required to pass all hidden tests.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==================== WORKSPACE FOR SQL ==================== */}
            {q.type === "SQL" && (
              <div className="space-y-4 pt-4">
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1">
                  <p className="font-bold text-indigo-400 uppercase tracking-wider">Isolated Database Schema Schema Seed:</p>
                  <p className="text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-900 mt-1 max-h-24 overflow-y-auto">
                    {q.sql_details?.sql_schema_seed || "CREATE TABLE users (id INT, name TEXT);"}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 min-h-[200px]">
                  <Editor
                    height="200px"
                    language="sql"
                    theme="vs-dark"
                    value={sqlQueryContent}
                    onChange={(val) => setSqlQueryContent(val || "")}
                    options={{ fontSize: 12, minimap: { enabled: false } }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono">SQLite isolation sandbox ready.</span>
                  <button
                    disabled={evaluating}
                    onClick={handleRunSQL}
                    className="px-6 py-2.5 bg-slate-950 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{evaluating ? "Executing..." : "Execute Query"}</span>
                  </button>
                </div>

                {/* SQL Result output */}
                {sandboxVerdicts && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-mono text-slate-600 space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1 text-[9px] font-black uppercase">
                      <span>SQL Sandbox outcome:</span>
                      <span className={sandboxVerdicts.isCorrect ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                        {sandboxVerdicts.status}
                      </span>
                    </div>

                    {sandboxVerdicts.sandboxOutput?.columns && (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-40 bg-white">
                        <table className="w-full text-left text-[9px] font-mono">
                          <thead className="bg-slate-50 text-slate-400 uppercase border-b border-slate-200">
                            <tr>
                              {sandboxVerdicts.sandboxOutput.columns.map((col: string, cIdx: number) => (
                                <th key={cIdx} className="px-4 py-2">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {sandboxVerdicts.sandboxOutput.rows?.map((row: any[], rIdx: number) => (
                              <tr key={rIdx}>
                                {row.map((val: any, vIdx: number) => (
                                  <td key={vIdx} className="px-4 py-2">{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Questions list checklist nav */}
          <div className="space-y-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-base font-black text-slate-900 font-display">Questions Catalog</h3>
            <div className="grid grid-cols-5 gap-2.5">
              {sessionQuestions.map((sq, idx) => {
                const answered = sessionAnswers[sq.id];
                return (
                  <button
                    key={sq.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={cn(
                      "w-10 h-10 rounded-xl border text-xs font-mono font-black flex items-center justify-center transition-all cursor-pointer",
                      currentQuestionIdx === idx
                        ? "bg-slate-950 text-white border-slate-950 shadow-md scale-105"
                        : answered
                          ? "bg-indigo-50 border-indigo-200 text-indigo-650"
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-350"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                className="flex-1 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                disabled={currentQuestionIdx === sessionQuestions.length - 1}
                onClick={() => setCurrentQuestionIdx(prev => Math.min(sessionQuestions.length - 1, prev + 1))}
                className="flex-1 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // SCREEN: STANDARD STUDENT DASHBOARD PANELS
  // ====================================================
  return (
    <div className="space-y-12 pb-20 text-slate-800 text-left">
      
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-650 font-bold text-xs uppercase tracking-widest mb-2 font-mono">
          <BookOpenCheck className="w-4.5 h-4.5 text-indigo-600" />
          <span>Interactive Recruitment Readiness OS</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Recruitment Assessments</h1>
        <p className="text-slate-500 font-semibold text-sm mt-2 max-w-xl">
          Track syllabus topic mastery, practice adaptive quantitative tests, compile solutions in real-time, and target company mocks.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
        
        {/* ==================== TAB 1: DASHBOARD HOME ==================== */}
        {activeTab === "home" && (
          <div className="space-y-12">
            
            {/* HUD diagnostics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] border border-slate-900 shadow-xl flex flex-col gap-6">
                <div className="w-14 h-14 bg-indigo-650 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Placement Readiness Score</p>
                  <p className="text-3xl font-black tracking-tight">{performance.overallAccuracy}%</p>
                  <p className="text-[10px] text-slate-500 font-bold font-mono mt-1">Overall calculated diagnostic accuracy index.</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-indigo-200 transition-all">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-950/20">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weak Concepts Warning</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">
                    {performance.recommendations.length > 0 
                      ? `Needs Practice: ${performance.recommendations[0].topicName}`
                      : "Zero Weak Concept Warnings!"}
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                    {performance.recommendations.length > 0 
                      ? performance.recommendations[0].recommendation
                      : "You have no weak concepts at this time."}
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-indigo-200 transition-all">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-950/20">
                  <PlayCircle className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Syllabus Topic Mastery</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    {performance.topicScores.length > 0 ? performance.topicScores.length : 0} Topics
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Completed solved syllabus milestones checks.</p>
                </div>
              </div>
            </div>

            {/* Quick selectors: Practice vs Exam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Practice card */}
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col justify-between gap-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-indigo-650 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    Drill Practice Playground
                  </span>
                  <h3 className="text-xl font-black text-slate-900 font-display pt-1">Topic-based Playground</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-normal">
                    Strengthen diagnostic skills by solving customized quizzes on any category, difficulty, or prerequisite topic syllabus.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("practice")}
                  className="w-full py-3.5 bg-slate-950 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer text-center"
                >
                  Configure Practice Set
                </button>
              </div>

              {/* Exam Card */}
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col justify-between gap-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-rose-600 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    Assessment Timed Exam Center
                  </span>
                  <h3 className="text-xl font-black text-slate-900 font-display pt-1">Company-Style Practice Assessments</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-normal">
                    Take legitimacy timed company-style exams (Amazon, TCS, Deloitte mock blueprints) with lock screen timers.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("exams")}
                  className="w-full py-3.5 bg-slate-950 hover:bg-rose-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer text-center"
                >
                  Open Exam Center
                </button>
              </div>

            </div>

            {/* AI Recommendations panel */}
            {performance.recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Suggested AI Study Targets</h3>
                <div className="space-y-3">
                  {performance.recommendations.map((rec: any) => (
                    <div 
                      key={rec.topicId} 
                      className="p-5 bg-indigo-50/20 border border-indigo-150 rounded-2xl flex justify-between items-center gap-4 text-xs font-semibold text-slate-650"
                    >
                      <div className="space-y-1">
                        <strong className="text-indigo-650 uppercase font-mono text-[9px] block font-mono">Status: {rec.status}</strong>
                        <p className="text-slate-700 leading-normal font-bold">{rec.recommendation}</p>
                      </div>
                      <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-650 rounded-xl font-mono text-[10px]">
                        {rec.topicName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: PRACTICE PLAYGROUND ==================== */}
        {activeTab === "practice" && (
          <div className="space-y-8 max-w-xl text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Configure Practice Run</h2>
              <p className="text-slate-400 text-xs font-semibold">Select category scope, difficulty, and question count checks.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Category</label>
                  <select
                    value={selectedCategorySlug}
                    onChange={(e) => setSelectedCategorySlug(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Topic</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {topics.filter(t => t.category_slug === selectedCategorySlug).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.difficulty || "Medium"})</option>
                    ))}
                    {topics.filter(t => t.category_slug === selectedCategorySlug).length === 0 && (
                      <option value="">No topics loaded</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Question Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={questionsLimit}
                    onChange={(e) => setQuestionsLimit(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStartPractice}
              className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              Start Practice Session
            </button>
          </div>
        )}

        {/* ==================== TAB 3: EXAM CENTER ==================== */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Active Timed Exam Blueprints</h2>
              <p className="text-slate-400 text-xs font-semibold">Verify mock assessments and company-style timed challenges list.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(t => (
                <div 
                  key={t.id} 
                  className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-350 shadow-sm flex flex-col justify-between gap-4 text-left transition-all"
                >
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-650 rounded font-mono text-[9px] font-black uppercase tracking-wider">
                      {t.company_details ? "Company-Style Practice" : "Standard Mock Exam"}
                    </span>
                    <h3 className="text-base font-black text-slate-900 tracking-tight pt-1">{t.title}</h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                      {t.description || "Simulated timed test matching industry diagnostics syllabus."}
                    </p>
                    
                    <div className="flex gap-4 pt-1 font-mono text-[9px] text-slate-400 font-bold uppercase">
                      <span>Duration: {t.duration_minutes} Mins</span>
                      <span>Pass Cutoff: {t.passing_percentage}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(t.id)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-rose-650 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    Start Timed Exam
                  </button>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="col-span-2 py-20 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-mono">
                  No published exam templates configured by administrator
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: DIAGNOSTIC ANALYTICS ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Diagnostic & Mastery rollup</h2>
              <p className="text-slate-400 text-xs font-semibold">Review accuracy aggregates, rolling streaks, and syllabus topic masteries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left side: Topic Accuracy list */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Syllabus accuracy rollup</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                  {performance.topicScores.map((ts: any) => (
                    <div key={ts.topicId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-semibold">
                      <div className="space-y-1 text-left">
                        <span className="font-bold text-slate-800">{ts.topicName}</span>
                        <span className={cn(
                          "block text-[8px] font-black uppercase tracking-wider font-mono",
                          ts.status === "Strong" ? "text-emerald-600" : ts.status === "Needs Practice" ? "text-rose-500" : "text-amber-500"
                        )}>
                          {ts.status}
                        </span>
                      </div>
                      <strong className="text-slate-800">{ts.accuracyPercentage}% accuracy ({ts.correctCount} / {ts.attemptsCount} solved)</strong>
                    </div>
                  ))}
                  {performance.topicScores.length === 0 && (
                    <p className="text-center py-12 text-slate-450 font-mono text-xs border border-dashed border-slate-150 rounded-xl">No solved topic records found</p>
                  )}
                </div>
              </div>

              {/* Right side: Performance timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Performance history trend</h3>
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 min-h-[200px] flex flex-col justify-center items-center gap-2">
                  <BarChart2 className="w-10 h-10 text-slate-300" />
                  <p className="text-slate-500 font-bold text-xs">Diagnostic rolling timeline graph is ready.</p>
                  <p className="text-slate-400 text-[10px] max-w-xs text-center font-mono">Average session correct ratio maps rolling indicators per day.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 5: HISTORY REGISTRY ==================== */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Attempts Registry History</h2>
              <p className="text-slate-400 text-xs font-semibold">Complete ledger of finished and abandoned diagnostic assessments attempts.</p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Started Time</th>
                    <th className="px-6 py-4">Assessment Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Result Score</th>
                    <th className="px-6 py-4">Outcome Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700 font-mono">
                  {historyAttempts.map((att) => {
                    const score = att.session?.score_percentage;
                    const passed = att.session?.passed;
                    return (
                      <tr 
                        key={att.id} 
                        onClick={() => handleOpenScorecard(att.id)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-all"
                      >
                        <td className="px-6 py-4 text-slate-400">{new Date(att.started_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {att.session?.template?.title || "Adaptive Practice Set"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase">
                            {att.session?.session_type || "Practice"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          {score !== null && score !== undefined ? `${score}%` : "---"}
                        </td>
                        <td className="px-6 py-4">
                          {score === null || score === undefined ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] uppercase tracking-wide">Incomplete</span>
                          ) : passed ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] uppercase tracking-wide">PASSED</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] uppercase tracking-wide">FAILED</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {historyAttempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400">You have no prior attempt records logs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCORECARD DETAIL MODAL */}
        {selectedAttemptIdForScorecard && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto text-left relative animate-fade-in">
              
              <button 
                onClick={() => setSelectedAttemptIdForScorecard(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 font-mono text-xs font-black uppercase tracking-wider bg-slate-50 border border-slate-200 hover:border-slate-350 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
              >
                Close [x]
              </button>

              {scorecardLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-800">
                  <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Fetching score metrics...</p>
                </div>
              )}

              {scorecardData && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded font-mono text-[9px] font-black uppercase tracking-wider",
                      scorecardData.score?.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {scorecardData.score?.passed ? "Passed Threshold" : "Needs Improvement"}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1 font-display">
                      {scorecardData.attempt?.session?.template?.title || "Adaptive Practice Set"} Scorecard
                    </h3>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Total Score</p>
                      <p className="text-xl font-black text-slate-850 mt-1">{scorecardData.score?.scorePercentage}%</p>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Percentile Rank</p>
                      <p className="text-xl font-black text-slate-850 mt-1">
                        {scorecardData.report?.percentile !== null ? `${scorecardData.report.percentile}th` : "---"}
                      </p>
                      <p className="text-[7px] text-slate-400 mt-1 font-mono uppercase">
                        {scorecardData.report?.percentile !== null ? "Calculated against peers" : "Insufficient peer data"}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Solve Speed</p>
                      <p className="text-xl font-black text-slate-850 mt-1">{scorecardData.report?.timeEfficiency?.speedRating}</p>
                      <p className="text-[7px] text-slate-400 mt-1 font-mono uppercase">
                        {scorecardData.report?.timeEfficiency?.averageTimePerQuestion}s / question
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Correct Answers</p>
                      <p className="text-xl font-black text-slate-850 mt-1">
                        {scorecardData.score?.correctAnswers} / {scorecardData.score?.totalQuestions}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-5 bg-indigo-50/20 border border-indigo-150 rounded-2xl">
                    <p className="text-[9px] font-black text-indigo-650 uppercase tracking-widest font-mono block mb-1">Actionable Practice suggestion</p>
                    <p className="text-xs font-semibold text-slate-700 leading-normal">{scorecardData.report?.recommendation}</p>
                  </div>

                  {/* Difficulty aggregates */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Difficulty performance breakdown</h4>
                    <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                      {Object.keys(scorecardData.report?.difficultyAnalysis || {}).map(diff => {
                        const dat = scorecardData.report.difficultyAnalysis[diff];
                        return (
                          <div key={diff} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                            <span className="block text-slate-400 uppercase text-[8px] font-black">{diff}</span>
                            <strong className="block text-xs text-slate-800 mt-1">{dat.accuracy}%</strong>
                            <span className="block text-[8px] text-slate-450 mt-0.5">({dat.total} solved)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic breakdown list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Topic performance analysis</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase font-mono border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Topic</th>
                            <th className="px-4 py-2.5">Accuracy</th>
                            <th className="px-4 py-2.5">Attempts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {scorecardData.report?.topicAnalysis?.map((topic: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2.5 font-bold text-slate-800">{topic.topicName}</td>
                              <td className="px-4 py-2.5 font-mono">{topic.accuracy}%</td>
                              <td className="px-4 py-2.5 font-mono">{topic.total} questions</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
