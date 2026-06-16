"use client";

import React, { useState } from "react";
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
  Download
} from "lucide-react";
import { cn, flattenSkills } from "@/lib/utils";

// Types
interface ProjectProfile {
  name: string;
  role: string;
  skills: string[];
  projects: Array<{
    title: string;
    tech: string[];
    description: string;
    impactScore: number;
  }>;
}

interface ProjectBlueprint {
  title: string;
  problem: string;
  solution: string;
  features: string[];
  techStack: Record<string, string>;
  databaseSchema: string;
  apiStructure: string[];
  roadmap: string[];
  documentation: {
    readme: string;
    resume: string;
    linkedin: string;
    interview: string;
  };
  interviewQuestions: Array<{ q: string; a: string }>;
  recruiterScore: number;
  resumeScore: number;
  portfolioScore: number;
}

const defaultProfile: ProjectProfile = {
  name: "Mujahid Ahmed",
  role: "Full Stack Developer",
  skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "AWS", "Git"],
  projects: [
    {
      title: "Real-time Whiteboard",
      tech: ["React", "WebSockets", "Canvas API"],
      description: "Collaborative whiteboard canvas synchronizing multi-user coordinates under sub-second latency constraints.",
      impactScore: 88
    }
  ]
};

// Company focus profiles
const COMPANY_PROJECT_FOCUS: Record<string, { desc: string; prioritySkills: string[]; focus: string }> = {
  "Google": { desc: "Focuses on massive scale, low latency, and algorithms.", prioritySkills: ["C++", "Go", "Distributed Systems", "Algorithms"], focus: "Scale & Algorithm Performance" },
  "Amazon": { desc: "Focuses on customer obsession, transaction locks, and operational resilience.", prioritySkills: ["Java", "AWS", "DynamoDB", "Messaging Queues"], focus: "Operational Resiliency & Concurrency" },
  "Microsoft": { desc: "Focuses on cloud integrations, enterprise governance, and developer productivity.", prioritySkills: ["C#", "Azure", "TypeScript", "SQL Server"], focus: "Enterprise Scaling & SDK development" },
  "IBM": { desc: "Focuses on AI infrastructure, enterprise middleware, and robust security nodes.", prioritySkills: ["Java", "Python", "RedHat OpenShift", "Kubernetes"], focus: "Enterprise Services & Hybrid Cloud" },
  "Oracle": { desc: "Focuses on database performance, caching locks, and cloud analytics.", prioritySkills: ["Java", "SQL Tuning", "Oracle Cloud Infrastructure", "Redis"], focus: "Database Optimizations & ACID Compliance" },
  "Deloitte": { desc: "Focuses on business workflow compliance, analytics, and problem solving.", prioritySkills: ["Python", "Power BI", "SQL", "Cloud Analytics"], focus: "Business Workflow & Diagnostics" },
  "TCS": { desc: "Focuses on migration pipelines, client delivery schedules, and service operations.", prioritySkills: ["Java", "Spring Boot", "REST APIs", "Oracle DB"], focus: "Service Modernization & Client Delivery" }
};

// Curated role template recommendations
const ROLE_SUGGESTED_PROJECTS: Record<string, Array<{ title: string; difficulty: string; tech: string[]; summary: string }>> = {
  "Full Stack Developer": [
    { title: "Collaborative Whiteboard Node", difficulty: "Intermediate", tech: ["React", "WebSockets", "Node.js"], summary: "Real-time painting canvas synchronizing vector logs under sub-second delay rates." },
    { title: "Serverless Checkout Engine", difficulty: "Advanced", tech: ["AWS Lambda", "Redis", "TypeScript"], summary: "Cloud-native checkouts processor managing atomic stock reduction locks." }
  ],
  "AI Engineer": [
    { title: "LangChain Strategy Evaluator", difficulty: "Advanced", tech: ["Python", "Vector DBs", "Gemini API"], summary: "Document diagnostic pipeline parsing corporate PDFs to score operational compliance." },
    { title: "AI Model Fine-Tuning Dashboard", difficulty: "Intermediate", tech: ["Python", "Flask", "HuggingFace"], summary: "Portal managing hyperparameters configurations to plot training loss charts." }
  ],
  "Backend Developer": [
    { title: "High-Throughput Message Broker", difficulty: "Advanced", tech: ["Go", "Kafka", "PostgreSQL"], summary: "Distributed logging routine processing concurrent telemetry events." },
    { title: "GraphQL API Gateway Node", difficulty: "Intermediate", tech: ["Node.js", "GraphQL", "Redis"], summary: "Unified request router schema pooling client calls and indexing database nodes." }
  ],
  "Data Analyst": [
    { title: "Sales Funnel ETL Pipeline", difficulty: "Intermediate", tech: ["SQL", "dbt", "Power BI"], summary: "Batch processing routine cleaning transactions logs to render diagnostic view charts." },
    { title: "Hiring Market Trends Dashboard", difficulty: "Beginner", tech: ["Python", "Pandas", "Streamlit"], summary: "Scraper script aggregating job listing metrics to map visual salary statistics." }
  ]
};

// Helper outside component for react compiler
const generateCopilotMsgId = () => {
  return `copilot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function ProjectOS() {
  const [activeSubTab, setActiveSubTab] = useState<string>("discovery");

  const PROFILE_KEY = "project_os_profile";

  // State Management
  const [profile, setProfile] = useState<ProjectProfile>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return defaultProfile;
  });

  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [targetCompany, setTargetCompany] = useState<string>("Google");
  const [projectDifficulty, setProjectDifficulty] = useState<string>("Advanced");
  const [interestArea, setInterestArea] = useState<string>("Distributed Web Systems");

  // Dynamic Blueprint State
  const [blueprint, setBlueprint] = useState<ProjectBlueprint | null>(null);

  // Copilot messages
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Hello! I am your **Project Advisor OS Copilot**. I can evaluate your projects for technical depth, generate customized Entity-Relationship schemas, outline week-by-week roadmaps, or write interview prep answers. What are we building today?"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Readiness checklist states
  const [readinessChecklist, setReadinessChecklist] = useState<Record<string, boolean>>({
    "planning": true,
    "development": false,
    "testing": false,
    "deployment": false,
    "documentation": false
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync profile details
  const handleImportFromResume = () => {
    if (typeof window !== "undefined") {
      const cachedResume = localStorage.getItem("resume_builder_profile");
      if (cachedResume) {
        try {
          const parsed = JSON.parse(cachedResume);
          const flattenedSkills = flattenSkills(parsed.skills || []);
          const updated: ProjectProfile = {
            ...profile,
            role: parsed.personal?.targetRole || profile.role,
            skills: flattenedSkills.length > 0 ? flattenedSkills : profile.skills
          };
          setProfile(updated);
          if (parsed.personal?.targetRole) {
            setTargetRole(parsed.personal.targetRole);
          }
          alert("Profile variables successfully synced from Resume OS.");
        } catch {
          alert("Failed to parse Resume Builder profile configurations.");
        }
      } else {
        alert("No resume profile config found in Resume OS. Create your resume first!");
      }
    }
  };

  const handleImportFromPortfolio = () => {
    if (typeof window !== "undefined") {
      const cachedPortfolio = localStorage.getItem("portfolio_profile_os");
      if (cachedPortfolio) {
        try {
          const parsed = JSON.parse(cachedPortfolio);
          if (parsed.projects && parsed.projects.length > 0) {
            const updatedProjects = parsed.projects.map((p: { title: string; tech?: string[]; description: string; impactScore?: number }) => ({
              title: p.title,
              tech: p.tech || [],
              description: p.description,
              impactScore: p.impactScore || 85
            }));
            const updatedProfile = {
              ...profile,
              projects: updatedProjects
            };
            setProfile(updatedProfile);
            if (typeof window !== "undefined") {
              localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
            }
            alert(`Synced ${updatedProjects.length} projects from Portfolio Builder OS.`);
          } else {
            alert("No projects listed in your Portfolio Builder OS profiles.");
          }
        } catch {
          alert("Failed to parse Portfolio Builder OS configuration.");
        }
      } else {
        alert("No active Portfolio Builder config found. Set up your portfolio first.");
      }
    }
  };

  // Compile Dynamic Blueprint
  const handleGenerateProject = () => {
    const compFocus = COMPANY_PROJECT_FOCUS[targetCompany] || { desc: "Enterprise operations", prioritySkills: ["Java"], focus: "Scale" };
    const projectTitle = `AI-Powered ${interestArea} Pipeline`;
    const skillsList = Array.from(new Set([...compFocus.prioritySkills.slice(0, 2), ...profile.skills])).slice(0, 3);
    
    const problem = `Existing ${interestArea} platforms struggle to maintain atomic record locks and optimize data routing flows under high transaction concurrencies, failing ${targetCompany}'s requirements for ${compFocus.focus}.`;
    
    const solution = `Engineered a serverless, database-indexed system leveraging ${skillsList.join(" and ")}. Resolves connection chokepoints and aligns with ${compFocus.desc}`;

    const features = [
      "Sub-second event synchronization nodes",
      "Dynamic data caching using Redis lock loops",
      "Automated PDF reporting and diagnostics export",
      "Interactive analytics chart dashboards"
    ];

    const techStack = {
      frontend: skillsList[0] || "React",
      backend: skillsList[1] || "Node.js",
      database: "PostgreSQL with indexing loops",
      cloud: "AWS Lambda / serverless routines",
      monitoring: "GitHub Actions CI/CD pipelines"
    };

    const schema = `Table Users {\n  id integer [primary key]\n  email varchar\n}\n\nTable Projects {\n  id integer [primary key]\n  title varchar\n  owner_id integer [ref: > Users.id]\n}\n\nTable Metrics {\n  id integer [primary key]\n  project_id integer [ref: > Projects.id]\n  latency_ms integer\n}`;

    const api = [
      "POST /api/project/generate - Compiles project configurations and returns blueprint JSON.",
      "GET /api/project/:id/metrics - Fetches real-time transaction latencies and load factors.",
      "POST /api/project/:id/deploy - Triggers GitHub Actions pipeline run hooks."
    ];

    const roadmap = [
      "Week 1: Research, database schema design, and ER layout mappings.",
      "Week 2: Backend development, configuring REST endpoints, and Dockerization.",
      "Week 3: Frontend dashboard UI design, charting integration, and WebSockets sync.",
      "Week 4: AWS serverless deployment, documentation exports, and final tests."
    ];

    const docReadme = `# ${projectTitle}\n\n## Overview\n${problem}\n\n## Solution\n${solution}\n\n## Setup\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``;

    const docResume = `• Engineered a high-throughput ${projectTitle} using ${skillsList.join(", ")}, reducing database queries overhead by 35% and improving API latency averages.`;

    const docLinkedin = `🚀 Proud to share my latest project: ${projectTitle}! \n\nI resolved transaction lockups under concurrent loads by integrating distributed caches. Special thanks to the BuggedBrain team. #webdev #engineering`;

    const docInterview = `We faced data coordination chokepoints under heavy transaction stress. I resolved it by wrapping write streams in a Redis inventory lock loop before hitting PostgreSQL.`;

    const questions = [
      { q: "Why did you choose PostgreSQL over MongoDB for this project?", a: "We required ACID compliance for concurrent inventory locks, and PostgreSQL indexing loops gave us predictable query latencies." },
      { q: "How does the Redis lock loop prevent double-booking?", a: "It locks the specific inventory key atomically using SETNX, releasing it only after database transaction writes complete." }
    ];

    const recruiterScore = Math.round(75 + Math.random() * 20);
    const resumeScore = Math.round(70 + Math.random() * 25);
    const portfolioScore = Math.round(72 + Math.random() * 22);

    setBlueprint({
      title: projectTitle,
      problem,
      solution,
      features,
      techStack,
      databaseSchema: schema,
      apiStructure: api,
      roadmap,
      documentation: {
        readme: docReadme,
        resume: docResume,
        linkedin: docLinkedin,
        interview: docInterview
      },
      interviewQuestions: questions,
      recruiterScore,
      resumeScore,
      portfolioScore
    });

    // Reset checklist on new compile
    setReadinessChecklist({
      "planning": true,
      "development": false,
      "testing": false,
      "deployment": false,
      "documentation": false
    });

    alert(`Unique Project Blueprint compiled successfully: ${projectTitle} (${targetCompany} target focus).`);
  };

  // Gap Analysis diagnostic engine
  const getGapAnalysis = () => {
    const gaps = [];
    const combinedTech = profile.projects.map(p => p.tech).flat().join(" ").toLowerCase();
    
    if (!combinedTech.includes("aws") && !combinedTech.includes("lambda") && !combinedTech.includes("cloud")) {
      gaps.push({ type: "Missing Domain", title: "Cloud Deployments", desc: "None of your listed projects showcase AWS/Azure cloud deployment experience. Target companies like Google/Amazon require AWS Lambda or serverless deployment exposure." });
    }
    if (!combinedTech.includes("redis") && !combinedTech.includes("kafka") && !combinedTech.includes("queue")) {
      gaps.push({ type: "Missing Tech Node", title: "Distributed Caching / Messaging", desc: "Your projects lack advanced backend middleware like Redis or Kafka. Adding a Redis query cache will double your recruiter visibility rank." });
    }
    if (profile.projects.length < 2) {
      gaps.push({ type: "Complexity Deficit", title: "Insufficient Project Count", desc: "You have less than 2 structured projects configured. We recommend compiling another Advanced-level project to boost your Portfolio Completeness rating." });
    }
    return gaps;
  };

  // Completeness score
  const getReadinessPercentage = () => {
    const total = Object.values(readinessChecklist).filter(Boolean).length;
    return Math.round((total / 5) * 100);
  };

  // Copilot stratégic advisor
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: generateCopilotMsgId(),
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
          message: `Project Advisor OS advice: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole,
            targetCompany,
            readiness: getReadinessPercentage(),
            projectTitle: blueprint?.title || "None generated"
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: data.data.reply
        }
      ]);
    } catch {
      // Robust offline fallbacks
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("worth") || q.includes("strong")) {
        reply = `### Reviewing Project Worthiness:
- Your current project (**${blueprint?.title || "Real-time Whiteboard"}**) matches advanced guidelines.
- **Recommendations to improve**:
  1. Add a custom database replication diagram in README.
  2. Implement an end-to-end GitHub Actions YAML script.
  3. Feature quantitative metrics (e.g. 'Improved response times by 35%').`;
      } else if (q.includes("ibm") || q.includes("tcs") || q.includes("company")) {
        reply = `### Targeting ${targetCompany}:
${COMPANY_PROJECT_FOCUS[targetCompany]?.desc || "Focus on robust system scaling."}
- Build a project focusing on **${(COMPANY_PROJECT_FOCUS[targetCompany]?.prioritySkills || ["Java", "Cloud"]).join(" and ")}**.
- Emphasize **${COMPANY_PROJECT_FOCUS[targetCompany]?.focus || "Enterprise Scalability"}** parameters in your interview briefs.`;
      } else if (q.includes("interview") || q.includes("explain")) {
        reply = `### How to Explain in Technical Rounds:
- **Use the STAR Method**:
  - **Situation**: Faced transaction database blockages under load.
  - **Task**: Design a concurrent caching lock.
  - **Action**: Engineered Redis TTL check blocks before hitting DB schemas.
  - **Result**: latency averages dropped by 35%.`;
      } else {
        reply = `To align your projects for **${targetCompany}** as a **${targetRole}**, select them in the generator form and click **Generate AI Project Blueprint**.`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const gapAnalysisList = getGapAnalysis();
  const readinessPercentage = getReadinessPercentage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* LEFT SECTION (Workspace Tabs) */}
      <div className="lg:col-span-8 space-y-8">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" />
            Project Architecture OS
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Project Advisor OS
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Complete Project Operating System to discover, blueprint, score, and optimize developer project cards for elite placement drives.
          </p>
        </div>

        {/* Sub tabs list selection */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "discovery", label: "Discovery Engine", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "generator", label: "AI Generator Builder", icon: <Plus className="w-4 h-4" /> },
            { id: "gap", label: "Gap Diagnostics", icon: <FileText className="w-4 h-4 animate-pulse" /> },
            { id: "architecture", label: "Architecture Studio", icon: <Zap className="w-4 h-4" /> },
            { id: "roadmap", label: "Roadmap & Timelines", icon: <Award className="w-4 h-4" /> },
            { id: "documentation", label: "README & Exporter", icon: <Download className="w-4 h-4" /> },
            { id: "interview", label: "Interview Station", icon: <Bot className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                activeSubTab === tab.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Cards Content */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          {/* TAB 1: DISCOVERY ENGINE */}
          {activeSubTab === "discovery" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-black text-slate-900 font-display">Project Discovery Channels</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleImportFromResume}
                    className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    Sync Resume OS
                  </button>
                  <button
                    onClick={handleImportFromPortfolio}
                    className="px-3.5 py-2 bg-emerald-50 border border-emerald-100 text-emerald-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all cursor-pointer animate-pulse"
                  >
                    Sync Portfolio projects
                  </button>
                </div>
              </div>

              {/* Roles selectors and filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 border border-slate-150 rounded-2xl">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Path Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    {["Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer", "AI Engineer", "ML Engineer", "Data Analyst", "Cloud Engineer", "DevOps Engineer", "Cybersecurity Engineer"].map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company Target Focus</label>
                  <select
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    {Object.keys(COMPANY_PROJECT_FOCUS).map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Difficulty Metric</label>
                  <select
                    value={projectDifficulty}
                    onChange={(e) => setProjectDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    {["Beginner", "Intermediate", "Advanced", "Industry-Level"].map(diff => (
                      <option key={diff} value={diff}>{diff} Project</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Suggestions Cards Lists */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800">Recommended Placement Project Ideas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(ROLE_SUGGESTED_PROJECTS[targetRole] || ROLE_SUGGESTED_PROJECTS["Full Stack Developer"]).map((proj, i) => (
                    <div key={i} className="border border-slate-200 p-5 rounded-2xl space-y-4 bg-slate-50/20 hover:border-indigo-300 transition-colors flex flex-col justify-between h-44">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm font-black text-slate-800 leading-tight">{proj.title}</strong>
                          <span className="text-[8px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{proj.difficulty}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-3">{proj.summary}</p>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <span>Stack: {proj.tech.slice(0, 2).join(", ")}</span>
                        <button
                          onClick={() => {
                            setInterestArea(proj.title);
                            setActiveSubTab("generator");
                            alert(`Set "${proj.title}" as active generator theme.`);
                          }}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Select Idea
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI GENERATOR BUILDER */}
          {activeSubTab === "generator" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">AI Project Blueprint Generator</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-55/20 p-5 border border-slate-200 rounded-2xl">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enter Interest Area / Core Theme</label>
                  <input
                    type="text"
                    value={interestArea}
                    onChange={(e) => setInterestArea(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    placeholder="E.g. Serverless API database lock"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    disabled={!interestArea.trim()}
                    onClick={handleGenerateProject}
                    className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-650 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Generate AI Project Blueprint</span>
                  </button>
                </div>
              </div>

              {blueprint && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-lg font-black text-slate-950 font-display">{blueprint.title}</h3>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-250 text-slate-550 text-[10px] font-black uppercase tracking-wider rounded-lg">Recruiter Match: {blueprint.recruiterScore}%</span>
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-150 text-indigo-750 text-[10px] font-black uppercase tracking-wider rounded-lg">Resume Index: {blueprint.resumeScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Problem Statement</strong>
                      <p className="text-xs text-slate-650 font-semibold leading-relaxed leading-normal">{blueprint.problem}</p>
                    </div>
                    <div className="space-y-2">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Proposed Tech Solution</strong>
                      <p className="text-xs text-slate-650 font-semibold leading-relaxed leading-normal">{blueprint.solution}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Core Architecture Highlights</strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {blueprint.features.map((feat, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAP DIAGNOSTICS */}
          {activeSubTab === "gap" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Project Portfolio Gap Analysis</h2>
              <p className="text-xs text-slate-500 font-medium">
                Recruiters scan project details for complexity and middleware. Solve tech vulnerabilities instantly.
              </p>

              <div className="space-y-4 pt-4">
                {gapAnalysisList.length > 0 ? (
                  gapAnalysisList.map((gap, i) => (
                    <div key={i} className="border border-amber-250 p-5 rounded-2xl bg-amber-50/20 space-y-2 hover:border-amber-400 transition-colors">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs font-black text-slate-800 uppercase tracking-widest">{gap.type}: {gap.title}</strong>
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{gap.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-emerald-50/50 border border-emerald-150 rounded-[2rem] text-center text-emerald-800 font-bold">
                    🚀 Superb! Your project profile has no major architectural gaps! Fully configured for {targetRole} tracks.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE STUDIO */}
          {activeSubTab === "architecture" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">System Architecture Studio</h2>
              
              {blueprint ? (
                <div className="space-y-6 pt-4">
                  {/* Tech stack advisor */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Frontend Node", value: blueprint.techStack.frontend },
                      { label: "Backend Routing", value: blueprint.techStack.backend },
                      { label: "Database Layer", value: blueprint.techStack.database },
                      { label: "Cloud Node", value: blueprint.techStack.cloud },
                      { label: "Monitoring / Actions", value: blueprint.techStack.monitoring }
                    ].map((tech, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{tech.label}</span>
                        <strong className="text-xs font-black text-slate-850 block mt-1">{tech.value}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Schema DB diagram */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                    <div className="md:col-span-5 space-y-3">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Entity Relationship Schema</strong>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl font-mono text-[9px] overflow-x-auto border border-slate-900 leading-normal">
                        {blueprint.databaseSchema}
                      </pre>
                    </div>

                    <div className="md:col-span-7 space-y-3">
                      <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">API Router Endpoints</strong>
                      <div className="space-y-2">
                        {blueprint.apiStructure.map((api, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] font-semibold text-slate-750">
                            {api}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem]">
                  Compile an AI Project Blueprint first under the Generator tab to inspect schemas.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ROADMAPS */}
          {activeSubTab === "roadmap" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Project Roadmap & Timelines</h2>
              
              {blueprint ? (
                <div className="space-y-6 pt-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xs font-bold">
                    🚀 Estimated duration: **4 Weeks** | Core learning time: **12 Hours** | Documentation checklist: **Ready**
                  </div>

                  <div className="relative border-l-2 border-indigo-200 pl-6 ml-4 space-y-8 py-2">
                    {blueprint.roadmap.map((step, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[31px] top-0.5 bg-indigo-600 text-white rounded-full h-4 w-4 text-[9px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-150 transition-colors">
                          <strong className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">Stage {idx + 1}</strong>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem]">
                  Compile an AI Project Blueprint first to construct a week-by-week implementation roadmap.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENTATION & EXPORTER */}
          {activeSubTab === "documentation" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Project Documentation Exporter</h2>
              
              {blueprint ? (
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Readme exporter */}
                    <div className="border border-slate-200 p-5 rounded-2xl space-y-3 bg-slate-50/20 relative">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs font-black text-slate-800 block">Generated README.md</strong>
                        <button
                          onClick={() => handleCopyText(blueprint.documentation.readme, "readme-copy")}
                          className="text-slate-450 hover:text-slate-800 transition-all"
                        >
                          {copiedKey === "readme-copy" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[9px] overflow-y-auto h-32 border border-slate-850">
                        {blueprint.documentation.readme}
                      </pre>
                    </div>

                    {/* Resume bullet */}
                    <div className="border border-slate-200 p-5 rounded-2xl space-y-3 bg-slate-50/20 relative flex flex-col justify-between h-44">
                      <div>
                        <div className="flex justify-between items-center">
                          <strong className="text-xs font-black text-slate-800 block">Resume Impact Bullet</strong>
                          <button
                            onClick={() => handleCopyText(blueprint.documentation.resume, "resume-copy")}
                            className="text-slate-450 hover:text-slate-850 transition-all"
                          >
                            {copiedKey === "resume-copy" ? <Check className="w-4.5 h-4.5 text-emerald-600" /> : <Copy className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-650 font-bold leading-relaxed block mt-3 whitespace-pre-wrap">{blueprint.documentation.resume}</p>
                      </div>
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">ATS Keyword Checked ✓</span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem]">
                  Compile an AI Project Blueprint first to generate README markdowns and resume bullets.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: INTERVIEW PREPARATION */}
          {activeSubTab === "interview" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Interview Preparation Station</h2>
              
              {blueprint ? (
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    {blueprint.interviewQuestions.map((qa, i) => (
                      <div key={i} className="border border-slate-200 p-5 rounded-2xl bg-slate-55/10 space-y-3">
                        <strong className="text-xs font-black text-slate-800 block">Question #{i + 1}: {qa.q}</strong>
                        <p className="text-xs text-slate-650 font-semibold leading-relaxed leading-normal bg-white p-3 border border-slate-150 rounded-xl">{qa.a}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <strong className="text-blue-850 text-xs font-black block">STAR Methodology Briefing:</strong>
                    <p className="text-[11px] text-blue-750 font-bold leading-normal leading-relaxed">
                      {blueprint.documentation.interview}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem]">
                  Compile an AI Project Blueprint first to formulate trade-offs and mock interview templates.
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN (Readiness & Copilot Strategist Drawer) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Project completeness tracker */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500 shrink-0" />
              <h3 className="text-base font-black text-slate-900 font-display">Readiness Tracker</h3>
            </div>
            <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">{readinessPercentage}% Complete</span>
          </div>

          <div className="space-y-3">
            {Object.keys(readinessChecklist).map((key) => (
              <div
                key={key}
                onClick={() => setReadinessChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                className={cn(
                  "p-3 border rounded-xl cursor-pointer flex items-center justify-between transition-colors select-none",
                  readinessChecklist[key]
                    ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500"
                )}
              >
                <span className="text-xs uppercase tracking-wider font-black">{key}</span>
                {readinessChecklist[key] ? (
                  <Check className="w-4.5 h-4.5 text-indigo-600" />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gamified badges */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
          <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unlocked Badges Shelf</strong>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Industry Ready", unlocked: true },
              { name: "Cloud Native", unlocked: readinessChecklist.deployment },
              { name: "ATS Booster", unlocked: blueprint !== null },
              { name: "AI Powered", unlocked: targetRole === "AI Engineer" }
            ].map((badge, idx) => (
              <span
                key={idx}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all",
                  badge.unlocked
                    ? "bg-amber-50 border-amber-200 text-amber-650"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                )}
              >
                🏅 {badge.name}
              </span>
            ))}
          </div>
        </div>

        {/* Project Copilot strategically widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[500px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Project Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Architecture coach</span>
            </div>
          </div>

          {/* Messages board */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
            {copilotMessages.map((msg) => {
              const isCopilot = msg.role === "copilot";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%] text-xs font-semibold leading-relaxed",
                    isCopilot ? "self-start" : "ml-auto flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[10px]",
                    isCopilot ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-900 border-slate-900 text-white"
                  )}>
                    {isCopilot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                    isCopilot ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                  )}>
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <li key={idx} className="ml-3 list-disc text-slate-650 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                      }
                      if (line.startsWith("1. ") || line.startsWith("2. ")) {
                        return <li key={idx} className="ml-3 list-decimal text-slate-650 font-bold my-0.5">{line.replace(/^\d+\.\s+/, "")}</li>;
                      }
                      return <p key={idx} className="my-1">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}

            {copilotLoading && (
              <div className="flex gap-3 max-w-[80%] self-start animate-pulse text-xs">
                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                  <span>Reviewing project architectures...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick choices suggestions */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
            {[
              { label: "REVIEW CODE IMPACT", query: "Will recruiters like this project?" },
              { label: "EXPLAIN TRADE-OFFS", query: "How do I explain this in interviews?" },
              { label: "ALIGN FOR IBM", query: "How do I optimize for IBM?" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input details */}
          <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask custom design patterns tips..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
              }}
              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleCopilotSend()}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
