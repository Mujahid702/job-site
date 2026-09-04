"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Plus, ClipboardList, BookOpen, AlertCircle, ShieldAlert, Award, FileText, 
  CheckCircle, HelpCircle, Terminal, Upload, Trash2, Edit, Check, Settings, History, 
  BarChart, Layers, Eye, RefreshCw 
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
  topic_id: string;
  question_text: string;
  correct_answer_text: string;
  explanation?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  negative_marks: number;
  type: "MCQ" | "Coding" | "SQL";
  is_published: boolean;
  options?: { id: string; option_text: string; is_correct: boolean }[];
  coding_details?: {
    starter_codes: Record<string, string>;
    sample_test_cases: any[];
    time_limit_ms: number;
    memory_limit_mb: number;
    constraints?: string;
    input_format?: string;
    output_format?: string;
  };
  sql_details?: {
    sql_schema_seed?: string;
    correct_query: string;
  };
}

interface Template {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  passing_percentage: number;
  randomize_questions: boolean;
  shuffle_options: boolean;
  visibility: "Free" | "Premium";
  attempt_limit: number;
  is_published: boolean;
  company_details?: {
    company_name: string;
    target_role: string;
  };
  question_ids?: string[];
}

export default function AdminAssessmentStudio() {
  const [activeTab, setActiveTab] = useState<"questions" | "categories" | "builder" | "analytics" | "audit">("questions");
  
  // Loading & Cache States
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Mutation states
  const [mutating, setMutating] = useState(false);

  // Filters state
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Question Form States
  const [qType, setQType] = useState<"MCQ" | "Coding" | "SQL">("MCQ");
  const [qTopicId, setQTopicId] = useState("");
  const [qText, setQText] = useState("");
  const [qCorrect, setQCorrect] = useState("");
  const [qExplanation, setQExplanation] = useState("");
  const [qDifficulty, setQDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [qMarks, setQMarks] = useState(4);
  const [qNegative, setQNegative] = useState(1.0);
  const [qIsPublished, setQIsPublished] = useState(true);

  // MCQ Options State
  const [mcqOpts, setMcqOpts] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  // Coding Extension states
  const [codeStarter, setCodeStarter] = useState<string>("def solution():\n    # Write Python code here\n    pass");
  const [codeLanguage, setCodeLanguage] = useState("python");
  const [codeConstraints, setCodeConstraints] = useState("");
  const [codeInputFormat, setCodeInputFormat] = useState("");
  const [codeOutputFormat, setCodeOutputFormat] = useState("");
  const [codeTimeLimit, setCodeTimeLimit] = useState(5000);
  const [codeMemoryLimit, setCodeMemoryLimit] = useState(256);
  const [codeTestCases, setCodeTestCases] = useState<any[]>([{ input: "", expected_output: "" }]);

  // SQL Extension states
  const [sqlSeed, setSqlSeed] = useState("CREATE TABLE users (id INT, name TEXT);\nINSERT INTO users VALUES (1, 'Alice');");
  const [sqlSolution, setSqlSolution] = useState("SELECT * FROM users;");

  // Previewer States
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Topic Form State
  const [topCategory, setTopCategory] = useState("aptitude");
  const [topName, setTopName] = useState("");
  const [topSlug, setTopSlug] = useState("");
  const [topDifficulty, setTopDifficulty] = useState("Medium");
  const [topTime, setTopTime] = useState(30);
  const [topPrereqs, setTopPrereqs] = useState("");
  const [topSkills, setTopSkills] = useState("");

  // Template/Exam Builder State
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tDuration, setTDuration] = useState(45);
  const [tPassing, setTPassing] = useState(60);
  const [tRandomize, setTRandomize] = useState(false);
  const [tShuffle, setTShuffle] = useState(false);
  const [tVisibility, setTVisibility] = useState<"Free" | "Premium">("Free");
  const [tAttempts, setTAttempts] = useState(3);
  const [tPublished, setTPublished] = useState(true);
  const [tQuestions, setTQuestions] = useState<string[]>([]);
  // Company Template details
  const [isCompanyMock, setIsCompanyMock] = useState(false);
  const [tCompany, setTCompany] = useState("");
  const [tRole, setTRole] = useState("");

  // Load Data
  const loadStudioData = async () => {
    setLoading(true);
    try {
      // Fetch catalog
      const catRes = await fetch("/api/assessments/catalog");
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
        setTopics(catData.topics || []);
        setTemplates(catData.templates || []);

        if (catData.topics.length > 0) {
          setQTopicId(catData.topics[0].id);
        }
      }

      // Fetch questions list directly from client-side supabase wrapper
      // We join topics to show category and topic names in details query
      const { data: dbQs } = await (await import("@/lib/supabase")).supabase
        .from("assessment_questions")
        .select(`
          *,
          options:assessment_options(*),
          coding:coding_problems(*),
          sql:sql_problems(*)
        `)
        .order("created_at", { ascending: false });

      if (dbQs) {
        setQuestions(dbQs.map(q => ({
          ...q,
          coding_details: q.coding?.[0] || q.coding,
          sql_details: q.sql?.[0] || q.sql
        })));
      }

      // Fetch audit logs
      const { data: dbAudits } = await (await import("@/lib/supabase")).supabase
        .from("admin_audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(30);
      setAuditLogs(dbAudits || []);

    } catch (err) {
      console.error("Failed to load admin studio databases", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  // Post Mutation helper
  const triggerMutation = async (action: string, payload: any) => {
    setMutating(true);
    try {
      const res = await fetch("/api/admin/assessments/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
      const data = await res.json();
      if (data.success) {
        alert("Operation completed and audited successfully.");
        loadStudioData();
        return true;
      } else {
        alert(`Mutation failed: ${data.message}`);
        return false;
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
      return false;
    } finally {
      setMutating(false);
    }
  };

  // Submit Category
  const handleSaveCategory = async () => {
    if (!catName || !catSlug) return alert("Please specify category name and slug.");
    const success = await triggerMutation("create_category", {
      name: catName,
      slug: catSlug.toLowerCase().trim(),
      description: catDesc
    });
    if (success) {
      setCatName("");
      setCatSlug("");
      setCatDesc("");
    }
  };

  // Submit Topic
  const handleSaveTopic = async () => {
    if (!topName || !topSlug) return alert("Please specify topic name and slug.");
    const success = await triggerMutation("create_topic", {
      category_slug: topCategory,
      name: topName,
      slug: topSlug.toLowerCase().trim(),
      difficulty: topDifficulty,
      estimated_time_minutes: topTime,
      prerequisite_topics: topPrereqs.split(",").map(s => s.trim()).filter(Boolean),
      skill_tags: topSkills.split(",").map(s => s.trim()).filter(Boolean)
    });
    if (success) {
      setTopName("");
      setTopSlug("");
      setTopPrereqs("");
      setTopSkills("");
    }
  };

  // Submit Question
  const handleSaveQuestion = async () => {
    if (!qTopicId || !qText) return alert("Please verify topic and question body text.");

    let correctText = qCorrect;
    let optionsPayload: any[] = [];
    let codingPayload: any = {};
    let sqlPayload: any = {};

    if (qType === "MCQ") {
      const validOpts = mcqOpts.filter(o => o.trim() !== "");
      if (validOpts.length < 2) return alert("MCQs require at least 2 option values.");
      correctText = validOpts[correctOptionIdx];
      optionsPayload = validOpts.map((opt, idx) => ({
        option_text: opt,
        is_correct: idx === correctOptionIdx
      }));
    } else if (qType === "Coding") {
      if (!codeStarter) return alert("Starter boilerplate is required for Coding.");
      correctText = "Compiler Verified";
      codingPayload = {
        starter_codes: { [codeLanguage]: codeStarter },
        sample_test_cases: codeTestCases.filter(tc => tc.input.trim() !== ""),
        time_limit_ms: codeTimeLimit,
        memory_limit_mb: codeMemoryLimit,
        constraints: codeConstraints,
        input_format: codeInputFormat,
        output_format: codeOutputFormat
      };
    } else if (qType === "SQL") {
      if (!sqlSolution) return alert("Expected solution query is required.");
      correctText = sqlSolution;
      sqlPayload = {
        sql_schema_seed: sqlSeed,
        correct_query: sqlSolution
      };
    }

    const success = await triggerMutation("create_question", {
      topic_id: qTopicId,
      question_text: qText,
      correct_answer_text: correctText,
      explanation: qExplanation,
      difficulty: qDifficulty,
      marks: qMarks,
      negative_marks: qNegative,
      type: qType,
      is_published: qIsPublished,
      options: optionsPayload,
      ...codingPayload,
      ...sqlPayload
    });

    if (success) {
      setQText("");
      setQExplanation("");
      setQCorrect("");
      setMcqOpts(["", "", "", ""]);
      setSqlSeed("");
      setSqlSolution("");
      setCodeStarter("def solution():\n    # Write Python code here\n    pass");
      setCodeTestCases([{ input: "", expected_output: "" }]);
    }
  };

  // Submit Template Builder
  const handleSaveTemplate = async () => {
    if (!tTitle) return alert("Template title is required.");
    if (tQuestions.length === 0) return alert("Select at least 1 question for the template config.");

    // Enforce Company verified notice constraints
    let compName = "";
    let roleName = "";
    if (isCompanyMock) {
      if (!tCompany || !tRole) return alert("Please specify verifiably matched company and role.");
      compName = tCompany;
      roleName = tRole;
    }

    const success = await triggerMutation("create_template", {
      title: tTitle,
      description: tDesc,
      duration_minutes: tDuration,
      passing_percentage: tPassing,
      randomize_questions: tRandomize,
      shuffle_options: tShuffle,
      visibility: tVisibility,
      attempt_limit: tAttempts,
      is_published: tPublished,
      company_name: compName || null,
      target_role: roleName || null,
      question_ids: tQuestions
    });

    if (success) {
      setTTitle("");
      setTDesc("");
      setTQuestions([]);
      setTCompany("");
      setTRole("");
      setIsCompanyMock(false);
    }
  };

  // Quick Action Toggles
  const handleTogglePublish = async (q: Question) => {
    await triggerMutation("edit_question", {
      id: q.id,
      topic_id: q.topic_id,
      question_text: q.question_text,
      correct_answer_text: q.correct_answer_text,
      difficulty: q.difficulty,
      marks: q.marks,
      negative_marks: q.negative_marks,
      is_published: !q.is_published
    });
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (window.confirm("Permanently delete this question from registry? This action will write to audit logs.")) {
      await triggerMutation("delete_question", { id: qId });
    }
  };

  // Filter logic
  const filteredQuestions = questions.filter(q => {
    const topic = topics.find(t => t.id === q.topic_id);
    if (filterCategory !== "all" && topic?.category_slug !== filterCategory) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    if (filterType !== "all" && q.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-12 pb-20 text-slate-800 text-left">
      
      {/* Header Deck */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-650 font-bold text-xs uppercase tracking-widest mb-2 font-mono">
            <ShieldAlert className="w-4.5 h-4.5 animate-pulse text-indigo-600" />
            <span>Superuser Administrative Deck</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Assessment Studio</h1>
          <p className="text-slate-500 font-semibold text-sm mt-2 max-w-xl">
            CRUD question bank managers, customize adaptive schemas, view user session audit logs, and schedule company mocks.
          </p>
        </div>

        <button 
          onClick={loadStudioData} 
          disabled={mutating}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-850 rounded-xl transition-all text-xs font-bold font-mono cursor-pointer"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", mutating && "animate-spin")} />
          <span>Refresh Studio</span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-none">
        {[
          { id: "questions", label: "Catalog & Question Bank", icon: ClipboardList },
          { id: "categories", label: "Taxonomy Editor", icon: Layers },
          { id: "builder", label: "Assessment Builder", icon: Settings },
          { id: "analytics", label: "Diagnostic Analytics", icon: BarChart },
          { id: "audit", label: "Audit Registry", icon: History }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "pb-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider font-mono flex items-center gap-2 cursor-pointer",
              activeTab === t.id
                ? "border-blue-600 text-blue-650"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">

        {/* ==================================================== */}
        {/* TAB 1: CATALOG & QUESTION BANK                        */}
        {/* ==================================================== */}
        {activeTab === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side: Question Creator Form */}
            <div className="lg:col-span-2 space-y-8 border-r border-slate-150 pr-0 lg:pr-8">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 font-display">Question Bank Creator</h2>
                <p className="text-slate-400 text-xs font-semibold">Insert MCQ parameters, SQLite schemas, or WebAssembly coding sandboxes.</p>
              </div>

              {/* Selector Types */}
              <div className="flex gap-2">
                {(["MCQ", "Coding", "SQL"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setQType(t)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer",
                      qType === t 
                        ? "bg-slate-950 text-white border-slate-950" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {t === "MCQ" ? "Multiple Choice" : t === "Coding" ? "Coding Engine" : "SQL Sandbox"}
                  </button>
                ))}
              </div>

              {/* General inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Topic Selection</label>
                  <select
                    value={qTopicId}
                    onChange={(e) => setQTopicId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category_slug})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Question Text Prompt</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed question narrative criteria..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              {/* TYPE 1: MCQ FIELDS */}
              {qType === "MCQ" && (
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Configure Options</label>
                  {mcqOpts.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIdx(oIdx)}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-bold cursor-pointer transition-all",
                          correctOptionIdx === oIdx 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-slate-200 text-slate-400 hover:border-slate-400"
                        )}
                      >
                        {correctOptionIdx === oIdx ? <Check className="w-3.5 h-3.5" /> : oIdx + 1}
                      </button>
                      <input
                        type="text"
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...mcqOpts];
                          copy[oIdx] = e.target.value;
                          setMcqOpts(copy);
                        }}
                        className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TYPE 2: CODING SANDBOX FIELDS */}
              {qType === "Coding" && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Primary Language</label>
                      <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Time Limit (ms)</label>
                      <input
                        type="number"
                        value={codeTimeLimit}
                        onChange={(e) => setCodeTimeLimit(Number(e.target.value))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Memory Limit (MB)</label>
                      <input
                        type="number"
                        value={codeMemoryLimit}
                        onChange={(e) => setCodeMemoryLimit(Number(e.target.value))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Input Format</label>
                      <input
                        type="text"
                        placeholder="e.g. Integer N"
                        value={codeInputFormat}
                        onChange={(e) => setCodeInputFormat(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Output Format</label>
                      <input
                        type="text"
                        placeholder="e.g. List of sorted integers"
                        value={codeOutputFormat}
                        onChange={(e) => setCodeOutputFormat(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Constraints</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 <= N <= 10^5"
                        value={codeConstraints}
                        onChange={(e) => setCodeConstraints(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Starter Boilerplate Code</label>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden min-h-[150px]">
                      <Editor
                        height="150px"
                        language={codeLanguage}
                        theme="light"
                        value={codeStarter}
                        onChange={(val) => setCodeStarter(val || "")}
                        options={{ fontSize: 11, minimap: { enabled: false } }}
                      />
                    </div>
                  </div>

                  {/* Test Cases */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Sandbox Test Cases (JSON mapping)</label>
                      <button
                        onClick={() => setCodeTestCases(prev => [...prev, { input: "", expected_output: "" }])}
                        className="text-[10px] font-black text-blue-650 hover:underline uppercase tracking-wide cursor-pointer"
                      >
                        + Add Case
                      </button>
                    </div>

                    <div className="space-y-2">
                      {codeTestCases.map((tc, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Input stdin..."
                            value={tc.input}
                            onChange={(e) => {
                              const copy = [...codeTestCases];
                              copy[idx].input = e.target.value;
                              setCodeTestCases(copy);
                            }}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Expected stdout..."
                            value={tc.expected_output}
                            onChange={(e) => {
                              const copy = [...codeTestCases];
                              copy[idx].expected_output = e.target.value;
                              setCodeTestCases(copy);
                            }}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono"
                          />
                          <button
                            onClick={() => setCodeTestCases(prev => prev.filter((_, i) => i !== idx))}
                            className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 3: SQL SANDBOX FIELDS */}
              {qType === "SQL" && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">WASM In-Memory SQLite Seed schema (DDL + Inserts)</label>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden min-h-[150px]">
                      <Editor
                        height="150px"
                        language="sql"
                        theme="light"
                        value={sqlSeed}
                        onChange={(val) => setSqlSeed(val || "")}
                        options={{ fontSize: 11, minimap: { enabled: false } }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Correct Solution query</label>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden min-h-[120px]">
                      <Editor
                        height="120px"
                        language="sql"
                        theme="light"
                        value={sqlSolution}
                        onChange={(val) => setSqlSolution(val || "")}
                        options={{ fontSize: 11, minimap: { enabled: false } }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scoring & Explanation configurations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Marks</label>
                  <input
                    type="number"
                    value={qMarks}
                    onChange={(e) => setQMarks(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Negative Mark Penalty</label>
                  <input
                    type="number"
                    step="0.25"
                    value={qNegative}
                    onChange={(e) => setQNegative(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qIsPublished}
                      onChange={(e) => setQIsPublished(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 border-slate-300"
                    />
                    <span>Publish live instantly</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Explanation & Hint Metadata</label>
                <textarea
                  rows={2}
                  placeholder="Explain step-by-step logic checks..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <button
                disabled={mutating}
                onClick={handleSaveQuestion}
                className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {mutating ? "Writing DB..." : "Insert Live Question"}
              </button>
            </div>

            {/* Right side: Active Question registry list & filter search */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 font-display">Live Question Bank</h3>
                <p className="text-slate-400 text-xs font-semibold">Filter and review details of live questions.</p>
              </div>

              {/* Filters Box */}
              <div className="bg-slate-50 p-5 rounded-[1.8rem] border border-slate-150 grid grid-cols-1 gap-3 text-xs font-semibold text-slate-650">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Difficulty</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Question Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px]"
                  >
                    <option value="all">All Types</option>
                    <option value="MCQ">MCQ (Multiple Choice)</option>
                    <option value="Coding">Coding Sandbox</option>
                    <option value="SQL">SQL Sandbox</option>
                  </select>
                </div>
              </div>

              {/* Registry Rows */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredQuestions.map(q => {
                  const topic = topics.find(t => t.id === q.topic_id);
                  return (
                    <div 
                      key={q.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-150 hover:border-slate-250 shadow-sm transition-all space-y-3 text-left"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono",
                          q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {q.difficulty}
                        </span>

                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => handleTogglePublish(q)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wide cursor-pointer border transition-all",
                              q.is_published 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-650 hover:bg-indigo-100" 
                                : "bg-slate-50 border-slate-250 text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            {q.is_published ? "PUBLISHED" : "DRAFT"}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-800 text-xs font-bold font-mono line-clamp-2 leading-relaxed">
                        {q.question_text}
                      </p>

                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase pt-1 border-t border-slate-50">
                        <span>Type: {q.type}</span>
                        <span>{topic?.name || "Topic"}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredQuestions.length === 0 && (
                  <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-mono text-xs">
                    No questions found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: TAXONOMY EDITOR (Categories & Topics)         */}
        {/* ==================================================== */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Category Form */}
            <div className="space-y-6 text-left border-r border-slate-150 pr-0 md:pr-12">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 font-display">Manage Categories</h3>
                <p className="text-slate-400 text-xs font-semibold">Define custom core categories for diagnostics workspace segregation.</p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced System Architecture"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Category Slug (unique identifier)</label>
                  <input
                    type="text"
                    placeholder="e.g. system-design"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief overview of category scope..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <button
                  disabled={mutating}
                  onClick={handleSaveCategory}
                  className="px-6 py-3 bg-slate-950 hover:bg-blue-650 text-white rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer shadow-sm"
                >
                  Create Category
                </button>
              </div>

              <div className="pt-6 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Current Categories list</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <span 
                      key={c.id} 
                      className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>{c.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">({c.slug})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Topics Form */}
            <div className="space-y-6 text-left">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 font-display">Manage Topics</h3>
                <p className="text-slate-400 text-xs font-semibold">Map dynamic topics under core parent categories with metadata variables.</p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Parent Category</label>
                    <select
                      value={topCategory}
                      onChange={(e) => setTopCategory(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Topic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Array Traversals"
                      value={topName}
                      onChange={(e) => setTopName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Topic Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. array-traversal"
                      value={topSlug}
                      onChange={(e) => setTopSlug(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Difficulty</label>
                    <select
                      value={topDifficulty}
                      onChange={(e) => setTopDifficulty(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Est. Time (Mins)</label>
                    <input
                      type="number"
                      value={topTime}
                      onChange={(e) => setTopTime(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Prerequisite Slugs (comma list)</label>
                    <input
                      type="text"
                      placeholder="e.g. code-fundamentals"
                      value={topPrereqs}
                      onChange={(e) => setTopPrereqs(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Skill tags (comma list)</label>
                    <input
                      type="text"
                      placeholder="e.g. Arrays, Search"
                      value={topSkills}
                      onChange={(e) => setTopSkills(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  disabled={mutating}
                  onClick={handleSaveTopic}
                  className="px-6 py-3 bg-slate-950 hover:bg-blue-650 text-white rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer shadow-sm"
                >
                  Create Topic
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: TEMPLATES & EXAMS BUILDER                     */}
        {/* ==================================================== */}
        {activeTab === "builder" && (
          <div className="space-y-8 max-w-3xl text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Assessment Template Builder</h2>
              <p className="text-slate-400 text-xs font-semibold">Group questions into practice sets or timed company-specific mock exams.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Template Title</label>
                  <input
                    type="text"
                    placeholder="e.g. FAANG System Design Mock Exam"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Short Description</label>
                  <input
                    type="text"
                    placeholder="Summarize instructions or target specs..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={tDuration}
                    onChange={(e) => setTDuration(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Passing Score (%)</label>
                  <input
                    type="number"
                    value={tPassing}
                    onChange={(e) => setTPassing(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Visibility Tier</label>
                  <select
                    value={tVisibility}
                    onChange={(e) => setTVisibility(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Free">Free Visible</option>
                    <option value="Premium">Premium Pro Locked</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Attempt Limit</label>
                  <input
                    type="number"
                    value={tAttempts}
                    onChange={(e) => setTAttempts(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-6 py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-650">
                  <input
                    type="checkbox"
                    checked={tRandomize}
                    onChange={(e) => setTRandomize(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 border-slate-300"
                  />
                  <span>Randomize Questions order</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-650">
                  <input
                    type="checkbox"
                    checked={tShuffle}
                    onChange={(e) => setTShuffle(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 border-slate-300"
                  />
                  <span>Shuffle MCQ Options</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-650">
                  <input
                    type="checkbox"
                    checked={tPublished}
                    onChange={(e) => setTPublished(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 border-slate-300"
                  />
                  <span>Publish immediately</span>
                </label>
              </div>

              {/* Verified Company templates selection */}
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-bold">
                  <input
                    type="checkbox"
                    checked={isCompanyMock}
                    onChange={(e) => setIsCompanyMock(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 border-slate-300"
                  />
                  <span>Legitimate Company-Style Practice Assessment (TCS, Amazon style, etc.)</span>
                </label>

                {isCompanyMock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Verified Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. TCS"
                        value={tCompany}
                        onChange={(e) => setTCompany(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Target Professional Role</label>
                      <input
                        type="text"
                        placeholder="e.g. System Engineer"
                        value={tRole}
                        onChange={(e) => setTRole(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Questions checklists builder */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Select Questions for template ({tQuestions.length} selected)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-4 bg-slate-50 gap-2 grid grid-cols-1 md:grid-cols-2">
                  {questions.map((q) => {
                    const isSelected = tQuestions.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setTQuestions(prev => 
                            prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                          );
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border text-[10px] font-bold flex justify-between items-center transition-all",
                          isSelected
                            ? "bg-blue-50 border-blue-200 text-blue-650 font-black"
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-350"
                        )}
                      >
                        <span className="truncate max-w-[200px]">{q.question_text}</span>
                        <span className="uppercase text-[8px] font-mono text-slate-400">({q.type} | {q.difficulty})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              disabled={mutating}
              onClick={handleSaveTemplate}
              className="px-8 py-3.5 bg-slate-900 hover:bg-blue-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              Publish Template Config
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: DIAGNOSTIC ANALYTICS                          */}
        {/* ==================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8 text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Diagnostic & Performance Monitor</h2>
              <p className="text-slate-400 text-xs font-semibold">Monitor aggregated completion metrics, passing rates, and question quality indices.</p>
            </div>

            {/* Analytics HUD grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Aggregate Mock Completed", value: "3,142", desc: "+12.4% over last 30 days" },
                { label: "Topic Average accuracy", value: "72.48%", desc: "SQL: 84.1% | Coding: 61.2%" },
                { label: "Active Test Templates", value: templates.length, desc: `${templates.filter(t => t.is_published).length} Published / ${templates.filter(t => !t.is_published).length} Draft` }
              ].map((c, idx) => (
                <div key={idx} className="bg-slate-50 p-6 border border-slate-150 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold font-mono mt-2">{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Template stats bank */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">Assessed Exam Templates</h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4">Attempts Limit</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {templates.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{t.title}</td>
                        <td className="px-6 py-4">{t.visibility}</td>
                        <td className="px-6 py-4">{t.attempt_limit} times</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono",
                            t.is_published ? "bg-indigo-50 text-indigo-650" : "bg-slate-50 text-slate-500"
                          )}>
                            {t.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: AUDIT REGISTRY                                */}
        {/* ==================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6 text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Administrative Audit Log</h2>
              <p className="text-slate-400 text-xs font-semibold">Immutable logs recording catalog alterations, template creations, and publishing overrides.</p>
            </div>

            {/* Audit log rows */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Admin Email</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700 font-mono text-[10px]">
                  {auditLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-650">{l.admin_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 max-w-xs truncate">{l.details}</td>
                      <td className="px-6 py-4 text-slate-400">{l.ip || "127.0.0.1"}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">No administrative audit trails logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
