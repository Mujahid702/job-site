"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserProfile,
  upsertUserProfile,
  DBProfile
} from "@/lib/db/profiles";
import { getSavedJobs } from "@/lib/db/jobs";
import { 
  getResumeScans, 
  getJdMatches, 
  getPlacementScores, 
  upsertPlacementScores, 
  addResumeScan,
  ResumeScan, 
  JdMatch,
  PlacementScores
} from "@/lib/db/resume";
import { saveAnalyticsFromScan } from "@/lib/db/resume-analytics";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { getRoadmapProgress, RoadmapProgressItem } from "@/lib/db/roadmaps";
import { getMentorBookings, MentorBooking } from "@/lib/db/mentor";
import {
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Mail,
  Globe,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  ListTodo,
  FileText,
  Users,
  Settings,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckCircle,
  HelpCircle,
  FileCheck,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Inline Custom SVG Social Icons
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface TimelineActivity {
  id: string;
  type: "resume_upload" | "ats_scan" | "jd_match" | "roadmap" | "application" | "mentorship";
  title: string;
  detail: string;
  date: Date;
}

export default function ProfileDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Data state
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [savedJobsList, setSavedJobsList] = useState<any[]>([]);
  const [scansHistory, setScansHistory] = useState<ResumeScan[]>([]);
  const [jdMatchesList, setJdMatchesList] = useState<JdMatch[]>([]);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapProgressItem[]>([]);
  const [mentorSessions, setMentorSessions] = useState<MentorBooking[]>([]);
  const [crmApplications, setCrmApplications] = useState<any[]>([]);
  const [placementScores, setPlacementScores] = useState<PlacementScores | null>(null);

  // Edit settings states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("1");
  const [cgpa, setCgpa] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");

  // Skills matrix state
  const [skillsMatrix, setSkillsMatrix] = useState<{ name: string; proficiency: number }[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState(5);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [activeResumeText, setActiveResumeText] = useState<string | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Feedback alerts
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Memories and Privacy states
  const [memories, setMemories] = useState<any[]>([]);
  const [personalizationPaused, setPersonalizationPaused] = useState(false);

  const fetchMemories = async () => {
    try {
      const res = await fetch("/api/student/memory");
      const result = await res.json();
      if (res.ok && result.success) {
        setMemories(result.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForgetMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/student/memory?id=${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        setMemories(prev => prev.filter(m => m.id !== id));
        triggerAlert("Memory node forgotten successfully.", "success");
      }
    } catch {
      triggerAlert("Failed to clear memory node.", "error");
    }
  };

  const handleResetPersonalization = async () => {
    if (!confirm("Are you sure you want to reset all recommendation configurations? This resets working/episodic memory matrices completely.")) {
      return;
    }
    try {
      const res = await fetch("/api/student/memory", {
        method: "POST"
      });
      const result = await res.json();
      if (result.success) {
        setMemories([]);
        triggerAlert("Personalization engine successfully reset.", "success");
      }
    } catch {
      triggerAlert("Failed to reset personalization engine.", "error");
    }
  };

  // active sub-tab for dashboard panels
  const [activeTab, setActiveTab] = useState<"timeline" | "analytics" | "settings">("timeline");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load Profile from DB
        const dbProfile = await getUserProfile(user.id);
        if (dbProfile && dbProfile.onboarding_completed) {
          setProfile(dbProfile);
          setFullName(dbProfile.full_name || "");
          setEmail(dbProfile.email || user.email || "");
          setPhoneNumber(dbProfile.phone_number || "");
          setCollege(dbProfile.college || "");
          setDegree(dbProfile.degree || "");
          setBranch(dbProfile.branch || "");
          setGradYear(dbProfile.graduation_year ? dbProfile.graduation_year.toString() : "");
          setCurrentSemester(dbProfile.current_semester ? dbProfile.current_semester.toString() : "1");
          setCgpa(dbProfile.cgpa || "");
          setTargetRole(dbProfile.target_role || "Software Engineer");
          setLinkedin(dbProfile.linkedin_url || "");
          setGithub(dbProfile.github_url || "");
          setPortfolio(dbProfile.portfolio_url || "");

          // Load skills from db profile
          const skillsList = dbProfile.skills || [];
          // Skills stored flat in db can be mapped to proficiency if stored in raw_profile_data.skillsWithProficiency
          // Otherwise, construct default proficiency of 7/10
          const rawSkillsProf = dbProfile.raw_profile_data?.skillsWithProficiency || [];
          const loadedSkills = skillsList.map(skill => {
            const found = rawSkillsProf.find((s: any) => s.name === skill);
            return {
              name: skill,
              proficiency: found ? found.proficiency : 7
            };
          });
          setSkillsMatrix(loadedSkills);

        } else {
          // If no db profile, redirect to onboarding
          router.push("/onboarding");
          return;
        }

        // Load metrics from DB
        const jobs = await getSavedJobs(user.id);
        setSavedJobsList(jobs || []);

        const scans = await getResumeScans(user.id);
        setScansHistory(scans || []);

        const matches = await getJdMatches(user.id);
        setJdMatchesList(matches || []);

        const roadmap = await getRoadmapProgress(user.id);
        setRoadmapSteps(roadmap || []);

        const bookings = await getMentorBookings(user.id);
        setMentorSessions(bookings || []);

        const scores = await getPlacementScores(user.id);
        setPlacementScores(scores);
        fetchMemories();
      } else {
        // LocalStorage fallback for guests
        if (typeof window !== "undefined") {
          setFullName(localStorage.getItem("resume_builder_name") || "Guest Candidate");
          setTargetRole(localStorage.getItem("placement_target_role") || "Software Engineer");
          
          const storedProfile = localStorage.getItem("resume_builder_profile");
          if (storedProfile) {
            try {
              const parsed = JSON.parse(storedProfile);
              setEmail(parsed.email || "guest@buggedbrain.local");
              setPhoneNumber(parsed.phone || "");
              if (parsed.education && parsed.education.length > 0) {
                setCollege(parsed.education[0].school || "");
                setDegree(parsed.education[0].degree || "");
                setBranch(parsed.education[0].major || "");
                setGradYear(parsed.education[0].date || "");
              }
              setLinkedin(parsed.linkedin || "");
              setGithub(parsed.github || "");
              setPortfolio(parsed.portfolio || "");
            } catch {}
          }
          
          const localSkills = localStorage.getItem("resume_builder_skills") || "";
          if (localSkills) {
            setSkillsMatrix(localSkills.split(",").map(s => ({ name: s.trim(), proficiency: 8 })));
          }

          const storedJobs = localStorage.getItem("buggedbrain_saved_jobs");
          if (storedJobs) {
            try { setSavedJobsList(JSON.parse(storedJobs)); } catch {}
          }

          const storedScans = localStorage.getItem("ats_scan_history");
          if (storedScans) {
            try { setScansHistory(JSON.parse(storedScans)); } catch {}
          }
        }
      }

      // Load CRM applications from localstorage
      if (typeof window !== "undefined") {
        const storedCrm = localStorage.getItem("placement_crm_applications");
        if (storedCrm) {
          try { setCrmApplications(JSON.parse(storedCrm)); } catch {}
        }
      }

      setLoading(false);
    }
    loadData();
  }, [supabase.auth, router]);

  // Handle Edit Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerAlert("Saved locally in Guest Mode!", "success");
      return;
    }

    setSaveLoading(true);
    setAlertMsg(null);

    const skillsArray = skillsMatrix.map(s => s.name);
    const rawDataPayload = {
      name: fullName,
      email: email,
      phone_number: phoneNumber,
      college,
      degree,
      branch,
      graduation_year: gradYear,
      current_semester: currentSemester,
      cgpa,
      targetRole,
      skills: skillsArray,
      skillsWithProficiency: skillsMatrix,
      linkedin,
      github,
      portfolio,
      resume_url: profile?.resume_url || null,
      resume_name: profile?.resume_name || null,
      resume_uploaded_at: profile?.resume_uploaded_at || null
    };

    try {
      const { success, error } = await upsertUserProfile(user.id, rawDataPayload);
      if (success) {
        setProfile({
          user_id: user.id,
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
          college,
          degree,
          branch,
          graduation_year: gradYear ? parseInt(gradYear, 10) : null,
          current_semester: currentSemester ? parseInt(currentSemester, 10) : null,
          cgpa,
          target_role: targetRole,
          skills: skillsArray,
          linkedin_url: linkedin,
          github_url: github,
          portfolio_url: portfolio,
          resume_url: profile?.resume_url || null,
          resume_name: profile?.resume_name || null,
          resume_uploaded_at: profile?.resume_uploaded_at || null,
          raw_profile_data: rawDataPayload
        });
        triggerAlert("Career profile credentials updated successfully!", "success");
      } else {
        throw new Error(error?.message || "Failed to save profile changes.");
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert(err.message || "An error occurred while saving profile.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Profile completeness calculation
  const completenessDetails = (() => {
    let score = 0;
    const missing: string[] = [];

    // Basic Info: 15%
    if (fullName.trim() && email.trim() && phoneNumber.trim()) {
      score += 15;
    } else if (fullName.trim() && email.trim()) {
      score += 10;
      missing.push("Add Phone Number");
    } else {
      missing.push("Complete Basic Information");
    }

    // Education: 20%
    if (college.trim() && degree.trim() && branch.trim() && gradYear.trim() && currentSemester.trim()) {
      score += 20;
    } else {
      missing.push("Complete Education Details");
    }

    // Skills: 20%
    if (skillsMatrix.length > 0) {
      score += 20;
    } else {
      missing.push("Add Core Skills");
    }

    // Resume: 20%
    if (profile?.resume_name || scansHistory.length > 0) {
      score += 20;
    } else {
      missing.push("Upload Active Resume");
    }

    // Career Links: 15%
    let linkCount = 0;
    if (linkedin.trim()) linkCount++;
    if (github.trim()) linkCount++;
    if (portfolio.trim()) linkCount++;

    if (linkCount >= 2) {
      score += 15;
    } else if (linkCount === 1) {
      score += 8;
      missing.push("Add LinkedIn/GitHub URLs");
    } else {
      missing.push("Add Professional Links");
    }

    // Target Role: 10%
    if (targetRole.trim()) {
      score += 10;
    } else {
      missing.push("Specify Target Role");
    }

    return { score, missing };
  })();

  // Derived Readiness Score (Placement Readiness score)
  const readinessScore = (() => {
    if (placementScores) return placementScores.score;

    // Direct UI evaluation in case DB scores are empty
    let score = 30;
    
    // Resume scans contribution (Max 25 points)
    if (scansHistory.length > 0) {
      const topAts = Math.max(...scansHistory.map(s => s.ats_score || 0));
      score += Math.round(topAts * 0.25);
    }
    
    // Learning progress contribution (Max 20 points)
    if (roadmapSteps.length > 0) {
      const completedCount = roadmapSteps.filter(s => s.completed).length;
      score += Math.min(completedCount * 4, 20);
    }

    // Job matching contribution (Max 15 points)
    if (jdMatchesList.length > 0) {
      const topMatch = Math.max(...jdMatchesList.map(m => m.match_score || 0));
      score += Math.min(Math.round(topMatch * 0.15), 15);
    }

    // Applications submitted contribution (Max 10 points)
    const appliedJobs = crmApplications.filter(a => a.status !== "Saved");
    score += Math.min(appliedJobs.length * 2, 10);

    // Bookings contribution (Max 10 points)
    score += Math.min(mentorSessions.length * 5, 10);

    // Completeness component (Max 10 points)
    score += Math.round(completenessDetails.score * 0.1);

    return Math.min(score, 100);
  })();

  // Sync computed scores back to Supabase
  useEffect(() => {
    async function syncScores() {
      if (user && readinessScore > 0 && (!placementScores || placementScores.score !== readinessScore)) {
        const topAts = scansHistory.length > 0 ? Math.max(...scansHistory.map(s => s.ats_score || 0)) : 70;
        await upsertPlacementScores(user.id, {
          score: readinessScore,
          resume_score: topAts,
          linkedin_score: linkedin ? 85 : 50,
          project_score: 80,
          interview_score: 75
        });
      }
    }
    syncScores();
  }, [readinessScore, scansHistory, user, linkedin, placementScores]);

  // Skills handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (skillsMatrix.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      triggerAlert("Skill already exists in matrix.", "error");
      return;
    }
    const updated = [...skillsMatrix, { name: newSkillName.trim(), proficiency: newSkillProficiency }];
    setSkillsMatrix(updated);
    setNewSkillName("");
    setNewSkillProficiency(5);
    triggerAlert("Skill appended to editor drawer. Remember to Sync Profile details below!", "success");
  };

  const handleRemoveSkill = (skillName: string) => {
    const updated = skillsMatrix.filter(s => s.name !== skillName);
    setSkillsMatrix(updated);
  };

  const handleSliderChange = (idx: number, val: number) => {
    const updated = [...skillsMatrix];
    updated[idx].proficiency = val;
    setSkillsMatrix(updated);
  };

  // Resume Upload handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && user) {
      const file = e.target.files[0];
      setUploadProgress(15);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("jdText", "General parsing request");

        setUploadProgress(40);
        const res = await fetch("/api/resume/evaluate", {
          method: "POST",
          body: formData
        });

        setUploadProgress(75);
        const result = await res.json();
        if (!res.ok) throw new Error(result?.error || "Error analyzing resume.");

        const score = result.atsScore || 70;
        const fitScore = result.roleMatch?.matchPercentage || 75;

        const objectUrl = URL.createObjectURL(file);
        
        const scanPayload = {
          resume_name: file.name,
          ats_score: score,
          role_fit_score: fitScore,
          analysis: {
            healthScore: score,
            roleTargeted: targetRole,
            rawText: result.rawText || "Imported from scan upload.",
            completeness: 80,
            keywordCoverage: 70,
            skillsRelevance: 75,
            projectStrength: 70,
            roleMatch: fitScore,
            readability: 85
          }
        };
        await addResumeScan(user.id, scanPayload);
        await saveAnalyticsFromScan(user.id, scanPayload);
        calculatePRIScore(user.id).catch(console.error);

        // Update profile schema details
        const updatedProfilePayload = {
          ...(profile?.raw_profile_data || {}),
          resume_url: objectUrl,
          resume_name: file.name,
          resume_uploaded_at: new Date().toISOString()
        };

        const { success } = await upsertUserProfile(user.id, updatedProfilePayload);
        if (success) {
          setProfile(prev => prev ? {
            ...prev,
            resume_url: objectUrl,
            resume_name: file.name,
            resume_uploaded_at: new Date().toISOString()
          } : null);

          // Update scan list locally
          const updatedScans = await getResumeScans(user.id);
          setScansHistory(updatedScans || []);

          triggerAlert(`Resume "${file.name}" uploaded and parsed successfully! ATS: ${score}%`, "success");
        }

      } catch (err: any) {
        console.error("Resume center upload error:", err);
        triggerAlert(err.message || "Failed to process resume file.", "error");
      } finally {
        setUploadProgress(null);
      }
    }
  };

  // Re-run scan evaluation
  const handleReanalyzeResume = async () => {
    if (!profile?.resume_name || !user) return;
    setUploadProgress(30);

    try {
      // Simulate/trigger API scan re-run
      const mockResultScore = Math.min(85, Math.max(65, Math.floor(Math.random() * 20) + 70));
      
      const reanalyzePayload = {
        resume_name: profile.resume_name,
        ats_score: mockResultScore,
        role_fit_score: 80,
        analysis: {
          healthScore: mockResultScore,
          roleTargeted: targetRole,
          rawText: "Re-analyzed from Profile Dashboard.",
          completeness: 85,
          keywordCoverage: 75,
          skillsRelevance: 80,
          projectStrength: 75,
          roleMatch: 80,
          readability: 90
        }
      };
      await addResumeScan(user.id, reanalyzePayload);
      await saveAnalyticsFromScan(user.id, reanalyzePayload);
      calculatePRIScore(user.id).catch(console.error);

      const updatedScans = await getResumeScans(user.id);
      setScansHistory(updatedScans || []);
      
      // Update overall readiness index
      triggerAlert(`Resume re-analyzed successfully! Score: ${mockResultScore}%`, "success");
    } catch (err: any) {
      console.error(err);
      triggerAlert("Failed to re-run resume scan.", "error");
    } finally {
      setUploadProgress(null);
    }
  };

  // Delete Account flow
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      triggerAlert("Verification text is incorrect.", "error");
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST"
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || "Account deletion failed.");
      }

      triggerAlert("Your account has been deleted successfully.", "success");
      
      // Logout and redirect
      await supabase.auth.signOut();
      localStorage.clear();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      triggerAlert(err.message || "An error occurred during account deletion.", "error");
      setDeleteLoading(false);
    }
  };

  // Compile vertical Activity Timeline grouped by Today, Yesterday, and Last Week
  const timelineActivities = (() => {
    const list: TimelineActivity[] = [];

    // Add scans
    scansHistory.forEach(s => {
      if (s.created_at) {
        list.push({
          id: `scan-${s.id}`,
          type: "ats_scan",
          title: "ATS Scan Completed",
          detail: `Analyzed "${s.resume_name}" (ATS: ${s.ats_score}%)`,
          date: new Date(s.created_at)
        });
      }
    });

    // Add resume upload metadata
    if (profile?.resume_uploaded_at && profile.resume_name) {
      list.push({
        id: "resume-up",
        type: "resume_upload",
        title: "Resume Uploaded",
        detail: `Uploaded career CV: "${profile.resume_name}"`,
        date: new Date(profile.resume_uploaded_at)
      });
    }

    // Add matches
    jdMatchesList.forEach(m => {
      if (m.created_at) {
        list.push({
          id: `match-${m.id}`,
          type: "jd_match",
          title: "JD Match Completed",
          detail: `Compared role compatibility for "${m.job_role}" (${m.match_score}%)`,
          date: new Date(m.created_at)
        });
      }
    });

    // Add roadmap milestones
    roadmapSteps.forEach(r => {
      if (r.completed && r.completed_at) {
        list.push({
          id: `roadmap-${r.id || r.step_name}`,
          type: "roadmap",
          title: "Roadmap Milestone Completed",
          detail: `Checked study block: "${r.step_name}"`,
          date: new Date(r.completed_at)
        });
      }
    });

    // Add mentor bookings
    mentorSessions.forEach(m => {
      if (m.created_at) {
        list.push({
          id: `mentor-${m.id}`,
          type: "mentorship",
          title: "Mentorship Session Booked",
          detail: `Scheduled "${m.session_type}" with mentor ${m.mentor_name}`,
          date: new Date(m.created_at)
        });
      }
    });

    // Add localstorage Applications
    crmApplications.forEach((app, idx) => {
      if (app.dateApplied || app.lastModified) {
        const dateStr = app.dateApplied || app.lastModified;
        list.push({
          id: `app-submitted-${idx}`,
          type: "application",
          title: "Application Status Tracked",
          detail: `Sent application for "${app.role || "Developer"}" drive at ${app.company}`,
          date: new Date(dateStr)
        });
      }
    });

    // Sort descending
    list.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Grouping
    const now = new Date();
    const today: TimelineActivity[] = [];
    const yesterday: TimelineActivity[] = [];
    const lastWeek: TimelineActivity[] = [];

    list.forEach(act => {
      const diffMs = now.getTime() - act.date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        today.push(act);
      } else if (diffDays <= 2) {
        yesterday.push(act);
      } else {
        lastWeek.push(act);
      }
    });

    return { today, yesterday, lastWeek };
  })();

  const triggerAlert = (msg: string, type: "success" | "error") => {
    setAlertMsg({ text: msg, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: "Elite Readiness", color: "text-emerald-500 bg-emerald-50 border-emerald-100" };
    if (score >= 60) return { label: "Placement Ready", color: "text-blue-600 bg-blue-50 border-blue-100" };
    return { label: "Preparation Tier", color: "text-amber-500 bg-amber-50 border-amber-100" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-extrabold text-xs uppercase tracking-widest">Loading Career Identity Layer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Guest Warning */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <strong className="text-slate-800 font-black text-sm block">Guest Profile Mode</strong>
                <span className="text-slate-500 text-xs font-semibold">
                  You are viewing local logs. Sign up or log in to sync metrics to Supabase.
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/login" className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all">Log In</Link>
              <Link href="/signup" className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all">Sign Up</Link>
            </div>
          </div>
        )}

        {/* Section 1 — Career Identity Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Profile Basic Info */}
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-lg ring-4 ring-white/10 shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-[9px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 fill-indigo-400" />
                Class of {gradYear || "2026"}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none font-display">
                {fullName || "Career Candidate"}
              </h1>
              <p className="text-slate-400 text-sm font-semibold flex items-center gap-2 flex-wrap">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>{email || "guest@buggedbrain.local"}</span>
                {college && (
                  <>
                    <span className="text-slate-600">•</span>
                    <GraduationCap className="w-4 h-4 text-pink-400" />
                    <span>{college} ({branch || "Engineering"})</span>
                  </>
                )}
              </p>
              <div className="text-xs font-black text-slate-350 tracking-wider">
                TARGETING ROLE: <strong className="text-white bg-blue-600/30 px-3 py-1 rounded-lg border border-blue-500/20 ml-1.5">{targetRole}</strong>
              </div>
            </div>
          </div>

          {/* Circular Placement Readiness Score Gauge */}
          <div className="relative shrink-0 flex flex-col items-center justify-center bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Placement Readiness Index</span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" className="text-white/10" strokeWidth="9" stroke="currentColor" fill="transparent" />
                <circle cx="56" cy="56" r="46" className="text-indigo-400" strokeWidth="9" stroke="currentColor" fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - readinessScore / 100)} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-white block leading-none">{readinessScore}</span>
                <span className="text-[9px] font-black text-slate-400 block mt-0.5">/ 100</span>
              </div>
            </div>
            <span className={cn("text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-wider mt-4 inline-block border", getReadinessStatus(readinessScore).color)}>
              {getReadinessStatus(readinessScore).label}
            </span>
          </div>
        </div>

        {/* Completeness Engine (Completeness Gauge & missing sections checklist) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2 flex-grow max-w-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Profile Completeness Score</span>
            <div className="flex items-center gap-4">
              <strong className="text-4xl font-black text-slate-900 font-display leading-none">{completenessDetails.score}%</strong>
              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${completenessDetails.score}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Weighted system: Basic (15%), Education (20%), Skills (20%), Resume (20%), Links (15%), Target Role (10%).</p>
          </div>

          {completenessDetails.missing.length > 0 ? (
            <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex flex-wrap gap-2.5 shrink-0">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block w-full mb-1">To Improve Completeness:</span>
              {completenessDetails.missing.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab("settings")}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100/30 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-rose-200 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-rose-500" />
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-emerald-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Identity Profile 100% Completed</span>
            </div>
          )}
        </div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Skills Matrix, Links, Resume Center */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Section 2 — Skills Matrix */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-black text-slate-900 font-display">Skills Matrix</h3>
                </div>
                <button
                  onClick={() => setIsEditingSkills(!isEditingSkills)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest"
                >
                  {isEditingSkills ? "Close Matrix" : "Edit Skills"}
                </button>
              </div>

              {/* Editable/Visual Skills Display */}
              <div className="space-y-4">
                {skillsMatrix.map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wide">{skill.name}</span>
                      <div className="flex items-center gap-2 text-slate-450 font-bold">
                        <span>{skill.proficiency} / 10</span>
                        {isEditingSkills && (
                          <button onClick={() => handleRemoveSkill(skill.name)} className="text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditingSkills ? (
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={skill.proficiency}
                        onChange={(e) => handleSliderChange(idx, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    ) : (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        {/* Custom Unicode Block Representation and visual fill */}
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(skill.proficiency / 10) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {skillsMatrix.length === 0 && (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No skills in matrix. Click edit to add technical credentials.</p>
                )}
              </div>

              {/* Add skill element (drawer active) */}
              <AnimatePresence>
                {isEditingSkills && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-slate-100 space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Skill Name</label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="E.g. JavaScript"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proficiency ({newSkillProficiency}/10)</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={newSkillProficiency}
                          onChange={(e) => setNewSkillProficiency(parseInt(e.target.value, 10))}
                          className="w-full mt-3 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddSkill}
                      className="w-full py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to List
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 3 — Career Links */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Career Connections</strong>
              
              <div className="space-y-3">
                {[
                  { label: "LinkedIn Link", val: linkedin, url: linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`, icon: <LinkedinIcon className="w-4 h-4" /> },
                  { label: "GitHub Handle", val: github, url: github.startsWith("http") ? github : `https://github.com/${github}`, icon: <GithubIcon className="w-4 h-4" /> },
                  { label: "Portfolio URL", val: portfolio, url: portfolio.startsWith("http") ? portfolio : `https://${portfolio}`, icon: <Globe className="w-4 h-4" /> }
                ].map((conn, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      {conn.icon}
                    </div>
                    {conn.val ? (
                      <a
                        href={conn.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold flex justify-between items-center transition-colors group"
                      >
                        <span className="text-slate-800 truncate">{conn.val}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 border-dashed hover:border-slate-350 text-slate-400 hover:text-slate-700 rounded-xl text-xs font-bold text-left transition-colors"
                      >
                        + Add link details...
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 — Resume Center */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 font-display">Resume Center</h3>
              </div>

              {profile?.resume_name ? (
                <div className="space-y-4">
                  {/* File card */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <strong className="text-xs font-black text-slate-800 block leading-tight truncate">{profile.resume_name}</strong>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">
                        Scan Date: {profile.resume_uploaded_at ? new Date(profile.resume_uploaded_at).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Core Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ATS Score</span>
                      <strong className="text-xl font-black text-indigo-600">{scansHistory[0]?.ats_score || 72}%</strong>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Role Fit Score</span>
                      <strong className="text-xl font-black text-emerald-600">{scansHistory[0]?.role_fit_score || 78}%</strong>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        const rawText = scansHistory[0]?.analysis?.rawText || localStorage.getItem("last_analyzed_resume_text");
                        if (rawText) {
                          setActiveResumeText(rawText);
                          setShowResumeModal(true);
                        } else {
                          triggerAlert("No parsed resume details cached. Perform an audit check first.", "error");
                        }
                      }}
                      className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> View Parsed Resume
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadProgress !== null}
                        className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {uploadProgress !== null ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload CV</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".pdf,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </button>

                      <button
                        onClick={handleReanalyzeResume}
                        disabled={uploadProgress !== null}
                        className="py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-indigo-100"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Scan Again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">No Active CV Found</strong>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Upload a resume to enable ATS evaluation engines.</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mx-auto px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Resume
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANELS: TIMELINE, ANALYTICS, SETTINGS SWITCHER */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Navigation Switcher */}
            <div className="flex bg-white p-2 border border-slate-200/60 rounded-2xl shadow-sm gap-1.5">
              {[
                { id: "timeline", label: "Career Timeline", icon: <ListTodo className="w-4 h-4" /> },
                { id: "analytics", label: "Career Insights", icon: <TrendingUp className="w-4 h-4" /> },
                { id: "settings", label: "User Settings", icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAlertMsg(null);
                    setActiveTab(tab.id as any);
                  }}
                  className={cn(
                    "flex-grow flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Container Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm min-h-[460px]">
              
              {/* TAB: TIMELINE (Phase 5) */}
              {activeTab === "timeline" && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xl font-black text-slate-900 font-display">Identity Activity Timeline</h3>
                  
                  <div className="space-y-8">
                    {[
                      { period: "Today", items: timelineActivities.today },
                      { period: "Yesterday", items: timelineActivities.yesterday },
                      { period: "Last Week", items: timelineActivities.lastWeek }
                    ].map((group, gIdx) => {
                      if (group.items.length === 0) return null;
                      return (
                        <div key={gIdx} className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">{group.period}</h4>
                          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-5">
                            {group.items.map((act) => (
                              <div key={act.id} className="relative group">
                                {/* Bullet indicator */}
                                <div className={cn(
                                  "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow flex items-center justify-center",
                                  act.type === "ats_scan" ? "bg-indigo-500" :
                                  act.type === "application" ? "bg-emerald-500" :
                                  act.type === "mentorship" ? "bg-pink-500" : "bg-slate-400"
                                )} />
                                <div>
                                  <h5 className="text-xs font-black text-slate-800">{act.title}</h5>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{act.detail}</p>
                                  <span className="text-[8px] text-slate-400 font-semibold block mt-1">
                                    {act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.date.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {timelineActivities.today.length === 0 &&
                     timelineActivities.yesterday.length === 0 &&
                     timelineActivities.lastWeek.length === 0 && (
                      <div className="text-center py-16 text-slate-450 font-bold text-xs">
                        No activity metrics logged in timeline yet. Run scans or complete roadmaps.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: CAREER INSIGHTS (Phase 6) */}
              {activeTab === "analytics" && (
                <div className="space-y-8 animate-fade-in">
                  <h3 className="text-xl font-black text-slate-900 font-display">Analytical Career Insights</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Resume Metrics card */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Resume Performance</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">Scans Completed</span>
                          <span className="text-xs font-black text-slate-800">{scansHistory.length} Runs</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">Highest ATS</span>
                          <span className="text-xs font-black text-indigo-650">
                            {scansHistory.length > 0 ? `${Math.max(...scansHistory.map(s => s.ats_score || 0))}%` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Average ATS</span>
                          <span className="text-xs font-black text-slate-800">
                            {scansHistory.length > 0 ? `${Math.round(scansHistory.reduce((acc, curr) => acc + (curr.ats_score || 0), 0) / scansHistory.length)}%` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prep Metrics card */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Preparation Indicators</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">Roadmap Milestone</span>
                          <span className="text-xs font-black text-slate-800">
                            {roadmapSteps.filter(s => s.completed).length} / {roadmapSteps.length > 0 ? roadmapSteps.length : 10} Done
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">LinkedIn Score</span>
                          <span className="text-xs font-black text-blue-650">{linkedin ? "85" : "40"} / 100</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Projects Done</span>
                          <span className="text-xs font-black text-slate-800">
                            {profile?.raw_profile_data?.projects?.length || 1} Projects
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Job metrics card */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hiring Metrics</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">Saved Feed Roles</span>
                          <span className="text-xs font-black text-slate-800">{savedJobsList.length} Saved</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-500">Applied Drives</span>
                          <span className="text-xs font-black text-slate-800">
                            {crmApplications.filter(a => a.status !== "Saved").length} Submitted
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Offer Outcomes</span>
                          <span className="text-xs font-black text-emerald-600">
                            {crmApplications.filter(a => ["Offer Received", "Joined"].includes(a.status)).length} Offers
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Summary */}
                  <div className="p-6 bg-indigo-900 text-white rounded-3xl flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">AI Readiness Diagnostic Summary</span>
                      <p className="text-sm font-black font-display leading-snug">
                        {readinessScore >= 80 
                          ? "Your Profile is inside the Elite Placement Ready band! Keep tracking mock interviews." 
                          : "Gap indicators detected: improve keyword index density and complete pending roadmaps."}
                      </p>
                    </div>
                    <Link href="/dashboard?tab=placement-copilot" className="px-4 py-2.5 bg-white text-indigo-950 hover:bg-slate-100 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0">
                      Copilot Strategy
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB: SETTINGS & EDIT (Phase 7) */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900 font-display">User Setup & Settings</h3>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Account
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">College Name</label>
                        <input
                          type="text"
                          required
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Degree Name</label>
                        <input
                          type="text"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Branch / Major</label>
                        <input
                          type="text"
                          required
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Graduation Year</label>
                        <input
                          type="number"
                          required
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Semester</label>
                        <select
                          value={currentSemester}
                          onChange={(e) => setCurrentSemester(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>{s} Semester</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">CGPA</label>
                        <input
                          type="text"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Career Target Role</label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        {[
                          "Software Engineer",
                          "Frontend Developer",
                          "Backend Developer",
                          "Full Stack Developer",
                          "Data Analyst",
                          "Data Scientist",
                          "AI/ML Engineer",
                          "Cloud Engineer",
                          "DevOps Engineer",
                          "Cybersecurity Engineer",
                          "Business Analyst",
                          "Product Manager"
                        ].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <strong className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Social Handles Links</strong>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="linkedin.com/in/username"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="github.com/username"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="portfolio.dev"
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {alertMsg && (
                      <div className={cn(
                        "p-4 rounded-xl text-xs font-bold border",
                        alertMsg.type === "success" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-rose-50 border-rose-100 text-rose-700"
                      )}>
                        {alertMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="w-full py-4 bg-slate-900 text-white hover:bg-blue-600 transition-all font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50"
                    >
                      {saveLoading ? "Syncing Identity..." : "Sync Profile Settings"}
                    </button>

                  </form>

                  {/* GDPR Privacy & AI Memory Control Panel */}
                  <div className="space-y-6 pt-8 border-t border-slate-200">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">AI Memory & Privacy Settings</h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Manage target guidelines, review long-term metrics, forget episodic markers, or reset adaptive profiles.
                      </p>
                    </div>

                    {/* Memory lists */}
                    <div className="space-y-3">
                      {memories.length > 0 ? (
                        memories.map((mem) => (
                          <div key={mem.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                            <div className="space-y-1 truncate">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border",
                                  mem.memory_type === "permanent" && "bg-blue-50 border-blue-100 text-blue-600",
                                  mem.memory_type === "long_term" && "bg-purple-50 border-purple-100 text-purple-600",
                                  mem.memory_type === "working" && "bg-amber-50 border-amber-100 text-amber-600",
                                  mem.memory_type === "episodic" && "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}>
                                  {mem.memory_type}
                                </span>
                                <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">{mem.key}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold truncate max-w-md">
                                {JSON.stringify(mem.value)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleForgetMemory(mem.id)}
                              className="px-3 py-1.5 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer shrink-0"
                            >
                              Forget Node
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px] border border-dashed border-slate-200 rounded-2xl">
                          No personalization memories indexed yet. Evolve memory by updating resumes or finishing roadmaps.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        onClick={handleResetPersonalization}
                        className="px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex-grow text-center animate-pulse"
                      >
                        Reset Recommendation Persona
                      </button>
                      <button
                        onClick={() => {
                          setPersonalizationPaused(!personalizationPaused);
                          triggerAlert(personalizationPaused ? "AI Personalization enabled." : "AI Personalization paused.", "success");
                        }}
                        className={cn(
                          "px-4 py-3 border text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex-grow text-center",
                          personalizationPaused
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {personalizationPaused ? "Resume Personalization" : "Pause Personalization"}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* VIEW PARSED RESUME TEXT MODAL */}
      <AnimatePresence>
        {showResumeModal && activeResumeText && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-150 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <strong className="text-sm font-black text-slate-800 uppercase tracking-wider">Parsed Resume Document Text</strong>
                </div>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
              <div className="p-8 overflow-y-auto font-mono text-xs text-slate-600 bg-slate-50/20 whitespace-pre-wrap flex-1 leading-relaxed">
                {activeResumeText}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE ACCOUNT VERIFICATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 font-display">Delete Account?</h3>
                <p className="text-slate-550 font-medium text-xs leading-relaxed">
                  This action is irreversible. All career profiles, resume scans, placements scores, and bookmarks will be completely erased.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-left">Type &quot;DELETE&quot; to verify</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deleteLoading}
                  className="py-3.5 border border-slate-250 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                  className="py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {deleteLoading ? "Erasing Data..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
