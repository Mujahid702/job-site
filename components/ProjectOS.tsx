"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Zap,
  TrendingUp,
  Bot,
  User,
  Send,
  Check,
  Copy,
  Plus,
  FileText,
  Download,
  AlertTriangle,
  Server,
  DollarSign,
  Compass,
  Cpu,
  Layers,
  Calendar,
  BookOpen,
  Eye,
  GitBranch,
  Play,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyProfile, getProjectCompanies, getStudentProjects, saveStudentProject, StudentProject } from "@/lib/db/projects";
import { ROLE_PROJECT_SUGGESTIONS, compileLocalBlueprint } from "@/lib/project-fallback-presets";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import AiLoader from "@/components/ui/AiLoader";

export default function ProjectOS() {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<string>("discovery");
  const [userId, setUserId] = useState<string | null>(null);

  // Core State
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [targetCompany, setTargetCompany] = useState<string>("Google");
  const [projectDifficulty, setProjectDifficulty] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">("All");
  const [interestArea, setInterestArea] = useState<string>("");

  // Loaded Blueprint & History
  const [blueprint, setBlueprint] = useState<any>(null);
  const [savedProjects, setSavedProjects] = useState<StudentProject[]>([]);
  const [generating, setGenerating] = useState(false);

  // Copilot States
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Hello! I am your **Project Intelligence Coach**. I can help you evaluate code structures, explain sharding tradeoffs for databases, optimize deployment pipelines, or practice STAR interview answers. What are we architecting today?"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Details Tabs Inside Studio
  const [activeArchTab, setActiveArchTab] = useState<string>("overview");
  const [activeDocTab, setActiveDocTab] = useState<string>("readme");
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<string>("learning");
  const [activeQuestionCategory, setActiveQuestionCategory] = useState<string>("all");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  // User Stats state
  const [workspaceStats, setWorkspaceStats] = useState(() => {
    let ats = 0;
    let resumeText = "";
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
    }
    return {
      atsScore: ats,
      resumeText: resumeText || "No resume uploaded yet.",
      hasResume: !!resumeText
    };
  });

  useEffect(() => {
    const syncStats = () => {
      let ats = 0;
      let resumeText = "";
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
      }
      setWorkspaceStats({
        atsScore: ats,
        resumeText: resumeText || "No resume uploaded yet.",
        hasResume: !!resumeText
      });
    };

    window.addEventListener("active_resume_updated", syncStats);
    return () => {
      window.removeEventListener("active_resume_updated", syncStats);
    };
  }, []);

  // Track auth state & load initial data
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadSavedProjects(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uId = session?.user?.id || null;
      setUserId(uId);
      if (uId) loadSavedProjects(uId);
    });

    loadCompaniesList();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCompaniesList = async () => {
    setLoadingCompanies(true);
    try {
      const dbCompanies = await getProjectCompanies();
      if (dbCompanies.length > 0) {
        setCompanies(dbCompanies);
      } else {
        // Local fallback seeds if database table is empty
        const fallbackSeeds = [
          { name: "Google", priority_skills: ["Go", "C++", "Python", "Distributed Systems"], focus: "Scale & Algorithm Performance", description: "Massive scaling and algorithms" },
          { name: "Microsoft", priority_skills: ["C#", "Azure", "TypeScript", "SQL Server"], focus: "Enterprise Scaling", description: "Cloud integrations and enterprise productivity" },
          { name: "Amazon", priority_skills: ["Java", "AWS", "DynamoDB", "Messaging Queues"], focus: "Operational Resiliency", description: "Customer transaction scaling" },
          { name: "Meta", priority_skills: ["React", "Go", "GraphQL", "Caching"], focus: "Web Scale Sync", description: "Social graph latency reduction" },
          { name: "Netflix", priority_skills: ["Java", "AWS", "Cassandra", "Spring Cloud"], focus: "Fault Tolerance", description: "High-throughput microservices" },
          { name: "Uber", priority_skills: ["Go", "Kafka", "Cassandra", "PostgreSQL"], focus: "Real-Time Telemetry", description: "Geofencing dispatch and telemetry routing" }
        ];
        setCompanies(fallbackSeeds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadSavedProjects = async (uid: string) => {
    try {
      const list = await getStudentProjects(uid);
      setSavedProjects(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compile Dynamic Blueprint (Gemini with Local Compiler Fallback)
  const handleGenerateProject = async () => {
    setGenerating(true);
    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const generationDifficulty = projectDifficulty === "All" ? "Advanced" : projectDifficulty;
      
      let finalBlueprint;
      if (apiKey) {
        // Call backend Gemini generator API
        const res = await fetch("/api/placement/projects/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-gemini-api-key": apiKey
          },
          body: JSON.stringify({
            targetRole,
            targetCompany,
            difficulty: generationDifficulty,
            interestArea,
            resumeText: workspaceStats.resumeText
          })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          finalBlueprint = result.data;
        } else {
          console.warn("AI generation failed or key unauthorized. Falling back to premium local compiler.");
        }
      }

      if (!finalBlueprint) {
        // Premium Local Compiler Fallback
        finalBlueprint = compileLocalBlueprint(targetRole, targetCompany, generationDifficulty, interestArea, workspaceStats.resumeText);
      }

      setBlueprint(finalBlueprint);

      // Save to Supabase if logged in
      if (userId) {
        const studentProj = {
          title: finalBlueprint.title,
          role: targetRole,
          company: targetCompany,
          difficulty: generationDifficulty,
          interest_area: interestArea || "General scalability",
          blueprint: finalBlueprint,
          readiness_checklist: {
            planning: true,
            development: false,
            testing: false,
            deployment: false,
            documentation: false
          }
        };
        await saveStudentProject(userId, studentProj);
        loadSavedProjects(userId);
      }

      showToast(`Placement Project Blueprint successfully compiled: ${finalBlueprint.title}`, "success");
      setActiveSubTab("blueprint");
    } catch (e) {
      console.error(e);
      showToast("Failed to generate project blueprint. Please check your network connection.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Dynamic Recommendation Reasoning for Curated Project Selection
  const getRecommendationInsights = (projectTitle: string) => {
    if (!projectTitle) return null;
    
    // Find project details from suggestions
    const allProj = Object.values(ROLE_PROJECT_SUGGESTIONS).flat();
    const proj = allProj.find(p => p.title === projectTitle);
    if (!proj) return null;

    const resumeLower = (workspaceStats.resumeText || "").toLowerCase();
    
    // Skill comparisons
    const presentSkills = proj.tech.filter(t => resumeLower.includes(t.toLowerCase()));
    const missingSkills = proj.tech.filter(t => !resumeLower.includes(t.toLowerCase()));

    // WEIGHTED PORTFOLIO MATCH STRENGTH CALCULATION
    let matchScore = 60; // baseline
    if (presentSkills.length > 0) matchScore += 15; // overlap benefits
    if (missingSkills.length > 0) matchScore += 10; // learning value gap-filling
    if (proj.difficulty === "Advanced" && (resumeLower.includes("distributed") || resumeLower.includes("concurrency") || resumeLower.includes("caching"))) {
      matchScore += 10; // matches candidate experience complexity
    }
    if (proj.difficulty === "Intermediate" && (resumeLower.includes("database") || resumeLower.includes("api"))) {
      matchScore += 10; // matches intermediate core skillset
    }
    if (resumeLower.includes("docker") || resumeLower.includes("aws") || resumeLower.includes("kubernetes")) {
      matchScore += 5; // cloud deployment baseline matching
    }
    const strength = Math.min(98, Math.max(35, matchScore));

    // Dynamic reasoning description
    let whyRecommended = "";
    if (presentSkills.length > 0 && missingSkills.length > 0) {
      whyRecommended = `Your resume already demonstrates proficiency in ${presentSkills.slice(0, 2).join(" and ")}. This project introduces ${missingSkills.slice(0, 3).join(", ")} which are currently absent from your profile. Completing this project significantly improves your ${targetRole} engineering depth while avoiding duplicate portfolio work.`;
    } else if (missingSkills.length > 0) {
      whyRecommended = `This project is highly recommended because it introduces crucial technologies like ${missingSkills.slice(0, 3).join(", ")} that are completely missing from your resume. Completing it will help plug critical ATS keyword gaps and align your profile with standard ${targetRole} hiring expectations.`;
    } else {
      whyRecommended = `This project aligns with your active stack of ${presentSkills.slice(0, 3).join(", ")}. It focuses on scaling, transaction isolation, and containerized deployment pipelines, converting standard tutorial skills into recruiter-aligned portfolio proofs.`;
    }

    // CATEGORIZED UNLOCKED SKILLS
    const unlockedSkills: Record<string, string[]> = {
      "Programming": [],
      "Backend": [],
      "Frontend/UI": [],
      "Authentication": [],
      "Infrastructure": [],
      "Engineering Concepts": [],
      "Soft Skills": ["System Documentation", "Technical Tradeoffs", "Debugging"]
    };

    // Distribute technologies into categories
    proj.tech.forEach(tech => {
      const t = tech.toLowerCase();
      if (t.includes("javascript") || t.includes("typescript") || t.includes("python") || t.includes("go") || t.includes("rust") || t.includes("java") || t.includes("c++")) {
        unlockedSkills["Programming"].push(tech);
      } else if (t.includes("react") || t.includes("next.js") || t.includes("html") || t.includes("css") || t.includes("tailwind") || t.includes("vue") || t.includes("canvas")) {
        unlockedSkills["Frontend/UI"] = unlockedSkills["Frontend/UI"] || [];
        unlockedSkills["Frontend/UI"].push(tech);
      } else if (t.includes("express") || t.includes("flask") || t.includes("fastapi") || t.includes("graphql") || t.includes("rest") || t.includes("sql") || t.includes("sqlite") || t.includes("postgres") || t.includes("mongodb") || t.includes("prisma")) {
        unlockedSkills["Backend"].push(tech);
      } else if (t.includes("jwt") || t.includes("auth") || t.includes("oauth") || t.includes("session") || t.includes("rbac")) {
        unlockedSkills["Authentication"].push(tech);
      } else if (t.includes("docker") || t.includes("kubernetes") || t.includes("aws") || t.includes("lambda") || t.includes("redis") || t.includes("kafka") || t.includes("rabbitmq") || t.includes("nginx")) {
        unlockedSkills["Infrastructure"].push(tech);
      } else {
        unlockedSkills["Engineering Concepts"].push(tech);
      }
    });

    // Populate default placeholders in categories if empty
    if (unlockedSkills["Programming"].length === 0) unlockedSkills["Programming"].push("TypeScript / JS");
    if (unlockedSkills["Backend"].length === 0 && (targetRole.includes("Backend") || targetRole.includes("Full Stack"))) {
      unlockedSkills["Backend"].push("REST API design");
    }
    if (proj.difficulty === "Advanced") {
      unlockedSkills["Engineering Concepts"].push("Horizontal Scaling", "System Observability");
      unlockedSkills["Soft Skills"].push("Testing Suites (Jest)");
    } else if (proj.difficulty === "Intermediate") {
      unlockedSkills["Engineering Concepts"].push("Asynchronous Control");
      unlockedSkills["Soft Skills"].push("API Schema Validation");
    } else {
      unlockedSkills["Engineering Concepts"].push("CRUD Fundamentals");
      unlockedSkills["Soft Skills"].push("Code Structuring");
    }

    // TARGET INTERVIEW ROUNDS DYNAMIC DETERMINATION
    let targetRounds = ["Core Programming", "Basic System Walkthrough", "HR Suitability"];
    const isGoogle = targetCompany.toLowerCase().includes("google");
    const isDeloitte = targetCompany.toLowerCase().includes("deloitte");
    const isAmazon = targetCompany.toLowerCase().includes("amazon");

    if (isGoogle) {
      targetRounds = proj.difficulty === "Advanced" 
        ? ["Coding & DSA Round", "Systems Design Round", "API & Protocol Design", "Hiring Committee Review"]
        : ["Coding & DSA Round", "Project Explanation Round", "Web Performance Standards", "Googlyness Round"];
    } else if (isDeloitte) {
      targetRounds = ["Resume Technical Audit", "SQL Queries Discussion", "Project Implementation Walkthrough", "HR Round"];
    } else if (isAmazon) {
      targetRounds = ["Coding & Data Structures", "Systems Architecture Round", "Leadership Principles STAR Round", "Bar Raiser Review"];
    } else {
      // General customized round fallback
      targetRounds = proj.difficulty === "Advanced"
        ? ["System Design Round", "High-Concurrency Tech Interview", "Project Architecture discussion", "Manager Round"]
        : proj.difficulty === "Intermediate"
        ? ["Technical Core round", "Database & Indexing Deep Dive", "Project Walkthrough", "HR Round"]
        : ["Technical Basics round", "Resume Projects Review", "HR Culture Round"];
    }

    // REASONED COMPANIES VALUING THIS STACK
    let targetCompanies = "Google, Meta, Amazon, Microsoft";
    const title = proj.title.toLowerCase();
    
    if (title.includes("trading") || title.includes("finance") || title.includes("stock") || title.includes("crypto") || title.includes("ledger") || title.includes("billing") || title.includes("checkout")) {
      targetCompanies = "Stripe, Goldman Sachs, JPMC, Morgan Stanley, Bloomberg, PayPal";
    } else if (title.includes("chat") || title.includes("collaboration") || title.includes("spreadsheet") || title.includes("whiteboard") || title.includes("kanban") || title.includes("ide") || title.includes("whiteboard")) {
      targetCompanies = "Slack, Discord, Microsoft, Zoom, Google, Atlassian";
    } else if (title.includes("movie") || title.includes("stream") || title.includes("audio") || title.includes("video") || title.includes("recommendation") || title.includes("clone")) {
      targetCompanies = "Netflix, Amazon Prime, Disney+, Spotify, YouTube, ByteDance";
    } else if (title.includes("flash sale") || title.includes("checkout") || title.includes("ecommerce") || title.includes("delivery") || title.includes("auction") || title.includes("delivery")) {
      targetCompanies = "Amazon, Instacart, Walmart, eBay, Shopify, Uber";
    } else if (title.includes("docker") || title.includes("kubernetes") || title.includes("cloud") || title.includes("vpc") || title.includes("telemetry") || title.includes("log") || title.includes("traffic") || title.includes("monitor") || title.includes("crawler")) {
      targetCompanies = "AWS, Google Cloud, Microsoft Azure, Prometheus, Datadog, Cloudflare";
    } else {
      // General matching based on role
      if (targetRole.includes("Frontend") || targetRole.includes("Full Stack")) {
        targetCompanies = "Meta, Stripe, Vercel, Airbnb, Slack, Uber";
      } else if (targetRole.includes("Data") || targetRole.includes("ML") || targetRole.includes("Scientist")) {
        targetCompanies = "OpenAI, Google DeepMind, Snowflake, Databricks, Tesla, Meta";
      } else if (targetRole.includes("DevOps") || targetRole.includes("Cloud")) {
        targetCompanies = "AWS, HashiCorp, Red Hat, DigitalOcean, Google Cloud, Azure";
      }
    }

    return {
      strength,
      whyRecommended,
      missingSkills,
      presentSkills,
      unlockedSkills,
      targetCompanies,
      targetRounds
    };
  };

  // Gap Diagnostics Score Calculations
  const getGapAnalysis = () => {
    const skillsRequired = companies.find(c => c.name === targetCompany)?.priority_skills || ["SQL", "Python"];
    const candidateSkills = workspaceStats.resumeText.toLowerCase();

    const strong = skillsRequired.filter(s => candidateSkills.includes(s.toLowerCase()));
    const missing = skillsRequired.filter(s => !candidateSkills.includes(s.toLowerCase()));

    // Scores (Calculated dynamically)
    const baseRatio = skillsRequired.length > 0 ? strong.length / skillsRequired.length : 0.5;
    const strengthScore = Math.round(50 + baseRatio * 45);
    const innovationScore = projectDifficulty === "Beginner" ? 55 : projectDifficulty === "Intermediate" ? 75 : 92;
    const techDepthScore = Math.round(40 + baseRatio * 50);
    const deploymentScore = projectDifficulty === "Beginner" ? 40 : projectDifficulty === "Intermediate" ? 70 : 95;
    const recruiterMatchScore = Math.round((strengthScore + techDepthScore + innovationScore) / 3);

    return {
      scores: [
        { label: "Project Strength", val: strengthScore, desc: "Alignment with targets", color: "text-blue-600" },
        { label: "Innovation Score", val: innovationScore, desc: "Novelty & complexity level", color: "text-amber-600" },
        { label: "Technical Depth", val: techDepthScore, desc: "Middleware and logic density", color: "text-indigo-600" },
        { label: "Deployment score", val: deploymentScore, desc: "Cloud & pipeline integration", color: "text-emerald-600" },
        { label: "Recruiter Match", val: recruiterMatchScore, desc: "Overall target suitability", color: "text-purple-600" }
      ],
      missing,
      gaps: [
        { type: "Missing Technologies", title: "Target Cloud Deployment", desc: "No AWS/Azure keywords detected in your projects resume sections. Goldman Sachs / Amazon require serverless deploy exposure." },
        { type: "Missing Complexity", title: "Concurrency & Middleware", desc: "Your resume lacks messaging queues (Kafka/RabbitMQ) or caching blocks (Redis). Adding these raises recruiter hits by 2.5x." }
      ]
    };
  };

  const gapDiagnostics = getGapAnalysis();

  // Copilot logic
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: query
    };

    const updatedMsgs = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMsgs);
    setCopilotLoading(true);

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Placement Project OS inquiry: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole,
            targetCompany,
            techStack: blueprint ? Object.values(blueprint.techStack).join(", ") : "Not generated yet",
            atsScore: workspaceStats.atsScore
          }
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: `copilot-${Date.now()}`,
          role: "copilot" as const,
          content: result.data.reply
        }
      ]);
    } catch {
      // Intelligent offline response fallback
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("sharding") || q.includes("database")) {
        reply = `### Database Scaling Tradeoffs:\n- **Vertical Scaling**: Easiest, but hits hardware limits fast.\n- **Horizontal Sharding**: Divides rows across multiple node pools by sharding key (e.g. hash of user_id).\n- **Redis Caching**: Mitigates 80% of read spikes without sharding overheads.`;
      } else if (q.includes("ibm") || q.includes("recruiter")) {
        reply = `### Recruiter Diagnostics:\n- **Stands Out**: 12-layer architecture with Docker container configurations.\n- **Weak Spot**: Lack of real-world latency benchmarking logs. Add a paragraph detailing EXPLAIN ANALYZE SQL query tuning.`;
      } else {
        reply = `To prepare for **${targetCompany}** SDE interviews, review the generated 20+ questions list in the **Interview Station** tab. It outlines expectations for trade-offs and common design pitfalls.`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: `copilot-${Date.now()}`,
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Filter suggestions by selected difficulty level
  const allSuggestions = (ROLE_PROJECT_SUGGESTIONS[targetRole] || ROLE_PROJECT_SUGGESTIONS["Full Stack Developer"]);
  const suggestions = projectDifficulty === "All"
    ? allSuggestions
    : allSuggestions.filter(proj => proj.difficulty === projectDifficulty);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
      
      {/* LEFT SECTION (Interactive Tabs Workspace) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Page title and description */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
            <Compass className="w-3.5 h-3.5" />
            AI Project Intel OS
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Project Advisor OS
          </h1>
          <p className="text-slate-500 font-medium text-base">
            Upgrade your developer resume portfolios. Discover recruiter-aligned projects, compile detailed system architectures, track daily roadmaps, and practice mock interview questions.
          </p>
        </div>

        {/* Workspace Navigation Subtabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "discovery", label: "Discovery Engine", icon: <Compass className="w-4 h-4" /> },
            { id: "blueprint", label: "Project Blueprint", icon: <FileText className="w-4 h-4" /> },
            { id: "gap", label: "Gap Diagnostics", icon: <AlertTriangle className="w-4 h-4" /> },
            { id: "architecture", label: "Architecture Studio", icon: <Server className="w-4 h-4" /> },
            { id: "roadmap", label: "Roadmap & Timelines", icon: <Calendar className="w-4 h-4" /> },
            { id: "documentation", label: "README & Exporter", icon: <Download className="w-4 h-4" /> },
            { id: "interview", label: "Interview Station", icon: <Bot className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== "discovery" && !blueprint) {
                  showToast("Please compile or select a project blueprint first!", "warning");
                  return;
                }
                setActiveSubTab(tab.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                activeSubTab === tab.id
                  ? "bg-slate-900 text-white shadow-md border-slate-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          <AiLoader loading={generating} />
          
          {/* 1. DISCOVERY ENGINE */}
          {activeSubTab === "discovery" && !generating && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 font-display">Recruiter-Aligned Project Channels</h2>
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-slate-400">Targeting:</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{targetRole}</span>
                </div>
              </div>

              {/* Dynamic Filters Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 border border-slate-150 rounded-3xl">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Path Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {["Full Stack Developer", "Frontend Engineer", "Backend Engineer", "Data Scientist", "ML Engineer", "Cloud Engineer", "DevOps Engineer", "Cyber Security Engineer", "Business Analyst", "Data Analyst"].map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Project Difficulty Level</label>
                  <select
                    value={projectDifficulty}
                    onChange={(e) => setProjectDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="All">All Levels</option>
                    {["Beginner", "Intermediate", "Advanced"].map(diff => (
                      <option key={diff} value={diff}>{diff} Complexity</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Suggestions Cards list (6 ideas matching selection) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Hiring-Aligned Project Blueprint Suggestions</h3>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Showing: {suggestions.length} of {allSuggestions.length} ideas
                    {projectDifficulty !== "All" && <span className="text-blue-500 ml-1">({projectDifficulty} only)</span>}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestions.map((proj, idx) => (
                    <div key={idx} className="border border-slate-200/85 hover:border-blue-400 p-6 rounded-3xl space-y-4 bg-slate-50/20 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <strong className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{proj.title}</strong>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0 border",
                            proj.difficulty === "Beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            proj.difficulty === "Intermediate" ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-indigo-50 text-indigo-600 border-indigo-100"
                          )}>
                            {proj.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">{proj.summary}</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-4 border-t border-slate-100 mt-2">
                        <span className="font-bold text-slate-400">Stack: {proj.tech.join(", ")}</span>
                        <button
                          onClick={() => {
                            setInterestArea(proj.title);
                            setProjectDifficulty(proj.difficulty);
                            showToast(`Configured builder theme to "${proj.title}"`, "success");
                          }}
                          className="text-xs font-black text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          Configure Builder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {suggestions.length === 0 && (
                  <div className="col-span-2 p-8 text-center space-y-2 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                    <AlertTriangle className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">
                      No projects match the selected filters. Try changing the difficulty level or target role.
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Recommendation Insights */}
              {interestArea && (() => {
                const insights = getRecommendationInsights(interestArea);
                if (!insights) return null;
                return (
                  <div className="p-6 bg-indigo-50/50 border border-indigo-100/70 rounded-3xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-indigo-100/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Engineering Mentor Recommendation Insights</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Portfolio Match Strength:</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{insights.strength}%</span>
                      </div>
                    </div>
                    
                    <p className="text-xs font-semibold text-slate-655 leading-relaxed">
                      {insights.whyRecommended}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-3.5 bg-white rounded-2xl border border-slate-150 space-y-2">
                        <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1">Unlocked Skills by Domain</strong>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {Object.entries(insights.unlockedSkills || {}).map(([category, list]) => {
                            if (!list || list.length === 0) return null;
                            return (
                              <div key={category} className="space-y-0.5">
                                <span className="text-[8px] font-black text-indigo-650 uppercase tracking-widest block">{category}</span>
                                <div className="flex flex-wrap gap-1">
                                  {list.map((s, idx) => (
                                    <span key={idx} className="text-[9px] font-semibold text-slate-655 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-slate-150 space-y-1.5">
                        <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1">Target Interview Rounds</strong>
                        <ul className="space-y-1 mt-1">
                          {insights.targetRounds.map((r, i) => (
                            <li key={i} className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-slate-150 space-y-1.5">
                        <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1">Companies Valuing This Stack</strong>
                        <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mt-1.5">
                          {insights.targetCompanies}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Main Generate Form Callout */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 animate-pulse" />
                <div className="space-y-1.5 z-10">
                  <h4 className="text-base font-black font-display flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
                    <span>Run AI Blueprint Compiler</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold max-w-md">
                    Custom-build the selected project theme ({interestArea || "General scaling"}) targeting {targetCompany} standards.
                  </p>
                </div>
                <button
                  disabled={generating}
                  onClick={handleGenerateProject}
                  className="px-6 py-4 bg-white text-slate-900 hover:bg-blue-50 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shrink-0 z-10"
                >
                  {generating ? "Compiling Blueprint..." : "Compile Now"}
                </button>
              </div>
            </div>
          )}

          {/* 2. PROJECT BLUEPRINT */}
          {activeSubTab === "blueprint" && !generating && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Project Blueprint</span>
                  <h3 className="text-2xl font-black text-slate-900 font-display">{blueprint?.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-750 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-xl">Recruiter Appeal: {blueprint?.recruiterScore}%</span>
                  <span className="text-[10px] font-black text-emerald-750 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-xl">ATS Index: {blueprint?.resumeScore}%</span>
                </div>
              </div>

              {/* Recruiter Reasoning Layer */}
              {blueprint?.recruiterReasoning && (
                <div className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-indigo-850 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Hiring Manager Alignment Reasoning</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-1">
                      <strong className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Why This Project?</strong>
                      <p className="text-slate-700 font-semibold">{blueprint.recruiterReasoning.whyThisProject}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Why {targetCompany} Values It?</strong>
                      <p className="text-slate-700 font-semibold">{blueprint.recruiterReasoning.whyCompanyValuesIt}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">hiring signals demonstrated</strong>
                      <p className="text-slate-700 font-semibold">{blueprint.recruiterReasoning.hiringSignals}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Core Interview Topics Covered</strong>
                      <p className="text-slate-700 font-semibold">{blueprint.recruiterReasoning.interviewTopics}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary & Problem statement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
                <div className="space-y-2">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Executive Summary</strong>
                  <p className="text-slate-600 font-semibold leading-relaxed">{blueprint?.executiveSummary || blueprint?.problem}</p>
                </div>
                <div className="space-y-2">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Real-World Problem Statement</strong>
                  <p className="text-slate-600 font-semibold leading-relaxed">{blueprint?.problem}</p>
                </div>
              </div>

              {/* Requirements & Target Scope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Functional Requirements</strong>
                  <ul className="space-y-2">
                    {(blueprint?.functionalRequirements || blueprint?.features || []).map((req: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-600 font-semibold">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Non-Functional Requirements</strong>
                  <ul className="space-y-2">
                    {(blueprint?.nonFunctionalRequirements || [
                      "99.9% API availability validation checks",
                      "Sub-second data load latency metrics",
                      "ACID compliance for database inventory locks",
                      "Secure JWT session rotation triggers"
                    ]).map((req: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-600 font-semibold">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 3. GAP DIAGNOSTICS */}
          {activeSubTab === "gap" && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 font-display">Resume & Portfolio Gaps Analytics</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  We audit your current resume text against **{targetCompany}** requirements for **{targetRole}** targets.
                </p>
              </div>

              {/* Dynamic Scores row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {gapDiagnostics.scores.map((score, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-2 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-tight">{score.label}</span>
                    <strong className={cn("text-2xl font-black block", score.color)}>{score.val}%</strong>
                    <span className="text-[9px] text-slate-400 font-bold block">{score.desc}</span>
                  </div>
                ))}
              </div>

              {/* Missing skills check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Vulnerable Missing Technologies</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gapDiagnostics.missing.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold">
                        {s}
                      </span>
                    ))}
                    {gapDiagnostics.missing.length === 0 && (
                      <span className="text-xs text-emerald-600 font-black">All target company priority skills detected!</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-blue-500" />
                    <span>Project Completeness Actions</span>
                  </h4>
                  <div className="space-y-3">
                    {gapDiagnostics.gaps.map((gap, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs leading-normal">
                        <strong className="text-slate-800 font-black uppercase tracking-wider text-[9px] block mb-1">{gap.type}: {gap.title}</strong>
                        <p className="text-slate-500 font-semibold">{gap.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 4. ARCHITECTURE STUDIO */}
          {activeSubTab === "architecture" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 font-display">System Architecture Studio</h2>
                
                {/* Inner tab choices */}
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "flow", label: "Arch Flow" },
                    { id: "components", label: "Components" },
                    { id: "schema", label: "DB Design" },
                    { id: "apis", label: "API Design" },
                    { id: "folders", label: "Structure" },
                    { id: "deployment", label: "Deployment" },
                    { id: "security", label: "Security" },
                    { id: "scaling", label: "Scaling" },
                    { id: "techJustification", label: "Tech Choices" }
                  ].map(stab => (
                    <button
                      key={stab.id}
                      onClick={() => setActiveArchTab(stab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        activeArchTab === stab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {stab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview */}
              {activeArchTab === "overview" && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
                    <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Overview</strong>
                    <p className="text-slate-700 font-semibold">{blueprint?.architecture?.systemOverview || blueprint?.executiveSummary || blueprint?.problem}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                      <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Problem Statement</strong>
                      <p className="text-slate-600 font-medium">{blueprint?.problem}</p>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                      <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Architecture Solution</strong>
                      <p className="text-slate-600 font-medium">{blueprint?.solution}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-3xl space-y-2">
                    <strong className="text-[10px] font-black text-indigo-800 uppercase tracking-widest block">High-Level Architecture</strong>
                    <p className="text-slate-700 font-semibold">{blueprint?.architecture?.highLevel}</p>
                  </div>
                </div>
              )}

              {/* Architecture Flow */}
              {activeArchTab === "flow" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="p-5 bg-slate-950 text-emerald-400 rounded-3xl font-mono text-[10px] border border-slate-900 leading-normal whitespace-pre-wrap">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">End-to-End Architecture Flow</strong>
                    {(blueprint.architecture.architectureFlow || "Frontend -> API Gateway -> Backend Services -> Database -> Cache -> Storage -> Cloud -> Monitoring").split("\\n").map((line: string, idx: number) => (
                      <p key={idx} className={cn("py-0.5", line.includes("**") ? "text-emerald-300 font-bold" : "text-emerald-400/80")}>{line.replace(/\*\*/g, "")}</p>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                      <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">API Flow</strong>
                      <p className="text-slate-600 font-semibold">{blueprint.architecture.apiFlow}</p>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                      <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Authentication Flow</strong>
                      <p className="text-slate-600 font-semibold">{blueprint.architecture.authentication}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Major Components */}
              {activeArchTab === "components" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-normal">
                  {blueprint.architecture.majorComponents ? (
                    <div className="space-y-4">
                      {blueprint.architecture.majorComponents.map((comp: any, idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 hover:border-blue-300 transition-colors space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px]">{idx + 1}</span>
                              <strong className="text-sm font-black text-slate-900">{comp.name}</strong>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(comp.technologies || []).map((t: string, tIdx: number) => (
                                <span key={tIdx} className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 font-semibold">{comp.purpose}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsibilities</strong>
                              <ul className="space-y-0.5">
                                {(comp.responsibilities || []).map((r: string, rIdx: number) => (
                                  <li key={rIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-blue-500">•</span>{r}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block mb-1">Inputs</strong>
                              <ul className="space-y-0.5">
                                {(comp.inputs || []).map((i: string, iIdx: number) => (
                                  <li key={iIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-emerald-500">→</span>{i}</li>
                                ))}
                              </ul>
                              <strong className="text-[8px] font-black text-amber-700 uppercase tracking-widest block mb-1 mt-2">Outputs</strong>
                              <ul className="space-y-0.5">
                                {(comp.outputs || []).map((o: string, oIdx: number) => (
                                  <li key={oIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-amber-500">←</span>{o}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-purple-700 uppercase tracking-widest block mb-1">Communicates With</strong>
                              <ul className="space-y-0.5">
                                {(comp.communicatesWith || []).map((c: string, cIdx: number) => (
                                  <li key={cIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-purple-500">↔</span>{c}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: "High Level Architecture Flow", val: blueprint.architecture.highLevel },
                        { label: "Frontend Architecture & Tech", val: blueprint.architecture.frontend },
                        { label: "Backend Core & Controllers", val: blueprint.architecture.backend },
                        { label: "Cloud Infrastructure Setup", val: blueprint.architecture.cloudDeployment },
                        { label: "CI/CD Deployment Pipelines", val: blueprint.architecture.cicd },
                        { label: "Monitoring Exporters & Metrics", val: blueprint.architecture.monitoring }
                      ].map((layer, idx) => (
                        <div key={idx} className="p-4 border border-slate-155 rounded-2xl bg-slate-50/30 hover:bg-slate-50 transition-colors">
                          <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{layer.label}</strong>
                          <p className="text-slate-600 font-semibold">{layer.val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Database Design */}
              {activeArchTab === "schema" && (
                <div className="space-y-6">
                  {/* DBML Schema */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-5 space-y-3">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Entity Relationship Diagram (DBML)</strong>
                      <pre className="bg-slate-950 text-indigo-300 p-4 rounded-2xl font-mono text-[10px] overflow-x-auto border border-slate-900 leading-normal">
                        {blueprint?.databaseSchema}
                      </pre>
                    </div>
                    <div className="md:col-span-7 space-y-3">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data Flow Description</strong>
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs leading-relaxed">
                        <p className="text-slate-600 font-semibold">{blueprint?.architecture?.databaseDesign?.dataFlow || `To fulfill ${targetCompany} SDE standards, the relational schema enforces foreign key validations and compound indexes.`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Table Schemas */}
                  {blueprint?.architecture?.databaseDesign?.tables && (
                    <div className="space-y-4">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Table Schema Details</strong>
                      {blueprint.architecture.databaseDesign.tables.map((table: any, idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest">TABLE</span>
                            <strong className="text-sm font-black text-slate-900 font-mono">{table.name}</strong>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">{table.purpose}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Columns</strong>
                              <div className="space-y-1 font-mono text-[10px]">
                                {(table.columns || []).map((col: string, cIdx: number) => (
                                  <div key={cIdx} className="text-slate-600 py-0.5 border-b border-slate-100 last:border-0">{col}</div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="p-3 bg-white border border-slate-150 rounded-xl">
                                <strong className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">Relationships</strong>
                                {(table.relationships || []).map((r: string, rIdx: number) => (
                                  <div key={rIdx} className="text-slate-600 font-semibold py-0.5">{r}</div>
                                ))}
                              </div>
                              <div className="p-3 bg-white border border-slate-150 rounded-xl">
                                <strong className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Indexes</strong>
                                {(table.indexes || []).filter((i: string) => i).map((index: string, iIdx: number) => (
                                  <div key={iIdx} className="text-slate-600 font-mono text-[9px] py-0.5">{index}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* API Design */}
              {activeArchTab === "apis" && (
                <div className="space-y-4">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">API Endpoint Specifications</strong>
                  {blueprint?.architecture?.apiDesign ? (
                    <div className="space-y-4">
                      {blueprint.architecture.apiDesign.map((api: any, idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 hover:border-blue-300 transition-colors space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                              api.method === "GET" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              api.method === "POST" ? "bg-blue-50 text-blue-600 border-blue-100" :
                              api.method === "PUT" ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-red-50 text-red-600 border-red-100"
                            )}>{api.method}</span>
                            <strong className="text-xs font-black text-slate-900 font-mono">{api.endpoint}</strong>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">{api.purpose}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">Request Payload</strong>
                              <code className="text-[10px] text-slate-600 font-mono block">{api.requestPayload}</code>
                            </div>
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Response Structure</strong>
                              <code className="text-[10px] text-slate-600 font-mono block">{api.responseStructure}</code>
                            </div>
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Authentication</strong>
                              <span className="text-slate-600 font-semibold">{api.authentication}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-150 rounded-xl">
                              <strong className="text-[8px] font-black text-rose-600 uppercase tracking-widest block mb-1">Error Handling</strong>
                              <span className="text-slate-600 font-semibold">{api.errorHandling}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(blueprint?.apiStructure || []).map((api: string, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[10px] text-slate-750 flex flex-col justify-between h-20 shadow-sm hover:border-blue-300 transition-colors">
                          <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded self-start">ROUTE {idx + 1}</span>
                          <span className="truncate block mt-2 font-bold">{api}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Folder Structure */}
              {activeArchTab === "folders" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Production Project Structure</strong>
                  <pre className="bg-slate-950 text-emerald-400 p-6 rounded-3xl font-mono text-[10px] overflow-x-auto border border-slate-900 leading-normal whitespace-pre-wrap">
                    {blueprint.architecture.folderStructure || `├── client/          # Frontend dashboard code\n├── server/          # Backend REST API server\n├── docker/          # Container configuration files\n└── README.md        # This file`}
                  </pre>
                </div>
              )}

              {/* Deployment Overview */}
              {activeArchTab === "deployment" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  {blueprint.architecture.deploymentOverview ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Frontend Deployment", val: blueprint.architecture.deploymentOverview.frontend, icon: "🖥️" },
                          { label: "Backend Deployment", val: blueprint.architecture.deploymentOverview.backend, icon: "⚙️" },
                          { label: "Database Hosting", val: blueprint.architecture.deploymentOverview.database, icon: "🗄️" },
                          { label: "Monitoring Setup", val: blueprint.architecture.deploymentOverview.monitoring, icon: "📊" }
                        ].map((item, idx) => (
                          <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-2">
                            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{item.icon} {item.label}</strong>
                            <p className="text-slate-700 font-semibold">{item.val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-5 bg-slate-950 text-amber-300 rounded-3xl font-mono text-[10px] border border-slate-900 leading-normal whitespace-pre-wrap">
                        <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Environment Variables Template</strong>
                        {blueprint.architecture.deploymentOverview.envVars}
                      </div>
                      <div className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-2">
                        <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CI/CD Pipeline Configuration</strong>
                        <div className="text-slate-700 font-semibold whitespace-pre-wrap">{blueprint.architecture.deploymentOverview.cicd}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                        <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cloud Deployment</strong>
                        <p className="text-slate-600 font-semibold">{blueprint.architecture.cloudDeployment}</p>
                      </div>
                      <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                        <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CI/CD Pipeline</strong>
                        <p className="text-slate-600 font-semibold">{blueprint.architecture.cicd}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Security Considerations */}
              {activeArchTab === "security" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  {blueprint.architecture.securityConsiderations ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(blueprint.architecture.securityConsiderations).map(([key, val]: [string, any], idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-2 hover:border-rose-200 transition-colors">
                          <strong className="text-[10px] font-black text-rose-700 uppercase tracking-widest block">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </strong>
                          <p className="text-slate-700 font-semibold">{val}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-55 border border-slate-200 rounded-3xl space-y-2">
                        <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Authentication Rules</strong>
                        <p className="text-slate-700 font-semibold">{blueprint.architecture.authentication}</p>
                      </div>
                      <div className="p-5 bg-slate-55 border border-slate-200 rounded-3xl space-y-2">
                        <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Security Safeguards</strong>
                        <p className="text-slate-700 font-semibold">{blueprint.architecture.security}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Scalability Considerations */}
              {activeArchTab === "scaling" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  {blueprint.architecture.scalabilityConsiderations ? (
                    <div className="space-y-4">
                      {Object.entries(blueprint.architecture.scalabilityConsiderations).map(([key, val]: [string, any], idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-2 hover:border-indigo-200 transition-colors">
                          <strong className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </strong>
                          <p className="text-slate-700 font-semibold">{val}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                          <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Caching Policies</strong>
                          <p className="text-slate-600 font-semibold">{blueprint.architecture.caching}</p>
                        </div>
                        <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/30">
                          <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Message Queue Layer</strong>
                          <p className="text-slate-600 font-semibold">{blueprint.architecture.messageQueue}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technology Justification */}
              {activeArchTab === "techJustification" && blueprint?.architecture && (
                <div className="space-y-4 text-xs leading-relaxed">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Technology Selection Justification</strong>
                  {blueprint.architecture.technologyJustification ? (
                    <div className="space-y-4">
                      {blueprint.architecture.technologyJustification.map((tech: any, idx: number) => (
                        <div key={idx} className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-widest">TECH {idx + 1}</span>
                            <strong className="text-sm font-black text-slate-900">{tech.technology}</strong>
                          </div>
                          <p className="text-slate-600 font-semibold">{tech.reason}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                              <strong className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block mb-1">Advantages</strong>
                              <ul className="space-y-0.5">
                                {(tech.advantages || []).map((a: string, aIdx: number) => (
                                  <li key={aIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-emerald-500">✓</span>{a}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                              <strong className="text-[8px] font-black text-rose-700 uppercase tracking-widest block mb-1">Limitations</strong>
                              <ul className="space-y-0.5">
                                {(tech.limitations || []).map((l: string, lIdx: number) => (
                                  <li key={lIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-rose-500">⚠</span>{l}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <strong className="text-[8px] font-black text-blue-700 uppercase tracking-widest block mb-1">Alternatives Evaluated</strong>
                              <ul className="space-y-0.5">
                                {(tech.alternatives || []).map((alt: string, altIdx: number) => (
                                  <li key={altIdx} className="text-slate-600 font-semibold flex gap-1"><span className="text-blue-500">↔</span>{alt}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 font-semibold">Technology justification data will be available after generating a project blueprint.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. ROADMAP TIMELINES */}
          {activeSubTab === "roadmap" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">Engineering Development Tracker</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Track your implementation progress across 12 sequential software engineering phases.
                  </p>
                </div>
                {blueprint?.roadmap && Array.isArray(blueprint.roadmap) && typeof blueprint.roadmap[0] === "object" && (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black text-indigo-650 uppercase tracking-wider">Overall Progress:</span>
                    <span className="text-xs font-black text-indigo-700">{(() => {
                      let total = 0;
                      let done = 0;
                      blueprint.roadmap.forEach((p: any, pIdx: number) => {
                        const tasks = p.tasks || [];
                        total += tasks.length;
                        tasks.forEach((_: any, tIdx: number) => {
                          if (completedTasks[`${pIdx}-${tIdx}`]) done++;
                        });
                      });
                      return total > 0 ? Math.round((done / total) * 100) : 0;
                    })()}%</span>
                  </div>
                )}
              </div>

              {blueprint?.roadmap && (
                <div className="space-y-4">
                  {Array.isArray(blueprint.roadmap) && typeof blueprint.roadmap[0] === "object" ? (
                    // 12-Phase Structured Development Tracker
                    <div className="space-y-4">
                      {blueprint.roadmap.map((phase: any, pIdx: number) => {
                        const isExpanded = expandedPhase === pIdx;
                        const tasksList = phase.tasks || [];
                        const completedCount = tasksList.filter((_: any, tIdx: number) => completedTasks[`${pIdx}-${tIdx}`]).length;
                        const isPhaseDone = completedCount === tasksList.length && tasksList.length > 0;

                        return (
                          <div 
                            key={pIdx} 
                            className={cn(
                              "border rounded-[2rem] overflow-hidden transition-all duration-300",
                              isExpanded ? "border-indigo-200 bg-white shadow-md" : "border-slate-200 bg-slate-50/10 hover:border-slate-350"
                            )}
                          >
                            {/* Phase Accordion Header */}
                            <button
                              onClick={() => setExpandedPhase(isExpanded ? null : pIdx)}
                              className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black tracking-wider shrink-0 border",
                                  isPhaseDone 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                    : isExpanded 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-650"
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                )}>
                                  {isPhaseDone ? "✓" : pIdx + 1}
                                </span>
                                <div className="truncate">
                                  <strong className="text-sm font-black text-slate-800 leading-tight block">{phase.title}</strong>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                                    {completedCount} of {tasksList.length} tasks completed
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border hidden sm:inline-block",
                                  isPhaseDone ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-650 border-blue-100"
                                )}>
                                  {isPhaseDone ? "COMPLETED" : "IN PROGRESS"}
                                </span>
                                <span className="text-slate-400 font-black text-xs">
                                  {isExpanded ? "▲" : "▼"}
                                </span>
                              </div>
                            </button>

                            {/* Phase Accordion Content */}
                            {isExpanded && (
                              <div className="px-6 pb-6 border-t border-slate-100 pt-5 space-y-5 animate-slide-down">
                                {/* Tasks Checklist */}
                                <div className="space-y-3">
                                  <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Implementation Tasks Checklist</strong>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {tasksList.map((task: string, tIdx: number) => {
                                      const isChecked = !!completedTasks[`${pIdx}-${tIdx}`];
                                      return (
                                        <label 
                                          key={tIdx} 
                                          className={cn(
                                            "p-3 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all text-xs font-semibold leading-normal",
                                            isChecked 
                                              ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" 
                                              : "bg-white border-slate-150 text-slate-650 hover:bg-slate-50/50"
                                          )}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              setCompletedTasks(prev => ({
                                                ...prev,
                                                [`${pIdx}-${tIdx}`]: e.target.checked
                                              }));
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                                          />
                                          <span>{task}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Estimated Effort</span>
                                    <strong className="text-xs text-slate-700 font-bold">{phase.estimatedEffort || "Not specified"}</strong>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Difficulty Complexity</span>
                                    <strong className="text-xs text-slate-700 font-bold uppercase tracking-wider">{phase.difficulty || "Medium"}</strong>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Phase Dependencies</span>
                                    <strong className="text-xs text-slate-700 font-bold">{phase.dependencies || "None"}</strong>
                                  </div>
                                </div>

                                {/* Detailed Instructions & Recruiter View */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 border border-slate-150 rounded-2xl space-y-2">
                                    <strong className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-indigo-600">Best Practices & Guidelines</strong>
                                    <ul className="space-y-1 text-[11px] font-semibold text-slate-500">
                                      {Array.isArray(phase.bestPractices) 
                                        ? phase.bestPractices.map((bp: string, bpIdx: number) => (
                                            <li key={bpIdx} className="flex gap-1.5 items-start"><span className="text-indigo-500">•</span><span>{bp}</span></li>
                                          ))
                                        : <li>• Follow structured clean coding guidelines.</li>
                                      }
                                    </ul>
                                  </div>
                                  <div className="p-4 border border-slate-155 rounded-2xl bg-indigo-50/10 space-y-2">
                                    <strong className="text-[8px] font-black text-indigo-800 uppercase tracking-widest block">What Recruiters Expect to See</strong>
                                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                                      {phase.recruiterExpectation}
                                    </p>
                                  </div>
                                </div>

                                {/* Copyable Resume Bullet point */}
                                {phase.resumeBullet && (
                                  <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2.5">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                      <strong className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Resume Bullet Point Unlocked</strong>
                                      <button
                                        onClick={() => handleCopyText(phase.resumeBullet, `bullet-${pIdx}`)}
                                        className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest cursor-pointer"
                                      >
                                        {copiedKey === `bullet-${pIdx}` ? "Copied!" : "Copy Point"}
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-mono text-slate-300 select-all leading-normal">
                                      "{phase.resumeBullet}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Legacy Format Fallback
                    <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8 py-2">
                      {blueprint.roadmap.map((step: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <span className="absolute -left-[41px] top-1.5 bg-slate-900 text-white rounded-full h-6 w-6 text-[10px] flex items-center justify-center font-black border-4 border-white shadow">
                            {idx + 1}
                          </span>
                          <div className="p-5 border border-slate-200 rounded-3xl bg-slate-50/20 hover:border-blue-300 hover:bg-white transition-all space-y-2">
                            <strong className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Implementation Phase {idx + 1}</strong>
                            <p className="text-xs text-slate-655 font-semibold leading-relaxed whitespace-pre-wrap">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. README & EXPORTER */}
          {activeSubTab === "documentation" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 font-display">System Documentation Exporter</h2>

                {/* Inner tabs */}
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: "readme", label: "README.md" },
                    { id: "resume", label: "Resume Bullet" },
                    { id: "linkedin", label: "LinkedIn Post" }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setActiveDocTab(d.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        activeDocTab === d.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exporters codes */}
              {blueprint?.documentation && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Markdown code</span>
                    <button
                      onClick={() => handleCopyText(blueprint.documentation[activeDocTab], "doc-copy")}
                      className="px-3.5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === "doc-copy" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-slate-950 text-slate-300 p-6 rounded-3xl font-mono text-[11px] overflow-y-auto max-h-[300px] border border-slate-900 leading-relaxed whitespace-pre-wrap select-all">
                    {blueprint.documentation[activeDocTab]}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 7. INTERVIEW STATION (5-Level Progressive Engineering Mentor Q&A) */}
          {activeSubTab === "interview" && (() => {
            const hasLevels = blueprint?.interviewQuestions && (
              blueprint.interviewQuestions.level1 || 
              blueprint.interviewQuestions.level2 ||
              blueprint.interviewQuestions.level3 ||
              blueprint.interviewQuestions.level4 ||
              blueprint.interviewQuestions.level5
            );
            const hasSections = blueprint?.interviewQuestions && typeof blueprint.interviewQuestions === "object" && !Array.isArray(blueprint.interviewQuestions) && !hasLevels;
            
            // Resolve questions list for selected round/level
            let currentQuestions: any[] = [];
            const activeCategory = (activeQuestionCategory === "all" || !activeQuestionCategory.startsWith("level")) 
              ? "level1" 
              : activeQuestionCategory;
            
            if (hasLevels) {
              currentQuestions = blueprint.interviewQuestions[activeCategory] || [];
            } else if (hasSections) {
              const iq = blueprint.interviewQuestions;
              if (activeCategory === "level1") currentQuestions = iq.sectionA || [];
              else if (activeCategory === "level2") currentQuestions = [...(iq.sectionB || []), ...(iq.sectionF || [])];
              else if (activeCategory === "level3") currentQuestions = iq.sectionC || [];
              else if (activeCategory === "level4") currentQuestions = iq.sectionD || [];
              else if (activeCategory === "level5") currentQuestions = [...(iq.sectionE || []), ...(iq.sectionG || [])];
            } else {
              // Legacy Flat Array Fallback
              const questionsList = blueprint?.interviewQuestions || [];
              if (activeCategory === "level1") currentQuestions = questionsList.slice(0, 5);
              else if (activeCategory === "level2") currentQuestions = questionsList.slice(5, 10);
              else if (activeCategory === "level3") currentQuestions = questionsList.slice(10, 15);
              else if (activeCategory === "level4") currentQuestions = questionsList.slice(15, 20);
              else if (activeCategory === "level5") currentQuestions = questionsList.slice(20);
            }

            return (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="border-b border-slate-100 pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-display">Technical Mock Interview Station</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Practice progressive mock interview rounds designed to simulate actual campus placement cycles.
                    </p>
                  </div>

                  {/* Level Selector */}
                  <div className="flex flex-wrap gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    {[
                      { id: "level1", label: "L1: Project Explanation" },
                      { id: "level2", label: "L2: Tech Understanding" },
                      { id: "level3", label: "L3: Implementation" },
                      { id: "level4", label: "L4: Optimization" },
                      { id: "level5", label: "L5: Advanced System" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveQuestionCategory(tab.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                          activeCategory === tab.id ? "bg-white text-slate-950 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions Catalog */}
                <div className="space-y-6">
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map((qa: any, idx: number) => {
                      return (
                        <div key={idx} className="border border-slate-200 p-6 rounded-[2rem] bg-white space-y-4 shadow-sm hover:border-indigo-300 transition-colors">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest">
                              {activeCategory.toUpperCase()} - QUESTION #{idx + 1}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight block mt-1">{qa.q}</h4>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs leading-normal">
                            {/* Answer, Concept & Code Blocks */}
                            <div className="lg:col-span-7 space-y-4 bg-slate-50/40 p-5 border border-slate-150 rounded-2xl">
                              <div className="space-y-1">
                                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ideal Model Answer</strong>
                                <p className="text-slate-700 font-semibold leading-relaxed">{qa.a}</p>
                              </div>
                              
                              {qa.concept && (
                                <div className="space-y-1 pt-2 border-t border-slate-150">
                                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Core Concept Definition</strong>
                                  <p className="text-slate-655 font-bold">{qa.concept}</p>
                                </div>
                              )}

                              {qa.explanation && (
                                <div className="space-y-1 pt-2 border-t border-slate-150">
                                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Technical Explanation</strong>
                                  <p className="text-slate-600 font-semibold leading-relaxed">{qa.explanation}</p>
                                </div>
                              )}

                              {qa.realExample && (
                                <div className="space-y-1 pt-2 border-t border-slate-150">
                                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Real-World Code Context / Example</strong>
                                  <pre className="bg-slate-950 text-indigo-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-900 leading-normal whitespace-pre-wrap">
                                    {qa.realExample}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Evaluation and Common mistakes */}
                            <div className="lg:col-span-5 space-y-3">
                              {qa.mistakes && (
                                <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-2xl">
                                  <strong className="text-[9px] font-black text-rose-800 uppercase tracking-widest block">Common Pitfalls to Avoid</strong>
                                  <p className="text-slate-600 font-semibold leading-normal mt-1">{qa.mistakes}</p>
                                </div>
                              )}
                              {qa.tips && (
                                <div className="bg-blue-50/40 p-4 border border-blue-100 rounded-2xl">
                                  <strong className="text-[9px] font-black text-blue-700 uppercase tracking-widest block">Interview Execution Tip</strong>
                                  <p className="text-slate-600 font-semibold leading-normal mt-1">{qa.tips}</p>
                                </div>
                              )}
                              {qa.productionPerspective && (
                                <div className="bg-amber-50/30 p-4 border border-amber-100 rounded-2xl">
                                  <strong className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">Production Perspective</strong>
                                  <p className="text-slate-600 font-semibold leading-normal mt-1">{qa.productionPerspective}</p>
                                </div>
                              )}
                              {qa.followUps && qa.followUps.length > 0 && (
                                <div className="bg-indigo-50/20 p-4 border border-indigo-100/60 rounded-2xl">
                                  <strong className="text-[9px] font-black text-indigo-755 uppercase tracking-widest block">Follow-Up Probes</strong>
                                  <ul className="space-y-1 mt-1.5 text-slate-500 font-semibold">
                                    {qa.followUps.map((f: string, fIdx: number) => (
                                      <li key={fIdx} className="flex gap-1.5 items-start"><span className="text-indigo-500">•</span><span>{f}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold">
                      No questions available for this round. Compile a new project blueprint.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>

      </div>

      {/* RIGHT COLUMN (Recruiter simulator, cost grids, commits logs, and meters) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Readiness progress meter */}
        {blueprint?.readyMeter && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Project Build Readiness Meter</span>
            </h3>

            <div className="space-y-4">
              {[
                { label: "Project Completion %", val: blueprint.readyMeter.completion, color: "bg-blue-500" },
                { label: "Portfolio Readiness %", val: blueprint.readyMeter.portfolio, color: "bg-indigo-500" },
                { label: "Interview Readiness %", val: blueprint.readyMeter.interview, color: "bg-purple-500" },
                { label: "Recruiter Readiness %", val: blueprint.readyMeter.recruiter, color: "bg-emerald-500" }
              ].map((meter, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
                    <span>{meter.label}</span>
                    <span>{meter.val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div className={cn("h-full rounded-full transition-all duration-500", meter.color)} style={{ width: `${meter.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Cost Estimator */}
        {blueprint?.costEstimator && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Cloud Project Cost Estimator</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Compute Cost</span>
                <strong className="text-slate-800 font-black block mt-1">{blueprint.costEstimator.compute}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Database Cost</span>
                <strong className="text-slate-800 font-black block mt-1">{blueprint.costEstimator.database}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cache Layer Cost</span>
                <strong className="text-slate-800 font-black block mt-1">{blueprint.costEstimator.cache}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Storage Cost</span>
                <strong className="text-slate-800 font-black block mt-1">{blueprint.costEstimator.storage}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Recruiter View Simulator */}
        {blueprint?.recruiterReasoning && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Recruiter View Simulator</span>
            </h3>

            <div className="space-y-3 text-xs leading-normal">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <strong className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">✓ WHAT STANDS OUT</strong>
                <p className="text-slate-600 font-semibold mt-1">Multi-tenant sharding and JWT rotation demonstrates production architectures.</p>
              </div>
              <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl">
                <strong className="text-[9px] font-black text-rose-800 uppercase tracking-widest block">⚠️ WHAT LOOKS WEAK</strong>
                <p className="text-slate-655 font-semibold mt-1">Missing performance profiling logs. Add cache hit ratio stats to portfolio description.</p>
              </div>
            </div>
          </div>
        )}

        {/* Engineering Development Tracker Summary */}
        {blueprint && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Engineering Mentor Tracker</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500 font-black uppercase tracking-wider text-[10px]">
                <span>Overall Implementation</span>
                <span>{(() => {
                  const phases = blueprint.roadmap || [];
                  let totalTasks = 0;
                  let completedCount = 0;
                  phases.forEach((p: any, pIdx: number) => {
                    const tasksList = p.tasks || [];
                    totalTasks += tasksList.length;
                    tasksList.forEach((_: any, tIdx: number) => {
                      if (completedTasks[`${pIdx}-${tIdx}`]) completedCount++;
                    });
                  });
                  return totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
                })()}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" 
                  style={{
                    width: `${(() => {
                      const phases = blueprint.roadmap || [];
                      let totalTasks = 0;
                      let completedCount = 0;
                      phases.forEach((p: any, pIdx: number) => {
                        const tasksList = p.tasks || [];
                        totalTasks += tasksList.length;
                        tasksList.forEach((_: any, tIdx: number) => {
                          if (completedTasks[`${pIdx}-${tIdx}`]) completedCount++;
                        });
                      });
                      return totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
                    })()}%`
                  }} 
                />
              </div>

              <div className="space-y-2 pt-2">
                {(blueprint.roadmap || []).slice(0, 4).map((p: any, pIdx: number) => {
                  const tasksList = p.tasks || [];
                  const compCount = tasksList.filter((_: any, tIdx: number) => completedTasks[`${pIdx}-${tIdx}`]).length;
                  const isDone = compCount === tasksList.length && tasksList.length > 0;
                  return (
                    <div key={pIdx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3">
                      <div className="overflow-hidden">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-tight">PHASE {pIdx + 1}</span>
                        <span className="truncate block mt-0.5 text-slate-750 font-bold">{p.title}</span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 border",
                        isDone ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-650 border-blue-100"
                      )}>
                        {isDone ? "COMPLETED" : `${compCount}/${tasksList.length} TASKS`}
                      </span>
                    </div>
                  );
                })}
                <button 
                  onClick={() => setActiveSubTab("roadmap")}
                  className="w-full text-center py-2 text-[10px] font-black text-indigo-650 uppercase tracking-wider hover:text-indigo-800 transition-colors cursor-pointer border border-dashed border-indigo-200 rounded-xl bg-indigo-50/20"
                >
                  View Full 12-Phase Roadmap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Copilot Widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 relative">
              <Bot className="w-4.5 h-4.5 animate-pulse" />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Project Intelligence Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Systems Design Advisor</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/20 text-xs leading-relaxed">
            {copilotMessages.map(m => (
              <div key={m.id} className={cn("flex gap-2 max-w-[90%]", m.role === "user" ? "ml-auto flex-row-reverse" : "self-start")}>
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0 border", m.role === "copilot" ? "bg-indigo-50 border-indigo-100 text-indigo-650" : "bg-slate-900 text-white")}>
                  {m.role === "copilot" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={cn("p-3 rounded-2xl shadow-sm border", m.role === "copilot" ? "bg-white border-slate-150 text-slate-700" : "bg-slate-900 border-slate-900 text-white")}>
                  {m.content.split("\n").map((line, lIdx) => {
                    if (line.startsWith("### ")) return <h4 key={lIdx} className="font-black text-slate-900 mt-2 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                    if (line.startsWith("- ") || line.startsWith("* ")) return <li key={lIdx} className="ml-3 list-disc text-slate-650 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                    return <p key={lIdx} className="my-0.5">{line}</p>;
                  })}
                </div>
              </div>
            ))}
            {copilotLoading && (
              <div className="flex gap-2 max-w-[80%] self-start animate-pulse">
                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold">
                  Evaluating architecture parameters...
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask custom system design tradeoffs..."
              value={copilotInput}
              onChange={e => setCopilotInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleCopilotSend();
              }}
              className="flex-grow p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white"
            />
            <button
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleCopilotSend()}
              className="p-2 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
