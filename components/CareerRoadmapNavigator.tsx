"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getRoadmapProgress, updateRoadmapProgress } from "@/lib/db/roadmaps";
import { getUserProfile, upsertUserProfile } from "@/lib/db/profiles";
import { calculatePRIScore } from "@/lib/db/placement-readiness";

import {
  Sparkles,
  Compass,
  Briefcase,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Target,
  Bookmark,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces
interface RoadmapStep {
  skillName: string;
  whyItMatters: string;
  estimatedTime: string;
  difficulty: string;
  priority: string;
}

interface RoadmapStage {
  stageName: string;
  stageIndex: number;
  steps: RoadmapStep[];
}

interface ResourceItem {
  title: string;
  url: string;
  type: string;
  difficulty: string;
}

interface ProjectRecommendation {
  title: string;
  desc: string;
  impactScore: number;
  recruiterAttractionScore: number;
  difficulty: string;
  portfolioValue: string;
}

interface CompanyTrack {
  companyName: string;
  matchPercentage: number;
  needImprovementIn: string[];
}

interface PlanPeriod {
  dailyTasks: string[];
  weeklyTasks: string[];
  monthlyGoals: string[];
}

interface RoadmapData {
  careerReadinessReport: {
    overview: string;
    resumeDiagnostics: string;
    interviewFeedback: string;
    portfolioFeedback: string;
  };
  readinessPredictions: {
    interviewReadiness: number;
    placementReadiness: number;
    industryReadiness: number;
  };
  skillGap: {
    strong: string[];
    missing: string[];
    critical: string[];
  };
  stages: RoadmapStage[];
  resources: ResourceItem[];
  projects: ProjectRecommendation[];
  companyRoadmaps: CompanyTrack[];
  plan306090: {
    plan30Day: PlanPeriod;
    plan60Day: PlanPeriod;
    plan90Day: PlanPeriod;
  };
  achievements: {
    title: string;
    description: string;
    unlocked: boolean;
  }[];
}

const SUPPORTED_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "AI Engineer",
  "Machine Learning Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Business Analyst",
  "Product Analyst",
  "Product Manager",
  "UI/UX Designer"
];

// Fallback Default Roadmap Data (Pre-filled for "Software Engineer" to provide an immediate wow factor)
const DEFAULT_ROADMAP_DATA: RoadmapData = {
  careerReadinessReport: {
    overview: "Your current profile showcases solid programming fundamentals but requires structured backend architecture mapping, containerization, and advanced system design principles to qualify for top-tier off-campus hiring drives.",
    resumeDiagnostics: "Detected languages: JavaScript, TypeScript, React. Strong frontend skills, but missing database normalization, Docker setups, and cloud operations. Quantified achievement indicators are average (needs more metrics).",
    interviewFeedback: "Latest mock interview trials registered an average score of 50%. Articulation pace is good, but filler usage ('like', 'um') is moderate. System design questions need polish.",
    portfolioFeedback: "Detected projects: Real-time collaborative whiteboard. Recommended addition: Distributed caching pipeline or transactional order backend to showcase high-throughput capabilities."
  },
  readinessPredictions: {
    interviewReadiness: 65,
    placementReadiness: 55,
    industryReadiness: 60
  },
  skillGap: {
    strong: ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Git", "REST APIs"],
    missing: ["Node.js", "Express", "Docker", "AWS basics", "NoSQL", "Redis"],
    critical: ["SQL Schema Design", "System Design Patterns", "Data Structures & Algorithms"]
  },
  stages: [
    {
      stageName: "Stage 1: Foundation",
      stageIndex: 1,
      steps: [
        { skillName: "Object-Oriented Programming (OOP)", whyItMatters: "Forms the baseline structure for clean code audits in corporate placements.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
        { skillName: "Database Normalization & SQL Queries", whyItMatters: "Crucial for writing optimized database schemas and backends.", estimatedTime: "2 Weeks", difficulty: "Beginner", priority: "High" }
      ]
    },
    {
      stageName: "Stage 2: Core Skills",
      stageIndex: 2,
      steps: [
        { skillName: "Node.js & Express REST APIs", whyItMatters: "Core tech stack for modern backend architectures and service gateways.", estimatedTime: "3 Weeks", difficulty: "Intermediate", priority: "High" },
        { skillName: "Docker Containerization basics", whyItMatters: "Ensures local environments translate reliably to distributed cloud systems.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "Medium" }
      ]
    },
    {
      stageName: "Stage 3: Projects",
      stageIndex: 3,
      steps: [
        { skillName: "High-Throughput Order Backend", whyItMatters: "Demonstrates concurrency control, database transactions, and scalability to FAANG reviewers.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" },
        { skillName: "Cloud Deployment (AWS EC2 / S3)", whyItMatters: "Shows production release capabilities and system infrastructure orchestration.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "Medium" }
      ]
    },
    {
      stageName: "Stage 4: Interview Prep",
      stageIndex: 4,
      steps: [
        { skillName: "Data Structures & Algorithms (Trees, Graphs)", whyItMatters: "Standard filter round for Google, Deloitte, Acccenture technical screens.", estimatedTime: "3 Weeks", difficulty: "Advanced", priority: "High" },
        { skillName: "System Design Patterns", whyItMatters: "Sought-after skills in tier-1 off-campus drives to filter future tech leaders.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" }
      ]
    },
    {
      stageName: "Stage 5: Placement Ready",
      stageIndex: 5,
      steps: [
        { skillName: "Behavioral STAR Stories", whyItMatters: "Cracks corporate culture checks and HR partner rounds.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
        { skillName: "ATS-Scanned Custom Resumes", whyItMatters: "Bypasses automated screening tools to land call interviews.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
      ]
    }
  ],
  resources: [
    { title: "Object Oriented Programming Simplified", url: "https://youtube.com", type: "YouTube Video", difficulty: "Beginner" },
    { title: "SQL Schema Design & Normalization docs", url: "https://wikipedia.org", type: "Documentation", difficulty: "Beginner" },
    { title: "Full-Stack Node.js and Express roadmap", url: "https://roadmap.sh", type: "Roadmap Article", difficulty: "Intermediate" },
    { title: "Docker & Container Orchestration Playground", url: "https://play-with-docker.com", type: "Practice Platform", difficulty: "Intermediate" },
    { title: "Distributed Systems & System Design Course", url: "https://coursera.org", type: "Free Course", difficulty: "Advanced" }
  ],
  projects: [
    { title: "Real-time Collaborative Whiteboard", desc: "Interactive workspace allowing multi-user drawing, chat, and sticky notes with sub-second WebSocket synchronization.", impactScore: 82, recruiterAttractionScore: 80, difficulty: "Intermediate", portfolioValue: "Medium" },
    { title: "Serverless Order Processing Pipeline", desc: "AWS Lambda, Redis queues, and DynamoDB setup locked for simulated high-traffic flash sale requests.", impactScore: 95, recruiterAttractionScore: 92, difficulty: "Advanced", portfolioValue: "High" },
    { title: "Portfolio Website & LaTeX Generator", desc: "Vibrant developer portfolio displaying projects and integrating latex compiling tools for custom resume versions.", impactScore: 70, recruiterAttractionScore: 68, difficulty: "Beginner", portfolioValue: "Low" }
  ],
  companyRoadmaps: [
    { companyName: "IBM", matchPercentage: 62, needImprovementIn: ["Java Basics", "SQL DBs", "OOP concepts"] },
    { companyName: "TCS", matchPercentage: 75, needImprovementIn: ["Aptitude Tests", "C Programming", "DBMS"] },
    { companyName: "Deloitte", matchPercentage: 68, needImprovementIn: ["System Design", "Consultative Case Study", "SQL"] },
    { companyName: "Accenture", matchPercentage: 70, needImprovementIn: ["Cloud Operations", "Communication Test", "Java"] },
    { companyName: "Capgemini", matchPercentage: 60, needImprovementIn: ["Data Structures", "Pseudo-code MCQs", "OOP"] },
    { companyName: "Cognizant", matchPercentage: 72, needImprovementIn: ["DBMS Queries", "Logical Aptitude", "Node.js"] },
    { companyName: "Wipro", matchPercentage: 65, needImprovementIn: ["SQL Normalization", "Coding Test", "Basic HTML/CSS"] },
    { companyName: "Infosys", matchPercentage: 78, needImprovementIn: ["Aptitude Test", "Java OOP", "Python basics"] },
    { companyName: "HCLTech", matchPercentage: 66, needImprovementIn: ["Operating Systems", "Networking basic", "SQL"] }
  ],
  plan306090: {
    plan30Day: {
      dailyTasks: ["Solve 1 SQL querying test", "Revise 1 OOP concept (Inheritance, Polymorphism)", "Write 1 node.js backend endpoint"],
      weeklyTasks: ["Practice 3 Easy DSA Arrays challenges", "Deploy 1 serverless function on EC2/Localhost"],
      monthlyGoals: ["Build foundation in core SQL normalizations & REST APIs setup"]
    },
    plan60Day: {
      dailyTasks: ["Study Dockerfile structures", "Practice Graph traversal nodes", "Review interview transcripts"],
      weeklyTasks: ["Write container launch configurations", "Mock practice session with voice checker"],
      monthlyGoals: ["Finish full-stack project integration with Docker orchestration"]
    },
    plan90Day: {
      dailyTasks: ["Revise System Design microservice caching", "Solve 1 Medium Graph test", "Tailor CV against live JD lists"],
      weeklyTasks: ["Book 1 mentorship session review", "Complete mock recruiter test simulation"],
      monthlyGoals: ["Reach placement ready level with premium portfolio reviews"]
    }
  },
  achievements: [
    { title: "Roadmap Starter", description: "Created first AI-customized career path roadmap.", unlocked: true },
    { title: "Skill Master", description: "Completed at least 4 core roadmap learning path check-offs.", unlocked: false },
    { title: "Project Builder", description: "Built and registered a high-impact portfolio recommended project.", unlocked: false },
    { title: "Interview Ready", description: "Achieved average mock interview rating above 70%.", unlocked: false },
    { title: "Placement Ready", description: "Reached 80%+ on overall career readiness tracker index.", unlocked: false }
  ]
};

interface CareerRoadmapNavigatorProps {
  targetRole?: string;
  onRoleChange?: (role: string) => void;
}

export default function CareerRoadmapNavigator({ targetRole: parentRole, onRoleChange }: CareerRoadmapNavigatorProps) {
  const [localRole, setLocalRole] = useState<string>("Software Engineer");
  const selectedRole = parentRole || localRole;

  const [activeSubTab, setActiveSubTab] = useState<string>("diagnostic");
  
  const [roadmapData, setRoadmapData] = useState<RoadmapData>(DEFAULT_ROADMAP_DATA);
  const [prevRole, setPrevRole] = useState<string>(selectedRole);

  const [userId, setUserId] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
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

  // Fetch roadmap data and checked steps from Supabase/localStorage
  useEffect(() => {
    async function loadRoadmapAndProgress() {
      let loadedRoadmap = DEFAULT_ROADMAP_DATA;
      if (userId) {
        const dbProfile = await getUserProfile(userId);
        if (dbProfile && dbProfile.raw_profile_data && dbProfile.raw_profile_data[`roadmap_data_${selectedRole}`]) {
          loadedRoadmap = dbProfile.raw_profile_data[`roadmap_data_${selectedRole}`];
        } else {
          const cached = localStorage.getItem(`roadmap_data_${selectedRole}`);
          if (cached) {
            try { loadedRoadmap = JSON.parse(cached); } catch {}
          }
        }
      } else {
        const cached = localStorage.getItem(`roadmap_data_${selectedRole}`);
        if (cached) {
          try { loadedRoadmap = JSON.parse(cached); } catch {}
        }
      }
      setRoadmapData(loadedRoadmap);

      if (userId) {
        const progress = await getRoadmapProgress(userId);
        const loadedChecked: Record<string, boolean> = {};
        progress.forEach(item => {
          loadedChecked[item.step_name] = item.completed;
        });
        setCheckedItems(loadedChecked);
      } else {
        const savedProgress = localStorage.getItem("roadmap_progress_states");
        if (savedProgress) {
          try { setCheckedItems(JSON.parse(savedProgress)); } catch {}
        } else {
          setCheckedItems({});
        }
      }
    }
    loadRoadmapAndProgress();
  }, [userId, selectedRole]);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genStep, setGenStep] = useState<string>("");
  const [genError, setGenError] = useState<string | null>(null);

  // Loaded statistics from localStorage
  const [workspaceStats] = useState(() => {
    let ats = 0;
    let resumeText = "";
    let jd = 0;
    let interviewAvg = 50;

    if (typeof window !== "undefined") {
      const savedSnapshots = localStorage.getItem("resume_os_snapshots");
      if (savedSnapshots) {
        try {
          const list = JSON.parse(savedSnapshots);
          if (list.length > 0) {
            const latest = list[list.length - 1];
            ats = latest.atsScore || 0;
            resumeText = latest.rawText || "";
          }
        } catch {}
      } else {
        ats = Number(localStorage.getItem("ats_score") || "0");
        resumeText = localStorage.getItem("last_analyzed_resume_text") || "";
      }

      const jdHistory = localStorage.getItem("jd_match_history");
      if (jdHistory) {
        try {
          const list = JSON.parse(jdHistory);
          if (list.length > 0) {
            jd = list[0].score || 0;
          }
        } catch {}
      }

      const interviewHistory = localStorage.getItem("interview_history");
      if (interviewHistory) {
        try {
          const list = JSON.parse(interviewHistory);
          if (list.length > 0) {
            const sum = list.reduce((acc: number, curr: { overallScore?: number }) => acc + (curr.overallScore || 0), 0);
            interviewAvg = Math.round(sum / list.length);
          }
        } catch {}
      }
    }

    return {
      atsScore: ats,
      jdMatchScore: jd,
      avgInterviewScore: interviewAvg,
      resumeTextLength: resumeText.length,
      resumeText: resumeText,
      completedProjectsCount: resumeText ? (resumeText.match(/project|PROJECT/g) || []).length : 1
    };
  });

  // Track checked steps and checklists
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedCompany, setSelectedCompany] = useState<string>("IBM");
  const [selectedPlanTab, setSelectedPlanTab] = useState<"30" | "60" | "90">("30");

  // Compute live progress percentage
  // Total checklist items include: all learning steps across 5 stages, and the daily tasks in 30/60/90 plans
  const learningSteps = roadmapData.stages.flatMap(st => st.steps.map(step => `step-${st.stageIndex}-${step.skillName}`));
  const dailyTasksList = [
    ...roadmapData.plan306090.plan30Day.dailyTasks.map(t => `task-30-${t}`),
    ...roadmapData.plan306090.plan60Day.dailyTasks.map(t => `task-60-${t}`),
    ...roadmapData.plan306090.plan90Day.dailyTasks.map(t => `task-90-${t}`)
  ];
  const allTrackerIds = [...learningSteps, ...dailyTasksList];
  
  const completedCount = allTrackerIds.filter(id => checkedItems[id]).length;
  const totalItemsCount = allTrackerIds.length || 1;
  const progressPercent = Math.round((completedCount / totalItemsCount) * 100);

  // Dynamic achievement unlock status based on progress and stats
  const updatedAchievements = roadmapData.achievements.map((ach) => {
    let unlocked = ach.unlocked;
    if (ach.title === "Roadmap Starter") unlocked = true;
    if (ach.title === "Skill Master") {
      const completedSteps = learningSteps.filter(id => checkedItems[id]).length;
      unlocked = completedSteps >= 4;
    }
    if (ach.title === "Project Builder") unlocked = workspaceStats.completedProjectsCount >= 2;
    if (ach.title === "Interview Ready") unlocked = workspaceStats.avgInterviewScore >= 70;
    if (ach.title === "Placement Ready") {
      const overallReadiness = Math.round(
        (workspaceStats.atsScore * 0.35) + 
        (workspaceStats.avgInterviewScore * 0.3) + 
        (workspaceStats.jdMatchScore * 0.2) + 
        (progressPercent * 0.15)
      );
      unlocked = overallReadiness >= 80;
    }
    return { ...ach, unlocked };
  });

  const toggleCheckItem = async (id: string) => {
    const isCompleted = !checkedItems[id];
    const updated = {
      ...checkedItems,
      [id]: isCompleted
    };
    setCheckedItems(updated);

    if (userId) {
      await updateRoadmapProgress(userId, selectedRole, id, isCompleted);
      calculatePRIScore(userId).catch(console.error);
    } else {
      calculatePRIScore("guest-user").catch(console.error);
    }
    
    if (typeof window !== "undefined") {
      localStorage.setItem("roadmap_progress_states", JSON.stringify(updated));
      // Save stats to update workspace daily goals checklist sync
      const savedGoals = localStorage.getItem("completed_daily_goals");
      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          parsed["goal-3"] = progressPercent >= 30; // sync goal-3 "Complete 1 Section in Roadmap"
          localStorage.setItem("completed_daily_goals", JSON.stringify(parsed));
        } catch {}
      }
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setGenError(null);

    const steps = [
      "Analyzing ATS Scan profile index...",
      "Matching required target role requirements...",
      "Evaluating interview transcript performance gaps...",
      "Extracting current skills from resume text...",
      "Structuring progressive learning phases (Stages 1-5)...",
      "Selecting customized document & practice platforms resources...",
      "Configuring IBM, TCS, & Deloitte readiness thresholds...",
      "Assembling interactive 30/60/90 day action plan..."
    ];

    const stepsPromise = (async () => {
      for (const step of steps) {
        setGenStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    })();

    try {
      const savedKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      
      const res = await fetch("/api/resume/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": savedKey
        },
        body: JSON.stringify({
          targetRole: selectedRole,
          resumeText: workspaceStats.resumeText,
          averageInterviewScore: workspaceStats.avgInterviewScore,
          atsScore: workspaceStats.atsScore,
          completedProjects: workspaceStats.completedProjectsCount
        })
      });

      const responseData = await res.json();
      await stepsPromise;

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to generate AI roadmap.");
      }

      const freshRoadmap = responseData.data;
      setRoadmapData(freshRoadmap);
      
      if (typeof window !== "undefined") {
        localStorage.setItem(`roadmap_data_${selectedRole}`, JSON.stringify(freshRoadmap));
      }

      if (userId) {
        const dbProfile = await getUserProfile(userId);
        const existingRaw = dbProfile?.raw_profile_data || {};
        await upsertUserProfile(userId, {
          ...existingRaw,
          [`roadmap_data_${selectedRole}`]: freshRoadmap
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please check your Gemini API key configuration.";
      setGenError(errMsg);
    } finally {
      setIsGenerating(false);
      setGenStep("");
    }
  };

  const activeCompany = roadmapData.companyRoadmaps.find(c => c.companyName === selectedCompany) || roadmapData.companyRoadmaps[0];

  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes("beginner")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (d.includes("intermediate")) return "text-blue-600 bg-blue-50 border-blue-100";
    return "text-indigo-600 bg-indigo-50 border-indigo-100";
  };

  const getPriorityColor = (prio: string) => {
    const p = prio.toLowerCase();
    if (p === "high") return "text-rose-600 bg-rose-50 border-rose-100";
    if (p === "medium") return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-slate-500 bg-slate-50 border-slate-100";
  };

  return (
    <div className="space-y-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Compass className="w-3.5 h-3.5" />
            AI Career Navigator
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Personalized Career Roadmap
          </h1>
          <p className="text-slate-500 font-medium text-base leading-relaxed">
            Generate dynamic learning sequences tailored to your target role, skill gaps, resume text compatibility index, and simulated interview metrics.
          </p>
        </div>

        {/* Generate Button and Role Selector */}
        <div className="w-full md:w-auto p-4 bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Target Track</span>
            <select
              value={selectedRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setLocalRole(newRole);
                if (onRoleChange) onRoleChange(newRole);
              }}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
            >
              {SUPPORTED_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateRoadmap}
            disabled={isGenerating}
            className="px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg self-end"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Regenerate AI Track</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GENERATION STATE / LOADER CHECK */}
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
            </div>
            <div className="space-y-2 z-10">
              <h3 className="text-xl font-black font-display">Personalizing Your Career Path</h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{genStep}</p>
            </div>
            <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed z-10">
              Gemini is auditing your ATS rating ({workspaceStats.atsScore}%) and Interview Score ({workspaceStats.avgInterviewScore}%) to build your learning milestone goals.
            </p>
          </motion.div>
        )}

        {!isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            {/* ERROR NOTIFICATION */}
            {genError && (
              <div className="p-5 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-start gap-3.5 text-sm font-semibold leading-relaxed shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <strong className="block mb-0.5 text-red-800">API Call Failed</strong>
                  {genError}
                  <p className="text-[10px] text-slate-400 font-bold mt-2">
                    Tip: Verify your API key is correctly saved inside local storage settings under the ATS or JD Matcher tab inputs.
                  </p>
                </div>
              </div>
            )}

            {/* INNER NAVIGATION SUB-TABS */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {[
                { id: "diagnostic", label: "Diagnostic Report", icon: <Target className="w-4 h-4" /> },
                { id: "roadmap", label: `Roadmap Stages (${progressPercent}% Complete)`, icon: <Layers className="w-4 h-4" /> },
                { id: "projects", label: "Project Advisor", icon: <Briefcase className="w-4 h-4" /> },
                { id: "resources", label: "Resource Library", icon: <BookOpen className="w-4 h-4" /> },
                { id: "company", label: "Company Tracks", icon: <Sparkles className="w-4 h-4" /> },
                { id: "plan", label: "30/60/90 Day Plan", icon: <Calendar className="w-4 h-4" /> },
                { id: "achievements", label: "Milestones", icon: <Award className="w-4 h-4" /> }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border",
                    activeSubTab === sub.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  )}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}

            {/* 1. CAREER DIAGNOSTIC */}
            {activeSubTab === "diagnostic" && (
              <div className="space-y-8 animate-fade-in">
                {/* Readiness predictors gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Interview Readiness", val: roadmapData.readinessPredictions.interviewReadiness, desc: "Mock test performance rating", color: "text-indigo-600" },
                    { label: "Placement Readiness", val: roadmapData.readinessPredictions.placementReadiness, desc: "Overall structural portfolio checklist", color: "text-emerald-600" },
                    { label: "Industry Readiness", val: roadmapData.readinessPredictions.industryReadiness, desc: "Relevance of core tech stack", color: "text-purple-600" }
                  ].map((gauge, gIdx) => (
                    <div key={gIdx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6">
                      <div className="space-y-1">
                        <strong className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-tight">{gauge.label}</strong>
                        <p className="text-xs text-slate-400 font-bold">{gauge.desc}</p>
                      </div>
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="32" className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                          <circle cx="40" cy="40" r="32" className={gauge.color} strokeWidth="6" stroke="currentColor" fill="transparent"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - gauge.val / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-base font-black text-slate-900">{gauge.val}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skill Gap Analysis row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Strong skills (Green) */}
                  <div className="bg-emerald-50/30 border border-emerald-100 p-8 rounded-[2.5rem] space-y-4">
                    <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ✓ Strong Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.skillGap.strong.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white border border-emerald-100 text-emerald-700 text-xs font-black rounded-xl shadow-sm">
                          {skill}
                        </span>
                      ))}
                      {roadmapData.skillGap.strong.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold">No strong skills identified. Complete scans to load.</p>
                      )}
                    </div>
                  </div>

                  {/* Missing skills (Blue) */}
                  <div className="bg-blue-50/20 border border-blue-100 p-8 rounded-[2.5rem] space-y-4">
                    <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-blue-500" />
                      ✗ Missing Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.skillGap.missing.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white border border-blue-100 text-blue-700 text-xs font-black rounded-xl shadow-sm">
                          {skill}
                        </span>
                      ))}
                      {roadmapData.skillGap.missing.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold">No missing skills detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Critical missing skills (Red) */}
                  <div className="bg-rose-50/20 border border-rose-100 p-8 rounded-[2.5rem] space-y-4">
                    <h3 className="text-sm font-black text-rose-800 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      ⚠️ Critical Missing
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.skillGap.critical.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white border border-rose-100 text-rose-700 text-xs font-black rounded-xl shadow-sm">
                          {skill}
                        </span>
                      ))}
                      {roadmapData.skillGap.critical.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold">No critical blockages detected!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Feedback audit boxes */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Career Readiness Audit Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Track Overview</span>
                        <p className="text-sm text-slate-600 font-semibold leading-relaxed">{roadmapData.careerReadinessReport.overview}</p>
                      </div>
                      <div className="pt-4 md:pt-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resume & ATS Diagnostics</span>
                        <p className="text-sm text-slate-600 font-semibold leading-relaxed">{roadmapData.careerReadinessReport.resumeDiagnostics}</p>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 md:pt-0 md:pl-8">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mock Interview Performance Review</span>
                        <p className="text-sm text-slate-600 font-semibold leading-relaxed">{roadmapData.careerReadinessReport.interviewFeedback}</p>
                      </div>
                      <div className="pt-4 md:pt-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Portfolio & Project Pipeline feedback</span>
                        <p className="text-sm text-slate-600 font-semibold leading-relaxed">{roadmapData.careerReadinessReport.portfolioFeedback}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ROADMAP VISUALIZER */}
            {activeSubTab === "roadmap" && (
              <div className="space-y-12 animate-fade-in">
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Interactive Progress</span>
                    <p className="text-base font-black text-slate-800 mt-1">{progressPercent}% of learning steps completed</p>
                  </div>
                  <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="relative border-l-2 border-emerald-100 ml-4 pl-8 space-y-12 py-4">
                  {roadmapData.stages.map((stage) => (
                    <div key={stage.stageIndex} className="relative group">
                      {/* Timeline Stage Dot */}
                      <div className={cn(
                        "absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 border-white shadow flex items-center justify-center transition-all",
                        stage.steps.every(s => checkedItems[`step-${stage.stageIndex}-${s.skillName}`]) ? "bg-emerald-600" : "bg-slate-300"
                      )} />

                      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm group-hover:border-emerald-200 transition-all space-y-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                            {stage.stageName}
                          </span>
                        </div>

                        {/* Learning Steps inside Stage */}
                        <div className="space-y-4">
                          {stage.steps.map((step, sIdx) => {
                            const stepId = `step-${stage.stageIndex}-${step.skillName}`;
                            const isCompleted = checkedItems[stepId] || false;
                            
                            return (
                              <div
                                key={sIdx}
                                onClick={() => toggleCheckItem(stepId)}
                                className={cn(
                                  "p-4 border rounded-2xl cursor-pointer flex items-start justify-between gap-4 transition-all select-none",
                                  isCompleted
                                    ? "bg-emerald-50/30 border-emerald-200 text-slate-800"
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                                )}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <strong className="text-sm font-black text-slate-800">{step.skillName}</strong>
                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider", getDifficultyColor(step.difficulty))}>
                                      {step.difficulty}
                                    </span>
                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider", getPriorityColor(step.priority))}>
                                      {step.priority}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">Time: {step.estimatedTime}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-bold leading-relaxed">{step.whyItMatters}</p>
                                </div>
                                
                                <div className="shrink-0 pt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PROJECT LIBRARY */}
            {activeSubTab === "projects" && (
              <div className="space-y-8 animate-fade-in">
                <div className="max-w-xl space-y-2">
                  <h3 className="text-xl font-black text-slate-900 font-display">Specialized Project Recommendations</h3>
                  <p className="text-xs text-slate-400 font-bold">Build high-attraction portfolios based on current recruiter standards for {selectedRole} drives.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {roadmapData.projects.map((proj, pIdx) => (
                    <div key={pIdx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between gap-6 hover:border-emerald-300 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border", getDifficultyColor(proj.difficulty))}>
                            {proj.difficulty}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-indigo-300 font-black uppercase tracking-widest rounded">
                            Value: {proj.portfolioValue}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 leading-snug">{proj.title}</h4>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">{proj.desc}</p>
                      </div>

                      {/* Ratings gauges row */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Resume Impact</span>
                          <strong className="text-lg font-black text-indigo-600">{proj.impactScore}%</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attraction score</span>
                          <strong className="text-lg font-black text-emerald-600">{proj.recruiterAttractionScore}%</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. RESOURCE CATALOG */}
            {activeSubTab === "resources" && (
              <div className="space-y-8 animate-fade-in">
                <div className="max-w-xl space-y-2">
                  <h3 className="text-xl font-black text-slate-900 font-display">Curated Learning Library</h3>
                  <p className="text-xs text-slate-400 font-bold">Interactive practice platforms, official documentation, and YouTube video tracks mapped by difficulty.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => {
                    const filtered = roadmapData.resources.filter(r => r.difficulty.toLowerCase().includes(level.toLowerCase()));
                    
                    return (
                      <div key={level} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                        <span className={cn("text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest border inline-block", getDifficultyColor(level))}>
                          {level} Level
                        </span>

                        <div className="space-y-3">
                          {filtered.map((res, rIdx) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-all group"
                            >
                              <div className="overflow-hidden">
                                <strong className="text-xs font-black text-slate-800 truncate block group-hover:text-indigo-600 transition-colors">
                                  {res.title}
                                </strong>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                                  Type: {res.type}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                            </a>
                          ))}
                          {filtered.length === 0 && (
                            <p className="text-xs text-slate-400 font-bold text-center py-6">No resources recommended for this level.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. COMPANY READY DASHBOARD */}
            {activeSubTab === "company" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                {/* Selectors grid (Left) */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-900 font-display">Target Recruiter Drives</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {roadmapData.companyRoadmaps.map((comp) => (
                      <button
                        key={comp.companyName}
                        onClick={() => setSelectedCompany(comp.companyName)}
                        className={cn(
                          "py-3 border rounded-xl text-xs font-black transition-all cursor-pointer",
                          selectedCompany === comp.companyName
                            ? "bg-slate-900 border-slate-900 text-indigo-300"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                        )}
                      >
                        {comp.companyName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap diagnostics (Right) */}
                {activeCompany && (
                  <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Drive Profile</span>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{activeCompany.companyName} Match</h4>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Core Gaps (Needs Improvement)</span>
                        <div className="flex flex-wrap gap-2">
                          {activeCompany.needImprovementIn.map((gap, gIdx) => (
                            <span key={gIdx} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-black rounded-xl border border-rose-100 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Circular Match Gauge */}
                    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center bg-slate-50 rounded-full border border-slate-100">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="44" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                        <circle cx="56" cy="56" r="44" className="text-indigo-600" strokeWidth="8" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 * (1 - activeCompany.matchPercentage / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-lg font-black text-slate-800">{activeCompany.matchPercentage}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. 30/60/90 PLAN */}
            {activeSubTab === "plan" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div className="flex gap-2">
                    {["30", "60", "90"].map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedPlanTab(period as "30" | "60" | "90")}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border",
                          selectedPlanTab === period
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {period} Day Plan
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Goals List</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Daily Tasks */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <span className="text-[9px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded font-black uppercase tracking-widest">
                      Daily Tasks Checklist
                    </span>
                    <div className="space-y-3">
                      {(selectedPlanTab === "30" ? roadmapData.plan306090.plan30Day.dailyTasks :
                        selectedPlanTab === "60" ? roadmapData.plan306090.plan60Day.dailyTasks :
                        roadmapData.plan306090.plan90Day.dailyTasks).map((task) => {
                          const taskId = `task-${selectedPlanTab}-${task}`;
                          const isDone = checkedItems[taskId] || false;
                          
                          return (
                            <div
                              key={task}
                              onClick={() => toggleCheckItem(taskId)}
                              className={cn(
                                "p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none text-xs font-bold leading-relaxed",
                                isDone
                                  ? "bg-emerald-50/20 border-emerald-100 text-slate-700"
                                  : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/50"
                              )}
                            >
                              <span>{task}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Weekly Tasks */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded font-black uppercase tracking-widest">
                      Weekly Focus Check
                    </span>
                    <div className="space-y-3">
                      {(selectedPlanTab === "30" ? roadmapData.plan306090.plan30Day.weeklyTasks :
                        selectedPlanTab === "60" ? roadmapData.plan306090.plan60Day.weeklyTasks :
                        roadmapData.plan306090.plan90Day.weeklyTasks).map((task, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 leading-normal flex items-start gap-2">
                            <span className="text-emerald-500 font-black">●</span>
                            <span>{task}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Monthly Goals */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
                    <span className="text-[9px] px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-600 rounded font-black uppercase tracking-widest">
                      Monthly Milestone Target
                    </span>
                    <div className="space-y-3">
                      {(selectedPlanTab === "30" ? roadmapData.plan306090.plan30Day.monthlyGoals :
                        selectedPlanTab === "60" ? roadmapData.plan306090.plan60Day.monthlyGoals :
                        roadmapData.plan306090.plan90Day.monthlyGoals).map((goal, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 leading-normal flex items-start gap-2">
                            <span className="text-purple-500 font-black">✓</span>
                            <span>{goal}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. MILESTONES & ACHIEVEMENTS */}
            {activeSubTab === "achievements" && (
              <div className="space-y-8 animate-fade-in">
                <div className="max-w-xl space-y-2">
                  <h3 className="text-xl font-black text-slate-900 font-display">Unlockable Career Milestones</h3>
                  <p className="text-xs text-slate-400 font-bold">Earn achievements automatically as you update resume files, complete roadmap stages, or mock interviews.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {updatedAchievements.map((ach) => (
                    <div
                      key={ach.title}
                      className={cn(
                        "p-6 border rounded-[2rem] flex gap-4 transition-all relative overflow-hidden",
                        ach.unlocked
                          ? "bg-emerald-50/20 border-emerald-200 text-slate-800"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-inner shrink-0 border border-slate-100">
                        {ach.unlocked ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Award className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <strong className="text-sm font-black text-slate-800 leading-tight block">{ach.title}</strong>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
