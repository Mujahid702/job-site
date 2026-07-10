"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { upsertUserProfile } from "@/lib/db/profiles";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import {
  Sparkles, User as UserIcon, GraduationCap, Briefcase,
  Link as LinkIcon, UploadCloud, FileText, Loader2,
  CheckCircle, ArrowRight, ArrowLeft, AlertCircle,
  Building, Target, Award, Layers, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const Github = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TARGET_ROLE_OPTIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "AI Engineer",
  "Cloud Engineer",
  "DevOps",
  "Cyber Security",
  "QA Engineer",
  "Product Analyst",
  "Business Analyst"
];

const COMPANY_OPTIONS = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Oracle", "Adobe",
  "Salesforce", "IBM", "Deloitte", "Accenture", "TCS", "Infosys", "Wipro",
  "Capgemini", "Cognizant", "PwC", "EY", "KPMG", "Startups"
];

// Skills catalog grouped by category
const SKILL_CATALOG = {
  languages: ["JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Ruby", "Swift"],
  frameworks: ["React", "Next.js", "Vue", "Angular", "Node.js", "Spring Boot", "Django", "Flask", "Express"],
  databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB"],
  cloud: ["AWS", "GCP", "Azure", "Vercel", "Netlify", "Heroku"],
  tools: ["Git", "Docker", "Kubernetes", "Jenkins", "Figma", "Postman", "Linux"]
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("1");
  const [cgpa, setCgpa] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [dreamCompanies, setDreamCompanies] = useState<string[]>([]);
  const [customCompany, setCustomCompany] = useState("");

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [studyGoal, setStudyGoal] = useState("1 hr");

  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setFullName(user.user_metadata?.full_name || "");
        
        // Check if onboarding completed previously
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          router.push("/dashboard");
          return;
        }
      }
      setLoading(false);
    }
    checkSession();
  }, [supabase, router]);

  const handleNext = () => {
    setErrorMessage(null);

    // Validations
    if (step === 1) {
      if (!fullName.trim() || !collegeName.trim() || !branch.trim() || !graduationYear.trim()) {
        setErrorMessage("Please fill all required profile fields.");
        return;
      }
    }
    if (step === 2) {
      if (!targetRole) {
        setErrorMessage("Please select a target engineering profile.");
        return;
      }
    }
    if (step === 3) {
      if (dreamCompanies.length === 0 && !customCompany.trim()) {
        setErrorMessage("Please select or type at least one target company.");
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setStep(prev => prev - 1);
  };

  const handleToggleCompany = (company: string) => {
    setDreamCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const handleToggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const companies = [...dreamCompanies];
    if (customCompany.trim()) {
      companies.push(customCompany.trim());
    }

    // Prepare clean profile payload
    const profilePayload = {
      name: fullName,
      college: collegeName,
      degree: degree || null,
      branch: branch,
      graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
      current_semester: currentSemester ? parseInt(currentSemester, 10) : null,
      cgpa: cgpa || null,
      target_role: targetRole,
      skills: selectedSkills,
      linkedin_url: linkedinUrl || null,
      github_url: githubUrl || null,
      resume_name: resumeFile ? resumeFile.name : null,
      resume_uploaded_at: resumeFile ? new Date().toISOString() : null,
      onboarding_completed: true,
      onboarding_status: "completed",
      onboarding_step: 9,
      career_goal: targetRole,
      experience_level: experienceLevel,
      dream_companies: companies,
      profile_completion: 100,
      raw_profile_data: {
        studyGoal,
        experienceLevel,
        dreamCompanies: companies
      }
    };

    try {
      if (user) {
        // 1. Save profile metrics
        const { success, error } = await upsertUserProfile(user.id, profilePayload);
        if (!success) throw new Error(error?.message || "Failed to commit profile updates.");

        // 2. Initialize clean user_xp row (0 XP, Level 1, 0 Streaks)
        const { error: xpError } = await supabase
          .from("user_xp")
          .upsert({
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            streak_days: 0,
            longest_streak: 0,
            last_activity_date: null,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });

        if (xpError) throw xpError;

        // 3. Compute baseline placement readiness (resolves to 0% if skip elements, or awards verified profile weights only)
        await calculatePRIScore(user.id);
      } else {
        // Fallback local storage for guests
        localStorage.setItem("onboarding_guest_state", JSON.stringify(profilePayload));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Setup wizard completion failed:", err);
      setErrorMessage(err.message || "Failed to finalize account parameters. Try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-650 animate-spin mx-auto" />
          <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Constructing placement workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 px-4 md:px-8 font-sans flex items-center justify-center">
      {/* Background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600 rounded-full blur-[140px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600 rounded-full blur-[140px] opacity-10"></div>

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col min-h-[620px]">
        
        {/* Stepper Header */}
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-150 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
            <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Placement Setup Wizard</span>
          </div>
          <span className="text-xs font-black text-slate-400 font-mono">STEP {step} OF 9</span>
        </div>
        
        <div className="h-1.5 w-full bg-slate-100 relative shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${(step / 9) * 100}%` }}
          />
        </div>

        {/* Form Body Container */}
        <div className="p-8 md:p-12 flex-grow overflow-y-auto max-h-[500px] text-left">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: BASIC PROFILE */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Basic Profile Details</h2>
                  <p className="text-slate-400 text-xs font-semibold">Tell us a bit about yourself and your university.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="E.g. Rohan Sharma"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">College / University *</label>
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="E.g. RVCE Bangalore"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Degree Title</label>
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="E.g. B.Tech / B.E"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Branch / Major *</label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="E.g. Computer Science"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Graduation Year *</label>
                      <input
                        type="number"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="E.g. 2027"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Semester</label>
                      <select
                        value={currentSemester}
                        onChange={(e) => setCurrentSemester(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>{sem} Semester</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">CGPA (Optional)</label>
                      <input
                        type="text"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        placeholder="E.g. 9.1"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: WHAT ARE YOU PREPARING FOR */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Role</h2>
                  <p className="text-slate-400 text-xs font-semibold">Which role is your primary career goal?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {TARGET_ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      onClick={() => setTargetRole(role)}
                      className={cn(
                        "p-4 rounded-2xl border text-left text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        targetRole === role
                          ? "bg-indigo-650 border-indigo-650 text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: TARGET COMPANIES */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Building className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Companies</h2>
                  <p className="text-slate-400 text-xs font-semibold">Where are you aiming to secure placements? (Multi-select)</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {COMPANY_OPTIONS.map((company) => {
                      const active = dreamCompanies.includes(company);
                      return (
                        <button
                          key={company}
                          onClick={() => handleToggleCompany(company)}
                          className={cn(
                            "p-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                            active
                              ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-650 hover:border-slate-350"
                          )}
                        >
                          {company}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Custom Target Company (Optional)</label>
                    <input
                      type="text"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      placeholder="E.g. Stripe, Razorpay"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CURRENT SKILLS */}
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
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Skill Inventory</h2>
                  <p className="text-slate-400 text-xs font-semibold">Select all technical skills you currently possess.</p>
                </div>

                <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(SKILL_CATALOG).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 pb-1">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {items.map((skill) => {
                          const active = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => handleToggleSkill(skill)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                active
                                  ? "bg-indigo-650 border-indigo-650 text-white shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-150"
                              )}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: EXPERIENCE LEVEL */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Experience Level</h2>
                  <p className="text-slate-400 text-xs font-semibold">Select your current engineering proficiency.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {[
                    { val: "Beginner", desc: "No SDE placements experience. Focused on syntax, simple SQL queries, and core DSA puzzles." },
                    { val: "Intermediate", desc: "Built projects with standard web frameworks. Familiar with databases and REST APIs." },
                    { val: "Advanced", desc: "Deployed projects in production. Understand sharding, scaling systems, Docker, and messaging queues." }
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      onClick={() => setExperienceLevel(lvl.val as any)}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                        experienceLevel === lvl.val
                          ? "bg-indigo-650 border-indigo-650 text-white shadow-md"
                          : "bg-slate-50 border-slate-200 hover:border-slate-350"
                      )}
                    >
                      <strong className="text-xs font-black uppercase tracking-wider">{lvl.val}</strong>
                      <span className={cn("text-[10px] font-bold leading-relaxed", experienceLevel === lvl.val ? "text-indigo-100" : "text-slate-450")}>{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 6: CURRENT RESUME */}
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
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Current Resume</h2>
                  <p className="text-slate-400 text-xs font-semibold">Upload your resume to check readiness index or skip to build later.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-250 hover:border-indigo-500 hover:bg-slate-50/50 transition-all rounded-[2rem] p-10 flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <FileText className="w-10 h-10 text-slate-400" />
                    <div>
                      <strong className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                        {resumeFile ? "Change Resume File" : "Choose / Drag Resume File"}
                      </strong>
                      <span className="text-[10px] text-slate-450 font-bold block mt-1">Supports PDF, DOC, DOCX up to 5MB</span>
                    </div>
                  </div>

                  {resumeFile && (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div className="truncate flex-grow">
                        <strong className="text-xs font-black text-slate-800 block truncate">{resumeFile.name}</strong>
                        <span className="text-[9px] text-slate-400 font-mono">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 7: GITHUB & LINKEDIN */}
            {step === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Professional Anchors</h2>
                  <p className="text-slate-400 text-xs font-semibold">Link your developer profiles to calculate project scores (Optional).</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">GitHub Profile URL</label>
                    <div className="relative">
                      <Github className="w-4.5 h-4.5 text-slate-450 absolute left-3.5 top-3.5" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">LinkedIn Profile URL</label>
                    <div className="relative">
                      <Linkedin className="w-4.5 h-4.5 text-slate-450 absolute left-3.5 top-3.5" />
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 8: DAILY STUDY GOALS */}
            {step === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daily Practice Goal</h2>
                  <p className="text-slate-400 text-xs font-semibold">How much time do you want to allocate for daily preparation?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { label: "30 Min", desc: "Light revision daily. Best for consistent reviews." },
                    { label: "1 Hr", desc: "Standard practice drill. Ideal balance." },
                    { label: "2 Hrs", desc: "Intensive training workouts. Focuses on speed." },
                    { label: "4 Hrs", desc: "Extreme preparation bootcamp. Deep dive into SDE templates." }
                  ].map((goal) => (
                    <button
                      key={goal.label}
                      onClick={() => setStudyGoal(goal.label)}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                        studyGoal === goal.label
                          ? "bg-indigo-650 border-indigo-650 text-white shadow-md"
                          : "bg-slate-50 border-slate-200 hover:border-slate-350"
                      )}
                    >
                      <strong className="text-xs font-black uppercase tracking-wider">{goal.label}</strong>
                      <span className={cn("text-[10px] font-bold leading-relaxed", studyGoal === goal.label ? "text-indigo-150" : "text-slate-450")}>{goal.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 9: FINISH SUMMARY */}
            {step === 9 && (
              <motion.div
                key="step-9"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Complete</h2>
                  <p className="text-slate-400 text-xs font-semibold">Your career preparation blueprint is ready for synchronization.</p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono border-b pb-2">Profile Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-650">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block font-mono mb-0.5">Role Track</span>
                      <strong className="text-slate-800 text-[11px]">{targetRole}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block font-mono mb-0.5">Level Tier</span>
                      <strong className="text-slate-800 text-[11px]">{experienceLevel}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block font-mono mb-0.5">Study Target</span>
                      <strong className="text-slate-800 text-[11px]">{studyGoal} / Daily</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block font-mono mb-0.5">Resume Scanned</span>
                      <strong className="text-slate-800 text-[11px]">{resumeFile ? resumeFile.name : "None - Skipped"}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stepper Footer Controllers */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-150 flex justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={step === 1 || isSubmitting}
            className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:text-slate-800 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 9 ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-indigo-750"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-indigo-750 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Generate Profile</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
