"use client";

import React, { useState } from "react";
import {
  Globe,
  Upload,
  Sparkles,
  Award,
  Zap,
  FolderOpen,
  TrendingUp,
  Download,
  Bot,
  User,
  Send,
  Eye,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  github: string;
  live: string;
  impactScore: number;
  problem?: string;
  solution?: string;
  challenges?: string;
}

interface PortfolioProfile {
  name: string;
  role: string;
  about: string;
  email: string;
  linkedin: string;
  github: string;
  skills: {
    frontend: string[];
    backend: string[];
    databases: string[];
    cloud: string[];
    aiml: string[];
    tools: string[];
  };
  education: {
    college: string;
    degree: string;
    year: string;
    cgpa: string;
  };
  experience: Array<{
    role: string;
    company: string;
    period: string;
    desc: string;
  }>;
  projects: Project[];
  certifications: Array<{ name: string; issuer: string; date: string }>;
  achievements: string[];
}

// Helpers outside component scope for purity rules
const generateMsgId = (role: string): string => {
  return `msg-${Date.now()}-${role}-${Math.random().toString(36).substring(2, 9)}`;
};

const defaultProfile: PortfolioProfile = {
  name: "Mujahid Ahmed",
  role: "Full Stack Developer",
  about: "Passionate Computer Science graduate focusing on building scalable web architectures and integration pipelines. Experienced in React, Node.js, and Cloud API structures.",
  email: "mujahid@example.com",
  linkedin: "linkedin.com/in/mujahid-ahmed",
  github: "github.com/mujahid702",
  skills: {
    frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    backend: ["Node.js", "Express", "RESTful APIs", "WebSockets"],
    databases: ["PostgreSQL", "MongoDB", "Redis"],
    cloud: ["AWS Lambda", "Docker", "Vercel Deployments"],
    aiml: ["Gemini API integrations", "Basic Neural Networks"],
    tools: ["Git", "GitHub Actions", "ESLint", "NPM packages"]
  },
  education: {
    college: "VTU Technical University",
    degree: "B.E. Computer Science",
    year: "Class of 2026",
    cgpa: "8.8/10"
  },
  experience: [
    {
      role: "Backend Intern",
      company: "BuggedBrain Technologies",
      period: "Jan 2026 - Present",
      desc: "Optimized database index query pipelines and integrated AI strategic model engines, reducing API response latency."
    }
  ],
  projects: [
    {
      id: "p1",
      title: "Real-time Whiteboard Platform",
      description: "Collaborative whiteboard workspace supporting multi-user canvas drawing and stickies sync under sub-second latency constraints.",
      tech: ["React", "Node.js", "WebSockets", "Canvas API"],
      github: "github.com/mujahid702/whiteboard",
      live: "whiteboard-demo.vercel.app",
      impactScore: 88,
      problem: "Traditional whiteboards lacked scalable real-time synchronization.",
      solution: "Implemented WebSocket connections managing client draw-coordinates on a centralized coordinate map.",
      challenges: "High coordinate density caused network choke points. Resolved by packaging drawing operations."
    },
    {
      id: "p2",
      title: "Serverless E-Commerce Checkout",
      description: "Cloud-native checkouts processor managing concurrent inventory allocation locks during high-traffic flash sale drive intervals.",
      tech: ["AWS Lambda", "TypeScript", "Redis", "DynamoDB"],
      github: "github.com/mujahid702/checkout-pipeline",
      live: "checkout-demo.vercel.app",
      impactScore: 94,
      problem: "Flash sale concurrency crashes transactional record engines.",
      solution: "Engineered distributed Redis inventory loops ahead of write queues.",
      challenges: "Ensuring atomic stock reduction under concurrent triggers."
    }
  ],
  certifications: [
    { name: "AWS Certified Developer Associate", issuer: "Amazon Web Services", date: "Feb 2026" }
  ],
  achievements: [
    "Winner of the VTU Inter-College Hackathon 2025.",
    "Starred on GitHub for open-source widgets."
  ]
};

export default function PortfolioOS() {
  const [activeSubTab, setActiveSubTab] = useState<string>("analyzer");
  
  // Custom Portfolio configuration keys
  const PROFILE_KEY = "portfolio_profile_os";
  const THEME_KEY = "portfolio_theme_os";
  const COLOR_KEY = "portfolio_color_os";
  const FONT_KEY = "portfolio_font_os";

  // Lazy load state variables
  const [profile, setProfile] = useState<PortfolioProfile>(() => {
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

  const [activeTheme, setActiveTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(THEME_KEY) || "developer";
    }
    return "developer";
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(COLOR_KEY) || "indigo";
    }
    return "indigo";
  });

  const [accentFont, setAccentFont] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(FONT_KEY) || "Outfit";
    }
    return "Outfit";
  });

  // Simulator trackers
  const [atsUploadProgress, setAtsUploadProgress] = useState<number | null>(null);
  const [gitImporting, setGitImporting] = useState(false);
  const [gitUrl, setGitUrl] = useState("");
  const [linkedinSyncing, setLinkedinSyncing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Portfolio Quality score metrics
  const getQualityScore = () => {
    let score = 50; // base score
    if (profile.name && profile.role) score += 10;
    if (profile.about.length > 50) score += 10;
    if (profile.projects.length >= 2) score += 15;
    if (profile.skills.frontend.length > 0 && profile.skills.backend.length > 0) score += 10;
    if (profile.certifications.length > 0) score += 5;
    return Math.min(score, 100);
  };

  const getRecruiterReadyScore = () => {
    let score = 60;
    const qScore = getQualityScore();
    score += Math.round((qScore - 50) * 0.6); // mapped directly to quality metrics
    if (profile.github.includes("github.com/")) score += 10;
    return Math.min(score, 100);
  };

  const portfolioScore = getQualityScore();
  const readinessScore = getRecruiterReadyScore();

  // Portfolio copilot chat drawer states
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>(() => [
    {
      id: "welcome",
      role: "copilot",
      content: "Hi! I am your **Personal Branding Copilot**. \n\nI can analyze your resume details, suggest optimizations to boost your Portfolio Score, compile dynamic SEO tags, or export clean React template code.\n\nAsk me anything or click one of the quick suggestions below!"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Sync state values to localStorage on state changes
  const saveProfile = (updated: PortfolioProfile) => {
    setProfile(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    }
  };

  const handleUpdateField = <K extends keyof PortfolioProfile>(field: K, value: PortfolioProfile[K]) => {
    saveProfile({ ...profile, [field]: value });
  };

  const handleUpdateEducation = (field: keyof PortfolioProfile["education"], value: string) => {
    saveProfile({
      ...profile,
      education: { ...profile.education, [field]: value }
    });
  };

  const handleThemeChange = (themeName: string) => {
    setActiveTheme(themeName);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, themeName);
    }
  };

  const handleColorChange = (color: string) => {
    setAccentColor(color);
    if (typeof window !== "undefined") {
      localStorage.setItem(COLOR_KEY, color);
    }
  };

  const handleFontChange = (font: string) => {
    setAccentFont(font);
    if (typeof window !== "undefined") {
      localStorage.setItem(FONT_KEY, font);
    }
  };

  // Mock resume parser trigger
  const handleSimulateResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAtsUploadProgress(10);
    const interval = setInterval(() => {
      setAtsUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAtsUploadProgress(null);
            // Simulate parsed content extraction
            handleUpdateField("about", "Ambitious Computer Science candidate specializing in full-stack JavaScript architectures, cloud databases, and API development. Proven track record in Inter-college hackathons.");
            alert("Success! Profile summary and details extracted from resume.");
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // Mock GitHub repository sync hooks
  const handleSimulateGitSync = () => {
    if (!gitUrl.trim()) return;
    setGitImporting(true);
    setTimeout(() => {
      setGitImporting(false);
      // Append a mock project parsed from GitHub
      const gitProject: Project = {
        id: `p-${Date.now()}`,
        title: "Dynamic Analytics Pipeline",
        description: "Simulated repository import. Event tracking pipeline processing high-density coordinates logs and data dashboards.",
        tech: ["Python", "Flask", "PostgreSQL", "Pandas"],
        github: gitUrl.trim(),
        live: "analytics-stream.vercel.app",
        impactScore: 89,
        problem: "Inefficient data query latency in client analytics pools.",
        solution: "Engineered database indexing loops using Python sorting wrappers.",
        challenges: "Thread blockages. Swapped to concurrent process pools."
      };
      saveProfile({
        ...profile,
        projects: [...profile.projects, gitProject]
      });
      alert(`Success! Imported 1 repository from "${gitUrl}" as a project showcase card.`);
      setGitUrl("");
    }, 1800);
  };

  // Mock LinkedIn sync hooks
  const handleSimulateLinkedInSync = () => {
    if (!linkedinUrl.trim()) return;
    setLinkedinSyncing(true);
    setTimeout(() => {
      setLinkedinSyncing(false);
      handleUpdateField("linkedin", linkedinUrl.trim());
      alert("Success! Sync complete: LinkedIn profile summary fetched.");
      setLinkedinUrl("");
    }, 1500);
  };

  // Copilot strategics message trigger
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: generateMsgId("user"),
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
          message: `Optimizing portfolio page profile configurations: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: profile.role,
            techStack: Object.values(profile.skills).flat().join(", "),
            atsScore: 72,
            interviewAvg: 60,
            roadmapProgressCount: 2,
            totalRoadmapCount: 10,
            crmApplications: []
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateMsgId("copilot"),
          role: "copilot" as const,
          content: data.data.reply
        }
      ]);
    } catch {
      // Heuristics offline answers
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("improve") || q.includes("score")) {
        reply = `### How to Improve Your Portfolio Score (Current: ${portfolioScore}/100)
1. **GitHub Link Accuracy**: Ensure all projects link to valid repositories.
2. **Impact Metrics**: Quantify project results (e.g., 'Reduced query latency by 35%').
3. **Certifications**: Add at least one valid cloud or developer associate credential.
4. **Theme Choice**: Swap to the **AI Engineer Theme** or **Minimal Theme** to align with technical roles.`;
      } else if (q.includes("project")) {
        reply = `### Project Showcase Strategy
For a **${profile.role}** role, I recommend featuring:
- **Project 1 (Serverless Checkout)**: Focus on databases concurrency locks and latency optimizations. (Impact Score: 94)
- **Project 2 (Collaborative Whiteboard)**: Emphasize WebSockets concurrency under high network loads. (Impact Score: 88)`;
      } else if (q.includes("recruiter") || q.includes("appeal")) {
        reply = `### Recruiter Readiness Report (Score: ${readinessScore}%)
**Strengths:**
- Core programming foundations (React, Node.js) are solid.
- Active internship experience logged.

**Weaknesses:**
- Missing deployment checklist tasks.
- No custom domain configured. (Premium feature)`;
      } else {
        reply = `Your portfolio profile is fully configured as a **${profile.role}**. I suggest optimizing your meta tags in the **SEO Tab** and checking the **Deployment Center** to compile and export your clean React source code.`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: generateMsgId("copilot"),
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* LEFT SECTION (Main Workspace Controls - 8 cols) */}
      <div className="lg:col-span-8 space-y-8">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            Personal Branding Suite
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Portfolio OS
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Centralized compiler turning your resume metrics, projects, and skills into a premium responsive portfolio website.
          </p>
        </div>

        {/* Portfolio sub tabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "analyzer", label: "Profile Setup", icon: <Upload className="w-4 h-4" /> },
            { id: "studio", label: "Theme Studio & Preview", icon: <Eye className="w-4 h-4" /> },
            { id: "showcase", label: "Project Builder", icon: <FolderOpen className="w-4 h-4" /> },
            { id: "seo", label: "SEO Optimizer", icon: <Sparkles className="w-4 h-4" /> },
            { id: "deploy", label: "Deployment Center", icon: <Zap className="w-4 h-4" /> },
            { id: "analytics", label: "Portfolio Analytics", icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                // Ensure browser adjusts focus nicely
              }}
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

        {/* Tab Workspace Card */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          {/* TAB 1: PORTFOLIO ANALYZER (SETUP) */}
          {activeSubTab === "analyzer" && (
            <div className="space-y-8">
              <h2 className="text-xl font-black text-slate-900 font-display">Profile Integration Channels</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Channel 1: Upload Resume */}
                <div className="border border-slate-200/60 p-5 rounded-2xl bg-slate-50/30 flex flex-col justify-between h-44 hover:border-indigo-200 transition-all relative">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">Resume Parser</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Drag-drop PDF to populate biography and core details.
                    </span>
                  </div>
                  {atsUploadProgress !== null ? (
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${atsUploadProgress}%` }} />
                    </div>
                  ) : (
                    <label className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-indigo-600 transition-all">
                      Upload PDF
                      <input type="file" accept=".pdf" className="hidden" onChange={handleSimulateResumeUpload} />
                    </label>
                  )}
                </div>

                {/* Channel 2: GitHub import */}
                <div className="border border-slate-200/60 p-5 rounded-2xl bg-slate-50/30 flex flex-col justify-between h-44 hover:border-indigo-200 transition-all">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">GitHub Sync</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Connect repositories to fetch active development cards.
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="github.com/username"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                    />
                    <button
                      disabled={gitImporting || !gitUrl.trim()}
                      onClick={handleSimulateGitSync}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-indigo-650 transition-all disabled:opacity-40"
                    >
                      {gitImporting ? "Syncing..." : "Sync Repos"}
                    </button>
                  </div>
                </div>

                {/* Channel 3: LinkedIn integration */}
                <div className="border border-slate-200/60 p-5 rounded-2xl bg-slate-50/30 flex flex-col justify-between h-44 hover:border-indigo-200 transition-all">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">LinkedIn Profile</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Pull experiences to compile professional timelines.
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                    />
                    <button
                      disabled={linkedinSyncing || !linkedinUrl.trim()}
                      onClick={handleSimulateLinkedInSync}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-indigo-650 transition-all disabled:opacity-40"
                    >
                      {linkedinSyncing ? "Syncing..." : "Sync Profile"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Edit extracted fields form */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 font-display">Configure Portfolio Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Candidate Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleUpdateField("name", e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Portfolio Role</label>
                    <select
                      value={profile.role}
                      onChange={(e) => handleUpdateField("role", e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      {["Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer", "AI Engineer", "Data Analyst", "DevOps Engineer", "Cloud Engineer"].map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={profile.about}
                    onChange={(e) => handleUpdateField("about", e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Education section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-55/40 p-4 border border-slate-100 rounded-2xl">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">College/University</label>
                    <input
                      type="text"
                      value={profile.education.college}
                      onChange={(e) => handleUpdateEducation("college", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Degree</label>
                    <input
                      type="text"
                      value={profile.education.degree}
                      onChange={(e) => handleUpdateEducation("degree", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CGPA / Grade</label>
                    <input
                      type="text"
                      value={profile.education.cgpa}
                      onChange={(e) => handleUpdateEducation("cgpa", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THEME STUDIO & DYNAMIC PREVIEW */}
          {activeSubTab === "studio" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
                <h2 className="text-xl font-black text-slate-900 font-display">Theme Studio</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "developer", label: "Developer", desc: "Dark Terminal Console style" },
                    { id: "ai", label: "AI Engineer", desc: "Neon Glow modern style" },
                    { id: "analyst", label: "Data Analyst", desc: "Clean Grid Dashboard style" },
                    { id: "minimal", label: "Minimalist", desc: "Monochrome serif style" }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={cn(
                        "px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                        activeTheme === theme.id
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 border border-slate-150 rounded-2xl">
                <div>
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Accent Color Selection</strong>
                  <div className="flex gap-2">
                    {[
                      { id: "indigo", bg: "bg-indigo-600" },
                      { id: "purple", bg: "bg-purple-650" },
                      { id: "emerald", bg: "bg-emerald-500" },
                      { id: "sky", bg: "bg-sky-500" },
                      { id: "rose", bg: "bg-rose-600" }
                    ].map(col => (
                      <button
                        key={col.id}
                        onClick={() => handleColorChange(col.id)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-white",
                          col.bg,
                          accentColor === col.id ? "border-slate-900 scale-110" : "border-transparent"
                        )}
                      >
                        {accentColor === col.id && <Check className="w-4.5 h-4.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Typography Customizer</strong>
                  <div className="flex gap-2">
                    {["Outfit", "Inter", "Monospace", "Serif"].map(fontName => (
                      <button
                        key={fontName}
                        onClick={() => handleFontChange(fontName)}
                        className={cn(
                          "px-4 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer",
                          accentFont === fontName
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                        )}
                      >
                        {fontName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Interactive Preview Box */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Eye className="w-4 h-4" />
                  <span>Dynamic Frame Live Preview</span>
                </div>

                <div className={cn(
                  "border border-slate-250 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all h-[550px] flex flex-col",
                  activeTheme === "developer" ? "bg-slate-950 text-slate-300" :
                  activeTheme === "ai" ? "bg-gradient-to-b from-slate-900 to-indigo-950 text-slate-200" :
                  activeTheme === "analyst" ? "bg-slate-50 text-slate-700" : "bg-white text-slate-900"
                )}>
                  {/* Mock Browser Header */}
                  <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <div className="px-8 py-0.5 bg-slate-800 border border-slate-700/50 rounded-lg text-[9px] font-bold text-slate-400 font-mono tracking-wider">
                      {profile.name.toLowerCase().replace(" ", "")}.github.io
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Mock Page Content (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-12 min-h-0">
                    {/* Theme Header segment */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black tracking-widest text-indigo-400 block uppercase">
                        Available for Placements
                      </span>
                      <h1 className={cn(
                        "text-4xl font-black tracking-tight block",
                        accentFont === "Outfit" ? "font-display" :
                        accentFont === "Monospace" ? "font-mono text-emerald-400" :
                        accentFont === "Serif" ? "font-serif" : "font-sans"
                      )}>
                        Hi, I&apos;m {profile.name}
                      </h1>
                      <strong className="text-sm text-slate-400 block">{profile.role} • {profile.education.degree}</strong>
                      <p className="text-xs text-slate-500 font-medium max-w-lg leading-relaxed">{profile.about}</p>
                    </div>

                    {/* Skills group */}
                    <div className="space-y-4 pt-6 border-t border-slate-800/40">
                      <strong className="text-[10px] font-black uppercase tracking-wider block text-indigo-400">Core Competencies</strong>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(profile.skills).flat().map((skill) => (
                          <span
                            key={skill}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold rounded-lg border",
                              activeTheme === "developer" ? "bg-slate-900 border-slate-800 text-emerald-400" :
                              activeTheme === "ai" ? "bg-indigo-900/30 border-indigo-800/50 text-indigo-300" :
                              "bg-slate-100 border-slate-200 text-slate-700"
                            )}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Projects segment */}
                    <div className="space-y-4 pt-6 border-t border-slate-800/40">
                      <strong className="text-[10px] font-black uppercase tracking-wider block text-indigo-400">Featured Projects</strong>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.projects.map((proj) => (
                          <div
                            key={proj.id}
                            className={cn(
                              "p-5 rounded-2xl border flex flex-col justify-between h-40",
                              activeTheme === "developer" ? "bg-slate-900/40 border-slate-800" :
                              activeTheme === "ai" ? "bg-slate-900/60 border-indigo-900/50" :
                              "bg-slate-50 border-slate-200"
                            )}
                          >
                            <div className="space-y-2">
                              <h4 className="text-sm font-black tracking-tight">{proj.title}</h4>
                              <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{proj.description}</p>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>Impact: {proj.impactScore}%</span>
                              <span className="hover:underline cursor-pointer">View Code</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT SHOWCASE BUILDER */}
          {activeSubTab === "showcase" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Project Showcase Builder</h2>
              <p className="text-xs text-slate-500 font-medium">
                Recruiters check project details to test problem-solving workflows. Optimize titles, solutions, and challenge audits.
              </p>

              <div className="space-y-6 pt-4">
                {profile.projects.map((proj, idx) => (
                  <div key={proj.id} className="border border-slate-200/60 p-6 rounded-3xl space-y-4 bg-slate-50/20">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-black text-slate-800">Project #{idx + 1}: {proj.title}</h3>
                      <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Impact: {proj.impactScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Problem Statement</label>
                        <textarea
                          rows={3}
                          value={proj.problem || ""}
                          placeholder="Describe the problem context..."
                          onChange={(e) => {
                            const list = [...profile.projects];
                            list[idx].problem = e.target.value;
                            handleUpdateField("projects", list);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Technical Solution</label>
                        <textarea
                          rows={3}
                          value={proj.solution || ""}
                          placeholder="How did you resolve it?"
                          onChange={(e) => {
                            const list = [...profile.projects];
                            list[idx].solution = e.target.value;
                            handleUpdateField("projects", list);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SEO OPTIMIZER */}
          {activeSubTab === "seo" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">SEO Optimizer</h2>
              <p className="text-xs text-slate-500 font-medium">
                Google searches index portfolios dynamically. Optimize these meta tags to increase matching visibility rules.
              </p>

              <div className="space-y-6 pt-4 bg-slate-50/50 p-6 border border-slate-150 rounded-2xl">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Meta Title</label>
                  <input
                    type="text"
                    value={`${profile.name} | ${profile.role} Portfolio 2026`}
                    readOnly
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Meta Description</label>
                  <textarea
                    rows={2}
                    value={`Explore the portfolio website of ${profile.name}, a specialized ${profile.role} showcasing complex backend checkouts and real-time whiteboard project codes.`}
                    readOnly
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1.5">
                  <strong className="text-indigo-900 font-black block">Generated JSON-LD Structured Data Schema:</strong>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[9px] overflow-x-auto">
                    {JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "Person",
                      "name": profile.name,
                      "jobTitle": profile.role,
                      "colleague": profile.education.college,
                      "url": `https://${profile.name.toLowerCase().replace(" ", "")}.github.io`
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEPLOYMENT CENTER */}
          {activeSubTab === "deploy" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Portfolio Deployment Center</h2>
              <p className="text-xs text-slate-500 font-medium">
                Compile and export your portfolio code directly as a deployable template package or upload to hosting platforms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* Download bundle */}
                <div className="border border-slate-200/60 p-6 rounded-3xl bg-slate-50/20 flex flex-col justify-between h-48 hover:border-indigo-100 transition-colors">
                  <div className="space-y-1.5">
                    <strong className="text-xs font-black text-slate-800 block">Export Source Files</strong>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal">
                      Compiles single-page HTML / React component source codes containing your dynamic profiles.
                    </p>
                  </div>
                  <button
                    onClick={() => alert("Compiling source bundles... Zip archive successfully downloaded to your local desktop folder.")}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-indigo-650 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download ZIP Package</span>
                  </button>
                </div>

                {/* Deployment instructions */}
                <div className="border border-slate-200/60 p-6 rounded-3xl bg-slate-50/20 flex flex-col justify-between h-48 hover:border-indigo-100 transition-colors">
                  <div className="space-y-1.5">
                    <strong className="text-xs font-black text-slate-800 block">One-Click Deploy Guide</strong>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal">
                      Step-by-step guidance to deploy your portfolio index automatically on Vercel or GitHub Pages in 2 minutes.
                    </p>
                  </div>
                  <button
                    onClick={() => alert("Redirecting to Netlify/Vercel deployment setup wizard. Check setup prompts in your hosting panel.")}
                    className="w-full py-3 bg-white border border-slate-250 text-slate-650 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:border-slate-350 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Deploy to Vercel</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: PORTFOLIO ANALYTICS */}
          {activeSubTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Portfolio Analytics Dashboard</h2>
              <p className="text-xs text-slate-500 font-medium">
                Check recruiter click logs, visitor patterns, and resume downloads recorded on your hosted portfolio links.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {[
                  { label: "Recruiter Visitors", count: "42 Visitors", color: "text-blue-600" },
                  { label: "Project Clicks", count: "125 Clicks", color: "text-indigo-600" },
                  { label: "Resume Downloads", count: "18 Downloads", color: "text-emerald-600" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                    <strong className={cn("text-xl font-black block mt-1", stat.color)}>{stat.count}</strong>
                  </div>
                ))}
              </div>

              {/* simulated traffic chart placeholder */}
              <div className="bg-slate-50 border border-slate-150 p-6 rounded-3xl flex flex-col justify-between h-44 mt-4">
                <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Visitor Pattern (Last 7 Days)</strong>
                <div className="flex items-end justify-between gap-2 h-24">
                  {[2, 5, 8, 4, 9, 7, 12].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600" style={{ height: `${val * 6}px` }} />
                      <span className="text-[8px] font-bold text-slate-400 font-mono">Day {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN (Readiness Panels & Portfolio Copilot - 4 cols) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Quality Audit scores */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Recruiter Readiness</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Score 1 */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-3">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-tight">Portfolio Score</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-indigo-600" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - portfolioScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{portfolioScore}%</span>
              </div>
            </div>

            {/* Score 2 */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-3">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-tight">Recruiter Appeal</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-emerald-500" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - readinessScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{readinessScore}%</span>
              </div>
            </div>

          </div>

          <div className="space-y-3 pt-2">
            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Branding Audit Report</strong>
            <div className="space-y-2 text-xs font-semibold leading-relaxed">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-emerald-800">
                <span className="font-black">Strengths:</span> Dynamic project descriptions loaded cleanly.
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-amber-800">
                <span className="font-black">Improvement Gaps:</span> Code repository sync and Vercel hosting pending.
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Copilot strategia widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[500px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-855 block">Branding Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Strategic Portfolio Coach</span>
            </div>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
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
                  <span>Analyzing portfolio structure...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
            {[
              { label: "Improve Score", query: "How to improve score?" },
              { label: "Recruiter Appeal", query: "Recruiter readiness report" },
              { label: "Showcase Projects", query: "Suggest project features" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask Copilot about branding tips..."
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
