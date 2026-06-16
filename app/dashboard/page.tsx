"use client";

import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import ResumeOS from "@/components/ResumeOS";
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
  Send
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

  // Parse URL tab parameter helper for lazy initializers
  const getInitialActiveTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        if (["resume", "enhancer", "jd-match", "builder"].includes(tabParam)) {
          return "resume-os";
        }
        if (tabParam === "projects") {
          return "projects-os";
        }
        if (tabParam === "mentorship") {
          return "mentorship-os";
        }
        return tabParam;
      }
    }
    return "dashboard";
  };

  const getInitialResumeSubTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        if (tabParam === "resume") return "ats";
        if (tabParam === "enhancer") return "enhancer";
        if (tabParam === "jd-match") return "jd-match";
        if (tabParam === "builder") return "builder";
      }
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab);

  // Premium Membership State (Simulated)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("member_is_premium") === "true";
    }
    return false;
  });
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Profile Customization & Skill states
  const [targetRole, setTargetRole] = useState<string>("Software Developer");
  const [techStack, setTechStack] = useState<string>("React, Node.js, TypeScript");
  
  // Streak counter (Simulated & Persisted)
  const [streakCount, setStreakCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("member_learning_streak") || "3");
    }
    return 3;
  });
  const [streakClaimed, setStreakClaimed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("member_claimed_today") === "true";
    }
    return false;
  });

  // Resume Analyzer States
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [resumeSubTab, setResumeSubTab] = useState<string>(getInitialResumeSubTab);

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
        if (!profile || !profile.onboarding_completed || (profile.profile_completion !== undefined && profile.profile_completion < 50)) {
          router.push("/onboarding");
        } else {
          if (profile.target_role) setTargetRole(profile.target_role);
          if (profile.skills) setTechStack(profile.skills.join(", "));
          
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









  // Toggle premium membership
  const togglePremiumPlan = () => {
    const newState = !isPremium;
    setIsPremium(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("member_is_premium", newState.toString());
    }
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
    { id: "placement-missions", label: "Missions Dashboard", icon: <Trophy className="w-5 h-5 text-amber-500" /> },
    { id: "placement-copilot", label: "AI Placement Copilot", icon: <Bot className="w-5 h-5 text-indigo-500" /> },
    { id: "recommended", label: "Job Recommendations", icon: <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> },
    { id: "actions", label: "Action Center", icon: <CalendarIcon className="w-5 h-5 text-rose-500" /> },
    { id: "resume-os", label: "Resume OS", icon: <FileCheck className="w-5 h-5 text-indigo-500" /> },
    { id: "portfolio-os", label: "Portfolio OS", icon: <Globe className="w-5 h-5 text-indigo-500" /> },
    { id: "linkedin-os", label: "LinkedIn OS", icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
    { id: "cover-letter-os", label: "Cover Letter OS", icon: <FileText className="w-5 h-5 text-indigo-500" /> },
    { id: "recruiters", label: "Recruiter CRM", icon: <Users className="w-5 h-5 text-indigo-500" /> },
    { id: "placement-tracker", label: "Placement Tracker OS", icon: <Layers className="w-5 h-5 text-teal-500" /> },
    { id: "roadmap", label: "Career Roadmaps", icon: <Compass className="w-5 h-5 text-emerald-500" /> },
    { id: "projects-os", label: "Project Advisor OS", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
    { id: "company", label: "Company Preparation", icon: <Briefcase className="w-5 h-5 text-purple-500" /> },
    { id: "interview-prep", label: "AI Interview Prep", icon: <MessageSquare className="w-5 h-5 text-indigo-500" /> },
    { id: "mentorship-os", label: "Mentorship OS", icon: <CalendarIcon className="w-5 h-5 text-pink-500" /> },
    { id: "community-hub", label: "Community Hub OS", icon: <Users className="w-5 h-5 text-indigo-500" /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5 text-amber-500" /> },
    { id: "digest", label: "Daily Digest", icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
    { id: "membership", label: "Premium Plans", icon: <Award className="w-5 h-5 text-rose-500" /> },
    { id: "whatsapp-admin", label: "WhatsApp Campaigns", icon: <Send className="w-5 h-5 text-slate-500" />, adminOnly: true },
    { id: "admin", label: "Admin Console", icon: <ShieldCheck className="w-5 h-5 text-slate-500" />, adminOnly: true }
  ];

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
              className="space-y-12"
            >
              {/* Profile Header card */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
                    Career Workspace
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                    Welcome Back, <span className="text-accent">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Graduate"}!</span>
                  </h1>
                  <p className="text-slate-500 font-medium max-w-xl text-base leading-relaxed">
                    Target Role: <strong className="text-slate-800">{targetRole}</strong> • Tech Stack: <strong className="text-slate-800">{techStack}</strong>
                  </p>
                </div>

                {/* Streak Panel */}
                <div className="flex items-center gap-4 p-6 bg-amber-50/50 rounded-3xl border border-amber-100 relative overflow-hidden shrink-0">
                  <div className="text-4xl">🔥</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Learning Streak</p>
                    <p className="text-lg font-black text-slate-900">{streakCount} Days Active</p>
                    <button
                      onClick={handleClaimStreak}
                      disabled={streakClaimed}
                      className={cn(
                        "mt-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                        streakClaimed 
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200"
                      )}
                    >
                      {streakClaimed ? "Streak Claimed ✓" : "Claim Streak"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* Visual circular progress index */}
                 <Link 
                   href="/dashboard/placement-readiness" 
                   className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer w-full"
                 >
                   <div className="space-y-2 text-left">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Placement Readiness Index</p>
                     <p className="text-xs text-slate-400 font-bold max-w-[150px]">Mark roadmap items and goals as complete to increase score.</p>
                   </div>
                   <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                       <circle cx="48" cy="48" r="38" className="text-emerald-600" strokeWidth="8" stroke="currentColor" fill="transparent"
                         strokeDasharray={2 * Math.PI * 38}
                         strokeDashoffset={2 * Math.PI * 38 * (1 - liveReadinessScore / 100)} 
                         strokeLinecap="round"
                       />
                     </svg>
                     <span className="absolute text-xl font-black text-slate-900">{liveReadinessScore}%</span>
                   </div>
                 </Link>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saved Opportunities</p>
                    <p className="text-4xl font-black text-slate-900 font-display">{savedJobs.length} Jobs</p>
                    <Link href="/saved" className="inline-flex items-center gap-1 text-[10px] font-black text-accent uppercase tracking-widest mt-2 hover:underline">
                      View Saved <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>

                {/* Gamified Placement level */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentorship Status</p>
                    <p className="text-xl font-black text-slate-100">
                      {bookings.length > 0 ? `${bookings.length} Session Booked` : "No sessions booked"}
                    </p>
                    <button 
                      onClick={() => handleTabTransition("mentorship")} 
                      className="mt-2 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1 text-left"
                    >
                      Book 1-on-1 Mentorship <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-14 h-14 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Checklist & Profile Customizer Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Profile Customizer */}
                <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Target Path Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Career Role</label>
                      <select 
                        value={targetRole}
                        onChange={(e) => handleUpdateTargetSettings(e.target.value, techStack)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {TARGET_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Core Tech Stack</label>
                      <input 
                        type="text" 
                        value={techStack} 
                        onChange={(e) => handleUpdateTargetSettings(targetRole, e.target.value)}
                        placeholder="React, Node.js, Python"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-2">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Streaks & Badges</p>
                     <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">🔥 Placer Streak</span>
                        <span className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">🏅 ATS Architect</span>
                        <span className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">⚡ Ready-to-Hire</span>
                     </div>
                  </div>
                </div>

                {/* Daily Goals */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Daily Career Goals</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(onboardingTasks.length > 0 
                      ? onboardingTasks.map((t, idx) => ({ id: `goal-${idx}`, text: t }))
                      : [
                          { id: "goal-1", text: "Create / scan ATS-friendly Resume" },
                          { id: "goal-2", text: "Practice 1 DSA problem round" },
                          { id: "goal-3", text: "Complete 1 Section in Roadmap" },
                          { id: "goal-4", text: "Review Deloitte/IBM prep questions" }
                        ]
                    ).map(goal => (
                      <div 
                        key={goal.id} 
                        onClick={() => toggleGoal(goal.id)}
                        className={cn(
                          "p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none",
                          completedGoals[goal.id] 
                            ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                        )}
                      >
                        <span className="text-sm font-semibold">{goal.text}</span>
                        {completedGoals[goal.id] ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-900 p-6 rounded-[2rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Placement Mentor</p>
                      <h4 className="text-lg font-black font-display">Need specialized assistance with your resume?</h4>
                    </div>
                    <button 
                      onClick={() => handleTabTransition("resume")}
                      className="px-6 py-3 bg-white text-indigo-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shrink-0 cursor-pointer shadow-lg"
                    >
                      Run ATS Analyzer
                    </button>
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
                      setIsPremium(false);
                      localStorage.setItem("member_is_premium", "false");
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
                        setIsPremium(false);
                        localStorage.setItem("member_is_premium", "false");
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
