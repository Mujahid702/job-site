"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { upsertUserProfile } from "@/lib/db/profiles";
import { addResumeScan } from "@/lib/db/resume";
import { saveAnalyticsFromScan } from "@/lib/db/resume-analytics";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { enqueueTask, startWorker, fileToBase64 } from "@/lib/queue";
import {
  Sparkles,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  Link as LinkIcon,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building,
  Target,
  Award,
  Layers,
  CheckSquare,
  Search,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET_ROLE_OPTIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Product Analyst"
];

const SKILL_OPTIONS = [
  "Java",
  "Python",
  "C++",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Machine Learning",
  "Git",
  "TypeScript",
  "Data Structures",
  "System Design"
];

const COMPANY_OPTIONS = [
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Capgemini",
  "Cognizant",
  "IBM",
  "Deloitte",
  "Amazon",
  "Microsoft",
  "Google",
  "Adobe",
  "Oracle"
];

const LOCATION_OPTIONS = [
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Chennai",
  "Delhi NCR",
  "Remote"
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STEP 2 Form states: Basic Profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("1");
  const [cgpa, setCgpa] = useState("");

  // STEP 3 Form states: Target Roles
  const [dreamRoles, setDreamRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState("");

  // STEP 4 Form states: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  // STEP 5 Form states: Dream Companies
  const [dreamCompanies, setDreamCompanies] = useState<string[]>([]);

  // STEP 6 Form states: Resume Upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<{
    resume_url: string;
    resume_name: string;
    resume_uploaded_at: string;
    ats_score: number;
    role_fit_score: number;
    strengths: string[];
    weaknesses: string[];
    rawText?: string;
  } | null>(null);

  // STEP 7 Form states: LinkedIn OS
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isScrapingLinkedIn, setIsScrapingLinkedIn] = useState(false);
  const [linkedInData, setLinkedInData] = useState<{
    score: number;
    headlines: string[];
    tips: string[];
  } | null>(null);

  // STEP 8 Form states: Career Preferences
  const [targetCtc, setTargetCtc] = useState("5-8 LPA");
  const [preferredWorkMode, setPreferredWorkMode] = useState("Remote");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);

  // STEP 9 Form states: Blueprint
  const [blueprint, setBlueprint] = useState<{
    roadmapLevel: "Beginner" | "Intermediate" | "Advanced";
    skillsGap: { current: string[]; missing: string[]; priority: string[] };
    recommendedProjects: { title: string; difficulty: string; impact: string; value: string }[];
    companyPrep: string[];
  } | null>(null);

  // STEP 10 Form states: PRI Score
  const [priResult, setPriResult] = useState<{
    score: number;
    category: string;
  } | null>(null);

  // STEP 11 Form states: Action Plan Tasks
  const [actionPlanTasks, setActionPlanTasks] = useState<string[]>([
    "Improve ATS Score to 75+",
    "Build Project #1",
    "Complete LinkedIn Profile Optimization",
    "Apply to 3 Jobs",
    "Solve 2 DSA Problems"
  ]);

  // Check user context & restore draft
  useEffect(() => {
    async function checkUserAndDraft() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");

        // Check for referral code in localStorage and apply it
        const refCode = localStorage.getItem("referral_code");
        if (refCode) {
          fetch("/api/growth/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode: refCode })
          }).then(() => {
            localStorage.removeItem("referral_code");
          }).catch(err => console.error("Failed to process referral code:", err));
        }

        // Verify if onboarding is already completed
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          if (profile.onboarding_completed) {
            router.push("/dashboard");
            return;
          } else {
            // Restore draft step and fields
            setStep(profile.onboarding_step || 1);
            setFullName(profile.full_name || "");
            setCollegeName(profile.college || "");
            setDegree(profile.degree || "");
            setBranch(profile.branch || "");
            setGraduationYear(profile.graduation_year ? String(profile.graduation_year) : "");
            setCurrentSemester(profile.current_semester ? String(profile.current_semester) : "1");
            setCgpa(profile.cgpa || "");
            setSelectedSkills(profile.skills || []);
            setLinkedinUrl(profile.linkedin_url || "");
            setGithubUrl(profile.github_url || "");
            setPortfolioUrl(profile.portfolio_url || "");
            
            if (profile.raw_profile_data) {
              const raw = profile.raw_profile_data;
              if (raw.dreamRoles) setDreamRoles(raw.dreamRoles);
              if (raw.primaryRole) {
                setPrimaryRole(raw.primaryRole);
                setDreamRoles(prev => Array.from(new Set([raw.primaryRole, ...prev])));
              }
              if (raw.dreamCompanies) setDreamCompanies(raw.dreamCompanies);
              if (raw.preferredLocations) setPreferredLocations(raw.preferredLocations);
              if (raw.targetCtc) setTargetCtc(raw.targetCtc);
              if (raw.preferredWorkMode) setPreferredWorkMode(raw.preferredWorkMode);
              if (raw.resumeData) setResumeData(raw.resumeData);
              if (raw.linkedInData) setLinkedInData(raw.linkedInData);
              if (raw.blueprint) setBlueprint(raw.blueprint);
              if (raw.priResult) setPriResult(raw.priResult);
              if (raw.actionPlanTasks) setActionPlanTasks(raw.actionPlanTasks);
            }
          }
        }
      } else {
        // Guest user local storage check
        const stored = localStorage.getItem("onboarding_guest_state");
        if (stored) {
          try {
            const raw = JSON.parse(stored);
            setStep(raw.onboarding_step || 1);
            setFullName(raw.name || "");
            setCollegeName(raw.college || "");
            setDegree(raw.degree || "");
            setBranch(raw.branch || "");
            setGraduationYear(raw.graduation_year ? String(raw.graduation_year) : "");
            setCurrentSemester(raw.current_semester ? String(raw.current_semester) : "1");
            setCgpa(raw.cgpa || "");
            setSelectedSkills(raw.skills || []);
            setLinkedinUrl(raw.linkedin || "");
            setGithubUrl(raw.github || "");
            setPortfolioUrl(raw.portfolio || "");
            setDreamRoles(raw.dreamRoles || []);
            setPrimaryRole(raw.primaryRole || "");
            setDreamCompanies(raw.dreamCompanies || []);
            setPreferredLocations(raw.preferredLocations || []);
            setTargetCtc(raw.target_ctc || "5-8 LPA");
            setPreferredWorkMode(raw.preferredWorkMode || "Remote");
            if (raw.resumeData) setResumeData(raw.resumeData);
            if (raw.linkedInData) setLinkedInData(raw.linkedInData);
            if (raw.blueprint) setBlueprint(raw.blueprint);
            if (raw.priResult) setPriResult(raw.priResult);
            if (raw.actionPlanTasks) setActionPlanTasks(raw.actionPlanTasks);
          } catch {}
        }
      }
      setLoading(false);
    }
    checkUserAndDraft();
  }, [supabase, router]);

  // Task queue listener for ATS parsing
  useEffect(() => {
    if (!activeTaskId) return;

    const handleTaskUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedTask = customEvent.detail;
      if (updatedTask.id === activeTaskId) {
        if (updatedTask.status === "COMPLETED") {
          setIsParsingResume(false);
          const resData = updatedTask.result.data || updatedTask.result;
          
          const parsedResume = {
            resume_url: URL.createObjectURL(resumeFile!),
            resume_name: resumeFile!.name,
            resume_uploaded_at: new Date().toISOString(),
            ats_score: resData.atsScore || 72,
            role_fit_score: resData.roleMatch?.matchPercentage || 76,
            strengths: resData.roleMatch?.strongAreas || ["Good formatting structures", "Solid technical projects"],
            weaknesses: resData.roleMatch?.weakAreas || ["Needs quantification", "Missing Cloud deployment details"],
            rawText: updatedTask.result.rawText || ""
          };

          setResumeData(parsedResume);
          
          // Auto inject found skills
          if (resData.missingSkillsDetector?.detected) {
            const detected = resData.missingSkillsDetector.detected;
            if (Array.isArray(detected)) {
              const matching = detected.filter((s: string) => SKILL_OPTIONS.includes(s));
              setSelectedSkills(prev => Array.from(new Set([...prev, ...matching])));
            }
          }

          // Trigger analytics event
          if (user) {
            supabase.from("analytics_events").insert({
              event_type: "resume_uploaded",
              user_id: user.id,
              metadata: { atsScore: parsedResume.ats_score }
            }).then(({ error }) => {
              if (error) console.error("Error inserting analytics_event:", error);
            });
          }

          setActiveTaskId(null);
        } else if (updatedTask.status === "FAILED") {
          setIsParsingResume(false);
          setErrorMessage(updatedTask.error || "Evaluation failed. Proceeding with default values.");
          setActiveTaskId(null);
          
          // Fallback
          setResumeData({
            resume_url: "",
            resume_name: resumeFile?.name || "Resume",
            resume_uploaded_at: new Date().toISOString(),
            ats_score: 68,
            role_fit_score: 70,
            strengths: ["Standard structure", "Technical background"],
            weaknesses: ["Missing advanced SDE projects", "Formatting layout fixes needed"]
          });
        }
      }
    };

    window.addEventListener("bb_task_updated", handleTaskUpdate);
    return () => {
      window.removeEventListener("bb_task_updated", handleTaskUpdate);
    };
  }, [activeTaskId, resumeFile, supabase, user]);

  // Persists draft state on next/prev step transitions
  const saveStepState = async (nextStep: number) => {
    setErrorMessage(null);

    const profilePayload = {
      name: fullName,
      email: email,
      phone_number: phoneNumber,
      college: collegeName,
      degree: degree,
      branch: branch,
      graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
      current_semester: currentSemester ? parseInt(currentSemester, 10) : null,
      cgpa: cgpa || null,
      targetRole: primaryRole || "Software Engineer",
      skills: selectedSkills,
      linkedin: linkedinUrl,
      github: githubUrl,
      portfolio: portfolioUrl,
      resume_url: resumeData?.resume_url || null,
      resume_name: resumeData?.resume_name || null,
      resume_uploaded_at: resumeData?.resume_uploaded_at || null,
      onboarding_completed: false,
      onboarding_status: "in_progress",
      onboarding_step: nextStep,
      career_goal: primaryRole || "Software Engineer",
      experience_level: currentSemester && parseInt(currentSemester, 10) > 4 ? "Intermediate" : "Beginner",
      dream_companies: dreamCompanies,
      preferred_locations: preferredLocations,
      target_ctc: targetCtc,
      profile_completion: Math.round((nextStep / 11) * 100),
      // Embedded JSON caches
      dreamRoles,
      primaryRole,
      preferredWorkMode,
      resumeData,
      linkedInData,
      blueprint,
      priResult,
      actionPlanTasks
    };

    if (user) {
      await upsertUserProfile(user.id, profilePayload);
      
      // Log event to analytics logs
      await supabase.from("analytics_events").insert({
        event_type: "onboarding_step_completed",
        user_id: user.id,
        metadata: { step: nextStep - 1 }
      });
    } else {
      localStorage.setItem("onboarding_guest_state", JSON.stringify(profilePayload));
    }
    setStep(nextStep);
  };

  const handleNextStep = () => {
    // Step validation checks
    if (step === 2) {
      if (!fullName.trim() || !collegeName.trim() || !branch.trim() || !graduationYear.trim()) {
        setErrorMessage("Required fields (Name, College, Branch, Graduation Year) cannot be empty.");
        return;
      }
    }
    if (step === 3) {
      if (!primaryRole) {
        setErrorMessage("A primary target engineering role is required.");
        return;
      }
    }

    // Dynamic generations during transitions
    if (step === 8) {
      compilePlacementBlueprint();
    }
    if (step === 9) {
      compileInitialPRI();
    }
    if (step === 10) {
      // compile action plan based on blueprint gaps
      compileFirstActionPlan();
    }

    saveStepState(step + 1);
  };

  const handlePrevStep = () => {
    saveStepState(step - 1);
  };

  // Step 3 Role Handlers
  const handleToggleRole = (role: string) => {
    setDreamRoles(prev => {
      const active = prev.includes(role);
      const updated = active ? prev.filter(r => r !== role) : [...prev, role];
      if (updated.length === 1 && !primaryRole) {
        setPrimaryRole(updated[0]);
      }
      return updated;
    });
  };

  // Step 4 Skills Handlers
  const handleToggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim()) {
      const trimmed = customSkill.trim();
      setSelectedSkills(prev => Array.from(new Set([...prev, trimmed])));
      setCustomSkill("");
    }
  };

  // Step 5 Dream Companies Handlers
  const handleToggleCompany = (company: string) => {
    setDreamCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  // Step 6 Resume Parser
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setResumeFile(file);
      setIsParsingResume(true);
      setErrorMessage(null);

      try {
        const fileData = await fileToBase64(file);
        const payload = {
          fileData,
          fileName: file.name,
          fileType: file.type,
          targetRole: primaryRole || "Software Engineer",
          text: ""
        };

        const task = enqueueTask("ats", payload);
        setActiveTaskId(task.id);
        startWorker();
      } catch (err: any) {
        console.error("Resume file extraction exception:", err);
        setErrorMessage("Failed to serialize file. Proceeding offline.");
        setIsParsingResume(false);
      }
    }
  };

  // Step 7 LinkedIn evaluation
  const handleEvaluateLinkedIn = async () => {
    if (!linkedinUrl.trim()) return;
    setIsScrapingLinkedIn(true);
    setErrorMessage(null);

    // Simulate specialized NLP audit optimization tips
    setTimeout(() => {
      setIsScrapingLinkedIn(false);
      const optData = {
        score: Math.round(72 + Math.random() * 14),
        headlines: [
          `Incoming SDE @ ${dreamCompanies[0] || 'Enterprise'} | ${primaryRole} | Python | Next.js`,
          `${primaryRole} Candidate | React Developer | Tech Blogger`,
          `${primaryRole} @ Class of 2026 | Building Distributed Systems`
        ],
        tips: [
          "Quantify bullet points inside your experience summaries (e.g. 'Boosted conversion rates by 14%').",
          "Ensure your professional summary highlights your core languages (Java, React, Node.js).",
          "Change your custom link handle to match your resume display name."
        ]
      };
      setLinkedInData(optData);
    }, 2000);
  };

  // Step 8 Location Handlers
  const handleToggleLocation = (loc: string) => {
    setPreferredLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  // Step 9: Blueprint logic
  const compilePlacementBlueprint = () => {
    const sem = currentSemester ? parseInt(currentSemester, 10) : 1;
    let level: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
    if (sem >= 7 || selectedSkills.length >= 7) {
      level = "Advanced";
    } else if (sem >= 5 || selectedSkills.length >= 3) {
      level = "Intermediate";
    }

    // Skills Gaps based on Primary Target Role
    const commonTargetSkills: Record<string, string[]> = {
      "Software Engineer": ["Git", "Data Structures", "System Design", "Docker"],
      "Frontend Developer": ["JavaScript", "React", "TypeScript", "Git"],
      "Backend Developer": ["Java", "Python", "SQL", "Docker", "System Design"],
      "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "Git"]
    };

    const targetList = commonTargetSkills[primaryRole] || ["Git", "Data Structures", "SQL"];
    const missing = targetList.filter(s => !selectedSkills.includes(s));
    
    // tailor projects to target role
    let recommended: any[] = [];
    if (primaryRole.includes("Frontend")) {
      recommended = [
        { title: "E-Commerce Storefront SPA", difficulty: "Intermediate", impact: "High", value: "88%" },
        { title: "Real-time Crypto Chart dashboard", difficulty: "Advanced", impact: "High", value: "92%" }
      ];
    } else if (primaryRole.includes("Backend") || primaryRole.includes("Software")) {
      recommended = [
        { title: "Distributed WebSockets Chat Engine", difficulty: "Advanced", impact: "High", value: "94%" },
        { title: "Redis Transaction Caching API Gateway", difficulty: "Advanced", impact: "High", value: "96%" },
        { title: "JWT Multi-tier Auth Service Middleware", difficulty: "Intermediate", impact: "Medium", value: "85%" }
      ];
    } else {
      recommended = [
        { title: "Predictive Analytics pipeline Dashboard", difficulty: "Advanced", impact: "High", value: "92%" },
        { title: "Real-time Metrics Dashboard", difficulty: "Intermediate", impact: "Medium", value: "84%" }
      ];
    }

    const compiled = {
      roadmapLevel: level,
      skillsGap: {
        current: selectedSkills,
        missing: missing.length > 0 ? missing : ["TypeScript"],
        priority: missing.slice(0, 2)
      },
      recommendedProjects: recommended.slice(0, 5),
      companyPrep: dreamCompanies.slice(0, 3)
    };

    setBlueprint(compiled);

    // Trigger analytics event
    if (user) {
      supabase.from("analytics_events").insert({
        event_type: "roadmap_generated",
        user_id: user.id,
        metadata: { roadmapLevel: level }
      }).then(({ error }) => {
        if (error) console.error("Error inserting analytics_event:", error);
      });
    }
  };

  // Step 10: PRI Calculation
  const compileInitialPRI = () => {
    let resScore = resumeData?.ats_score || 65;
    let linkScore = linkedInData?.score || 60;
    
    let skillsPct = (selectedSkills.length / 10) * 20; // weight 20%
    let completionPct = 40; // baseline completion

    // Calculation formula
    const finalPri = Math.round((resScore * 0.25) + (linkScore * 0.15) + skillsPct + completionPct);
    const priScore = Math.min(Math.max(finalPri, 0), 100);

    let category = "Placement Beginner";
    if (priScore > 85) category = "Placement Elite";
    else if (priScore > 70) category = "Strong Candidate";
    else if (priScore > 50) category = "Interview Ready";
    else if (priScore > 30) category = "Emerging Candidate";

    setPriResult({ score: priScore, category });

    // Trigger analytics event
    if (user) {
      supabase.from("analytics_events").insert({
        event_type: "pri_generated",
        user_id: user.id,
        metadata: { score: priScore }
      }).then(({ error }) => {
        if (error) console.error("Error inserting analytics_event:", error);
      });
    }
  };

  // Step 11: Action Plan
  const compileFirstActionPlan = () => {
    const tasks = [];
    if (!resumeData || resumeData.ats_score < 75) {
      tasks.push("Improve ATS Score to 75+ using AI Resume Enhancer");
    }
    if (blueprint && blueprint.recommendedProjects.length > 0) {
      tasks.push(`Build Target Project: "${blueprint.recommendedProjects[0].title}"`);
    }
    if (!linkedInData) {
      tasks.push("Complete LinkedIn profile optimization and headline suggestions");
    } else {
      tasks.push("Inject compiled optimization suggestions into LinkedIn Experience");
    }
    if (dreamCompanies.length > 0) {
      tasks.push(`Solve 5 DSA problems targeted for ${dreamCompanies[0]} mock rounds`);
    }
    tasks.push("Apply to 3 software job postings from Dashboard recommendations");

    setActionPlanTasks(tasks.slice(0, 5));
  };

  // Complete final onboarding submission
  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const profilePayload = {
      name: fullName,
      email: email,
      phone_number: phoneNumber,
      college: collegeName,
      degree: degree,
      branch: branch,
      graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
      current_semester: currentSemester ? parseInt(currentSemester, 10) : null,
      cgpa: cgpa || null,
      targetRole: primaryRole || "Software Engineer",
      skills: selectedSkills,
      linkedin: linkedinUrl,
      github: githubUrl,
      portfolio: portfolioUrl,
      resume_url: resumeData?.resume_url || null,
      resume_name: resumeData?.resume_name || null,
      resume_uploaded_at: resumeData?.resume_uploaded_at || null,
      onboarding_completed: true,
      onboarding_status: "completed",
      onboarding_step: 11,
      career_goal: primaryRole || "Software Engineer",
      experience_level: currentSemester && parseInt(currentSemester, 10) > 4 ? "Intermediate" : "Beginner",
      dream_companies: dreamCompanies,
      preferred_locations: preferredLocations,
      target_ctc: targetCtc,
      profile_completion: 100,
      
      // Keep blueprint caches inside JSON config
      dreamRoles,
      primaryRole,
      preferredWorkMode,
      resumeData,
      linkedInData,
      blueprint,
      priResult,
      actionPlanTasks
    };

    try {
      if (user) {
        // 1. Submit Profile to Supabase
        const { success, error } = await upsertUserProfile(user.id, profilePayload);
        if (!success) throw new Error(error?.message || "Failed to commit profile updates.");

        // 1b. Trigger referral activation in background
        fetch("/api/growth/referrals/activate", { method: "POST" }).catch(e => console.error("Referral activation trigger skipped:", e));

        // 2. Submit Resume evaluations
        if (resumeData) {
          const scanObj = {
            resume_name: resumeData.resume_name,
            ats_score: resumeData.ats_score,
            role_fit_score: resumeData.role_fit_score,
            analysis: {
              healthScore: resumeData.ats_score,
              roleTargeted: primaryRole,
              rawText: resumeData.rawText || "Imported during Onboarding",
              completeness: 85,
              keywordCoverage: 75,
              skillsRelevance: 78,
              projectStrength: 80,
              roleMatch: resumeData.role_fit_score,
              readability: 82,
              strengths: resumeData.strengths,
              weaknesses: resumeData.weaknesses
            }
          };
          await addResumeScan(user.id, scanObj);
          await saveAnalyticsFromScan(user.id, scanObj);
        }

        // 3. Compile final Placement Readiness Score in DB
        await calculatePRIScore(user.id, {
          resume_score: resumeData ? Math.round((resumeData.ats_score / 100) * 20) : 10,
          linkedin_score: linkedInData ? Math.round((linkedInData.score / 100) * 10) : 5,
          skills_score: Math.min(selectedSkills.length * 1.5, 20),
          application_score: 5,
          portfolio_score: githubUrl || portfolioUrl ? 8 : 4
        });

        // 4. Log completion event to analytics
        await supabase.from("analytics_events").insert({
          event_type: "onboarding_completed",
          user_id: user.id,
          metadata: { finalPriScore: priResult?.score || 60 }
        });
      } else {
        // Save local state for guest
        localStorage.setItem("onboarding_guest_state", JSON.stringify(profilePayload));
        localStorage.setItem("placement_readiness_score", (priResult?.score || 60).toString());
        localStorage.setItem("ats_score", (resumeData?.ats_score || 70).toString());
        if (resumeData) {
          localStorage.setItem("last_analyzed_resume_text", resumeData.rawText || "");
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Complete onboarding submission failed: ", err);
      setErrorMessage(err.message || "Failed to commit system config setup.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-extrabold text-xs uppercase tracking-widest">Constructing Career Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 px-4 md:px-8 font-sans flex items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600 rounded-full blur-[140px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600 rounded-full blur-[140px] opacity-10"></div>

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col min-h-[600px]">
        
        {/* Stepper Header */}
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-150 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Placement OS Setup Wizard</span>
          </div>
          <span className="text-xs font-black text-slate-400">STEP {step} OF 11</span>
        </div>
        
        <div className="h-1.5 w-full bg-slate-100 relative shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 11) * 100}%` }}
          />
        </div>

        {/* Wizard Form Area */}
        <div className="p-8 md:p-12 flex-grow overflow-y-auto max-h-[520px]">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME SCREEN */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6 text-center py-6"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    Welcome to BuggedBrain Placement OS
                  </h1>
                  <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto">
                    We will configure your personalized placement roadmap, calculate initial PRI, and generate action tasks in under 3 minutes.
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left space-y-3">
                  <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest border-b pb-1.5">Setup includes:</p>
                  {[
                    "ATS Resume Compatibility Index check",
                    "Custom Engineering roadmap track assignment",
                    "Placement Readiness Index (PRI) baseline score",
                    "Dynamic SDE / Frontend Project recommendations",
                    "MNCS tailored Company Preparation schedules"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: BASIC PROFILE */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Basic Profile Collection</h2>
                  <p className="text-slate-500 text-sm">Provide your primary college information to customize telemetry.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="E.g. Arnav Gupta"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">College / University</label>
                      <input
                        type="text"
                        required
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="E.g. RVCE Bangalore"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Degree Title</label>
                      <input
                        type="text"
                        placeholder="E.g. B.E. / B.Tech"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Branch / Major</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. CSE / ECE"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Graduation Year</label>
                      <input
                        type="number"
                        required
                        placeholder="E.g. 2026"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Semester</label>
                      <select
                        value={currentSemester}
                        onChange={(e) => setCurrentSemester(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>{sem} Semester</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CGPA (Optional)</label>
                      <input
                        type="text"
                        placeholder="E.g. 8.9"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-xl text-xs font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: TARGET ROLE */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Target Career Selection</h2>
                  <p className="text-slate-500 text-sm">Select the engineering profiles you want to target (multi-select allowed).</p>
                </div>

                <div className="space-y-6">
                  {/* Grid Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                    {TARGET_ROLE_OPTIONS.map(role => {
                      const active = dreamRoles.includes(role);
                      return (
                        <button
                          type="button"
                          key={role}
                          onClick={() => handleToggleRole(role)}
                          className={cn(
                            "p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer text-center",
                            active 
                              ? "bg-indigo-650 border-indigo-650 text-white shadow-md"
                              : "bg-slate-50 border-slate-250 text-slate-600 hover:border-slate-350"
                          )}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  {/* Primary Selection Required */}
                  {dreamRoles.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Primary Role (Required)</label>
                      <select
                        value={primaryRole}
                        onChange={(e) => setPrimaryRole(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      >
                        <option value="">-- Choose Primary Target --</option>
                        {dreamRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: SKILL INVENTORY */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Technical Skill Inventory</h2>
                  <p className="text-slate-500 text-sm">Select your current capabilities or append custom parameters.</p>
                </div>

                <div className="space-y-4">
                  {/* Search bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search standard tech stack skills..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                    
                    {/* Add custom skills */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Custom skill..."
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-[120px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSkill}
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Skills tags list */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {SKILL_OPTIONS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase())).map(skill => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          type="button"
                          key={skill}
                          onClick={() => handleToggleSkill(skill)}
                          className={cn(
                            "p-2.5 rounded-xl border text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer text-center truncate",
                            active 
                              ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                              : "bg-slate-50 border-slate-250 text-slate-650"
                          )}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Display Selected Custom tags */}
                  {selectedSkills.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Inventory Selected:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wide flex items-center gap-1">
                            {skill}
                            <button type="button" onClick={() => handleToggleSkill(skill)} className="text-indigo-400 hover:text-indigo-950 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 5: DREAM COMPANIES */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <Building className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Dream Companies Selection</h2>
                  <p className="text-slate-500 text-sm">Select which hiring partners you are actively targeting.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {COMPANY_OPTIONS.map(comp => {
                    const active = dreamCompanies.includes(comp);
                    return (
                      <button
                        type="button"
                        key={comp}
                        onClick={() => handleToggleCompany(comp)}
                        className={cn(
                          "p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer text-center",
                          active 
                            ? "bg-amber-550 border-amber-550 text-white shadow-sm"
                            : "bg-slate-50 border-slate-250 text-slate-650"
                        )}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: RESUME UPLOAD */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">ATS Resume Compatibility check</h2>
                  <p className="text-slate-500 text-sm">Verify your resume layouts. AI will automatically evaluate formatting compatibility.</p>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 p-8 rounded-3xl text-center space-y-4 cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/10"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.docx"
                      onChange={handleResumeChange}
                      className="hidden"
                    />
                    
                    {isParsingResume ? (
                      <div className="space-y-2 py-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto animate-pulse" />
                        <p className="text-xs font-black text-slate-700">Deep Parsing Text Matrix...</p>
                        <p className="text-[10px] text-slate-450 font-bold">Scanning experiences list, matching project entities...</p>
                      </div>
                    ) : resumeData ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <strong className="text-xs font-black text-slate-800 block leading-tight">{resumeData.resume_name}</strong>
                          <span className="text-[10px] font-semibold text-slate-400">ATS score verified: <strong className="text-indigo-650">{resumeData.ats_score}%</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-black text-slate-650">Select PDF or DOCX file</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Parser executes structural layout diagnostics (max 5MB).</p>
                      </div>
                    )}
                  </div>

                  {/* Render parser results if complete */}
                  {resumeData && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block mb-1">✓ Core Strengths</span>
                        <div className="space-y-1">
                          {resumeData.strengths.slice(0, 2).map((s, idx) => (
                            <p key={idx} className="text-[10px] font-bold text-slate-600 truncate">{s}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block mb-1">✗ Weaknesses Found</span>
                        <div className="space-y-1">
                          {resumeData.weaknesses.slice(0, 2).map((w, idx) => (
                            <p key={idx} className="text-[10px] font-bold text-slate-600 truncate">{w}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 7: LINKEDIN OS */}
            {step === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">LinkedIn Optimization (Optional)</h2>
                  <p className="text-slate-500 text-sm">Provide your profiles link to run active layout suggestions. You may skip this step.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleEvaluateLinkedIn}
                      disabled={isScrapingLinkedIn || !linkedinUrl.trim()}
                      className="px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {isScrapingLinkedIn ? "Analyzing..." : "Evaluate"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">GitHub URL</label>
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="github.com/username"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Portfolio Site</label>
                      <input
                        type="text"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="myportfolio.dev"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">LinkedIn Score</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-sm text-slate-700">
                        {linkedInData ? `${linkedInData.score}/100` : "-- / 100"}
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn Results */}
                  {linkedInData && (
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Recommended Profile Headlines:</span>
                      <div className="space-y-1">
                        {linkedInData.headlines.slice(0, 2).map((h, idx) => (
                          <p key={idx} className="text-xs font-bold text-slate-700 italic">“{h}”</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 8: CAREER GOALS */}
            {step === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Career Preferences Configuration</h2>
                  <p className="text-slate-500 text-sm">Specify package targets and work mode settings.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Target Package</label>
                      <select
                        value={targetCtc}
                        onChange={(e) => setTargetCtc(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        {["3-5 LPA", "5-8 LPA", "8-12 LPA", "12+ LPA"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Preferred Work Mode</label>
                      <select
                        value={preferredWorkMode}
                        onChange={(e) => setPreferredWorkMode(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        {["Remote", "Hybrid", "Onsite"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location Selector */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Preferred Locations</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATION_OPTIONS.map(loc => {
                        const active = preferredLocations.includes(loc);
                        return (
                          <button
                            type="button"
                            key={loc}
                            onClick={() => handleToggleLocation(loc)}
                            className={cn(
                              "px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              active 
                                ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                                : "bg-slate-50 border-slate-250 text-slate-655"
                            )}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 9: PERSONALIZED BLUEPRINT */}
            {step === 9 && blueprint && (
              <motion.div
                key="step-9"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Personalized Placement Blueprint</h2>
                  <p className="text-slate-500 text-sm">Review the custom roadmap and milestones generated for your profile.</p>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {/* Roadmap Level details */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex justify-between items-center">
                    <div>
                      <strong className="text-sm font-black text-slate-800 block">Roadmap Level Track</strong>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned based on semester & current skills</span>
                    </div>
                    <span className="px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl">
                      {blueprint.roadmapLevel} Track
                    </span>
                  </div>

                  {/* Skills gaps analysis */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                    <strong className="text-sm font-black text-slate-800 block">Skills Gap Analysis</strong>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Your Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {blueprint.skillsGap.current.slice(0, 4).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg uppercase">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-1">Priority Missing:</span>
                        <div className="flex flex-wrap gap-1">
                          {blueprint.skillsGap.priority.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-black rounded-lg uppercase">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended projects */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                    <strong className="text-sm font-black text-slate-800 block">Recommended Projects</strong>
                    <div className="space-y-2">
                      {blueprint.recommendedProjects.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 bg-white p-2.5 rounded-xl border border-slate-150">
                          <span className="font-black text-slate-800">{p.title}</span>
                          <div className="flex gap-4">
                            <span className="text-[10px] text-indigo-600">{p.difficulty}</span>
                            <span className="text-[10px] text-emerald-600">Impact: {p.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 10: INITIAL PRI */}
            {step === 10 && priResult && (
              <motion.div
                key="step-10"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6 text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Initial Placement Readiness Index</h2>
                  <p className="text-slate-500 font-semibold text-sm max-w-sm mx-auto">
                    Calculated using your resume ATS metrics, LinkedIn score, skills coverage, and completed profile items.
                  </p>
                </div>

                <div className="max-w-xs mx-auto bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4">
                  <div className="inline-block px-3 py-1.5 bg-white border rounded-xl shadow-sm text-2xl font-black text-slate-800">
                    {priResult.score} %
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned Placement Category</span>
                    <strong className="text-lg font-black text-emerald-600 block uppercase tracking-wide">
                      {priResult.category}
                    </strong>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 11: ACTION PLAN */}
            {step === 11 && (
              <motion.div
                key="step-11"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Your First Action Plan</h2>
                  <p className="text-slate-500 text-sm">These dynamic tasks will serve as the launchpad for your Placement OS Dashboard.</p>
                </div>

                <div className="space-y-3 pt-2">
                  {actionPlanTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 leading-snug">{task}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form Controls Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="px-5 py-3 border border-slate-250 text-slate-650 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div>
            {step < 11 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isParsingResume}
                className="px-6 py-3 bg-slate-900 text-white hover:bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isParsingResume ? "Evaluation running..." : "Next Step"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg hover:opacity-90 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing Setup...
                  </>
                ) : (
                  <>
                    Complete Onboarding
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
