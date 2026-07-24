"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getUserProfile, upsertUserProfile } from "@/lib/db/profiles";
import { saveAnalyticsSnapshot } from "@/lib/db/resume-analytics";
import { calculatePRIScore } from "@/lib/db/placement-readiness";

import {
  Sparkles,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Lock,
  RefreshCw,
  AlertTriangle,
  Award,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone as PhoneIcon,
  Globe,
  Settings,
  ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";
import RemainingUsageBadge from "./RemainingUsageBadge";
import UpgradeBanner from "./UpgradeBanner";

interface EducationItem {
  school: string;
  degree: string;
  major: string;
  location: string;
  date: string;
  gpa: string;
}

interface SkillGroup {
  category: string;
  items: string[];
}

interface ProjectItem {
  title: string;
  role: string;
  description: string[];
  technologies: string[];
}

interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  date: string;
  description: string[];
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: string[];
  achievements: string[];
}

const INITIAL_PROFILE: ProfileData = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1-123-456-7890",
  linkedin: "linkedin.com/in/johndoe",
  github: "github.com/johndoe",
  portfolio: "johndoe.dev",
  summary: "Results-oriented Software Engineer with experience in building scalable web applications. Strong foundations in backend structures and responsive frontend designs.",
  education: [
    { school: "State University", degree: "Bachelor of Science", major: "Computer Science", location: "Boston, MA", date: "2020 - 2024", gpa: "3.7/4.0" }
  ],
  skills: [
    { category: "Languages", items: ["JavaScript", "TypeScript", "Python", "Java"] },
    { category: "Frameworks", items: ["React", "Next.js", "Node.js", "Express"] },
    { category: "Databases", items: ["PostgreSQL", "MongoDB", "Redis"] }
  ],
  projects: [
    { title: "Collaborative Whiteboard", role: "Lead Developer", description: ["Developed real-time canvas sync using WebSockets.", "Optimized load performance by 35% using React lazy-loading."], technologies: ["React", "Node.js", "Socket.io"] }
  ],
  experience: [
    { company: "TechCorp", role: "Software Engineer Intern", location: "New York, NY", date: "Summer 2023", description: ["Built internal admin dashboard used by 150+ employee agents.", "Refactored API controllers decreasing query times by 20%."] }
  ],
  certifications: ["AWS Certified Developer Associate"],
  achievements: ["1st Place at University Hackathon 2023"]
};

const TEMPLATES = [
  { id: "1", name: "ATS Classic", font: "font-serif", alignment: "text-left", score: 98, desc: "Traditional academic/professional serif format. Highly recommended for conservative industries." },
  { id: "2", name: "Software Engineer Special", font: "font-sans", alignment: "text-left", score: 97, desc: "Sleek sans-serif design, highlighting skills at the very top for technical recruiters." },
  { id: "3", name: "Modern Minimalist", font: "font-sans", alignment: "text-left", score: 94, desc: "Lightweight margins, elegant styling dividers, optimized for spacing." },
  { id: "4", name: "Data Science Special", font: "font-mono text-xs", alignment: "text-left", score: 96, desc: "Designed to structure analytics, database tags, and quantitative project metrics." },
  { id: "5", name: "Product & Analyst", font: "font-sans", alignment: "text-left", score: 95, desc: "Presents strong business impact bullet points, summaries, and leadership stats." },
  { id: "6", name: "Fresher Placement Special", font: "font-serif", alignment: "text-left", score: 98, desc: "Prioritizes academic qualifications, coursework, and projects first for graduates." },
  { id: "7", name: "Creative Designer", font: "font-sans font-bold", alignment: "text-left", score: 90, desc: "Modern Poppins/Montserrat font styling with custom highlights, great for startup & UI design roles." },
  { id: "8", name: "Executive Leader", font: "font-serif", alignment: "text-left", score: 95, desc: "High density layout prioritizing key strategic achievements, leadership milestones, and core board competencies." },
  { id: "9", name: "Academic CV Standard", font: "font-serif", alignment: "text-center", score: 92, desc: "Traditional academic syllabus format for fellowships, research, publications, and university credentials." },
  { id: "10", name: "Startup Generalist", font: "font-sans text-xs", alignment: "text-left", score: 94, desc: "Elegantly condensed, highlight-oriented formatting optimized for fast-paced growth companies." }
];

export default function ResumeBuilder({ onScoreUpdate, onTabChange }: { onScoreUpdate?: (score: number) => void; onTabChange?: (tab: string) => void }) {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "summary", "education", "skills", "experience", "projects", "certifications", "achievements"
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("1");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [hasLoadedProfile, setHasLoadedProfile] = useState<boolean>(false);
  
  // Execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isJdOptimizing, setIsJdOptimizing] = useState<boolean>(false);
  const [latexCode, setLatexCode] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  
  // Versioning state
  const [versions, setVersions] = useState<{ id: string; label: string; data: ProfileData }[]>([]);
  const [versionLabel, setVersionLabel] = useState<string>("");
  
  // Scanned JD cache state
  const [hasCachedJd, setHasCachedJd] = useState<boolean>(false);
  const [cachedJdTitle, setCachedJdTitle] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const normalizeProfileData = (raw: any): ProfileData => {
    if (!raw) return INITIAL_PROFILE;
    return {
      name: raw.name || "",
      email: raw.email || "",
      phone: raw.phone || "",
      linkedin: raw.linkedin || "",
      github: raw.github || "",
      portfolio: raw.portfolio || "",
      summary: raw.summary || "",
      education: Array.isArray(raw.education)
        ? raw.education.map((edu: any) => ({
            school: edu.school || "",
            degree: edu.degree || "",
            major: edu.major || "",
            location: edu.location || "",
            date: edu.date || "",
            gpa: edu.gpa || "",
          }))
        : [],
      skills: Array.isArray(raw.skills)
        ? raw.skills.map((s: any) => ({
            category: s.category || "",
            items: Array.isArray(s.items) ? s.items.map(String) : [],
          }))
        : [],
      projects: Array.isArray(raw.projects)
        ? raw.projects.map((p: any) => ({
            title: p.title || "",
            role: p.role || "",
            description: Array.isArray(p.description) ? p.description.map(String) : [],
            technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
          }))
        : [],
      experience: Array.isArray(raw.experience)
        ? raw.experience.map((exp: any) => ({
            company: exp.company || "",
            role: exp.role || "",
            location: exp.location || "",
            date: exp.date || "",
            description: Array.isArray(exp.description) ? exp.description.map(String) : [],
          }))
        : [],
      certifications: Array.isArray(raw.certifications) ? raw.certifications.map(String) : [],
      achievements: Array.isArray(raw.achievements) ? raw.achievements.map(String) : [],
    };
  };


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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeUser = userId || "guest";
      const savedKey = localStorage.getItem("gemini_api_key_" + activeUser) || localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey);

      // Check for previously scanned JD in history to allow JD tailoring
      const savedHistory = localStorage.getItem("jd_match_history_" + activeUser) || localStorage.getItem("jd_match_history");
      if (savedHistory) {
        try {
          const list = JSON.parse(savedHistory);
          if (list.length > 0) {
            setHasCachedJd(true);
            setCachedJdTitle(`${list[0].jdTitle} at ${list[0].company}`);
          }
        } catch(e){}
      }
    }
  }, [userId]);

  // Sync profile & versions from Supabase
  useEffect(() => {
    async function syncProfile() {
      if (hasLoadedProfile) return;
      const activeUser = userId || "guest";
      if (!userId) {
        // Fallback to local storage for guest
        const savedProfile = localStorage.getItem("resume_builder_profile_" + activeUser);
        if (savedProfile) {
          try {
            setProfile(normalizeProfileData(JSON.parse(savedProfile)));
            setHasLoadedProfile(true);
          } catch(e){}
        }
        const savedVersions = localStorage.getItem("resume_builder_versions_" + activeUser);
        if (savedVersions) {
          try { setVersions(JSON.parse(savedVersions)); } catch(e){}
        }
        return;
      }

      // Load from Supabase
      const dbProfile = await getUserProfile(userId);
      if (dbProfile && dbProfile.raw_profile_data) {
        const raw = dbProfile.raw_profile_data;
        if (raw.profile) {
          setProfile(normalizeProfileData(raw.profile));
        } else {
          setProfile(normalizeProfileData(raw));
        }
        if (raw.versions) {
          setVersions(raw.versions);
        }
        setHasLoadedProfile(true);
      } else {
        // Migrate local storage to Supabase
        const localProfStr = localStorage.getItem("resume_builder_profile_" + activeUser) || localStorage.getItem("resume_builder_profile");
        const localVersStr = localStorage.getItem("resume_builder_versions_" + activeUser) || localStorage.getItem("resume_builder_versions");
        let localProf = null;
        let localVers = [];
        try {
          if (localProfStr) localProf = JSON.parse(localProfStr);
          if (localVersStr) localVers = JSON.parse(localVersStr);
        } catch (e) {}

        if (localProf) {
          const normalized = normalizeProfileData(localProf);
          setProfile(normalized);
          setVersions(localVers);
          await upsertUserProfile(userId, { profile: normalized, versions: localVers, targetRole });
        }
        setHasLoadedProfile(true);
      }
    }
    syncProfile();
  }, [userId, hasLoadedProfile]);

  // Save changes to Supabase & local storage on profile, versions, or targetRole change
  useEffect(() => {
    const activeUser = userId || "guest";
    if (userId) {
      upsertUserProfile(userId, { profile, versions, targetRole });
    }
    localStorage.setItem("resume_builder_profile_" + activeUser, JSON.stringify(profile));
    localStorage.setItem("resume_builder_versions_" + activeUser, JSON.stringify(versions));
  }, [profile, versions, targetRole, userId]);

  // Compile LaTeX code automatically when profile or template changes
  useEffect(() => {
    const compileLatex = async () => {
      try {
        const res = await fetch("/api/resume/builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "latex",
            profileData: profile,
            templateId: selectedTemplate
          })
        });
        const data = await res.json();
        if (res.ok && data.latexCode) {
          setLatexCode(data.latexCode);
        }
      } catch(e){}
    };
    compileLatex();
  }, [profile, selectedTemplate]);

  // Import ATS scan cache data
  const handleImportAtsData = async () => {
    setIsProcessing(true);
    setProcessingStep("Searching for scanned resume cache...");
    setErrorMsg(null);

    let cachedText = localStorage.getItem("last_analyzed_resume_text_" + (userId || "guest"));

    if (!cachedText && userId) {
      try {
        const { data: scans } = await supabase
          .from("resume_scans")
          .select("analysis")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (scans && scans.length > 0) {
          cachedText = scans[0].analysis?.rawText || "";
        }
      } catch (dbErr) {
        console.error("Failed to fetch scan from Supabase:", dbErr);
      }
    }

    if (!cachedText) {
      setIsProcessing(false);
      setErrorMsg("No previously analyzed resume text found. Please upload a file here instead, or run a check on the ATS Resume Analyzer first.");
      return;
    }

    await handleProcessText(cachedText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jdText", "General parsing request");

      setIsProcessing(true);
      setProcessingStep("Reading uploaded resume...");
      setErrorMsg(null);

      try {
        // First, extract text using evaluate endpoint
        const evaluateRes = await fetch("/api/resume/evaluate", {
          method: "POST",
          headers: { "x-gemini-api-key": apiKey },
          body: formData
        });
        const evaluateData = await evaluateRes.json();
        if (!evaluateRes.ok) throw new Error(evaluateData.message || evaluateData.error || "Failed to parse file.");
        
        if (evaluateData.rawText) {
          localStorage.setItem("last_analyzed_resume_text_" + (userId || "guest"), evaluateData.rawText);
          handleProcessText(evaluateData.rawText);
        }
      } catch (err: any) {
        console.error(err);
        const errMsg = err.message || "";
        if (errMsg.toLowerCase().includes("limit reached") || errMsg.toLowerCase().includes("upgrade to")) {
          setShowUpgradeModal(true);
        } else {
          setErrorMsg(errMsg || "Failed to process resume file.");
        }
        setIsProcessing(false);
      }
    }
  };

  const handleProcessText = async (rawText: string) => {
    setIsProcessing(true);
    setProcessingStep("Analyzing raw resume structure...");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/resume/builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          action: "structure",
          text: rawText
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        if (data.message?.toLowerCase().includes("limit reached") || data.message?.toLowerCase().includes("upgrade to")) {
          setShowUpgradeModal(true);
          setIsProcessing(false);
          return;
        }
        throw new Error(data.message || data.error || "Failed to parse resume.");
      }

      setProfile(normalizeProfileData(data.data));
      setSuccessMessage("Resume imported successfully!");
      import("@/components/RemainingUsageBadge").then(({ triggerBadgeRefresh }) => triggerBadgeRefresh());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to structure resume content.");
    } finally {
      setIsProcessing(false);
    }
  };

  // JD-Aware optimize
  const handleJdOptimize = async () => {
    const savedHistory = localStorage.getItem("jd_match_history_" + (userId || "guest")) || localStorage.getItem("jd_match_history");
    if (!savedHistory) return;
    
    let jdText = "";
    try {
      const list = JSON.parse(savedHistory);
      if (list.length > 0) jdText = list[0].jdText;
    } catch(e){}

    if (!jdText) {
      setErrorMsg("No active job description found in history.");
      return;
    }

    setIsJdOptimizing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/resume/builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          action: "optimize-jd",
          profileData: profile,
          jdText
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        if (data.message?.toLowerCase().includes("limit reached") || data.message?.toLowerCase().includes("upgrade to")) {
          setShowUpgradeModal(true);
          setIsJdOptimizing(false);
          return;
        }
        throw new Error(data.message || data.error || "Failed to optimize resume for target job.");
      }

      setProfile(normalizeProfileData(data.data));
      setSuccessMessage("Resume successfully optimized for job description!");
      import("@/components/RemainingUsageBadge").then(({ triggerBadgeRefresh }) => triggerBadgeRefresh());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to run JD-aware resume tailoring.");
    } finally {
      setIsJdOptimizing(false);
    }
  };

  const setSuccessMessage = (msg: string) => {
    alert(msg); // Simple UI callback
  };

  // Section ordering handlers
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setSectionOrder(newOrder);
  };

  // Versioning handlers
  const saveVersion = () => {
    const label = versionLabel.trim() || `Resume Version ${versions.length + 1}`;
    const newVersion = {
      id: Date.now().toString(),
      label,
      data: profile
    };
    const updated = [...versions, newVersion];
    setVersions(updated);
    localStorage.setItem("resume_builder_versions_" + (userId || "guest"), JSON.stringify(updated));
    setVersionLabel("");
    setSuccessMessage(`Saved version: "${label}"`);

    if (userId) {
      const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
      const templateScore = activeTemplate.score;
      saveAnalyticsSnapshot(userId, {
        resume_id: null,
        ats_score: templateScore,
        role_fit_score: 85,
        target_role: targetRole,
        keyword_score: Math.min(100, Math.round(templateScore * 0.95)),
        format_score: templateScore,
        readability_score: Math.round(templateScore * 0.98),
        skills_score: Math.round(templateScore * 0.92),
        projects_score: Math.round(templateScore * 0.94),
        experience_score: Math.round(templateScore * 0.96),
        analysis_date: new Date().toISOString()
      }).then(() => calculatePRIScore(userId).catch(console.error)).catch(err => console.error("Error saving builder snapshot:", err));
    }
  };

  const restoreVersion = (verData: ProfileData) => {
    setProfile(normalizeProfileData(verData));
    setSuccessMessage("Version restored successfully!");
  };

  const deleteVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = versions.filter(v => v.id !== id);
    setVersions(updated);
    localStorage.setItem("resume_builder_versions_" + (userId || "guest"), JSON.stringify(updated));
  };

  // Download LaTeX File
  const downloadLatexSource = () => {
    if (!latexCode) return;
    const blob = new Blob([latexCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, "_")}_Resume.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF using a hidden iframe (prevents popup blocker and tab focus changes that reset auth state)
  const printPdf = () => {
    const previewHtml = document.getElementById("printable-resume")?.innerHTML;
    if (!previewHtml) {
      alert("No printable resume content found!");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      alert("Print frame not initialized!");
      return;
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      alert("Print document not accessible!");
      return;
    }

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${profile.name || "Resume"} - Resume</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: letter; margin: 0.5in; }
            }
          </style>
        </head>
        <body class="bg-white p-8">
          <div id="printable-resume">
            ${previewHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing inside the context of the iframe window after styles apply
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 600);
  };

  // Export as Word Document (.doc/.docx readable by Microsoft Word)
  const downloadDocx = () => {
    // Generate clean word-formatted HTML document with explicit CSS
    const headerInfo = [
      profile.phone,
      profile.email,
      profile.linkedin,
      profile.github,
      profile.portfolio
    ].filter(Boolean).join("  |  ");

    const htmlString = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <title>${profile.name || "Resume"} - Resume</title>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0.75in 0.75in 0.75in 0.75in;
              mso-header-margin: 0.5in;
              mso-footer-margin: 0.5in;
            }
            body {
              font-family: "Arial", sans-serif;
              font-size: 10.5pt;
              line-height: 1.25;
              color: #1a1a1a;
            }
            h1 {
              font-size: 22pt;
              margin: 0 0 2pt 0;
              text-align: center;
              font-weight: bold;
              font-family: "Arial Black", Arial, sans-serif;
            }
            h2 {
              font-size: 11.5pt;
              margin-top: 14pt;
              margin-bottom: 5pt;
              font-weight: bold;
              border-bottom: 1.5pt solid #2d3748;
              padding-bottom: 2pt;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            p {
              margin: 0 0 4pt 0;
              font-size: 10pt;
            }
            ul {
              margin: 0 0 6pt 0;
              padding-left: 15pt;
            }
            li {
              margin-bottom: 2.5pt;
              font-size: 9.5pt;
              color: #2d3748;
            }
            .header-info {
              text-align: center;
              font-size: 9pt;
              color: #4a5568;
              margin-bottom: 14pt;
              font-weight: bold;
            }
            .section-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 5pt;
            }
            .section-table td {
              padding: 0;
              vertical-align: top;
            }
            .col-title {
              font-weight: bold;
              font-size: 10pt;
              color: #1a1a1a;
            }
            .col-right {
              text-align: right;
              font-weight: bold;
              font-size: 10pt;
              color: #2d3748;
            }
            .col-subtitle {
              font-style: italic;
              font-size: 9.5pt;
              color: #4a5568;
            }
            .col-subright {
              text-align: right;
              font-size: 9.5pt;
              color: #718096;
            }
            .skills-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 4pt;
            }
            .skills-table td {
              padding: 2pt 0;
              font-size: 9.5pt;
              vertical-align: top;
            }
            .skills-cat {
              font-weight: bold;
              width: 120px;
              color: #1a1a1a;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 8pt;">
            <h1>${profile.name}</h1>
            <div class="header-info">
              ${headerInfo}
            </div>
          </div>

          ${sectionOrder.map(sectionKey => {
            if (sectionKey === "summary" && profile.summary) {
              return `
                <h2>Professional Summary</h2>
                <p style="text-align: justify;">${profile.summary}</p>
              `;
            }
            if (sectionKey === "education" && profile.education.length > 0) {
              return `
                <h2>Education</h2>
                ${profile.education.map(edu => `
                  <table class="section-table">
                    <tr>
                      <td class="col-title">${edu.school}</td>
                      <td class="col-right">${edu.location}</td>
                    </tr>
                    <tr>
                      <td class="col-subtitle">${edu.degree} in ${edu.major} ${edu.gpa ? `(GPA: ${edu.gpa})` : ""}</td>
                      <td class="col-subright">${edu.date}</td>
                    </tr>
                  </table>
                `).join("")}
              `;
            }
            if (sectionKey === "skills" && profile.skills.length > 0) {
              return `
                <h2>Technical Skills</h2>
                <table class="skills-table">
                  ${profile.skills.map(group => `
                    <tr>
                      <td class="skills-cat">${group.category}:</td>
                      <td>${group.items.join(", ")}</td>
                    </tr>
                  `).join("")}
                </table>
              `;
            }
            if (sectionKey === "experience" && profile.experience.length > 0) {
              return `
                <h2>Professional Experience</h2>
                ${profile.experience.map(exp => `
                  <table class="section-table">
                    <tr>
                      <td class="col-title">${exp.company}</td>
                      <td class="col-right">${exp.location}</td>
                    </tr>
                    <tr>
                      <td class="col-subtitle">${exp.role}</td>
                      <td class="col-subright">${exp.date}</td>
                    </tr>
                  </table>
                  <ul style="margin-top: 1pt; margin-bottom: 6pt;">
                    ${exp.description.map(bullet => `<li>${bullet}</li>`).join("")}
                  </ul>
                `).join("")}
              `;
            }
            if (sectionKey === "projects" && profile.projects.length > 0) {
              return `
                <h2>Projects</h2>
                ${profile.projects.map(proj => `
                  <table class="section-table">
                    <tr>
                      <td class="col-title">${proj.title} <span style="font-weight: normal; font-size: 8.5pt; color: #718096; font-style: italic;">(${proj.technologies.join(", ")})</span></td>
                      <td class="col-subright">${proj.role}</td>
                    </tr>
                  </table>
                  <ul style="margin-top: 1pt; margin-bottom: 6pt;">
                    ${proj.description.map(bullet => `<li>${bullet}</li>`).join("")}
                  </ul>
                `).join("")}
              `;
            }
            if (sectionKey === "certifications" && profile.certifications.length > 0) {
              return `
                <h2>Certifications</h2>
                <ul style="margin-top: 2pt;">
                  ${profile.certifications.map(cert => `<li>${cert}</li>`).join("")}
                </ul>
              `;
            }
            if (sectionKey === "achievements" && profile.achievements.length > 0) {
              return `
                <h2>Key Achievements</h2>
                <ul style="margin-top: 2pt;">
                  ${profile.achievements.map(ach => `<li>${ach}</li>`).join("")}
                </ul>
              `;
            }
            return "";
          }).join("")}
        </body>
      </html>
    `;

    // Download as a Microsoft Word compatible HTML document
    const blob = new Blob(['\ufeff' + htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, "_")}_Resume.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quality score metrics calculation
  const calculateStrengthScore = () => {
    let score = 40; // baseline
    if (profile.email) score += 5;
    if (profile.phone) score += 5;
    if (profile.linkedin) score += 5;
    if (profile.github) score += 5;
    if (profile.summary && profile.summary.length > 50) score += 10;
    if (profile.education.length > 0) score += 10;
    if (profile.skills.length > 0) score += 10;
    if (profile.experience.length > 0) {
      score += 10;
      if (profile.experience[0].description.length >= 2) score += 5;
    }
    if (profile.projects.length > 0) {
      score += 10;
      if (profile.projects[0].description.length >= 2) score += 5;
    }
    return Math.min(score, 100);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return "text-emerald-600 border-emerald-100 bg-emerald-50";
    if (score >= 75) return "text-blue-600 border-blue-100 bg-blue-50";
    if (score >= 50) return "text-amber-600 border-amber-100 bg-amber-50";
    return "text-red-600 border-red-100 bg-red-50";
  };

  // Compile full preview stylesheet rules
  const getTemplateStyleClasses = () => {
    const t = selectedTemplate;
    if (t === "1") return { font: "font-serif", header: "text-center", border: "border-b border-slate-900 pb-1" };
    if (t === "2") return { font: "font-sans", header: "text-left", border: "border-b border-indigo-700 pb-1" };
    if (t === "3") return { font: "font-sans font-light", header: "text-left", border: "border-b border-slate-200 pb-0.5" };
    if (t === "4") return { font: "font-mono text-xs", header: "text-left", border: "border-b border-teal-700 pb-1" };
    if (t === "5") return { font: "font-sans", header: "text-left", border: "border-b-2 border-slate-800 pb-1" };
    if (t === "6") return { font: "font-serif", header: "text-center", border: "border-b border-slate-900 pb-1" };
    if (t === "7") return { font: "font-[Poppins,sans-serif] tracking-tight", header: "text-left border-l-4 border-indigo-600 pl-4 py-2 bg-slate-50 rounded-r-xl", border: "border-b-2 border-indigo-500 pb-1 text-indigo-700 font-bold" };
    if (t === "8") return { font: "font-serif text-[11px]", header: "text-left border-b-2 border-slate-950 pb-2", border: "border-b-2 border-slate-950 pb-0.5 font-black" };
    if (t === "9") return { font: "font-serif text-xs", header: "text-center pb-2", border: "border-b border-slate-300 pb-1 text-center" };
    if (t === "10") return { font: "font-[Inter,sans-serif] text-[11px]", header: "text-left", border: "border-b-2 border-teal-500 pb-1 text-teal-600" };
    return { font: "font-serif", header: "text-center", border: "border-b border-slate-900 pb-1" };
  };

  // Helper arrays for form field additions
  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", major: "", location: "", date: "", gpa: "" }]
    }));
  };

  const removeEducation = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const addSkillGroup = () => {
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, { category: "", items: [] }]
    }));
  };

  const removeSkillGroup = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx)
    }));
  };

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, { company: "", role: "", location: "", date: "", description: [""] }]
    }));
  };

  const removeExperience = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects, { title: "", role: "", description: [""], technologies: [] }]
    }));
  };

  const removeProject = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-12">
      {/* Page Heading */}
      <div className="max-w-3xl space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 fill-indigo-100" />
            Overleaf integration
          </div>
          <RemainingUsageBadge featureName="resume_builder" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          LaTeX Resume Builder
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Create recruiter-grade, ATS-friendly resumes. Import evaluations directly, select curated layouts, customize section orderings, preview results in real-time, and download native LaTeX source files or selectable-text PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Configuration */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Quick Actions Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">AI Builders & Data Imports</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="btn-import-ats"
                onClick={handleImportAtsData}
                disabled={isProcessing}
                className="py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-indigo-100"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                <span>Import ATS Scan Cache</span>
              </button>

              <button
                id="btn-upload-builder"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF/DOCX</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx"
                  className="hidden"
                />
              </button>
            </div>

            {hasCachedJd && (
              <div className="p-4 bg-slate-900 text-white rounded-3xl space-y-3 relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Job description detected</span>
                  <p className="text-xs font-black truncate">{cachedJdTitle}</p>
                  <p className="text-[8px] text-slate-400 font-medium">Detected from your latest run in the JD Matcher tab.</p>
                </div>
                <button
                  id="btn-optimize-jd-builder"
                  onClick={handleJdOptimize}
                  disabled={isJdOptimizing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isJdOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 fill-indigo-400/20" />}
                  <span>Generate Resume For This Job</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Editor Tabs */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 font-display">Resume Contents Editor</h3>

            <div className="space-y-6">
              
              {/* Contact Information */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Contact Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                    <input
                      type="text"
                      id="input-builder-name"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={profile.linkedin || ""}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/username"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={profile.github || ""}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      placeholder="github.com/username"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Portfolio Link</label>
                    <input
                      type="text"
                      value={profile.portfolio || ""}
                      onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                      placeholder="portfolio.dev"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Professional Summary
                </label>
                <textarea
                  value={profile.summary || ""}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Education section */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education History</span>
                  <button onClick={addEducation} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                    <button onClick={() => removeEducation(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 pr-8">
                      <input
                        type="text"
                        value={edu.school || ""}
                        placeholder="School/University"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].school = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={edu.degree || ""}
                        placeholder="Degree (e.g. B.S.)"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].degree = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={edu.major || ""}
                        placeholder="Major (e.g. Computer Science)"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].major = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={edu.gpa || ""}
                        placeholder="GPA (e.g. 3.8/4.0)"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].gpa = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={edu.location || ""}
                        placeholder="Location"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].location = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={edu.date || ""}
                        placeholder="Dates (e.g. 2020 - 2024)"
                        onChange={(e) => {
                          const list = [...profile.education];
                          list[idx].date = e.target.value;
                          setProfile({ ...profile, education: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills section */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Skills Categories</span>
                  <button onClick={addSkillGroup} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {profile.skills.map((group, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-2">
                    <button onClick={() => removeSkillGroup(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="space-y-2 pr-8">
                      <input
                        type="text"
                        value={group.category || ""}
                        placeholder="Category (e.g. Languages, Frameworks)"
                        onChange={(e) => {
                          const list = [...profile.skills];
                          list[idx].category = e.target.value;
                          setProfile({ ...profile, skills: list });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={(group.items || []).join(", ")}
                        placeholder="Comma-separated items (e.g. React, Vue, Angular)"
                        onChange={(e) => {
                          const list = [...profile.skills];
                          list[idx].items = e.target.value.split(",").map(i => i.trim()).filter(Boolean);
                          setProfile({ ...profile, skills: list });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience section */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Experience</span>
                  <button onClick={addExperience} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                    <button onClick={() => removeExperience(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 pr-8">
                      <input
                        type="text"
                        value={exp.company || ""}
                        placeholder="Company"
                        onChange={(e) => {
                          const list = [...profile.experience];
                          list[idx].company = e.target.value;
                          setProfile({ ...profile, experience: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={exp.role || ""}
                        placeholder="Job Title"
                        onChange={(e) => {
                          const list = [...profile.experience];
                          list[idx].role = e.target.value;
                          setProfile({ ...profile, experience: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={exp.location || ""}
                        placeholder="Location"
                        onChange={(e) => {
                          const list = [...profile.experience];
                          list[idx].location = e.target.value;
                          setProfile({ ...profile, experience: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={exp.date || ""}
                        placeholder="Dates (e.g. Summer 2023)"
                        onChange={(e) => {
                          const list = [...profile.experience];
                          list[idx].date = e.target.value;
                          setProfile({ ...profile, experience: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Experience Bullets (one per line)</label>
                      <textarea
                        value={(exp.description || []).join("\n")}
                        rows={3}
                        placeholder="Bullet 1&#10;Bullet 2"
                        onChange={(e) => {
                          const list = [...profile.experience];
                          list[idx].description = e.target.value.split("\n").filter(Boolean);
                          setProfile({ ...profile, experience: list });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects section */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projects</span>
                  <button onClick={addProject} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                    <button onClick={() => removeProject(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 pr-8">
                      <input
                        type="text"
                        value={proj.title || ""}
                        placeholder="Project Name"
                        onChange={(e) => {
                          const list = [...profile.projects];
                          list[idx].title = e.target.value;
                          setProfile({ ...profile, projects: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={proj.role || ""}
                        placeholder="Role (e.g. Fullstack Developer)"
                        onChange={(e) => {
                          const list = [...profile.projects];
                          list[idx].role = e.target.value;
                          setProfile({ ...profile, projects: list });
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={(proj.technologies || []).join(", ")}
                        placeholder="Technologies (comma-separated, e.g. React, Go)"
                        onChange={(e) => {
                          const list = [...profile.projects];
                          list[idx].technologies = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                          setProfile({ ...profile, projects: list });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <textarea
                        value={(proj.description || []).join("\n")}
                        rows={3}
                        placeholder="Bullet 1&#10;Bullet 2"
                        onChange={(e) => {
                          const list = [...profile.projects];
                          list[idx].description = e.target.value.split("\n").filter(Boolean);
                          setProfile({ ...profile, projects: list });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Certifications and Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Certifications (one per line)</label>
                  <textarea
                    value={profile.certifications.join("\n")}
                    rows={3}
                    onChange={(e) => setProfile({ ...profile, certifications: e.target.value.split("\n").filter(Boolean) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Achievements (one per line)</label>
                  <textarea
                    value={profile.achievements.join("\n")}
                    rows={3}
                    onChange={(e) => setProfile({ ...profile, achievements: e.target.value.split("\n").filter(Boolean) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section Reordering Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              Layout Section Ordering
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Rearrange section order dynamically. Your preview and Overleaf source exports will instantly update.
            </p>
            
            <div className="space-y-2">
              {sectionOrder.map((section, idx) => {
                const label = section.charAt(0).toUpperCase() + section.slice(1);
                return (
                  <div key={section} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700">{label}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sectionOrder.length - 1}
                        className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Version Management Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Version History</h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={versionLabel || ""}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Name this version (e.g. TechCorp Tailored)"
                className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
              <button
                onClick={saveVersion}
                className="px-4 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>

            {versions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[200px] overflow-y-auto pr-1">
                {versions.map(ver => (
                  <div
                    key={ver.id}
                    onClick={() => restoreVersion(ver.data)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-black text-slate-700">{ver.label}</span>
                    <button
                      onClick={(e) => deleteVersion(ver.id, e)}
                      className="p-1 hover:text-red-500 text-slate-400 rounded hover:bg-white transition-colors cursor-pointer"
                      title="Delete version"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Preview & Export Panel */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Template Gallery */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Template Selection Gallery</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={cn(
                    "p-4 border rounded-2xl text-left flex flex-col justify-between h-[120px] transition-all cursor-pointer relative group",
                    selectedTemplate === tmpl.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-black leading-tight group-hover:text-indigo-400 transition-colors">{tmpl.name}</p>
                    <p className="text-[8px] opacity-70 font-medium line-clamp-3 leading-normal">{tmpl.desc}</p>
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded self-start mt-2", selectedTemplate === tmpl.id ? "bg-white/10 text-indigo-300" : "bg-slate-200 text-slate-500")}>
                    ATS: {tmpl.score}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Strength Score Card & Export Panel */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 flex-grow">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resume Score Card</span>
                <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg", getScoreColorClass(calculateStrengthScore()))}>
                  Strength: {calculateStrengthScore()}%
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display">Resume Quality Index</h3>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={printPdf}
                  className="px-4 py-2.5 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                
                <button
                  onClick={downloadLatexSource}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .TEX Source</span>
                </button>

                <button
                  onClick={downloadDocx}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export to Word (.docx)</span>
                </button>
              </div>
            </div>

            {/* Score Ring */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="42" className="text-slate-100" strokeWidth="7" stroke="currentColor" fill="transparent" />
                <circle cx="56" cy="56" r="42" className="text-indigo-600" strokeWidth="7" stroke="currentColor" fill="transparent"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - calculateStrengthScore() / 100)} 
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-black text-slate-800">{calculateStrengthScore()}%</span>
            </div>
          </div>

          {/* Live Desktop-style Resume Preview Panel */}
          <div className="bg-slate-100 p-6 rounded-[2.5rem] border border-slate-200 shadow-inner space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Document Preview</span>
            
            <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[750px] overflow-x-auto relative border border-slate-200">
              
              {/* Target print element mapped to Iframe print logic */}
              <div id="printable-resume" className={cn("text-slate-900 leading-normal text-xs", getTemplateStyleClasses().font)}>
                
                {/* Header */}
                <div className={cn("mb-5", getTemplateStyleClasses().header)}>
                  <h1 className="text-2xl font-black mb-1">{profile.name}</h1>
                  <div className="text-[10px] text-slate-500 font-bold flex flex-wrap justify-center gap-x-2 gap-y-1">
                    {profile.phone && <span>{profile.phone}</span>}
                    {profile.email && <span>• {profile.email}</span>}
                    {profile.linkedin && <span>• {profile.linkedin}</span>}
                    {profile.github && <span>• {profile.github}</span>}
                    {profile.portfolio && <span>• {profile.portfolio}</span>}
                  </div>
                </div>

                {/* Structured sections */}
                <div className="space-y-4">
                  {sectionOrder.map((sectionKey) => {
                    
                    if (sectionKey === "summary" && profile.summary) {
                      return (
                        <div key={sectionKey} className="space-y-1.5">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Professional Summary
                          </h3>
                          <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">{profile.summary}</p>
                        </div>
                      );
                    }

                    if (sectionKey === "education" && profile.education.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-2">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Education
                          </h3>
                          {profile.education.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start text-[10px]">
                              <div>
                                <p className="font-bold text-slate-800">{edu.school}</p>
                                <p className="text-slate-500 font-medium">{edu.degree} in {edu.major} {edu.gpa ? `| GPA: ${edu.gpa}` : ""}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-600">{edu.location}</p>
                                <p className="text-slate-400 font-medium">{edu.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (sectionKey === "skills" && profile.skills.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-1.5">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Technical Skills
                          </h3>
                          <div className="space-y-1 text-[10px]">
                            {profile.skills.map((group, idx) => (
                              <p key={idx} className="font-semibold text-slate-600">
                                <strong className="text-slate-800 font-bold">{group.category}:</strong> {group.items.join(", ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sectionKey === "experience" && profile.experience.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-3">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Professional Experience
                          </h3>
                          {profile.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-start text-[10px]">
                                <div>
                                  <p className="font-bold text-slate-800">{exp.company}</p>
                                  <p className="text-slate-500 font-medium italic">{exp.role}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-600">{exp.location}</p>
                                  <p className="text-slate-400 font-medium">{exp.date}</p>
                                </div>
                              </div>
                              <ul className="list-disc pl-4 text-[10px] text-slate-600 font-semibold space-y-0.5">
                                {exp.description.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (sectionKey === "projects" && profile.projects.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-3">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Projects
                          </h3>
                          {profile.projects.map((proj, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-start text-[10px]">
                                <p className="font-bold text-slate-800">
                                  {proj.title} {proj.technologies.length > 0 && <span className="text-[9px] text-slate-400 font-medium">({proj.technologies.join(", ")})</span>}
                                </p>
                                <p className="text-slate-500 font-medium italic">{proj.role}</p>
                              </div>
                              <ul className="list-disc pl-4 text-[10px] text-slate-600 font-semibold space-y-0.5">
                                {proj.description.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (sectionKey === "certifications" && profile.certifications.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-1.5">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Certifications
                          </h3>
                          <ul className="list-disc pl-4 text-[10px] text-slate-600 font-semibold space-y-0.5">
                            {profile.certifications.map((cert, idx) => (
                              <li key={idx}>{cert}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    if (sectionKey === "achievements" && profile.achievements.length > 0) {
                      return (
                        <div key={sectionKey} className="space-y-1.5">
                          <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-800", getTemplateStyleClasses().border)}>
                            Key Achievements
                          </h3>
                          <ul className="list-disc pl-4 text-[10px] text-slate-600 font-semibold space-y-0.5">
                            {profile.achievements.map((ach, idx) => (
                              <li key={idx}>{ach}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

              </div>

            </div>
          </div>
          
        </div>

      </div>

      {/* Hidden iframe for PDF compilation support */}
      <iframe ref={iframeRef} className="hidden" title="print-frame" />
      <UpgradeBanner isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="resume_builder" />
    </div>
  );
}
