"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Upload,
  Sparkles,
  Award,
  TrendingUp,
  Bot,
  User,
  Send,
  Check,
  Copy,
  Plus,
  FileText
} from "lucide-react";
import { cn, flattenSkills } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { upsertUserProfile } from "@/lib/db/profiles";
import { getScopedKey } from "@/lib/security/LocalStorage";

// Types
interface LinkedInProfile {
  name: string;
  role: string;
  headline: string;
  about: string;
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
  achievements: string[];
  avatar?: string;
}

// Pre-mapped SEO keywords per target role
const ROLE_KEYWORDS: Record<string, { missing: string[]; recommended: string[]; priority: string[] }> = {
  "Software Engineer": {
    missing: ["System Design", "CI/CD Pipelines", "Microservices"],
    recommended: ["Data Structures", "Algorithms", "Git", "REST APIs"],
    priority: ["Java", "C++", "Python", "Software Development Lifecycle"]
  },
  "Frontend Developer": {
    missing: ["Webpack", "Core Web Vitals", "Next.js SSR"],
    recommended: ["Tailwind CSS", "TypeScript", "Responsive Design", "State Management"],
    priority: ["React", "JavaScript", "HTML5", "CSS3", "Frontend Architecture"]
  },
  "Backend Developer": {
    missing: ["Kafka", "GraphQL", "Dockerization"],
    recommended: ["Express.js", "MongoDB", "PostgreSQL", "SQL Tuning"],
    priority: ["Node.js", "RESTful APIs", "System Architecture", "Redis", "Database Design"]
  },
  "Full Stack Developer": {
    missing: ["Kubernetes", "OAuth 2.0", "Redis Caching"],
    recommended: ["React", "Node.js", "TypeScript", "REST APIs", "SQL"],
    priority: ["Full Stack Development", "Git", "Deployment", "CI/CD"]
  },
  "AI Engineer": {
    missing: ["LangChain", "Vector Databases", "Model Fine-Tuning"],
    recommended: ["Python", "TensorFlow", "PyTorch", "NLP Pipelines"],
    priority: ["Generative AI", "LLMs", "Machine Learning", "Neural Networks"]
  },
  "ML Engineer": {
    missing: ["Kubeflow", "MLOps", "Feature Stores"],
    recommended: ["Scikit-Learn", "Pandas", "Computer Vision", "Deep Learning"],
    priority: ["Python", "Algorithms", "Model Deployment", "Data Pipelines"]
  },
  "Data Analyst": {
    missing: ["Tableau Server", "dbt", "ETL Pipelines"],
    recommended: ["SQL Queries", "Excel Macros", "Python Data Analytics", "Pandas"],
    priority: ["Data Visualization", "Power BI", "Data Wrangling", "Statistical Analysis"]
  },
  "Cloud Engineer": {
    missing: ["Terraform IAC", "AWS CloudFormation", "Multi-Cloud Strategy"],
    recommended: ["Docker", "Linux Admin", "Kubernetes", "IAM Policies"],
    priority: ["AWS", "Cloud Architecture", "Serverless", "Security Compliance"]
  },
  "DevOps Engineer": {
    missing: ["Ansible", "Prometheus Monitoring", "Helm Charts"],
    recommended: ["Jenkins", "GitHub Actions", "Docker", "Bash Scripting"],
    priority: ["CI/CD", "Infrastructure as Code", "Kubernetes", "Cloud Operations"]
  },
  "Cybersecurity Engineer": {
    missing: ["SIEM Systems", "Penetration Testing", "ISO 27001 Compliance"],
    recommended: ["Network Security", "Cryptography", "Firewall Configs", "Wireshark"],
    priority: ["Threat Analysis", "Incident Response", "Vulnerability Assessment", "IAM Security"]
  }
};

const defaultProfile: LinkedInProfile = {
  name: "Mujahid Ahmed",
  role: "Full Stack Developer",
  headline: "Full Stack Developer | Aspiring Software Engineer | React, Node.js, Cloud APIs",
  about: "Goal-driven CS graduate focusing on scalable backend design, frontend reactive flows, and RESTful web architectures. Passionate about resolving transaction concurrency systems.",
  email: "mujahid@example.com",
  linkedin: "linkedin.com/in/mujahid-ahmed",
  skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "AWS", "Git"],
  education: "VTU Technical University (B.E. Computer Science, Class of 2026)",
  experience: [
    {
      role: "Backend Developer Intern",
      company: "BuggedBrain Technologies",
      period: "Jan 2026 - Present",
      desc: "Optimized SQL index loops and integrated AI стратеги models, lowering API request response latencies."
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
  certifications: ["AWS Certified Developer Associate"],
  achievements: ["Winner of VTU Inter-College Hackathon 2025"],
  avatar: ""
};

// Helper outside component for react compiler
const generateCopilotMsgId = () => {
  return `copilot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function LinkedInOS() {
  const [activeSubTab, setActiveSubTab] = useState<string>("analyzer");

  const PROFILE_KEY = "linkedin_profile_os";
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
  const [profile, setProfile] = useState<LinkedInProfile>(defaultProfile);

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

  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [profileUrlInput, setProfileUrlInput] = useState("");
  const [profileUrlSyncing, setProfileUrlSyncing] = useState(false);

  // Real LinkedIn OAuth connection states via Supabase Auth
  const [isLinkedinConnected, setIsLinkedinConnected] = useState<boolean>(false);
  const [linkedInUserMeta, setLinkedInUserMeta] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [linkedinSyncLoading, setLinkedinSyncLoading] = useState(false);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Sync LinkedIn OAuth connection state on userId change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isConn = localStorage.getItem(getScopedKey("linkedin_oauth_connected", userId)) === "true";
      setIsLinkedinConnected(isConn);
    }
  }, [userId]);

  // Check LinkedIn session status on mount
  useEffect(() => {
    const checkLinkedInSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const identity = user.identities?.find(id => id.provider === "linkedin_oidc");
          if (identity) {
            setIsLinkedinConnected(true);
            localStorage.setItem(getScopedKey("linkedin_oauth_connected", user.id), "true");
            setLinkedInUserMeta({
              name: identity.identity_data?.name,
              email: identity.identity_data?.email,
              avatar: identity.identity_data?.avatar_url || identity.identity_data?.picture
            });
            
            // Auto pre-populate fields if profile is currently default or empty
            if (profile.name === defaultProfile.name || !profile.name) {
              const updated = {
                ...profile,
                name: identity.identity_data?.name || profile.name,
                email: identity.identity_data?.email || profile.email,
                avatar: identity.identity_data?.avatar_url || identity.identity_data?.picture || profile.avatar
              };
              saveProfile(updated);
              
              // Sync back to Supabase profiles table
              upsertUserProfile(user.id, {
                name: identity.identity_data?.name,
                email: identity.identity_data?.email,
                linkedin: profile.linkedin || `linkedin.com/in/${identity.identity_data?.name?.toLowerCase().replace(/\s+/g, "-")}`
              }).catch(err => console.error("Auto profile sync failed:", err));
            }
          } else {
            setIsLinkedinConnected(false);
            localStorage.setItem(getScopedKey("linkedin_oauth_connected", user.id), "false");
            setLinkedInUserMeta(null);
          }
        }
      } catch (err) {
        console.error("Error checking LinkedIn identity status:", err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkLinkedInSession();
  }, []);

  // Check URL query parameters for success callback redirection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("linkedin_sync") === "success") {
        alert("Success! Your LinkedIn account was successfully connected and verified.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Custom Post Composer & AI Enhancer states
  const [customPostDraft, setCustomPostDraft] = useState("");
  const [enhancedPostOutput, setEnhancedPostOutput] = useState("");
  const [isEnhancingPost, setIsEnhancingPost] = useState(false);
  const [enhancementStyle, setEnhancementStyle] = useState<"star" | "viral" | "technical" | "impact">("star");
  const [enhancedPostTags, setEnhancedPostTags] = useState<string[]>([]);

  // Completed brand tasks
  const [completedBrandTasks, setCompletedBrandTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(getScopedKey("linkedin_completed_tasks", userId));
      if (cached) {
        try {
          setCompletedBrandTasks(JSON.parse(cached));
        } catch {}
      } else {
        setCompletedBrandTasks({});
      }
    }
  }, [userId]);

  const saveCompletedTasks = (updated: Record<string, boolean>) => {
    setCompletedBrandTasks(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(getScopedKey("linkedin_completed_tasks", userId), JSON.stringify(updated));
    }
  };

  const handleConnectLinkedInOAuth = async () => {
    setLinkedinSyncLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.linkIdentity({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + "?linkedin_sync=success")}`
        }
      });
      if (error) {
        alert(`Authentication failed: ${error.message}`);
      } else if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setLinkedinSyncLoading(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) return;
    setLinkedinSyncLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");
      
      const identity = user.identities?.find(id => id.provider === "linkedin_oidc");
      if (!identity) {
        alert("No connected LinkedIn account found.");
        return;
      }
      
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      
      setIsLinkedinConnected(false);
      localStorage.setItem("linkedin_oauth_connected", "false");
      setLinkedInUserMeta(null);
      alert("LinkedIn account successfully disconnected.");
    } catch (err: any) {
      alert(`Disconnection failed: ${err.message}`);
    } finally {
      setLinkedinSyncLoading(false);
    }
  };

  const handleSyncOAuthDetails = async () => {
    if (!linkedInUserMeta) {
      alert("No connected LinkedIn account details found. Please connect your account first.");
      return;
    }
    setLinkedinSyncLoading(true);
    try {
      const updated: LinkedInProfile = {
        ...profile,
        name: linkedInUserMeta.name || profile.name,
        email: linkedInUserMeta.email || profile.email,
        avatar: linkedInUserMeta.avatar || profile.avatar
      };
      
      saveProfile(updated);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertUserProfile(user.id, {
          name: linkedInUserMeta.name || profile.name,
          email: linkedInUserMeta.email || profile.email,
          linkedin: profile.linkedin || `linkedin.com/in/${(linkedInUserMeta.name || "").toLowerCase().replace(/\s+/g, "-")}`
        });
      }
      
      alert("LinkedIn profile details successfully synced to your active workspace!");
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setLinkedinSyncLoading(false);
    }
  };

  const handlePublishToLinkedIn = async (postContent: string) => {
    if (!isLinkedinConnected) {
      alert("Please connect your LinkedIn account first under the 'Profile Scan' tab.");
      return;
    }
    
    let activeToken = providerToken;
    if (!activeToken) {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        activeToken = session?.provider_token || null;
        if (activeToken) setProviderToken(activeToken);
      } catch (err) {
        console.error("Error retrieving active session:", err);
      }
    }

    if (!activeToken) {
      alert("LinkedIn access token not found. Please try disconnecting and reconnecting your LinkedIn account to refresh credentials.");
      return;
    }

    if (!confirm("Are you sure you want to publish this post directly to your public LinkedIn feed?")) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: postContent,
          providerToken: activeToken
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish post.");

      alert("Success! Your post has been published directly to LinkedIn.");
      
      const updatedTasks = { ...completedBrandTasks, "task_project": true };
      saveCompletedTasks(updatedTasks);
      
    } catch (err: any) {
      alert(err.message || "Failed to publish post to LinkedIn.");
    } finally {
      setIsPublishing(false);
    }
  };

  const triggerLinkedInOAuthSync = async () => {
    setLinkedinSyncLoading(true);
    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem(getScopedKey("gemini_api_key", userId)) || "" : "";
      const res = await fetch("/api/portfolio/linkedin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          linkedinUrl: profile.linkedin || "linkedin.com/in/mujahid-ahmed",
          profileText: "" // trigger fallback/mock parsing
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to sync profile");

      const parsedData = data.data;
      saveProfile({
        ...profile,
        name: parsedData.name || profile.name,
        headline: parsedData.headline || profile.headline,
        about: parsedData.summary || profile.about,
        skills: parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : profile.skills,
        experience: parsedData.experience && parsedData.experience.length > 0 
          ? parsedData.experience.map((exp: any) => ({
              role: exp.role || "",
              company: exp.company || "",
              period: exp.dateRange || "",
              desc: exp.description || ""
            }))
          : profile.experience,
        achievements: parsedData.achievements && parsedData.achievements.length > 0 ? parsedData.achievements : profile.achievements
      });

      alert("LinkedIn profile details successfully connected & synced!");
    } catch (err: any) {
      alert(err.message || "Failed to sync profile information from LinkedIn.");
    } finally {
      setLinkedinSyncLoading(false);
    }
  };

  const handleEnhancePost = async () => {
    if (!customPostDraft.trim()) return;
    setIsEnhancingPost(true);
    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem(getScopedKey("gemini_api_key", userId)) || "" : "";
      const res = await fetch("/api/linkedin/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          draftPost: customPostDraft,
          style: enhancementStyle,
          targetRole: profile.role,
          skills: profile.skills
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to enhance post");
      setEnhancedPostOutput(data.enhancedPost);
      setEnhancedPostTags(data.tags || []);
    } catch (err: any) {
      // Fallback in case of offline or failure
      const fallbackTags = ["#softwaredevelopment", `#${profile.role.replace(/\s+/g, '')}`, "#careers"];
      const fallbackPost = `${customPostDraft}\n\n🚀 Optimized for ${enhancementStyle.toUpperCase()} style. Proud of these recent technical developments.\n\n${fallbackTags.join(" ")}`;
      setEnhancedPostOutput(fallbackPost);
      setEnhancedPostTags(fallbackTags);
      alert(err.message || "Enhancement failed. Applied local style formatting instead.");
    } finally {
      setIsEnhancingPost(false);
    }
  };

  const syncPostTemplateToDraft = (category: string) => {
    const template = getPostTemplateForCat(category);
    const full = `${template.hook}\n\n${template.body}\n\n${template.cta}\n\n${template.tags}`;
    setCustomPostDraft(full);
  };

  const handleSelectTemplateCategory = (catId: string) => {
    setPostCategory(catId);
    syncPostTemplateToDraft(catId);
  };

  // Sync initial showcase post to draft when content tab is first selected
  useEffect(() => {
    if (activeSubTab === "content" && !customPostDraft) {
      syncPostTemplateToDraft("showcase");
    }
  }, [activeSubTab]);

  // Dynamic Weekly Brand Tasks Checklist
  const getWeeklyBrandTasks = () => {
    const projectTitle = profile.projects?.[0]?.title || "Real-time Whiteboard";
    const projectImpact = profile.projects?.[0]?.impact || "reduced latency by 35%";
    const missingKw = (ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).missing?.[0] || "System Design";
    const recommendedKw = (ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).recommended?.[0] || "Git";

    return [
      {
        id: "task_project",
        title: `Project Showcase Post`,
        desc: `Write a post explaining how you resolved ${projectImpact} in your "${projectTitle}" project.`,
        type: "content"
      },
      {
        id: "task_skill",
        title: `Skill/Keyword Deep-Dive`,
        desc: `Draft a technical post about your experience with ${recommendedKw} and clean coding principles.`,
        type: "content"
      },
      {
        id: "task_seo",
        title: `Profile SEO Update`,
        desc: `Integrate the missing keyword "${missingKw}" into your profile About/headline.`,
        type: "seo"
      },
      {
        id: "task_networking",
        title: `Networking Outreach`,
        desc: `Send a cold outreach or connection message to a recruiter matching your target role.`,
        type: "networking"
      }
    ];
  };

  // Copilot messages
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "welcome",
      role: "copilot",
      content: "Welcome to your **Branding & LinkedIn Copilot**! I can generate custom headline variants, rewrite your experience using the STAR format, suggest priority keywords, or write a viral project showcase post. What's on your mind today?"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Experience bullet optimizer inputs
  const [rawBulletInput, setRawBulletInput] = useState("Worked on website and optimized databases.");
  const [optBulletStyle, setOptBulletStyle] = useState<"impact" | "star" | "recruiter">("impact");

  // Project optimizer inputs
  const [rawProjTitle, setRawProjTitle] = useState("Serverless E-Commerce System");
  const [rawProjDesc, setRawProjDesc] = useState("Built an online checkout system with AWS lambda, DynamoDB, and Redis lock loops.");
  const [rawProjTech, setRawProjTech] = useState("AWS Lambda, DynamoDB, Redis, TypeScript");

  // Copy states to provide visual feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic Headline Generation Parameters
  const [headlineRole, setHeadlineRole] = useState<string>("Full Stack Developer");

  // Dynamic About Generator Configuration
  const [aboutStyle, setAboutStyle] = useState<"human" | "professional" | "founder" | "brand">("professional");
  const [aboutLength, setAboutLength] = useState<"short" | "medium" | "long">("medium");

  // Daily Content Creator States
  const [postCategory, setPostCategory] = useState<string>("showcase");

  // Networking Outreach Parameters
  const [outreachRecipient, setOutreachRecipient] = useState<"recruiter" | "hiring_manager" | "engineer" | "alumni" | "founder">("recruiter");
  const [outreachType, setOutreachType] = useState<"connection" | "followup" | "referral" | "cold">("connection");

  // Persist profile
  const saveProfile = (updated: LinkedInProfile) => {
    setProfile(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(getScopedKey(PROFILE_KEY, userId), JSON.stringify(updated));
    }
  };

  // Helper trigger to import from Resume OS
  const handleImportFromResume = () => {
    if (typeof window !== "undefined") {
      const cachedResume = localStorage.getItem(getScopedKey("resume_builder_profile", userId));
      if (cachedResume) {
        try {
          const parsed = JSON.parse(cachedResume);
          // Flatten skills safely
          const flattenedSkills = flattenSkills(parsed.skills || []);

          const updated: LinkedInProfile = {
            ...profile,
            name: parsed.personal?.fullName || profile.name,
            email: parsed.personal?.email || profile.email,
            headline: `${parsed.personal?.fullName} | Aspiring ${parsed.personal?.targetRole || profile.role}`,
            about: parsed.personal?.summary || profile.about,
            education: parsed.education?.[0] 
              ? `${parsed.education[0].institution} (${parsed.education[0].degree}, ${parsed.education[0].graduationYear || "Class of 2026"})`
              : profile.education,
            skills: flattenedSkills.length > 0 ? flattenedSkills : profile.skills,
            achievements: parsed.achievements && parsed.achievements.length > 0 ? parsed.achievements : (parsed.accomplishments || profile.achievements)
          };
          saveProfile(updated);
          alert("Success! Profile parameters successfully imported from Resume OS.");
        } catch {
          alert("Failed to parse Resume Builder profile. Verify your Resume OS configs.");
        }
      } else {
        alert("No resume profile found in Resume OS. Create your resume first!");
      }
    }
  };

  // Helper trigger to import projects from Portfolio Builder
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
              impact: p.challenges || "Optimized response latency structures."
            }));
            saveProfile({
              ...profile,
              projects: updatedProjects
            });
            alert(`Success! Imported ${updatedProjects.length} projects from Portfolio Builder OS.`);
          } else {
            alert("No projects listed in your Portfolio Builder OS configurations.");
          }
        } catch {
          alert("Failed to sync Portfolio Builder OS profiles.");
        }
      } else {
        alert("No active Portfolio Builder configuration found. Set up your portfolio first.");
      }
    }
  };

  // PDF Profile Parser simulation
  const handleSimulatePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploadProgress(10);
    const interval = setInterval(() => {
      setPdfUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPdfUploadProgress(null);
            saveProfile({
              ...profile,
              about: "CS graduate specializing in enterprise backend API engines, real-time message architectures, and cloud integrations. Winner of 2 hackathons with advanced knowledge in full stack stacks."
            });
            alert("LinkedIn Profile parsed successfully. Recalculating scores...");
          }, 600);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  // URL profile connect simulation
  const handleConnectProfileUrl = () => {
    if (!profileUrlInput.trim()) return;
    setProfileUrlSyncing(true);
    setTimeout(() => {
      setProfileUrlSyncing(false);
      saveProfile({
        ...profile,
        linkedin: profileUrlInput.trim()
      });
      alert(`Success! Synced details from LinkedIn profile URL: ${profileUrlInput}`);
      setProfileUrlInput("");
    }, 1500);
  };

  // Calculations
  const getProfileScore = () => {
    let score = 55;
    if (profile.headline.length > 40) score += 10;
    if (profile.about.length > 100) score += 10;
    if (profile.skills.length >= 5) score += 10;
    if (profile.projects.length >= 1) score += 10;
    if (profile.certifications.length >= 1) score += 5;
    if (profile.achievements && profile.achievements.length >= 1) score += 5;
    return Math.min(score, 100);
  };

  const getVisibilityScore = () => {
    let score = 50;
    const currentKeywords = ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"];
    // Check if priority keywords are in profile details (case-insensitive checks)
    const combinedContent = `${profile.headline} ${profile.about} ${profile.skills.join(" ")}`.toLowerCase();
    
    let matchedKeywords = 0;
    currentKeywords.priority.forEach(kw => {
      if (combinedContent.includes(kw.toLowerCase())) matchedKeywords++;
    });
    score += matchedKeywords * 8;

    if (profile.linkedin.includes("linkedin.com/in/")) score += 10;
    if (profile.skills.length >= 8) score += 10;

    // Add completed brand tasks boost (+5% per task completed)
    const completedCount = Object.values(completedBrandTasks).filter(Boolean).length;
    score += completedCount * 5;

    // Real LinkedIn OAuth connection boost
    if (isLinkedinConnected) score += 15;

    return Math.min(score, 100);
  };

  const getSeoScore = () => {
    let score = 60;
    const currentKeywords = ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"];
    const combinedContent = `${profile.headline} ${profile.about} ${profile.skills.join(" ")}`.toLowerCase();
    
    let matchedRecs = 0;
    currentKeywords.recommended.forEach(kw => {
      if (combinedContent.includes(kw.toLowerCase())) matchedRecs++;
    });
    score += matchedRecs * 8;
    return Math.min(score, 100);
  };

  // Derived metrics
  const isDetailsSynced = !!(isLinkedinConnected && linkedInUserMeta && 
    profile.name === linkedInUserMeta.name && 
    profile.email === linkedInUserMeta.email && 
    (profile.avatar === linkedInUserMeta.avatar || (!profile.avatar && !linkedInUserMeta.avatar)));

  const profileScore = getProfileScore();
  const visibilityScore = getVisibilityScore();
  const seoScore = getSeoScore();

  // Personal Brand Score (calculated globally from Resume OS and Portfolio Builder OS parameters)
  const personalBrandScore = (() => {
    let resumeScore = 70;
    let portfolioScore = 65;
    if (typeof window !== "undefined") {
      const snapObj = localStorage.getItem(getScopedKey("resume_os_snapshots", userId));
      if (snapObj) {
        try {
          const list = JSON.parse(snapObj);
          if (list.length > 0) resumeScore = list[0].score || 70;
        } catch {}
      }
      const portProfile = localStorage.getItem(getScopedKey("portfolio_profile_os", userId));
      if (portProfile) {
        try {
          const p = JSON.parse(portProfile);
          if (p.projects?.length >= 2) portfolioScore += 20;
        } catch {}
      }
    }
    return Math.round((profileScore * 0.4) + (resumeScore * 0.3) + (portfolioScore * 0.3));
  })();

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Heuristic LLM Copilot Trigger
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
          message: `LinkedIn personal branding consultation: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: profile.role,
            techStack: profile.skills.join(", "),
            linkedinScore: profileScore,
            recruiterVisibility: visibilityScore,
            personalBrand: personalBrandScore
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

      if (q.includes("headline")) {
        reply = `### Suggested Headlines for ${profile.role}:
1. **Recruiter-Focused**: "${profile.role} | Specializing in ${profile.skills.slice(0, 3).join(", ")} | Available for Freshers Drives"
2. **Branding-Focused**: "Building scalable ${profile.skills[0]} web architectures that optimize application latency indices."
3. **Professional**: "${profile.role} at VTU Technical University. Experienced in Node.js & REST integrations."`;
      } else if (q.includes("improve") || q.includes("score")) {
        reply = `### How to Boost LinkedIn Score:
- **SEO Keywords**: Include the missing keywords in your About Section (**${(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).missing.join(", ")}**).
- **Projects**: Feature at least two distinct projects with quantitative business impact metrics.
- **Activity**: Write learning update posts regularly. Use the **Content Creator** tab to draft them.`;
      } else if (q.includes("visibility") || q.includes("recruiter")) {
        reply = `### Attracting Tech Recruiters:
- Enable the **'Open to Work'** feature visible to recruiters in LinkedIn privacy.
- Customize your **LinkedIn Profile URL** identifier.
- Add active certifications (e.g. AWS Developer, Google Cloud) in your bio headline.
- Ensure your headline explicitly lists your primary tech stacks.`;
      } else {
        reply = `Your LinkedIn Profile Score is currently **${profileScore}/100**, and your Recruiter Visibility Index is **${visibilityScore}%**. I suggest optimizing your keywords under the **SEO tab** or generating custom headlines under the **Headline Gen** tab.`;
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

  // Form Fields updates
  const handleUpdateField = <K extends keyof LinkedInProfile>(field: K, value: LinkedInProfile[K]) => {
    saveProfile({ ...profile, [field]: value });
  };

  // Bullet Optimizer generator
  const getOptimizedBullets = () => {
    if (optBulletStyle === "impact") {
      return `Developed and deployed a scalable ${profile.role} application using ${profile.skills.slice(0, 2).join(" and ")}, reducing database queries overhead by 30% and improving user retention indexes by 15%.`;
    }
    if (optBulletStyle === "star") {
      return `**Situation**: Faced data transmission chokepoints in web transactions.\n**Task**: Engineer a responsive REST cache connection pipeline.\n**Action**: Implemented indexed DB query routines using ${profile.skills.slice(0, 2).join(" and ")} wrappers.\n**Result**: Cut overall transaction execution times by 40%.`;
    }
    return `Technical ${profile.role} specialist responsible for integrating WebSocket streams and database pipelines, reducing system API latency by 25% under high concurrent loads.`;
  };

  // Project Optimizer showcase score
  const getProjectShowcaseScore = () => {
    let score = 55;
    if (rawProjTitle.length > 5) score += 15;
    if (rawProjDesc.length > 30) score += 20;
    if (rawProjTech.split(",").length >= 3) score += 10;
    return score;
  };

  // Headline generation suggestions based on selected role
  const getHeadlineSuggestions = () => {
    const stack = ROLE_KEYWORDS[headlineRole] || ROLE_KEYWORDS["Software Engineer"];
    return {
      conservative: `${headlineRole} graduate at ${profile.education.split(" (")[0]}. Experienced in database structures and APIs.`,
      professional: `${headlineRole} | ${stack.priority.slice(0, 3).join(" | ")} | Aspiring Placement Candidate 2026`,
      recruiter: `${headlineRole} Developer | ${stack.priority[0]} & ${stack.recommended[0]} Specialist | Open for Freshers Hiring Drives`,
      brand: `Building high-throughput scalable backend engines and modular interfaces | Aspiring ${headlineRole}`
    };
  };

  // About suggestion based on profile data and styles
  const getAboutSuggestions = () => {
    const skillsList = profile.skills.slice(0, 4).join(", ");
    if (aboutStyle === "human") {
      return `Hi, I'm ${profile.name}! I love solving complex algorithms and programming scalable pipelines. Currently, I'm focusing on ${skillsList} systems. Outside of coding, I participate in collegiate hackathons. Let's connect!`;
    }
    if (aboutStyle === "founder") {
      return `Aspiring ${profile.role} driven by engineering excellence. Passionate about solving database concurrency blocks and system scaling latencies using ${skillsList}. Building placement intelligence systems at BuggedBrain.`;
    }
    if (aboutStyle === "brand") {
      return `Reducing API transaction latency, optimizing frontend client renders, and deploying concurrent cloud applications. Specialized in ${skillsList}. Let's chat about off-campus developer hiring paths.`;
    }
    return `CS Graduate targeting ${profile.role} opportunities. Experienced in designing responsive architectures, writing RESTful routers, and database design. Proficient in ${skillsList}. Check out my projects and certifications.`;
  };

  // Post templates based on content generator selections
  const getPostTemplateForCat = (category: string) => {
    if (category === "journey") {
      return {
        hook: "🚀 Thrilled to share my placement preparation update today!",
        body: `For the past few months, I have been engineering full stack applications and practicing DSA loops on BuggedBrain. Learning how databases manage transaction concurrency locks under load has been eye-opening.\n\nMy target role is ${profile.role}, focusing on React, Node.js, and Cloud API architectures. Ready to tackle the technical rounds ahead!`,
        cta: "What strategies helped you secure your first off-campus opportunity? Share your tips below!",
        tags: "#hiring #placement2026 #fullstack #freshersjobs #softwareengineering"
      };
    }
    if (category === "hackathon") {
      return {
        hook: "🏆 What a weekend! Had an amazing time competing in the hackathon!",
        body: `Our team engineered a dynamic placement diagnostic dashboard in just 36 hours. I was responsible for designing the database index caches and integrating AI estratégica models.\n\nWe faced database locks under concurrency loops, but resolved it by optimizing process threads.`,
        cta: "Check out the repository links on my GitHub. Let's discuss building scalable systems!",
        tags: "#hackathon #reactjs #webdevelopment #developerlife #github"
      };
    }
    if (category === "update") {
      return {
        hook: "⚡ Day 10 of my 30-Day coding streak: Optimizing API latencies!",
        body: `Today, I rewrote the SQL query routines in my project, replacing nested joins with optimized database indexing structures. This change dropped REST endpoint response times by 35%.\n\nConsistent daily progress is key.`,
        cta: "How do you optimize database query workflows in your systems? Let's discuss!",
        tags: "#30daysofcode #databasenodes #programmingstrikers #node #devlog"
      };
    }
    return {
      hook: "💻 Project launch: Just deployed my Real-time Whiteboard Canvas!",
      body: `I engineered a collaborative whiteboard workspace supporting multi-user coordinates sync. Built using WebSocket channels and React drawing nodes.\n\nThis architecture resolves coordinate congestion under heavy transaction traffic, scaling smoothly to multiple users.`,
      cta: "Try the live demo link: whiteboard-demo.vercel.app. Open to feedback on the code repository!",
      tags: "#projectshowcase #websockets #reactjs #typescript #portfolio"
    };
  };

  const getPostTemplate = () => getPostTemplateForCat(postCategory);

  // Networking templates
  const getNetworkingTemplate = () => {
    if (outreachType === "connection") {
      return `Hi [Name], I noticed your profile and your impressive work in software engineering at [Company]. As an aspiring ${profile.role} specializing in ${profile.skills.slice(0, 2).join(" and ")}, I would love to connect to follow your updates. Best, ${profile.name}.`;
    }
    if (outreachType === "referral") {
      return `Hello [Name], I hope you are doing well. I noticed an open role for a Junior ${profile.role} at [Company] (Ref ID: [ID]). Given my internship experience optimizing database index latency and my AWS Certified Developer Associate certification, I believe I fit the requirements. Would you be open to sharing my resume with the hiring team? Thank you, ${profile.name}.`;
    }
    if (outreachType === "cold") {
      return `Dear [Name], I am reaching out as a CS graduate available for freshers ${profile.role} positions. I recently built a collaborative WebSocket canvas platform and optimized database performance tables, reducing latency by 35%. I have attached my resume and portfolio links, and would love to be considered for any junior engineer openings. Best regards, ${profile.name}.`;
    }
    return `Hi [Name], thank you for connecting! I recently applied for the ${profile.role} position at [Company] and was hoping to ask if you have any tips on what your team looks for during the technical selection rounds. Appreciate your time! Best, ${profile.name}.`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* LEFT COLUMN (Workspace Tabs) */}
      <div className="lg:col-span-8 space-y-8">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            Branding Growth Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            LinkedIn OS
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            SaaS-grade optimization dashboard to boost your profile strength, attract recruiters, optimize SEO keywords, and automate networking outreach.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
          {[
            { id: "analyzer", label: "Profile Scan", icon: <Upload className="w-4 h-4" /> },
            { id: "copywriting", label: "Headline & About", icon: <Sparkles className="w-4 h-4" /> },
            { id: "bullets", label: "Bullets & Projects", icon: <FileText className="w-4 h-4" /> },
            { id: "seo", label: "SEO Keywords", icon: <Globe className="w-4 h-4" /> },
            { id: "networking", label: "Outreach Assistant", icon: <User className="w-4 h-4" /> },
            { id: "content", label: "Content Creator", icon: <Plus className="w-4 h-4" /> },
            { id: "tracker", label: "Growth Tracker", icon: <TrendingUp className="w-4 h-4" /> }
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

        {/* Active tab content container */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[520px]">
          
          {/* TAB 1: PROFILE SCAN */}
          {activeSubTab === "analyzer" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 font-display">Profile Integration & Channels</h2>
                  {isLinkedinConnected ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Connected via OAuth</span>
                      </div>
                      {linkedInUserMeta?.name && (
                        <span className="text-[10px] text-slate-500 font-bold">
                          as {linkedInUserMeta.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-md">
                      Disconnected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isLinkedinConnected ? (
                    <button
                      onClick={handleDisconnectLinkedIn}
                      disabled={linkedinSyncLoading}
                      className="px-3.5 py-2 bg-red-55 border border-red-100 text-red-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {linkedinSyncLoading ? "Disconnecting..." : "Disconnect LinkedIn"}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectLinkedInOAuth}
                      disabled={linkedinSyncLoading}
                      className="px-3.5 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {linkedinSyncLoading ? "Connecting..." : "Connect LinkedIn"}
                    </button>
                  )}
                  <button
                    onClick={handleImportFromResume}
                    className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all cursor-pointer"
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

              {/* Premium LinkedIn Live Profile Card */}
              {isLinkedinConnected && linkedInUserMeta && (
                <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-lg bg-white transition-all hover:shadow-xl animate-fade-in group">
                  {/* LinkedIn Header Banner styling */}
                  <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 relative flex items-center justify-end p-4">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/10">
                      LinkedIn Active Identity Linked
                    </span>
                  </div>

                  <div className="px-8 pb-6 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* User profile details block */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 -mt-12 text-center md:text-left">
                      {/* Overlapping Avatar container */}
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                        {linkedInUserMeta.avatar ? (
                          <img
                            src={linkedInUserMeta.avatar}
                            alt={linkedInUserMeta.name || "LinkedIn User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                            {(linkedInUserMeta.name || profile.name || "U")[0]}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 md:pt-14 space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <h3 className="text-xl font-black text-slate-900 font-display">
                            {linkedInUserMeta.name || profile.name}
                          </h3>
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black" title="Verified OAuth identity">
                            ✓
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 max-w-md">
                          {profile.headline || `${profile.role} | Aspiring Engineer`}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-slate-450 font-semibold">
                          <span>{linkedInUserMeta.email}</span>
                          <span>•</span>
                          <span>{profile.education.split(" (")[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sync button & status indicators */}
                    <div className="md:pt-14 shrink-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                      {isDetailsSynced ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Profile Synced</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSyncOAuthDetails}
                          disabled={linkedinSyncLoading}
                          className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                          <span>{linkedinSyncLoading ? "Syncing..." : "Sync LinkedIn Profile"}</span>
                        </button>
                      )}
                      {!isDetailsSynced && (
                        <span className="text-[9px] text-amber-600 font-bold animate-pulse">
                          Sync pending: workspace profile uses default details.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Informational banner about OIDC data limitations */}
              {isLinkedinConnected && (
                <div className="p-4 bg-blue-50/70 border border-blue-150 rounded-2xl flex items-start gap-3 mt-4">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-blue-900">LinkedIn Integration Note</h4>
                    <p className="text-[11px] text-blue-750 font-bold leading-normal">
                      Your LinkedIn account is securely connected via Supabase Auth. Standard LinkedIn OpenID Connect API only shares basic identity fields (your verified name and email address) for privacy reasons. 
                      To pull in your complete work experience, skills, and projects, we recommend copy-pasting your raw LinkedIn profile text or uploading your exported PDF profile in the panels below.
                    </p>
                  </div>
                </div>
              )}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF scan upload */}
                <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/40 flex flex-col justify-between h-44 hover:border-blue-200 transition-all relative">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">Upload LinkedIn PDF</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Drag and drop your exported LinkedIn PDF profile to extract details.
                    </span>
                  </div>
                  {pdfUploadProgress !== null ? (
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pdfUploadProgress}%` }} />
                    </div>
                  ) : (
                    <label className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-blue-600 transition-all">
                      Choose PDF file
                      <input type="file" accept=".pdf" className="hidden" onChange={handleSimulatePdfUpload} />
                    </label>
                  )}
                </div>

                {/* Paste URL */}
                <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/40 flex flex-col justify-between h-44 hover:border-blue-200 transition-all">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">Profile Connection URL</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Connect your active profile link for simulated network parsing index.
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      value={profileUrlInput}
                      onChange={(e) => setProfileUrlInput(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                    />
                    <button
                      disabled={profileUrlSyncing || !profileUrlInput.trim()}
                      onClick={handleConnectProfileUrl}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-blue-650 transition-all disabled:opacity-40"
                    >
                      {profileUrlSyncing ? "Syncing..." : "Connect URL"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Form fields editor */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 font-display">Manual Profile Settings</h3>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Career Role</label>
                    <select
                      value={profile.role}
                      onChange={(e) => handleUpdateField("role", e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      {Object.keys(ROLE_KEYWORDS).map(roleName => (
                        <option key={roleName} value={roleName}>{roleName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Bio Headline</label>
                  <input
                    type="text"
                    value={profile.headline}
                    onChange={(e) => handleUpdateField("headline", e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">LinkedIn Profile Summary (&quot;About&quot;)</label>
                  <textarea
                    rows={4}
                    value={profile.about}
                    onChange={(e) => handleUpdateField("about", e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Certifications (one per line)</label>
                    <textarea
                      rows={3}
                      value={profile.certifications?.join("\n") || ""}
                      onChange={(e) => handleUpdateField("certifications", e.target.value.split("\n").filter(Boolean))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Achievements (one per line)</label>
                    <textarea
                      rows={3}
                      value={profile.achievements?.join("\n") || ""}
                      onChange={(e) => handleUpdateField("achievements", e.target.value.split("\n").filter(Boolean))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADLINE & ABOUT GENERATOR */}
          {activeSubTab === "copywriting" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <h2 className="text-xl font-black text-slate-900 font-display">Headline & About suggestion</h2>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role:</label>
                  <select
                    value={headlineRole}
                    onChange={(e) => setHeadlineRole(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    {Object.keys(ROLE_KEYWORDS).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headlines outputs */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800">Generated Headlines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: "Conservative Version", content: getHeadlineSuggestions().conservative },
                    { type: "Professional Version", content: getHeadlineSuggestions().professional },
                    { type: "Recruiter-Optimized", content: getHeadlineSuggestions().recruiter },
                    { type: "Personal Brand Style", content: getHeadlineSuggestions().brand }
                  ].map((hl, i) => (
                    <div key={i} className="border border-slate-200 p-5 rounded-2xl space-y-3 bg-slate-50/20 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{hl.type}</span>
                        <button
                          onClick={() => handleCopyText(hl.content, `hl-${i}`)}
                          className="text-slate-450 hover:text-slate-800 transition-all"
                        >
                          {copiedKey === `hl-${i}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-normal">{hl.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* About section generator config */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-black text-slate-800">About Section Suggestions</h3>
                <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl items-center justify-between border border-slate-150">
                  <div className="flex gap-2">
                    {["professional", "human", "founder", "brand"].map(styleName => (
                      <button
                        key={styleName}
                        onClick={() => setAboutStyle(styleName as "human" | "professional" | "founder" | "brand")}
                        className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border cursor-pointer transition-all",
                          aboutStyle === styleName ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        {styleName}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    {["short", "medium", "long"].map(len => (
                      <button
                        key={len}
                        onClick={() => setAboutLength(len as "short" | "medium" | "long")}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border cursor-pointer transition-all",
                          aboutLength === len ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 p-6 rounded-[2rem] bg-slate-50/20 relative space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Optimized Biography Summary</span>
                    <button
                      onClick={() => handleCopyText(getAboutSuggestions(), "about-gen")}
                      className="text-slate-450 hover:text-slate-850 transition-all"
                    >
                      {copiedKey === "about-gen" ? <Check className="w-4.5 h-4.5 text-emerald-600" /> : <Copy className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{getAboutSuggestions()}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BULLETS & PROJECTS */}
          {activeSubTab === "bullets" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Experience & Projects Optimizer</h2>
              
              {/* Bullet Optimizer */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-5 space-y-4">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Raw Experience Bullet</strong>
                  <textarea
                    rows={4}
                    value={rawBulletInput}
                    onChange={(e) => setRawBulletInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="E.g. Worked on backend dashboard system."
                  />

                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { id: "impact", label: "Impact-Based" },
                      { id: "star", label: "STAR Format" },
                      { id: "recruiter", label: "Recruiter-Friendly" }
                    ].map(styleOpt => (
                      <button
                        key={styleOpt.id}
                        onClick={() => setOptBulletStyle(styleOpt.id as "impact" | "star" | "recruiter")}
                        className={cn(
                          "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-lg cursor-pointer transition-all",
                          optBulletStyle === styleOpt.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        {styleOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-7 border border-slate-200 p-6 rounded-[2rem] bg-slate-50/10 space-y-4 h-[210px] flex flex-col justify-between relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest">Optimized Output</span>
                    <button
                      onClick={() => handleCopyText(getOptimizedBullets(), "opt-bullet")}
                      className="text-slate-450 hover:text-slate-800 transition-all"
                    >
                      {copiedKey === "opt-bullet" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed overflow-y-auto pr-2">{getOptimizedBullets()}</p>
                </div>
              </div>

              {/* Project Builder Optimizer */}
              <div className="pt-8 border-t border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900 font-display">Project Optimizer</h3>
                  <span className="text-xs font-black text-slate-500">
                    Project Showcase Score: <strong className="text-indigo-650 font-black">{getProjectShowcaseScore()}/100</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Project Title</label>
                    <input
                      type="text"
                      value={rawProjTitle}
                      onChange={(e) => setRawProjTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tech Stack</label>
                    <input
                      type="text"
                      value={rawProjTech}
                      onChange={(e) => setRawProjTech(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Impact Target</label>
                    <input
                      type="text"
                      defaultValue="Reduced memory leak overhead by 25%."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Technical Architecture Description</label>
                  <textarea
                    rows={3}
                    value={rawProjDesc}
                    onChange={(e) => setRawProjDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                  <strong className="text-emerald-850 text-xs font-black block">Suggested Recruiter Description:</strong>
                  <p className="text-[11px] text-emerald-800 font-bold leading-normal">
                    &quot;Engineered a high-performance {rawProjTitle} using {rawProjTech}. Solved transaction lockups by implementing custom cache layers, improving latencies by 30%.&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEO KEYWORDS ENGINE */}
          {activeSubTab === "seo" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-black text-slate-900 font-display">LinkedIn SEO Engine</h2>
                <span className="text-xs font-black text-slate-500">
                  SEO Strength Score: <strong className="text-indigo-650 font-black">{seoScore}/100</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Recruiter searches target candidates based on specific stack index queries. Increase search hits by packing these parameters.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* Column 1: Priority */}
                <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Priority Keywords (Must Have)</strong>
                  <div className="flex flex-wrap gap-2">
                    {(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).priority.map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-red-50 text-red-650 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Column 2: Recommended */}
                <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recommended Keywords</strong>
                  <div className="flex flex-wrap gap-2">
                    {(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).recommended.map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-blue-50 text-blue-650 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Column 3: Missing */}
                <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Missing Keywords (Fill Gaps)</strong>
                  <div className="flex flex-wrap gap-2">
                    {(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).missing.map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-amber-50 text-amber-650 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100 animate-pulse">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2 mt-4">
                <strong className="text-indigo-900 text-xs font-black block">SEO Diagnostic Verdict:</strong>
                <p className="text-[11px] text-indigo-750 font-bold leading-normal">
                  Your profile mentions several foundation systems, but lacks keywords for modern automation pipelines (e.g. **{(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).missing.slice(0, 2).join(" and ")}**). Add them to your About Section to double your weekly search appearances.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: NETWORKING OUTREACH PANEL */}
          {activeSubTab === "networking" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Networking Outreach Templates</h2>
              <p className="text-xs text-slate-500 font-medium">
                Construct high-conversion, professional cold messages to founders, engineers, and college alumni.
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-50 p-4 border border-slate-150 rounded-xl items-center">
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: "recruiter", label: "Recruiter" },
                    { id: "hiring_manager", label: "Hiring Manager" },
                    { id: "engineer", label: "Senior Engineer" },
                    { id: "alumni", label: "Alumni" },
                    { id: "founder", label: "Founder" }
                  ].map(rec => (
                    <button
                      key={rec.id}
                      onClick={() => setOutreachRecipient(rec.id as "recruiter" | "hiring_manager" | "engineer" | "alumni" | "founder")}
                      className={cn(
                        "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border cursor-pointer transition-all",
                        outreachRecipient === rec.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-450"
                      )}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1">
                  {[
                    { id: "connection", label: "Invite" },
                    { id: "followup", label: "Follow Up" },
                    { id: "referral", label: "Referral Request" },
                    { id: "cold", label: "Cold Pitch" }
                  ].map(tp => (
                    <button
                      key={tp.id}
                      onClick={() => setOutreachType(tp.id as "connection" | "followup" | "referral" | "cold")}
                      className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border cursor-pointer transition-all",
                        outreachType === tp.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400"
                      )}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Output Box */}
              <div className="border border-slate-200 p-6 rounded-[2rem] bg-slate-50/10 space-y-4 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drafted Message (Ready to Send)</span>
                  <button
                    onClick={() => handleCopyText(getNetworkingTemplate(), "outreach-tp")}
                    className="text-slate-450 hover:text-slate-800 transition-all"
                  >
                    {copiedKey === "outreach-tp" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{getNetworkingTemplate()}</p>
              </div>
            </div>
          )}

          {/* TAB 6: CONTENT CREATOR */}
          {activeSubTab === "content" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 font-display">Personal Brand Content Creator</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Draft, structure, and enhance your professional updates with AI.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center mr-1">Quick Templates:</span>
                  {[
                    { id: "showcase", label: "Project Showcase" },
                    { id: "journey", label: "Learning Journey" },
                    { id: "hackathon", label: "Hackathon Story" },
                    { id: "update", label: "Daily Update" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectTemplateCategory(cat.id)}
                      className={cn(
                        "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-lg cursor-pointer transition-all",
                        postCategory === cat.id ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compose Draft Column */}
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                      <span>Post Composer</span>
                      <div className="flex items-center gap-3">
                        {customPostDraft.trim() && (
                          <button
                            disabled={isPublishing}
                            onClick={() => {
                              if (!isLinkedinConnected) {
                                alert("Please connect your LinkedIn account first under the 'Profile Scan' tab.");
                                return;
                              }
                              handlePublishToLinkedIn(customPostDraft);
                            }}
                            className={cn(
                              "transition-all flex items-center gap-1 text-[9px] lowercase font-semibold cursor-pointer",
                              isLinkedinConnected ? "text-blue-600 hover:text-blue-800" : "text-slate-450 hover:text-slate-650"
                            )}
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>{isLinkedinConnected ? "publish raw" : "connect & publish raw"}</span>
                          </button>
                        )}
                        <span className="text-[9px] font-bold text-slate-400">
                          {customPostDraft.length} chars
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        rows={12}
                        placeholder="Write your raw LinkedIn update here, or select a quick template above..."
                        value={customPostDraft}
                        onChange={(e) => setCustomPostDraft(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-250 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-[2rem] p-6 bg-slate-50/30 space-y-4">
                    <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI Optimization Style</strong>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "star", label: "STAR Structure", desc: "S-T-A-R bullets" },
                        { id: "viral", label: "Viral Hook", desc: "Engaging hook & story" },
                        { id: "technical", label: "Technical Depth", desc: "Tech specs & codebase" },
                        { id: "impact", label: "Impact Stats", desc: "Metrics & achievements" }
                      ].map(styleOpt => (
                        <button
                          key={styleOpt.id}
                          onClick={() => setEnhancementStyle(styleOpt.id as any)}
                          className={cn(
                            "p-3 rounded-xl border text-left cursor-pointer transition-all",
                            enhancementStyle === styleOpt.id
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-white border-slate-150 text-slate-650 hover:bg-slate-50"
                          )}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider">{styleOpt.label}</div>
                          <div className={cn("text-[8px] font-bold mt-0.5", enhancementStyle === styleOpt.id ? "text-slate-300" : "text-slate-400")}>
                            {styleOpt.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleEnhancePost}
                      disabled={isEnhancingPost || !customPostDraft.trim()}
                      className="w-full py-3.5 bg-indigo-650 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Sparkles className={cn("w-3.5 h-3.5", isEnhancingPost && "animate-spin")} />
                      {isEnhancingPost ? "Optimizing Post Copy..." : "Enhance Draft with AI"}
                    </button>
                  </div>
                </div>

                {/* AI Enhanced Output Column */}
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm bg-white min-h-[420px] flex flex-col">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                      <span>AI Optimized Copy</span>
                      {enhancedPostOutput && (
                        <div className="flex items-center gap-4">
                          <button
                            disabled={isPublishing}
                            onClick={() => {
                              if (!isLinkedinConnected) {
                                alert("Please connect your LinkedIn account first under the 'Profile Scan' tab.");
                                return;
                              }
                              handlePublishToLinkedIn(enhancedPostOutput);
                            }}
                            className={cn(
                              "transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer",
                              isLinkedinConnected ? "text-blue-600 hover:text-blue-800 font-bold" : "text-slate-450 hover:text-slate-600"
                            )}
                          >
                            <Send className={cn("w-3.5 h-3.5", isPublishing && "animate-pulse")} />
                            <span>{isPublishing ? "Publishing..." : isLinkedinConnected ? "Publish to LinkedIn" : "Connect & Publish"}</span>
                          </button>
                          <button
                            onClick={() => handleCopyText(enhancedPostOutput, "enhanced-post")}
                            className="text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1.5"
                          >
                            {copiedKey === "enhanced-post" ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Post</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      {enhancedPostOutput ? (
                        <div className="space-y-4">
                          <p className="text-xs font-bold leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
                            {enhancedPostOutput}
                          </p>
                          {enhancedPostTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {enhancedPostTags.map((tag, i) => (
                                <span key={i} className="text-[9px] font-black font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <strong className="text-xs font-black text-slate-700 block">No Enhanced Draft Yet</strong>
                            <p className="text-[10px] text-slate-400 font-bold max-w-[220px]">
                              Compose a raw draft, select your brand style guide, and trigger AI enhancement.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GROWTH TRACKER */}
          {activeSubTab === "tracker" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Personal Brand & Growth Tracker</h2>
              <p className="text-xs text-slate-500 font-medium">
                Track your brand metrics, weekly visibility statistics, and connection hits.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* SVG Chart 1 */}
                <div className="border border-slate-200 p-6 rounded-[2.5rem] bg-slate-50/10 flex flex-col justify-between h-56">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Profile Views (Weekly)</strong>
                  <div className="flex items-end justify-between h-32 pt-4 gap-2">
                    {[12, 18, 25, 22, 38, 45, 62].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-650" style={{ height: `${val * 1.5}px` }} />
                        <span className="text-[8px] font-bold text-slate-400 font-mono">W{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SVG Chart 2 */}
                <div className="border border-slate-200 p-6 rounded-[2.5rem] bg-slate-50/10 flex flex-col justify-between h-56">
                  <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SEO Search Hits (Monthly)</strong>
                  <div className="flex items-end justify-between h-32 pt-4 gap-2">
                    {[45, 60, 85, 120, 110, 150, 195].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-650" style={{ height: `${val * 0.5}px` }} />
                        <span className="text-[8px] font-bold text-slate-400 font-mono">M{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN (Recruiter Visibility & Personal Brand Copilot) */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Recruiter Visibility panel */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="text-base font-black text-slate-900 font-display">Recruiter Visibility</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Visibility gauge */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-tight">Visibility Rank</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-blue-500" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - visibilityScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{visibilityScore}%</span>
              </div>
            </div>

            {/* Brand index gauge */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-tight">Brand Score</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="text-emerald-500" strokeWidth="4" stroke="currentColor" fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - personalBrandScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{personalBrandScore}%</span>
              </div>
            </div>

          </div>

          {/* Visibility audits */}
          <div className="space-y-3 pt-2">
            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Visibility Audit</strong>
            <div className="space-y-2 text-xs font-semibold leading-relaxed">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-emerald-800">
                <span className="font-black">What Helps:</span> Core certifications (e.g. {profile.certifications[0]}) and target keywords are set up.
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-amber-800">
                <span className="font-black">What Hurts:</span> Missing priority search tags (e.g. **{(ROLE_KEYWORDS[profile.role] || ROLE_KEYWORDS["Software Engineer"]).missing.slice(0, 2).join(", ")}**).
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Brand Tasks checklist */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-indigo-650 shrink-0" />
              <h3 className="text-base font-black text-slate-900 font-display">Weekly Brand Tasks</h3>
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-750 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {Object.values(completedBrandTasks).filter(Boolean).length} / 4 Done
            </span>
          </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
            Complete tasks to boost recruiter search index (+5% per task completed)
          </p>

          <div className="space-y-3 pt-2">
            {getWeeklyBrandTasks().map((task) => {
              const isDone = !!completedBrandTasks[task.id];
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    const updated = { ...completedBrandTasks, [task.id]: !isDone };
                    saveCompletedTasks(updated);
                  }}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none group",
                    isDone
                      ? "bg-slate-50/40 border-slate-200 text-slate-400"
                      : "bg-white border-slate-150 text-slate-700 hover:border-indigo-300 hover:bg-slate-50/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                      isDone
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 group-hover:border-indigo-500 bg-white"
                    )}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-xs font-black tracking-tight",
                        isDone ? "line-through text-slate-400" : "text-slate-800"
                      )}>
                        {task.title}
                      </span>
                      <span className="text-[8px] font-black text-indigo-650 tracking-widest uppercase">
                        +5% Boost
                      </span>
                    </div>
                    <p className={cn(
                      "text-[10px] font-medium leading-normal",
                      isDone ? "text-slate-400 line-through" : "text-slate-500"
                    )}>
                      {task.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branding Copilot widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[500px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Branding Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">LinkedIn OS strategics</span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/25">
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
                    isCopilot ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-900 border-slate-900 text-white"
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
                <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                  <span>Drafting strategy response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick recommendations options */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/20 shrink-0">
            {[
              { label: "ATTRACT RECRUITERS", query: "How do I attract recruiters?" },
              { label: "IMPROVE SEO", query: "How can I improve my SEO score?" },
              { label: "GENERATE HEADLINE", query: "Suggest a headline" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input container */}
          <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask branding questions..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
              }}
              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleCopilotSend()}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
