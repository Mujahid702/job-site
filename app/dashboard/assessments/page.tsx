"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Award, CheckCircle, FileText, HelpCircle, Flame, 
  ChevronRight, ArrowUpRight, BarChart2, BookOpen, Clock, Activity,
  Play, Lock, Globe, Database, Code, SlidersHorizontal, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { 
  getCategories, 
  getTopics, 
  getQuestions, 
  getCompanyTests, 
  getUserAssessmentAnalytics,
  getUserTopicProgress,
  AssessmentCategory,
  AssessmentTopic,
  AssessmentQuestion,
  AssessmentCompanyTest,
  AssessmentTopicProgress
} from "@/lib/db/assessment";

export default function StudentAssessmentsPage() {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [topics, setTopics] = useState<AssessmentTopic[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [companyTests, setCompanyTests] = useState<AssessmentCompanyTest[]>([]);
  const [progress, setProgress] = useState<AssessmentTopicProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [analytics, setAnalytics] = useState<any>({
    readinessScore: 0,
    overallAccuracy: 0,
    questionsAttempted: 0,
    mockTestsCompleted: 0,
    strongestTopic: "No data",
    weakestTopic: "No data",
    difficultySolved: { easy: 0, medium: 0, hard: 0 },
    accuracyHistory: [],
    companyReadiness: { Google: 0, Amazon: 0, Microsoft: 0, TCS: 0, Infosys: 0 }
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || "guest-user";

        // Load DB resources
        const cats = await getCategories();
        const tops = await getTopics();
        const qs = await getQuestions();
        const tests = await getCompanyTests();
        const prog = await getUserTopicProgress(userId);
        const analy = await getUserAssessmentAnalytics(userId);

        setCategories(cats);
        setTopics(tops);
        setQuestions(qs);
        setCompanyTests(tests);
        setProgress(prog);
        setAnalytics(analy);

        // Fetch Streak from Supabase
        if (userId !== "guest-user") {
          const { data: streakRecord } = await supabase
            .from("assessment_streaks")
            .select("current_streak, longest_streak")
            .eq("user_id", userId)
            .maybeSingle();

          if (streakRecord) {
            setStreak({
              current: streakRecord.current_streak,
              longest: streakRecord.longest_streak
            });
          }
        }
      } catch (err) {
        console.error("Failed to load assessments data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredQuestions = activeCategory === "all"
    ? questions
    : questions.filter(q => q.category_slug === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs animate-pulse">Launching Practice Arena...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left text-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Banner with Streaks HUD */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-gradient-to-br from-white via-white to-slate-50/50">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Practice Arena Active
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Assessment OS
            </h1>
            <p className="text-slate-550 font-medium text-sm max-w-xl leading-relaxed">
              Solve coding challenges, SQL queries, and mock OA tests. Level up your placement readiness index with real-time feedback.
            </p>
          </div>

          <div className="flex gap-4">
            {/* Streak card */}
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Solving Streak</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{streak.current} Days</p>
                <p className="text-[9px] font-bold text-amber-500 mt-1">Record: {streak.longest} days</p>
              </div>
            </div>

            {/* Overall Solving card */}
            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-indigo-650 text-white rounded-2xl flex items-center justify-center shadow">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Readiness Score</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{analytics.readinessScore}%</p>
                <p className="text-[9px] font-bold text-indigo-500 mt-1">Accuracy: {analytics.overallAccuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Performance metrics */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Syllabus Coverage Metrics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Total Solved</span>
                <span className="text-slate-950 font-black">{analytics.questionsAttempted} Questions</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Mock Assessments</span>
                <span className="text-slate-950 font-black">{analytics.mockTestsCompleted} Completed</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Strongest Topic</span>
                <span className="text-indigo-650 font-black truncate max-w-[150px]">{analytics.strongestTopic}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Weakest Topic</span>
                <span className="text-rose-500 font-black truncate max-w-[150px]">{analytics.weakestTopic}</span>
              </div>
            </div>

            {/* Custom SVG line chart trend */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Accuracy Progression</p>
              <div className="h-16 flex items-end gap-2.5">
                {analytics.accuracyHistory.map((item: any, idx: number) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div 
                      style={{ height: `${Math.max(item.score, 15)}%` }}
                      className="w-full bg-indigo-650 rounded-md transition-all hover:brightness-110 shadow-sm"
                    />
                    <span className="text-[8px] font-black text-slate-400 font-mono uppercase">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Difficulty Split chart */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Difficulty Distribution
            </h3>

            <div className="space-y-4 pt-2">
              {[
                { label: "Easy", count: analytics.difficultySolved.easy, color: "bg-emerald-500", text: "text-emerald-700" },
                { label: "Medium", count: analytics.difficultySolved.medium, color: "bg-amber-500", text: "text-amber-700" },
                { label: "Hard", count: analytics.difficultySolved.hard, color: "bg-rose-500", text: "text-rose-700" }
              ].map((d, i) => {
                const total = analytics.difficultySolved.easy + analytics.difficultySolved.medium + analytics.difficultySolved.hard || 1;
                const percentage = Math.round((d.count / total) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className={d.text}>{d.label}</span>
                      <span className="text-slate-900 font-black">{d.count} Solved</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${percentage}%` }} className={cn("h-full rounded-full", d.color)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Target Company Readiness */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-pink-600" />
              Company Readiness Index (CRI)
            </h3>

            <div className="space-y-3.5">
              {Object.entries(analytics.companyReadiness).map(([company, score]: any) => (
                <div key={company} className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{company}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${score}%` }} className="h-full bg-pink-500 rounded-full" />
                    </div>
                    <span className="text-slate-950 font-mono w-8 text-right font-black">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Content Tabs switcher */}
        <div className="flex border-b border-slate-200 gap-6 scrollbar-none overflow-x-auto">
          {[
            { id: "all", label: "All Questions", icon: FileText },
            { id: "coding", label: "Coding Practice", icon: Code },
            { id: "sql", label: "SQL Playground", icon: Database },
            { id: "aptitude", label: "Quantitative Aptitude", icon: SlidersHorizontal },
            { id: "logical", label: "Logical Reasoning", icon: UserCheck },
            { id: "verbal", label: "Verbal Ability", icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "pb-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer",
                activeCategory === tab.id
                  ? "border-indigo-650 text-indigo-650"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* List panel */}
          <div className="lg:col-span-2 space-y-4">
            {filteredQuestions.map((q) => (
              <div 
                key={q.id}
                className="bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-indigo-200 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                      q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {q.difficulty}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-wider font-mono">
                      {q.type || "MCQ"}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {q.topic_name || "Aptitude"}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {q.question_text}
                  </h4>
                  {q.company_tags && q.company_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.company_tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-slate-50 border border-slate-150 text-slate-400 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/dashboard/assessments/${q.id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                >
                  <span>Solve Challenge</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="bg-white border border-slate-200 p-16 rounded-[2.5rem] text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-black text-slate-900">No questions available</h4>
                <p className="text-slate-450 text-xs font-semibold">Select another practice category or check back later.</p>
              </div>
            )}
          </div>

          {/* Sidebar Info/Mocks panel */}
          <div className="space-y-8">
            {/* Active Company Mock Assessments */}
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Live OA Mocks
              </h3>
              
              <div className="space-y-4">
                {companyTests.map((test) => (
                  <div key={test.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{test.title}</h4>
                      <p className="text-[10px] font-bold text-slate-450">{test.company} — {test.role}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      <span>{test.duration_minutes} Mins</span>
                      <span>{test.passing_percentage}% Pass</span>
                    </div>
                    {/* Enter test trigger link */}
                    <Link
                      href={`/dashboard/assessments/${test.questions?.[0] || 'mock'}`}
                      className="w-full py-2 bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-650 hover:text-white rounded-lg text-center font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Start Mock Exam
                    </Link>
                  </div>
                ))}
                {companyTests.length === 0 && (
                  <p className="text-slate-400 text-xs font-mono text-center py-4">No active company tests seeded.</p>
                )}
              </div>
            </div>

            {/* Practice Guidelines card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-300" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-black tracking-tight">AI Interview Coaching</h4>
                <p className="text-indigo-200 text-xs leading-relaxed font-semibold">
                  Get structural refactoring options, Big-O complexity reports, and edge-case validation checks dynamically evaluated after every submission block.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
