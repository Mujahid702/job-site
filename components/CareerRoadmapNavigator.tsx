"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getRoadmapProgress, updateRoadmapProgress } from "@/lib/db/roadmaps";
import { getUserProfile, upsertUserProfile } from "@/lib/db/profiles";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { TRACK_PRESETS, TrackPreset } from "@/lib/career-roadmap-presets";

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
  BookOpen,
  MessageSquare,
  Trophy,
  Lock,
  PlayCircle,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces
interface StageResource {
  title: string;
  url: string;
  type: string;
}

interface ActionTask {
  taskName: string;
  status: "Pending" | "In Progress" | "Completed";
  verificationStatus: string;
  xpReward: number;
}

interface RoadmapStage {
  stageName: string;
  stageIndex: number;
  estimatedDuration: string;
  difficulty: string;
  expectedOutcome: string;
  skillsCovered: string[];
  recruiterImportance: string;
  learningResources: StageResource[];
  actionChecklist: ActionTask[];
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
  thinking?: string;
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
  stages: any[]; // Normalize inline when rendering/mapping
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

// Stage Normalization Helper to map legacy models into dynamic stage checkpoints
function normalizeStage(stage: any): RoadmapStage {
  if (!stage) {
    return {
      stageName: "Unknown Stage",
      stageIndex: 0,
      estimatedDuration: "10 Days",
      difficulty: "Beginner",
      expectedOutcome: "Foundation cleared.",
      skillsCovered: [],
      recruiterImportance: "High",
      learningResources: [],
      actionChecklist: []
    };
  }

  // If already in new format:
  if (stage.actionChecklist && Array.isArray(stage.actionChecklist)) {
    return {
      stageName: stage.stageName,
      stageIndex: stage.stageIndex,
      estimatedDuration: stage.estimatedDuration || "10 Days",
      difficulty: stage.difficulty || "Intermediate",
      expectedOutcome: stage.expectedOutcome || "Practical skills acquired.",
      skillsCovered: stage.skillsCovered || [],
      recruiterImportance: stage.recruiterImportance || "High",
      learningResources: stage.learningResources || [],
      actionChecklist: stage.actionChecklist
    };
  }

  // Fallback map legacy steps format to structured checklist items
  const steps = stage.steps || [];
  const skillsCovered = steps.map((s: any) => s.skillName);
  
  const actionChecklist = steps.map((s: any, idx: number) => {
    let verify = "Self-Reported";
    const nameLower = s.skillName.toLowerCase();
    if (nameLower.includes("resume") || nameLower.includes("ats")) verify = "Verifies via Resume OS score";
    else if (nameLower.includes("interview") || nameLower.includes("star") || nameLower.includes("mock")) verify = "Verifies via AI Mock Interview";
    else if (nameLower.includes("project") || nameLower.includes("portfolio")) verify = "Verifies via Project OS upload";
    else if (nameLower.includes("sql") || nameLower.includes("coding") || nameLower.includes("dsa") || nameLower.includes("oop") || nameLower.includes("react")) verify = "Verifies via Assessment OS score";

    return {
      taskName: `Master ${s.skillName}: ${s.whyItMatters}`,
      status: "Pending",
      verificationStatus: verify,
      xpReward: idx === 0 ? 150 : 200
    };
  });

  const learningResources = [
    { title: `${stage.stageName} Official Docs`, url: "https://roadmap.sh", type: "Documentation" },
    { title: `${stage.stageName} Practice Portal`, url: "https://leetcode.com", type: "Practice Site" }
  ];

  return {
    stageName: stage.stageName,
    stageIndex: stage.stageIndex,
    estimatedDuration: stage.steps?.[0]?.estimatedTime || "12 Days",
    difficulty: stage.steps?.[0]?.difficulty || "Intermediate",
    expectedOutcome: `Successfully acquire foundational expertise in ${skillsCovered.slice(0, 2).join(" and ")}.`,
    skillsCovered,
    recruiterImportance: stage.steps?.[0]?.priority || "High",
    learningResources,
    actionChecklist
  };
}

function getStageTrackerIds(stages: any[], plan306090: any) {
  const learning = (stages || []).flatMap(st => {
    const norm = normalizeStage(st);
    return norm.actionChecklist.map(task => `task-${st.stageIndex}-${task.taskName}`);
  });
  const tasks = [
    ...(plan306090?.plan30Day?.dailyTasks || []).map((t: string) => `task-30-${t}`),
    ...(plan306090?.plan60Day?.dailyTasks || []).map((t: string) => `task-60-${t}`),
    ...(plan306090?.plan90Day?.dailyTasks || []).map((t: string) => `task-90-${t}`)
  ];
  return [...learning, ...tasks];
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

// Helper to get matching preset based on substring mapping
function getActivePreset(role: string): TrackPreset {
  if (TRACK_PRESETS[role]) {
    return TRACK_PRESETS[role];
  }
  if (role.includes("Frontend")) return TRACK_PRESETS["Frontend Developer"];
  if (role.includes("Backend")) return TRACK_PRESETS["Backend Developer"];
  if (role.includes("Full Stack") || role.includes("Software")) return TRACK_PRESETS["Software Engineer"];
  if (role.includes("Data Scientist") || role.includes("Machine Learning") || role.includes("AI")) {
    if (role.includes("Data Scientist")) return TRACK_PRESETS["Data Scientist"];
    return TRACK_PRESETS["AI Engineer"];
  }
  if (role.includes("Data Analyst") || role.includes("Business Analyst") || role.includes("Product Analyst")) {
    return TRACK_PRESETS["Data Analyst"];
  }
  if (role.includes("Cloud") || role.includes("DevOps")) return TRACK_PRESETS["Cloud Engineer"];
  if (role.includes("UI") || role.includes("UX") || role.includes("Designer")) return TRACK_PRESETS["UI/UX Designer"];
  if (role.includes("Product Manager")) return TRACK_PRESETS["Product Manager"];
  
  return TRACK_PRESETS["Software Engineer"];
}

// Live Resume-Aware Skill Extraction
const extractResumeSkills = (resumeText: string, allPossibleSkills: string[]): string[] => {
  if (!resumeText) return [];
  const normalizedText = resumeText.toLowerCase();
  
  return allPossibleSkills.filter(skill => {
    const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (skill.length <= 2) {
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      return regex.test(normalizedText);
    }
    if (skill.includes('+') || skill.includes('.') || skill.includes('#')) {
      return normalizedText.includes(skill.toLowerCase());
    }
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    return regex.test(normalizedText);
  });
};

// Dynamic Company Match Calculator
const getCompanyTracks = (role: string, strongSkills: string[], missingSkills: string[]): CompanyTrack[] => {
  const companies = [
    { name: "IBM", weight: 0.8 },
    { name: "TCS", weight: 0.85 },
    { name: "Deloitte", weight: 0.75 },
    { name: "Accenture", weight: 0.8 },
    { name: "Capgemini", weight: 0.75 },
    { name: "Cognizant", weight: 0.82 },
    { name: "Wipro", weight: 0.7 },
    { name: "Infosys", weight: 0.84 },
    { name: "HCLTech", weight: 0.72 }
  ];

  const getCompanySkillsForRole = (companyName: string, roleName: string): string[] => {
    const isData = roleName.includes("Data") || roleName.includes("AI") || roleName.includes("Machine");
    const isCloud = roleName.includes("Cloud") || roleName.includes("DevOps");
    const isDesign = roleName.includes("UI") || roleName.includes("UX") || roleName.includes("Designer");
    const isPM = roleName.includes("Product Manager");

    if (isData) {
      switch (companyName) {
        case "IBM": return ["Python", "SQL", "Machine Learning", "Tableau"];
        case "TCS": return ["Python", "SQL", "Statistics Basics", "Excel"];
        case "Infosys": return ["Python", "SQL", "Pandas", "Machine Learning models"];
        case "Accenture": return ["Python", "SQL", "Power BI", "Data Visualization"];
        case "Deloitte": return ["SQL", "Tableau", "Statistics Basics", "A/B Testing"];
        case "Capgemini": return ["SQL", "Python", "Data Cleaning"];
        case "Cognizant": return ["SQL", "Python", "Excel (VLOOKUP, Pivot Tables)", "Power BI"];
        case "Wipro": return ["SQL", "Excel (VLOOKUP, Pivot Tables)", "Data Visualization"];
        case "HCLTech": return ["SQL", "Python", "Tableau"];
        default: return ["SQL", "Python", "Statistics Basics"];
      }
    } else if (isCloud) {
      switch (companyName) {
        case "IBM": return ["AWS", "Docker", "Kubernetes", "Linux CLI"];
        case "TCS": return ["AWS", "Linux CLI", "Bash Scripting", "Git"];
        case "Infosys": return ["AWS", "Docker", "Linux CLI", "CI/CD Pipelines (GitHub Actions/Jenkins)"];
        case "Accenture": return ["AWS", "Terraform (IaC)", "CI/CD Pipelines (GitHub Actions/Jenkins)"];
        case "Deloitte": return ["AWS", "Linux CLI", "Terraform (IaC)", "Prometheus"];
        case "Capgemini": return ["AWS", "Docker", "Kubernetes"];
        case "Cognizant": return ["AWS", "Linux CLI", "CI/CD Pipelines (GitHub Actions/Jenkins)", "Git"];
        case "Wipro": return ["AWS", "Linux CLI", "Docker", "Git"];
        case "HCLTech": return ["Linux CLI", "AWS", "Networking (VPC, DNS, Load Balancers)"];
        default: return ["AWS", "Linux CLI", "Docker"];
      }
    } else if (isDesign) {
      switch (companyName) {
        case "IBM": return ["Figma", "Design Systems", "User Research", "Heuristic Evaluation"];
        case "TCS": return ["Figma", "Wireframing", "User Research"];
        case "Infosys": return ["Figma", "Design Systems", "Prototyping"];
        case "Accenture": return ["Figma", "User Research", "Wireframing"];
        case "Deloitte": return ["Figma", "User Research", "Information Architecture"];
        case "Capgemini": return ["Figma", "Wireframing", "Prototyping"];
        case "Cognizant": return ["Figma", "User Research", "Design Systems"];
        case "Wipro": return ["Figma", "Wireframing", "UI Design Principles"];
        case "HCLTech": return ["Figma", "Prototyping", "Wireframing"];
        default: return ["Figma", "Wireframing", "User Research"];
      }
    } else if (isPM) {
      switch (companyName) {
        case "IBM": return ["Product Strategy", "Agile Methodologies (Scrum)", "KPI Definition", "SQL Basics"];
        case "TCS": return ["Product Strategy", "Agile Methodologies (Scrum)", "Market Research"];
        case "Infosys": return ["Agile Methodologies (Scrum)", "Product Strategy", "Roadmapping (Jira)"];
        case "Accenture": return ["Agile Methodologies (Scrum)", "KPI Definition", "Product Strategy"];
        case "Deloitte": return ["Product Strategy", "KPI Definition", "A/B Testing Basics"];
        case "Capgemini": return ["Agile Methodologies (Scrum)", "User Analytics", "Roadmapping (Jira)"];
        case "Cognizant": return ["Agile Methodologies (Scrum)", "Roadmapping (Jira)", "KPI Definition"];
        case "Wipro": return ["Agile Methodologies (Scrum)", "Product Strategy", "Market Research"];
        case "HCLTech": return ["Agile Methodologies (Scrum)", "KPI Definition", "SQL Basics"];
        default: return ["Product Strategy", "Agile Methodologies (Scrum)", "KPI Definition"];
      }
    } else {
      switch (companyName) {
        case "IBM": return ["Java", "SQL Schema Design", "OOP Principles", "Docker"];
        case "TCS": return ["Java", "Python", "SQL Schema Design", "Git"];
        case "Infosys": return ["Java", "OOP Principles", "Python", "SQL Schema Design"];
        case "Accenture": return ["Java", "SQL Schema Design", "REST APIs"];
        case "Deloitte": return ["SQL Schema Design", "OOP Principles", "Git"];
        case "Capgemini": return ["Data Structures & Algorithms", "OOP Principles", "JavaScript"];
        case "Cognizant": return ["SQL Schema Design", "DBMS", "Java", "JavaScript"];
        case "Wipro": return ["SQL Schema Design", "Data Structures & Algorithms", "HTML5", "CSS3"];
        case "HCLTech": return ["Data Structures & Algorithms", "SQL Schema Design", "Git"];
        default: return ["Java", "SQL Schema Design", "OOP Principles"];
      }
    }
  };

  return companies.map(c => {
    const targetSkills = getCompanySkillsForRole(c.name, role);
    const matches = targetSkills.filter(ts => 
      strongSkills.some(ss => ss.toLowerCase().includes(ts.toLowerCase()) || ts.toLowerCase().includes(ss.toLowerCase()))
    );

    const matchPercentage = targetSkills.length > 0 
      ? Math.round((matches.length / targetSkills.length) * 40 + (c.weight * 60)) 
      : 70;

    const needImprovementIn = targetSkills.filter(ts => 
      !strongSkills.some(ss => ss.toLowerCase().includes(ts.toLowerCase()) || ts.toLowerCase().includes(ss.toLowerCase()))
    );

    const finalImprovements = needImprovementIn.length > 0 
      ? needImprovementIn 
      : missingSkills.slice(0, 2);

    return {
      companyName: c.name,
      matchPercentage: Math.min(98, Math.max(45, matchPercentage)),
      needImprovementIn: finalImprovements.length > 0 ? finalImprovements : ["Advanced scaling", "System optimizations"]
    };
  });
};

// Compile dynamic initial state roadmap data based on the chosen role
const getInitialRoadmap = (role: string, resumeText: string, stats: any, progressPercentVal: number): RoadmapData => {
  const preset = getActivePreset(role);
  
  const required = preset.requiredSkills;
  const strong = required.filter(s => {
    if (!resumeText) return false;
    const normalizedText = resumeText.toLowerCase();
    const escapedSkill = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (s.length <= 2) {
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      return regex.test(normalizedText);
    }
    if (s.includes('+') || s.includes('.') || s.includes('#')) {
      return normalizedText.includes(s.toLowerCase());
    }
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    return regex.test(normalizedText);
  });
  const missingAll = required.filter(s => !strong.includes(s));
  
  const coreFoundations = ["SQL", "Data Structures & Algorithms", "DSA", "Excel", "Figma", "HTML5", "CSS3", "Python", "Java", "JavaScript", "TypeScript", "OOP Principles", "Product Strategy", "User Research", "AWS", "Linux CLI"];
  let critical = missingAll.filter(s => coreFoundations.some(c => s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase())));
  let missing = missingAll.filter(s => !critical.includes(s));
  
  if (critical.length === 0 && missingAll.length > 0) {
    critical = missingAll.slice(0, 2);
    missing = missingAll.slice(2);
  }

  const strongRatio = required.length > 0 ? strong.length / required.length : 0.5;
  const interviewReadiness = Math.min(95, Math.max(30, Math.round((stats.avgInterviewScore * 0.7) + (strongRatio * 30))));
  const placementReadiness = Math.min(95, Math.max(35, Math.round((stats.atsScore * 0.5) + (stats.completedProjectsCount >= 2 ? 25 : 10) + (progressPercentVal * 0.2))));
  const industryReadiness = Math.min(95, Math.max(40, Math.round(40 + (strongRatio * 55))));

  const companyRoadmaps = getCompanyTracks(role, strong, missingAll);

  const achievements = [
    { title: "Roadmap Starter", description: "Created first AI-customized career path roadmap.", unlocked: true },
    { title: "Skill Master", description: "Completed at least 4 core roadmap learning path check-offs.", unlocked: false },
    { title: "Project Builder", description: "Built and registered a high-impact portfolio recommended project.", unlocked: false },
    { title: "Interview Ready", description: "Achieved average mock interview rating above 70%.", unlocked: false },
    { title: "Placement Ready", description: "Reached 80%+ on overall career readiness tracker index.", unlocked: false }
  ];

  return {
    careerReadinessReport: preset.careerReadinessReport,
    readinessPredictions: {
      interviewReadiness,
      placementReadiness,
      industryReadiness
    },
    skillGap: {
      strong,
      missing,
      critical
    },
    stages: preset.stages,
    resources: preset.resources,
    projects: preset.projects,
    companyRoadmaps,
    plan306090: preset.plan306090,
    achievements
  };
};

const DEFAULT_ROADMAP_DATA = getInitialRoadmap("Software Engineer", "", { avgInterviewScore: 50, atsScore: 0, completedProjectsCount: 1 }, 0);

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

  // Accordion Expander State
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({ 1: true });

  // Copied Clipboard Indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Coach Sidebar State
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [coachStage, setCoachStage] = useState<any>(null);
  const [coachTask, setCoachTask] = useState<any>(null);
  const [coachMessages, setCoachMessages] = useState<any[]>([
    { role: "assistant", content: "Hi! I am your Placement Coach. How can I help you clear this roadmap stage?" }
  ]);
  const [coachInput, setCoachInput] = useState<string>("");
  const [coachLoading, setCoachLoading] = useState<boolean>(false);

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
      // 1. First, load checked items and compute progress metrics based on the preset to determine predictions correctly
      let loadedChecked: Record<string, boolean> = {};
      if (userId) {
        const progress = await getRoadmapProgress(userId);
        progress.forEach(item => {
          loadedChecked[item.step_name] = item.completed;
        });
      } else {
        const savedProgress = localStorage.getItem("roadmap_progress_states");
        if (savedProgress) {
          try { loadedChecked = JSON.parse(savedProgress); } catch {}
        }
      }

      const preset = getActivePreset(selectedRole);
      const trackerIds = getStageTrackerIds(preset.stages, preset.plan306090);
      const completed = trackerIds.filter(id => loadedChecked[id]).length;
      const total = trackerIds.length || 1;
      const tempProgressPercent = Math.round((completed / total) * 100);

      // 2. Load custom AI roadmap if it was saved
      let loadedRoadmap: RoadmapData | null = null;
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

      if (!loadedRoadmap) {
        loadedRoadmap = getInitialRoadmap(selectedRole, workspaceStats.resumeText, workspaceStats, tempProgressPercent);
      }
      setRoadmapData(loadedRoadmap);
      setCheckedItems(loadedChecked);
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
  const allTrackerIds = getStageTrackerIds(roadmapData.stages, roadmapData.plan306090);
  const completedCount = allTrackerIds.filter(id => checkedItems[id]).length;
  const totalItemsCount = allTrackerIds.length || 1;
  const progressPercent = Math.round((completedCount / totalItemsCount) * 100);

  // Dynamic achievement unlock status based on progress and stats
  const updatedAchievements = roadmapData.achievements.map((ach) => {
    let unlocked = ach.unlocked;
    if (ach.title === "Roadmap Starter") unlocked = true;
    if (ach.title === "Skill Master") {
      const learning = (roadmapData.stages || []).flatMap(st => {
        const norm = normalizeStage(st);
        return norm.actionChecklist.map(t => `task-${st.stageIndex}-${t.taskName}`);
      });
      const completedSteps = learning.filter(id => checkedItems[id]).length;
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

  // Identify if a task is verification-locked
  const isAutoVerified = (id: string) => {
    if (id.startsWith("task-30-") || id.startsWith("task-60-") || id.startsWith("task-90-")) {
      return false; // Plan tasks are always manual
    }
    if (!roadmapData?.stages) return false;
    for (const stage of roadmapData.stages) {
      const norm = normalizeStage(stage);
      for (const task of norm.actionChecklist) {
        const taskId = `task-${stage.stageIndex}-${task.taskName}`;
        if (taskId === id) {
          const ver = task.verificationStatus.toLowerCase();
          return ver.includes("resume") || ver.includes("ats") || ver.includes("mock") || ver.includes("interview") || ver.includes("project") || ver.includes("portfolio") || ver.includes("assessment") || ver.includes("score");
        }
      }
    }
    return false;
  };

  // Automatic Verification Sync Hook
  useEffect(() => {
    if (!roadmapData?.stages) return;
    
    let updated = false;
    const nextChecked = { ...checkedItems };

    roadmapData.stages.forEach(stage => {
      const norm = normalizeStage(stage);
      norm.actionChecklist.forEach(task => {
        const taskId = `task-${stage.stageIndex}-${task.taskName}`;
        const ver = task.verificationStatus.toLowerCase();
        
        let autoVerify = false;
        if (ver.includes("resume") || ver.includes("ats")) {
          autoVerify = workspaceStats.atsScore >= 70;
        } else if (ver.includes("mock") || ver.includes("interview")) {
          autoVerify = workspaceStats.avgInterviewScore >= 60;
        } else if (ver.includes("project") || ver.includes("portfolio")) {
          autoVerify = workspaceStats.completedProjectsCount >= 2;
        } else if (ver.includes("assessment") || ver.includes("score")) {
          autoVerify = workspaceStats.avgInterviewScore >= 50; // proxy check
        }

        // If auto-verified and unchecked, check it automatically!
        if (autoVerify && !nextChecked[taskId]) {
          nextChecked[taskId] = true;
          updated = true;
        }
      });
    });

    if (updated) {
      setCheckedItems(nextChecked);
      if (typeof window !== "undefined") {
        localStorage.setItem("roadmap_progress_states", JSON.stringify(nextChecked));
      }
    }
  }, [roadmapData, workspaceStats]);

  const toggleCheckItem = async (id: string) => {
    if (isAutoVerified(id)) {
      alert("This task is automatically verified by the platform based on your profile benchmarks (e.g., ATS Score, Mock Interviews, or Project Uploads). Manual completion is not permitted for verified steps.");
      return;
    }

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

  // AI Coach triggering context handler
  const triggerCoach = (stage: any, task?: any) => {
    const norm = normalizeStage(stage);
    setCoachStage(norm);
    setCoachTask(task || null);
    
    const contextPrompt = task
      ? `I am currently studying for the task "${task.taskName}" under Stage "${norm.stageName}" of my ${selectedRole} career path. Could you explain the concept, show its recruiter value, and outline how I can verify this skill?`
      : `I am currently working on Stage "${norm.stageName}" ("${norm.expectedOutcome}") of my ${selectedRole} career path. Can you give me an overview of the key concepts and resources I should focus on?`;
      
    setCoachMessages([
      { role: "assistant", content: `Hello! I see you are working on the **${norm.stageName}** phase for **${selectedRole}**. How can I help you clear this learning milestone today?` },
      { role: "user", content: contextPrompt }
    ]);
    setIsCoachOpen(true);
  };

  // AI Coach API connector
  const handleCoachSend = async () => {
    const text = coachInput.trim();
    if (!text) return;

    setCoachInput("");
    const userMsg = { role: "user", content: text };
    const nextMessages = [...coachMessages, userMsg];
    setCoachMessages(nextMessages);
    setCoachLoading(true);

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Career Roadmap AI Coach: ${text}`,
          history: nextMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: selectedRole,
            stageName: coachStage?.stageName,
            expectedOutcome: coachStage?.expectedOutcome,
            currentTask: coachTask?.taskName,
            atsScore: workspaceStats.atsScore,
            avgInterviewScore: workspaceStats.avgInterviewScore
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCoachMessages([
        ...nextMessages,
        { role: "assistant", content: data.data?.reply || "I am analyzing your profile data. Focus on implementing core index structures first." }
      ]);
    } catch {
      // Offline fallback
      setCoachMessages([
        ...nextMessages,
        { 
          role: "assistant", 
          content: `To pass the **${coachStage?.stageName || "current"}** stage for **${selectedRole}**, ensure you focus on:
- **Core Topics**: ${coachStage?.skillsCovered?.join(", ") || "Framework architectures"}
- **Expected Outcome**: ${coachStage?.expectedOutcome || "Complete practice coding questions"}
- **Recruiter Focus**: This stage is evaluated as **${coachStage?.recruiterImportance || "High"}** importance. Focus on system implementation details.`
        }
      ]);
    } finally {
      setCoachLoading(false);
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
              <div className="space-y-8 animate-fade-in text-left">
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Interactive Career Tracker</span>
                    <p className="text-base font-black text-slate-800 mt-1">{progressPercent}% of total roadmap goals completed</p>
                  </div>
                  <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="space-y-6">
                  {roadmapData.stages.map((stage) => {
                    const norm = normalizeStage(stage);
                    const isExpanded = expandedStages[stage.stageIndex] || false;

                    // Calculate Stage completion percentage
                    const stageTasks = norm.actionChecklist.map(t => `task-${stage.stageIndex}-${t.taskName}`);
                    const completedTasksCount = stageTasks.filter(id => checkedItems[id]).length;
                    const stagePercent = Math.round((completedTasksCount / Math.max(stageTasks.length, 1)) * 100);
                    const isStageCompleted = stagePercent === 100;

                    return (
                      <div 
                        key={stage.stageIndex} 
                        className={cn(
                          "bg-white rounded-3xl border transition-all overflow-hidden shadow-sm",
                          isStageCompleted ? "border-emerald-300 bg-emerald-50/5" : "border-slate-200/70 hover:border-slate-300"
                        )}
                      >
                        {/* Stage Accordion Header */}
                        <div 
                          onClick={() => setExpandedStages({ ...expandedStages, [stage.stageIndex]: !isExpanded })}
                          className="p-6 md:p-8 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded border border-slate-250">
                                Stage {stage.stageIndex}
                              </span>
                              <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{norm.stageName}</h3>
                              
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
                                getDifficultyColor(norm.difficulty)
                              )}>
                                {norm.difficulty}
                              </span>
                              
                              <span className="text-[10px] font-bold text-slate-400">Duration: {norm.estimatedDuration}</span>
                            </div>
                            
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-1">{norm.expectedOutcome}</p>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            {/* Circular progress loader for this stage */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800">{stagePercent}%</span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                <div className="bg-indigo-650 h-full rounded-full transition-all" style={{ width: `${stagePercent}%` }} />
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Accordion Expansion Section */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 p-6 md:p-8 space-y-6 animate-fade-in bg-slate-50/20">
                            
                            {/* Stage Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                              <div className="md:col-span-8 space-y-4">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expected Stage Outcome</span>
                                  <p className="text-xs text-slate-655 font-semibold leading-relaxed">{norm.expectedOutcome}</p>
                                </div>

                                {/* Skills Covered Tags */}
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Skills Mapped & Acquired</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {norm.skillsCovered.map((skill, sIdx) => (
                                      <span key={sIdx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-4 bg-white p-5 border border-slate-150 rounded-2xl space-y-3">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Recruiter Focus Importance</span>
                                  <span className={cn(
                                    "inline-block text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest border",
                                    norm.recruiterImportance.toLowerCase() === "high" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                    norm.recruiterImportance.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    "bg-slate-50 text-slate-600 border-slate-150"
                                  )}>
                                    {norm.recruiterImportance} Importance
                                  </span>
                                </div>

                                {/* AI Coach Button */}
                                <div>
                                  <button
                                    onClick={() => triggerCoach(stage)}
                                    className="w-full px-4 py-2.5 bg-slate-900 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Ask AI Coach</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Stage Specific Resources */}
                            {norm.learningResources && norm.learningResources.length > 0 && (
                              <div className="pt-4 border-t border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Topic-Specific Learning Resources</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {norm.learningResources.map((res, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-3 bg-white border border-slate-200/70 hover:border-indigo-400 rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                                    >
                                      <div className="min-w-0">
                                        <strong className="text-xs font-black text-slate-800 truncate block group-hover:text-indigo-600 transition-colors">
                                          {res.title}
                                        </strong>
                                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-widest mt-0.5">{res.type}</span>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Checklist Tasks */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Stage Checkpoints Action Items</span>
                              
                              <div className="space-y-2">
                                {norm.actionChecklist.map((task, tIdx) => {
                                  const taskId = `task-${stage.stageIndex}-${task.taskName}`;
                                  const isChecked = checkedItems[taskId] || false;
                                  const isAuto = isAutoVerified(taskId);

                                  return (
                                    <div
                                      key={tIdx}
                                      onClick={() => toggleCheckItem(taskId)}
                                      className={cn(
                                        "p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all select-none cursor-pointer",
                                        isChecked 
                                          ? "bg-emerald-50/20 border-emerald-250 text-slate-800" 
                                          : "bg-white border-slate-200 hover:border-slate-350 text-slate-655"
                                      )}
                                    >
                                      <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <strong className={cn("text-xs font-black text-slate-850", isChecked && "line-through text-slate-450")}>
                                            {task.taskName}
                                          </strong>
                                          
                                          {/* Auto-verified badge */}
                                          {isAuto ? (
                                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                              Verified via Profile
                                            </span>
                                          ) : (
                                            <span className="text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                              Self-Reported
                                            </span>
                                          )}

                                          <span className="text-[8px] font-black text-purple-650 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                            +{task.xpReward} XP
                                          </span>
                                        </div>
                                        
                                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                          Requirement: {task.verificationStatus}
                                        </p>
                                      </div>

                                      <div className="shrink-0">
                                        {isChecked ? (
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

                            {/* Completed Celebratory Rewards Card */}
                            {isStageCompleted && (
                              <div className="p-6 bg-emerald-50/40 border border-emerald-250 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
                                <div className="absolute right-4 top-4 opacity-10">
                                  <Trophy className="w-24 h-24 text-emerald-600" />
                                </div>

                                <div className="space-y-1 z-10 relative">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-250 px-2 py-0.5 rounded uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    Stage Completed Successfully
                                  </span>
                                  <h4 className="text-base font-black text-slate-900 mt-1">🎉 Milestone Rewards Unlocked</h4>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 z-10 relative">
                                  <div className="bg-white p-3 border border-emerald-100 rounded-xl text-center space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">XP Gained</span>
                                    <strong className="text-base font-black text-emerald-600">+500 XP</strong>
                                  </div>
                                  <div className="bg-white p-3 border border-emerald-100 rounded-xl text-center space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PRI Boost</span>
                                    <strong className="text-base font-black text-indigo-600">+25 PRI</strong>
                                  </div>
                                  <div className="bg-white p-3 border border-emerald-100 rounded-xl text-center space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Badge Unlocked</span>
                                    <strong className="text-[10px] font-black text-purple-650 block leading-tight truncate">Stage {stage.stageIndex} Master</strong>
                                  </div>
                                  <div className="bg-white p-3 border border-emerald-100 rounded-xl text-center space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                                    <strong className="text-xs font-black text-slate-700 block">Next Stage Active</strong>
                                  </div>
                                </div>

                                {/* Custom Suggestions tips */}
                                <div className="bg-white p-4 border border-emerald-100 rounded-xl text-xs space-y-2 leading-relaxed z-10 relative">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-display">Engineering Manager Suggestions</span>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <strong className="text-indigo-650 block font-bold">Resume Action:</strong>
                                      <span className="text-slate-500 font-semibold block mt-0.5">
                                        Update your CV to include: "{norm.skillsCovered.slice(0, 2).join(", ")}" context.
                                      </span>
                                    </div>
                                    <div>
                                      <strong className="text-emerald-650 block font-bold">Project Goal:</strong>
                                      <span className="text-slate-500 font-semibold block mt-0.5">
                                        Compile a matching project under Project Advisor OS to apply these concepts.
                                      </span>
                                    </div>
                                    <div>
                                      <strong className="text-purple-650 block font-bold">Mock Interview Check:</strong>
                                      <span className="text-slate-500 font-semibold block mt-0.5">
                                        Go practice Level {stage.stageIndex} questions inside the Interview Station.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* 8. AI COACH SLIDE-OVER SIDEBAR */}
      <AnimatePresence>
        {isCoachOpen && coachStage && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCoachOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Career Coach
                  </span>
                  <h4 className="text-sm font-black truncate max-w-[280px]">
                    {coachStage.stageName} Help
                  </h4>
                </div>
                <button
                  onClick={() => setIsCoachOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages Logs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {coachMessages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={cn(
                      "flex gap-3 text-xs leading-relaxed max-w-[85%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner border border-slate-100",
                      msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"
                    )}>
                      {msg.role === "user" ? "ME" : "AI"}
                    </div>
                    <div className={cn(
                      "p-3.5 rounded-2xl border text-left",
                      msg.role === "user" 
                        ? "bg-indigo-650 border-indigo-700 text-white" 
                        : "bg-white border-slate-150 text-slate-700"
                    )}>
                      <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {coachLoading && (
                  <div className="flex gap-3 text-xs text-slate-400 font-bold items-center">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center animate-spin border border-slate-200">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <span>Coach is thinking...</span>
                  </div>
                )}
              </div>

              {/* Bottom Input Area */}
              <div className="p-4 bg-white border-t border-slate-150 flex gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !coachLoading) handleCoachSend();
                  }}
                  placeholder="Ask a question about this learning goal..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:bg-white transition-all"
                  disabled={coachLoading}
                />
                <button
                  onClick={handleCoachSend}
                  disabled={coachLoading || !coachInput.trim()}
                  className="p-3 bg-indigo-650 text-white rounded-xl hover:bg-indigo-755 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
