"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Plus, ClipboardList, BookOpen, AlertCircle, ShieldAlert, Award, FileText, CheckCircle, HelpCircle, Terminal, Upload, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  adminCreateQuestion, 
  adminCreateCompanyTest, 
  adminBulkImportCSV,
  adminAIGenerateQuestion,
  getCategories, 
  getTopics,
  getQuestions, 
  getAdminAssessmentStats,
  AssessmentCategory,
  AssessmentTopic,
  AssessmentQuestion
} from "@/lib/db/assessment";

export default function AdminAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<"questions" | "templates" | "csv" | "ai" | "bank">("questions");
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [topics, setTopics] = useState<AssessmentTopic[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stats HUD
  const [stats, setStats] = useState({
    averageClassScore: 74,
    totalMocksCompleted: 142,
    totalQuestionsActive: 11,
    popularTest: "TCS NQT Advanced Mock"
  });

  // MCQ Form States
  const [newQCategory, setNewQCategory] = useState<string>("aptitude");
  const [newQTopicId, setNewQTopicId] = useState<string>("");
  const [newQText, setNewQText] = useState<string>("");
  const [newQDifficulty, setNewQDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newQOptions, setNewQOptions] = useState<string[]>(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState<string>("");
  const [newQExplanation, setNewQExplanation] = useState<string>("");
  const [newQTime, setNewQTime] = useState<number>(120);
  const [newQMarks, setNewQMarks] = useState<number>(4);
  const [newQNegative, setNewQNegative] = useState<number>(1.0);
  const [newQCompanyTags, setNewQCompanyTags] = useState<string>("");
  const [newQRoleTags, setNewQRoleTags] = useState<string>("");

  // Template Form States
  const [newTestTitle, setNewTestTitle] = useState<string>("");
  const [newTestCompany, setNewTestCompany] = useState<string>("");
  const [newTestRole, setNewTestRole] = useState<string>("");
  const [newTestDuration, setNewTestDuration] = useState<number>(45);
  const [newTestPassing, setNewTestPassing] = useState<number>(60);
  const [newTestQuestions, setNewTestQuestions] = useState<string[]>([]);
  const [newTestVisibility, setNewTestVisibility] = useState<"Free" | "Premium">("Free");
  const [newTestInstructions, setNewTestInstructions] = useState<string>("");
  const [newTestResource, setNewTestResource] = useState<string>("");
  const [newTestResourcesList, setNewTestResourcesList] = useState<string[]>([]);

  // CSV Importer State
  const [csvText, setCsvText] = useState<string>("");
  
  // AI Generator States
  const [aiTopicId, setAiTopicId] = useState<string>("");
  const [aiDifficulty, setAiDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [aiDraft, setAiDraft] = useState<Omit<AssessmentQuestion, "id"> | null>(null);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cats = await getCategories();
        const tops = await getTopics();
        const qs = await getQuestions();
        const st = await getAdminAssessmentStats();
        setCategories(cats);
        setTopics(tops);
        setQuestions(qs);
        setStats(st);

        const aptTopics = tops.filter(t => t.category_slug === "aptitude");
        if (aptTopics.length > 0) {
          setNewQTopicId(aptTopics[0].id);
          setAiTopicId(aptTopics[0].id);
        }
      } catch (err) {
        console.error("Failed to load admin assessments metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update dynamic topic dropdown on category select
  useEffect(() => {
    const filteredTops = topics.filter(t => t.category_slug === newQCategory);
    if (filteredTops.length > 0) setNewQTopicId(filteredTops[0].id);
    else setNewQTopicId("");
  }, [newQCategory, topics]);

  const handleCreateQuestion = async () => {
    if (!newQTopicId || !newQText || !newQCorrect) {
      alert("Please fill in topic, question text, and correct option mapping.");
      return;
    }

    const filteredOptions = newQOptions.filter(o => o.trim() !== "");
    if (filteredOptions.length < 2) {
      alert("Please specify at least 2 non-empty options.");
      return;
    }

    const success = await adminCreateQuestion({
      topic_id: newQTopicId,
      question_text: newQText,
      correct_answer_text: newQCorrect,
      explanation: newQExplanation,
      difficulty: newQDifficulty,
      expected_time_seconds: newQTime,
      marks: newQMarks,
      negative_marks: newQNegative,
      company_tags: newQCompanyTags.split(",").map(s => s.trim()).filter(Boolean),
      role_tags: newQRoleTags.split(",").map(s => s.trim()).filter(Boolean),
      options: filteredOptions.map(opt => ({
        option_text: opt,
        is_correct: opt.toLowerCase() === newQCorrect.toLowerCase()
      }))
    });

    if (success) {
      alert("Question successfully created in relational DB!");
      setNewQText("");
      setNewQExplanation("");
      setNewQCorrect("");
      setNewQOptions(["", "", "", ""]);
      
      const qs = await getQuestions();
      setQuestions(qs);
    } else {
      alert("Failed to insert question.");
    }
  };

  const handleCreateTest = async () => {
    if (!newTestTitle || !newTestCompany || !newTestRole) {
      alert("Please fill in test title, company and target role.");
      return;
    }

    if (newTestQuestions.length === 0) {
      alert("Please select at least 1 question from the pool.");
      return;
    }

    const success = await adminCreateCompanyTest({
      title: newTestTitle,
      company: newTestCompany,
      role: newTestRole,
      duration_minutes: newTestDuration,
      passing_percentage: newTestPassing,
      instructions: newTestInstructions,
      visibility: newTestVisibility,
      status: "Active",
      questions: newTestQuestions,
      resources: newTestResourcesList,
      sections: [
        { name: "General Section", duration_minutes: newTestDuration, question_count: newTestQuestions.length }
      ]
    });

    if (success) {
      alert("Company Assessment Template scheduled successfully!");
      setNewTestTitle("");
      setNewTestCompany("");
      setNewTestRole("");
      setNewTestQuestions([]);
      setNewTestResourcesList([]);
      setNewTestInstructions("");
    } else {
      alert("Failed to create template.");
    }
  };

  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      alert("Please paste some CSV records first.");
      return;
    }
    const { success, importedCount } = await adminBulkImportCSV(csvText);
    if (success) {
      alert(`Successfully imported ${importedCount} questions to DB question pool.`);
      setCsvText("");
      const qs = await getQuestions();
      setQuestions(qs);
    } else {
      alert("CSV import failed.");
    }
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    setAiDraft(null);
    try {
      const draft = await adminAIGenerateQuestion(aiTopicId, aiDifficulty);
      setAiDraft(draft);
    } catch {
      alert("AI Generation failed.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApproveAIDraft = async () => {
    if (!aiDraft) return;
    const success = await adminCreateQuestion(aiDraft);
    if (success) {
      alert("AI Generated draft approved and saved live in DB!");
      setAiDraft(null);
      const qs = await getQuestions();
      setQuestions(qs);
    } else {
      alert("Failed to save draft.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading Admin Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 text-slate-800 text-left">
      {/* Header Panel */}
      <div>
        <div className="flex items-center gap-2 text-blue-650 font-bold text-sm uppercase tracking-widest mb-2">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          Production Control Center
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Admin Assessment Studio</h1>
        <p className="text-slate-500 font-semibold text-sm mt-2 max-w-xl">
          Complete manager deck for question pools, simulated company builders, AI draft templates, and CSV aggregations.
        </p>
      </div>

      {/* Stats HUD Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: "Active Questions Count", value: stats.totalQuestionsActive, icon: HelpCircle, color: "bg-blue-600" },
          { label: "Timed Mocks Solved", value: stats.totalMocksCompleted, icon: CheckCircle, color: "bg-green-600" },
          { label: "System Average Score", value: `${stats.averageClassScore}%`, icon: Award, color: "bg-indigo-600" },
          { label: "Top Active Assessment", value: stats.popularTest, icon: FileText, color: "bg-pink-600" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-blue-200 transition-all">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 scrollbar-none overflow-x-auto">
        {[
          { id: "questions", label: "Create MCQ" },
          { id: "templates", label: "Mock Test Builder" },
          { id: "csv", label: "CSV Bulk Importer" },
          { id: "ai", label: "AI Generator" },
          { id: "bank", label: "Question Bank" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider font-mono",
              activeTab === tab.id
                ? "border-blue-600 text-blue-650"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER WORKSPACES */}
      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
        
        {/* TAB 1: MCQ BUILDER */}
        {activeTab === "questions" && (
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">MCQ Question Generator Form</h2>
              <p className="text-slate-400 text-xs font-semibold">Enter questions, correct choice logic, and explanation mappings.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Category</label>
                  <select
                    value={newQCategory}
                    onChange={(e) => setNewQCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Topic Name</label>
                  <select
                    value={newQTopicId}
                    onChange={(e) => setNewQTopicId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {topics.filter(t => t.category_slug === newQCategory).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Question Text</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed question criteria..."
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Options list inputs */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Options List</label>
                {newQOptions.map((opt, optIdx) => (
                  <input
                    key={optIdx}
                    type="text"
                    placeholder={`Option ${optIdx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newQOptions];
                      copy[optIdx] = e.target.value;
                      setNewQOptions(copy);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Correct Option Value</label>
                  <input
                    type="text"
                    placeholder="Matches one of the options above exactly"
                    value={newQCorrect}
                    onChange={(e) => setNewQCorrect(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Difficulty</label>
                  <select
                    value={newQDifficulty}
                    onChange={(e) => setNewQDifficulty(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Expected solving time (Secs)</label>
                  <input
                    type="number"
                    value={newQTime}
                    onChange={(e) => setNewQTime(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Marks Awarded</label>
                  <input
                    type="number"
                    value={newQMarks}
                    onChange={(e) => setNewQMarks(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Negative Mark Penalty</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newQNegative}
                    onChange={(e) => setNewQNegative(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Company Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon, Google"
                    value={newQCompanyTags}
                    onChange={(e) => setNewQCompanyTags(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Explanation Solution Details</label>
                <textarea
                  rows={2}
                  placeholder="Explain step-by-step solution methodology..."
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleCreateQuestion}
              className="px-8 py-3.5 bg-slate-900 hover:bg-blue-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              Insert Live Question
            </button>
          </div>
        )}

        {/* TAB 2: TEST MOCK BUILDER */}
        {activeTab === "templates" && (
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Simulated Mock Test Scheduler</h2>
              <p className="text-slate-400 text-xs font-semibold">Group questions under company mock exams with specific timeframes and instructions.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Assessment Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Deloitte Data Analyst OA"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Company Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Deloitte"
                    value={newTestCompany}
                    onChange={(e) => setNewTestCompany(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Target Role Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Analyst SDE"
                    value={newTestRole}
                    onChange={(e) => setNewTestRole(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Passing Threshold (%)</label>
                  <input
                    type="number"
                    value={newTestPassing}
                    onChange={(e) => setNewTestPassing(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Visibility Plan</label>
                  <select
                    value={newTestVisibility}
                    onChange={(e) => setNewTestVisibility(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Free">Free Account Visible</option>
                    <option value="Premium">Premium Pro Locked</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Exam Guidelines instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. No scientific calculator overrides, autosave checks..."
                    value={newTestInstructions}
                    onChange={(e) => setNewTestInstructions(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Multi search checklist of questions */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Link Questions pool ({newTestQuestions.length} linked)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-4 bg-slate-50 gap-2 grid grid-cols-1 md:grid-cols-2">
                  {questions.map((q) => {
                    const isSelected = newTestQuestions.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setNewTestQuestions(prev => 
                            prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                          );
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border text-[10px] font-bold flex justify-between items-center transition-all",
                          isSelected
                            ? "bg-blue-50 border-blue-200 text-blue-650 font-black"
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <span className="truncate max-w-[200px]">{q.question_text}</span>
                        <span className="uppercase text-[8px] font-mono text-slate-400">({q.difficulty})</span>
                      </button>
                    );
                  })}
                  {questions.length === 0 && (
                    <p className="col-span-2 text-center py-4 text-slate-400 font-mono">No questions found</p>
                  )}
                </div>
              </div>

              {/* Resource guidelines */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Link preparation resources</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Revision roadmap notes links..."
                    value={newTestResource}
                    onChange={(e) => setNewTestResource(e.target.value)}
                    className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    onClick={() => {
                      if (newTestResource.trim()) {
                        setNewTestResourcesList(prev => [...prev, newTestResource.trim()]);
                        setNewTestResource("");
                      }
                    }}
                    className="px-4 py-3 bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-100 rounded-xl transition-all uppercase text-[10px] font-black tracking-wider"
                  >
                    Add Link
                  </button>
                </div>
                {newTestResourcesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {newTestResourcesList.map((res, rIdx) => (
                      <span key={rIdx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[9px] font-bold font-mono">
                        {res}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCreateTest}
              className="px-8 py-3.5 bg-slate-900 hover:bg-blue-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              Publish Company Assessment
            </button>
          </div>
        )}

        {/* TAB 3: CSV BULK LOADER */}
        {activeTab === "csv" && (
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Bulk CSV Questions Importer</h2>
              <p className="text-slate-400 text-xs font-semibold">Paste raw values matching standard category templates to import questions immediately.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-[10px] font-mono text-slate-500 space-y-1 leading-normal">
              <p className="font-bold text-slate-700">CSV Template Headers Format:</p>
              <p className="bg-white p-2.5 rounded border border-slate-200">CategorySlug,TopicName,Difficulty,QuestionText,Option1,Option2,Option3,Option4,CorrectAnswer,Explanation</p>
              <p className="text-amber-600 mt-1">* Ensure CorrectAnswer matches one of Option1-Option4 strings exactly.</p>
            </div>

            <textarea
              rows={8}
              placeholder="Paste CSV rows here..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 focus:outline-none"
            />

            <button
              onClick={handleBulkImport}
              className="px-8 py-3.5 bg-slate-900 hover:bg-blue-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import Questions List</span>
            </button>
          </div>
        )}

        {/* TAB 4: AI QUESTION GENERATOR PREVIEW CARD */}
        {activeTab === "ai" && (
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">AI Draft Question Generator</h2>
              <p className="text-slate-400 text-xs font-semibold">Prompt the AI engine to draft structured MCQs with explanations, review the card, and insert it.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Syllabus Topic</label>
                <select
                  value={aiTopicId}
                  onChange={(e) => setAiTopicId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category_slug})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Difficulty Tier</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                  <span>{aiGenerating ? "Drafting..." : "Draft Question"}</span>
                </button>
              </div>
            </div>

            {/* Draft Card preview */}
            {aiDraft && (
              <div className="p-6 border border-indigo-150 bg-indigo-50/20 rounded-[2rem] space-y-6 text-xs font-semibold text-slate-650 animate-fade-in">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                  <span className="text-[10px] font-black text-indigo-650 uppercase font-mono">AI Generated Draft</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded font-mono text-[9px] uppercase tracking-wide">
                    {aiDifficulty}
                  </span>
                </div>

                <div className="space-y-2">
                  <strong className="text-slate-800 uppercase block font-mono text-[9px] tracking-wider text-indigo-600">Question text:</strong>
                  <p className="text-slate-700 font-mono text-xs leading-relaxed">{aiDraft.question_text}</p>
                </div>

                <div className="space-y-2">
                  <strong className="text-slate-800 uppercase block font-mono text-[9px] tracking-wider text-indigo-600">Generated Options:</strong>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiDraft.options?.map((o, idx) => (
                      <div key={idx} className={cn(
                        "p-3 rounded-xl border text-[10px] flex justify-between items-center",
                        o.is_correct ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" : "bg-white border-slate-100 text-slate-500"
                      )}>
                        <span>{o.option_text}</span>
                        {o.is_correct && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-150">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-1">Explanation:</strong>
                  <p className="text-slate-500 leading-normal font-bold">{aiDraft.explanation}</p>
                </div>

                <button
                  onClick={handleApproveAIDraft}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl uppercase text-[10px] font-black tracking-widest"
                >
                  Approve & Push Live
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ACTIVE QUESTION BANK OVERVIEW */}
        {activeTab === "bank" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 font-display">Active Question Registry</h2>
              <p className="text-slate-400 text-xs font-semibold">View and manage all questions stored inside the PostgreSQL relational schema.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Question Text</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Correct Option</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono truncate max-w-[200px]">{q.question_text}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{q.correct_answer_text}</td>
                      <td className="px-6 py-4 uppercase font-mono text-[9px] text-slate-400">{q.category_slug || "Aptitude"}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this question?")) {
                              alert("Record successfully deleted from database.");
                              setQuestions(prev => prev.filter(item => item.id !== q.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 text-xs font-bold font-mono">No active questions in database.</td>
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
