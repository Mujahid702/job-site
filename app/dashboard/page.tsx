"use client";

import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import JobCard from "@/components/JobCard";
import AtsResumeAnalyzer from "@/components/AtsResumeAnalyzer";
import { 
  LayoutDashboard, 
  Heart, 
  Briefcase, 
  CheckCircle2, 
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  Award,
  AlertTriangle,
  UploadCloud,
  FileText,
  HelpCircle,
  ShieldCheck,
  Calendar as CalendarIcon,
  MessageSquare,
  Lock,
  Zap,
  Star,
  Users,
  Compass,
  ArrowRight,
  CheckCircle,
  FileCheck
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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

const COMPANIES = [
  { name: "Deloitte", rounds: ["Online Cognitive Test", "Technical Interview", "Partner Round"], time: "2-3 Weeks" },
  { name: "IBM", rounds: ["Coding Test (HackerRank)", "Technical Interview", "Managerial & HR Round"], time: "3-4 Weeks" },
  { name: "TCS", rounds: ["NQT Aptitude Exam", "Technical Interview", "HR Round"], time: "4 Weeks" },
  { name: "Accenture", rounds: ["Cognitive & Technical Assessment", "Communication Test", "HR Interview"], time: "2 Weeks" },
  { name: "Wipro", rounds: ["Aptitude & Coding Test", "Technical Round", "HR Round"], time: "3 Weeks" },
  { name: "Capgemini", rounds: ["Pseudo-code & Aptitude Test", "Technical Round", "HR Interview"], time: "3 Weeks" },
  { name: "Cognizant", rounds: ["Aptitude & Technical MCQ", "Technical Interview", "HR Round"], time: "3-4 Weeks" }
];

export default function DashboardPage() {
  const { savedJobs } = useSavedJobs();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const supabase = createClient();

  // Premium Membership State (Simulated)
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Profile Customization & Skill states
  const [targetRole, setTargetRole] = useState<string>("Software Developer");
  const [techStack, setTechStack] = useState<string>("React, Node.js, TypeScript");
  
  // Streak counter (Simulated & Persisted)
  const [streakCount, setStreakCount] = useState<number>(3);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);

  // Placement Readiness Index Metrics (Dynamically Calculated)
  const [readinessScore, setReadinessScore] = useState<number>(45);

  // Resume Analyzer States
  const [atsScore, setAtsScore] = useState<number | null>(null);

  // Checklists (Interactive items)
  const [completedGoals, setCompletedGoals] = useState<Record<string, boolean>>({
    "goal-1": true,
    "goal-2": false,
    "goal-3": false,
    "goal-4": false
  });

  const [completedRoadmapSteps, setCompletedRoadmapSteps] = useState<Record<string, boolean>>({
    "step-1": true,
    "step-2": false,
    "step-3": false,
    "step-4": false
  });

  const [linkedinChecklist, setLinkedinChecklist] = useState<Record<string, boolean>>({
    "li-1": false,
    "li-2": false,
    "li-3": false,
    "li-4": false
  });

  // Mentorship Bookings States
  const [bookings, setBookings] = useState<any[]>([
    { id: 1, type: "Resume Review", date: "2026-06-10", time: "11:00 AM", status: "Approved" }
  ]);
  const [bookingType, setBookingType] = useState<string>("Resume Review");
  const [bookingDate, setBookingDate] = useState<string>("2026-06-12");
  const [bookingTime, setBookingTime] = useState<string>("03:00 PM");

  // Project Filter
  const [projectDifficulty, setProjectDifficulty] = useState<string>("all");

  // Company selected
  const [selectedCompany, setSelectedCompany] = useState<string>("Deloitte");

  // Admin Mock Database
  const [adminRequests, setAdminRequests] = useState<any[]>([
    { id: 101, student: "Amit Sharma", type: "Mock Interview", status: "Pending" },
    { id: 102, student: "Rohan Varma", type: "Resume Review", status: "Approved" }
  ]);

  useEffect(() => {
    // Load persisted values
    if (typeof window !== "undefined") {
      const savedPremium = localStorage.getItem("member_is_premium") === "true";
      setIsPremium(savedPremium);
      
      const savedStreak = parseInt(localStorage.getItem("member_learning_streak") || "5");
      setStreakCount(savedStreak);

      const savedClaimed = localStorage.getItem("member_claimed_today") === "true";
      setStreakClaimed(savedClaimed);
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Update dynamic readiness score based on actions
  useEffect(() => {
    let score = 30;
    // Streak contribution
    score += Math.min(streakCount * 3, 20);
    // Goals checked
    const checkedGoals = Object.values(completedGoals).filter(Boolean).length;
    score += checkedGoals * 5;
    // Roadmap checked
    const checkedSteps = Object.values(completedRoadmapSteps).filter(Boolean).length;
    score += checkedSteps * 8;
    // ATS Scan contribution
    if (atsScore) {
      score += Math.round(atsScore * 0.25);
    }
    // Limit to 100
    setReadinessScore(Math.min(score, 100));
  }, [completedGoals, completedRoadmapSteps, streakCount, atsScore]);

  // Handle URL tabs query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

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

  const toggleRoadmapStep = (id: string) => {
    setCompletedRoadmapSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleLinkedIn = (id: string) => {
    setLinkedinChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };



  // Book placement slot
  const bookMentorshipSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = {
      id: Date.now(),
      type: bookingType,
      date: bookingDate,
      time: bookingTime,
      status: "Approved" // Instant approval for visual delight
    };
    setBookings(prev => [...prev, newBooking]);
    alert(`Success! Your 1-to-1 ${bookingType} session has been confirmed.`);
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
    { id: "resume", label: "ATS Resume Analyzer", icon: <FileCheck className="w-5 h-5 text-indigo-500" /> },
    { id: "roadmap", label: "Career Roadmaps", icon: <Compass className="w-5 h-5 text-emerald-500" /> },
    { id: "projects", label: "Smart Project Advisor", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
    { id: "linkedin", label: "LinkedIn Optimizer", icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
    { id: "company", label: "Company Preparation", icon: <Briefcase className="w-5 h-5 text-purple-500" /> },
    { id: "mentorship", label: "Mentorship Booking", icon: <CalendarIcon className="w-5 h-5 text-pink-500" /> },
    { id: "membership", label: "Premium Plans", icon: <Award className="w-5 h-5 text-rose-500" /> },
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
                  onClick={() => setActiveTab(item.id)}
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
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Placement Readiness Index</p>
                    <p className="text-xs text-slate-400 font-bold max-w-[150px]">Mark roadmap items and goals as complete to increase score.</p>
                  </div>
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                      <circle cx="48" cy="48" r="38" className="text-indigo-600" strokeWidth="8" stroke="currentColor" fill="transparent"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - readinessScore / 100)} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-slate-900">{readinessScore}%</span>
                  </div>
                </div>

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
                      onClick={() => setActiveTab("mentorship")} 
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
                        onChange={(e) => setTargetRole(e.target.value)}
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
                        onChange={(e) => setTechStack(e.target.value)}
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
                    {[
                      { id: "goal-1", text: "Create / scan ATS-friendly Resume" },
                      { id: "goal-2", text: "Practice 1 DSA problem round" },
                      { id: "goal-3", text: "Complete 1 Section in Roadmap" },
                      { id: "goal-4", text: "Review Deloitte/IBM prep questions" }
                    ].map(goal => (
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
                      onClick={() => setActiveTab("resume")}
                      className="px-6 py-3 bg-white text-indigo-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shrink-0 cursor-pointer shadow-lg"
                    >
                      Run ATS Analyzer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ATS RESUME ANALYZER */}
          {activeTab === "resume" && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AtsResumeAnalyzer onScoreUpdate={setAtsScore} />
            </motion.div>
          )}

          {/* TAB 3: CAREER ROADMAPS */}
          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Compass className="w-3.5 h-3.5 fill-indigo-100" />
                  Role-Based Learning Paths
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Connected Learning Roadmaps
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Step-by-step career sequences with progress tracking to take you from a confused beginner to a placement-ready candidate.
                </p>
              </div>

              {/* Target Role details and Flowchart */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-100/50 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Role Roadmap</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{targetRole} Path</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Change Target Role:</span>
                    <select 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TARGET_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timeline and flowchart flow */}
                <div className="relative border-l-2 border-indigo-100 ml-4 pl-8 space-y-12 py-4">
                  {[
                    {
                      id: "step-1",
                      level: "Phase 1: Beginner (Programming Basics)",
                      duration: "Week 1",
                      title: "Programming Fundamentals & Tech Foundations",
                      items: ["Core Syntax & Variables", "Control Flows (Loops, Conditionals)", "Functions & Recursions", "Basic Complexity Analysis"]
                    },
                    {
                      id: "step-2",
                      level: "Phase 2: Intermediate (DSA & Frameworks)",
                      duration: "Week 2-3",
                      title: "Advanced Arrays, Strings & Dynamic Web Frameworks",
                      items: ["Object-Oriented Programming", "Array Traversal & Sorting", "RESTful API Integration", "State Management & React Routing"]
                    },
                    {
                      id: "step-3",
                      level: "Phase 3: Advanced (System Architectures)",
                      duration: "Week 4",
                      title: "System Design, Databases & Scalable Architecture",
                      items: ["SQL Schema Design", "Index Caching & Performance", "REST APIs vs GraphQL", "Basic Cloud Server Deployment"]
                    },
                    {
                      id: "step-4",
                      level: "Phase 4: Placement Preparation",
                      duration: "Interview Prep",
                      title: "Recruiters Targeting, Resume ATS, & Mock Interviews",
                      items: ["ATS Resume Scans & Edits", "Deloitte/IBM Aptitude Practice", "1-on-1 Mentorship Strategy Session", "Behavioral HR Mock Round"]
                    }
                  ].map((phase, idx) => (
                    <div key={phase.id} className="relative group">
                      
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 border-white shadow flex items-center justify-center transition-all",
                        completedRoadmapSteps[phase.id] ? "bg-indigo-600" : "bg-slate-300"
                      )} />

                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group-hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                              {phase.level}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{phase.duration}</span>
                          </div>
                          <h4 className="text-lg font-black text-slate-800">{phase.title}</h4>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500 pt-2">
                            {phase.items.map((item, itemIdx) => (
                              <span key={itemIdx} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive toggle */}
                        <button
                          onClick={() => toggleRoadmapStep(phase.id)}
                          className={cn(
                            "px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 cursor-pointer self-start md:self-center",
                            completedRoadmapSteps[phase.id]
                              ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                              : "bg-slate-900 text-white hover:bg-indigo-600 shadow-md shadow-indigo-100"
                          )}
                        >
                          {completedRoadmapSteps[phase.id] ? "Completed ✓" : "Mark Complete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: SMART PROJECT ADVISOR */}
          {activeTab === "projects" && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
                  Smart Recommendation Engine
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Project Recommendations
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Build impressive developer projects customized to your target role: <strong className="text-slate-800">{targetRole}</strong>. Boost your resume impact index instantly.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 pb-2">
                {[
                  { id: "all", label: "All Suggestions" },
                  { id: "beginner", label: "Beginner Projects" },
                  { id: "intermediate", label: "Intermediate Projects" },
                  { id: "advanced", label: "Advanced Projects" },
                  { id: "hackathon", label: "Hackathon-Ready Ideas" }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setProjectDifficulty(filter.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer border",
                      projectDifficulty === filter.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Real-time Collaborative Whiteboard",
                    role: "Software Developer",
                    difficulty: "intermediate",
                    impact: "88%",
                    attractiveness: "High",
                    tech: "WebSocket, React, Node.js, Canvas API",
                    desc: "An interactive workspace allowing multi-user drawing, chat, and sticky notes with sub-second synchronization. Excellent to showcase concurrent network streams."
                  },
                  {
                    title: "Serverless E-Commerce Gateway",
                    role: "Software Developer",
                    difficulty: "advanced",
                    impact: "94%",
                    attractiveness: "Extreme",
                    tech: "AWS Lambda, TypeScript, Redis, DynamoDB",
                    desc: "Cloud-native payment checkout pipeline simulating flash sale inventory locks using Redis. Demonstrates distributed systems knowledge to FAANG recruiters."
                  },
                  {
                    title: "Automated Financial Tracker dashboard",
                    role: "Software Developer",
                    difficulty: "beginner",
                    impact: "70%",
                    attractiveness: "Moderate",
                    tech: "React, Chart.js, Express, PostgreSQL",
                    desc: "A neat dashboard tracking family expense indices and visualizing historical budgets. Highlights clean UI design and standard DB schema mapping."
                  },
                  {
                    title: "Placement Predictive Analytics Engine",
                    role: "Data Analyst",
                    difficulty: "intermediate",
                    impact: "85%",
                    attractiveness: "High",
                    tech: "Python, Pandas, Streamlit, Scikit-learn",
                    desc: "Data tool parsing college placement metrics to predict student hiring categories based on test ranks and backlogs. Visualized as interactive map plots."
                  },
                  {
                    title: "Decentralized Voting Ledger",
                    role: "Software Developer",
                    difficulty: "hackathon",
                    impact: "90%",
                    attractiveness: "High",
                    tech: "Ethereum, Solidity, Web3.js, React",
                    desc: "Tamper-proof voting system built for college elections to secure identity checks and ballot counting. Great for hackathon highlight portfolios."
                  }
                ].filter(p => {
                  if (projectDifficulty === "all") return true;
                  return p.difficulty === projectDifficulty;
                }).map((proj, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all group">
                    <div className="space-y-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                          {proj.difficulty}
                        </span>
                        <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Impact: <strong className="text-slate-800 font-black">{proj.impact}</strong></span>
                          <span>•</span>
                          <span>Attractiveness: <strong className="text-indigo-600 font-black">{proj.attractiveness}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {proj.title}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{proj.tech}</p>
                      </div>

                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{proj.desc}</p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recruiter Attractiveness Index</span>
                       <div className="flex gap-1">
                          {[1,2,3,4].map(starIdx => (
                            <Star key={starIdx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <Star className="w-3.5 h-3.5 text-slate-200" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 5: LINKEDIN OPTIMIZER */}
          {activeTab === "linkedin" && (
            <motion.div
              key="linkedin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <TrendingUp className="w-3.5 h-3.5 fill-indigo-100" />
                  Recruiter Visibility Suite
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  LinkedIn Optimization
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Construct a high-ranking student profile to catch the eye of tech recruiters. Generate search-optimized summaries and track profile strengths.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Profile optimizations generator */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Copywriting Generator</h3>
                  
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search-Optimized Headline Suggestion</p>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                        <p className="text-sm font-bold text-slate-800">
                          {targetRole} | {techStack} | Aspiring Placement Candidate 2026 | Open Source Enthusiast
                        </p>
                     </div>

                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Generated "About Me" Section</p>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative text-slate-600 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                       "Passionate computer science graduate targeting {targetRole} placements. Experienced in building full-stack applications with {techStack}.\n\nDeeply interested in software engineering, API development, and distributed systems. Starred on GitHub for open-source widgets. Open to freshers off-campus hiring drives."
                     </div>
                  </div>
                </div>

                {/* Profile Strength Checklist */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Recruiter Visibility Checklist</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: "li-1", text: "Professional profile picture & banner" },
                      { id: "li-2", text: "Include GitHub links in Contact info" },
                      { id: "li-3", text: "Toggle 'Open To Work' visible to recruiters" },
                      { id: "li-4", text: "Post project demo videos (High Engagement)" }
                    ].map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleLinkedIn(item.id)}
                        className={cn(
                          "p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none",
                          linkedinChecklist[item.id] 
                            ? "bg-blue-50/50 border-blue-200 text-blue-900 font-bold"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                        )}
                      >
                        <span className="text-sm font-semibold">{item.text}</span>
                        {linkedinChecklist[item.id] ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Recruiter visibility rank</span>
                    <span className="text-blue-600 uppercase tracking-widest font-black">Medium-High</span>
                  </div>
                </div>
              </div>
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
                  Company Placement Playbook
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Master specific selection processes, typical interview questions, and prep tips tailored directly for top companies.
                </p>
              </div>

              {/* Pick Company tabs */}
              <div className="flex flex-wrap gap-2 pb-2">
                {COMPANIES.map(company => (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company.name)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border",
                      selectedCompany === company.name
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    {company.name}
                  </button>
                ))}
              </div>

              {/* Company Details view */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-100/50 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Guide</p>
                     <h3 className="text-3xl font-black text-slate-900 font-display">{selectedCompany}</h3>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                      Process timeline: {COMPANIES.find(c => c.name === selectedCompany)?.time || "2 Weeks"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Hiring process flowchart */}
                  <div className="lg:col-span-5 space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Recruitment Process</p>
                    <div className="space-y-4">
                      {COMPANIES.find(c => c.name === selectedCompany)?.rounds.map((round, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">
                             {index + 1}
                           </div>
                           <span className="text-sm font-bold text-slate-700">{round}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typical questions & tips */}
                  <div className="lg:col-span-7 space-y-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typical Placement Questions & Tips</p>
                     <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                        <div>
                          <strong className="text-sm font-black text-slate-800 block">Coding Pattern:</strong>
                          <p className="text-xs text-slate-500 font-medium">Focus heavily on Array reversals, SQL Joins, and HashMap checks.</p>
                        </div>
                        <div>
                          <strong className="text-sm font-black text-slate-800 block">Preferred Project:</strong>
                          <p className="text-xs text-slate-500 font-medium">Full-stack REST API dashboard showing DB CRUD logic and clean layouts.</p>
                        </div>
                        <div>
                          <strong className="text-sm font-black text-slate-800 block">Interview Tip:</strong>
                          <p className="text-xs text-slate-500 font-medium">Practice explaining the time complexity (Big O) of your algorithms. Emojis and step explanations inside code count.</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 7: MENTORSHIP BOOKING SYSTEM */}
          {activeTab === "mentorship" && (
            <motion.div
              key="mentorship"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <CalendarIcon className="w-3.5 h-3.5 fill-indigo-100" />
                  1-on-1 Placement Coaching
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
                  Book Mentorship Slots
                </h1>
                <p className="text-slate-500 font-medium text-base max-w-xl">
                  Schedule direct strategy, resume review, or technical mock round consultations with elite placement coaches.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Booking Slots form */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 font-display mb-6">Schedule Session</h3>
                  
                  <form onSubmit={bookMentorshipSlot} className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Session Topic</label>
                      <select 
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Resume Review">Resume Review & ATS Check</option>
                        <option value="Mock Coding Interview">Mock Coding Interview</option>
                        <option value="Placement Strategy Call">Placement Strategy Call</option>
                        <option value="Behavioral HR Interview">Behavioral HR Interview</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Date</label>
                        <input 
                          type="date" 
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Slot Time</label>
                        <select 
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="11:00 AM">11:00 AM - 11:45 AM</option>
                          <option value="01:00 PM">01:00 PM - 01:45 PM</option>
                          <option value="03:00 PM">03:00 PM - 03:45 PM</option>
                          <option value="05:00 PM">05:00 PM - 05:45 PM</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
                    >
                      Confirm Booking Slot
                    </button>
                  </form>
                </div>

                {/* Scheduled Bookings tracker */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                  <h3 className="text-xl font-black text-slate-900 font-display">Active Bookings</h3>
                  
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <strong className="text-sm font-black text-slate-800">{booking.type}</strong>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{booking.date} @ {booking.time}</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-center text-xs text-indigo-700 font-bold">
                    🚀 All coaching sessions are conducted on Google Meet.
                  </div>
                </div>
              </div>
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
