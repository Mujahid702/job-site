"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getScopedKey } from "@/lib/security/LocalStorage";
import { User } from "@supabase/supabase-js";
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
  VolumeX,
  Target,
  ChevronDown,
  ChevronUp,
  Pause
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
    problemSolving: number;
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
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  evaluation?: EvaluationResult;
  isEvaluating: boolean;
  finalWeightedScore?: number;
}

interface HistoryItem {
  id: string;
  company: string;
  role: string;
  type: string;
  date: string;
  overallScore: number;
  questionsCount: number;
  difficultyReached: string;
  durationSeconds: number;
  sessions: {
    question: string;
    userAnswer: string;
    difficulty: string;
    scores: {
      technicalAccuracy: number;
      communication: number;
      clarity: number;
      completeness: number;
      confidence: number;
      problemSolving: number;
      overall: number;
    };
    weightedScore: number;
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

const COMPANY_ROUNDS: Record<string, string[]> = {
  "TCS": ["Aptitude", "Technical", "HR Round"],
  "Deloitte": ["Case Based", "Technical", "HR Round"],
  "IBM": ["Technical", "Behavioral", "HR Round"],
  "Infosys": ["Technical", "HR Round"],
  "Accenture": ["Case Based", "Technical", "HR Round"],
  "Wipro": ["Technical", "HR Round"],
  "Cognizant": ["Technical", "HR Round"],
  "Capgemini": ["Technical", "HR Round"],
  "HCLTech": ["Technical", "HR Round"],
  "Other": ["Technical", "HR Round"]
};

const ROUND_TYPES = [
  "Technical", "HR Round", "Behavioral", "Managerial", "System Design"
];

const BADGE_TEMPLATES = [
  { id: "rookie", title: "Interview Rookie", description: "Complete your first AI mock interview", color: "from-blue-500 to-indigo-500", icon: <UserCheck className="w-5 h-5 text-white" /> },
  { id: "beginner_badge", title: "Beginner Master", description: "Answer 20 Beginner level questions", color: "from-sky-400 to-cyan-500", icon: <Award className="w-5 h-5 text-white" /> },
  { id: "intermediate_badge", title: "Intermediate Specialist", description: "Score 80%+ across 10 Intermediate questions", color: "from-emerald-500 to-teal-500", icon: <Award className="w-5 h-5 text-white" /> },
  { id: "advanced_badge", title: "Advanced Strategist", description: "Score 85%+ across 10 Advanced questions", color: "from-indigo-500 to-purple-500", icon: <Award className="w-5 h-5 text-white" /> },
  { id: "expert_badge", title: "Expert Consultant", description: "Score 90%+ across 10 Expert questions", color: "from-amber-500 to-orange-500", icon: <Sparkles className="w-5 h-5 text-white" /> },
  { id: "role_specialist", title: "Role Guru", description: "Answer 50 questions for a specific role", color: "from-rose-500 to-red-500", icon: <CheckCircle2 className="w-5 h-5 text-white" /> },
  { id: "company_specialist", title: "Corporate Insider", description: "Answer 30 questions for a specific company", color: "from-violet-500 to-pink-500", icon: <Smile className="w-5 h-5 text-white" /> }
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

const TIER_LIMITS = {
  FREE: {
    dailyMinutes: 10,
    voiceLimits: 1,
    advancedRounds: 1,
    resumeTailoring: false,
    maxDuration: 600
  },
  PRO: {
    dailyMinutes: 30,
    voiceLimits: 5,
    advancedRounds: 5,
    resumeTailoring: true,
    maxDuration: 1800
  },
  PREMIUM: {
    dailyMinutes: 1440,
    voiceLimits: 9999,
    advancedRounds: 9999,
    resumeTailoring: true,
    maxDuration: 1800
  }
};

export default function AiInterviewPrep() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // App States: 'setup', 'simulation', 'feedback'
  const [appState, setAppState] = useState<"setup" | "simulation" | "feedback">("setup");

  // Subscription & Settings Upgrades
  const [subscriptionTier, setSubscriptionTier] = useState<"FREE" | "PRO" | "PREMIUM">("FREE");
  const [selectedDuration, setSelectedDuration] = useState<number>(300); // 300 seconds (5 min) default
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [showTimesUp, setShowTimesUp] = useState<boolean>(false);

  // Voice playback options
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Setup Parameters
  const [selectedFocus, setSelectedFocus] = useState<"company" | "role">("role");
  const [selectedCompany, setSelectedCompany] = useState<string>("TCS");
  const [selectedRole, setSelectedRole] = useState<string>("Software Engineer");
  const [selectedType, setSelectedType] = useState<string>("Technical");
  
  // Active Simulation State
  const [currentDifficulty, setCurrentDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Beginner");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [activeAnswerText, setActiveAnswerText] = useState<string>("");
  
  // Indefinite sessions log
  const [sessions, setSessions] = useState<QuestionSession[]>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<boolean>(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Timer states
  const [sessionTime, setSessionTime] = useState<number>(0);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // History & Badges
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [priScore, setPriScore] = useState<number>(60);

  // Final evaluation stats
  const [finalScore, setFinalScore] = useState<number>(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

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
    setIsSpeechPaused(false);
    if (isMuted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes("en-US") || voice.lang.includes("en-GB"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.rate = speechSpeed;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    }
  };

  const togglePauseSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeechPaused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      rec.onresult = (event: any) => {
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
      rec.onerror = (event: any) => {
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

  // Load from localStorage on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uId = user?.id || null;

      // Check if resume exists
      const savedResumeText = localStorage.getItem(getScopedKey("last_analyzed_resume_text", uId));
      if (savedResumeText && savedResumeText.trim()) {
        setHasResume(true);
      } else {
        setHasResume(false);
      }

      // Check current PRI score
      const storedPri = localStorage.getItem(getScopedKey("placement_readiness_score", uId));
      if (storedPri) {
        setPriScore(parseInt(storedPri, 10));
      } else {
        setPriScore(0);
      }

      // Load History
      const savedHistory = localStorage.getItem(getScopedKey("interview_history", uId));
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }

      // Load Subscription Tier & Duration
      const savedTier = localStorage.getItem(getScopedKey("interview_subscription_tier", uId)) as "FREE" | "PRO" | "PREMIUM" | null;
      if (savedTier) {
        setSubscriptionTier(savedTier);
      } else {
        const isPremiumUser = localStorage.getItem(getScopedKey("member_is_premium", uId)) === "true";
        setSubscriptionTier(isPremiumUser ? "PRO" : "FREE");
      }

      const savedDurationSecs = localStorage.getItem(getScopedKey("interview_selected_duration", uId));
      if (savedDurationSecs) {
        setSelectedDuration(parseInt(savedDurationSecs, 10));
      } else {
        setSelectedDuration(300);
      }

      const unlockedIds = JSON.parse(localStorage.getItem(getScopedKey("interview_badges", uId)) || "[]");
      setBadges(BADGE_TEMPLATES.map(b => ({
        ...b,
        unlocked: unlockedIds.includes(b.id)
      })));
    }
  }, [user]);

  // Sync available round when company changes
  useEffect(() => {
    if (selectedFocus === "company") {
      const rounds = COMPANY_ROUNDS[selectedCompany] || ["Technical", "HR Round"];
      setSelectedType(rounds[0]);
    }
  }, [selectedCompany, selectedFocus]);

  // Load Badges based on updated history lists
  useEffect(() => {
    const unlockedIds = JSON.parse(localStorage.getItem(getScopedKey("interview_badges", user?.id || null)) || "[]");
    setBadges(BADGE_TEMPLATES.map(b => ({
      ...b,
      unlocked: unlockedIds.includes(b.id)
    })));
  }, [history, user]);

  // Timer Tick
  useEffect(() => {
    if (appState === "simulation") {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [appState]);

  // Speaking question automation
  useEffect(() => {
    if (appState === "simulation" && currentQuestion && autoSpeak) {
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion.question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, appState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate Adaptive Question
  const getNextAdaptiveQuestion = async (diffOverride?: "Beginner" | "Intermediate" | "Advanced" | "Expert") => {
    setIsGeneratingQuestion(true);
    setApiError(null);
    try {
      const activeDiff = diffOverride || currentDifficulty;
      const resumeText = resumeTailored ? localStorage.getItem(getScopedKey("last_analyzed_resume_text", user?.id || null)) : undefined;
      const excludeList = sessions.map(s => s.question.question);

      // Get last session details for advanced/expert conversational follow-ups
      const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
      const previousQuestion = lastSession ? lastSession.question.question : undefined;
      const previousAnswer = lastSession ? lastSession.userAnswer : undefined;

      const res = await fetch("/api/resume/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "generate",
          company: selectedFocus === "company" ? selectedCompany : undefined,
          role: selectedFocus === "role" ? selectedRole : undefined,
          type: selectedType,
          difficulty: activeDiff,
          resumeText: resumeText || undefined,
          excludeQuestions: excludeList,
          previousQuestion,
          previousAnswer
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI Services Temporarily Unavailable");
      }

      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setShowHint(false);
        setShowExplanation(false);
        setActiveAnswerText("");
      } else {
        throw new Error("AI Services Temporarily Unavailable");
      }
    } catch (err: any) {
      setApiError(err.message || "AI Services Temporarily Unavailable");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const startInterview = async () => {
    // 1. Entitlement checker
    const limits = TIER_LIMITS[subscriptionTier];
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sessionsToday = history.filter(h => h.date === todayStr);
    const minutesToday = sessionsToday.reduce((acc, h) => acc + (h.durationSeconds || 0), 0) / 60;

    if (minutesToday >= limits.dailyMinutes) {
      alert(`Daily practice limit reached. You have completed ${Math.round(minutesToday)} minutes of mock interviews today on the ${subscriptionTier} tier. Upgrade your simulated plan to continue practicing.`);
      return;
    }

    if (currentDifficulty === "Advanced" || currentDifficulty === "Expert") {
      const advancedSessionsToday = sessionsToday.filter(h => h.difficultyReached === "Advanced" || h.difficultyReached === "Expert");
      if (advancedSessionsToday.length >= limits.advancedRounds) {
        alert(`Daily Advanced rounds limit reached (${limits.advancedRounds}) on the ${subscriptionTier} tier. Upgrade your simulated plan to unlock more advanced scenarios.`);
        return;
      }
    }

    if (autoSpeak) {
      if (sessionsToday.length >= limits.voiceLimits) {
        alert(`Voice Interrogator limit reached (${limits.voiceLimits} daily rounds) on the ${subscriptionTier} tier. Upgrade your simulated plan to unlock more voice trials.`);
        return;
      }
    }

    if (resumeTailored && !limits.resumeTailoring) {
      alert(`Resume-based personalization is not available on the ${subscriptionTier} tier. Upgrade your simulated plan to enable this feature.`);
      return;
    }

    // 2. Clear states and start
    setAppState("simulation");
    setSessions([]);
    setSessionTime(0);
    setTimeLeft(selectedDuration);
    setShowTimesUp(false);
    setCurrentDifficulty("Beginner");
    setTimeout(() => {
      startCamera();
      getNextAdaptiveQuestion("Beginner");
    }, 300);
  };

  // Category weighted calculations per difficulty level
  const calcQuestionScore = (scores: EvaluationResult["scores"], diff: string) => {
    if (!scores) return 0;
    const { technicalAccuracy = 7, communication = 7, confidence = 7, problemSolving = 7 } = scores;
    
    let weighted = 0;
    if (diff === "Beginner") {
      weighted = (technicalAccuracy * 10 * 0.4) + (communication * 10 * 0.3) + (confidence * 10 * 0.3);
    } else if (diff === "Intermediate") {
      weighted = (technicalAccuracy * 10 * 0.5) + (communication * 10 * 0.25) + (problemSolving * 10 * 0.25);
    } else if (diff === "Advanced") {
      weighted = (technicalAccuracy * 10 * 0.5) + (problemSolving * 10 * 0.3) + (communication * 10 * 0.2);
    } else {
      weighted = (technicalAccuracy * 10 * 0.4) + (problemSolving * 10 * 0.4) + (communication * 10 * 0.2);
    }
    return Math.round(weighted);
  };

  const getScoreBand = (score: number) => {
    if (score >= 90) return "Correct";
    if (score >= 80) return "Strong Partial";
    if (score >= 60) return "Partial";
    if (score >= 40) return "Weak Attempt";
    return "No Answer";
  };

  // Submit single question answer
  const submitAnswer = async () => {
    if (!currentQuestion) return;
    stopListening();
    stopSpeaking();
    setIsSubmittingAnswer(true);
    setApiError(null);

    const activeSession: QuestionSession = {
      question: currentQuestion,
      userAnswer: activeAnswerText,
      difficulty: currentDifficulty,
      isEvaluating: true
    };

    setSessions(prev => [...prev, activeSession]);

    try {
      const res = await fetch("/api/resume/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "evaluate",
          question: currentQuestion.question,
          userAnswer: activeAnswerText || "No answer provided.",
          interviewType: selectedType,
          targetRole: selectedFocus === "role" ? selectedRole : undefined,
          company: selectedFocus === "company" ? selectedCompany : undefined
        })
      });

      const evalData = await res.json();
      if (!res.ok) {
        throw new Error(evalData.error || "AI Services Temporarily Unavailable");
      }

      const weightedScore = calcQuestionScore(evalData.scores, currentDifficulty);

      setSessions(prev => prev.map((s, idx) => 
        idx === prev.length - 1 
          ? { ...s, evaluation: evalData, isEvaluating: false, finalWeightedScore: weightedScore }
          : s
      ));
    } catch (err: any) {
      setApiError(err.message || "AI Services Temporarily Unavailable");
      setSessions(prev => prev.filter((_, idx) => idx !== prev.length - 1));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const saveSessionToDb = async (
    evaluatedSessions: QuestionSession[], 
    finalScoreVal: number, 
    elapsedSecs: number,
    finalStrengths: string[],
    finalWeaknesses: string[]
  ) => {
    if (!user) return;

    try {
      // 1. Insert session log
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          company: selectedFocus === "company" ? selectedCompany : "General",
          role: selectedFocus === "role" ? selectedRole : "Software Engineer",
          difficulty: currentDifficulty,
          round_type: selectedType,
          duration_seconds: elapsedSecs,
          overall_score: finalScoreVal,
          ended_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("Failed to save session record:", sessionError);
        return;
      }

      const sessionId = sessionData.id;

      // 2. Insert answers
      const answersPayload = evaluatedSessions.map(s => ({
        session_id: sessionId,
        question_text: s.question.question,
        user_answer: s.userAnswer || "No answer provided.",
        difficulty: s.difficulty,
        scores: s.evaluation?.scores || {
          technicalAccuracy: 7,
          communication: 7,
          clarity: 7,
          completeness: 7,
          confidence: 7,
          problemSolving: 7,
          overall: 70
        },
        feedback: {
          strengths: finalStrengths,
          weaknesses: finalWeaknesses,
          modelAnswer: s.evaluation?.idealAnswer || s.question.explanation
        }
      }));

      const { error: answersError } = await supabase
        .from("interview_answers")
        .insert(answersPayload);

      if (answersError) {
        console.error("Failed to save answers feedback records:", answersError);
      }
    } catch (err) {
      console.error("Error in saveSessionToDb:", err);
    }
  };

  // Finish current interview round
  const endInterview = async () => {
    stopCamera();
    stopSpeaking();
    stopListening();

    const evaluatedSessions = sessions.filter(s => s.evaluation);
    if (evaluatedSessions.length === 0) {
      setAppState("setup");
      return;
    }

    setAppState("feedback");

    //articulation filler word audits
    let totalFillers = 0;
    const aggregatedFillerDetails: Record<string, number> = {};
    evaluatedSessions.forEach(s => {
      const result = countFillerWords(s.userAnswer);
      totalFillers += result.total;
      Object.entries(result.details).forEach(([word, count]) => {
        aggregatedFillerDetails[word] = (aggregatedFillerDetails[word] || 0) + count;
      });
    });
    setTotalFillerCount(totalFillers);
    setFillerDetails(aggregatedFillerDetails);

    // Compute metrics
    const overallSessionScore = Math.round(
      evaluatedSessions.reduce((acc, s) => acc + (s.finalWeightedScore || 70), 0) / evaluatedSessions.length
    );
    setFinalScore(overallSessionScore);

    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];

    evaluatedSessions.forEach(s => {
      if (s.evaluation?.scores) {
        const sc = s.evaluation.scores;
        if (sc.technicalAccuracy >= 8) allStrengths.push("Technical Accuracy");
        if (sc.communication >= 8) allStrengths.push("Communication Quality");
        if (sc.confidence >= 8) allStrengths.push("Speech Confidence");
        if (sc.problemSolving >= 8) allStrengths.push("Problem Solving");

        if (sc.technicalAccuracy < 6) allWeaknesses.push("Technical Core");
        if (sc.communication < 6) allWeaknesses.push("Articulation Flow");
        if (sc.problemSolving < 6) allWeaknesses.push("Problem Solving Detail");
      }
    });

    const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 3);
    const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 3);
    if (uniqueStrengths.length === 0) uniqueStrengths.push("Direct Answering");
    if (uniqueWeaknesses.length === 0) uniqueWeaknesses.push("STAR Structure");
    setStrengths(uniqueStrengths);
    setWeaknesses(uniqueWeaknesses);

    const elapsedSeconds = sessionTime || (selectedDuration - timeLeft);

    // History tracking
    const historyItem: HistoryItem = {
      id: Date.now().toString(36),
      company: selectedFocus === "company" ? selectedCompany : "General",
      role: selectedFocus === "role" ? selectedRole : "Software Engineer",
      type: selectedType,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      overallScore: overallSessionScore,
      questionsCount: evaluatedSessions.length,
      difficultyReached: currentDifficulty,
      durationSeconds: elapsedSeconds,
      sessions: evaluatedSessions.map(s => ({
        question: s.question.question,
        userAnswer: s.userAnswer,
        difficulty: s.difficulty,
        scores: s.evaluation?.scores || { technicalAccuracy: 7, communication: 7, clarity: 7, completeness: 7, confidence: 7, problemSolving: 7, overall: 70 },
        weightedScore: s.finalWeightedScore || 70
      })),
      strengths: uniqueStrengths,
      weaknesses: uniqueWeaknesses
    };

    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    const uId = user?.id || null;
    localStorage.setItem(getScopedKey("interview_history", uId), JSON.stringify(updatedHistory));

    // Async save to database
    saveSessionToDb(evaluatedSessions, overallSessionScore, elapsedSeconds, uniqueStrengths, uniqueWeaknesses);

    // BADGE VAULT ENGINE CHECKS
    const unlockedBadges = JSON.parse(localStorage.getItem(getScopedKey("interview_badges", uId)) || "[]");
    let isBadgeUnlocked = false;

    // 1. Rookie Badge
    if (!unlockedBadges.includes("rookie")) {
      unlockedBadges.push("rookie");
      isBadgeUnlocked = true;
    }

    // Accumulate total questions in history
    let beginnerCount = 0;
    let intermediateCount = 0;
    let advancedCount = 0;
    let expertCount = 0;
    let roleCount = 0;
    let companyCount = 0;

    updatedHistory.forEach(item => {
      if (item.role === selectedRole) roleCount += item.questionsCount;
      if (item.company === selectedCompany) companyCount += item.questionsCount;

      item.sessions.forEach(sess => {
        if (sess.difficulty === "Beginner") beginnerCount++;
        if (sess.difficulty === "Intermediate" && sess.weightedScore >= 80) intermediateCount++;
        if (sess.difficulty === "Advanced" && sess.weightedScore >= 85) advancedCount++;
        if (sess.difficulty === "Expert" && sess.weightedScore >= 90) expertCount++;
      });
    });

    // 2. Beginner Badge (20 Beginner Questions)
    if (!unlockedBadges.includes("beginner_badge") && beginnerCount >= 20) {
      unlockedBadges.push("beginner_badge");
      isBadgeUnlocked = true;
    }
    // 3. Intermediate Badge (10 intermediate >= 80)
    if (!unlockedBadges.includes("intermediate_badge") && intermediateCount >= 10) {
      unlockedBadges.push("intermediate_badge");
      isBadgeUnlocked = true;
    }
    // 4. Advanced Badge (10 advanced >= 85)
    if (!unlockedBadges.includes("advanced_badge") && advancedCount >= 10) {
      unlockedBadges.push("advanced_badge");
      isBadgeUnlocked = true;
    }
    // 5. Expert Badge (10 expert >= 90)
    if (!unlockedBadges.includes("expert_badge") && expertCount >= 10) {
      unlockedBadges.push("expert_badge");
      isBadgeUnlocked = true;
    }
    // 6. Role Specialist Badge (50 Questions)
    if (!unlockedBadges.includes("role_specialist") && roleCount >= 50) {
      unlockedBadges.push("role_specialist");
      isBadgeUnlocked = true;
    }
    // 7. Company Specialist Badge (30 Questions)
    if (!unlockedBadges.includes("company_specialist") && companyCount >= 30) {
      unlockedBadges.push("company_specialist");
      isBadgeUnlocked = true;
    }

    if (isBadgeUnlocked) {
      localStorage.setItem(getScopedKey("interview_badges", user?.id || null), JSON.stringify(unlockedBadges));
    }

    // Refresh PRI Readiness Score
    const uid = user ? user.id : "guest-user";
    calculatePRIScore(uid).then(res => {
      setPriScore(res.pri_score);
    }).catch(console.error);

    triggerMissionProgress(uid, "interviews", 1).catch(console.error);

    if (user) {
      import("@/lib/db/missions").then(({ awardActivityXP }) => {
        awardActivityXP(user.id, "interview_completed").catch(console.error);
      }).catch(console.error);
    }
  };

  const getResourceRecommendations = (weakList: string[]) => {
    const list: { title: string; link: string; icon: string }[] = [];
    if (weakList.includes("Technical Core") || weakList.includes("Technical Accuracy")) {
      list.push({ title: "Cracking the Coding Interview - Core Topics", link: "https://leetcode.com", icon: "DSA" });
      list.push({ title: "Advanced Data Structures & Algorithms Playbook", link: "https://leetcode.com", icon: "DSA" });
    }
    if (weakList.includes("Problem Solving Detail") || weakList.includes("STAR Structure")) {
      list.push({ title: "Mastering the STAR Method for Behavioral Interviews", link: "https://leetcode.com", icon: "STAR" });
    }
    if (weakList.includes("Articulation Flow") || weakList.includes("Communication Quality")) {
      list.push({ title: "Public Speaking & Recruiter Clarity Guide", link: "https://leetcode.com", icon: "Comm" });
    }
    if (list.length === 0) {
      list.push({ title: "MNC Screening Placement Guidebook", link: "#", icon: "Prep" });
    }
    return list;
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem(getScopedKey("interview_history", user?.id || null), JSON.stringify(updated));
  };

  // Format MM:SS elapsed duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper for difficulty progress calculations
  const getDifficultyPercent = (diff: string) => {
    if (diff === "Beginner") return 25;
    if (diff === "Intermediate") return 50;
    if (diff === "Advanced") return 75;
    return 100;
  };

  // Current session calculations
  const getRunningSessionStats = () => {
    const evaluated = sessions.filter(s => s.evaluation);
    const count = evaluated.length;
    if (count === 0) return { avgScore: 0, bandCounts: { Correct: 0, Strong: 0, Partial: 0, Weak: 0, Missed: 0 } };
    
    const sum = evaluated.reduce((acc, s) => acc + (s.finalWeightedScore || 0), 0);
    const avgScore = Math.round(sum / count);

    const bands = { Correct: 0, Strong: 0, Partial: 0, Weak: 0, Missed: 0 };
    evaluated.forEach(s => {
      const band = getScoreBand(s.finalWeightedScore || 0);
      if (band === "Correct") bands.Correct++;
      else if (band === "Strong Partial") bands.Strong++;
      else if (band === "Partial") bands.Partial++;
      else if (band === "Weak Attempt") bands.Weak++;
      else bands.Missed++;
    });

    return { avgScore, bandCounts: bands };
  };

  const renderRadarChart = (scores: {
    technicalAccuracy: number;
    communication: number;
    clarity: number;
    completeness: number;
    confidence: number;
    problemSolving: number;
  }) => {
    const size = 180;
    const center = size / 2;
    const radius = 55;
    const totalAxes = 6;
    const angleStep = (2 * Math.PI) / totalAxes;

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPolygons = gridLevels.map(level => {
      const points = [];
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * level * Math.cos(angle);
        const y = center + radius * level * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return points.join(" ");
    });

    const scoreVals = [
      scores.technicalAccuracy || 7,
      scores.communication || 7,
      scores.clarity || 7,
      scores.completeness || 7,
      scores.confidence || 7,
      scores.problemSolving || 7
    ];

    const scorePoints = scoreVals.map((val, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * (val / 10) * Math.cos(angle);
      const y = center + radius * (val / 10) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");

    const axisLines = [];
    const labels = [];
    const labelNames = ["Accuracy", "Comm", "Clarity", "Complete", "Confidence", "Problem Solving"];

    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      axisLines.push({ x1: center, y1: center, x2: x, y2: y });

      const labelX = center + (radius + 20) * Math.cos(angle);
      const labelY = center + (radius + 10) * Math.sin(angle);
      let anchor: "middle" | "start" | "end" = "middle";
      if (Math.cos(angle) > 0.1) anchor = "start";
      else if (Math.cos(angle) < -0.1) anchor = "end";

      labels.push({ x: labelX, y: labelY, text: labelNames[i], anchor });
    }

    return (
      <div className="flex flex-col items-center justify-center p-2 bg-slate-50/50 border border-slate-150 rounded-2xl w-full max-w-[240px] mx-auto">
        <svg width={size} height={size + 15} className="overflow-visible select-none">
          {gridPolygons.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.75"
              strokeDasharray={idx < 4 ? "2,2" : undefined}
            />
          ))}

          {axisLines.map((line, idx) => (
            <line
              key={idx}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#cbd5e1"
              strokeWidth="0.75"
            />
          ))}

          <polygon
            points={scorePoints}
            fill="rgba(79, 70, 229, 0.15)"
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {scoreVals.map((val, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * (val / 10) * Math.cos(angle);
            const y = center + radius * (val / 10) * Math.sin(angle);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}

          {labels.map((label, idx) => (
            <text
              key={idx}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              alignmentBaseline="middle"
              className="text-[7.5px] font-black fill-slate-500 font-sans tracking-tight"
            >
              {label.text}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  const sessionStats = getRunningSessionStats();
  const latestEvaluated = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const isQuestionAnswered = latestEvaluated && !latestEvaluated.isEvaluating && latestEvaluated.evaluation !== undefined;

  return (
    <div className="space-y-12">
      
      {/* HEADER SECTION */}
      <div className="max-w-4xl space-y-4 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-indigo-100 animate-pulse text-indigo-650" />
          Adaptive Interview Learning Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          AI Mock Interview Prep
        </h1>
        <p className="text-slate-500 font-medium text-base max-w-2xl leading-relaxed">
          Practice with an adaptive mentor that scales question complexity at your request. Deeply tailored to your resume, round focus, and specific target company formats.
        </p>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2 text-left">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{apiError === "Gemini API Key is missing. Please configure it in your environment variables as GEMINI_API_KEY." ? "AI Services Temporarily Unavailable" : apiError}</span>
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
            className="space-y-8"
          >
            {/* STATS PERFORMANCE HUB */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Skill Rating */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Skill Rating</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800">
                    {history.length > 0
                      ? Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length)
                      : "--"}
                  </span>
                  {history.length > 0 && <span className="text-[10px] font-bold text-slate-400">/100</span>}
                </div>
                <span className="text-[9px] font-medium text-slate-455 block mt-1">Average score of past sessions</span>
              </div>

              {/* Mock Readiness */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mock Readiness</span>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 mt-2 rounded-lg text-[10px] font-black uppercase tracking-tight border w-max",
                  (history.length > 0 && Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length) >= 80)
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                    : (history.length > 0 && Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length) >= 65)
                      ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                      : "text-rose-600 bg-rose-50 border-rose-100"
                )}>
                  {history.length > 0
                    ? Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length) >= 80
                      ? "Placement Ready"
                      : Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length) >= 65
                        ? "Preparing"
                        : "Requires Practice"
                    : "No History"}
                </span>
                <span className="text-[9px] font-medium text-slate-455 block mt-1">Hiring pool standard status</span>
              </div>

              {/* Practice Streak */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Practice Streak</span>
                <div className="mt-2 flex items-center gap-1 text-slate-800 font-black text-2xl">
                  <span>🔥</span>
                  {(() => {
                    if (history.length === 0) return 0;
                    const dates = history.map(item => {
                      try {
                        const d = new Date(item.date);
                        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                      } catch {
                        return null;
                      }
                    }).filter((d): d is string => d !== null);
                    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                    if (uniqueDates.length === 0) return 0;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;
                    let streak = 0;
                    let currentRef = new Date();
                    if (uniqueDates[0] === yesterdayStr && uniqueDates[0] !== todayStr) {
                      currentRef = yesterday;
                    }
                    while (true) {
                      const checkStr = `${currentRef.getFullYear()}-${(currentRef.getMonth() + 1).toString().padStart(2, '0')}-${currentRef.getDate().toString().padStart(2, '0')}`;
                      if (uniqueDates.includes(checkStr)) {
                        streak++;
                        currentRef.setDate(currentRef.getDate() - 1);
                      } else {
                        break;
                      }
                    }
                    return streak;
                  })()} <span className="text-xs font-bold text-slate-400">Days</span>
                </div>
                <span className="text-[9px] font-medium text-slate-455 block mt-1">Consecutive active days</span>
              </div>

              {/* Monthly Progress */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monthly Progress</span>
                {(() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const count = history.filter(h => {
                    try {
                      const d = new Date(h.date);
                      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    } catch {
                      return false;
                    }
                  }).length;
                  return (
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{count} / 10</span>
                        <span>{Math.min(100, Math.round(count * 10))}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, count * 10)}%` }} />
                      </div>
                    </div>
                  );
                })()}
                <span className="text-[9px] font-medium text-slate-455 block mt-1">Target: 10 mock sessions</span>
              </div>

              {/* Subscription Tier */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simulated Tier</span>
                <div className="mt-2">
                  <select
                    value={subscriptionTier}
                    onChange={(e) => {
                      const nt = e.target.value as "FREE" | "PRO" | "PREMIUM";
                      setSubscriptionTier(nt);
                      const uId = user?.id || null;
                      localStorage.setItem(getScopedKey("interview_subscription_tier", uId), nt);
                      
                      const limits = TIER_LIMITS[nt];
                      if (selectedDuration > limits.maxDuration) {
                        setSelectedDuration(limits.maxDuration);
                        localStorage.setItem(getScopedKey("interview_selected_duration", uId), limits.maxDuration.toString());
                      }
                    }}
                    className="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-indigo-650 focus:outline-none"
                  >
                    <option value="FREE">FREE TIER</option>
                    <option value="PRO">PRO DEVELOPER</option>
                    <option value="PREMIUM">PREMIUM ELITE</option>
                  </select>
                </div>
                <span className="text-[9px] font-medium text-slate-455 block mt-1">Configure limits & checks</span>
              </div>
            </div>

            {/* TWO COLUMN GRID FOR SIMULATOR SETUPS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SETUP FORM */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md p-8 space-y-8 text-left">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
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
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-850"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-850"
                      >
                        {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* ROUND TYPE / hiring rounds list */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedFocus === "company" ? `${selectedCompany} Hiring Rounds Pattern` : "Interview Round Focus"}
                  </label>
                  {selectedFocus === "company" ? (
                    <div className="flex gap-2 flex-wrap">
                      {(COMPANY_ROUNDS[selectedCompany] || ["Technical", "HR Round"]).map((round, rIdx) => (
                        <button
                          key={round}
                          onClick={() => setSelectedType(round)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-xs font-black transition-all flex items-center gap-2",
                            selectedType === round
                              ? "bg-indigo-600 text-white border-indigo-650 shadow-sm"
                              : "bg-slate-55 shadow-sm text-slate-650 hover:bg-slate-100"
                          )}
                        >
                          <span className="text-[10px] opacity-75 font-black uppercase">Round {rIdx+1}:</span>
                          {round}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-850"
                    >
                      {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>

                {/* SESSION DURATION SELECTION */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Session Duration</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "5 min", secs: 300, minTier: "FREE" },
                      { label: "10 min", secs: 600, minTier: "FREE" },
                      { label: "20 min", secs: 1200, minTier: "PRO" },
                      { label: "30 min", secs: 1800, minTier: "PRO" }
                    ].map((dur) => {
                      const isLocked = TIER_LIMITS[subscriptionTier].maxDuration < dur.secs;
                      return (
                        <button
                          key={dur.secs}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              alert(`Duration of ${dur.label} is locked on the ${subscriptionTier} tier. Upgrade to PRO or PREMIUM to run longer simulated rounds.`);
                              return;
                            }
                            setSelectedDuration(dur.secs);
                            localStorage.setItem(getScopedKey("interview_selected_duration", user?.id || null), dur.secs.toString());
                          }}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-xs font-black transition-all flex items-center gap-2 cursor-pointer bg-white",
                            selectedDuration === dur.secs
                              ? "bg-indigo-600 border-indigo-655 text-white shadow-sm"
                              : isLocked
                                ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed opacity-60 animate-none"
                                : "bg-slate-55 border-slate-200 text-slate-650 hover:bg-slate-100"
                          )}
                        >
                          {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                          {dur.label}
                          {!isLocked && <span className="text-[8px] opacity-75">({dur.secs / 60}m)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ADVANCED SIMULATOR CUSTOMIZATIONS */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI Simulator Options</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RESUME TAILORING */}
                    <div className={cn(
                      "p-4 border rounded-2xl flex items-start justify-between gap-3 transition-all text-left",
                      resumeTailored 
                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold" 
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}>
                      <div className="space-y-1">
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-655" />
                          Tailor to My Resume
                          {!TIER_LIMITS[subscriptionTier].resumeTailoring && <Lock className="w-3 h-3 text-indigo-650" />}
                        </div>
                        <p className="text-[10px] font-medium text-slate-450 leading-normal">
                          AI will probe projects, achievements, and specific tech stack claims mentioned in your resume text.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!hasResume || !TIER_LIMITS[subscriptionTier].resumeTailoring}
                        checked={resumeTailored && TIER_LIMITS[subscriptionTier].resumeTailoring}
                        onChange={(e) => setResumeTailored(e.target.checked)}
                        className="mt-1 cursor-pointer w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* VOICE SYNTHESIS */}
                    <div className={cn(
                      "p-4 border rounded-2xl flex items-start justify-between gap-3 transition-all text-left",
                      autoSpeak 
                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold" 
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}>
                      <div className="space-y-1">
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-indigo-655" />
                          Voice Interrogator
                        </div>
                        <p className="text-[10px] font-medium text-slate-450 leading-normal">
                          Automatically read questions out loud using speech synthesis as they generate.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSpeak}
                        onChange={(e) => setAutoSpeak(e.target.checked)}
                        className="mt-1 cursor-pointer w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {!hasResume && (
                    <p className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                      <Info className="w-3 h-3 text-amber-500" />
                      No resume analysis found. Go to Resume OS to save a resume to tailor mock interviews.
                    </p>
                  )}
                  {hasResume && !TIER_LIMITS[subscriptionTier].resumeTailoring && (
                    <p className="text-[9px] font-bold text-indigo-605 flex items-center gap-1">
                      <Info className="w-3 h-3 text-indigo-500" />
                      Resume tailoring is locked for FREE users. Switch Tier to PRO or PREMIUM to enable.
                    </p>
                  )}
                </div>

                <button
                  onClick={startInterview}
                  disabled={isGeneratingQuestion}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-md cursor-pointer border-none"
                >
                  {isGeneratingQuestion ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Starting adaptive interview session...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white" />
                      Start Mock Interview Session
                    </>
                  )}
                </button>
              </div>

              {/* BADGES & HISTORY COLUMN */}
              <div className="space-y-8">
                {/* HISTORICAL TRENDS OVER TIME */}
                {history.length >= 2 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                      Performance Progress Log
                    </h3>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-455 uppercase tracking-widest font-black">
                        <span>Historical Session Sequence</span>
                        <span>Trajectorial Progress</span>
                      </div>

                      <div className="space-y-2">
                        {history.slice(0, 5).reverse().map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold">Interview #{idx + 1} ({item.company})</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.overallScore}%` }} />
                              </div>
                              <span className="font-black text-slate-800">{item.overallScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* GAMIFIED BADGES */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
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
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0",
                          b.unlocked ? `bg-gradient-to-br ${b.color}` : "bg-slate-300"
                        )}>
                          {b.unlocked ? b.icon : <Lock className="w-4.5 h-4.5 text-white" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                            {b.title}
                            {b.unlocked && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <p className="text-[10px] font-medium text-slate-450 leading-snug">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECENT INTERVIEW SESSIONS HISTORY */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5 text-indigo-650" />
                    Past Sessions Log
                  </h3>

                  {history.length === 0 ? (
                    <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      No interviews completed yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {history.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                          className="p-3 bg-slate-50 border border-slate-150 hover:border-slate-200 rounded-2xl cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">{item.date}</span>
                            <button 
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="p-1 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-slate-200 transition-all border-none bg-transparent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-xs font-black text-slate-800 tracking-tight">{item.role}</div>
                              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-400" />
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
                              <div className="flex justify-between text-[10px]">
                                <span>Questions Answered: <strong>{item.questionsCount}</strong></span>
                                <span>Difficulty: <strong>{item.difficultyReached}</strong></span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700 block">Strengths:</span>
                                <span className="text-emerald-600 font-bold">{item.strengths.join(", ")}</span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700 block">Weaknesses:</span>
                                <span className="text-rose-500 font-bold">{item.weaknesses.join(", ")}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE SIMULATION INTERACTION SCREEN */}
        {appState === "simulation" && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <style>{`
              @keyframes speech-wave {
                0% { height: 15%; }
                100% { height: 85%; }
              }
            `}</style>

            {/* QUESTION PANEL */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col justify-between min-h-[550px] text-left relative overflow-hidden">
              
              {/* TIME'S UP OVERLAY */}
              {showTimesUp && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-8 rounded-3xl">
                  <span className="text-4xl animate-bounce">⏱️</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">Time's Up!</h3>
                  <p className="text-slate-550 font-medium text-xs max-w-sm mt-2 leading-relaxed">
                    Your mock interview session duration has ended. We are generating your comprehensive evaluation report now...
                  </p>
                  <RefreshCw className="w-6 h-6 text-indigo-650 animate-spin mt-6" />
                </div>
              )}

              <div className="space-y-6">
                
                {/* DYNAMIC PROGRESSION DIFFICULTY BAR */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-450 uppercase tracking-widest">
                    <span>Adaptive Difficulty Progression</span>
                    <span className="text-indigo-650 font-black">Click step to scale question difficulty</span>
                  </div>
                  <div className="relative">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${getDifficultyPercent(currentDifficulty)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px] font-black">
                      {(["Beginner", "Intermediate", "Advanced", "Expert"] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => {
                            setCurrentDifficulty(diff);
                            if (isQuestionAnswered || !currentQuestion) {
                              getNextAdaptiveQuestion(diff);
                            }
                          }}
                          className={cn(
                            "py-1.5 rounded-lg border transition-all cursor-pointer",
                            currentDifficulty === diff
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-black shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RUNNING STATS BAR */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-150 text-xs">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Session Score</span>
                    <span className="font-black text-indigo-650 text-sm">{sessionStats.avgScore}%</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Questions Answered</span>
                    <span className="font-black text-slate-800 text-sm">{sessions.length}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Time Remaining</span>
                    <span className={cn(
                      "font-black text-sm flex items-center gap-1",
                      timeLeft <= 60 ? "text-rose-600 animate-pulse font-black" : "text-slate-800"
                    )}>
                      <Clock className="w-3.5 h-3.5 text-slate-450" />
                      {formatDuration(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* ROUND TITLE HEADER */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 font-black text-xs rounded-xl tracking-tight">
                      Active: {selectedFocus === "company" ? `${selectedCompany} • ${selectedType}` : `${selectedType} Round`}
                    </span>
                    
                    {/* TTS READ CONTROL BAR */}
                    {currentQuestion && (
                      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
                        {/* Play/Replay */}
                        <button
                          type="button"
                          onClick={() => speakQuestion(currentQuestion.question)}
                          title="Replay question"
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-650 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-600" />
                        </button>

                        {/* Pause/Resume */}
                        <button
                          type="button"
                          onClick={togglePauseSpeaking}
                          disabled={!isSpeaking}
                          title={isSpeechPaused ? "Resume speech" : "Pause speech"}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-650 disabled:opacity-40 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5 fill-slate-650" />
                        </button>

                        {/* Mute/Unmute */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isMuted) {
                              setIsMuted(false);
                              if (currentQuestion) speakQuestion(currentQuestion.question);
                            } else {
                              setIsMuted(true);
                              stopSpeaking();
                            }
                          }}
                          title={isMuted ? "Unmute voice" : "Mute voice"}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-650 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* Speech Speed selector */}
                        <select
                          value={speechSpeed}
                          onChange={(e) => {
                            const newSpeed = parseFloat(e.target.value);
                            setSpeechSpeed(newSpeed);
                            if (isSpeaking && !isSpeechPaused && currentQuestion) {
                              speakQuestion(currentQuestion.question);
                            }
                          }}
                          className="bg-transparent border-none text-[9px] font-black text-slate-500 focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="0.75">0.75x</option>
                          <option value="1.0">1.0x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE QUESTION LOADING OR TEXT */}
                {isGeneratingQuestion ? (
                  <div className="py-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Generating next {currentDifficulty} level question...</p>
                  </div>
                ) : currentQuestion ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h3 className="text-base font-black text-slate-900 leading-snug">
                        {currentQuestion.question}
                      </h3>
                    </div>

                    {/* Hints & Recruiter Concepts (Practice mode guidelines) */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="px-3 py-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border-none"
                      >
                        {showHint ? "Hide Hint" : "Quick Hint"}
                      </button>
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="px-3 py-1.5 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-all border-none"
                      >
                        {showExplanation ? "Hide Target Concept" : "Recruiter Focus"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-800 flex gap-2"
                        >
                          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black text-indigo-600 block mb-0.5">Quick Hint:</span>
                            {currentQuestion.hint}
                          </div>
                        </motion.div>
                      )}

                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 flex gap-2"
                        >
                          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black text-slate-650 block mb-0.5">Target Concept:</span>
                            {currentQuestion.explanation}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Answer Inputs Form */}
                    {!isQuestionAnswered && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Answer Response</label>
                          <div className="flex items-center gap-2">
                            {speechError && <span className="text-[9px] font-bold text-rose-500">{speechError}</span>}
                            <button
                              onClick={toggleSpeechRecognition}
                              className={cn(
                                "px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border cursor-pointer",
                                isListening ? "bg-rose-500 border-rose-600 text-white animate-pulse" : "bg-indigo-50 border-indigo-100 text-indigo-650 hover:bg-indigo-100"
                              )}
                            >
                              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                              <span>{isListening ? "Stop Voice" : "Dictate Voice"}</span>
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={activeAnswerText}
                          onChange={(e) => setActiveAnswerText(e.target.value)}
                          placeholder={isListening ? "Listening... Speak clearly. Your answers are transcribed in real-time." : "Type your answer structure here... (Tip: Structure behavioral answers with Situation -> Task -> Action -> Result)"}
                          className="w-full p-4 min-h-[140px] bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all leading-relaxed"
                        />
                      </div>
                    )}

                    {/* EVALUATION FEEDBACK RESPONSE SECTION */}
                    {isQuestionAnswered && latestEvaluated && latestEvaluated.evaluation && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-indigo-50/30 border border-indigo-150 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start pb-3 border-b border-indigo-100/50">
                          <div>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Question Score Details</span>
                            <h4 className="text-xs font-black text-slate-650 uppercase">Weighted result band: <strong>{getScoreBand(latestEvaluated.finalWeightedScore || 0)}</strong></h4>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-xl text-xs font-black text-white shadow-sm",
                            (latestEvaluated.finalWeightedScore || 70) >= 80 ? "bg-emerald-500" : (latestEvaluated.finalWeightedScore || 70) >= 60 ? "bg-indigo-500" : "bg-rose-500"
                          )}>
                            Score: {latestEvaluated.finalWeightedScore}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-450 uppercase block">What Went Well:</span>
                            <p className="font-semibold text-slate-700 leading-relaxed">{latestEvaluated.evaluation.whatWentWell}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-450 uppercase block">What was missing / Weak Areas:</span>
                            <p className="font-semibold text-rose-600 leading-relaxed">{latestEvaluated.evaluation.whatWasMissing}</p>
                          </div>
                        </div>

                        {/* STAR Checker details */}
                        {selectedType === "Behavioral" && latestEvaluated.evaluation.starAnalysis && (
                          <div className="pt-2 border-t border-indigo-100/40">
                            <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block mb-2">STAR Framework Compliance:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { label: "Situation", val: latestEvaluated.evaluation.starAnalysis.hasSituation },
                                { label: "Task", val: latestEvaluated.evaluation.starAnalysis.hasTask },
                                { label: "Action", val: latestEvaluated.evaluation.starAnalysis.hasAction },
                                { label: "Result", val: latestEvaluated.evaluation.starAnalysis.hasResult }
                              ].map(st => (
                                <div key={st.label} className="p-2 bg-white rounded-xl border border-slate-150 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-700">{st.label}</span>
                                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white", st.val ? "bg-emerald-500" : "bg-slate-200")}>
                                    ✓
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-indigo-100/45 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Recruiter-Grade Model Answer:</span>
                          <p className="text-xs font-semibold text-slate-650 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200/50">
                            "{latestEvaluated.evaluation.idealAnswer}"
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    No active question generated. Change difficulty or retry.
                  </div>
                )}
              </div>

              {/* ACTION ROW */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
                <button
                  onClick={() => {
                    if (confirm("Quit interview session? Progression stats will not be saved.")) {
                      stopCamera();
                      stopSpeaking();
                      stopListening();
                      setAppState("setup");
                    }
                  }}
                  className="px-5 py-3 text-xs font-black text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                >
                  Quit Round
                </button>

                <div className="flex items-center gap-3">
                  {/* End Interview triggers final report */}
                  {sessions.length > 0 && (
                    <button
                      onClick={endInterview}
                      className="px-5 py-3 border border-slate-350 hover:bg-slate-50 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer bg-white"
                    >
                      End Interview & Report
                    </button>
                  )}

                  {!isQuestionAnswered && currentQuestion && (
                    <button
                      onClick={submitAnswer}
                      disabled={isSubmittingAnswer || !activeAnswerText.trim()}
                      className="px-6 py-3 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer border-none"
                    >
                      {isSubmittingAnswer ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Evaluating Answer...
                        </>
                      ) : (
                        <>
                          Submit Answer
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  {isQuestionAnswered && (
                    <button
                      onClick={() => getNextAdaptiveQuestion()}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer border-none"
                    >
                      Next Question
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* WEBCAM & VOICE COLUMN */}
            <div className="space-y-6">
              {/* WEBCAM SCREEN */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative text-left">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", isCameraOn ? "bg-rose-500" : "bg-slate-500")} />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {isCameraOn ? "Webcam Live" : "Webcam Off"}
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    className="bg-black/60 hover:bg-slate-800 border-none px-2 py-1 rounded text-[8px] font-black text-slate-350 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    {isCameraOn ? "Turn Off" : "Turn On"}
                  </button>
                </div>

                <div className="h-44 flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-850 relative overflow-hidden">
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
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 border-none text-white text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Enable Webcam
                        </button>
                      )}
                    </div>
                  )}
                  {isCameraOn && (
                    <>
                      <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t border-l border-indigo-400" />
                      <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t border-r border-indigo-400" />
                      <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b border-l border-indigo-400" />
                      <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b border-r border-indigo-400" />
                    </>
                  )}
                </div>
              </div>

              {/* VOICE AUDIO WAVEFORM */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative text-left">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {isListening ? "Dictation Recording" : "Voice Idle"}
                  </span>
                </div>

                <div className="h-20 flex items-center justify-center gap-1.5 mt-8 px-4 bg-slate-950 rounded-2xl border border-slate-850">
                  {[10, 24, 48, 18, 52, 60, 32, 10, 24, 48, 56, 38, 20, 44, 28, 10].map((ht, idx) => (
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
              </div>

              {/* STUDY NOTES HELPER */}
              <div className="p-5 bg-indigo-50 border border-indigo-150 rounded-3xl space-y-2 text-left">
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Study Guide:</span>
                <p className="text-[10px] font-medium text-slate-650 leading-relaxed">
                  Focus on structural clarity. Provide concrete examples with metrics rather than generic explanations during technical rounds.
                </p>
              </div>

            </div>
          </motion.div>
        )}

        {/* FEEDBACK & REPORT SUMMARY */}
        {appState === "feedback" && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* OVERALL PERFORMANCE CARD */}
            {(() => {
              const avgScores = {
                technicalAccuracy: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.technicalAccuracy || 7), 0) / (sessions.length || 1)),
                communication: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.communication || 7), 0) / (sessions.length || 1)),
                clarity: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.clarity || 7), 0) / (sessions.length || 1)),
                completeness: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.completeness || 7), 0) / (sessions.length || 1)),
                confidence: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.confidence || 7), 0) / (sessions.length || 1)),
                problemSolving: Math.round(sessions.reduce((acc, s) => acc + (s.evaluation?.scores?.problemSolving || 7), 0) / (sessions.length || 1))
              };

              return (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-left">
                  
                  {/* Gauge */}
                  <div className="flex flex-col items-center justify-center text-center p-6 md:border-r border-slate-100">
                    <div className="relative w-36 h-36 flex items-center justify-center">
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
                      <div className="absolute text-center flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-800">{finalScore}%</span>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mt-1">Readiness</span>
                      </div>
                    </div>
                    <div className="mt-4 px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">
                      {finalScore >= 80 ? "Offer Grade Performance" : finalScore >= 65 ? "Borderline Ready" : "Requires Practice"}
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <div className="flex flex-col items-center justify-center p-6 md:border-r border-slate-100">
                    <h3 className="text-sm font-black text-slate-850 tracking-tight mb-2 self-start md:self-center">Competency Radar</h3>
                    {renderRadarChart(avgScores)}
                  </div>

                  {/* competency breakdown progress sliders */}
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-slate-850 tracking-tight">Competency Breakdown</h3>
                    
                    <div className="space-y-3">
                      {[
                        { label: "Technical Accuracy", score: avgScores.technicalAccuracy * 10 },
                        { label: "Communication Skills", score: avgScores.communication * 10 },
                        { label: "Clarity & Structure", score: avgScores.clarity * 10 },
                        { label: "Completeness", score: avgScores.completeness * 10 },
                        { label: "Confidence Indicators", score: avgScores.confidence * 10 },
                        { label: "Problem Solving", score: avgScores.problemSolving * 10 }
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
              );
            })()}

            {/* STRENGTHS, SPEECH ANALYSIS, RECOMMENDATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
              
              {/* Strengths areas */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-850 tracking-tight flex items-center gap-1.5">
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

              {/* articulation filler check */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-850 tracking-tight flex items-center gap-1.5">
                  <Mic className="w-4.5 h-4.5 text-indigo-650" />
                  Articulation & Filler Analysis
                </h4>
                
                <div className="space-y-3">
                  <div className={cn(
                    "p-4 border rounded-2xl space-y-1.5",
                    totalFillerCount >= 10 ? "bg-rose-50/50 border-rose-100 text-rose-800" : totalFillerCount >= 5 ? "bg-amber-50/50 border-amber-100 text-amber-800" : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                  )}>
                    <span className="text-[9px] font-black uppercase tracking-widest block">Articulation Grade</span>
                    <div className="text-xs font-black">
                      {totalFillerCount >= 10 ? "High Filler Count (Needs Work)" : totalFillerCount >= 5 ? "Moderate Fillers" : "Highly Articulate (Recruiter Grade)"}
                    </div>
                    <p className="text-[9px] font-medium opacity-90 leading-snug">
                      {totalFillerCount >= 10 
                        ? "You are using multiple filler words. Practice pausing silently for a more composed impression." 
                        : totalFillerCount >= 5 
                          ? "Minor filler counts detected. Pause deliberately to formulate details." 
                          : "Excellent verbal articulation. Pause management matches recruiter checklists."}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Filler Metrics</span>
                      <span className="text-slate-800 font-bold">{totalFillerCount} total</span>
                    </div>
                    {totalFillerCount === 0 ? (
                      <p className="text-[10px] font-bold text-slate-500 italic">Zero fillers detected in answers.</p>
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

              {/* Recommendations and study plan */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-850 tracking-tight flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5 text-emerald-500" />
                  Recommended Study Plan
                </h4>
                <div className="space-y-2.5">
                  {getResourceRecommendations(weaknesses).map((res, i) => (
                    <a
                      key={i}
                      href={res.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 border border-slate-150 hover:border-slate-200 hover:bg-slate-100/50 rounded-2xl flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[8px] font-black uppercase rounded">
                          {res.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {res.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-450 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}

                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-[10px] text-indigo-700 font-bold">
                    Estimated improvement hours required: <strong>{Math.round((100 - finalScore) * 0.4)} Hours</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* DETAILED QUESTION RESPONSE SHEETS */}
            <div className="space-y-6 text-left">
              <h3 className="text-lg font-black text-slate-850 tracking-tight">Question-by-Question Response Audit</h3>
              
              {sessions.filter(s => s.evaluation).map((sess, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-150">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question {idx + 1} ({sess.difficulty})</span>
                      <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug">{sess.question.question}</h4>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-sm shrink-0",
                      (sess.finalWeightedScore || 70) >= 80 ? "bg-emerald-500" : (sess.finalWeightedScore || 70) >= 60 ? "bg-indigo-500" : "bg-rose-500"
                    )}>
                      Score: {sess.finalWeightedScore}%
                    </span>
                  </div>

                  {/* USER ANSWER BOX */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Your Answer:</span>
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed italic">
                      &quot;{sess.userAnswer || "No answer provided."}&quot;
                    </div>
                  </div>

                  {/* STAR METHOD CHECKER */}
                  {selectedType === "Behavioral" && sess.evaluation?.starAnalysis && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">STAR framework check</span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Situation", checked: sess.evaluation.starAnalysis.hasSituation, feedback: sess.evaluation.starAnalysis.situationFeedback },
                          { label: "Task", checked: sess.evaluation.starAnalysis.hasTask, feedback: sess.evaluation.starAnalysis.taskFeedback },
                          { label: "Action", checked: sess.evaluation.starAnalysis.hasAction, feedback: sess.evaluation.starAnalysis.actionFeedback },
                          { label: "Result", checked: sess.evaluation.starAnalysis.hasResult, feedback: sess.evaluation.starAnalysis.resultFeedback }
                        ].map((st, i) => (
                          <div key={i} className="space-y-1.5 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <div className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                                st.checked ? "bg-emerald-500" : "bg-slate-200"
                              )}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-xs font-black text-slate-800">{st.label}</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500 leading-snug">{st.feedback}</p>
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
                          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">What went well:</span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.whatWentWell}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">What was missing:</span>
                          <p className="text-xs font-medium text-rose-600 leading-relaxed font-bold">{sess.evaluation.whatWasMissing}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Recruiter Perspective:</span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.recruiterPerspective}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Ideal Answer Structure:</span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{sess.evaluation.idealStructure}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODEL ANSWER */}
                  {sess.evaluation && (
                    <div className="p-5 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-inner space-y-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-455" />
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
                onClick={() => setAppState("setup")}
                className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer border-none"
              >
                Return to Setup Dashboard
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
