"use client";

import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import ResumeOS from "@/components/ResumeOS";
import AssessmentOS from "@/components/AssessmentOS";
import PortfolioOS from "@/components/PortfolioOS";
import LinkedInOS from "@/components/LinkedInOS";
import CoverLetterOS from "@/components/CoverLetterOS";
import CareerRoadmapNavigator from "@/components/CareerRoadmapNavigator";
import AiInterviewPrep from "@/components/AiInterviewPrep";
import PlacementTrackerOS from "@/components/PlacementTrackerOS";
import PlacementCopilot from "@/components/PlacementCopilot";
import ProjectOS from "@/components/ProjectOS";
import MentorshipOS from "@/components/MentorshipOS";
import CommunityHubOS from "@/components/CommunityHubOS";
import { COMPANY_PREP_LIST } from "@/lib/company-prep-data";
import { 
  LayoutDashboard, 
  Heart, 
  Briefcase, 
  CheckCircle2, 
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Award,
  ShieldCheck,
  Calendar as CalendarIcon,
  MessageSquare,
  Compass,
  CheckCircle,
  FileCheck,
  Layers,
  Bot,
  Zap,
  Globe,
  FileText,
  Users,
  Trophy,
  BookOpen,
  Send,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { upsertUserProfile } from "@/lib/db/profiles";

// Categories & Roles for dynamic Tailoring
const TARGET_ROLES = [
  "Software Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst"
];



interface BookingItem {
  id: string | number;
  type?: string;
  sessionType?: string;
  date: string;
  time: string;
  status: string;
}

interface AdminRequestItem {
  id: number;
  student: string;
  type: string;
  status: string;
}

export default function DashboardPage() {
  const { savedJobs } = useSavedJobs();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Premium Membership State (Simulated)
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Profile Customization & Skill states
  const [targetRole, setTargetRole] = useState<string>("Software Developer");
  const [techStack, setTechStack] = useState<string>("React, Node.js, TypeScript");
  
  // Streak counter (Simulated & Persisted)
  const [streakCount, setStreakCount] = useState<number>(3);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);

  // Resume Analyzer States
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [resumeSubTab, setResumeSubTab] = useState<string>("overview");

  // Command Center statistics states
  const [profileName, setProfileName] = useState<string>("Mujahid");
  const [totalXp, setTotalXp] = useState<number>(885);
  const [currentLevel, setCurrentLevel] = useState<number>(4);
  const [completedMissions, setCompletedMissions] = useState<number>(6);
  const [totalBadges, setTotalBadges] = useState<number>(4);

  // Load client-only preferences on mount to prevent SSR hydration mismatches
  useEffect(() => {
    // 1. Resolve active tab from URL query params
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      if (["resume", "enhancer", "jd-match", "builder"].includes(tabParam)) {
        setActiveTab("resume-os");
        if (tabParam === "resume") setResumeSubTab("ats");
        if (tabParam === "enhancer") setResumeSubTab("enhancer");
        if (tabParam === "jd-match") setResumeSubTab("jd-match");
        if (tabParam === "builder") setResumeSubTab("builder");
      } else if (tabParam === "projects") {
        setActiveTab("projects-os");
      } else if (tabParam === "mentorship") {
        setActiveTab("mentorship-os");
      } else {
        setActiveTab(tabParam);
      }
    }

    // 2. Premium status
    setIsPremium(localStorage.getItem("member_is_premium") === "true");

    // 3. Streak info
    setStreakCount(parseInt(localStorage.getItem("member_learning_streak") || "3"));
    setStreakClaimed(localStorage.getItem("member_claimed_today") === "true");
  }, []);

  // Checklists (Interactive items)
  const [completedGoals, setCompletedGoals] = useState<Record<string, boolean>>({
    "goal-1": true,
    "goal-2": false,
    "goal-3": false,
    "goal-4": false
  });
  const [onboardingTasks, setOnboardingTasks] = useState<string[]>([]);





  // Mentorship Bookings States
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  // Admin aggregates statistics
  const [adminStats, setAdminStats] = useState<{
    totalApplications: number;
    totalActiveUsers: number;
    mostAppliedCompanies: Array<{ company: string; count: number }>;
    averageOfferRate: number;
    mostPopularRoles: Array<{ role: string; count: number }>;
  } | null>(null);

  useEffect(() => {
    if (activeTab === "admin" && isPremium) {
      import("@/lib/db/applications").then(({ getAdminAnalytics }) => {
        getAdminAnalytics().then(setAdminStats);
      });
    }
  }, [activeTab, isPremium]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_mentorship_bookings");
      setTimeout(() => {
        if (stored) {
          try {
            setBookings(JSON.parse(stored));
          } catch {}
        } else {
          setBookings([
            { id: "booking-1", sessionType: "Resume Review", date: "2026-06-10", time: "11:00 AM", status: "Upcoming" }
          ]);
        }
      }, 0);
    }
  }, [activeTab]);





  const router = useRouter();

  // Admin Mock Database
  const [adminRequests, setAdminRequests] = useState<AdminRequestItem[]>([
    { id: 101, student: "Amit Sharma", type: "Mock Interview", status: "Pending" },
    { id: 102, student: "Rohan Varma", type: "Resume Review", status: "Approved" }
  ]);

  useEffect(() => {
    const checkUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!profile || !profile.onboarding_completed) {
          router.push("/onboarding");
        } else {
          if (profile.full_name) setProfileName(profile.full_name);
          if (profile.target_role) setTargetRole(profile.target_role);
          if (profile.skills) setTechStack(profile.skills.join(", "));
          
          // Fetch gamified stats
          try {
            const { data: xpData } = await supabase
              .from("user_xp")
              .select("total_xp, current_level, streak_days")
              .eq("user_id", user.id)
              .maybeSingle();
            if (xpData) {
              setTotalXp(xpData.total_xp || 885);
              setCurrentLevel(xpData.current_level || 4);
              if (xpData.streak_days) setStreakCount(xpData.streak_days);
            }

            // Get completed missions count
            const { count: mCount } = await supabase
              .from("user_missions")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true);
            if (mCount !== null) {
              setCompletedMissions(mCount);
            }

            // Get badges count
            if (profile.badges) {
              setTotalBadges(profile.badges.length);
            }
          } catch (e) {
            console.error("Error fetching stats: ", e);
          }
          
          // Load onboarding action tasks
          const raw = profile.raw_profile_data || {};
          if (raw.actionPlanTasks && Array.isArray(raw.actionPlanTasks)) {
            setOnboardingTasks(raw.actionPlanTasks);
            const initGoals: Record<string, boolean> = {};
            raw.actionPlanTasks.forEach((_: any, idx: number) => {
              initGoals[`goal-${idx}`] = false;
            });
            setCompletedGoals(initGoals);
          }
        }
      }
    };
    checkUserProfile();
  }, [supabase.auth, router]);

  const handleUpdateTargetSettings = async (newRole: string, newStack: string) => {
    setTargetRole(newRole);
    setTechStack(newStack);
    if (user) {
      const skillsArray = newStack.split(",").map(s => s.trim()).filter(Boolean);
      const { data: profile } = await supabase
        .from("profiles")
        .select("raw_profile_data")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const rawData = profile?.raw_profile_data || {};
      const updatedPayload = {
        ...rawData,
        targetRole: newRole,
        skills: skillsArray
      };
      await upsertUserProfile(user.id, updatedPayload);
    }
  };

  // Derived Placement Readiness Index Metrics
  const readinessScore = (() => {
    let score = 30;
    // Streak contribution
    score += Math.min(streakCount * 3, 20);
    // Goals checked
    const checkedGoals = Object.values(completedGoals).filter(Boolean).length;
    score += checkedGoals * 5;
    // Roadmap checked (computed dynamically from actual learning steps checked in localStorage)
    let checkedSteps = 0;
    if (typeof window !== "undefined") {
      const savedProgress = localStorage.getItem("roadmap_progress_states");
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          checkedSteps = Object.values(parsed).filter(Boolean).length;
        } catch {}
      }
    }
    score += Math.min(checkedSteps * 2, 25); // cap at 25% contribution
    // ATS Scan contribution
    if (atsScore) {
      score += Math.round(atsScore * 0.25);
    }
    // CRM application track contribution
    let crmAppsCount = 0;
    let crmHasOffer = false;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_crm_applications");
      if (stored) {
        try {
          const parsedApps = JSON.parse(stored);
          crmAppsCount = parsedApps.filter((a: { status: string }) => a.status !== "Saved").length;
          crmHasOffer = parsedApps.some((a: { status: string }) => ["Offer Received", "Joined"].includes(a.status));
        } catch {}
      }
    }
    score += Math.min(crmAppsCount * 2, 10);
    if (crmHasOffer) {
      score += 15;
    }
    return Math.min(score, 100);
  })();

  const [liveReadinessScore, setLiveReadinessScore] = useState<number>(60);
  
  useEffect(() => {
    if (user) {
      import("@/lib/db/placement-readiness").then(({ getPlacementReadiness }) => {
        getPlacementReadiness(user.id).then(res => {
          if (res) setLiveReadinessScore(res.pri_score);
        });
      });
    } else {
      const stored = localStorage.getItem("placement_readiness_score");
      if (stored) {
        setLiveReadinessScore(parseInt(stored, 10) || 60);
      }
    }
  }, [user]);

  const handleTabTransition = (tabId: string) => {
    if (tabId === "placement-readiness") {
      router.push("/dashboard/placement-readiness");
    } else if (tabId === "placement-missions") {
      router.push("/dashboard/missions");
    } else if (tabId === "recommended") {
      router.push("/dashboard/recommended");
    } else if (tabId === "actions") {
      router.push("/dashboard/actions");
    } else if (tabId === "recruiters") {
      router.push("/dashboard/recruiters");
    } else if (tabId === "resume") {
      setActiveTab("resume-os");
      setResumeSubTab("ats");
    } else if (tabId === "enhancer") {
      setActiveTab("resume-os");
      setResumeSubTab("enhancer");
    } else if (tabId === "jd-match") {
      setActiveTab("resume-os");
      setResumeSubTab("jd-match");
    } else if (tabId === "builder") {
      setActiveTab("resume-os");
      setResumeSubTab("builder");
    } else if (tabId === "mentorship") {
      setActiveTab("mentorship-os");
    } else if (tabId === "community-hub" || tabId === "community") {
      router.push("/dashboard/community");
    } else if (tabId === "leaderboard") {
      router.push("/dashboard/leaderboard");
    } else if (tabId === "digest") {
      router.push("/dashboard/digest");
    } else if (tabId === "whatsapp-admin") {
      router.push("/admin/whatsapp");
    } else {
      setActiveTab(tabId);
    }
  };


  // Claim learning streak
  const handleClaimStreak = () => {
    if (streakClaimed) return;
    const newStreak = streakCount + 1;
    setStreakCount(newStreak);
    setStreakClaimed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("member_learning_streak", newStreak.toString());
      localStorage.setItem("member_claimed_today", "true");
    }
  };

  // Toggle checklist item
  const toggleGoal = (id: string) => {
    setCompletedGoals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };









  const updatePremiumStatus = async (status: boolean) => {
    setIsPremium(status);
    if (typeof window !== "undefined") {
      localStorage.setItem("member_is_premium", status.toString());
    }
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("raw_profile_data")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const rawData = profile?.raw_profile_data || {};
        const updatedPayload = {
          ...(typeof rawData === "object" ? rawData : {}),
          isPremium: status
        };
        await upsertUserProfile(user.id, updatedPayload);
      } catch (err) {
        console.error("Failed to sync premium status to database:", err);
      }
    }
  };

  // Toggle premium membership
  const togglePremiumPlan = async () => {
    await updatePremiumStatus(!isPremium);
    setShowCheckoutModal(false);
  };

  // Admin Actions
  const approveAdminRequest = (id: number) => {
    setAdminRequests(prev => prev.map(req => req.id === id ? { ...req, status: "Approved" } : req));
  };

  const deleteAdminRequest = (id: number) => {
    setAdminRequests(prev => prev.filter(req => req.id !== id));
  };

  // Navigation Items
  const menuItems = [
    { id: "dashboard", label: "My Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "placement-readiness", label: "Readiness Index (PRI)", icon: <Award className="w-5 h-5 text-emerald-600" /> },
    { id: "resume-os", label: "Resume OS", icon: <FileCheck className="w-5 h-5 text-indigo-500" /> },
    { id: "assessment-os", label: "Assessment OS", icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
    { id: "projects-os", label: "Project Advisor OS", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
    { id: "recommended", label: "Job Recommendations", icon: <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> },
    { id: "roadmap", label: "Career Roadmaps", icon: <Compass className="w-5 h-5 text-emerald-500" /> },
    { id: "company", label: "Company Preparation", icon: <Briefcase className="w-5 h-5 text-purple-500" /> },
    { id: "placement-tracker", label: "Placement Tracker OS", icon: <Layers className="w-5 h-5 text-teal-500" /> },
    { id: "recruiters", label: "Recruiter CRM", icon: <Users className="w-5 h-5 text-indigo-500" /> },
    { id: "placement-missions", label: "Missions Dashboard", icon: <Trophy className="w-5 h-5 text-amber-500" /> },
    { id: "actions", label: "Action Center", icon: <CalendarIcon className="w-5 h-5 text-rose-500" /> },
    { id: "portfolio-os", label: "Portfolio OS", icon: <Globe className="w-5 h-5 text-indigo-500" /> },
    { id: "linkedin-os", label: "LinkedIn OS", icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
    { id: "cover-letter-os", label: "Cover Letter OS", icon: <FileText className="w-5 h-5 text-indigo-500" /> },
    { id: "placement-copilot", label: "AI Placement Copilot", icon: <Bot className="w-5 h-5 text-indigo-500" /> },
    { id: "interview-prep", label: "AI Interview Prep", icon: <MessageSquare className="w-5 h-5 text-indigo-500" /> },
    { id: "mentorship-os", label: "Mentorship OS", icon: <CalendarIcon className="w-5 h-5 text-pink-500" /> },
    { id: "community-hub", label: "Community Hub OS", icon: <Users className="w-5 h-5 text-indigo-500" /> },
    { id: "membership", label: "Premium Plans", icon: <Award className="w-5 h-5 text-rose-500" /> },
    { id: "whatsapp-admin", label: "WhatsApp Campaigns", icon: <Send className="w-5 h-5 text-slate-500" />, adminOnly: true },
    { id: "admin", label: "Admin Console", icon: <ShieldCheck className="w-5 h-5 text-slate-500" />, adminOnly: true }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-405 font-black text-[10px] uppercase tracking-widest animate-pulse">Loading Placement OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row pb-20 font-sans">
      
      {/* Sidebar Controller */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col justify-between shrink-0">
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              B
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight text-lg">Placement OS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Mentorship</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map(item => {
              if (item.adminOnly && !isPremium) return null; // Admin console unlocked dynamically
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabTransition(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                    activeTab === item.id 
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Class of 2026</p>
              <p className="text-xs font-black text-slate-800 truncate mt-1">
                {user?.email?.split('@')[0] || "Placement Candidate"}
              </p>
            </div>
          </div>

          {isPremium ? (
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl text-center shadow-lg shadow-amber-200">
              👑 Pro Member Active
            </div>
          ) : (
            <button 
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg cursor-pointer"
            >
              🚀 Upgrade to Pro
            </button>
          )}
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="flex-grow p-6 lg:p-12 max-w-7xl mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {/* TAB 1: WORKSPACE DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* SECTION 1: HERO SECTION (Career Command Center HUD - Dark Slate Theme) */}
              <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] text-white space-y-6 shadow-xl relative overflow-hidden border border-slate-800">
                {/* Soft top-right blur circle and left glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute top-1/2 left-10 w-72 h-72 bg-purple-505/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start flex-wrap gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">CAREER OS // COMMAND DECK</h2>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-2 bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent font-display">
                      Welcome Back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </h1>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClaimStreak}
                      disabled={streakClaimed}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-mono",
                        streakClaimed
                          ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                          : "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-600 hover:to-yellow-600 shadow-md shadow-amber-250 cursor-pointer hover:scale-105 active:scale-95"
                      )}
                    >
                      {streakClaimed ? "Streak Claimed ✓" : "Claim Streak"}
                    </button>
                  </div>
                </div>

                {/* Level Up progress indicators */}
                <div className="relative z-10 bg-white/5 border border-white/10 p-5 rounded-3xl space-y-3 backdrop-blur-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-400 font-bold tracking-wider">LEVEL PROGRESSION</span>
                    <span className="font-mono text-indigo-400 font-black">Lvl {currentLevel} &rarr; Lvl {currentLevel + 1}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min((totalXp % 1000) / 10, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold font-mono">
                    <span>{totalXp % 1000} / 1000 XP</span>
                    <span className="text-indigo-400">{1000 - (totalXp % 1000)} XP to Next Level</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-6 border-t border-white/10 relative z-10 font-mono">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Target Role</span>
                    <strong className="text-sm font-black text-slate-200 block truncate">{targetRole}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Placement Rank</span>
                    <strong className="text-sm font-black text-slate-200 block">
                      {liveReadinessScore < 25 ? "Beginner" : liveReadinessScore < 45 ? "Apprentice" : liveReadinessScore < 60 ? "Architect" : liveReadinessScore < 75 ? "Expert" : "Ready"}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Readiness Index</span>
                    <strong className="text-sm font-black text-emerald-400 block">{liveReadinessScore}% PRI</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Total XP</span>
                    <strong className="text-sm font-black text-slate-200 block">{totalXp} XP</strong>
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Streak Count</span>
                    <strong className="text-sm font-black text-amber-500 block">🔥 {streakCount} Days</strong>
                  </div>
                </div>

                {/* Dynamic motivational quote banner */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-slate-350 relative z-10 flex items-center gap-3 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="leading-relaxed">
                    {(() => {
                      const motivationalMessages = [
                        `You are scoring higher than 82% of other candidates targeting ${targetRole} positions.`,
                        "Complete the daily DSA drill to boost your readiness metrics and unlock badge milestones.",
                        "Maintain your streak consistency rate to multiply mission rewards and level bonuses."
                      ];
                      return motivationalMessages[liveReadinessScore % motivationalMessages.length];
                    })()}
                  </span>
                </div>
              </div>

              {/* Main Command Center Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Actions & Journey */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* SECTION 2: TODAY'S FOCUS (Curated Interactive Cards) */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 font-display">🎯 Today's Placement Focus</h3>
                      <p className="text-slate-405 text-xs font-bold font-semibold">Perform high-priority sprints to gain points and build momentum.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Item 1: ATS */}
                      <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-white hover:to-white rounded-3xl border border-slate-200/60 hover:border-indigo-350 hover:shadow-md transition-all duration-300 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center text-lg font-black">
                            📝
                          </div>
                          <div>
                            <strong className="text-xs font-black text-slate-800 block group-hover:text-indigo-650 transition-colors">Improve ATS Score</strong>
                            <span className="text-[10px] text-indigo-500 font-bold block mt-0.5 font-mono">Potential PRI Gain: +5 PRI</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTabTransition("resume-os")}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-650 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 font-mono"
                        >
                          Run ATS Scan
                        </button>
                      </div>

                      {/* Item 2: DSA */}
                      <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-white hover:to-white rounded-3xl border border-slate-200/60 hover:border-amber-350 hover:shadow-md transition-all duration-300 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-black">
                            💻
                          </div>
                          <div>
                            <strong className="text-xs font-black text-slate-800 block group-hover:text-amber-600 transition-colors">Complete 1 DSA Challenge</strong>
                            <span className="text-[10px] text-amber-600 font-bold block mt-0.5 font-mono">Potential XP Gain: +15 XP</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTabTransition("assessment-os")}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-amber-650 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 font-mono"
                        >
                          Practice
                        </button>
                      </div>

                      {/* Item 3: Jobs */}
                      <div className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-white hover:to-white rounded-3xl border border-slate-200/60 hover:border-emerald-350 hover:shadow-md transition-all duration-300 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black">
                            💼
                          </div>
                          <div>
                            <strong className="text-xs font-black text-slate-800 block group-hover:text-emerald-600 transition-colors">Apply to 2 Relevant Jobs</strong>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 font-mono">Potential XP Gain: +20 XP</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTabTransition("recommended")}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-650 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 font-mono"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: CAREER JOURNEY (Connected Timeline Map) */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 font-display">🗺️ Career Journey Timeline</h3>
                      <p className="text-slate-400 text-xs font-bold font-semibold">Your dynamic pipeline status. Highlight active stage and map connectors.</p>
                    </div>

                    <div className="relative mt-4">
                      {/* Connected timeline progress pipe line background */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 hidden md:block" />

                      <div className="grid grid-cols-1 md:grid-cols-8 gap-6 md:gap-4 relative z-10">
                        {(() => {
                          const journeyStages = [
                            { name: "Beginner", score: 0 },
                            { name: "Resume Ready", score: 15 },
                            { name: "Portfolio Ready", score: 30 },
                            { name: "Project Ready", score: 45 },
                            { name: "Interview Ready", score: 60 },
                            { name: "Recruiter Ready", score: 75 },
                            { name: "Offer Ready", score: 90 },
                            { name: "Placed", score: 100 }
                          ];
                          const activeStageIndex = Math.min(Math.floor(liveReadinessScore / 13), journeyStages.length - 1);

                          return journeyStages.map((stage, i) => {
                            const isCompleted = i < activeStageIndex;
                            const isActive = i === activeStageIndex;
                            return (
                              <div
                                key={stage.name}
                                className="flex md:flex-col items-center gap-4 md:gap-0 text-left md:text-center group"
                              >
                                <div
                                  className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 md:mb-3 hover:scale-110",
                                    isActive
                                      ? "bg-indigo-650 border-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50 animate-pulse"
                                      : isCompleted
                                      ? "bg-emerald-500 border-emerald-600 text-white"
                                      : "bg-white border-slate-200 text-slate-350"
                                  )}
                                >
                                  {isCompleted ? (
                                    <span className="text-xs font-black">✓</span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-black">{i + 1}</span>
                                  )}
                                </div>
                                <div className="flex flex-col md:items-center">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wide",
                                    isActive
                                      ? "text-indigo-655 font-black"
                                      : isCompleted
                                      ? "text-emerald-600 font-black"
                                      : "text-slate-400 font-bold"
                                  )}>
                                    {stage.name}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-450 uppercase tracking-widest mt-0.5">
                                    {stage.score}% PRI
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 7: QUICK ACTION BAR (Floating Dock) */}
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                    <strong className="text-xs font-black text-slate-455 uppercase tracking-widest block font-mono">WORKSPACE COMMAND SHORTCUTS</strong>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { label: "Run ATS Scan", action: "resume-os", icon: <FileCheck className="w-3.5 h-3.5" /> },
                        { label: "Open CRM Pipeline", action: "placement-tracker", icon: <Layers className="w-3.5 h-3.5" /> },
                        { label: "Launch Mock Interview", action: "interview-prep", icon: <MessageSquare className="w-3.5 h-3.5" /> },
                        { label: "Open Project Advisor", action: "projects-os", icon: <Sparkles className="w-3.5 h-3.5" /> },
                        { label: "Interactive Roadmap", action: "roadmap", icon: <Compass className="w-3.5 h-3.5" /> },
                        { label: "Community Hub", action: "community", icon: <Users className="w-3.5 h-3.5" /> },
                        { label: "Book 1-on-1 Mentor", action: "mentorship-os", icon: <CalendarIcon className="w-3.5 h-3.5" /> }
                      ].map(btn => (
                        <button
                          key={btn.label}
                          onClick={() => handleTabTransition(btn.action)}
                          className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-indigo-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {btn.icon}
                          <span>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Snapshots & Achievements Vault */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* SECTION 3: PROGRESS SNAPSHOT (Graphical Double Track SVG Meters) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest leading-none font-mono">Progress Snapshot</h3>
                    
                    <div className="space-y-4">
                      {[
                        { label: "Resume Readiness", score: 80, color: "from-indigo-500 to-indigo-600" },
                        { label: "Project Readiness", score: 60, color: "from-blue-500 to-blue-600" },
                        { label: "Interview Readiness", score: 40, color: "from-amber-500 to-amber-600" },
                        { label: "Application Readiness", score: 20, color: "from-rose-500 to-rose-600" },
                        { label: "Networking Readiness", score: 30, color: "from-emerald-500 to-emerald-600" }
                      ].map(bar => (
                        <div key={bar.label} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-black text-slate-700">
                            <span>{bar.label}</span>
                            <span className="font-mono text-slate-455">{bar.score}%</span>
                          </div>
                          {/* Premium rounded gradient track */}
                          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-slate-200/50">
                            <div 
                              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", bar.color)} 
                              style={{ width: `${bar.score}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 5: STREAKS & ACHIEVEMENTS (Glassmorphic Vault) */}
                  <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest leading-none font-mono">Career Achievement Vault</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-2xl hover:border-indigo-150 transition-all hover:-translate-y-0.5 group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Streak</span>
                        <strong className="text-sm font-black text-slate-800 group-hover:text-indigo-650 transition-colors">🔥 {streakCount} Days</strong>
                      </div>
                      <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-2xl hover:border-indigo-150 transition-all hover:-translate-y-0.5 group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Missions</span>
                        <strong className="text-sm font-black text-slate-800 group-hover:text-indigo-650 transition-colors">🏆 {completedMissions} Done</strong>
                      </div>
                      <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-2xl hover:border-indigo-150 transition-all hover:-translate-y-0.5 group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Badges</span>
                        <strong className="text-sm font-black text-slate-800 group-hover:text-indigo-650 transition-colors">🎖 {totalBadges} Earned</strong>
                      </div>
                      <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-2xl hover:border-indigo-150 transition-all hover:-translate-y-0.5 group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">XP Multiplier</span>
                        <strong className="text-sm font-black text-slate-800 group-hover:text-indigo-650 transition-colors">⚡ {(1.0 + (streakCount * 0.1)).toFixed(1)}x</strong>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Recent Milestone Badges</span>
                      <ul className="space-y-2 text-xs font-semibold text-slate-655">
                        <li className="flex items-center gap-2 group hover:translate-x-0.5 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="group-hover:text-slate-900">ATS Optimizer Verified</span>
                        </li>
                        <li className="flex items-center gap-2 group hover:translate-x-0.5 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="group-hover:text-slate-900">Portfolio Live URL Generated</span>
                        </li>
                        <li className="flex items-center gap-2 group hover:translate-x-0.5 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="group-hover:text-slate-900">First Interview Prep Session Scheduled</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* SECTION 6: PLACEMENT MOMENTUM (LEDs & Sparklines) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest leading-none font-mono">Placement Momentum</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">7-DAY ACTIVITY MATRIX</span>
                        <div className="flex justify-between items-center gap-1.5">
                          {[
                            { day: "M", active: true },
                            { day: "T", active: true },
                            { day: "W", active: true },
                            { day: "T", active: false },
                            { day: "F", active: true },
                            { day: "S", active: true },
                            { day: "S", active: true }
                          ].map((act, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                              <span className="text-[9px] font-bold text-slate-400 font-mono">{act.day}</span>
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                                act.active
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                  : "bg-red-50/50 border-red-150 text-red-400"
                              )}>
                                {act.active ? "✓" : "✗"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SVG consistency Sparkline trend chart */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">CONSISTENCY PATTERN</span>
                        <div className="h-10 w-full bg-slate-50/60 rounded-xl p-1 border border-slate-100 flex items-center justify-center">
                          <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path
                              d="M0,15 Q15,5 30,12 T60,4 T90,14 L100,10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="stroke-indigo-500"
                            />
                            <path
                              d="M0,15 Q15,5 30,12 T60,4 T90,14 L100,10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="5"
                              strokeLinecap="round"
                              className="stroke-indigo-400/20 blur-[1px]"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 font-mono text-center">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Weekly</span>
                          <strong className="text-xs font-black text-slate-800">85% Consistency</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Monthly</span>
                          <strong className="text-xs font-black text-slate-800">72% Consistency</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: RESUME OS */}
          {activeTab === "resume-os" && (
            <motion.div
              key="resume-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ResumeOS onScoreUpdate={setAtsScore} subTab={resumeSubTab} onSubTabChange={setResumeSubTab} />
            </motion.div>
          )}

          {/* TAB: ASSESSMENT OS */}
          {activeTab === "assessment-os" && (
            <motion.div
              key="assessment-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AssessmentOS />
            </motion.div>
          )}

          {/* TAB: PORTFOLIO OS */}
          {activeTab === "portfolio-os" && (
            <motion.div
              key="portfolio-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <PortfolioOS />
            </motion.div>
          )}

          {/* TAB: AI INTERVIEW PREP */}
          {activeTab === "interview-prep" && (
            <motion.div
              key="interview-prep"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AiInterviewPrep />
            </motion.div>
          )}

          {/* TAB: PLACEMENT TRACKER OS */}
          {activeTab === "placement-tracker" && (
            <motion.div
              key="placement-tracker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <PlacementTrackerOS />
            </motion.div>
          )}

          {/* TAB: PLACEMENT COPILOT */}
          {activeTab === "placement-copilot" && (
            <motion.div
              key="placement-copilot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <PlacementCopilot
                activeTab={activeTab}
                setActiveTab={handleTabTransition}
                setResumeSubTab={setResumeSubTab}
                targetRole={targetRole}
                techStack={techStack}
              />
            </motion.div>
          )}

          {/* TAB 3: CAREER ROADMAPS */}
          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CareerRoadmapNavigator targetRole={targetRole} onRoleChange={setTargetRole} />
            </motion.div>
          )}

          {/* TAB 4: PROJECT ADVISOR OS */}
          {activeTab === "projects-os" && (
            <motion.div
              key="projects-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ProjectOS />
            </motion.div>
          )}

          {/* TAB 5: LINKEDIN OS */}
          {activeTab === "linkedin-os" && (
            <motion.div
              key="linkedin-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <LinkedInOS />
            </motion.div>
          )}

          {/* TAB: COVER LETTER OS */}
          {activeTab === "cover-letter-os" && (
            <motion.div
              key="cover-letter-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CoverLetterOS />
            </motion.div>
          )}

          {/* TAB 6: COMPANY-SPECIFIC PREPARATION */}
          {activeTab === "company" && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Briefcase className="w-3.5 h-3.5 fill-indigo-100" />
                  MNC Placement Playbooks
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Company Preparation OS
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Centralized ecosystem for top-tier hiring drives. Master dynamic selection rounds, practice OA simulations, and evaluate matching indices.
                </p>
              </div>

              {/* Company Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {COMPANY_PREP_LIST.map((company) => {
                  // Calculate dynamic company compatibility score
                  let compScore = 40; // base score
                  if (atsScore) {
                    compScore += Math.round(atsScore * 0.25);
                  } else {
                    compScore += 18;
                  }

                  // Local storage checklists
                  if (typeof window !== "undefined") {
                    const storedCheck = localStorage.getItem(`company_checklist_${company.slug}`);
                    if (storedCheck) {
                      try {
                        const parsed = JSON.parse(storedCheck);
                        const checkedCount = Object.values(parsed).filter(Boolean).length;
                        compScore += Math.min(checkedCount * 5, 20); // up to 20%
                      } catch {}
                    }
                  }

                  const finalCompScore = Math.min(compScore, 100);

                  // Unique custom gradient background colors per company slug
                  const gradients: Record<string, string> = {
                    google: "from-red-500 to-yellow-500 text-white",
                    microsoft: "from-blue-500 to-teal-500 text-white",
                    amazon: "from-orange-500 to-amber-600 text-white",
                    adobe: "from-red-600 to-rose-700 text-white",
                    salesforce: "from-sky-400 to-blue-600 text-white",
                    oracle: "from-red-700 to-stone-800 text-white",
                    ibm: "from-blue-600 to-indigo-800 text-white",
                    deloitte: "from-emerald-500 to-teal-700 text-white",
                    tcs: "from-indigo-500 to-purple-700 text-white",
                    infosys: "from-sky-500 to-indigo-600 text-white",
                    accenture: "from-purple-600 to-pink-700 text-white",
                    capgemini: "from-cyan-500 to-blue-700 text-white",
                    cognizant: "from-sky-600 to-slate-800 text-white",
                    wipro: "from-violet-500 to-fuchsia-600 text-white",
                    hcltech: "from-blue-600 to-slate-700 text-white",
                    "tech-mahindra": "from-rose-500 to-red-700 text-white"
                  };

                  const gradColor = gradients[company.slug] || "from-slate-700 to-slate-900 text-white";

                  return (
                    <div
                      key={company.slug}
                      className="bg-white border border-slate-200/60 rounded-[2rem] p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                    >
                      <div className="space-y-5">
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center font-black text-xl shadow-md", gradColor)}>
                            {company.name.charAt(0)}
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            company.difficulty === "Extreme"
                              ? "bg-rose-50 border-rose-100 text-rose-600"
                              : company.difficulty === "Hard"
                              ? "bg-amber-50 border-amber-100 text-amber-600"
                              : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                            {company.difficulty}
                          </span>
                        </div>

                        {/* Title and Overview */}
                        <div className="space-y-1">
                          <strong className="text-base font-black text-slate-800 group-hover:text-indigo-650 transition-colors block leading-tight">
                            {company.name} Prep OS
                          </strong>
                          <span className="text-[9px] text-slate-400 font-bold block">
                            Est. Salary: {company.salaryRange}
                          </span>
                        </div>

                        {/* Readiness Score Indicator */}
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Readiness Index</span>
                            <span className="text-slate-800 font-black">{finalCompScore}%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-650 h-full rounded-full transition-all duration-500"
                              style={{ width: `${finalCompScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats bullet list */}
                        <div className="space-y-1 pt-1 text-[10px] text-slate-500 font-bold leading-normal">
                          <p>• {company.activeRounds} Interview Rounds</p>
                          <p>• Cutoff threshold: {company.oaPattern.cutoff}</p>
                          <p>• Expected prep: {company.prepTime}</p>
                        </div>
                      </div>

                      {/* Launch Trigger Link */}
                      <div className="pt-5 mt-5 border-t border-slate-100">
                        <Link
                          href={`/company-prep/${company.slug}`}
                          className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Launch Prep OS</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 7: MENTORSHIP OS */}
          {activeTab === "mentorship-os" && (
            <motion.div
              key="mentorship-os"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <MentorshipOS />
            </motion.div>
          )}



          {/* TAB 7.6: COMMUNITY HUB OS */}
          {activeTab === "community-hub" && (
            <motion.div
              key="community-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CommunityHubOS />
            </motion.div>
          )}

          {/* TAB 8: PREMIUM PLANS MATRIX */}
          {activeTab === "membership" && (
            <motion.div
              key="membership"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12 animate-fade-in"
            >
              <div className="max-w-3xl space-y-4 text-center mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5 fill-rose-100" />
                  Premium Placement Suite
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Choose Your Career Plan
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
                  Unlock deep ATS scanners, visual interactive roadmaps, 1-on-1 session bookings, and company interview playbooks.
                </p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Free tier</span>
                      <h3 className="text-3xl font-black text-slate-800">Basic Updates</h3>
                    </div>

                    <div className="text-4xl font-black text-slate-900">
                      $0 <span className="text-xs font-bold text-slate-400">/ forever</span>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-100">
                      {[
                        "Basic off-campus job list",
                        "Static preparation hub roadmap view",
                        "Limited mock ATS review",
                        "Community Discord links"
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                          <CheckCircle className="w-4 h-4 text-slate-400" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={!isPremium} 
                    onClick={() => {
                      updatePremiumStatus(false);
                    }}
                    className={cn(
                      "w-full mt-10 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer border text-center",
                      !isPremium 
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {!isPremium ? "Free Active" : "Downgrade to Free"}
                  </button>
                </div>

                {/* Pro Premium Plan */}
                <div className="bg-slate-950 p-10 rounded-[3rem] border border-indigo-900 shadow-xl shadow-indigo-900/10 text-white flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                     Most Popular
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ultimate access</span>
                      <h3 className="text-3xl font-black text-white">BuggedBrain Pro</h3>
                    </div>

                    <div className="text-4xl font-black text-white">
                      $19 <span className="text-xs font-bold text-slate-400">/ month</span>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/10">
                      {[
                        "Unlimited simulated ATS resume scans",
                        "Connected active roadmap flowchart tracking",
                        "Unlimited 1-to-1 mentorship bookings",
                        "Company-specific coding test preparation",
                        "Premium custom projects list recommendations",
                        "Access to private Admin testing console"
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isPremium) {
                        updatePremiumStatus(false);
                      } else {
                        setShowCheckoutModal(true);
                      }
                    }}
                    className={cn(
                      "w-full mt-10 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer text-center",
                      isPremium 
                        ? "bg-white/10 border border-white/20 text-white hover:bg-white/20" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20"
                    )}
                  >
                    {isPremium ? "Pro Active (Cancel)" : "Unlock Pro Access"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 9: ADMIN CONTROL PANEL (Locked to Pro Premium members for simulated verification) */}
          {activeTab === "admin" && isPremium && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Developer Admin console
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Placement Administration
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Manage student placement requests, verify mock interview bookings, and override system features.
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Active Student Profiles", value: "1,240" },
                  { label: "Mock Review Requests", value: adminRequests.filter(r => r.status === "Pending").length, highlight: true },
                  { label: "Booked Mentorship Hours", value: "48 Hrs" },
                  { label: "Premium Pro Users", value: "215" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className={cn("text-3xl font-black", stat.highlight ? "text-indigo-600" : "text-slate-800")}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Student mentorship approval list */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 font-display">Active Mentorship Requests</h3>
                
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Request Topic</th>
                        <th className="px-6 py-4">Approval Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                      {adminRequests.map(req => (
                        <tr key={req.id}>
                          <td className="px-6 py-4">{req.student}</td>
                          <td className="px-6 py-4">{req.type}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded",
                              req.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {req.status === "Pending" && (
                              <button 
                                onClick={() => approveAdminRequest(req.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            <button 
                              onClick={() => deleteAdminRequest(req.id)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BuggedBrain Placement CRM Global Aggregates (Admin Console) */}
              {adminStats && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block font-mono">📊 CRM Aggregates Console</span>
                    <h3 className="text-xl font-black text-slate-900 font-display">System-wide Analytics Dashboard</h3>
                    <p className="text-slate-500 font-semibold text-xs">Anonymized statistics aggregated across all active student application cards.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 border border-slate-150 rounded-3xl text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Applications Tracked</span>
                      <strong className="text-4xl font-black text-slate-800 block mt-2">{adminStats.totalApplications}</strong>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">Global submissions</span>
                    </div>

                    <div className="bg-slate-50 p-6 border border-slate-150 rounded-3xl text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Active Users</span>
                      <strong className="text-4xl font-black text-indigo-650 block mt-2">{adminStats.totalActiveUsers}</strong>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">Unique candidate pipes</span>
                    </div>

                    <div className="bg-slate-50 p-6 border border-slate-150 rounded-3xl text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Offer Rate</span>
                      <strong className="text-4xl font-black text-emerald-600 block mt-2">{adminStats.averageOfferRate}%</strong>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">Aggregate conversion rate</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Top Companies */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Most Applied Companies</span>
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 divide-y divide-slate-100 font-semibold text-xs text-slate-650">
                        {adminStats.mostAppliedCompanies.map((c, idx) => (
                          <div key={idx} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                            <span className="text-slate-800">{idx + 1}. {c.company}</span>
                            <span className="text-slate-500">{c.count} applications</span>
                          </div>
                        ))}
                        {adminStats.mostAppliedCompanies.length === 0 && (
                          <div className="py-2 text-slate-400 font-bold text-center">No companies logged yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Top Roles */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Most Popular Roles</span>
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 divide-y divide-slate-100 font-semibold text-xs text-slate-650">
                        {adminStats.mostPopularRoles.map((r, idx) => (
                          <div key={idx} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                            <span className="text-slate-800">{idx + 1}. {r.role}</span>
                            <span className="text-slate-500">{r.count} students</span>
                          </div>
                        ))}
                        {adminStats.mostPopularRoles.length === 0 && (
                          <div className="py-2 text-slate-400 font-bold text-center">No roles logged yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Simulated Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Sparkles className="w-6 h-6 fill-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display">Upgrade to Pro</h3>
              <p className="text-slate-500 font-medium text-sm">Unlock immediate simulated ATS review, project advisors & mentorship coaching.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-bold text-slate-600">
               <div className="flex justify-between">
                 <span>Pro Subscription (Monthly)</span>
                 <span className="text-slate-950 font-black">$19.00</span>
               </div>
               <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900">
                 <span>Total Today</span>
                 <span className="text-indigo-600 font-black">$19.00</span>
               </div>
            </div>

            <button 
              onClick={togglePremiumPlan}
              className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
            >
              Simulate Secure Checkout Payment
            </button>

            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="w-full py-3 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
