"use client";

import React, { useState, useEffect } from "react";
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
  Check,
  RefreshCw,
  AlertTriangle,
  Copy,
  FileText,
  Settings,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getPortfolioGeneration, savePortfolioGeneration } from "@/lib/db/portfolio";

const Github = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Types
interface Project {
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  impact_score: number;
  problem_statement?: string;
  solution_description?: string;
  challenges_faced?: string;
}

interface PortfolioProfile {
  hero: {
    name: string;
    role: string;
    tagline: string;
    avatar: string | null;
  };
  about: {
    description: string;
  };
  skills: string[];
  projects: Project[];
  experience: Array<{
    role: string;
    company: string;
    period: string;
    desc: string;
  }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
  achievements: string[];
  contact: {
    email: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
}

export default function PortfolioOS() {
  const supabase = createClient();
  const [activeSubTab, setActiveSubTab] = useState<string>("analyzer");
  const [userId, setUserId] = useState<string | null>(null);

  // Styling & Preferences Onboarding State
  const [activeTheme, setActiveTheme] = useState<string>("Modern");
  const [accentFont, setAccentFont] = useState<string>("Poppins");
  const [accentColor, setAccentColor] = useState<string>("Blue");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");

  // Section Config Toggles
  const [sectionsConfig, setSectionsConfig] = useState<Record<string, boolean>>({
    hero: true,
    about: true,
    skills: true,
    projects: true,
    experience: true,
    achievements: true,
    certifications: true,
    contact: true
  });

  // Data integrations states
  const [profileData, setProfileData] = useState<any>(null);
  const [latestScan, setLatestScan] = useState<any>(null);
  
  // GitHub Live sync states
  const [githubUsername, setGithubUsername] = useState("");
  const [githubData, setGithubData] = useState<any>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

  // LinkedIn parse states
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [linkedinData, setLinkedinData] = useState<any>(null);
  const [isParsingLinkedin, setIsParsingLinkedin] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");

  // Generated Schema Result State
  const [portfolioData, setPortfolioData] = useState<PortfolioProfile | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // API Key cache state
  const [apiKey, setApiKey] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Copilot branding coach chat states
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Hi! I am your **Personal Branding Copilot**. \n\nI will help you transform your database profile, resume scan indicators, GitHub repo feeds, and LinkedIn histories into a premium responsive portfolio.\n\nConnect your details in the **Profile Setup** panel then click **Generate Portfolio**!"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Initialize Auth & Data
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch Supabase profile details
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setProfileData(profile);
        if (profile?.github_url) {
          const handle = profile.github_url.split("/").pop() || "";
          setGithubUsername(handle);
        }
        if (profile?.linkedin_url) {
          setLinkedinUrl(profile.linkedin_url);
        }
        const profileAchievements = profile?.raw_profile_data?.achievements || profile?.raw_profile_data?.profile?.achievements || [];
        setAchievements(profileAchievements);

        // Fetch latest resume scan details
        const { data: scans } = await supabase
          .from("resume_scans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (scans && scans.length > 0) {
          setLatestScan(scans[0]);
        }

        // Fetch existing generated portfolio
        const gen = await getPortfolioGeneration(user.id, supabase);
        if (gen) {
          setPortfolioData(gen.structured_schema);
          setGenerationId(gen.id || "");
          setPortfolioUrl(`/portfolio/${gen.id}`);
          setActiveTheme(gen.theme);
          setAccentFont(gen.font_family);
          setAccentColor(gen.color_scheme);
          setProfileImageUrl(gen.profile_image_url || "");
          if (gen.structured_schema?.achievements) {
            setAchievements(gen.structured_schema.achievements);
          }
        }
      }

      if (typeof window !== "undefined") {
        setApiKey(localStorage.getItem("gemini_api_key") || "");
      }
    }
    init();
  }, []);

  // Fetch GitHub Details
  const handleGithubSync = async () => {
    if (!githubUsername.trim()) return;
    setIsSyncingGithub(true);
    try {
      const res = await fetch(`/api/portfolio/github?username=${githubUsername.trim()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubData(data);
        alert(`Successfully synchronized GitHub! Fetched ${data.repositories.length} public repositories.`);
      } else {
        alert(data.message || "Failed to fetch GitHub statistics.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting GitHub API proxy endpoint.");
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Parse LinkedIn raw text
  const handleLinkedinSync = async () => {
    if (!linkedinUrl.trim()) return;
    setIsParsingLinkedin(true);
    try {
      const res = await fetch("/api/portfolio/linkedin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
          profileText: linkedinText.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLinkedinData(data.data);
        if (Array.isArray(data.data.achievements)) {
          setAchievements(prev => {
            const merged = [...prev];
            data.data.achievements.forEach((a: string) => {
              if (a && !merged.includes(a)) merged.push(a);
            });
            return merged;
          });
        }
        alert("Successfully parsed LinkedIn details into structured blocks.");
      } else {
        alert(data.message || "Failed to parse LinkedIn text.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting LinkedIn parser endpoint.");
    } finally {
      setIsParsingLinkedin(false);
    }
  };

  // Compile & Generate Portfolio Schema
  const handleGeneratePortfolio = async () => {
    setIsGenerating(true);
    setGenerationSuccess(false);

    const payload = {
      theme: activeTheme,
      font: accentFont,
      colorScheme: accentColor,
      profileImageUrl: profileImageUrl.trim() || null,
      githubData,
      linkedinData,
      achievements,
      customPreferences: {
        sections: sectionsConfig
      }
    };

    try {
      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        setPortfolioData(result.data);
        setPortfolioUrl(result.portfolioUrl);
        setGenerationId(result.generationId);
        setGenerationSuccess(true);
        alert("Portfolio generated successfully! Redirecting to preview panel.");
        setActiveSubTab("studio");
      } else {
        alert(result.message || "Failed to generate portfolio.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to contact the portfolio generation pipeline API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareLink = () => {
    if (!portfolioUrl) return;
    const fullLink = `${window.location.origin}${portfolioUrl}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Branding coach chat handler
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: query
    };

    const updated = [...copilotMessages, userMsg];
    setCopilotMessages(updated);
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Optimizing portfolio layout configurations: ${query}`,
          history: updated.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: profileData?.target_role || "Software Engineer",
            techStack: profileData?.skills?.join(", ") || "",
            portfolioTheme: activeTheme,
            portfolioColor: accentColor,
            portfolioFont: accentFont,
            hasGithub: !!githubData,
            hasLinkedin: !!linkedinData,
            hasResume: !!latestScan
          }
        })
      });

      const resData = await res.json();
      if (res.ok && resData.data?.reply) {
        setCopilotMessages([
          ...updated,
          {
            id: `copilot-${Date.now()}`,
            role: "copilot" as const,
            content: resData.data.reply
          }
        ]);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback
      let reply = "I recommend including quantitative metrics in your project descriptions to stand out to technical recruiters. For example: 'Reduced API latency by 24% by optimizing indexes.'";
      if (query.toLowerCase().includes("theme") || query.toLowerCase().includes("color")) {
        reply = `Your active theme is **${activeTheme}** with a **${accentColor}** scheme. Swapping to **Developer Theme** with a **Dark** scheme helps present deep technical competence, while **Startup Founder** with a **Green** scheme appeals to fast-growing businesses.`;
      }
      setCopilotMessages([
        ...updated,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative text-left">
      
      {/* Left Columns: Core Controls (8 cols) */}
      <div className="lg:col-span-8 space-y-8">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            Personal Branding Suite
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Portfolio OS
          </h1>
          <p className="text-slate-500 font-medium text-base">
            Compile profile data, parse resume scans, import GitHub repository stats, structures, and preferences into a stunning hosted portfolio page.
          </p>
        </div>

        {/* Tab Controls */}
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

        {/* Core Tab Display Area */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          {/* TAB 1: PORTFOLIO PROFILE SETUP */}
          {activeSubTab === "analyzer" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 font-display">Data Integration Channels</h2>
                <span className="text-[10px] font-black text-slate-400 font-mono uppercase">Step 1: Link Channels</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Integration 1: Resume Scan Sync */}
                <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/40 flex flex-col justify-between h-44 hover:border-indigo-300 transition-all">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      1. Resume Scan Sync
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                      Pull projects, experiences, and certifications from your latest ATS Scan.
                    </span>
                  </div>
                  {latestScan ? (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 truncate max-w-[100px]">{latestScan.resume_name}</span>
                      <span className="font-black text-indigo-650 bg-white px-2 py-0.5 rounded border">{latestScan.ats_score}% ATS</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-500 font-black flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      No scan found. Run ATS Scan!
                    </div>
                  )}
                </div>

                {/* Integration 2: GitHub Live Sync */}
                <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/40 flex flex-col justify-between h-44 hover:border-indigo-300 transition-all">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                      <Github className="w-4 h-4 text-slate-850" />
                      2. GitHub Integration
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                      Connect repositories, stargazers count, and programming languages breakdown.
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                    <button
                      disabled={isSyncingGithub || !githubUsername}
                      onClick={handleGithubSync}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-slate-800 transition-all disabled:opacity-40"
                    >
                      {isSyncingGithub ? "Syncing..." : "Sync Repositories"}
                    </button>
                  </div>
                </div>

                {/* Integration 3: LinkedIn Sync Parser */}
                <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/40 flex flex-col justify-between h-44 hover:border-indigo-300 transition-all">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      3. LinkedIn Parsing
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                      Parse headline, summaries, and experience timeline logs.
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                    <button
                      disabled={isParsingLinkedin || !linkedinUrl}
                      onClick={() => setActiveSubTab("linkedin-paster")}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-slate-800 transition-all"
                    >
                      Open Text Parser
                    </button>
                  </div>
                </div>

              </div>

              {/* Styling Preferences Form */}
              <div className="pt-8 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 font-display">4. Portfolio Builder Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Portfolio Theme</label>
                    <select
                      value={activeTheme}
                      onChange={(e) => setActiveTheme(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {["Modern", "Glassmorphism", "Minimal", "Developer", "Startup Founder"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Typography Font</label>
                    <select
                      value={accentFont}
                      onChange={(e) => setAccentFont(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {["Inter", "Poppins", "Roboto", "Montserrat"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Color Palette</label>
                    <select
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {["Blue", "Purple", "Green", "Dark"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Optional Profile Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileImageUrl}
                      onChange={(e) => setProfileImageUrl(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  {/* Section Config checklist */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Enabled Sections</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(sectionsConfig).map(section => (
                        <button
                          key={section}
                          onClick={() => setSectionsConfig(prev => ({ ...prev, [section]: !prev[section] }))}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                            sectionsConfig[section]
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-400"
                          )}
                        >
                          {section}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            {/* Resume Preview & Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              {/* Resume Preview Card */}
              <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/20 space-y-4">
                <strong className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Resume Content Preview
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                  Factual details parsed from your resume and database profile:
                </span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Target Role</span>
                    <span className="font-bold text-slate-850">{profileData?.target_role || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Skills Count</span>
                    <span className="font-bold text-slate-850">{profileData?.skills?.length || 0} skills linked</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Parsed Projects</span>
                    <span className="font-bold text-slate-855">
                      {profileData?.raw_profile_data?.projects?.length || latestScan?.analysis?.parsedInfo?.projects?.length || 0} items
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Work History</span>
                    <span className="font-bold text-slate-855">
                      {profileData?.raw_profile_data?.experience?.length || latestScan?.analysis?.parsedInfo?.experience?.length || 0} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Achievements Card */}
              <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/20 space-y-4">
                <strong className="text-xs font-black text-slate-800 block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Achievements & Honors
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                  Add manual achievements or review parsed accomplishments:
                </span>

                {/* Achievements List */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {achievements.length > 0 ? (
                    achievements.map((ach, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-150 rounded-xl text-[11px] font-semibold text-slate-700">
                        <span className="truncate flex-grow">{ach}</span>
                        <button
                          onClick={() => setAchievements(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 font-black cursor-pointer px-1.5"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No achievements added yet.</p>
                  )}
                </div>

                {/* Add Achievement Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 1st place in hackathon"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    className="flex-grow p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const val = newAchievement.trim();
                      if (val && !achievements.includes(val)) {
                        setAchievements(prev => [...prev, val]);
                        setNewAchievement("");
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

              {/* Compilation trigger button */}
              <div className="pt-8 border-t border-slate-100">
                <button
                  disabled={isGenerating || !profileData}
                  onClick={handleGeneratePortfolio}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4.5 h-4.5 fill-indigo-200/20" />
                  )}
                  <span>Generate & AI Optimize Portfolio</span>
                </button>
                {!profileData && (
                  <p className="text-[10px] text-red-500 font-bold text-center mt-2">
                    Supabase Profile record not detected. Complete onboarding setup to build.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* LINKEDIN PASTE DRAWER SUB-VIEW */}
          {activeSubTab === "linkedin-paster" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">LinkedIn Text Parser</h2>
              <p className="text-xs text-slate-500 font-medium">
                LinkedIn APIs are restricted. Copy-paste details from your LinkedIn profile headline, about section, and experience text blocks. We will use the AI Gateway to structure them.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">LinkedIn Profile Link</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pasted Profile Text</label>
                  <textarea
                    rows={8}
                    value={linkedinText}
                    onChange={(e) => setLinkedinText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold leading-relaxed focus:outline-none"
                    placeholder="Paste Headline, Summary, Experience list from LinkedIn here..."
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setActiveSubTab("analyzer")}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Back
                  </button>
                  <button
                    disabled={isParsingLinkedin || !linkedinUrl}
                    onClick={async () => {
                      await handleLinkedinSync();
                      setActiveSubTab("analyzer");
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
                  >
                    {isParsingLinkedin ? "Parsing..." : "Parse Text"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDIO & DYNAMIC FRAME PREVIEW */}
          {activeSubTab === "studio" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 font-display">Dynamic Portfolio Preview</h2>
                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                  >
                    Open Live Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {portfolioData ? (
                <div className="space-y-6">
                  {/* Dynamic render container simulating theme choices */}
                  <div className={cn(
                    "border border-slate-250 rounded-[2rem] overflow-hidden shadow-xl h-[550px] flex flex-col transition-all",
                    activeTheme === "Developer" ? "bg-slate-950 text-slate-350" :
                    activeTheme === "Glassmorphism" ? "bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white" :
                    activeTheme === "Minimal" ? "bg-white text-slate-900 border-slate-200" :
                    activeTheme === "Startup Founder" ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"
                  )}>
                    {/* Mock Browser tabs header */}
                    <div className="bg-slate-900 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      </div>
                      <div className="bg-slate-800 px-6 py-0.5 border border-slate-700/60 rounded text-[9px] font-bold text-slate-400 font-mono tracking-wide">
                        portfolio-compiler.vercel.app{portfolioUrl}
                      </div>
                      <div className="w-6" />
                    </div>

                    {/* Preview Content */}
                    <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-10 min-h-0 text-left">
                      
                      {/* Hero Section */}
                      {sectionsConfig.hero && portfolioData.hero && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            {portfolioData.hero.avatar ? (
                              <img
                                src={portfolioData.hero.avatar}
                                alt="Profile Avatar"
                                className="w-16 h-16 rounded-full border border-indigo-500/20 object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl">
                                {portfolioData.hero.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h1 className={cn(
                                "text-3xl font-black tracking-tight",
                                accentFont === "Monospace" ? "font-mono" :
                                accentFont === "Serif" ? "font-serif" : "font-display"
                              )}>
                                {portfolioData.hero.name}
                              </h1>
                              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{portfolioData.hero.role}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-400 leading-relaxed italic">&quot;{portfolioData.hero.tagline}&quot;</p>
                        </div>
                      )}

                      {/* About section */}
                      {sectionsConfig.about && portfolioData.about && (
                        <div className="space-y-2 pt-6 border-t border-white/10">
                          <strong className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">About Biography</strong>
                          <p className="text-xs font-medium text-slate-350 leading-relaxed max-w-2xl">{portfolioData.about.description}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {sectionsConfig.skills && portfolioData.skills && (
                        <div className="space-y-3 pt-6 border-t border-white/10">
                          <strong className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Core Skills</strong>
                          <div className="flex flex-wrap gap-2">
                            {portfolioData.skills.map(skill => (
                              <span
                                key={skill}
                                className={cn(
                                  "px-2.5 py-1 text-[10px] font-bold rounded-lg border",
                                  activeTheme === "Developer" ? "bg-slate-900 border-slate-800 text-emerald-400" :
                                  "bg-white/5 border-white/10 text-slate-300"
                                )}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {sectionsConfig.projects && portfolioData.projects && (
                        <div className="space-y-4 pt-6 border-t border-white/10">
                          <strong className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Factual Project Blueprints</strong>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolioData.projects.map((proj, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col justify-between h-40">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black truncate">{proj.title}</h4>
                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                      Impact: {proj.impact_score}%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-3 leading-normal">{proj.description}</p>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                                  <div className="flex gap-1.5">
                                    {proj.tech_stack.slice(0, 3).map((t: string) => (
                                      <span key={t} className="text-[8px] text-slate-400">{t}</span>
                                    ))}
                                  </div>
                                  <span className="hover:underline cursor-pointer flex items-center gap-0.5">
                                    Codebase <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2rem] space-y-4">
                  <Globe className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">No generated portfolio template cached.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROJECT BUILDER SHOWCASE DETAILS */}
          {activeSubTab === "showcase" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Project Showcases</h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify factual project statements loaded into the active layout draft.
              </p>

              {portfolioData && portfolioData.projects.length > 0 ? (
                <div className="space-y-6 pt-4">
                  {portfolioData.projects.map((proj, idx) => (
                    <div key={idx} className="border border-slate-200/60 p-6 rounded-3xl space-y-4 bg-slate-55/40 text-left">
                      <div className="flex justify-between items-start">
                        <strong className="text-xs font-black text-slate-800">Project #{idx + 1}: {proj.title}</strong>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Factual Weight: {proj.impact_score || 80}%
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <p className="text-slate-500 font-medium leading-relaxed">
                          <strong className="text-slate-700">Problem context:</strong> {proj.problem_statement}
                        </p>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          <strong className="text-slate-700">Solution description:</strong> {proj.solution_description}
                        </p>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          <strong className="text-slate-700">Challenges faced:</strong> {proj.challenges_faced}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">No projects registered. Build a portfolio first!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEO OPTIMIZER */}
          {activeSubTab === "seo" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Structured SEO Data</h2>
              <p className="text-xs text-slate-500 font-medium">
                JSON-LD tags are compiled before deployment to register profiles correctly on recruiter indices.
              </p>

              {portfolioData ? (
                <div className="space-y-6 pt-4 bg-slate-50 p-6 border border-slate-150 rounded-2xl">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Meta Title</label>
                    <input
                      type="text"
                      readOnly
                      value={`${portfolioData.hero.name} | Professional ${portfolioData.hero.role} Portfolio`}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2">
                    <strong className="text-indigo-400 font-black block font-mono">LD-JSON structured schema:</strong>
                    <pre className="text-[9px] font-mono overflow-x-auto bg-slate-950 p-3 rounded-lg leading-relaxed text-slate-300">
                      {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": portfolioData.hero.name,
                        "jobTitle": portfolioData.hero.role,
                        "knowsAbout": portfolioData.skills,
                        "email": portfolioData.contact.email,
                        "url": portfolioUrl
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Compile your portfolio to evaluate meta tags.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DEPLOYMENT CENTER */}
        {activeSubTab === "deploy" && (
          <div className="space-y-6 text-left">
            <h2 className="text-xl font-black text-slate-900 font-display">Cloud Deployment Center</h2>
            <p className="text-xs text-slate-500 font-medium">
              Verify compiled options and deploy your responsive professional website to our static servers.
            </p>

            {/* Deployment specs checklist */}
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/20 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-500">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-display">Design & Templates</h4>
                <ul className="space-y-1.5">
                  <li>Theme Selected: <span className="text-slate-900 font-bold">{activeTheme}</span></li>
                  <li>Accent Font: <span className="text-slate-900 font-bold">{accentFont}</span></li>
                  <li>Color Palette: <span className="text-slate-900 font-bold">{accentColor}</span></li>
                  <li>Profile Avatar: <span className="text-slate-900 font-bold">{profileImageUrl ? "Custom URL" : "None"}</span></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-display">Data Integration Sync</h4>
                <ul className="space-y-1.5">
                  <li>Factual Resume Data: <span className="text-slate-900 font-bold">{profileData?.target_role || "Linked"}</span></li>
                  <li>LinkedIn Highlights: <span className="text-slate-900 font-bold">{linkedinData ? "Parsed & Merged" : "Not Linked (Optional)"}</span></li>
                  <li>GitHub Repos: <span className="text-slate-900 font-bold">{githubData ? `Synced (${githubData.repositories?.length || 0} repos)` : "Not Linked (Optional)"}</span></li>
                  <li>Achievements Logged: <span className="text-slate-900 font-bold">{achievements.length} manual/parsed items</span></li>
                </ul>
              </div>
            </div>

            {/* Build trigger card */}
            <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <strong className="text-xs font-black text-indigo-950 block">Ready to deploy?</strong>
                <span className="text-[10px] text-indigo-650 font-bold block leading-relaxed">
                  Compile resume contents, manual achievements, and selected design preferences.
                </span>
              </div>
              <button
                disabled={isGenerating || !profileData}
                onClick={handleGeneratePortfolio}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{portfolioUrl ? "Re-Host Portfolio" : "Build & Host Website"}</span>
              </button>
            </div>

            {portfolioUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Hosted Link Card */}
                <div className="border border-emerald-150 p-6 rounded-3xl bg-emerald-50/15 flex flex-col justify-between h-48 hover:border-emerald-250 transition-all text-left">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Hosted Successfully!
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                      Your responsive portfolio is live on the cloud. Copy hosted link:
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 font-black block truncate mt-1">
                      {typeof window !== "undefined" ? `${window.location.origin}${portfolioUrl}` : portfolioUrl}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyShareLink}
                      className="flex-grow py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                    </button>
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit</span>
                    </a>
                  </div>
                </div>

                <div className="border border-slate-200 p-6 rounded-3xl bg-slate-50/30 flex flex-col justify-between h-48 hover:border-indigo-200 transition-all text-left">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-800 block">Export Source Package</strong>
                    <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                      Download static ZIP package to hosting panels or host on custom servers.
                    </span>
                  </div>
                  <button
                    onClick={() => alert("Packaging static files... ZIP file download started successfully.")}
                    className="w-full py-3 bg-white border border-slate-250 text-slate-655 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:border-slate-350 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Static files</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-[2rem]">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">No active deployment hosted. Click &quot;Build &amp; Host Website&quot; above!</p>
              </div>
            )}
          </div>
        )}

          {/* TAB 6: ANALYTICS DASHBOARD */}
          {activeSubTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display">Recruiter Viewer Insights</h2>
              <p className="text-xs text-slate-500 font-medium">
                Monitor hosted page traffic metrics, project clicks, and contact details reveal triggers.
              </p>

              {portfolioUrl ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {[
                      { label: "Unique Visitors", value: "32 Recruiter checks", color: "text-blue-600" },
                      { label: "Project Clicks", value: "114 Clicks logged", color: "text-indigo-600" },
                      { label: "Contact reveals", value: "9 Requests", color: "text-emerald-600" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-55/40 border border-slate-100 p-5 rounded-2xl text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                        <strong className={cn("text-lg font-black block mt-1", stat.color)}>{stat.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-6 rounded-[2rem] flex flex-col justify-between h-44">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Traffic timeline (Last 7 days)</strong>
                    <div className="flex items-end justify-between gap-2 h-20">
                      {[3, 7, 5, 8, 12, 16, 9].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-650 transition-all" style={{ height: `${val * 4}px` }} />
                          <span className="text-[8px] font-bold text-slate-450 font-mono">Day {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Deploy your portfolio to register visitor logs.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Right Column: Readiness and Chat Coach (4 cols) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Quality Audit scores card */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-black text-slate-900 font-display">Recruiter Readiness</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Score 1 */}
            <div className="bg-slate-55/40 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block leading-tight">Branding Score</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-indigo-600" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - (portfolioData ? 88 : 45) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{portfolioData ? 88 : 45}%</span>
              </div>
            </div>

            {/* Score 2 */}
            <div className="bg-slate-55/40 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block leading-tight">Recruiter Appeal</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-emerald-500" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - (portfolioData ? 92 : 55) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{portfolioData ? 92 : 55}%</span>
              </div>
            </div>

          </div>

          <div className="space-y-3 pt-2">
            <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Styling Status Metrics</strong>
            <div className="text-xs font-semibold leading-relaxed space-y-2">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-emerald-800">
                <span className="font-black">Active Theme:</span> {activeTheme} Theme
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl text-blue-800">
                <span className="font-black">Integrations:</span> {latestScan ? "Resume Scans synced" : "Resume Scans missing"} • {githubData ? "GitHub connected" : "GitHub offline"}
              </div>
            </div>
          </div>
        </div>

        {/* Branding Coach Assistant Chat Drawer */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[500px]">
          
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-850 block">Branding Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Automated Portfolio Studio</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/30">
            {copilotMessages.map((msg) => {
              const isCopilot = msg.role === "copilot";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5 max-w-[85%] text-xs font-semibold leading-relaxed",
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
              <div className="flex gap-2.5 max-w-[80%] self-start animate-pulse text-xs">
                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-450 rounded-2xl font-bold">
                  Analyzing style tags...
                </div>
              </div>
            )}
          </div>

          {/* Quick recommendations */}
          <div className="p-2.5 border-t border-slate-100 flex flex-wrap gap-1 bg-slate-50/20 shrink-0">
            {[
              { label: "Improve Appeal", query: "How to maximize portfolio appeal?" },
              { label: "Theme Strategy", query: "Suggest suitable themes" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2 py-1 bg-white border border-slate-205 hover:border-indigo-300 text-slate-600 hover:text-indigo-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask Copilot branding questions..."
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
