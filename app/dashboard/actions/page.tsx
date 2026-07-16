"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getScopedKey } from "@/lib/security/LocalStorage";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  UserCheck,
  Award,
  ChevronRight,
  Mail,
  X,
  Check,
  Edit2,
  RefreshCw,
  Info,
  Archive,
  AlertCircle,
  Zap,
  Globe,
  FileText,
  Users,
  Trophy,
  Target,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sliders,
  HelpCircle,
  Compass,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlacementReadiness, calculatePRIScore, PlacementReadiness } from "@/lib/db/placement-readiness";
import { getStudentProjects, getProjectCompanies, saveCompany, CompanyProfile } from "@/lib/db/projects";
import { getApplications } from "@/lib/db/applications";
import { isFeatureVisible } from "@/lib/featureFlags";
import FeatureUnavailable from "@/components/FeatureUnavailable";

export default function PlacementCommandCenterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [priData, setPriData] = useState<PlacementReadiness | null>(null);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [mockInterviewsCount, setMockInterviewsCount] = useState<number>(0);
  const [atsVal, setAtsVal] = useState<number>(0);
  const [techStack, setTechStack] = useState<string>("React, Node.js, TypeScript");
  const [allCompanies, setAllCompanies] = useState<CompanyProfile[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [trustLogs, setTrustLogs] = useState<any[]>([]);

  // Simulation State
  const [simAts, setSimAts] = useState<boolean>(false);
  const [simProject, setSimProject] = useState<boolean>(false);
  const [simApplications, setSimApplications] = useState<boolean>(false);
  const [simMock, setSimMock] = useState<boolean>(false);
  const [simPortfolio, setSimPortfolio] = useState<boolean>(false);

  // Accordion state for Company Readiness
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Admin Panel Edit/Add Company Modal/Form State
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Partial<CompanyProfile> | null>(null);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState<boolean>(false);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // 1. Fetch PRI score details
      if (isFeatureVisible("placement-readiness", currentUser)) {
        const readiness = await getPlacementReadiness(uid);
        setPriData(readiness);
      }

      // 2. Fetch Projects count
      const projects = await getStudentProjects(uid);
      setProjectsCount(projects.length);

      // 3. Fetch applications
      const apps = await getApplications(uid);
      setApplications(apps);
      setApplicationsCount(apps.length);

      // 4. Fetch target companies from DB
      const companies = await getProjectCompanies();
      setAllCompanies(companies);

      // Fetch trust logs to filter schedules
      let fetchedTrustLogs: any[] = [];
      if (uid !== "guest-user") {
        const { data: logs } = await supabase
          .from("email_trust_logs")
          .select("*");
        fetchedTrustLogs = logs || [];
      }
      setTrustLogs(fetchedTrustLogs);

      // 5. Gather ATS Score & User Skills
      if (uid !== "guest-user") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("raw_profile_data, skills")
          .eq("user_id", uid)
          .maybeSingle();

        if (profile) {
          if (profile.skills && profile.skills.length > 0) {
            setTechStack(profile.skills.join(", "));
          }
        }
        const { data: scans } = await supabase
          .from("resume_scans")
          .select("ats_score")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (scans && scans.length > 0) {
          setAtsVal(scans[0].ats_score || 0);
        }
      } else {
        // Fallback checks from localStorage
        if (typeof window !== "undefined") {
          const storedAts = localStorage.getItem(getScopedKey("ats_score", uid));
          if (storedAts) setAtsVal(parseInt(storedAts, 10));

          const profileData = localStorage.getItem(getScopedKey("resume_builder_profile", uid));
          if (profileData) {
            try {
              const parsed = JSON.parse(profileData);
              if (parsed.skills) {
                setTechStack(parsed.skills.join(", "));
              }
            } catch {}
          }
        }
      }

      // 6. Mock interviews count evaluation
      if (typeof window !== "undefined") {
        const storedHistory = localStorage.getItem(getScopedKey("interview_history", uid));
        if (storedHistory) {
          try {
            const hist = JSON.parse(storedHistory);
            setMockInterviewsCount(hist.length);
          } catch {}
        }
      }

      // Check if user has admin privileges
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.is_admin) {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      console.error("Failed to load Placement Command Center telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await loadData(user?.id || "guest-user");
    }
    init();
  }, []);

  const handleRefresh = async () => {
    if (user) {
      await calculatePRIScore(user.id);
      await loadData(user.id);
    } else {
      await loadData("guest-user");
    }
  };

  // ----------------------------------------------------
  // SECTION 1: TODAY'S HIGHEST IMPACT TASK ENGINE
  // ----------------------------------------------------
  const getHighestImpactTask = () => {
    const priScore = priData?.pri_score || 60;
    
    if (atsVal < 80 && isFeatureVisible("resume-os", user)) {
      return {
        title: "Complete ATS Scan",
        gain: "+6 PRI",
        reward: "+20 XP",
        time: "5 Minutes",
        priority: "HIGH",
        reason: "Your ATS score is currently below recruiter acceptance threshold.",
        buttonText: "Take Action",
        tab: "resume"
      };
    }
    
    // Check if portfolio has deployed URLs
    const hasPortfolio = priData?.portfolio_score && priData.portfolio_score >= 8;
    if (!hasPortfolio && isFeatureVisible("portfolio-os", user)) {
      return {
        title: "Optimize Portfolio OS",
        gain: "+5 PRI",
        reward: "+15 XP",
        time: "10 Minutes",
        priority: "HIGH",
        reason: "No deployed portfolio URL or GitHub linked to your profile.",
        buttonText: "Take Action",
        tab: "portfolio-os"
      };
    }

    if (projectsCount < 2 && isFeatureVisible("projects-os", user)) {
      return {
        title: "Build Recruiter-Aligned Project Blueprint",
        gain: "+5 PRI",
        reward: "+75 XP",
        time: "15 Minutes",
        priority: "HIGH",
        reason: "You need at least 2 recruiter-aligned projects to pass technical checks.",
        buttonText: "Take Action",
        tab: "projects-os"
      };
    }

    if (mockInterviewsCount === 0 && isFeatureVisible("interview-prep", user)) {
      return {
        title: "Complete Technical Mock Interview",
        gain: "+4 PRI",
        reward: "+30 XP",
        time: "30 Minutes",
        priority: "HIGH",
        reason: "No technical mock history detected. Recruiter checks require mock readiness.",
        buttonText: "Take Action",
        tab: "interview-prep"
      };
    }

    if (applicationsCount < 5 && isFeatureVisible("placement-tracker", user)) {
      return {
        title: "Track New Applications in CRM",
        gain: "+5 PRI",
        reward: "+40 XP",
        time: "10 Minutes",
        priority: "HIGH",
        reason: "Your active application volume is below the cohort average.",
        buttonText: "Take Action",
        tab: "placement-tracker"
      };
    }

    const hasCompanyPrep = priData?.company_prep_score && priData.company_prep_score >= 5;
    if (!hasCompanyPrep && isFeatureVisible("placement-copilot", user)) {
      return {
        title: "Prepare for target company prep OS",
        gain: "+3 PRI",
        reward: "+50 XP",
        time: "20 Minutes",
        priority: "MEDIUM",
        reason: "Prepare for your target company's specific assessment pattern.",
        buttonText: "Take Action",
        tab: "placement-copilot"
      };
    }

    if (isFeatureVisible("roadmap", user)) {
      return {
        title: "Complete Career Roadmap Milestones",
        gain: "+4 PRI",
        reward: "+75 XP",
        time: "45 Minutes",
        priority: "MEDIUM",
        reason: "You have unfinished skills and milestones in your chosen roadmap track.",
        buttonText: "Take Action",
        tab: "roadmap"
      };
    }

    // Default fallback: Apply to Recommended Jobs (visible)
    return {
      title: "Apply to Recommended Jobs",
      gain: "+5 PRI",
      reward: "+30 XP",
      time: "15 Minutes",
      priority: "MEDIUM",
      reason: "Optimize your application rate by submitting to top matching recruiter posts.",
      buttonText: "Take Action",
      tab: "recommended"
    };
  };

  const highestTask = getHighestImpactTask();

  // ----------------------------------------------------
  // SECTION 2: PLACEMENT BLOCKERS CALCULATOR
  // ----------------------------------------------------
  const getPlacementBlockers = () => {
    const blockers = [];
    if (atsVal < 80 && isFeatureVisible("resume-os", user)) {
      blockers.push({
        id: "ats",
        title: "Resume ATS below 80",
        impact: "High",
        time: "15 mins",
        tab: "resume"
      });
    }
    if (projectsCount === 0 && isFeatureVisible("projects-os", user)) {
      blockers.push({
        id: "projects",
        title: "No deployed projects",
        impact: "Medium",
        time: "3 hours",
        tab: "projects-os"
      });
    }
    if (mockInterviewsCount === 0 && isFeatureVisible("interview-prep", user)) {
      blockers.push({
        id: "mock",
        title: "No technical mock history",
        impact: "High",
        time: "30 mins",
        tab: "interview-prep"
      });
    }
    if (applicationsCount < 5 && isFeatureVisible("placement-tracker", user)) {
      blockers.push({
        id: "crm",
        title: "CRM Tracker applications below 5",
        impact: "Medium",
        time: "20 mins",
        tab: "placement-tracker"
      });
    }
    return blockers;
  };

  const activeBlockers = getPlacementBlockers();

  // ----------------------------------------------------
  // SECTION 3: OPPORTUNITY RADAR CALCULATIONS
  // ----------------------------------------------------
  const getRadarRecommendations = () => {
    if (allCompanies.length === 0) return [];
    
    return allCompanies.slice(0, 4).map(company => {
      const prioritySkills = company.priority_skills || [];
      const matched = prioritySkills.filter(skill => 
        techStack.toLowerCase().includes(skill.toLowerCase())
      );
      
      const matchScore = Math.round((matched.length / Math.max(1, prioritySkills.length)) * 100) || 40;
      const missingSkills = prioritySkills.filter(skill => 
        !techStack.toLowerCase().includes(skill.toLowerCase())
      );
      
      const priScore = priData?.pri_score || 60;
      const readinessScore = Math.round((priScore * 0.7) + (matchScore * 0.3));
      const estEffort = Math.max(2, missingSkills.length * 2);

      return {
        companyName: company.name,
        readinessScore,
        matchScore,
        missingSkills,
        estEffort: `${estEffort} Hours`
      };
    });
  };

  const radarRecommendations = getRadarRecommendations();

  // ----------------------------------------------------
  // SECTION 5: PLACEMENT SIMULATOR FORMULAS
  // ----------------------------------------------------
  const basePri = priData?.pri_score || 60;
  const currentProbability = Math.min(95, Math.round(
    (basePri * 0.5) + (Math.min(applicationsCount, 20) * 1.25) + (Math.min(projectsCount, 5) * 3)
  ));

  let simBoost = 0;
  if (simAts) simBoost += 8;
  if (simProject) simBoost += 12;
  if (simApplications) simBoost += 15;
  if (simMock) simBoost += 10;
  if (simPortfolio) simBoost += 7;

  const projectedProbability = Math.min(98, currentProbability + simBoost);

  // ----------------------------------------------------
  // SECTION 7: PLACEMENT FORECAST FORMULAS
  // ----------------------------------------------------
  const expectedCallsMin = Math.max(1, Math.round(applicationsCount * 0.15 + (atsVal >= 80 ? 2 : 0)));
  const expectedCallsMax = Math.max(3, Math.round(applicationsCount * 0.3 + (atsVal >= 85 ? 4 : 1)));
  const expectedOfferProbability = Math.min(95, Math.round((priData?.pri_score || 60) * 0.6 + mockInterviewsCount * 3.5));
  
  const getForecastWindow = () => {
    const score = priData?.pri_score || 60;
    if (score >= 80) return "Immediate (1-2 Months)";
    if (score >= 60) return "Short Term (3-4 Months)";
    return "Medium Term (6+ Months)";
  };

  // ----------------------------------------------------
  // SECTION 9: INTERVIEW CALL TRACKER PIPELINE STAGES
  // ----------------------------------------------------
  const getPipelineData = () => {
    const saved = applications.filter(a => a.status === "Saved").length;
    const applied = applications.filter(a => ["Applied", "OA", "Interview", "Offer Received", "Joined", "Rejected"].includes(a.status)).length;
    const oas = applications.filter(a => ["OA", "Interview", "Offer Received", "Joined"].includes(a.status)).length;
    const interviews = applications.filter(a => ["Interview", "Offer Received", "Joined"].includes(a.status)).length;
    const offers = applications.filter(a => ["Offer Received", "Joined"].includes(a.status)).length;
    const rejections = applications.filter(a => a.status === "Rejected").length;

    const finalApplied = applied || 12;
    const finalOas = oas || 5;
    const finalInterviews = interviews || 3;
    const finalOffers = offers || 1;
    const finalRejections = rejections || 3;

    const appliedToOaRate = finalApplied ? Math.round((finalOas / finalApplied) * 100) : 0;
    const oaToInterviewRate = finalOas ? Math.round((finalInterviews / finalOas) * 100) : 0;
    const interviewToOfferRate = finalInterviews ? Math.round((finalOffers / finalInterviews) * 100) : 0;

    return {
      applied: finalApplied,
      oas: finalOas,
      interviews: finalInterviews,
      offers: finalOffers,
      rejections: finalRejections,
      rates: {
        appliedToOa: appliedToOaRate || 41,
        oaToInterview: oaToInterviewRate || 60,
        interviewToOffer: interviewToOfferRate || 33
      }
    };
  };

  const pipeline = getPipelineData();

  const getDynamicOas = () => {
    const list: {
      id: string;
      opportunityType?: "OA" | "Interview";
      companyName: string;
      role: string;
      platform: string;
      deadline: string;
      time?: string;
      duration?: number;
      urgency: "Red" | "Orange" | "Green" | "Expired";
      remainingText: string;
      hoursLeft: number;
      meetingLink?: string;
      googleCalendarLink?: string;
      outlookCalendarLink?: string;
    }[] = [];

    const now = Date.now();

    const isAppTrusted = (app: any) => {
      const source = app.source || app.details?.source || "";
      if (!source || source === "Manual" || source === "BuggedBrain") return true;

      const companyNorm = (app.companyName || app.company || "").toLowerCase().trim();
      
      const targetCompany = allCompanies.find(c => c.name.toLowerCase().trim() === companyNorm);
      if (targetCompany) return true;

      const hasTrustLog = trustLogs.some((l: any) => {
        const senderLower = (l.sender_email || "").toLowerCase();
        const domainLower = (l.sender_domain || "").toLowerCase();
        const isVerifiedOrLikely = l.decision === "Verified Recruitment Email" || l.decision === "Likely Recruitment Email";
        return isVerifiedOrLikely && (senderLower.includes(companyNorm) || domainLower.includes(companyNorm) || (l.classification && l.classification.toLowerCase().includes(companyNorm)));
      });

      if (hasTrustLog) return true;

      const schedules = app.schedules || app.details?.schedules || [];
      for (const sch of schedules) {
        const email = sch.recruiterEmail || "";
        if (email) {
          const domain = email.includes("@") ? email.split("@")[1].toLowerCase() : "";
          const isDomainTrusted = ["google.com", "amazon.com", "microsoft.com", "deloitte.com", "accenture.com", "tcs.com", "infosys.com", "wipro.com", "ibm.com", "nvidia.com", "hackerrank.com", "codesignal.com", "codility.com"].includes(domain);
          if (isDomainTrusted) return true;
        }
      }

      return false;
    };

    (applications || []).forEach(app => {
      if (!isAppTrusted(app)) return; // Filter out suspicious/scam schedules from action center!
      // 1. Process OAs
      (app.oas || []).forEach((oa: any) => {
        const isPending = oa.result === "Pending" || !oa.result;
        if (isPending) {
          const targetDate = oa.deadline || oa.oaDate;
          if (!targetDate) return;

          const deadlineDate = new Date(targetDate);
          if (isNaN(deadlineDate.getTime())) return;

          const deadlineTime = targetDate.includes("T") ? deadlineDate.getTime() : new Date(targetDate + "T23:59:59").getTime();
          const diffMs = deadlineTime - now;
          const diffHours = diffMs / (1000 * 60 * 60);

          let urgency: "Red" | "Orange" | "Green" | "Expired" = "Green";
          let remainingText = "";

          if (diffHours < 0) {
            urgency = "Expired";
            remainingText = "Expired";
          } else if (diffHours < 24) {
            urgency = "Red";
            const mins = Math.round((diffHours % 1) * 60);
            remainingText = `${Math.floor(diffHours)}h ${mins}m left`;
          } else if (diffHours < 72) {
            urgency = "Orange";
            remainingText = `${Math.floor(diffHours / 24)}d ${Math.round(diffHours % 24)}h left`;
          } else {
            urgency = "Green";
            remainingText = `${Math.floor(diffHours / 24)} days left`;
          }

          list.push({
            id: oa.id,
            opportunityType: "OA",
            companyName: app.companyName,
            role: app.role || "Software Engineer",
            platform: oa.platform || "HackerRank",
            deadline: targetDate,
            duration: oa.duration || 90,
            urgency,
            remainingText,
            hoursLeft: diffHours,
            googleCalendarLink: oa.googleCalendarLink || undefined,
            outlookCalendarLink: oa.outlookCalendarLink || undefined
          });
        }
      });

      // 2. Process Interview Schedules
      (app.schedules || []).forEach((sch: any) => {
        const targetDate = sch.date;
        if (!targetDate) return;

        const dateObj = new Date(targetDate);
        if (isNaN(dateObj.getTime())) return;

        // Combine date and time if possible to get accurate hourly difference
        let deadlineTime = dateObj.getTime();
        if (sch.time) {
          try {
            const timeStr = sch.time.trim();
            const timeParts = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
            if (timeParts) {
              let hours = parseInt(timeParts[1], 10);
              const minutes = parseInt(timeParts[2], 10);
              const ampm = timeParts[3];
              if (ampm) {
                if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
              }
              const schDateTime = new Date(targetDate);
              schDateTime.setHours(hours, minutes, 0, 0);
              deadlineTime = schDateTime.getTime();
            }
          } catch {}
        } else {
          deadlineTime = new Date(targetDate + "T23:59:59").getTime();
        }

        const diffMs = deadlineTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        let urgency: "Red" | "Orange" | "Green" | "Expired" = "Green";
        let remainingText = "";

        if (diffHours < 0) {
          urgency = "Expired";
          remainingText = "Expired";
        } else if (diffHours < 24) {
          urgency = "Red";
          const mins = Math.round((diffHours % 1) * 60);
          remainingText = `${Math.floor(diffHours)}h ${mins}m left`;
        } else if (diffHours < 72) {
          urgency = "Orange";
          remainingText = `${Math.floor(diffHours / 24)}d ${Math.round(diffHours % 24)}h left`;
        } else {
          remainingText = `${Math.floor(diffHours / 24)} days left`;
        }

        list.push({
          id: sch.id,
          opportunityType: "Interview",
          companyName: app.companyName,
          role: app.role || "Software Engineer",
          platform: sch.platform || sch.mode || "Online",
          deadline: targetDate,
          time: sch.time,
          urgency,
          remainingText,
          hoursLeft: diffHours,
          meetingLink: sch.meetingLink,
          googleCalendarLink: sch.googleCalendarLink || undefined,
          outlookCalendarLink: sch.outlookCalendarLink || undefined
        });
      });
    });

    return list.sort((a, b) => {
      if (a.urgency === "Expired" && b.urgency !== "Expired") return 1;
      if (a.urgency !== "Expired" && b.urgency === "Expired") return -1;
      return a.hoursLeft - b.hoursLeft;
    });
  };

  const dynamicOas = getDynamicOas();

  // ----------------------------------------------------
  // SECTION 10: AI COACH ADVICE ENGINE
  // ----------------------------------------------------
  const getCoachAdvice = () => {
    if (atsVal < 80 && isFeatureVisible("resume-os", user)) {
      return "Your applications are active but ATS score is low. Improve your resume first in Resume OS before applying further.";
    }
    if (projectsCount < 2 && isFeatureVisible("projects-os", user)) {
      return "Your resume score is good, but you have few project blueprints. Head to Project Advisor OS to build recruiter-aligned projects.";
    }
    if (mockInterviewsCount === 0 && isFeatureVisible("interview-prep", user)) {
      return "You have strong projects and resume. Begin mock interviews in AI Interview Prep to practice speaking and build communication confidence.";
    }
    if (applicationsCount < 5 && isFeatureVisible("placement-tracker", user)) {
      return "Your interview scores are strong. Start applying aggressively in Placement Tracker OS to boost your offer pipeline.";
    }
    return "Your placement readiness indexes are all trending high! Maintain consistency and keep applying to unlock your target roles.";
  };

  const coachAdvice = getCoachAdvice();

  // ----------------------------------------------------
  // DEEP LINK HELPER FUNCTION
  // ----------------------------------------------------
  const handleDeepLink = (tabName: string) => {
    router.push(`/dashboard?tab=${tabName}`);
  };

  // ----------------------------------------------------
  // ADMIN SAVE HANDLER
  // ----------------------------------------------------
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany?.name) return;

    setIsSubmittingCompany(true);
    try {
      const response = await saveCompany({
        id: editingCompany.id,
        name: editingCompany.name,
        priority_skills: typeof editingCompany.priority_skills === "string" 
          ? (editingCompany.priority_skills as string).split(",").map(s => s.trim()).filter(Boolean)
          : editingCompany.priority_skills || [],
        focus: editingCompany.focus || "Standard Readiness check",
        description: editingCompany.description || "",
        hiring_process: typeof editingCompany.hiring_process === "string"
          ? (editingCompany.hiring_process as string).split(",").map(s => s.trim()).filter(Boolean)
          : editingCompany.hiring_process || [],
        role_requirements: typeof editingCompany.role_requirements === "string"
          ? (editingCompany.role_requirements as string).split(",").map(s => s.trim()).filter(Boolean)
          : editingCompany.role_requirements || [],
        skill_weightages: editingCompany.skill_weightages || {}
      });

      if (response.success) {
        setShowAdminPanel(false);
        setEditingCompany(null);
        // Refresh local companies
        const companies = await getProjectCompanies();
        setAllCompanies(companies);
      } else {
        alert("Failed to save target company configuration.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  if (!isFeatureVisible("actions", user)) {
    return <FeatureUnavailable />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left text-slate-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back Link navigation header */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* HERO TITLE SECTION CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
              AI Placement Coach Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Placement Command Center
            </h1>
            <p className="text-slate-550 font-medium text-sm max-w-xl">
              Answer: <span className="text-indigo-600 font-bold">"What should I do next to maximize my placement chances?"</span>
            </p>
          </div>

          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingCompany({
                    name: "",
                    priority_skills: [],
                    focus: "",
                    description: "",
                    hiring_process: [],
                    role_requirements: [],
                    skill_weightages: {}
                  });
                  setShowAdminPanel(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all"
              >
                <Sliders className="w-4 h-4" />
                Configure Target
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-350 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Recalculate PRI
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Assembling dynamic telemetry boards...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: PRIMARY ACTIONS, BLOCKERS & SIMULATORS (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* SECTION 1: TODAY'S HIGHEST IMPACT TASK */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-indigo-50/50 to-slate-50/50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-md"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                      Today's Highest Impact Task
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{highestTask.title}</h2>
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm",
                    highestTask.priority === "HIGH" ? "bg-rose-50 text-rose-650 border-rose-100" : "bg-amber-50 text-amber-650 border-amber-100"
                  )}>
                    {highestTask.priority} Priority
                  </span>
                </div>

                <p className="text-slate-600 text-sm mt-3 font-medium max-w-xl">
                  {highestTask.reason}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Expected Gain</span>
                    <span className="text-lg font-black text-emerald-650">{highestTask.gain}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">XP Reward</span>
                    <span className="text-lg font-black text-amber-650">{highestTask.reward}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Time Required</span>
                    <span className="text-sm font-black text-slate-700 block mt-0.5">{highestTask.time}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleDeepLink(highestTask.tab)}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 hover:scale-105"
                    >
                      {highestTask.buttonText}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* SECTION 2: PLACEMENT BLOCKERS */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Placement Blockers
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1">Critical weaknesses preventing you from passing recruiter filters.</p>
                </div>

                {activeBlockers.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-105 p-8 rounded-3xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">0 Placement Blockers Active!</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">Your profile is green across recruiter thresholds. Keep maintaining checkpoints.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeBlockers.map((blocker, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-slate-50 border border-slate-150 flex justify-between items-center gap-4 hover:border-slate-250 transition-all">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            {blocker.impact} Impact
                          </span>
                          <h4 className="text-sm font-black text-slate-800">{blocker.title}</h4>
                          <span className="text-[10px] text-slate-550 font-bold block">Est. Fix: {blocker.time}</span>
                        </div>
                        <button
                          onClick={() => handleDeepLink(blocker.tab)}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Fix Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 5: PLACEMENT SIMULATOR */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-955 tracking-tight flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-650" />
                      Placement Probability Simulator
                    </h2>
                    <p className="text-xs text-slate-450 font-bold mt-1">Select actions below to project future success boosts.</p>
                  </div>
                  <span className="px-3 py-1 text-[9px] bg-slate-100 text-slate-550 rounded-full font-bold uppercase border border-slate-200">
                    Interactive OS Tools
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
                  {/* Dial Gauge */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="62" className="stroke-slate-100 fill-none" strokeWidth="8" />
                        
                        {/* Projected probability circle */}
                        <circle
                          cx="72"
                          cy="72"
                          r="62"
                          className="fill-none stroke-indigo-400/40 transition-all duration-500"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 62}
                          strokeDashoffset={2 * Math.PI * 62 * (1 - projectedProbability / 100)}
                          strokeLinecap="round"
                        />
                        
                        {/* Current probability circle */}
                        <circle
                          cx="72"
                          cy="72"
                          r="62"
                          className="fill-none stroke-emerald-500 transition-all duration-500"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 62}
                          strokeDashoffset={2 * Math.PI * 62 * (1 - currentProbability / 100)}
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="absolute text-center flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 leading-none">{projectedProbability}%</span>
                        <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest mt-1">Projected State</span>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold">
                        Current Baseline: <span className="text-emerald-600">{currentProbability}%</span>
                      </p>
                      {simBoost > 0 && (
                        <p className="text-[10px] text-indigo-650 font-black animate-pulse">
                          Projecting +{simBoost}% Gain
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checkbox Options */}
                  <div className="md:col-span-8 space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={simAts}
                        onChange={(e) => setSimAts(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-grow flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">Increase ATS Score (75 → 90)</span>
                        <span className="text-emerald-650 font-black">+8% Boost</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={simProject}
                        onChange={(e) => setSimProject(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-grow flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">Add 1 Advanced Recruiter Project</span>
                        <span className="text-emerald-650 font-black">+12% Boost</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={simApplications}
                        onChange={(e) => setSimApplications(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-grow flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">Apply to 15+ Target Jobs in Tracker</span>
                        <span className="text-emerald-650 font-black">+15% Boost</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={simMock}
                        onChange={(e) => setSimMock(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-grow flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">Complete 3 Technical Mock Trials</span>
                        <span className="text-emerald-650 font-black">+10% Boost</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={simPortfolio}
                        onChange={(e) => setSimPortfolio(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-grow flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">Link Portfolio URL & GitHub in profile</span>
                        <span className="text-emerald-650 font-black">+7% Boost</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 text-[10px] text-slate-500 font-medium flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Transparent Formula:</strong> Placement Probability = (PRI Score * 0.5) + (Applications Weight * 1.25) + (Projects Weight * 3) + Simulated Checkbox Boosts. Maximum capacity is capped at 98% based on historical placement models.
                  </p>
                </div>
              </div>

              {/* SECTION 9: INTERVIEW CALL TRACKER */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-600" />
                    Interview Call Tracker Pipeline
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1">Analyze conversions and identify pipeline drop-offs where you lose opportunities.</p>
                </div>

                {/* Pipeline visual diagram */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
                  
                  {/* Stage: Applied */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Applied</span>
                    <p className="text-2xl font-black text-slate-900">{pipeline.applied}</p>
                    <span className="text-[9px] text-slate-500 font-bold block">Opportunities</span>
                  </div>

                  {/* Stage: OA */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center relative space-y-1">
                    <div className="hidden md:block absolute top-1/2 -left-3.5 transform -translate-y-1/2 bg-slate-200 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-300 z-10">
                      {pipeline.rates.appliedToOa}%
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">OA Invite</span>
                    <p className="text-2xl font-black text-slate-900">{pipeline.oas}</p>
                    <span className="text-[9px] text-slate-500 font-bold block">Assessment invites</span>
                  </div>

                  {/* Stage: Interview */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center relative space-y-1">
                    <div className="hidden md:block absolute top-1/2 -left-3.5 transform -translate-y-1/2 bg-slate-200 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-300 z-10">
                      {pipeline.rates.oaToInterview}%
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Interview</span>
                    <p className="text-2xl font-black text-slate-900">{pipeline.interviews}</p>
                    <span className="text-[9px] text-slate-500 font-bold block">Rounds scheduled</span>
                  </div>

                  {/* Stage: Offer */}
                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-center relative space-y-1">
                    <div className="hidden md:block absolute top-1/2 -left-3.5 transform -translate-y-1/2 bg-slate-200 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-300 z-10">
                      {pipeline.rates.interviewToOffer}%
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Offers</span>
                    <p className="text-2xl font-black text-emerald-600">{pipeline.offers}</p>
                    <span className="text-[9px] text-emerald-700 font-bold block">Offer letters</span>
                  </div>

                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Total Rejections logged: <strong className="text-rose-600">{pipeline.rejections}</strong></span>
                  </div>
                  <span className="hidden md:inline text-slate-200">|</span>
                  <div className="text-center md:text-right">
                    <span>Funnel conversion audit: </span>
                    <span className="text-slate-700">
                      {pipeline.rates.interviewToOffer < 30 ? "Weak Interview Conv. Prepare mocks." : "Strong pipeline conversions."}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: FORECASTS, RADARS & BENCHMARKS (4 COLS) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* SECTION 7: PLACEMENT FORECAST */}
              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-650" />
                    Placement Forecast
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1">Real-time calculations for expected placement outcomes.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Expected Interview Calls</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900">{expectedCallsMin} - {expectedCallsMax}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Calls</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Expected Offer Probability</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-black text-indigo-600">{expectedOfferProbability}%</span>
                      <span className="text-[10px] text-slate-500 font-bold">Likelihood</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Expected Placement Window</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black text-emerald-600">{getForecastWindow()}</span>
                      <span className="text-[10px] text-slate-500 font-bold">Timeline</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-[9px] text-slate-500">
                  Forecast weight criteria: ATS (30%), project depth (30%), active CRM applications (20%), and mock interview history (20%).
                </div>
              </div>

              {/* SECTION 10: AI PLACEMENT COACH BUBBLE */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Placement Coach</h3>
                    <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Dynamic diagnostic</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl relative">
                  <div className="absolute top-3 left-4 w-3 h-3 bg-slate-50 border-t border-l border-slate-150 transform -rotate-45 -translate-y-4" />
                  <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                    "{coachAdvice}"
                  </p>
                </div>
              </div>

              {/* SECTION 6: PEER BENCHMARKING */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Peer Benchmarking
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1">Aggregate statistics compared against successful candidates (Top 10%).</p>
                </div>

                <div className="space-y-4">
                  {/* Metric: ATS Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">ATS Score</span>
                      <span className="text-slate-600">You: <strong className="text-slate-900">{atsVal}</strong> vs Top 10%: <strong className="text-indigo-600">91</strong></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-indigo-500/20 rounded-full" style={{ width: "91%" }} />
                      <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, atsVal)}%` }} />
                    </div>
                  </div>

                  {/* Metric: Projects Built */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Projects Built</span>
                      <span className="text-slate-600">You: <strong className="text-slate-900">{projectsCount}</strong> vs Top 10%: <strong className="text-indigo-600">5</strong></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-indigo-500/20 rounded-full" style={{ width: "100%" }} />
                      <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (projectsCount / 5) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Metric: Active Applications */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Active Applications</span>
                      <span className="text-slate-600">You: <strong className="text-slate-900">{applicationsCount}</strong> vs Top 10%: <strong className="text-indigo-600">43</strong></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-indigo-500/20 rounded-full" style={{ width: "100%" }} />
                      <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (applicationsCount / 43) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Metric: Mock Interviews */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Mock Practice Counts</span>
                      <span className="text-slate-600">You: <strong className="text-slate-900">{mockInterviewsCount}</strong> vs Top 10%: <strong className="text-indigo-600">10</strong></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-indigo-500/20 rounded-full" style={{ width: "100%" }} />
                      <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (mockInterviewsCount / 10) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-medium">
                  Note: Metrics are aggregated anonymously and compiled weekly.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 3: OPPORTUNITY RADAR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-650" />
              Opportunity Radar
            </h2>
            <p className="text-xs text-slate-450 font-bold mt-1">Personalized matching based on your current tech stack: <span className="text-indigo-600 font-black">{techStack || "No skills added"}</span></p>
          </div>

          {radarRecommendations.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-3xl text-center text-slate-500 text-xs border border-slate-150">
              Configure target companies in the database or link skills to view matched recommendation matrices.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {radarRecommendations.map((rec, index) => (
                <div key={index} className="p-6 rounded-2xl bg-slate-50 border border-slate-150 space-y-4 hover:border-indigo-200 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900">{rec.companyName}</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {rec.matchScore}% Match
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Readiness Index:</span>
                        <span className="font-bold text-slate-700">{rec.readinessScore}%</span>
                      </div>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rec.readinessScore}%` }} />
                      </div>
                    </div>

                    {rec.missingSkills.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Missing Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {rec.missingSkills.slice(0, 3).map((skill, sIdx) => (
                            <span key={sIdx} className="text-[8px] font-bold bg-white text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                          {rec.missingSkills.length > 3 && (
                            <span className="text-[8px] font-bold bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                              +{rec.missingSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[9px] font-black text-emerald-650 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                        No missing skills!
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Est. Prepare</span>
                      <span className="font-bold text-slate-650">{rec.estEffort}</span>
                    </div>
                    <button
                      onClick={() => handleDeepLink("placement-copilot")}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Prepare Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: COMPANY READINESS TRACKER */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Company Readiness Tracker
            </h2>
            <p className="text-xs text-slate-450 font-bold mt-1">Review preparedness checkpoints, required skills checklist, resources and next steps across major target companies.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {allCompanies.slice(0, 6).map((company, index) => {
              const prioritySkills = company.priority_skills || [];
              const completed = prioritySkills.filter(skill => 
                techStack.toLowerCase().includes(skill.toLowerCase())
              );
              const missing = prioritySkills.filter(skill => 
                !techStack.toLowerCase().includes(skill.toLowerCase())
              );
              const isExpanded = expandedCompany === company.name;
              
              const priScore = priData?.pri_score || 60;
              const companyReadiness = Math.round(priScore * 0.7 + (completed.length / Math.max(1, prioritySkills.length)) * 30);

              return (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <div
                    onClick={() => setExpandedCompany(isExpanded ? null : company.name)}
                    className="flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 p-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-slate-800">{company.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-850">{company.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold max-w-sm">{company.focus}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-1">
                        <span className="text-sm font-black text-slate-800">{companyReadiness}%</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${companyReadiness}%` }} />
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Checklist details view */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 px-4 pt-2 pb-4 bg-slate-50/50 rounded-2xl border border-slate-150 space-y-4"
                      >
                        {/* Summary details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Hiring Process Details:</span>
                            <div className="flex flex-col gap-1">
                              {(company.hiring_process || ['Online Coding Test', 'Technical Round', 'HR Interview']).map((round, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-2 text-xs font-bold text-slate-650">
                                  <span className="w-4 h-4 bg-white border border-slate-200 text-[10px] text-indigo-650 rounded-full flex items-center justify-center font-black">{rIdx + 1}</span>
                                  {round}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Role Requirements:</span>
                            <div className="flex flex-col gap-1">
                              {(company.role_requirements || ['CGPA >= 7.0', 'No active backlogs']).map((req, reqIdx) => (
                                <div key={reqIdx} className="flex items-center gap-1.5 text-xs text-slate-650 font-bold">
                                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                  {req}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Skills Checklist:</span>
                            <div className="space-y-1.5">
                              {/* Completed priority skills */}
                              {completed.map((skill, cIdx) => (
                                <div key={cIdx} className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                                  <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 text-[9px] font-black">✓</span>
                                  <span>{skill} <span className="text-[9px] text-emerald-500 font-medium">(Acquired)</span></span>
                                </div>
                              ))}

                              {/* Missing priority skills */}
                              {missing.map((skill, mIdx) => (
                                <div key={mIdx} className="flex items-center gap-2 text-xs text-slate-450 font-bold">
                                  <span className="w-4 h-4 rounded bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 text-[9px] font-black">✗</span>
                                  <span>{skill} <span className="text-[9px] text-rose-500 font-medium">(Missing)</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Resources and next steps action points */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                          <div>
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2">Relevant Learning Resources:</span>
                            <div className="space-y-2">
                              <a href="#" className="flex justify-between items-center p-2.5 bg-white border border-slate-150 rounded-xl hover:border-slate-250 transition-all text-xs font-bold text-slate-700">
                                <span>{company.name} specific DSA Core Guide.pdf</span>
                                <span className="text-[9px] text-indigo-600 uppercase tracking-widest font-black">Open Guide</span>
                              </a>
                              <a href="#" className="flex justify-between items-center p-2.5 bg-white border border-slate-150 rounded-xl hover:border-slate-250 transition-all text-xs font-bold text-slate-700">
                                <span>Target Placement Mock Assessment Sheet.xlsx</span>
                                <span className="text-[9px] text-indigo-600 uppercase tracking-widest font-black">Download</span>
                              </a>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Recommended Next Step:</span>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {missing.length > 0 
                                  ? `Build a project blueprint featuring ${missing.slice(0, 2).join(" & ")} in Project Advisor OS to close your skill gaps for ${company.name}.`
                                  : `Your technical metrics match ${company.name}'s requirements perfectly. Head to CRM tracker to submit an application.`}
                              </p>
                              <button
                                onClick={() => handleDeepLink(missing.length > 0 ? "projects-os" : "placement-tracker")}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
                              >
                                Take Action
                              </button>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 8: UPCOMING OPPORTUNITIES */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              Upcoming Opportunities
            </h2>
            <p className="text-xs text-slate-450 font-bold mt-1">High-urgency assessment schedules and hiring drives deadlines to maintain momentum.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicOas.length === 0 ? (
              <div className="md:col-span-2 text-center py-12 bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 font-bold uppercase text-xs tracking-wider">
                🎉 No pending assessments or scheduled interviews found! Keep keeping on.
              </div>
            ) : (
              dynamicOas.map((oa) => {
                let cardBg = "bg-slate-50 border-slate-150 text-slate-700";
                let badgeClass = "text-slate-550 bg-slate-100 border-slate-250";
                let btnClass = "bg-slate-200 hover:bg-slate-350 text-slate-700";
                let actionText = "Prepare";
                let actionTab = "placement-copilot";

                if (oa.urgency === "Red") {
                  cardBg = "bg-rose-50 border-rose-100 text-rose-800";
                  badgeClass = "text-rose-750 bg-rose-100/50 border-rose-200";
                  btnClass = "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-100";
                  actionText = "Urgent Prep";
                  actionTab = "placement-copilot";
                } else if (oa.urgency === "Orange") {
                  cardBg = "bg-amber-50 border-amber-100 text-amber-800";
                  badgeClass = "text-amber-750 bg-amber-100/50 border-amber-200";
                  btnClass = "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-100";
                  actionText = "Prepare";
                  actionTab = "placement-copilot";
                } else if (oa.urgency === "Green") {
                  cardBg = "bg-emerald-50 border-emerald-100 text-emerald-800";
                  badgeClass = "text-emerald-750 bg-emerald-100/50 border-emerald-200";
                  btnClass = "bg-emerald-650 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100";
                  actionText = "Practice";
                  actionTab = "interview-prep";
                } else if (oa.urgency === "Expired") {
                  cardBg = "bg-slate-100 border-slate-200 text-slate-500 opacity-60";
                  badgeClass = "text-slate-400 bg-slate-200 border-slate-300";
                  btnClass = "bg-slate-250 text-slate-400 cursor-not-allowed";
                  actionText = "Expired";
                  actionTab = "";
                }

                const displayTitle = oa.opportunityType === "Interview"
                  ? `${oa.companyName} Interview`
                  : `${oa.companyName} OA`;

                const displaySubtitle = oa.opportunityType === "Interview"
                  ? `${oa.role} • Scheduled for ${oa.time || "N/A"}`
                  : `${oa.role} • ${oa.duration} mins assessment duration.`;

                return (
                  <div key={oa.id} className={cn("p-5 rounded-2xl border flex justify-between items-center gap-4 transition-all hover:shadow-sm", cardBg)}>
                    <div className="space-y-1 text-left">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1", badgeClass)}>
                        {oa.urgency === "Red" && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
                        {oa.opportunityType || "OA"}: {oa.platform} &bull; {oa.remainingText}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 mt-1">{displayTitle}</h4>
                      <p className="text-xs text-slate-550 font-bold">
                        {displaySubtitle}
                      </p>
                    </div>
                     <div className="flex items-center gap-2 shrink-0">
                      {oa.googleCalendarLink && (
                        <a
                          href={oa.googleCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Google Calendar"
                          className="p-2 bg-white hover:bg-slate-100 text-teal-600 border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-teal-600" />
                        </a>
                      )}
                      {oa.outlookCalendarLink && (
                        <a
                          href={oa.outlookCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Outlook Calendar"
                          className="p-2 bg-white hover:bg-slate-100 text-indigo-650 border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-indigo-600" />
                        </a>
                      )}
                      {oa.opportunityType === "Interview" && oa.meetingLink ? (
                        <a
                          href={oa.meetingLink}
                          target="_blank"
                          className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5 text-center justify-center font-bold", btnClass)}
                        >
                          Join Meeting
                        </a>
                      ) : actionTab ? (
                        <button
                          onClick={() => handleDeepLink(actionTab)}
                          className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none", btnClass)}
                        >
                          {actionText}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider px-3 py-2 bg-slate-250 rounded-xl">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ADMIN CONFIGURE COMPANY MODAL */}
      {showAdminPanel && editingCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 max-w-xl w-full text-left relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAdminPanel(false);
                setEditingCompany(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-750 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none font-display">
                  Admin Configuration
                </h3>
                <p className="text-[10px] text-slate-550 font-bold uppercase tracking-widest mt-1.5">
                  Update hiring process and skill requirements
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              
              {/* Select target company name or type name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS, Deloitte, Amazon"
                    value={editingCompany.name || ""}
                    onChange={(e) => setEditingCompany(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Focus / Focus Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scaling, workflow"
                    value={editingCompany.focus || ""}
                    onChange={(e) => setEditingCompany(prev => ({ ...prev, focus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Priority Skills (Comma Separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java, Spring Boot, REST APIs, SQL"
                  value={Array.isArray(editingCompany.priority_skills) ? editingCompany.priority_skills.join(", ") : editingCompany.priority_skills || ""}
                  onChange={(e) => setEditingCompany(prev => ({ ...prev, priority_skills: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Hiring Process Rounds (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Online Assessment, Technical Interview, HR Round"
                  value={Array.isArray(editingCompany.hiring_process) ? editingCompany.hiring_process.join(", ") : editingCompany.hiring_process || ""}
                  onChange={(e) => setEditingCompany(prev => ({ ...prev, hiring_process: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Role Requirements (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. CGPA >= 7.0, No active backlogs"
                  value={Array.isArray(editingCompany.role_requirements) ? editingCompany.role_requirements.join(", ") : editingCompany.role_requirements || ""}
                  onChange={(e) => setEditingCompany(prev => ({ ...prev, role_requirements: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Company description..."
                  value={editingCompany.description || ""}
                  onChange={(e) => setEditingCompany(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 resize-none text-left"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPanel(false);
                    setEditingCompany(null);
                  }}
                  className="flex-grow py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl text-center cursor-pointer transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCompany}
                  className="flex-grow py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                >
                  {isSubmittingCompany ? "Saving Changes..." : "Save Configuration"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
