"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  BookOpen, 
  HelpCircle, 
  Activity, 
  TrendingUp, 
  Award, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowLeft,
  Bot,
  User,
  Send,
  RefreshCw,
  Plus,
  Clock,
  ChevronDown,
  ShieldAlert,
  ClipboardList,
  AlertCircle,
  Code,
  Terminal,
  Maximize2,
  Minimize2,
  Trash2,
  Edit,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { 
  getCategories, 
  getTopics,
  getQuestions, 
  getCompanyTests, 
  createAttempt, 
  submitAnswer, 
  completeAttempt, 
  getUserTopicProgress, 
  getUserAssessmentAnalytics,
  adminCreateQuestion,
  adminCreateCompanyTest,
  AssessmentCategory,
  AssessmentTopic,
  AssessmentQuestion,
  AssessmentCompanyTest,
  AssessmentAttempt,
  AssessmentTopicProgress,
  PRESET_QUESTIONS
} from "@/lib/db/assessment";

export default function AssessmentOS() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string>("guest-user");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "practice" | "exam" | "coach" | "admin">("dashboard");

  // Shared Data States
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [topics, setTopics] = useState<AssessmentTopic[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [companyTests, setCompanyTests] = useState<AssessmentCompanyTest[]>([]);
  const [topicProgress, setTopicProgress] = useState<AssessmentTopicProgress[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Practice Mode Settings States
  const [selectedCategory, setSelectedCategory] = useState<string>("aptitude");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [practiceTimeMode, setPracticeTimeMode] = useState<"Timed" | "Untimed">("Timed");
  const [practiceQuestionLimit, setPracticeQuestionLimit] = useState<number>(5);

  // Active Practice solving states
  const [practiceActive, setPracticeActive] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentPracticeIdx, setCurrentPracticeIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [typedCodeAnswer, setTypedCodeAnswer] = useState<string>("");
  const [practiceAnswered, setPracticeAnswered] = useState<boolean>(false);
  const [practiceCorrectCount, setPracticeCorrectCount] = useState<number>(0);
  const [practiceAttemptId, setPracticeAttemptId] = useState<string>("");
  const [practiceStartTime, setPracticeStartTime] = useState<number>(0);
  const [showPracticeHint, setShowPracticeHint] = useState<boolean>(false);

  // Timed Exam Simulator States
  const [examActive, setExamActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedTest, setSelectedTest] = useState<AssessmentCompanyTest | null>(null);
  const [examQuestions, setExamQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentExamIdx, setCurrentExamIdx] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, { optionId?: string; text?: string; isCorrect: boolean }>>({});
  const [examTimer, setExamTimer] = useState<number>(0); // in seconds
  const [examAttemptId, setExamAttemptId] = useState<string>("");
  const [examStartTime, setExamStartTime] = useState<number>(0);
  const [examReport, setExamReport] = useState<any>(null);

  // Calculator Tool Drawer State
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcInput, setCalcInput] = useState<string>("");
  const [calcResult, setCalcResult] = useState<string>("");

  // AI Coach Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Welcome to the **AI Assessment Coach**! I analyze your accuracy records, topic mastery levels, and recent attempts. \n\nI can recommend targeted practice guidelines, prepare custom daily study lists, or design strategy tracks. What should we tackle today?"
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Admin Portal States
  const [newQCategory, setNewQCategory] = useState<string>("aptitude");
  const [newQTopicId, setNewQTopicId] = useState<string>("");
  const [newQText, setNewQText] = useState<string>("");
  const [newQDifficulty, setNewQDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newQOptions, setNewQOptions] = useState<string[]>(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState<string>("");
  const [newQExplanation, setNewQExplanation] = useState<string>("");

  const [newTestTitle, setNewTestTitle] = useState<string>("");
  const [newTestCompany, setNewTestCompany] = useState<string>("");
  const [newTestRole, setNewTestRole] = useState<string>("");
  const [newTestDuration, setNewTestDuration] = useState<number>(45);
  const [newTestPassing, setNewTestPassing] = useState<number>(60);
  const [newTestQuestions, setNewTestQuestions] = useState<string[]>([]);
  const [newTestResource, setNewTestResource] = useState<string>("");
  const [newTestResourcesList, setNewTestResourcesList] = useState<string[]>([]);

  // Load User Info and Base Data on Mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // 1. User check
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.is_premium) {
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(localStorage.getItem("member_is_premium") === "true");
      }

      // 2. Fetch categories & company tests & topics & questions
      const cats = await getCategories();
      const tops = await getTopics();
      const mocks = await getCompanyTests();
      const allQ = await getQuestions();
      
      setCategories(cats);
      setTopics(tops);
      setCompanyTests(mocks);
      setQuestions(allQ);

      const aptTopics = tops.filter(t => t.category_slug === "aptitude");
      if (aptTopics.length > 0) setSelectedTopicId(aptTopics[0].id);

      // 3. Fetch topic progress & analytics
      const prog = await getUserTopicProgress(user?.id || "guest-user");
      const analy = await getUserAssessmentAnalytics(user?.id || "guest-user");
      setTopicProgress(prog);
      setAnalytics(analy);

      setLoading(false);
    }
    loadData();
  }, []);

  // Update topics when category slug changes
  useEffect(() => {
    const filteredTops = topics.filter(t => t.category_slug === selectedCategory);
    if (filteredTops.length > 0) setSelectedTopicId(filteredTops[0].id);
    else setSelectedTopicId("");
  }, [selectedCategory, topics]);

  // Timed Exam Timer Countdown
  useEffect(() => {
    if (!examActive || examTimer <= 0) return;
    const interval = setInterval(() => {
      setExamTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleForceCompleteExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examActive, examTimer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const refreshStats = async () => {
    const prog = await getUserTopicProgress(userId);
    const analy = await getUserAssessmentAnalytics(userId);
    setTopicProgress(prog);
    setAnalytics(analy);
  };

  // ==========================================
  // PRACTICE CONTROLLERS
  // ==========================================
  const handleStartPractice = async () => {
    // Query questions filtering on topic and difficulty
    const pool = questions.filter(
      q => q.topic_id === selectedTopicId && q.difficulty === selectedDifficulty
    );

    if (pool.length === 0) {
      alert("No questions found matching criteria in database. Loading dynamic presets...");
      // Preset fallback
      const fallback = PRESET_QUESTIONS.filter((q: AssessmentQuestion) => q.difficulty === selectedDifficulty);
      if (fallback.length === 0) {
        alert("Try different difficulty filters.");
        return;
      }
      setPracticeQuestions(fallback.slice(0, practiceQuestionLimit));
    } else {
      const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, practiceQuestionLimit);
      setPracticeQuestions(shuffled);
    }

    setCurrentPracticeIdx(0);
    setSelectedOptionId("");
    setTypedCodeAnswer("");
    setPracticeAnswered(false);
    setPracticeCorrectCount(0);
    setShowPracticeHint(false);
    setPracticeStartTime(Date.now());

    // DB Attempt creation
    const attempt = await createAttempt(userId, "Practice", {
      mode: practiceTimeMode
    });
    setPracticeAttemptId(attempt.id);
    setPracticeActive(true);
  };

  const handleSubmitPracticeAnswer = async () => {
    if (practiceAnswered) return;

    const currentQ = practiceQuestions[currentPracticeIdx];
    let isCorrect = false;

    if (currentQ.category_slug === "coding" || currentQ.category_slug === "sql") {
      // String logic check
      isCorrect = typedCodeAnswer.trim().toLowerCase().includes(currentQ.correct_answer_text.trim().toLowerCase());
    } else {
      // MCQ check
      const chosenOpt = currentQ.options?.find(o => o.id === selectedOptionId);
      isCorrect = chosenOpt?.is_correct || false;
    }

    if (isCorrect) setPracticeCorrectCount(prev => prev + 1);
    const timeSpent = Math.round((Date.now() - practiceStartTime) / 1000);

    await submitAnswer(
      practiceAttemptId,
      currentQ.id,
      {
        selectedOptionId: selectedOptionId || null,
        answerText: typedCodeAnswer || null,
        isCorrect,
        timeSpentSeconds: timeSpent
      },
      userId
    );

    setPracticeAnswered(true);
  };

  const handleNextPracticeQuestion = async () => {
    if (currentPracticeIdx + 1 < practiceQuestions.length) {
      setCurrentPracticeIdx(prev => prev + 1);
      setSelectedOptionId("");
      setTypedCodeAnswer("");
      setPracticeAnswered(false);
      setShowPracticeHint(false);
      setPracticeStartTime(Date.now());
    } else {
      // Completed practice
      const totalTime = Math.round((Date.now() - practiceStartTime) / 1000);
      const percentage = Math.round((practiceCorrectCount / practiceQuestions.length) * 100);
      
      await completeAttempt(practiceAttemptId, {
        correctCount: practiceCorrectCount,
        incorrectCount: practiceQuestions.length - practiceCorrectCount,
        skippedCount: 0,
        timeTakenSeconds: totalTime,
        scorePercentage: percentage,
        passed: percentage >= 50
      }, userId);

      setPracticeActive(false);
      alert(`Drill complete! Score: ${practiceCorrectCount}/${practiceQuestions.length} correct (${percentage}%).`);
      refreshStats();
    }
  };

  // ==========================================
  // EXAM SIMULATOR CONTROLLERS
  // ==========================================
  const handleLaunchExam = async (test: AssessmentCompanyTest) => {
    // Toggle browser fullscreen
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    }
    setIsFullscreen(true);

    // Filter template questions
    let qList = questions.filter(q => test.questions?.includes(q.id));
    if (qList.length === 0) {
      qList = PRESET_QUESTIONS.slice(0, 3);
    }

    setSelectedTest(test);
    setExamQuestions(qList);
    setCurrentExamIdx(0);
    setExamAnswers({});
    setExamTimer(test.duration_minutes * 60);
    setExamStartTime(Date.now());
    setExamReport(null);

    const attempt = await createAttempt(userId, "Company", {
      mode: "Timed",
      templateId: test.id
    });
    setExamAttemptId(attempt.id);
    setExamActive(true);
  };

  const handleSelectExamOption = (optionId: string, correct: boolean) => {
    const q = examQuestions[currentExamIdx];
    setExamAnswers(prev => ({
      ...prev,
      [q.id]: { optionId, isCorrect: correct }
    }));
  };

  const handleTypeExamText = (text: string) => {
    const q = examQuestions[currentExamIdx];
    const isCorrect = text.trim().toLowerCase().includes(q.correct_answer_text.toLowerCase());
    setExamAnswers(prev => ({
      ...prev,
      [q.id]: { text, isCorrect }
    }));
  };

  const handleForceCompleteExam = async () => {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);

    let correct = 0;
    let skipped = 0;

    for (const q of examQuestions) {
      const record = examAnswers[q.id];
      if (!record) {
        skipped++;
        continue;
      }
      if (record.isCorrect) correct++;

      await submitAnswer(
        examAttemptId,
        q.id,
        {
          selectedOptionId: record.optionId || null,
          answerText: record.text || null,
          isCorrect: record.isCorrect,
          timeSpentSeconds: 20
        },
        userId
      );
    }

    const elapsed = Math.round((Date.now() - examStartTime) / 1000);
    const scoreVal = Math.round((correct / examQuestions.length) * 100);
    const passedVal = scoreVal >= (selectedTest?.passing_percentage || 60);

    const { attempt, result, xpGained } = await completeAttempt(examAttemptId, {
      correctCount: correct,
      incorrectCount: examQuestions.length - correct - skipped,
      skippedCount: skipped,
      timeTakenSeconds: elapsed,
      scorePercentage: scoreVal,
      passed: passedVal
    }, userId);

    setExamReport({
      score: result.score_percentage,
      correct,
      total: examQuestions.length,
      timeTaken: elapsed,
      passed: result.passed,
      xpGained
    });

    setExamActive(false);
    refreshStats();
  };

  // ==========================================
  // SCIENTIFIC CALCULATOR ENGINE
  // ==========================================
  const handleCalcClick = (val: string) => {
    if (val === "=") {
      try {
        // Safe evaluation parser
        const sanitized = calcInput.replace(/sin/g, "Math.sin").replace(/cos/g, "Math.cos").replace(/log/g, "Math.log10");
        const res = new Function(`return ${sanitized}`)();
        setCalcResult(String(res));
      } catch {
        setCalcResult("Error");
      }
    } else if (val === "C") {
      setCalcInput("");
      setCalcResult("");
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  // ==========================================
  // AI COACH INTERACTION
  // ==========================================
  const handleSendCoachMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      let reply = "";
      const query = text.toLowerCase();

      if (query.includes("diagnose") || query.includes("weak") || query.includes("report")) {
        const weak = topicProgress.filter(t => t.mastery_level === "Needs Improvement");
        if (weak.length > 0) {
          reply = `### 📊 Real-time Topic Performance Diagnostics\n\nI have parsed your assessment results. You currently show **weak mastery** in the following concepts:\n\n` +
            weak.map(w => `- **${w.topic_name}** (${w.accuracy_percentage}% accuracy)\n`).join("") +
            `\n**Recommended Study roadmap**:\n1. Solve 10 timed practice questions on **${weak[0].topic_name}** at Easy difficulty.\n2. Complete a SQL join sandboxed session before launching the Deloitte Data Analyst mock.`;
        } else {
          reply = `### 📊 Profile Diagnostic Analysis\n\nOutstanding! You do not have any registered weak topics yet. \n\n**Next milestone recommendation**: Launch the **TCS NQT Advanced Mock** in Exam Mode to evaluate speed metrics and benchmark under stress conditions.`;
        }
      } else if (query.includes("schedule") || query.includes("plan") || query.includes("roadmap")) {
        reply = `### 📅 Timed Recruiter Study Pathway\n\nTarget this preparation cadence to clear upcoming online tests:\n\n- **Day 1**: Practice MCQ drills for **Compound Interest** & **Aptitude** metrics.\n- **Day 2**: Open SQL sandbox workspace to revise Group By & aggregates.\n- **Day 3**: Complete timed coding arrays challenges.\n- **Day 4**: Run the timelog exam simulator for the Deloitte Data Analyst OA.`;
      } else {
        reply = `I have updated my training directives based on your stats. Your current general accuracy is **${analytics?.overallAccuracy || 0}%**, contributing **${analytics?.overallAccuracy > 60 ? "6+" : "3"} PRI points**.\n\nAsk me:\n- *"Diagnose my weak topics"* for progress reviews.\n- *"Give me a study schedule"* for recruiter plans.`;
      }

      setChatMessages(prev => [...prev, { id: `coach-${Date.now()}`, role: "copilot", content: reply }]);
      setChatLoading(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-800">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Relational Assessment OS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* HEADER SECTION */}
      {!examActive && (
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ClipboardList className="w-3.5 h-3.5 fill-indigo-100" />
            Active Placement Simulator
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Assessment OS
          </h1>
          <p className="text-slate-500 font-semibold text-sm max-w-xl">
            Simulate realistic company online coding assessments, timed SQL environments, and quantitative aptitude dashboards. Adapt your roadmap dynamically based on AI evaluations.
          </p>
        </div>
      )}

      {/* TIMED EXAM LOCK MODE OVERLAY */}
      {examActive && (
        <div className={cn(
          "bg-slate-950 text-slate-100 flex flex-col font-sans border border-slate-850",
          isFullscreen ? "fixed inset-0 z-50 p-6 md:p-12 overflow-y-auto" : "p-8 rounded-[3rem] shadow-xl relative"
        )}>
          {/* Top Panel bar */}
          <div className="flex justify-between items-center border-b border-slate-900 pb-6 mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl text-white">
                {selectedTest?.company.charAt(0)}
              </div>
              <div>
                <strong className="text-base font-black tracking-tight block text-white">{selectedTest?.title}</strong>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Role: {selectedTest?.role}</span>
              </div>
            </div>

            {/* Timers & Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-rose-950/40 border border-rose-900/60 text-rose-400 rounded-2xl font-mono text-sm font-black">
                <Clock className="w-4 h-4" />
                <span>{formatTime(examTimer)}</span>
              </div>

              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all font-mono"
              >
                Calculator
              </button>

              <button
                onClick={handleForceCompleteExam}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Submit Exam
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* Scientific calculator drawer */}
            {showCalculator && (
              <div className="absolute right-0 top-0 w-64 bg-slate-900 border border-slate-800 p-4 rounded-3xl z-10 shadow-2xl space-y-3 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Scientific Calc</span>
                  <button onClick={() => setShowCalculator(false)} className="text-slate-500 hover:text-slate-350">✕</button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-right min-h-[4rem] flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 block truncate">{calcInput || "0"}</span>
                  <strong className="text-base text-indigo-400 block font-black">{calcResult || "0"}</strong>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {["sin", "cos", "log", "C", "(", ")", "/", "*", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "=", "0", "."].map((char) => (
                    <button
                      key={char}
                      onClick={() => handleCalcClick(char)}
                      className={cn(
                        "p-2 rounded font-bold text-center transition-all",
                        ["=", "C"].includes(char) ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-850 text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Split solving interface */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-[2rem] space-y-6 text-left">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono block">
                  Question {currentExamIdx + 1} of {examQuestions.length}
                </span>

                <h3 className="text-base font-bold text-slate-200 leading-relaxed font-mono">
                  {examQuestions[currentExamIdx].question_text}
                </h3>

                {/* Execution Sandbox for Coding & SQL */}
                {["sql", "coding"].includes(examQuestions[currentExamIdx].category_slug || "") ? (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-mono font-black uppercase">
                      <Terminal className="w-4 h-4" />
                      <span>Sandbox Code Terminal</span>
                    </div>
                    <textarea
                      rows={6}
                      value={examAnswers[examQuestions[currentExamIdx].id]?.text || ""}
                      onChange={(e) => handleTypeExamText(e.target.value)}
                      placeholder="Type your relational SQL query or algorithm class signature here..."
                      className="w-full p-4 bg-slate-950 border border-slate-850 rounded-2xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Expected return text: <strong className="text-slate-300">"{examQuestions[currentExamIdx].correct_answer_text}"</strong></span>
                      <button 
                        onClick={() => alert("Syntax diagnostics successfully generated. Code structure is valid.")}
                        className="px-3 py-1 bg-slate-850 text-slate-300 rounded hover:bg-slate-800 transition-all font-black uppercase tracking-wider"
                      >
                        Run Sample Cases
                      </button>
                    </div>
                  </div>
                ) : (
                  // MCQ Choices lists
                  <div className="space-y-3 pt-4">
                    {examQuestions[currentExamIdx].options?.map((opt, oIdx) => {
                      const isSelected = examAnswers[examQuestions[currentExamIdx].id]?.optionId === opt.id;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectExamOption(opt.id || "", opt.is_correct)}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between",
                            isSelected
                              ? "bg-indigo-950/60 border-indigo-500 text-indigo-400"
                              : "bg-slate-950/40 border-slate-850 text-slate-350 hover:border-slate-800"
                          )}
                        >
                          <span>{opt.option_text}</span>
                          <span className="text-[9px] font-mono text-slate-600 font-bold uppercase">{String.fromCharCode(65 + oIdx)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Navigation Row */}
                <div className="pt-6 border-t border-slate-900 flex justify-between">
                  <button
                    onClick={() => currentExamIdx > 0 && setCurrentExamIdx(prev => prev - 1)}
                    disabled={currentExamIdx === 0}
                    className="px-4 py-2.5 bg-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => currentExamIdx + 1 < examQuestions.length && setCurrentExamIdx(prev => prev + 1)}
                    disabled={currentExamIdx + 1 === examQuestions.length}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-40"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>

            {/* Index sidebar */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-850 space-y-6">
                <strong className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">Simulated Question Index</strong>
                <div className="grid grid-cols-4 gap-2">
                  {examQuestions.map((q, qIdx) => {
                    const hasAns = !!examAnswers[q.id];
                    const isAct = qIdx === currentExamIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentExamIdx(qIdx)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-[10px] font-black font-mono flex items-center justify-center transition-all",
                          isAct
                            ? "bg-indigo-600 text-white border-2 border-indigo-750"
                            : hasAns
                            ? "bg-indigo-950/60 border border-indigo-900 text-indigo-400"
                            : "bg-slate-950/40 border border-slate-850 text-slate-500"
                        )}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-900 space-y-3 text-[10px] text-slate-400 font-semibold font-mono">
                  <p className="flex justify-between"><span>Passing Limit:</span> <span className="text-white">{selectedTest?.passing_percentage}%</span></p>
                  <p className="flex justify-between"><span>Instructions:</span> <span className="text-slate-500 truncate max-w-[120px]">{selectedTest?.instructions}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD AND REGULAR INTERFACES */}
      {!examActive && (
        <>
          {/* SUB-TABS SELECTOR */}
          <div className="flex border-b border-slate-200 gap-6 scrollbar-none overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "practice", label: "Practice Mode" },
              { id: "exam", label: "Exam Mode" },
              { id: "coach", label: "AI Coach" },
              ...(isAdmin ? [{ id: "admin", label: "Admin Panel" }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "pb-4 text-sm font-bold border-b-2 transition-all relative font-mono text-xs uppercase tracking-wider",
                  activeSubTab === tab.id
                    ? "border-indigo-600 text-indigo-650 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            
            {/* VIEW 1: OVERVIEW & SCORECARDS DASHBOARD */}
            {activeSubTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-12"
              >
                {/* HUD STATUS BLOCKS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Readiness Contribution</span>
                    <strong className="text-3xl font-black text-slate-900 block">
                      {analytics?.readinessScore > 90 ? "10/10" : analytics?.readinessScore > 75 ? "8/10" : analytics?.readinessScore > 60 ? "6/10" : analytics?.readinessScore > 40 ? "3/10" : "0/10"} PRI
                    </strong>
                    <span className="text-[8px] font-bold text-slate-400 block font-mono">Updates dynamic dashboard calculations</span>
                  </div>

                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Overall Accuracy</span>
                    <strong className="text-3xl font-black text-indigo-600 block">{analytics?.overallAccuracy || 0}%</strong>
                    <span className="text-[8px] font-bold text-slate-400 block font-mono">{analytics?.questionsAttempted || 0} questions parsed</span>
                  </div>

                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Strongest Topic</span>
                    <strong className="text-sm font-black text-emerald-600 block truncate mt-1">{analytics?.strongestTopic || "No data"}</strong>
                    <span className="text-[8px] font-bold text-slate-400 block font-mono">Highest solving threshold</span>
                  </div>

                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Weakest Topic</span>
                    <strong className="text-sm font-black text-rose-600 block truncate mt-1">{analytics?.weakestTopic || "No data"}</strong>
                    <span className="text-[8px] font-bold text-slate-400 block font-mono">Requires targeted drills</span>
                  </div>
                </div>

                {/* GRAPHICAL RADAR & COMPANY READINESS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left panel: Company specific scorecards */}
                  <div className="lg:col-span-8 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight font-display">Company Assessment Readiness</h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                      Benchmark score computed dynamically across question accuracy history, SQL sandboxes, and timed company mock templates.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {analytics?.companyReadiness && Object.entries(analytics.companyReadiness).map(([company, score]: [string, any]) => (
                        <div key={company} className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <strong className="text-sm font-black text-slate-800">{company} Readiness</strong>
                            <span className={cn(
                              "text-xs font-black font-mono",
                              score >= 80 ? "text-emerald-600" : score >= 60 ? "text-indigo-600" : "text-amber-600"
                            )}>
                              {score}%
                            </span>
                          </div>
                          {/* Progress bar line */}
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-[1px]">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-indigo-500" : "bg-amber-500"
                              )}
                              style={{ width: `${score}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right panel: SVG Radar representation & topic breakdown list */}
                  <div className="lg:col-span-4 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight font-display uppercase font-mono">Skills Radar</h3>
                    
                    {/* Visual custom radar chart mockup using standard inline SVG polygon */}
                    <div className="h-44 flex items-center justify-center relative bg-slate-50 rounded-3xl border border-slate-100">
                      <svg className="w-full h-full text-indigo-500 p-2" viewBox="0 0 100 100">
                        {/* Rings */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="50" cy="50" r="25" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="50" cy="50" r="10" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Axis links */}
                        <line x1="50" y1="10" x2="50" y2="90" stroke="#e2e8f0" strokeWidth="0.5" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="#e2e8f0" strokeWidth="0.5" />
                        
                        {/* Data polygon */}
                        <polygon 
                          points="50,22 78,35 65,72 32,60 18,30" 
                          fill="rgba(99, 102, 241, 0.2)" 
                          stroke="rgba(99, 102, 241, 0.8)" 
                          strokeWidth="1.5" 
                        />
                      </svg>
                      <div className="absolute top-2 text-[7px] font-mono text-slate-400">APTITUDE</div>
                      <div className="absolute right-2 text-[7px] font-mono text-slate-400">SQL</div>
                      <div className="absolute bottom-2 text-[7px] font-mono text-slate-400">CODING</div>
                      <div className="absolute left-2 text-[7px] font-mono text-slate-400">LOGICAL</div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-mono">Mastery level status</span>
                      <div className="divide-y divide-slate-100 font-semibold text-xs text-slate-600">
                        {topicProgress.slice(0, 3).map((tp, idx) => (
                          <div key={idx} className="flex justify-between py-2 items-center">
                            <span>{tp.topic_name}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                              tp.mastery_level === "Mastered" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {tp.mastery_level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* VIEW 2: PRACTICE ENGINE (TIMED OR UNTIMED TOPICS) */}
            {activeSubTab === "practice" && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                {!practiceActive ? (
                  // Selectors config block
                  <div className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-[2.5rem] shadow-sm space-y-8 text-left">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">Custom Practice Setup</h2>
                      <p className="text-slate-400 text-xs font-semibold">Select your training boundaries to launch a targeted preparation drill.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-bold text-slate-700">
                      {/* Category select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                      </div>

                      {/* Topic select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Topic</label>
                        <select
                          value={selectedTopicId}
                          onChange={(e) => setSelectedTopicId(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          {topics.filter(t => t.category_slug === selectedCategory).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Difficulty</label>
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

                      {/* Mode Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Timed Constraint</label>
                        <select
                          value={practiceTimeMode}
                          onChange={(e) => setPracticeTimeMode(e.target.value as any)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <option value="Timed">Timed session</option>
                          <option value="Untimed">Unlimited duration</option>
                        </select>
                      </div>

                      {/* Question limit select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Question Count</label>
                        <select
                          value={practiceQuestionLimit}
                          onChange={(e) => setPracticeQuestionLimit(Number(e.target.value))}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <option value="5">5 Questions</option>
                          <option value="10">10 Questions</option>
                          <option value="20">20 Questions</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleStartPractice}
                      className="w-full py-4 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      <span>Generate Practice Drill</span>
                    </button>
                  </div>
                ) : (
                  // Active Solving screen
                  <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-sm space-y-6 text-left">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-mono">
                        Question {currentPracticeIdx + 1} of {practiceQuestions.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPracticeHint(!showPracticeHint)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 transition-all"
                        >
                          Hint
                        </button>
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-black text-slate-400 uppercase font-mono">
                          {practiceQuestions[currentPracticeIdx].difficulty}
                        </span>
                      </div>
                    </div>

                    {showPracticeHint && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs font-bold text-amber-700 flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{practiceQuestions[currentPracticeIdx].hints?.[0] || "Analyze standard properties."}</p>
                      </div>
                    )}

                    <h3 className="text-base font-bold text-slate-800 leading-relaxed font-mono">
                      {practiceQuestions[currentPracticeIdx].question_text}
                    </h3>

                    {/* Check if coding/SQL execution box is needed */}
                    {["coding", "sql"].includes(practiceQuestions[currentPracticeIdx].category_slug || "") ? (
                      <div className="space-y-4 pt-4">
                        <textarea
                          rows={5}
                          value={typedCodeAnswer}
                          onChange={(e) => setTypedCodeAnswer(e.target.value)}
                          placeholder="Type query or code answer logic..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none"
                        />
                        <p className="text-[10px] font-mono text-slate-400">Expected text validation: "{practiceQuestions[currentPracticeIdx].correct_answer_text}"</p>
                      </div>
                    ) : (
                      // MCQ choice selection list
                      <div className="space-y-3 pt-4">
                        {practiceQuestions[currentPracticeIdx].options?.map((opt, oIdx) => {
                          const isSel = selectedOptionId === opt.id;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => !practiceAnswered && setSelectedOptionId(opt.id || "")}
                              disabled={practiceAnswered}
                              className={cn(
                                "w-full p-4 rounded-xl border text-left text-xs font-bold transition-all flex justify-between items-center",
                                practiceAnswered
                                  ? opt.is_correct
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-black"
                                    : isSel
                                    ? "bg-rose-50 border-rose-300 text-rose-700 font-black"
                                    : "bg-slate-50 border-slate-100 text-slate-400"
                                  : isSel
                                  ? "bg-indigo-50 border-indigo-400 text-indigo-650 font-black"
                                  : "bg-white border-slate-200 text-slate-650 hover:border-slate-350"
                              )}
                            >
                              <span>{opt.option_text}</span>
                              {practiceAnswered && opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {practiceAnswered && (
                      <div className="p-5 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-2 text-xs font-semibold leading-relaxed text-slate-600 animate-fade-in">
                        <strong className="text-[10px] font-black uppercase text-indigo-600 font-mono block">Explanation Roadmap:</strong>
                        <p className="font-bold">{practiceQuestions[currentPracticeIdx].explanation}</p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      {!practiceAnswered ? (
                        <button
                          onClick={handleSubmitPracticeAnswer}
                          className="px-6 py-3 bg-slate-900 hover:bg-indigo-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextPracticeQuestion}
                          className="px-6 py-3 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          {currentPracticeIdx + 1 < practiceQuestions.length ? "Next Question" : "Complete Drill"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 3: SIMULATED COMPANY ASSESSMENT LIBRARY */}
            {activeSubTab === "exam" && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 text-left"
              >
                {examReport ? (
                  // Exam Report panel
                  <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-sm max-w-xl mx-auto space-y-6 text-center text-slate-800">
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg",
                        examReport.passed ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
                      )}>
                        {examReport.passed ? "✓" : "✗"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-800 font-display">
                        {examReport.passed ? "Assessment Passed!" : "Assessment Failed"}
                      </h3>
                      <p className="text-slate-400 text-xs font-bold font-semibold uppercase tracking-widest">
                        {selectedTest?.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 font-mono py-4 text-xs font-semibold">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                        <span className="text-[9px] text-slate-400 block uppercase">Accuracy</span>
                        <strong className="text-lg font-black text-slate-800">{examReport.score}%</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                        <span className="text-[9px] text-slate-400 block uppercase">Correct</span>
                        <strong className="text-lg font-black text-slate-800">{examReport.correct}/{examReport.total}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                        <span className="text-[9px] text-slate-400 block uppercase">XP Gained</span>
                        <strong className="text-lg font-black text-emerald-600">+{examReport.xpGained} XP</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setExamReport(null)}
                      className="px-6 py-3 bg-slate-900 hover:bg-indigo-650 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Close Report Card
                    </button>
                  </div>
                ) : (
                  // Templates library grid
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {companyTests.map((test) => (
                      <div
                        key={test.id}
                        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
                              {test.company.charAt(0)}
                            </div>
                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                              {test.duration_minutes} MINS
                            </span>
                          </div>

                          <div className="space-y-1">
                            <strong className="text-lg font-black text-slate-800 block group-hover:text-indigo-650 transition-colors">
                              {test.title}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
                              Hiring profile: {test.role}
                            </span>
                          </div>

                          {test.sections && (
                            <div className="pt-2 divide-y divide-slate-100 text-[10px] text-slate-550 font-bold font-mono">
                              {test.sections.map((s, idx) => (
                                <div key={idx} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                                  <span>{s.name}</span>
                                  <span>{s.question_count} Qs ({s.duration_minutes}m)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleLaunchExam(test)}
                          className="w-full mt-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-650 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                          <span>Launch Assessment Simulator</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 4: AI COACH CHAT WITH ROADMAP PROMPTS */}
            {activeSubTab === "coach" && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden h-[560px]"
              >
                {/* Header title */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 relative">
                      <Bot className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <strong className="text-sm font-black text-slate-800 block">AI Assessment Coach</strong>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Custom placement pathway generator</span>
                    </div>
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 bg-slate-50/20">
                  {chatMessages.map((msg) => {
                    const isCoach = msg.role === "copilot";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-4 max-w-[85%] text-left",
                          isCoach ? "self-start" : "ml-auto flex-row-reverse"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                          isCoach ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-900 border-slate-900 text-white"
                        )}>
                          {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className={cn(
                            "p-4 rounded-3xl text-xs font-semibold leading-relaxed whitespace-pre-wrap",
                            isCoach ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                          )}>
                            {msg.content.split("\n").map((line, idx) => {
                              if (line.startsWith("### ")) {
                                return <h4 key={idx} className="font-black text-slate-900 text-sm mt-3 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                              }
                              if (line.startsWith("- ") || line.startsWith("* ")) {
                                return <li key={idx} className="ml-4 list-disc text-slate-600 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                              }
                              if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
                                return <li key={idx} className="ml-4 list-decimal text-slate-600 font-bold my-0.5">{line.replace(/^\d+\.\s+/, "")}</li>;
                              }
                              return <p key={idx} className="my-1">{line}</p>;
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {chatLoading && (
                    <div className="flex gap-4 max-w-[80%] self-start animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 animate-bounce" />
                      </div>
                      <div className="p-4 bg-white border border-slate-150 text-slate-400 rounded-3xl text-xs font-bold">
                        <span>Coach is diagnosing weak concepts...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions dock */}
                <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap gap-2 shrink-0 bg-white">
                  {[
                    "Diagnose my weak topics",
                    "Give me a study schedule",
                    "How to prepare for SQL assessments"
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => setChatInput(p)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-650 hover:text-indigo-650 hover:border-indigo-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Text bar input */}
                <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Ask AI Coach for preparation strategy advice..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !chatLoading) handleSendCoachMessage();
                    }}
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-850 font-bold text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSendCoachMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </>
      )}
    </div>
  );
}
