"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { triggerMissionProgress } from "@/lib/db/missions";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Award,
  Briefcase,
  Check,
  Trash2,
  Play,
  ArrowRight,
  BookOpen,
  X,
  Camera,
  Mic,
  HelpCircle,
  Info,
  Lock,
  UserCheck,
  TrendingUp,
  Smile,
  RefreshCw,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Question {
  id: string;
  question: string;
  hint: string;
  explanation: string;
}

interface StarAnalysis {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  situationFeedback: string;
  taskFeedback: string;
  actionFeedback: string;
  resultFeedback: string;
}

interface EvaluationResult {
  scores: {
    technicalAccuracy: number;
    communication: number;
    clarity: number;
    completeness: number;
    confidence: number;
    overall: number;
  };
  starAnalysis: StarAnalysis;
  whatWentWell: string;
  whatWasMissing: string;
  recruiterPerspective: string;
  idealStructure: string;
  idealAnswer: string;
}

interface QuestionSession {
  question: Question;
  userAnswer: string;
  evaluation?: EvaluationResult;
  isEvaluating: boolean;
}

interface HistoryItem {
  id: string;
  company: string;
  role: string;
  type: string;
  mode: string;
  date: string;
  overallScore: number;
  sessions: {
    question: string;
    userAnswer: string;
    scores: {
      technicalAccuracy: number;
      communication: number;
      clarity: number;
      completeness: number;
      confidence: number;
      overall: number;
    };
  }[];
  strengths: string[];
  weaknesses: string[];
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
}

const COMPANIES = [
  "IBM", "TCS", "Infosys", "Deloitte", "Accenture", "Wipro", "Cognizant", "Capgemini", "HCLTech", "Other"
];

const ROLES = [
  "Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "Data Analyst", "Data Scientist", "AI/ML Engineer", "Business Analyst", "Cloud Engineer", "DevOps Engineer"
];

const ROUND_TYPES = [
  "Technical", "HR Round", "Behavioral", "Managerial", "System Design", "Aptitude", "Group Prep"
];

const BADGE_TEMPLATES = [
  { id: "rookie", title: "Interview Rookie", description: "Complete your first AI mock interview", color: "from-blue-500 to-indigo-500", icon: <UserCheck className="w-5 h-5 text-white" /> },
  { id: "tech_expert", title: "Technical Expert", description: "Score above 85% in a Technical round", color: "from-emerald-500 to-teal-500", icon: <Award className="w-5 h-5 text-white" /> },
  { id: "hr_master", title: "HR Master", description: "Score above 85% in an HR round", color: "from-purple-500 to-pink-500", icon: <Smile className="w-5 h-5 text-white" /> },
  { id: "placement_ready", title: "Placement Ready", description: "Achieve over 90% in Exam Mode", color: "from-amber-500 to-orange-500", icon: <Sparkles className="w-5 h-5 text-white" /> },
  { id: "star_practitioner", title: "STAR Practitioner", description: "Include Situation, Task, Action, and Result in a Behavioral round", color: "from-rose-500 to-red-500", icon: <CheckCircle2 className="w-5 h-5 text-white" /> }
];

const FILLER_WORDS = ["um", "uh", "like", "so", "basically", "actually", "you know", "ah"];

const countFillerWords = (text: string) => {
  if (!text) return { total: 0, details: {} as Record<string, number> };
  const cleanedText = text.toLowerCase();
  let total = 0;
  const details: Record<string, number> = {};
  
  const youKnowMatches = (cleanedText.match(/\byou know\b/g) || []).length;
  if (youKnowMatches > 0) {
    total += youKnowMatches;
    details["you know"] = youKnowMatches;
  }
  const cleanStrForSingleWords = cleanedText.replace(/\byou know\b/g, "");

  const singleWords = cleanStrForSingleWords.split(/[^a-zA-Z]+/);
  singleWords.forEach(w => {
    if (FILLER_WORDS.includes(w) && w !== "you" && w !== "know") {
      total++;
      details[w] = (details[w] || 0) + 1;
    }
  });

  return { total, details };
};

export default function AiInterviewPrep() {
  // App States: 'setup', 'simulation', 'feedback'
  const [appState, setAppState] = useState<"setup" | "simulation" | "feedback">("setup");
  
  // Setup Parameters
  const [selectedFocus, setSelectedFocus] = useState<"company" | "role">("role");
  const [selectedCompany, setSelectedCompany] = useState<string>("IBM");
  const [selectedRole, setSelectedRole] = useState<string>("Software Engineer");
  const [selectedType, setSelectedType] = useState<string>("Technical");
  const [selectedMode, setSelectedMode] = useState<string>("Practice");
  const [questionLimit, setQuestionLimit] = useState<number>(3);
  const [timerLimit, setTimerLimit] = useState<number>(60); // seconds, 0 = unlimited

  // Active Simulation State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [sessions, setSessions] = useState<QuestionSession[]>([]);
  const [activeAnswerText, setActiveAnswerText] = useState<string>("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // History & Badges
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Final evaluation states
  const [finalScore, setFinalScore] = useState<number>(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState<boolean>(false);

  // Resume Tailoring States
  const [hasResume, setHasResume] = useState<boolean>(false);
  const [resumeTailored, setResumeTailored] = useState<boolean>(false);

  // Live Camera States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Voice Speech synthesis (TTS)
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Speech to text dictation (STT)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Filler Word Aggregates
  const [totalFillerCount, setTotalFillerCount] = useState<number>(0);
  const [fillerDetails, setFillerDetails] = useState<Record<string, number>>({});

  // TTS Reader
  const speakQuestion = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes("en-US") || voice.lang.includes("en-GB"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Live Camera Access
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or unavailable.");
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOn(false);
  };

  // STT Dictation
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }
    setSpeechError(null);
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setActiveAnswerText(prev => {
            const separator = prev.trim() ? " " : "";
            return prev + separator + finalTranscript;
          });
        }
      };
      rec.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied.");
        } else {
          setSpeechError(`Microphone error: ${event.error}`);
        }
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setSpeechError("Failed to initialize speech recognition.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Auto-read question when it changes
  useEffect(() => {
    if (appState === "simulation" && questions.length > 0 && autoSpeak) {
      const timer = setTimeout(() => {
        speakQuestion(questions[currentQuestionIndex].question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, appState, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up media streams
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cameraStream]);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey); // eslint-disable-line react-hooks/set-state-in-effect

      // Check if resume exists
      const savedResumeText = localStorage.getItem("last_analyzed_resume_text");
      if (savedResumeText && savedResumeText.trim()) {
        setHasResume(true);
      }

      // Load History
      const savedHistory = localStorage.getItem("interview_history");
      let loadedHistory: HistoryItem[] = [];
      if (savedHistory) {
        try {
          loadedHistory = JSON.parse(savedHistory);
          setHistory(loadedHistory);
        } catch {}
      }

      // Load Badges
      const savedBadges = localStorage.getItem("interview_badges");
      let unlockedIds: string[] = [];
      if (savedBadges) {
        try { unlockedIds = JSON.parse(savedBadges); } catch {}
      }

      // Map Badges
      const initialBadges = BADGE_TEMPLATES.map(b => ({
        ...b,
        unlocked: unlockedIds.includes(b.id)
      }));
      setBadges(initialBadges);
    }
  }, []);

  // Timer Tick was moved below handleNextQuestion to avoid hoisting reference issues in ESLint.

  // Start simulation
  const startInterview = async () => {
    setIsGeneratingQuestions(true);
    setApiError(null);
    try {
      const resumeText = resumeTailored ? localStorage.getItem("last_analyzed_resume_text") : undefined;
      const res = await fetch("/api/resume/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          action: "generate",
          company: selectedFocus === "company" ? selectedCompany : undefined,
          role: selectedFocus === "role" ? selectedRole : undefined,
          type: selectedType,
          mode: selectedMode,
          limit: questionLimit,
          resumeText: resumeText || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        const initialSessions = data.questions.map((q: Question) => ({
          question: q,
          userAnswer: "",
          isEvaluating: false
        }));
        setSessions(initialSessions);
        setCurrentQuestionIndex(0);
        setActiveAnswerText("");
        setUserAnswers(new Array(data.questions.length).fill(""));
        setTimeLeft(timerLimit);
        setAppState("simulation");
        setTimeout(() => {
          startCamera();
        }, 500);
      } else {
        throw new Error("No questions returned from AI.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setApiError(errMsg);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Badge unlocks
  const checkAndUnlockBadges = (
    score: number,
    type: string,
    mode: string,
    evaluatedSessions: QuestionSession[],
    fullHistory: HistoryItem[]
  ) => {
    const unlockedIds: string[] = badges.filter(b => b.unlocked).map(b => b.id);
    let newUnlock = false;

    // Badge 1: Rookie (Complete 1 interview)
    if (!unlockedIds.includes("rookie") && fullHistory.length >= 1) {
      unlockedIds.push("rookie");
      newUnlock = true;
    }

    // Badge 2: Tech Expert (Technical round with >85% score)
    if (!unlockedIds.includes("tech_expert") && type === "Technical" && score >= 85) {
      unlockedIds.push("tech_expert");
      newUnlock = true;
    }

    // Badge 3: HR Master (HR round with >85% score)
    if (!unlockedIds.includes("hr_master") && type === "HR Round" && score >= 85) {
      unlockedIds.push("hr_master");
      newUnlock = true;
    }

    // Badge 4: Placement Ready (Simulated exam with >90% overall score)
    if (!unlockedIds.includes("placement_ready") && mode === "Exam" && score >= 90) {
      unlockedIds.push("placement_ready");
      newUnlock = true;
    }

    // Badge 5: STAR Practitioner (Includes STAR check)
    if (!unlockedIds.includes("star_practitioner") && type === "Behavioral") {
      const allStarChecked = evaluatedSessions.every(s => 
        s.evaluation?.starAnalysis?.hasSituation && 
        s.evaluation?.starAnalysis?.hasTask && 
        s.evaluation?.starAnalysis?.hasAction && 
        s.evaluation?.starAnalysis?.hasResult
      );
      if (allStarChecked) {
        unlockedIds.push("star_practitioner");
        newUnlock = true;
      }
    }

    if (newUnlock) {
      localStorage.setItem("interview_badges", JSON.stringify(unlockedIds));
      setBadges(prev => prev.map(b => ({
        ...b,
        unlocked: unlockedIds.includes(b.id)
      })));
    }
  };

  // Submit whole interview
  const submitInterview = async (answers: string[]) => {
    stopCamera();
    stopSpeaking();
    stopListening();
    setIsSubmittingInterview(true);
    setAppState("feedback");
    setApiError(null);

    try {
      let totalFillers = 0;
      const aggregatedFillerDetails: Record<string, number> = {};

      answers.forEach(ans => {
        const result = countFillerWords(ans);
        totalFillers += result.total;
        Object.entries(result.details).forEach(([word, count]) => {
          aggregatedFillerDetails[word] = (aggregatedFillerDetails[word] || 0) + count;
        });
      });

      setTotalFillerCount(totalFillers);
      setFillerDetails(aggregatedFillerDetails);

      const finalSessions = [...sessions];
      
      // Evaluate any non-evaluated answers (e.g. Exam mode or remaining Practice steps)
      const evaluationPromises = finalSessions.map(async (sess, idx) => {
        if (sess.evaluation) return sess;
        
        const updatedSess = { ...sess };
        try {
          const res = await fetch("/api/resume/interview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-gemini-api-key": apiKey
            },
            body: JSON.stringify({
              action: "evaluate",
              question: sess.question.question,
              userAnswer: answers[idx] || "No answer provided.",
              interviewType: selectedType,
              targetRole: selectedFocus === "role" ? selectedRole : undefined,
              company: selectedFocus === "company" ? selectedCompany : undefined
            })
          });
          const evalData = await res.json();
          if (res.ok) {
            updatedSess.evaluation = evalData;
          }
        } catch (e: unknown) {
          console.error(`Evaluation failed for question ${idx}:`, e);
        }
        return updatedSess;
      });

      const evaluatedSessions = await Promise.all(evaluationPromises);
      setSessions(evaluatedSessions);

      // Compute statistics
      let totalAcc = 0;
      let totalComm = 0;
      let totalClar = 0;
      let totalComp = 0;
      let totalConf = 0;
      let totalCount = 0;

      const allStrengths: string[] = [];
      const allWeaknesses: string[] = [];
      const starMethodChecks = { situation: 0, task: 0, action: 0, result: 0 };

      evaluatedSessions.forEach(s => {
        if (s.evaluation?.scores) {
          const sc = s.evaluation.scores;
          totalAcc += sc.technicalAccuracy;
          totalComm += sc.communication;
          totalClar += sc.clarity;
          totalComp += sc.completeness;
          totalConf += sc.confidence;
          totalCount++;

          if (sc.technicalAccuracy >= 8) allStrengths.push("Technical Knowledge");
          if (sc.clarity >= 8) allStrengths.push("Direct Framing");
          if (sc.communication >= 8) allStrengths.push("Professional Voice");

          if (sc.technicalAccuracy < 6) allWeaknesses.push("Technical Accuracy");
          if (sc.completeness < 6) allWeaknesses.push("Completeness");
          if (sc.clarity < 6) allWeaknesses.push("Clarity");
        }

        if (s.evaluation?.starAnalysis) {
          const star = s.evaluation.starAnalysis;
          if (star.hasSituation) starMethodChecks.situation++;
          if (star.hasTask) starMethodChecks.task++;
          if (star.hasAction) starMethodChecks.action++;
          if (star.hasResult) starMethodChecks.result++;
        }
      });

      const avgOverall = totalCount > 0 
        ? Math.round(((totalAcc + totalComm + totalClar + totalComp + totalConf) / (totalCount * 5)) * 10) 
        : 70;

      setFinalScore(avgOverall);

      // Clean up lists
      const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 3);
      const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 3);
      
      if (uniqueStrengths.length === 0) uniqueStrengths.push("Communication Speed");
      if (uniqueWeaknesses.length === 0) uniqueWeaknesses.push("Detailed Examples");

      setStrengths(uniqueStrengths);
      setWeaknesses(uniqueWeaknesses);

      // History mapping
      const historyItem: HistoryItem = {
        id: (Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36)),
        company: selectedFocus === "company" ? selectedCompany : "General",
        role: selectedFocus === "role" ? selectedRole : "Software Engineer",
        type: selectedType,
        mode: selectedMode,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        overallScore: avgOverall,
        sessions: evaluatedSessions.map(s => ({
          question: s.question.question,
          userAnswer: s.userAnswer,
          scores: s.evaluation?.scores || { technicalAccuracy: 7, communication: 7, clarity: 7, completeness: 7, confidence: 7, overall: 70 }
        })),
        strengths: uniqueStrengths,
        weaknesses: uniqueWeaknesses
      };

      const updatedHistory = [historyItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("interview_history", JSON.stringify(updatedHistory));

      // Trigger Badge achievements
      checkAndUnlockBadges(avgOverall, selectedType, selectedMode, evaluatedSessions, updatedHistory);

      // Recalculate PRI Score and trigger mission progress
      const supabaseClient = createClient();
      supabaseClient.auth.getUser().then(({ data: { user } }) => {
        const uid = user ? user.id : "guest-user";
        calculatePRIScore(uid).catch(console.error);
        triggerMissionProgress(uid, "interviews", 1).catch(console.error);
      });

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setApiError("Evaluation aggregation failed: " + errMsg);
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  // Next Question or Submit
  const handleNextQuestion = async (isTimeout = false) => {
    stopListening();
    stopSpeaking();
    const finalAnswer = isTimeout ? (activeAnswerText || "Candidate did not answer in time.") : activeAnswerText;
    
    // Save answer
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = finalAnswer;
    setUserAnswers(updatedAnswers);

    setSessions(prev => prev.map((s, idx) => 
      idx === currentQuestionIndex ? { ...s, userAnswer: finalAnswer } : s
    ));

    // If Practice mode, evaluate immediately on step
    if (selectedMode === "Practice" && !isTimeout) {
      setSessions(prev => prev.map((s, idx) => 
        idx === currentQuestionIndex ? { ...s, isEvaluating: true } : s
      ));
      try {
        const res = await fetch("/api/resume/interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-gemini-api-key": apiKey
          },
          body: JSON.stringify({
            action: "evaluate",
            question: questions[currentQuestionIndex].question,
            userAnswer: finalAnswer,
            interviewType: selectedType,
            targetRole: selectedFocus === "role" ? selectedRole : undefined,
            company: selectedFocus === "company" ? selectedCompany : undefined
          })
        });
        const evalData = await res.json();
        if (res.ok) {
          setSessions(prev => prev.map((s, idx) => 
            idx === currentQuestionIndex ? { ...s, evaluation: evalData } : s
          ));
        }
      } catch (e: unknown) {
        console.error("Evaluation error:", e);
      } finally {
        setSessions(prev => prev.map((s, idx) => 
          idx === currentQuestionIndex ? { ...s, isEvaluating: false } : s
        ));
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setActiveAnswerText("");
      setShowHint(false);
      setShowExplanation(false);
      setTimeLeft(timerLimit);
    } else {
      // End of interview!
      submitInterview(updatedAnswers);
    }
  };

  // Timer Tick - placed here to avoid order of declaration reference warnings in ESLint
  useEffect(() => {
    if (appState === "simulation" && timerLimit > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Handle timeout - auto submit current answer
            handleNextQuestion(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, currentQuestionIndex, timerLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Learning resource recommendations
  const getResourceRecommendations = (weakList: string[]) => {
    const list: { title: string; link: string; icon: string }[] = [];
    if (weakList.includes("Technical Accuracy") || weakList.includes("Technical Knowledge")) {
      list.push({ title: "Cracking the Coding Interview - Core Topics", link: "https://www.youtube.com", icon: "DSA" });
      list.push({ title: "Advanced Data Structures & Algorithms Playbook", link: "https://www.leetcode.com", icon: "DSA" });
    }
    if (weakList.includes("System Design")) {
      list.push({ title: "System Design Guide for Big Tech Interviews", link: "https://bytebytego.com", icon: "System" });
    }
    if (weakList.includes("Completeness") || weakList.includes("STAR method") || weakList.includes("Detailed Examples")) {
      list.push({ title: "Mastering the STAR Method for Behavioral Interviews", link: "https://www.youtube.com", icon: "Behavioral" });
    }
    if (weakList.includes("Clarity") || weakList.includes("Communication")) {
      list.push({ title: "Public Speaking & Recruiter Clarity Guide", link: "https://www.youtube.com", icon: "Comm" });
    }
    // Fallback if empty
    if (list.length === 0) {
      list.push({ title: "BuggedBrain Career Readiness Playbook", link: "#", icon: "Prep" });
    }
    return list;
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("interview_history", JSON.stringify(updated));
  };

  return (
    <div className="space-y-12">
      
      {/* HEADER SECTION */}
      <div className="max-w-4xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 fill-indigo-100 animate-pulse" />
          Real-Time AI Interview Simulator
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          AI Mock Interview Prep
        </h1>
        <p className="text-slate-500 font-medium text-base max-w-2xl leading-relaxed">
          Select target companies or roles to spin up a fully customized, timed simulation. Get evaluated across five parameters on the spot, complete with STAR checks and learning roadmaps.
        </p>
      </div>

      {/* API KEY CHECK ALERT */}
      {!apiKey && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-bold text-amber-800 space-y-1">
            <p>Gemini API Key is not set in local storage.</p>
            <p className="text-amber-600 font-medium">To run dynamic AI generation, please set your key in the dashboard settings or configuration tab.</p>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {apiError}
        </div>
      )}

      {/* MAIN VIEW CONTEXT SWITCHER */}
      <AnimatePresence mode="wait">
        
        {/* SETUP SCREEN */}
        {appState === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* SETUP FORM */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 p-8 space-y-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Configure Simulator
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FOCUS SELECTION TOGGLE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Mode</label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      onClick={() => setSelectedFocus("role")}
                      className={cn(
                        "flex-1 py-3 text-xs font-black rounded-xl transition-all",
                        selectedFocus === "role" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Role Specific
                    </button>
                    <button
                      onClick={() => setSelectedFocus("company")}
                      className={cn(
                        "flex-1 py-3 text-xs font-black rounded-xl transition-all",
                        selectedFocus === "company" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Company Specific
                    </button>
                  </div>
                </div>

                {/* TARGET LIST DROPDOWN */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedFocus === "role" ? "Target Role" : "Target Company"}
                  </label>
                  {selectedFocus === "role" ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ROUND TYPE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interview Round Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* SIMULATION MODE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulation Mode</label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Practice">Practice Mode (Unlimited Hints & Live Help)</option>
                    <option value="Exam">Exam Mode (Timed, Scores at End Only)</option>
                    <option value="Simulation">Company Simulator (MNC Panel Style)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QUESTIONS COUNT */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Count</label>
                  <div className="flex gap-2">
                    {[3, 5, 10].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionLimit(cnt)}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-xl border transition-all",
                          questionLimit === cnt 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* TIMER CONFIG */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Limit (per question)</label>
                  <select
                    value={timerLimit}
                    onChange={(e) => setTimerLimit(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={30}>30 Seconds (Fast pace)</option>
                    <option value={60}>60 Seconds (Standard)</option>
                    <option value={90}>90 Seconds (Detailed)</option>
                    <option value={120}>120 Seconds (System Design / Managerial)</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
              </div>

              {/* ADVANCED SIMULATOR CUSTOMIZATIONS */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI Simulator Options</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* RESUME TAILORING */}
                  <div className={cn(
                    "p-4 border rounded-2xl flex items-start justify-between gap-3 transition-all",
                    resumeTailored 
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold" 
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}>
                    <div className="space-y-1">
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Tailor to My Resume
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-normal">
                        AI will read your analyzed resume and generate questions probing your actual projects and skill claims.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!hasResume}
                      checked={resumeTailored}
                      onChange={(e) => setResumeTailored(e.target.checked)}
                      className="mt-1 cursor-pointer w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* VOICE SYNTHESIS */}
                  <div className={cn(
                    "p-4 border rounded-2xl flex items-start justify-between gap-3 transition-all",
                    autoSpeak 
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold" 
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}>
                    <div className="space-y-1">
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                        Voice Interrogator
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-normal">
                        Automatically read questions out loud using browser speech synthesis.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSpeak}
                      onChange={(e) => setAutoSpeak(e.target.checked)}
                      className="mt-1 cursor-pointer w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {!hasResume && (
                  <p className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-500" />
                    No resume text found in active profile. Analyze your resume in the ATS tab to unlock Resume-Tailored Questions.
                  </p>
                )}
              </div>

              <button
                onClick={startInterview}
                disabled={isGeneratingQuestions}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-xl shadow-slate-900/10 cursor-pointer"
              >
                {isGeneratingQuestions ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating Custom Interview...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    Start Mock Interview Round
                  </>
                )}
              </button>
            </div>

            {/* BADGES & HISTORY COLUMN */}
            <div className="space-y-8">
              {/* GAMIFIED BADGES */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <Award className="w-4.5 h-4.5 text-amber-500" />
                  Hiring Badge Vault
                </h3>
                <div className="space-y-3">
                  {badges.map(b => (
                    <div 
                      key={b.id} 
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center gap-3.5",
                        b.unlocked 
                          ? "bg-slate-50 border-slate-200" 
                          : "bg-slate-50/40 border-slate-100 opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
                        b.unlocked ? `bg-gradient-to-br ${b.color}` : "bg-slate-300"
                      )}>
                        {b.unlocked ? b.icon : <Lock className="w-4.5 h-4.5 text-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                          {b.title}
                          {b.unlocked && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT INTERVIEW SESSIONS HISTORY */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-indigo-500" />
                  Past Sessions Log
                </h3>

                {history.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                    No interviews completed yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {history.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                        className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="text-xs font-black text-slate-800 tracking-tight">{item.role}</div>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3" />
                              {item.company} • {item.type}
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-sm",
                            item.overallScore >= 80 ? "bg-emerald-500" : item.overallScore >= 65 ? "bg-indigo-500" : "bg-rose-500"
                          )}>
                            {item.overallScore}%
                          </span>
                        </div>

                        {/* Expanded details */}
                        {expandedHistoryId === item.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="pt-2 border-t border-slate-200/50 space-y-2 text-[10px]"
                          >
                            <div>
                              <span className="font-black text-slate-700 block">Strengths:</span>
                              <span className="text-emerald-600 font-bold">{item.strengths.join(", ")}</span>
                            </div>
                            <div>
                              <span className="font-black text-slate-700 block">Weaknesses:</span>
                              <span className="text-rose-500 font-bold">{item.weaknesses.join(", ")}</span>
                            </div>
                            <div className="pt-1">
                              <span className="font-black text-slate-400 uppercase tracking-widest block text-[8px] mb-1">Questions Log:</span>
                              {item.sessions.map((sess, idx) => (
                                <div key={idx} className="p-2 bg-white rounded-xl border border-slate-100 mb-1">
                                  <p className="font-black text-slate-700 leading-normal">{sess.question}</p>
                                  <p className="text-slate-500 mt-1 italic">&quot;{sess.userAnswer.slice(0, 80)}...&quot;</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE SIMULATION INTERACTION SCREEN */}
        {appState === "simulation" && questions.length > 0 && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Styles for speech wave animation */}
            <style>{`
              @keyframes speech-wave {
                0% { height: 15%; }
                100% { height: 85%; }
              }
            `}</style>

            {/* QUESTION PANEL */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col justify-between min-h-[500px]">
              
              <div className="space-y-6">
                {/* PROGRESS INFO & TIMER */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 font-black text-xs rounded-xl tracking-tight">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    
                    {/* TTS READ BUTTON */}
                    <button
                      onClick={() => speakQuestion(questions[currentQuestionIndex].question)}
                      className={cn(
                        "px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-bold border cursor-pointer",
                        isSpeaking
                          ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                      title={isSpeaking ? "Stop speaking" : "Speak question out loud"}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Speak Question</span>
                        </>
                      )}
                    </button>
                  </div>

                  {timerLimit > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className={cn("w-5 h-5", timeLeft <= 10 ? "text-rose-500 animate-bounce" : "text-slate-400")} />
                      <span className={cn(
                        "font-black text-sm",
                        timeLeft <= 10 ? "text-rose-500 font-black text-lg" : "text-slate-700"
                      )}>
                        {timeLeft}s remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* QUESTION WORDING */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {questions[currentQuestionIndex].question}
                  </h3>
                </div>

                {/* PRACTICE HELP BUTTONS */}
                {selectedMode === "Practice" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 rounded-xl transition-all"
                    >
                      {showHint ? "Hide Hint" : "Reveal Hint"}
                    </button>
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all"
                    >
                      {showExplanation ? "Hide Focus Concept" : "Recruiter Focus"}
                    </button>
                  </div>
                )}

                {/* HINT & EXPLANATION ALERTS */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-800 flex gap-2"
                    >
                      <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                      <div>
                        <span className="font-black text-indigo-600 block mb-0.5">Quick Hint:</span>
                        {questions[currentQuestionIndex].hint}
                      </div>
                    </motion.div>
                  )}

                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex gap-2"
                    >
                      <HelpCircle className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                      <div>
                        <span className="font-black text-slate-600 block mb-0.5">What Interviewers Look For:</span>
                        {questions[currentQuestionIndex].explanation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* TEXT AREA ANSWER FIELD WITH SPEECH TRANSCRIPTION TOGGLE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Interview Response</label>
                    <div className="flex items-center gap-2">
                      {speechError && (
                        <span className="text-[9px] font-bold text-rose-500 animate-pulse">{speechError}</span>
                      )}
                      <button
                        type="button"
                        onClick={toggleSpeechRecognition}
                        className={cn(
                          "px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border cursor-pointer",
                          isListening
                            ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                            : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
                        )}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Stop Dictation</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>Dictate Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={activeAnswerText}
                    onChange={(e) => setActiveAnswerText(e.target.value)}
                    placeholder={isListening ? "Listening... Speak clearly. Your voice is being transcribed in real-time." : "Type your structured answer here... (Tip: For behavioral rounds, structure using Situation -> Task -> Action -> Result)"}
                    className="w-full p-4 min-h-[160px] bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to quit this interview session? History will not be saved.")) {
                      stopCamera();
                      stopSpeaking();
                      stopListening();
                      setAppState("setup");
                    }
                  }}
                  className="px-5 py-3 text-xs font-black text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  Quit Round
                </button>

                <button
                  onClick={() => handleNextQuestion(false)}
                  disabled={!activeAnswerText.trim() || sessions[currentQuestionIndex].isEvaluating}
                  className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:bg-slate-900 transition-all cursor-pointer"
                >
                  {sessions[currentQuestionIndex].isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Evaluating Answer...
                    </>
                  ) : currentQuestionIndex === questions.length - 1 ? (
                    <>
                      Submit Interview & Finish
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      Submit & Next Question
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* WEBCAM & VOICE MOCKUP COLUMN */}
            <div className="space-y-6">
              
              {/* WEBCAM SCREEN */}
              <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", isCameraOn ? "bg-rose-500" : "bg-slate-500")}></span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {isCameraOn ? "Webcam Live" : "Webcam Off"}
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    className="bg-black/60 hover:bg-slate-800 px-2 py-1 rounded text-[8px] font-black text-slate-300 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    {isCameraOn ? "Turn Off" : "Turn On"}
                  </button>
                </div>

                <div className="h-48 flex items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                  {isCameraOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-10 h-10 text-slate-700" />
                      {cameraError ? (
                        <p className="text-[9px] font-bold text-rose-500 text-center max-w-[180px] leading-tight">{cameraError}</p>
                      ) : (
                        <button
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Enable Webcam
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Target scanner outline overlays (only if camera is active) */}
                  {isCameraOn && (
                    <>
                      <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-indigo-400/85"></div>
                      <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-indigo-400/85"></div>
                      <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-indigo-400/85"></div>
                      <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-indigo-400/85"></div>
                      <div className="absolute inset-x-12 top-10 bottom-10 border border-dashed border-indigo-500/20 rounded-full pointer-events-none"></div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Face positioning check</span>
                  <span className={cn("font-black", isCameraOn ? "text-emerald-500" : "text-slate-500")}>
                    {isCameraOn ? "CENTERED" : "OFFLINE"}
                  </span>
                </div>
              </div>

              {/* VOICE AUDIO WAVEFORM */}
              <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {isListening ? "Audio Input Active" : "Audio Input Idle"}
                  </span>
                </div>

                {/* Simulated CSS wave line animation */}
                <div className="h-20 flex items-center justify-center gap-1.5 mt-8 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 relative">
                  {[12, 28, 45, 18, 52, 60, 32, 10, 24, 48, 56, 38, 20, 44, 28, 12].map((ht, idx) => (
                    <div
                      key={idx}
                      style={{ 
                        height: isListening ? "40%" : `${ht}%`,
                        animation: isListening ? `speech-wave 0.8s ease-in-out infinite alternate` : undefined,
                        animationDelay: isListening ? `${idx * 0.05}s` : undefined
                      }}
                      className={cn(
                        "w-1 rounded bg-indigo-500 shadow-sm transition-all duration-300",
                        isListening ? "bg-rose-500 animate-pulse" : activeAnswerText ? "opacity-60" : "opacity-30"
                      )}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Speech energy level</span>
                  <span className={cn("font-black", isListening ? "text-rose-500 animate-pulse" : "text-indigo-400")}>
                    {isListening ? "RECORDING" : "STABLE"}
                  </span>
                </div>
              </div>

              {/* PREMIUM FEATURE PLATFORM PREVIEW */}
              <div className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl border border-indigo-800 shadow-lg space-y-3">
                <h4 className="text-xs font-black text-indigo-200 tracking-wider uppercase">Premium Avatar Core</h4>
                <p className="text-[10px] text-indigo-300 leading-normal">
                  Our core engine is pre-built to support custom AI avatars, webcam facial expression parsing, and voice speech-to-text integration in subsequent updates.
                </p>
                <div className="pt-1 flex gap-2">
                  <span className="px-2 py-0.5 bg-indigo-800/50 text-[8px] font-black text-indigo-300 rounded border border-indigo-700/60 uppercase">Avatar Ready</span>
                  <span className="px-2 py-0.5 bg-indigo-800/50 text-[8px] font-black text-indigo-300 rounded border border-indigo-700/60 uppercase">Speech API</span>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* FEEDBACK & PERFORMANCE METRICS DASHBOARD SCREEN */}
        {appState === "feedback" && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {isSubmittingInterview ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-6">
                <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800">Aggregating Evaluation Results</h3>
                  <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
                    Gemini is processing your response metrics, STAR framework parameters, and compiling custom improvement roadmaps.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* OVERALL PERFORMANCE CARD */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  
                  {/* circular overall score */}
                  <div className="flex flex-col items-center justify-center text-center p-6 border-r border-slate-100">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* circular track */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="64" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="64" 
                          stroke={finalScore >= 80 ? "#10b981" : finalScore >= 65 ? "#4f46e5" : "#f43f5e"} 
                          strokeWidth="12" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 64}
                          strokeDashoffset={2 * Math.PI * 64 * (1 - finalScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-4xl font-black text-slate-800">{finalScore}%</span>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mt-1">Average Score</span>
                      </div>
                    </div>
                    <div className="mt-4 px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">
                      {finalScore >= 80 ? "Offer Grade Performance" : finalScore >= 65 ? "Borderline Ready" : "Requires Practice"}
                    </div>
                  </div>

                  {/* score sliders/criteria */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Competency Breakdown</h3>
                    
                    <div className="space-y-3">
                      {[
                        { label: "Technical Accuracy", score: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.technicalAccuracy || 7), 0) / (sessions.length || 1) * 10) },
                        { label: "Communication Skills", score: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.communication || 7), 0) / (sessions.length || 1) * 10) },
                        { label: "Answer Clarity", score: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.clarity || 7), 0) / (sessions.length || 1) * 10) },
                        { label: "Completeness", score: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.completeness || 7), 0) / (sessions.length || 1) * 10) },
                        { label: "Confidence Indicators", score: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.confidence || 7), 0) / (sessions.length || 1) * 10) }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${item.score}%` }} 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                item.score >= 80 ? "bg-emerald-500" : item.score >= 65 ? "bg-indigo-500" : "bg-rose-500"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* STRENGTHS, SPEECH ANALYSIS, RECOMMENDATIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* gaps detector */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                      Skills Gap Detector
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block">Proven Strengths</span>
                        <div className="space-y-1">
                          {strengths.map((str, i) => (
                            <div key={i} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {str}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest block">Attention Areas</span>
                        <div className="space-y-1">
                          {weaknesses.map((weak, i) => (
                            <div key={i} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              {weak}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SPEECH AND COMMUNICATION AUDIT */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <Mic className="w-4.5 h-4.5 text-indigo-600" />
                      Communication & Filler Analysis
                    </h4>
                    
                    <div className="space-y-3">
                      <div className={cn(
                        "p-4 border rounded-2xl space-y-1.5",
                        totalFillerCount >= 10 
                          ? "bg-rose-50/50 border-rose-100 text-rose-800" 
                          : totalFillerCount >= 5 
                            ? "bg-amber-50/50 border-amber-100 text-amber-800" 
                            : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                      )}>
                        <span className="text-[9px] font-black uppercase tracking-widest block">Articulation Grade</span>
                        <div className="text-xs font-black">
                          {totalFillerCount >= 10 
                            ? "High Filler Count (Needs Work)" 
                            : totalFillerCount >= 5 
                              ? "Moderate Fillers (Good Delivery)" 
                              : "Highly Articulate (Recruiter Grade)"}
                        </div>
                        <p className="text-[9px] font-medium opacity-90 leading-snug">
                          {totalFillerCount >= 10 
                            ? "You are pausing with filler words. Try to pause silently for a more composed impression." 
                            : totalFillerCount >= 5 
                              ? "A few filler words detected. Practice structured templates to reduce them." 
                              : "Excellent speed and pause management. Your verbal framing matches high recruiter standards."}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Filler Metrics</span>
                          <span className="text-slate-800 font-bold">{totalFillerCount} total</span>
                        </div>
                        {totalFillerCount === 0 ? (
                          <p className="text-[10px] font-bold text-slate-500 italic">No filler words detected in speech answers!</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(fillerDetails).map(([word, count]) => (
                              <span key={word} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg">
                                &quot;{word}&quot;: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* learning suggestions */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <BookOpen className="w-4.5 h-4.5 text-emerald-500" />
                      Recommended Learning Resources
                    </h4>
                    <div className="space-y-2.5">
                      {getResourceRecommendations(weaknesses).map((res, i) => (
                        <a
                          key={i}
                          href={res.link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 rounded-2xl flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[8px] font-black uppercase rounded">
                              {res.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                              {res.title}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DETAILED QUESTION RESPONSE SHEETS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Question-by-Question Response Audit</h3>
                  
                  {sessions.map((sess, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                      <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question {idx + 1}</span>
                          <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug">{sess.question.question}</h4>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-sm shrink-0",
                          (sess.evaluation?.scores?.overall || 70) >= 80 
                            ? "bg-emerald-500" 
                            : (sess.evaluation?.scores?.overall || 70) >= 65 ? "bg-indigo-500" : "bg-rose-500"
                        )}>
                          Score: {sess.evaluation?.scores?.overall || 70}%
                        </span>
                      </div>

                      {/* USER ANSWER BOX */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Your Answer:</span>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed italic">
                          &quot;{sess.userAnswer || "No answer provided."}&quot;
                        </div>
                      </div>

                      {/* STAR METHOD CHECKER */}
                      {selectedType === "Behavioral" && sess.evaluation?.starAnalysis && (
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">STAR framework check</span>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: "Situation", checked: sess.evaluation.starAnalysis.hasSituation, feedback: sess.evaluation.starAnalysis.situationFeedback },
                              { label: "Task", checked: sess.evaluation.starAnalysis.hasTask, feedback: sess.evaluation.starAnalysis.taskFeedback },
                              { label: "Action", checked: sess.evaluation.starAnalysis.hasAction, feedback: sess.evaluation.starAnalysis.actionFeedback },
                              { label: "Result", checked: sess.evaluation.starAnalysis.hasResult, feedback: sess.evaluation.starAnalysis.resultFeedback }
                            ].map((st, i) => (
                              <div key={i} className="space-y-1.5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                  <div className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                    st.checked ? "bg-emerald-500" : "bg-slate-200"
                                  )}>
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-xs font-black text-slate-800">{st.label}</span>
                                </div>
                                <p className="text-[9px] font-medium text-slate-400 leading-snug">{st.feedback}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FEEDBACK BREAKDOWN */}
                      {sess.evaluation && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">What went well:</span>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.whatWentWell}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">What was missing:</span>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed text-rose-600 font-bold">{sess.evaluation.whatWasMissing}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Perspective:</span>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.recruiterPerspective}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ideal Answer Structure:</span>
                              <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.idealStructure}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODEL ANSWER */}
                      {sess.evaluation && (
                        <div className="p-5 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-inner space-y-2">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            Model Recruiter-Grade Answer
                          </span>
                          <p className="text-xs font-medium leading-relaxed text-slate-300 italic">
                            &quot;{sess.evaluation.idealAnswer}&quot;
                          </p>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* END STATE ACTION BUTTON */}
                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => {
                      stopCamera();
                      stopSpeaking();
                      stopListening();
                      setAppState("setup");
                    }}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs rounded-2xl shadow-xl shadow-slate-900/10 transition-all cursor-pointer"
                  >
                    Return to Setup Dashboard
                  </button>
                </div>
              </>
            )}

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
