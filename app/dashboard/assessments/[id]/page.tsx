"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Sparkles, Code, Play, Send, HelpCircle, BookOpen, 
  Settings, CheckCircle, XCircle, AlertTriangle, RefreshCw, Cpu, Database
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Define option types
interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "MCQ" | "Coding" | "SQL";
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sample_test_cases?: { input: string; expected_output: string; explanation?: string }[];
  sql_schema_seed?: string;
  starter_codes?: Record<string, string>;
  explanation?: string;
  hints?: string[];
  options?: Option[];
  correct_answer_text?: string;
}

export default function AssessmentWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("python");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [codeContent, setCodeContent] = useState<string>("");
  
  // Custom Run States
  const [customInput, setCustomInput] = useState<string>("");
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Console Results State
  const [activeConsoleTab, setActiveConsoleTab] = useState<"result" | "ai" | "schema">("result");
  const [runResults, setRunResults] = useState<any>(null);
  const [submitResults, setSubmitResults] = useState<any>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [mcqChecked, setMcqChecked] = useState<boolean>(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadQuestion() {
      setLoading(true);
      try {
        // Query assessment question details
        const { data: qData, error: qError } = await supabase
          .from("assessment_questions")
          .select(`
            *,
            options:assessment_options(*)
          `)
          .eq("id", id)
          .maybeSingle();

        if (qError) throw qError;

        let loadedQ: Question | null = qData;

        // Fallback: If not found in database, check preset seeds
        if (!loadedQ) {
          const { PRESET_QUESTIONS } = await import("@/lib/db/assessment");
          const preset = PRESET_QUESTIONS.find(pq => pq.id === id);
          if (preset) {
            loadedQ = {
              id: preset.id,
              question_text: preset.question_text,
              difficulty: preset.difficulty,
              type: preset.type || "MCQ",
              constraints: preset.constraints,
              input_format: preset.input_format,
              output_format: preset.output_format,
              sample_test_cases: preset.sample_test_cases,
              sql_schema_seed: preset.sql_schema_seed,
              starter_codes: preset.starter_codes,
              explanation: preset.explanation,
              hints: preset.hints,
              options: preset.options,
              correct_answer_text: preset.correct_answer_text
            };
          }
        }

        if (loadedQ) {
          setQuestion(loadedQ);
          
          // Configure initial workspace values
          if (loadedQ.type === "SQL") {
            setLanguage("sql");
            setCodeContent(loadedQ.starter_codes?.sql || "SELECT * FROM Employee;");
            setActiveConsoleTab("schema");
          } else if (loadedQ.type === "Coding") {
            const defaultLang = "python";
            setLanguage(defaultLang);
            setCodeContent(loadedQ.starter_codes?.[defaultLang] || "# Write code here");
          }
        }
      } catch (err) {
        console.error("Failed to load workspace question:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [id]);

  // Handle language switch and load template code
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (question && question.starter_codes?.[newLang]) {
      setCodeContent(question.starter_codes[newLang]);
    } else {
      // Boilerplate fallback templates
      if (newLang === "python") setCodeContent("def solve():\n    pass\n\nif __name__ == \"__main__\":\n    solve()");
      else if (newLang === "javascript") setCodeContent("function solve() {\n    // code\n}\nsolve();");
      else if (newLang === "cpp") setCodeContent("#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}");
      else setCodeContent("// Boilerplate template content");
    }
  };

  // Run Code against visible test cases
  const handleRunCode = async () => {
    if (!question) return;
    setRunning(true);
    setRunResults(null);
    setSubmitResults(null);
    setActiveConsoleTab("result");

    try {
      const endpoint = question.type === "SQL" ? "/api/assessment/sql/run" : "/api/assessment/compiler/run";
      const payload = question.type === "SQL" 
        ? { questionId: question.id, query: codeContent }
        : { questionId: question.id, language, code: codeContent, customInput: useCustomInput ? customInput : undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRunResults(data);
      } else {
        setRunResults({ success: false, error: data.message || "Failed execution runtime." });
      }
    } catch (err: any) {
      setRunResults({ success: false, error: err.message || "Network execution failed." });
    } finally {
      setRunning(false);
    }
  };

  // Submit Code solution
  const handleSubmitCode = async () => {
    if (!question) return;
    setSubmitting(true);
    setSubmitResults(null);
    setRunResults(null);
    setAiFeedback("");
    setActiveConsoleTab("result");

    try {
      const endpoint = question.type === "SQL" ? "/api/assessment/sql/run" : "/api/assessment/compiler/submit";
      const payload = question.type === "SQL"
        ? { questionId: question.id, query: codeContent }
        : { questionId: question.id, language, code: codeContent };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitResults(data);
        
        // Trigger AI coach feedback streaming
        triggerAICoach(codeContent, data.status || (data.match ? "Accepted" : "Wrong Answer"));
      } else {
        setSubmitResults({ success: false, error: data.message || "Submission failed." });
      }
    } catch (err: any) {
      setSubmitResults({ success: false, error: err.message || "Network submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger AI Coding Coach feedback analysis
  const triggerAICoach = async (code: string, status: string) => {
    if (!question) return;
    setLoadingAi(true);
    try {
      const res = await fetch("/api/assessment/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          code,
          language,
          submissionStatus: status
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiFeedback(data.feedback);
      } else {
        setAiFeedback("Unable to retrieve AI coaching review at this time. Check back later.");
      }
    } catch {
      setAiFeedback("Network error while connecting to AI Review Engine.");
    } finally {
      setLoadingAi(false);
    }
  };

  // MCQ Checking
  const handleCheckMCQ = async () => {
    if (!question) return;
    setMcqChecked(true);

    const isCorrect = selectedOption.toLowerCase() === (question.correct_answer_text || "").toLowerCase();
    
    // Save to user attempts logs if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "guest-user";

      if (userId !== "guest-user") {
        await supabase.from("assessment_submissions").insert({
          user_id: userId,
          question_id: question.id,
          language: "mcq",
          code_content: `Option selected: ${selectedOption}`,
          status: isCorrect ? "Accepted" : "Wrong Answer",
          passed_test_cases: isCorrect ? 1 : 0,
          total_test_cases: 1
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs animate-pulse">Entering Code Workspace...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-slate-700 font-black text-sm uppercase tracking-wider">Practice Challenge Not Found</p>
        <Link href="/dashboard/assessments" className="text-indigo-650 hover:underline font-bold text-xs uppercase tracking-widest">Back to Arena</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Workspace Top Toolbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/assessments" 
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="h-4 w-[1px] bg-slate-200"></span>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">Practice Workspace</h1>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider mt-1">{question.type} Problem Set</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setEditorTheme("vs-dark")} 
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer", editorTheme === "vs-dark" ? "bg-slate-900 text-white" : "text-slate-500")}
            >
              Dark
            </button>
            <button 
              onClick={() => setEditorTheme("light")} 
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer", editorTheme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              Light
            </button>
          </div>
        </div>
      </header>

      {/* Main split grid */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        
        {/* Left Pane: Question criteria */}
        <section className="border-r border-slate-200 bg-white overflow-y-auto p-8 flex flex-col justify-between max-h-[calc(100vh-80px)] text-left">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                question.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" : question.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                {question.difficulty}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Linked Pool Challenge
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {question.question_text}
            </h2>

            {question.type !== "MCQ" && (
              <div className="space-y-5 text-xs">
                {question.constraints && (
                  <div className="space-y-1">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Constraints:</strong>
                    <pre className="bg-slate-50 border border-slate-150 p-3 rounded-xl font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">{question.constraints}</pre>
                  </div>
                )}
                {question.input_format && (
                  <div className="space-y-1">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Input Format:</strong>
                    <p className="text-slate-650 leading-relaxed font-semibold">{question.input_format}</p>
                  </div>
                )}
                {question.output_format && (
                  <div className="space-y-1">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Output Format:</strong>
                    <p className="text-slate-650 leading-relaxed font-semibold">{question.output_format}</p>
                  </div>
                )}
              </div>
            )}

            {/* Test case examples visual list */}
            {question.type !== "MCQ" && question.sample_test_cases && (
              <div className="space-y-3">
                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Sample cases:</strong>
                {question.sample_test_cases.map((tc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2">
                    <p className="font-bold text-slate-500 font-mono text-[10px] uppercase">Example {idx + 1}:</p>
                    <div className="font-mono space-y-1 text-slate-700">
                      <p><span className="text-slate-400">Input:</span> {tc.input.replace(/\n/g, " | ")}</p>
                      <p><span className="text-slate-400">Output:</span> {tc.expected_output}</p>
                    </div>
                    {tc.explanation && (
                      <p className="text-[10px] text-slate-500 font-semibold italic mt-1">Explanation: {tc.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* MCQ Option Checker interface */}
            {question.type === "MCQ" && question.options && (
              <div className="space-y-4">
                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Select correct statement option:</strong>
                <div className="space-y-2.5">
                  {question.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => !mcqChecked && setSelectedOption(opt.option_text)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border text-xs font-semibold flex justify-between items-center transition-all cursor-pointer",
                        selectedOption === opt.option_text 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" 
                          : "bg-white border-slate-150 text-slate-600 hover:border-slate-350"
                      )}
                    >
                      <span>{opt.option_text}</span>
                    </button>
                  ))}
                </div>

                {!mcqChecked ? (
                  <button
                    onClick={handleCheckMCQ}
                    disabled={!selectedOption}
                    className="w-full py-3.5 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Answer Choice</span>
                  </button>
                ) : (
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs font-bold flex items-center gap-3",
                    selectedOption.toLowerCase() === (question.correct_answer_text || "").toLowerCase()
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border-rose-150 text-rose-600"
                  )}>
                    {selectedOption.toLowerCase() === (question.correct_answer_text || "").toLowerCase() ? (
                      <>
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-black leading-none">Correct Answer!</p>
                          <p className="text-[10px] font-semibold mt-1">{question.explanation || "Well solved!"}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-black leading-none">Incorrect Answer</p>
                          <p className="text-[10px] font-semibold mt-1">Expected: {question.correct_answer_text}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {question.hints && question.hints.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-150 text-xs text-slate-500 font-semibold space-y-1">
              <span className="font-black uppercase tracking-wider text-[9px] block text-slate-400">Hints:</span>
              <p>• {question.hints[0]}</p>
            </div>
          )}
        </section>

        {/* Right Pane: Code workspace + console results */}
        {question.type !== "MCQ" && (
          <section className="bg-slate-900 overflow-hidden flex flex-col justify-between max-h-[calc(100vh-80px)]">
            
            {/* Toolbar: Language selections */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <Code className="w-4 h-4 text-slate-400" />
                {question.type === "SQL" ? (
                  <span className="text-white font-mono font-bold uppercase">SQL Playground</span>
                ) : (
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 focus:outline-none font-bold uppercase text-[10px] tracking-wider"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-[10px]">Font size:</span>
                <input 
                  type="number" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Math.max(10, Number(e.target.value)))}
                  className="bg-slate-900 border border-slate-800 text-white text-center w-12 py-0.5 rounded text-[10px]"
                />
              </div>
            </div>

            {/* Monaco Editor Component */}
            <div className="flex-grow min-h-[300px]">
              <Editor
                height="100%"
                language={language}
                theme={editorTheme}
                value={codeContent}
                onChange={(val) => setCodeContent(val || "")}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  tabSize: 4,
                  cursorBlinking: "smooth",
                  wordWrap: "on"
                }}
              />
            </div>

            {/* Sub-console results */}
            <div className="border-t border-slate-800 bg-slate-950 flex flex-col shrink-0">
              {/* Tab options selector */}
              <div className="flex border-b border-slate-800 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {question.type === "SQL" && (
                  <button 
                    onClick={() => setActiveConsoleTab("schema")}
                    className={cn("px-4 py-3 border-b-2 cursor-pointer transition-all", activeConsoleTab === "schema" ? "border-indigo-500 text-white" : "border-transparent hover:text-slate-300")}
                  >
                    Mock Database Schema
                  </button>
                )}
                <button 
                  onClick={() => setActiveConsoleTab("result")}
                  className={cn("px-4 py-3 border-b-2 cursor-pointer transition-all", activeConsoleTab === "result" ? "border-indigo-500 text-white" : "border-transparent hover:text-slate-300")}
                >
                  Execution Console
                </button>
                <button 
                  onClick={() => setActiveConsoleTab("ai")}
                  className={cn("px-4 py-3 border-b-2 cursor-pointer transition-all flex items-center gap-1 cursor-pointer", activeConsoleTab === "ai" ? "border-indigo-500 text-white" : "border-transparent hover:text-slate-300")}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  AI Coding Coach
                </button>
              </div>

              {/* Console display area */}
              <div className="p-6 h-56 overflow-y-auto text-left text-xs font-mono text-slate-300">
                
                {/* Visual DB schema seed for SQL */}
                {activeConsoleTab === "schema" && question.sql_schema_seed && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">Mock Database Seeds:</span>
                      <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[10px] leading-relaxed text-slate-400 whitespace-pre-wrap">{question.sql_schema_seed}</pre>
                    </div>
                  </div>
                )}

                {/* Compile run results */}
                {activeConsoleTab === "result" && (
                  <div className="space-y-3">
                    {!runResults && !submitResults && !running && !submitting && (
                      <p className="text-slate-500 text-[11px] italic font-semibold">Write code and click 'Run Code' or 'Submit Solution' to execute query test cases.</p>
                    )}

                    {(running || submitting) && (
                      <div className="flex items-center gap-2 text-indigo-400 animate-pulse font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Compiling code execution blocks in sandboxed containers...</span>
                      </div>
                    )}

                    {/* Standard compiler runs */}
                    {runResults && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Run Status:</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                            runResults.results?.every((r: any) => r.status === "Accepted") ? "bg-emerald-950 text-emerald-450 border border-emerald-800" : "bg-rose-950 text-rose-450 border border-rose-800"
                          )}>
                            {runResults.results?.every((r: any) => r.status === "Accepted") ? "Accepted" : "Wrong Answer"}
                          </span>
                        </div>

                        {runResults.results?.map((r: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                              <span>Case {idx + 1}:</span>
                              <span className={r.status === "Accepted" ? "text-emerald-500" : "text-rose-500"}>{r.status}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-350">
                              {r.input && <p><span className="text-slate-500">Input:</span> {r.input.replace(/\n/g, " | ")}</p>}
                              <p><span className="text-slate-500">Expected:</span> {r.expected}</p>
                              <p><span className="text-slate-500">Actual:</span> {r.actual.trim()}</p>
                              {r.error && <p className="text-rose-400 mt-1"><span className="text-rose-500">Error:</span> {r.error}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submissions results */}
                    {submitResults && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Submit Status:</span>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                              submitResults.status === "Accepted" ? "bg-emerald-950 text-emerald-450 border border-emerald-800" : "bg-rose-950 text-rose-450 border border-rose-800"
                            )}>
                              {submitResults.status}
                            </span>
                          </div>
                          {submitResults.xpGained > 0 && (
                            <span className="text-indigo-400 font-bold text-[10px] uppercase">+ {submitResults.xpGained} XP Gained</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-[10px]">
                          <div>
                            <span className="text-slate-500">Test Cases Passed:</span>
                            <p className="text-white font-bold mt-0.5">{submitResults.passedCount} / {submitResults.totalCount}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Max Execution Time:</span>
                            <p className="text-white font-bold mt-0.5">{submitResults.maxTimeMs} ms</p>
                          </div>
                        </div>

                        {submitResults.results?.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] border-b border-slate-850 py-1.5 last:border-0">
                            <span className="text-slate-400 font-mono">Test Case {idx + 1} {r.isHidden && "(Hidden)"}:</span>
                            <span className={r.passed ? "text-emerald-500" : "text-rose-500 font-bold"}>
                              {r.status} {r.timeMs ? `(${r.timeMs}ms)` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Review coaching streamed details */}
                {activeConsoleTab === "ai" && (
                  <div className="space-y-4 leading-relaxed text-[11px] font-sans font-medium text-slate-350">
                    {loadingAi && (
                      <div className="flex items-center gap-2 text-yellow-400 animate-pulse font-mono font-bold">
                        <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                        <span>AI Interview Coach analyzing script refactoring vectors...</span>
                      </div>
                    )}

                    {!loadingAi && !aiFeedback && (
                      <p className="text-slate-500 font-mono text-[10px] italic font-semibold">AI Feedback is generated automatically when you submit a solution.</p>
                    )}

                    {aiFeedback && (
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-[10px]">
                          <Cpu className="w-4 h-4" />
                          <span>Structured Coach Audit</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-normal">{aiFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Run submits actions toolbar */}
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-850 shrink-0">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 select-none cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useCustomInput} 
                      onChange={(e) => setUseCustomInput(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Use Custom Input</span>
                  </label>
                  {useCustomInput && (
                    <input 
                      type="text" 
                      placeholder="e.g. 9\n2 7 11 15" 
                      value={customInput} 
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-white px-3 py-1 rounded text-[10px] font-mono w-44"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunCode}
                    disabled={running || submitting}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Code</span>
                  </button>
                  <button
                    onClick={handleSubmitCode}
                    disabled={running || submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Solution</span>
                  </button>
                </div>
              </div>
            </div>

          </section>
        )}
      </main>

    </div>
  );
}
