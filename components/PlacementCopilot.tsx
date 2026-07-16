"use client";

import React, { useState, useRef, useEffect } from "react";
import { enqueueTask, startWorker } from "@/lib/queue";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Trash2,
  Send,
  Bot,
  User,
  Zap,
  ArrowRight,
  LineChart,
  Target,
  Sparkles,
  CheckSquare,
  Award,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getScopedKey } from "@/lib/security/LocalStorage";

interface ChatMessage {
  id: string;
  role: "user" | "copilot" | "system";
  content: string;
  action?: string | null;
  healthReport?: {
    resumeQuality: number;
    interviewReadiness: number;
    projects: number;
    overallReadiness: number;
  } | null;
  timestamp: string;
}

interface PlacementCopilotProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setResumeSubTab?: (subTab: string) => void;
  targetRole: string;
  techStack: string;
}

const SUGGESTED_PROMPTS = [
  "Am I ready for placements?",
  "Improve my resume",
  "Prepare for Deloitte",
  "Suggest projects",
  "Find skill gaps",
  "Generate today's placement plan"
];

// Helper functions declared outside component scope to satisfy React strict compiler purity rules
const generateMessageId = (role: string): string => {
  return `msg-${Date.now()}-${role}-${Math.random().toString(36).substring(2, 9)}`;
};

const generateTimestamp = (): string => {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function PlacementCopilot({
  setActiveTab,
  setResumeSubTab,
  targetRole,
  techStack
}: PlacementCopilotProps) {
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync messages on userId change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(getScopedKey("placement_copilot_chat_history", userId));
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch {}
      }
      setMessages([
        {
          id: "msg-welcome",
          role: "copilot",
          content: `Welcome back! I am your **AI Placement Copilot**, the strategist for your hiring journey. \n\nI have evaluated your workspace metrics. Currently, you are aiming for a **${targetRole}** role. I can check your placement readiness, suggest customized projects, build study timelines, or dispatch app triggers. \n\nClick one of the suggestions below or ask me any question directly!`,
          timestamp: generateTimestamp()
        }
      ]);
    }
  }, [userId, targetRole]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");

  // Dynamic dashboard states
  const [predictiveScore, setPredictiveScore] = useState<number>(68);
  const [predictiveMetrics, setPredictiveMetrics] = useState<string[]>([
    "+8% if ATS score reaches 90%",
    "+5% if SQL assessment > 80%",
    "+6% if another project is added"
  ]);
  const [dailyPlan, setDailyPlan] = useState<string[]>([
    "Improve ATS score by 6 points",
    "Practice 10 SQL queries",
    "Track 1 application in CRM"
  ]);
  const [completedDailyTasks, setCompletedDailyTasks] = useState<Record<number, boolean>>({});
  const [dynamicMission, setDynamicMission] = useState<{ title: string; reward: string }>({
    title: "Complete SQL join practice questions",
    reward: "40 XP"
  });

  useEffect(() => {
    if (!activeTaskId) return;

    const handleTaskUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedTask = customEvent.detail;
      if (updatedTask.id === activeTaskId) {
        if (updatedTask.status === "COMPLETED") {
          setIsLoading(false);
          const copilotResponse = updatedTask.result.data || updatedTask.result;
          
          const copilotMsg: ChatMessage = {
            id: generateMessageId("copilot"),
            role: "copilot",
            content: copilotResponse.reply,
            action: copilotResponse.action,
            healthReport: copilotResponse.healthReport,
            timestamp: generateTimestamp()
          };

          setMessages(prev => {
            const finalMessages = [...prev, copilotMsg];
            if (typeof window !== "undefined") {
              localStorage.setItem(getScopedKey("placement_copilot_chat_history", userId), JSON.stringify(finalMessages));
            }
            return finalMessages;
          });

          if (copilotResponse.healthReport) {
            setActiveHealthReport(copilotResponse.healthReport);
          }

          if (copilotResponse.predictiveScore !== undefined) {
            setPredictiveScore(copilotResponse.predictiveScore);
          }

          if (copilotResponse.predictiveMetrics) {
            setPredictiveMetrics(copilotResponse.predictiveMetrics);
          }

          if (copilotResponse.dailyPlan) {
            setDailyPlan(copilotResponse.dailyPlan);
            setCompletedDailyTasks({});
          }

          if (copilotResponse.dynamicMission) {
            setDynamicMission(copilotResponse.dynamicMission);
          }

          if (copilotResponse.action) {
            dispatchPlatformAction(copilotResponse.action);
          }

          setActiveTaskId(null);
        } else if (updatedTask.status === "FAILED") {
          setIsLoading(false);
          
          const contextMetrics = getContextMetrics();
          const query = updatedTask.payload.message;
          console.warn("Copilot API failed (queue), running offline heuristics.", updatedTask.error);
          const reply = executeOfflineHeuristics(query, contextMetrics);
          
          const copilotMsg: ChatMessage = {
            id: generateMessageId("copilot"),
            role: "copilot",
            content: reply.content,
            action: reply.action,
            healthReport: reply.healthReport,
            timestamp: generateTimestamp()
          };

          setMessages(prev => {
            const finalMessages = [...prev, copilotMsg];
            if (typeof window !== "undefined") {
              localStorage.setItem(getScopedKey("placement_copilot_chat_history", userId), JSON.stringify(finalMessages));
            }
            return finalMessages;
          });

          if (reply.healthReport) {
            setActiveHealthReport(reply.healthReport);
          }

          if (reply.action) {
            dispatchPlatformAction(reply.action);
          }

          setActiveTaskId(null);
        }
      }
    };

    window.addEventListener("bb_task_updated", handleTaskUpdate);
    return () => {
      window.removeEventListener("bb_task_updated", handleTaskUpdate);
    };
  }, [activeTaskId, userId]);

  const [activeHealthReport, setActiveHealthReport] = useState<ChatMessage["healthReport"] | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(getScopedKey("placement_copilot_chat_history", userId));
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const healthReports = parsed.filter((m: ChatMessage) => m.healthReport);
          if (healthReports.length > 0) {
            setActiveHealthReport(healthReports[healthReports.length - 1].healthReport);
            return;
          }
        } catch {}
      }
      setActiveHealthReport(null);
    }
  }, [userId]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load context from local workspace metrics
  const getContextMetrics = () => {
    let ats = 0;
    let interview = 50;
    let roadmapProgress = 0;
    const totalRoadmap = 10;
    let crmApps: { status: string }[] = [];

    if (typeof window !== "undefined") {
      ats = Number(localStorage.getItem(getScopedKey("ats_score", userId)) || "0");
      
      const interviewHistory = localStorage.getItem(getScopedKey("interview_history", userId));
      if (interviewHistory) {
        try {
          const list = JSON.parse(interviewHistory);
          if (list.length > 0) {
            interview = Math.round(list.reduce((acc: number, curr: { overallScore?: number }) => acc + (curr.overallScore || 0), 0) / list.length);
          }
        } catch {}
      }

      const roadmapProgressStates = localStorage.getItem(getScopedKey("roadmap_progress_states", userId));
      if (roadmapProgressStates) {
        try {
          const parsed = JSON.parse(roadmapProgressStates);
          roadmapProgress = Object.values(parsed).filter(Boolean).length;
        } catch {}
      }

      const crmApplications = localStorage.getItem(getScopedKey("placement_crm_applications", userId));
      if (crmApplications) {
        try {
          crmApps = JSON.parse(crmApplications);
        } catch {}
      }
    }

    return {
      atsScore: ats,
      interviewAvg: interview,
      roadmapProgressCount: roadmapProgress,
      totalRoadmapCount: totalRoadmap,
      crmApplications: crmApps,
      targetRole,
      techStack
    };
  };

  // Scroll to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const saveChatHistory = (list: ChatMessage[]) => {
    setMessages(list);
    if (typeof window !== "undefined") {
      localStorage.setItem(getScopedKey("placement_copilot_chat_history", userId), JSON.stringify(list));
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear your Copilot chat history?")) {
      const welcome: ChatMessage = {
        id: "msg-welcome-new",
        role: "copilot",
        content: "Hello! Chat history cleared. Ask me any career, resume, or placement queries to begin.",
        timestamp: generateTimestamp()
      };
      saveChatHistory([welcome]);
      setActiveHealthReport(null);
    }
  };

  // Dispatch Actions Interceptor
  const dispatchPlatformAction = (actionTag: string) => {
    if (!actionTag) return;
    
    // Add a system notice message
    const systemNotice: ChatMessage = {
      id: generateMessageId("system"),
      role: "system",
      content: `System Dispatcher: Routing interface to match the copilot request...`,
      timestamp: generateTimestamp()
    };
    
    saveChatHistory([...messages, systemNotice]);

    setTimeout(() => {
      switch (actionTag) {
        case "OPEN_ATS":
          setActiveTab("resume-os");
          if (setResumeSubTab) setResumeSubTab("ats");
          break;
        case "OPEN_JD":
          setActiveTab("resume-os");
          if (setResumeSubTab) setResumeSubTab("jd-match");
          break;
        case "OPEN_BUILDER":
          setActiveTab("resume-os");
          if (setResumeSubTab) setResumeSubTab("builder");
          break;
        case "OPEN_INTERVIEW":
          setActiveTab("interview-prep");
          break;
        case "OPEN_ROADMAP":
          setActiveTab("roadmap");
          break;
        case "OPEN_CRM":
          setActiveTab("placement-tracker");
          break;
        case "OPEN_PROJECTS":
          setActiveTab("projects");
          break;
        case "OPEN_COMPANY":
          setActiveTab("company");
          break;
        default:
          break;
      }
    }, 1200);
  };

  // Submit Prompt Handler
  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    setInputText("");
    
    const userMsg: ChatMessage = {
      id: generateMessageId("user"),
      role: "user",
      content: query,
      timestamp: generateTimestamp()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const contextMetrics = getContextMetrics();

    try {
      const payload = {
        message: query,
        history: updatedMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        context: contextMetrics
      };

      const task = enqueueTask("copilot", payload);
      setActiveTaskId(task.id);
      startWorker();
    } catch (err: any) {
      console.warn("Copilot queuing failed, running offline heuristics.", err);
      const reply = executeOfflineHeuristics(query, contextMetrics);
      
      const copilotMsg: ChatMessage = {
        id: generateMessageId("copilot"),
        role: "copilot",
        content: reply.content,
        action: reply.action,
        healthReport: reply.healthReport,
        timestamp: generateTimestamp()
      };

      const finalMessages = [...updatedMessages, copilotMsg];
      saveChatHistory(finalMessages);

      if (reply.healthReport) {
        setActiveHealthReport(reply.healthReport);
      }

      if (reply.action) {
        dispatchPlatformAction(reply.action);
      }
      setIsLoading(false);
    }
  };

  // Heuristics Engine
  const executeOfflineHeuristics = (query: string, context: ReturnType<typeof getContextMetrics>) => {
    const q = query.toLowerCase();
    
    // 1. Placement Health Check Heuristics
    if (q.includes("ready") || q.includes("health") || q.includes("diagnostic")) {
      const resume = Math.round(context.atsScore);
      const interview = Math.round(context.interviewAvg);
      const projectsCount = context.crmApplications.filter(a => a.status === "Joined" || a.status === "Offer Received").length > 0 ? 90 : 65;
      const overall = Math.round((resume * 0.35) + (interview * 0.35) + (projectsCount * 0.3));

      const replyText = `### 📊 Placement Health Diagnostic Report (Offline mode)
 
I have compiled your profile parameters to check your overall ready index:
- **Resume Quality**: ${resume}% (ATS scan benchmark)
- **Interview Readiness**: ${interview}% (Mock metrics review)
- **Project Portfolio**: ${projectsCount}% (Evaluated from workspace cache)
- **Overall Readiness**: **${overall}%**
 
#### 💡 Strategy Audit:
${overall >= 80 
  ? "Your profile is in the **Placement Ready** tier. Keep applying to top roles and finalize schedules." 
  : "You have minor gap blockages. Improve your mock interview metrics and target ATS optimization suggestions before launching off-campus applications."}`;

      return {
        content: replyText,
        action: "OPEN_CRM",
        healthReport: {
          resumeQuality: resume,
          interviewReadiness: interview,
          projects: projectsCount,
          overallReadiness: overall
        }
      };
    }

    // 2. Resume improvement
    if (q.includes("resume") || q.includes("cv") || q.includes("ats")) {
      return {
        content: `### 📄 Resume Enhancement Strategy
 
Based on your current ATS rating of **${context.atsScore}%**:
1. **Tech Stack Keywords**: Ensure standard database normalization, API routing protocols, and cloud services (AWS, Docker) are clearly indexed.
2. **Action Metrics**: Replace vague descriptions with quantified results (e.g., "Optimized queries, reducing load latencies by 35%").
3. **Format Standard**: Keep to a single-column, scan-optimized format.
 
Redirecting you to **Resume OS** to inspect direct improvement alerts...`,
        action: "OPEN_ATS"
      };
    }

    // 3. Interview prep
    if (q.includes("interview") || q.includes("prep") || q.includes("mock")) {
      return {
        content: `### 🎤 Interview Coaching Blueprint
 
Your current mock interview rating is **${context.interviewAvg}%**:
- **Strong Areas**: Technical concepts and syntax structure.
- **Improvement Target**: Behavioral responses (STAR framework) and pace reduction variables.
- **Recommended Action**: Complete 2 simulated technical and behavioral mock sessions to evaluate fillers.
 
Redirecting you to the **AI Interview Simulator**...`,
        action: "OPEN_INTERVIEW"
      };
    }

    // Default Fallback
    return {
      content: `I have analyzed your request regarding: "${query}". 
 
As your AI Copilot, I recommend:
1. Reviewing your **Resume OS** templates to ensure keyword density matches your target track.
2. Managing active interview calendars in the **Placement CRM** dashboard.
3. Completing roadmap checkpoints to increase your **Placement Readiness Index**.
 
Ask me specifically about "placement health", "resume tips", "mock interviews", or "project ideas" to fetch deep diagnostic alerts!`,
      action: null
    };
  };

  const handleToggleTask = (idx: number) => {
    setCompletedDailyTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
      
      {/* CHAT SECTION (Left/Main) */}
      <div className="lg:col-span-8 flex flex-col bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden h-[680px]">
        
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-sm font-black text-slate-800 tracking-tight block">AI Placement Copilot</strong>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">BuggedBrain OS Strategic Coach</span>
            </div>
          </div>
          <button
            onClick={clearChatHistory}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Generate Today's Plan */}
        <div className="px-6 py-2.5 bg-indigo-50/40 border-b border-indigo-100 flex items-center justify-between shrink-0">
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Quick Actions Command</span>
          <button
            onClick={() => handleSendMessage("Generate today's placement plan")}
            disabled={isLoading}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Generate Today&apos;s Action Plan</span>
          </button>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {messages.map((msg) => {
            const isCopilot = msg.role === "copilot";
            const isSystem = msg.role === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  isCopilot ? "self-start" : "ml-auto flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    isCopilot
                      ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                      : "bg-slate-900 border-slate-900 text-slate-100"
                  )}
                >
                  {isCopilot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={cn(
                      "p-4 rounded-3xl text-xs font-semibold leading-relaxed whitespace-pre-wrap text-left",
                      isCopilot
                        ? "bg-slate-50 border border-slate-150 text-slate-700"
                        : "bg-slate-900 text-white"
                    )}
                  >
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-black text-slate-900 text-sm mt-3 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <li key={idx} className="ml-4 list-disc text-slate-600 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                      }
                      if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") || line.startsWith("4. ")) {
                        return <li key={idx} className="ml-4 list-decimal text-slate-600 font-bold my-0.5">{line.replace(/^\d+\.\s+/, "")}</li>;
                      }
                      // Replace bold markdown syntax **text**
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
                        return <p key={idx} className="my-1.5">{parsedLine}</p>;
                      }
                      return <p key={idx} className="my-1.5 min-h-[0.5rem]">{line}</p>;
                    })}
                  </div>
                  <span className={cn("text-[9px] text-slate-400 font-bold block px-2", isCopilot ? "text-left" : "text-right")}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-4 max-w-[80%] self-start animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 text-slate-400 rounded-3xl text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Copilot is auditing target requirements...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Queries Grid */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2 shrink-0 bg-slate-50/20">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
          <input
            type="text"
            placeholder="Ask AI Copilot about readiness, resume scores, or Deloitte preparation tracks..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) handleSendMessage(inputText);
            }}
            className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold text-xs focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>

      {/* HEALTH DIAGNOSTIC PANEL (Right) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* PREDICTIVE PROBABILITY METER (PHASE 7) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Placement Probability</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
            <strong className="text-4xl font-black text-indigo-600 tracking-tighter">{predictiveScore}%</strong>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Calculated probability</span>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Actionable upgrades:</span>
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              {predictiveMetrics.map((met, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Plus className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{met}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AUTONOMOUS PLANS & PERSONALIZED MISSIONS (PHASE 9 & 10) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Today&apos;s Placement Plan</h3>
          </div>

          <div className="space-y-3 font-semibold text-xs text-slate-650">
            {dailyPlan.map((planText, pIdx) => {
              const isChecked = !!completedDailyTasks[pIdx];
              return (
                <button
                  key={pIdx}
                  onClick={() => handleToggleTask(pIdx)}
                  className="w-full text-left p-3.5 bg-slate-50 border border-slate-100 hover:border-slate-250 rounded-2xl flex items-start gap-3 transition-all"
                >
                  <span className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                  )}>
                    {isChecked && "✓"}
                  </span>
                  <span className={cn("leading-relaxed", isChecked ? "line-through text-slate-400" : "text-slate-700")}>
                    {planText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Mission Card */}
          {dynamicMission && (
            <div className="p-5 border border-indigo-150 bg-indigo-50/20 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <strong className="text-[10px] font-black text-indigo-650 uppercase tracking-widest font-mono">Personalized Mission</strong>
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-normal">{dynamicMission.title}</p>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold">
                <span>XP reward:</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full font-black flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 fill-indigo-100" />
                  {dynamicMission.reward}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Health gauges visual dashboard */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-indigo-500 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Workspace Health</h3>
          </div>
          
          <AnimatePresence mode="wait">
            {activeHealthReport ? (
              <motion.div
                key="report-dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-2 gap-6"
              >
                {[
                  { label: "Resume Quality", val: activeHealthReport.resumeQuality, color: "text-blue-600" },
                  { label: "Interview Index", val: activeHealthReport.interviewReadiness, color: "text-indigo-600" },
                  { label: "Projects Metric", val: activeHealthReport.projects, color: "text-amber-550" },
                  { label: "Overall PRI", val: activeHealthReport.overallReadiness, color: "text-emerald-600" }
                ].map((gauge, gIdx) => (
                  <div key={gIdx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{gauge.label}</span>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="26" className="text-slate-100" strokeWidth="5" stroke="currentColor" fill="transparent" />
                        <circle cx="32" cy="32" r="26" className={gauge.color} strokeWidth="5" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - gauge.val / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-800">{gauge.val}%</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                Ask the copilot **&quot;Am I ready for placements?&quot;** to evaluate score meters.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Copilot Actions Prompt Drawer */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
          <strong className="text-xs font-black text-slate-400 uppercase tracking-widest block">Strategic Action Controls</strong>
          
          <div className="space-y-2.5">
            {[
              { label: "Improve My Resume", action: "OPEN_ATS", desc: "Launches Resume OS ATS scan audits" },
              { label: "Prepare For Deloitte", action: "OPEN_COMPANY", desc: "Opens targeted Deloitte prep questions" },
              { label: "Schedule Mock Interview", action: "OPEN_INTERVIEW", desc: "Starts voice simulation prep" },
              { label: "Suggest Portfolios", action: "OPEN_PROJECTS", desc: "Opens recruiter-attraction ratings" }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => dispatchPlatformAction(btn.action)}
                className="w-full p-4 bg-slate-50 border border-slate-100 hover:border-indigo-300 rounded-2xl text-left flex items-center justify-between gap-3 group transition-all cursor-pointer"
              >
                <div>
                  <strong className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors block">{btn.label}</strong>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{btn.desc}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
