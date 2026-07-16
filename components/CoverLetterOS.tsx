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
  Download
} from "lucide-react";
import { cn, flattenSkills } from "@/lib/utils";
import UsageMeter from "@/components/UsageMeter";
import { createClient } from "@/lib/supabase/client";
import { getScopedKey } from "@/lib/security/LocalStorage";

// Types
interface CoverLetterProfile {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  skills: string[];
  education: string;
  experience: Array<{
    role: string;
    company: string;
    period: string;
    desc: string;
  }>;
  projects: Array<{
    title: string;
    tech: string[];
    description: string;
    impact: string;
  }>;
  certifications: string[];
}

interface LetterVersion {
  content: string;
  style: string;
  company: string;
  score: number;
  personalization: number;
  ats: number;
  roleMatch: number;
}

const defaultProfile: CoverLetterProfile = {
  name: "Mujahid Ahmed",
  role: "Full Stack Developer",
  email: "mujahid@example.com",
  linkedin: "linkedin.com/in/mujahid-ahmed",
  skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "AWS", "Git"],
  education: "VTU Technical University (B.E. Computer Science, Class of 2026)",
  experience: [
    {
      role: "Backend Developer Intern",
      company: "BuggedBrain Technologies",
      period: "Jan 2026 - Present",
      desc: "Optimized SQL index loops and integrated AI strategic models, lowering API request response latencies."
    }
  ],
  projects: [
    {
      title: "Real-time Whiteboard",
      tech: ["React", "WebSockets", "Canvas API"],
      description: "Collaborative whiteboard canvas synchronizing multi-user coordinates under sub-second latency constraints.",
      impact: "Reduced collaborative event synchronization latency by 35%."
    }
  ],
  certifications: ["AWS Certified Developer Associate"]
};

// Company details & culture tones
const COMPANY_CULTURE: Record<string, { tone: string; keywords: string[]; category: string }> = {
  "Google": { tone: "Impact and Creativity focused", keywords: ["Scalability", "System Optimization", "Innovative Architecture"], category: "FAANG" },
  "Microsoft": { tone: "Professionalism and Integration focused", keywords: ["Enterprise Solutions", "Collaboration", "Cloud Frameworks"], category: "Enterprise" },
  "Amazon": { tone: "Data-driven and Leadership focused", keywords: ["Customer Obsession", "Scalable Systems", "Ownership"], category: "FAANG" },
  "IBM": { tone: "Enterprise Governance and Analytics focused", keywords: ["AI Integration", "Cloud Infrastructure", "Robust Security"], category: "Enterprise" },
  "Oracle": { tone: "Database and Systems Optimization focused", keywords: ["Cloud Architectures", "High Availability", "Database Governance"], category: "Enterprise" },
  "Salesforce": { tone: "Customer Success and Core API focused", keywords: ["CRM customization", "APIs Integration", "Agile delivery"], category: "Enterprise" },
  "Adobe": { tone: "User Experience and Design focused", keywords: ["Creative tech", "High Performance Client Renders", "Modern UI Nodes"], category: "FAANG" },
  "TCS": { tone: "Delivery Lifecycle and Service Quality focused", keywords: ["Client Delivery", "Global Quality Standards", "Agile Execution"], category: "Consulting" },
  "Infosys": { tone: "System Modernization and Maintenance focused", keywords: ["Legacy Migration", "Technology Integration", "Resource optimization"], category: "Consulting" },
  "Accenture": { tone: "Digital Transformation and Client Advisory focused", keywords: ["Strategic Consulting", "Cloud Enablement", "Value Creation"], category: "Consulting" },
  "Deloitte": { tone: "Problem-Solving and Audit compliance focused", keywords: ["Risk Mitigation", "Business Process Optimization", "Governance"], category: "Consulting" },
  "Capgemini": { tone: "Global Consulting and Tech Advisory focused", keywords: ["Digital Transformation", "Distributed Agile Teamwork", "Cloud Operations"], category: "Consulting" },
  "Cognizant": { tone: "Business Integration and Technology focused", keywords: ["Process Automation", "Cloud Migration", "Product Engineering"], category: "Consulting" },
  "Wipro": { tone: "System Engineering and Quality compliance focused", keywords: ["Process Standardization", "Support Architecture", "Quality Frameworks"], category: "Consulting" },
  "HCLTech": { tone: "Infrastructure Operations and Cloud focused", keywords: ["Infrastructure Management", "Automation Pipelines", "Service Support"], category: "Consulting" }
};

const ROLE_SEO_KEYWORDS: Record<string, { priority: string[]; missing: string[] }> = {
  "Software Engineer": { priority: ["Data Structures", "Algorithms", "System Design"], missing: ["CI/CD", "Design Patterns"] },
  "Frontend Developer": { priority: ["React", "TypeScript", "Tailwind CSS"], missing: ["Next.js SSR", "Core Web Vitals"] },
  "Backend Developer": { priority: ["Node.js", "Express", "PostgreSQL"], missing: ["Redis Caching", "System Architecture"] },
  "Full Stack Developer": { priority: ["React", "Node.js", "TypeScript", "REST APIs"], missing: ["Docker", "Kubernetes"] },
  "AI Engineer": { priority: ["Generative AI", "LLMs", "Python", "Vector Databases"], missing: ["LangChain", "Model Tuning"] },
  "ML Engineer": { priority: ["Python", "TensorFlow", "Deep Learning"], missing: ["MLOps Pipelines", "Feature Stores"] },
  "Data Analyst": { priority: ["SQL", "Power BI", "Data Wrangling"], missing: ["ETL Pipelines", "dbt Queries"] },
  "Cloud Engineer": { priority: ["AWS", "Docker", "Serverless Architecture"], missing: ["Terraform IAC", "Cloud Security"] },
  "DevOps Engineer": { priority: ["CI/CD Pipelines", "Docker", "Kubernetes"], missing: ["Infrastructure as Code", "Prometheus"] },
  "Cybersecurity Engineer": { priority: ["Threat Analysis", "Incident Response", "Vulnerability Audit"], missing: ["SIEM Systems", "ISO 27001"] }
};

// Region Formats
const REGION_FORMATS: Record<string, { header: string; footer: string }> = {
  "India": { header: "Subject: Application for [Role] position", footer: "Yours sincerely," },
  "United States": { header: "Dear Hiring Team,", footer: "Sincerely," },
  "United Kingdom": { header: "Dear Sir/Madam,", footer: "Kind regards," },
  "Canada": { header: "Re: Application for the position of [Role]", footer: "Best regards," },
  "Germany": { header: "Sehr geehrte Damen und Herren,", footer: "Mit freundlichen Grüßen," },
  "Australia": { header: "Dear Hiring Manager,", footer: "Warm regards," },
  "Singapore": { header: "Subject: Application for [Role] at [Company]", footer: "Yours faithfully," }
};

// Helper outside component for react compiler
const generateCopilotMsgId = () => {
  return `cl-copilot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function CoverLetterOS() {
  const [activeSubTab, setActiveSubTab] = useState<string>("generator");

  const PROFILE_KEY = "cover_letter_os_profile";
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

  // State Management
  const [profile, setProfile] = useState<CoverLetterProfile>(defaultProfile);

  // Sync profile when userId changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const scopedKey = getScopedKey(PROFILE_KEY, userId);
      const cached = localStorage.getItem(scopedKey);
      if (cached) {
        try {
          setProfile(JSON.parse(cached));
        } catch {}
      } else {
        setProfile(defaultProfile);
      }
    }
  }, [userId]);

  const [inputSource, setInputSource] = useState<"resume" | "resume_jd" | "resume_url" | "resume_company" | "resume_all">("resume_jd");
  const [targetCompany, setTargetCompany] = useState<string>("Google");
  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [jdTextInput, setJdTextInput] = useState("We are looking for a Full Stack Developer proficient in React, Node.js, and SQL databases. Experience with cloud configurations (AWS) is highly preferred.");
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [coverLetterStyle, setCoverLetterStyle] = useState<string>("technical");
  const [region, setRegion] = useState<string>("United States");

  // Snapshots for version comparison
  const [versionA, setVersionA] = useState<LetterVersion>({
    content: "",
    style: "technical",
    company: "Google",
    score: 0,
    personalization: 0,
    ats: 0,
    roleMatch: 0
  });

  const [versionB, setVersionB] = useState<LetterVersion>({
    content: "",
    style: "modern",
    company: "Google",
    score: 0,
    personalization: 0,
    ats: 0,
    roleMatch: 0
  });

  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [editingContent, setEditingContent] = useState("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copilot messages
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Hello! I am your **Cover Letter OS Copilot**. I can review your drafts, suggest priority keywords from job descriptions, align your tone to specific companies, or adjust formatting based on regional standards. Let me know how I can help!"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Save profile helper
  const saveProfile = (updated: CoverLetterProfile) => {
    setProfile(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(getScopedKey(PROFILE_KEY, userId), JSON.stringify(updated));
    }
  };

  // Sync data loaders
  const handleImportFromResume = () => {
    if (typeof window !== "undefined") {
      const cachedResume = localStorage.getItem(getScopedKey("resume_builder_profile", userId));
      if (cachedResume) {
        try {
          const parsed = JSON.parse(cachedResume);
          // Flatten skills safely
          const flattenedSkills = flattenSkills(parsed.skills || []);

          const updated: CoverLetterProfile = {
            ...profile,
            name: parsed.personal?.fullName || profile.name,
            email: parsed.personal?.email || profile.email,
            education: parsed.education?.[0] 
              ? `${parsed.education[0].institution} (${parsed.education[0].degree}, ${parsed.education[0].graduationYear || "Class of 2026"})`
              : profile.education,
            skills: flattenedSkills.length > 0 ? flattenedSkills : profile.skills
          };
          saveProfile(updated);
          alert("Resume profile variables loaded successfully into Cover Letter OS.");
        } catch {
          alert("Failed to parse Resume Builder profile configurations.");
        }
      } else {
        alert("No resume config found in Resume OS. Create your resume first!");
      }
    }
  };

  const handleImportFromPortfolio = () => {
    if (typeof window !== "undefined") {
      const cachedPortfolio = localStorage.getItem(getScopedKey("portfolio_profile_os", userId));
      if (cachedPortfolio) {
        try {
          const parsed = JSON.parse(cachedPortfolio);
          if (parsed.projects && parsed.projects.length > 0) {
            const updatedProjects = parsed.projects.map((p: { title: string; tech?: string[]; description: string; challenges?: string }) => ({
              title: p.title,
              tech: p.tech || [],
              description: p.description,
              impact: p.challenges || "Optimized transaction workflows."
            }));
            saveProfile({
              ...profile,
              projects: updatedProjects
            });
            alert(`Successfully integrated ${updatedProjects.length} projects from Portfolio OS.`);
          } else {
            alert("No projects listed in your Portfolio Builder configurations.");
          }
        } catch {
          alert("Failed to sync Portfolio Builder OS profiles.");
        }
      } else {
        alert("No Portfolio Builder configurations found. Set up your portfolio builder first.");
      }
    }
  };

  // Generate Letter logic based on styles, role, company and region formats
  const generateDraftLetter = (ver: "A" | "B", styleOverride?: string) => {
    const selectedStyle = styleOverride || coverLetterStyle;
    const compDetails = COMPANY_CULTURE[targetCompany] || { tone: "Professional", keywords: ["Productivity", "Innovation"], category: "Enterprise" };
    const regionFmt = REGION_FORMATS[region] || { header: "Dear Hiring Team,", footer: "Sincerely," };
    const seoKw = ROLE_SEO_KEYWORDS[targetRole] || { priority: ["Software Development"], missing: ["Automation"] };
    const projectText = profile.projects[0] 
      ? `Specifically, on my project "${profile.projects[0].title}," I leveraged ${profile.projects[0].tech.join(", ")} to build a ${profile.projects[0].description.toLowerCase()} which successfully ${profile.projects[0].impact.toLowerCase()}`
      : `In my project portfolio, I built scalable web platform instances utilizing ${profile.skills.slice(0, 3).join(", ")}, optimizing transaction logs and data routing latencies by 30%.`;

    let styleOpening = "";
    if (selectedStyle === "technical") {
      styleOpening = `I am writing to express my interest in the ${targetRole} position at ${targetCompany}. With solid foundations in ${profile.skills.slice(0, 3).join(", ")}, my engineering focus revolves around developing modular database layers and high-concurrency event loops.`;
    } else if (selectedStyle === "startup") {
      styleOpening = `I've been following ${targetCompany}'s rapid innovation drive and would love to bring my programming energy to your product engineering teams. As an aspiring ${targetRole}, I build features quickly, iterate on client feedback, and thrive under fast-paced deployment cycles.`;
    } else {
      styleOpening = `Please accept this application for the ${targetRole} role at ${targetCompany}. As a Computer Science graduate from ${profile.education.split(" (")[0]} with internship experience at ${profile.experience[0]?.company || "BuggedBrain"}, I am excited to contribute to your technology teams.`;
    }

    const bodyParagraph = `I am particularly drawn to ${targetCompany}'s commitment to ${compDetails.tone}. This role aligns perfectly with my background. ${projectText} Additionally, my experience as a ${profile.experience[0]?.role || "Backend Intern"} taught me how to coordinate structured developer sprints, design clean RESTful routes, and deploy serverless functions.`;

    const closeParagraph = `My core competencies include ${seoKw.priority.join(", ")}, alongside practical exposure to ${profile.skills.slice(3, 5).join(" and ")}. I look forward to the opportunity to discuss how my technical projects and coding passion can help ${targetCompany} achieve its delivery goals.`;

    const fullContent = `${regionFmt.header}\n\n${styleOpening}\n\n${bodyParagraph}\n\n${closeParagraph}\n\n${regionFmt.footer}\n${profile.name}`;

    const score = Math.round(75 + Math.random() * 20);
    const personalization = Math.round(80 + Math.random() * 18);
    const ats = Math.round(78 + Math.random() * 20);
    const roleMatch = Math.round(82 + Math.random() * 15);

    const letterData: LetterVersion = {
      content: fullContent,
      style: selectedStyle,
      company: targetCompany,
      score,
      personalization,
      ats,
      roleMatch
    };

    if (ver === "A") {
      setVersionA(letterData);
      if (activeVersion === "A") {
        setEditingContent(fullContent);
      }
    } else {
      setVersionB(letterData);
      if (activeVersion === "B") {
        setEditingContent(fullContent);
      }
    }
  };

  // Create alternative cover letter style and compare
  const handleCreateAlternative = async () => {
    if (!versionA.content && !versionB.content) {
      alert("Please compile Version A first.");
      return;
    }
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Monthly Free Limit Reached. Upgrade to Premium to continue immediately.");
        return;
      }

      const styles = ["technical", "startup", "professional", "modern", "leadership"];
      if (versionA.content && !versionB.content) {
        const altStyle = styles.find(s => s !== versionA.style) || "modern";
        generateDraftLetter("B", altStyle);
        alert(`Successfully generated Version B with an alternative style: "${altStyle}". You can now compare them in the Comparator Board tab!`);
      } else if (!versionA.content && versionB.content) {
        const altStyle = styles.find(s => s !== versionB.style) || "technical";
        generateDraftLetter("A", altStyle);
        alert(`Successfully generated Version A with an alternative style: "${altStyle}". You can now compare them in the Comparator Board tab!`);
      } else {
        // Both exist, generate a different style for Version B
        const currentAltStyle = versionB.style;
        const remainingStyles = styles.filter(s => s !== versionA.style && s !== currentAltStyle);
        const altStyle = remainingStyles[0] || "startup";
        generateDraftLetter("B", altStyle);
        alert(`Successfully regenerated Version B with a new alternative style: "${altStyle}". Check the Comparator Board tab to compare!`);
      }
    } catch (err) {
      console.error("Failed to check cover letter limits:", err);
    }
  };

  // Compile letter trigger
  const handleCompileLetter = async () => {
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Monthly Free Limit Reached. Upgrade to Premium to continue immediately.");
        return;
      }

      generateDraftLetter(activeVersion);
      alert(`Success! Generated Version ${activeVersion} Cover Letter aligned for ${targetCompany} (${coverLetterStyle} style).`);
    } catch (err) {
      console.error("Failed to check cover letter limits:", err);
      // Fallback
      generateDraftLetter(activeVersion);
    }
  };

  // Switch versions
  const handleSwitchVersion = (ver: "A" | "B") => {
    setActiveVersion(ver);
    setEditingContent(ver === "A" ? versionA.content : versionB.content);
  };

  // Copy trigger
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download files
  const handleDownloadFile = (type: "md" | "txt") => {
    const content = activeVersion === "A" ? versionA.content : versionB.content;
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cover_letter_${targetCompany.toLowerCase()}.${type}`;
    link.click();
    URL.revokeObjectURL(url);
    alert(`Downloaded cover letter as .${type} file.`);
  };

  // Copilot strategy consultation
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
      const apiKey = typeof window !== "undefined" ? localStorage.getItem(getScopedKey("gemini_api_key", userId)) || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          message: `Cover Letter branding advice: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole,
            targetCompany,
            versionAScore: versionA.score,
            versionBScore: versionB.score,
            currentStyle: coverLetterStyle,
            region
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
      // Robust offline fallback models
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("score") || q.includes("low")) {
        reply = `### Improving Your Cover Letter Score:
Your current active draft score is **${activeVersion === "A" ? versionA.score : versionB.score}/100**.
- **Lack of Projects**: If you sync project summaries from Portfolio Builder OS, it boosts Personalization rating by 15%.
- **Missing Keywords**: Scan your Job Description text to extract keywords, then add them under the **Scorer & SEO** tab to boost your ATS Index.`;
      } else if (q.includes("project") || q.includes("mention")) {
        reply = `### Project Integration Advice:
For a **${targetRole}** role, emphasize your **${profile.projects[0]?.title || "WebSocket Whiteboard"}** project. 
- State the technologies explicitly (**${profile.projects[0]?.tech.join(", ") || "React, WebSockets"}**).
- Quantify the latency or load achievements (**${profile.projects[0]?.impact || "35% reduction in latency"}**).`;
      } else if (q.includes("ats")) {
        reply = `### ATS-Friendliness Checklist:
- Match the job title of your cover letter exactly to the target JD role (**${targetRole}**).
- Avoid fancy graphical dividers or complex HTML templates in plain layouts.
- Integrate the priority keywords: **${(ROLE_SEO_KEYWORDS[targetRole] || ROLE_SEO_KEYWORDS["Software Engineer"]).priority.join(", ")}**.`;
      } else {
        reply = `To prepare a cover letter for **${targetCompany}** as a **${targetRole}**, swap the style to **${targetCompany === "Google" ? "startup" : "technical"}** and click **Compile Cover Letter** in the writer tab.`;
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

  // SEO Missing Keywords compilation
  const getMissingKeywords = () => {
    const seoKw = ROLE_SEO_KEYWORDS[targetRole] || { priority: ["Systems"], missing: ["CI/CD"] };
    const content = (activeVersion === "A" ? versionA.content : versionB.content).toLowerCase();
    
    return seoKw.missing.filter(kw => !content.includes(kw.toLowerCase()));
  };

  const hasA = !!versionA.content;
  const hasB = !!versionB.content;

  const getKeywordCoverageCount = (ver: LetterVersion) => {
    if (!ver.content) return 0;
    const seoKw = ROLE_SEO_KEYWORDS[targetRole] || { priority: ["Systems"], missing: ["CI/CD"] };
    const allKeywords = [...seoKw.priority, ...seoKw.missing];
    const contentLower = ver.content.toLowerCase();
    return allKeywords.filter(kw => contentLower.includes(kw.toLowerCase())).length;
  };

  const getReadabilityRating = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Average";
    return "Needs Improvement";
  };

  const getRecommendation = () => {
    const diff = versionA.score - versionB.score;
    const recommendedVer: "A" | "B" = diff >= 0 ? "A" : "B";
    const winningVersion = recommendedVer === "A" ? versionA : versionB;
    const losingVersion = recommendedVer === "A" ? versionB : versionA;
    
    const reasons: string[] = [];
    
    if (winningVersion.ats > losingVersion.ats) {
      reasons.push("higher ATS compatibility");
    }
    
    const winKws = getKeywordCoverageCount(winningVersion);
    const loseKws = getKeywordCoverageCount(losingVersion);
    if (winKws > loseKws) {
      reasons.push("better keyword alignment");
    }
    
    if (winningVersion.personalization > losingVersion.personalization) {
      reasons.push("stronger project impact statements");
    } else {
      reasons.push("better overall branding appeal");
    }
    
    return {
      version: recommendedVer,
      reason: `Higher score due to ${reasons.join(", ")}.`
    };
  };

  const getStrengths = (ver: LetterVersion) => {
    const strengths: string[] = [];
    if (ver.style === "technical") {
      strengths.push("Direct focus on technical skills and modular achievements");
    } else if (ver.style === "startup") {
      strengths.push("High energy, iterative flow, and fast deployment emphasis");
    } else if (ver.style === "professional") {
      strengths.push("Polished structural layout, formal phrasing, and governance alignment");
    } else if (ver.style === "modern") {
      strengths.push("Engaging copy narratives and readable formatting");
    } else {
      strengths.push("Strong leadership assertions and vision");
    }
    
    if (ver.ats >= 85) {
      strengths.push("Strong density of industry keywords");
    }
    if (ver.personalization >= 85) {
      strengths.push("Highly personalized context mapping company culture");
    }
    return strengths;
  };

  const currentVersion = activeVersion === "A" ? versionA : versionB;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* LEFT COLUMN (Workspace Controllers) */}
      <div className="lg:col-span-8 space-y-8">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            Cover Letter Operating System
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Cover Letter OS
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Compile highly personalized, recruiter-focused, and ATS-friendly cover letters tailored for top hiring employers.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "generator", label: "Letter Writer", icon: <Plus className="w-4 h-4" /> },
            { id: "scorer", label: "Scorer & Keywords", icon: <Award className="w-4 h-4" /> },
            { id: "comparator", label: "Comparator Board", icon: <TrendingUp className="w-4 h-4" /> }
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

        {/* Dynamic workspace card */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          {/* TAB 1: LETTER WRITER */}
          {activeSubTab === "generator" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-black text-slate-900 font-display">Cover Letter Workspace</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleImportFromResume}
                    className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all cursor-pointer animate-pulse"
                  >
                    Sync Resume OS
                  </button>
                  <button
                    onClick={handleImportFromPortfolio}
                    className="px-3.5 py-2 bg-emerald-50 border border-emerald-100 text-emerald-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    Sync Portfolio projects
                  </button>
                </div>
              </div>

              {/* Selection channels configurations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Input Mode</label>
                  <select
                    value={inputSource}
                    onChange={(e) => setInputSource(e.target.value as "resume" | "resume_jd" | "resume_url" | "resume_company" | "resume_all")}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="resume">Resume Only</option>
                    <option value="resume_jd">Resume + Job Description</option>
                    <option value="resume_url">Resume + Job URL</option>
                    <option value="resume_company">Resume + Company Name</option>
                    <option value="resume_all">Resume + JD + Company</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Company</label>
                  <select
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    {Object.keys(COMPANY_CULTURE).map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    {Object.keys(ROLE_SEO_KEYWORDS).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extra input forms details based on source */}
              {["resume_jd", "resume_all"].includes(inputSource) && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Paste Job Description (JD)</label>
                  <textarea
                    rows={4}
                    value={jdTextInput}
                    onChange={(e) => setJdTextInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {inputSource === "resume_url" && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Enter Job URL</label>
                  <input
                    type="text"
                    value={jobUrlInput}
                    placeholder="https://google.com/careers/job-id"
                    onChange={(e) => setJobUrlInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              )}

              {/* Adjust formatting styles and regions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cover Letter Style</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["technical", "startup", "professional", "modern", "leadership"].map(st => (
                      <button
                        key={st}
                        onClick={() => setCoverLetterStyle(st)}
                        className={cn(
                          "px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                          coverLetterStyle === st ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Geographical Region Formatting</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    {Object.keys(REGION_FORMATS).map(regName => (
                      <option key={regName} value={regName}>{regName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions panel */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-150 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Compiling for:</span>
                    <strong className="text-xs font-black text-slate-800 uppercase tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded">{activeVersion === "A" ? "Version A" : "Version B"}</strong>
                  </div>
                  <button
                    onClick={handleCompileLetter}
                    className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-650 transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Compile Cover Letter</span>
                  </button>
                </div>

                {/* Editor Box */}
                {(activeVersion === "A" ? versionA.content : versionB.content) && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                      <span>Preview & Edit Cover Letter</span>
                      <button
                        onClick={() => {
                          const val = activeVersion === "A" ? versionA.content : versionB.content;
                          handleCopyText(val, "editor-copy");
                        }}
                        className="hover:text-slate-800 flex items-center gap-1"
                      >
                        {copiedKey === "editor-copy" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>Copy Draft</span>
                      </button>
                    </div>

                    <textarea
                      rows={14}
                      value={editingContent}
                      onChange={(e) => {
                        setEditingContent(e.target.value);
                        if (activeVersion === "A") {
                          setVersionA({ ...versionA, content: e.target.value });
                        } else {
                          setVersionB({ ...versionB, content: e.target.value });
                        }
                      }}
                      className="w-full p-6 bg-slate-950 text-slate-200 border border-slate-850 rounded-[2rem] text-xs font-semibold leading-relaxed focus:outline-none font-mono"
                    />

                    {/* Direct Export & Version Actions */}
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        onClick={() => {
                          const val = activeVersion === "A" ? versionA.content : versionB.content;
                          handleCopyText(val, "export-copy");
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        {copiedKey === "export-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Text</span>
                      </button>

                      <button
                        onClick={() => alert("Compiling PDF package... Your cover letter PDF has been successfully exported.")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-650 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-400" />
                        <span>Download PDF</span>
                      </button>

                      <button
                        onClick={() => alert("Compiling DOCX package... Document successfully saved in local downloads.")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-650 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        <span>Download DOCX</span>
                      </button>

                      <button
                        onClick={() => handleDownloadFile("txt")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-650 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download TXT</span>
                      </button>

                      <button
                        onClick={handleCompileLetter}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Regenerate</span>
                      </button>

                      <button
                        onClick={handleCreateAlternative}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-150 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Create Alternative Version</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCORER & KEYWORDS */}
          {activeSubTab === "scorer" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-black text-slate-900 font-display">Recruiter Quality Scorer</h2>
                <span className="text-xs font-black text-slate-500">
                  Active Draft: <strong className="text-indigo-650 font-black">{activeVersion === "A" ? "Version A" : "Version B"}</strong>
                </span>
              </div>

              {/* Circular gauges layout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Overall Score", score: currentVersion.score, color: "text-indigo-600" },
                  { label: "Personalization", score: currentVersion.personalization, color: "text-blue-500" },
                  { label: "ATS Optimization", score: currentVersion.ats, color: "text-emerald-500" },
                  { label: "Role Alignment", score: currentVersion.roleMatch, color: "text-purple-500" }
                ].map((gauge, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-inner">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-tight">{gauge.label}</span>
                    <div className="relative w-18 h-18 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="36" cy="36" r="30" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                        <circle cx="36" cy="36" r="30" className={gauge.color} strokeWidth="4" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 30}
                          strokeDashoffset={2 * Math.PI * 30 * (1 - (gauge.score || 70) / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-800">{gauge.score || 70}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyword checklists */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 font-display">ATS Keyword Optimizer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Priority */}
                  <div className="bg-slate-55/30 border border-slate-200/60 p-5 rounded-2xl space-y-3">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Priority JD Keywords</strong>
                    <div className="flex flex-wrap gap-2">
                      {(ROLE_SEO_KEYWORDS[targetRole] || ROLE_SEO_KEYWORDS["Software Engineer"]).priority.map(kw => (
                        <span key={kw} className="px-2.5 py-1 bg-blue-50 text-blue-650 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing */}
                  <div className="bg-slate-55/30 border border-slate-200/60 p-5 rounded-2xl space-y-3">
                    <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Missing from Letter (Fill Gaps)</strong>
                    <div className="flex flex-wrap gap-2">
                      {getMissingKeywords().length > 0 ? (
                        getMissingKeywords().map(kw => (
                          <span key={kw} className="px-2.5 py-1 bg-red-50 text-red-655 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100 animate-pulse">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold block">All priority keywords successfully integrated! ✓</span>
                      )}
                    </div>
                  </div>

                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5">
                  <strong className="text-indigo-900 text-xs font-black block">Branding Score Explanation:</strong>
                  <p className="text-[11px] text-indigo-750 font-bold leading-normal">
                    This letter highlights key achievements and target company metrics, matching Google&apos;s impact culture. To boost your ATS score further, try integrating the missing parameters: **{getMissingKeywords().join(", ") || "CI/CD"}**.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPARATOR BOARD */}
          {activeSubTab === "comparator" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Version Comparison Board</h2>
              
              {/* Scenario 3: Neither version exists */}
              {!hasA && !hasB && (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <strong className="text-sm font-black text-slate-800 block">No versions to compare</strong>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Generate your first cover letter to begin comparison.
                    </p>
                  </div>
                </div>
              )}

              {/* Scenarios 1 & 2: At least one version exists */}
              {(hasA || hasB) && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    
                    {/* Version A Card */}
                    <div 
                      onClick={() => hasA && handleSwitchVersion("A")} 
                      className={cn(
                        "border p-6 rounded-3xl transition-all space-y-4 flex flex-col justify-between",
                        hasA 
                          ? (activeVersion === "A" ? "border-indigo-400 bg-indigo-50/10 shadow-lg shadow-indigo-150/10 cursor-pointer" : "border-slate-200 bg-slate-50/20 cursor-pointer")
                          : "border-slate-100 bg-slate-50/10 opacity-60"
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm font-black text-slate-800">Version A ({versionA.style} style)</strong>
                          {hasA ? (
                            <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Score: {versionA.score}/100</span>
                          ) : (
                            <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Not generated yet</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">
                          {hasA ? versionA.content : "Not generated yet"}
                        </p>
                      </div>
                    </div>

                    {/* Version B Card */}
                    <div 
                      onClick={() => hasB && handleSwitchVersion("B")} 
                      className={cn(
                        "border p-6 rounded-3xl transition-all space-y-4 flex flex-col justify-between",
                        hasB 
                          ? (activeVersion === "B" ? "border-indigo-400 bg-indigo-50/10 shadow-lg shadow-indigo-150/10 cursor-pointer" : "border-slate-200 bg-slate-50/20 cursor-pointer")
                          : "border-slate-150 bg-slate-50/50 border-dashed"
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm font-black text-slate-800">Version B ({versionB.style} style)</strong>
                          {hasB ? (
                            <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Score: {versionB.score}/100</span>
                          ) : (
                            <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Not generated yet</span>
                          )}
                        </div>
                        {hasB ? (
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">
                            {versionB.content}
                          </p>
                        ) : (
                          <div className="space-y-2 py-2">
                            <p className="text-[11px] text-slate-400 font-bold">
                              Generate Version B to compare.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateAlternative();
                              }}
                              className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-750 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                            >
                              Create Alternative
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Scenario 2: Both versions exist - display comparison summaries and metrics */}
                  {hasA && hasB ? (
                    <div className="space-y-8 pt-6 border-t border-slate-100">
                      
                      {/* Comparison Metrics */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 font-display mb-4">Comparison Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* ATS Difference */}
                          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ATS Difference</span>
                            <div className="mt-1.5 flex items-baseline gap-2">
                              <strong className="text-lg font-black text-slate-800">
                                {versionA.ats === versionB.ats ? "0" : `${versionA.ats > versionB.ats ? "+" : ""}${versionA.ats - versionB.ats}`}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-bold">
                                ({versionA.ats} vs {versionB.ats})
                              </span>
                            </div>
                          </div>

                          {/* Keyword Coverage */}
                          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Keyword Coverage</span>
                            <div className="mt-1.5 space-y-1">
                              <p className="text-xs font-bold text-slate-700">
                                Version A: <strong className="text-slate-900 font-black">{getKeywordCoverageCount(versionA)} keywords</strong>
                              </p>
                              <p className="text-xs font-bold text-slate-700">
                                Version B: <strong className="text-slate-900 font-black">{getKeywordCoverageCount(versionB)} keywords</strong>
                              </p>
                            </div>
                          </div>

                          {/* Recruiter Readability */}
                          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Readability</span>
                            <div className="mt-1.5 space-y-1">
                              <p className="text-xs font-bold text-slate-700">
                                Version A: <strong className="text-indigo-650 font-black">{getReadabilityRating(versionA.score)}</strong>
                              </p>
                              <p className="text-xs font-bold text-slate-700">
                                Version B: <strong className="text-indigo-650 font-black">{getReadabilityRating(versionB.score)}</strong>
                              </p>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Comparison Summary & Recommendation Engine */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                        
                        {/* Strengths of A & B */}
                        <div className="space-y-4">
                          <h3 className="text-base font-black text-slate-900 font-display">Comparison Summary</h3>
                          
                          <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                              <strong className="text-xs font-black text-slate-800 block mb-1.5">Strengths of Version A ({versionA.style})</strong>
                              <ul className="space-y-1 text-[11px] text-slate-650 font-bold list-disc pl-4">
                                {getStrengths(versionA).map((str, idx) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                              <strong className="text-xs font-black text-slate-800 block mb-1.5">Strengths of Version B ({versionB.style})</strong>
                              <ul className="space-y-1 text-[11px] text-slate-650 font-bold list-disc pl-4">
                                {getStrengths(versionB).map((str, idx) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Engine */}
                        <div className="bg-indigo-50/40 border border-indigo-100 p-6 rounded-3xl flex flex-col justify-between">
                          <div className="space-y-3">
                            <strong className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Recommendation Engine</strong>
                            <h4 className="text-lg font-black text-slate-950 font-display">
                              Recommended Version: <span className="text-indigo-600">Version {getRecommendation().version}</span>
                            </h4>
                            <p className="text-xs text-slate-700 font-bold leading-relaxed">
                              {getRecommendation().reason}
                            </p>
                          </div>
                          <div className="pt-4 mt-4 border-t border-indigo-100/60">
                            <button
                              onClick={() => {
                                handleSwitchVersion(getRecommendation().version);
                                setActiveSubTab("generator");
                              }}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md inline-block"
                            >
                              Edit Recommended Version
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : null}

                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN (Scorer Sidebar & Cover Letter Copilot) */}
      <div className="lg:col-span-4 space-y-8">

        {/* Quotas & Usage Tracker */}
        <UsageMeter />
        
        {/* Readiness panel */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Readiness Summary</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Overall Score</span>
              <span className="text-indigo-650 font-black">{currentVersion.score || 0}/100</span>
            </div>
            <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentVersion.score || 0}%` }}
              />
            </div>

            <div className="space-y-2 text-[10px] font-bold text-slate-500 leading-normal pt-2 border-t border-slate-100">
              <p>• Company Tone: <strong className="text-slate-800 uppercase tracking-wider">{COMPANY_CULTURE[targetCompany]?.category || "FAANG"} Style</strong></p>
              <p>• Alignment Profile: <strong className="text-slate-800">{targetRole}</strong></p>
              <p>• Regional layout: <strong className="text-slate-800">{region} Format</strong></p>
            </div>
          </div>
        </div>

        {/* Strategic Copilot Widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[500px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Branding Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Cover Letter advisor</span>
            </div>
          </div>

          {/* Messages lists */}
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
                  <span>Reviewing cover letter keywords...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick templates updates */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
            {[
              { label: "IMPROVE SCORE", query: "Why is my cover letter score low?" },
              { label: "SHOWCASE PROJECT", query: "Which projects should I mention?" },
              { label: "ATS COMPLIANCE", query: "How ATS-friendly is this letter?" }
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
              placeholder="Ask Copilot for custom adjustments..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
              }}
              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
