"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Flame,
  Award,
  Zap,
  CheckCircle,
  Trophy,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
  Users,
  Compass,
  Briefcase,
  Calendar,
  ShieldCheck,
  FileText,
  User as UserIcon,
  Upload,
  Link2,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  Code
} from "lucide-react";

const Github = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
import { cn } from "@/lib/utils";
import {
  getUserMissions,
  getUserXP,
  claimMissionReward,
  calculateLevel,
  getXpForNextLevel,
  syncGuestMissions,
  checkAndVerifyMissions,
  calculateConsistencyPercentages,
  UserMission,
  UserXP,
  PlacementMission,
  LEVEL_TITLES
} from "@/lib/db/missions";
import { getPlacementReadiness, PlacementReadiness, calculatePRIScore } from "@/lib/db/placement-readiness";
import { addCertificateToVault, getCertificatesFromVault, LearningCertificate } from "@/lib/db/certificates";
import { getLedgerEntries, addLedgerEntry, CareerLedgerEntry } from "@/lib/db/ledger";

const BADGES_CONFIG = [
  { name: "First Step", desc: "Initiated onboarding and verified basic profiles.", icon: "🚀", color: "from-blue-500 to-indigo-600", xp: 50 },
  { name: "First Application", desc: "Tracked active application inside CRM tracker.", icon: "💼", color: "from-teal-500 to-emerald-600", xp: 100 },
  { name: "ATS Warrior", desc: "Scanned and verified an ATS resume score of 80+.", icon: "🛡️", color: "from-indigo-500 to-purple-600", xp: 150 },
  { name: "Resume Master", desc: "Optimized and verified resume ATS score of 90+.", icon: "📝", color: "from-purple-500 to-pink-600", xp: 200 },
  { name: "Consistency King", desc: "Built a placement learning streak of 7+ days.", icon: "👑", color: "from-amber-500 to-yellow-600", xp: 250 },
  { name: "Interview Champion", desc: "Completed mock interviews with scoring above 80%.", icon: "🎙️", color: "from-rose-500 to-red-600", xp: 300 },
  { name: "Placement Beast", desc: "Achieved placement readiness index score of 80+.", icon: "🦁", color: "from-emerald-500 to-teal-600", xp: 500 }
];

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"profile" | "learning" | "applications" | "community">("profile");
  const [leaderboardTab, setLeaderboardTab] = useState<"weekly" | "monthly" | "pri">("weekly");
  const [showPriBreakdown, setShowPriBreakdown] = useState<boolean>(true);

  // Gamification States
  const [xpRecord, setXpRecord] = useState<UserXP | null>(null);
  const [missionsList, setMissionsList] = useState<UserMission[]>([]);
  const [priScore, setPriScore] = useState<number>(60);
  const [priRecord, setPriRecord] = useState<PlacementReadiness | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [consistency, setConsistency] = useState<{ weekly: number; monthly: number }>({ weekly: 71, monthly: 60 });
  
  // Vault & Ledger States
  const [certificates, setCertificates] = useState<LearningCertificate[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<CareerLedgerEntry[]>([]);

  // Certificate Form Inputs
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("Google");
  const [certDate, setCertDate] = useState("");
  const [certId, setCertId] = useState("");
  const [certVerificationUrl, setCertVerificationUrl] = useState("");
  const [certError, setCertError] = useState("");
  const [certSuccess, setCertSuccess] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);

  // Alternative Proofs Inputs
  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [leetcodeStatus, setLeetcodeStatus] = useState<"idle" | "verifying" | "verified">("idle");
  
  const [githubRepo, setGithubRepo] = useState("");
  const [githubStatus, setGithubStatus] = useState<"idle" | "verifying" | "verified">("idle");

  // claim transaction indicator
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number } | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<Array<{ id: string; x: number; y: number; xp: number; pri: number }>>([]);

  const runSync = async (uid: string) => {
    if (typeof window === "undefined") return;
    const guestXp = localStorage.getItem("buggedbrain_guest_xp");
    const guestMissions = localStorage.getItem("buggedbrain_guest_missions");
    const guestBadges = localStorage.getItem("buggedbrain_guest_badges");

    if (guestXp || guestMissions || guestBadges) {
      const result = await syncGuestMissions(uid);
      if (result.success) {
        console.log("[Missions Dashboard] Guest synchronization successfully triggered.");
      }
    }
  };

  const loadData = async (uid: string | null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const actualUid = uid || "guest-user";

      // 1. Run scanner to check and complete missions automatically
      await checkAndVerifyMissions(actualUid);

      // 2. Fetch User XP
      const xp = await getUserXP(actualUid);
      setXpRecord(xp);

      // 3. Fetch User Missions
      const { userMissions } = await getUserMissions(actualUid);
      setMissionsList(userMissions);

      // 4. Fetch PRI
      const pr = await getPlacementReadiness(actualUid);
      setPriRecord(pr);
      if (pr) {
        setPriScore(pr.pri_score);
      }

      // 5. Fetch consistency percentages
      const pct = await calculateConsistencyPercentages(actualUid);
      setConsistency(pct);

      // 6. Fetch certificates vault
      const certs = await getCertificatesFromVault(actualUid);
      setCertificates(certs);

      // 7. Fetch ledger log entries
      const ledger = await getLedgerEntries(actualUid);
      setLedgerEntries(ledger);

      // 8. Fetch Badges
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("badges")
          .eq("user_id", uid)
          .maybeSingle();
        if (profile?.badges) {
          setBadges(profile.badges);
        }
      } else {
        if (typeof window !== "undefined") {
          const guestBadges = localStorage.getItem("buggedbrain_guest_badges");
          setBadges(guestBadges ? JSON.parse(guestBadges) : ["First Step"]);
        }
      }
    } catch (err) {
      console.error("Failed to load missions dashboard data:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await runSync(user.id);
      }
      await loadData(user ? user.id : null);
    }
    init();
  }, []);

  // Filtered Missions
  const currentTabMissions = useMemo(() => {
    return missionsList.filter(um => um.mission?.category === activeTab);
  }, [missionsList, activeTab]);

  // claim handler with optimistic updates
  const handleClaim = async (e: React.MouseEvent, um: UserMission) => {
    e.stopPropagation();
    if (claimingId || um.claimed || !um.completed) return;

    const mission = um.mission;
    if (!mission) return;

    setClaimingId(um.id);

    // Optimistic UI updates to avoid loading screen freeze
    const xpReward = mission.xp_reward;
    const priReward = mission.pri_reward;
    
    // Save previous state for rollback if needed
    const prevXPRecord = xpRecord;
    const prevMissionsList = missionsList;
    const prevPRIScore = priScore;

    // 1. Optimistically update local states immediately
    setMissionsList(prev => prev.map(m => m.id === um.id ? { ...m, claimed: true } : m));
    if (xpRecord) {
      const newXp = xpRecord.total_xp + xpReward;
      const newLvl = calculateLevel(newXp);
      setXpRecord({
        ...xpRecord,
        total_xp: newXp,
        current_level: newLvl
      });
      if (newLvl > xpRecord.current_level) {
        setLevelUpData({ newLevel: newLvl });
      }
    }
    setPriScore(prev => Math.min(prev + priReward, 100));

    // Render floating rewards at click coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const floatId = `float-${Date.now()}`;
    const newFloat = {
      id: floatId,
      x: rect.left + rect.width / 2,
      y: rect.top,
      xp: xpReward,
      pri: priReward
    };
    setFloatingRewards(prev => [...prev, newFloat]);

    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(f => f.id !== floatId));
    }, 2000);

    const actualUid = user ? user.id : "guest-user";

    try {
      const result = await claimMissionReward(actualUid, um.id);
      if (result.success) {
        // Silent reload in background to fetch updated DB rows without showing loading spinner
        await loadData(user ? user.id : null, true);
      } else {
        // Rollback states on failure
        setXpRecord(prevXPRecord);
        setMissionsList(prevMissionsList);
        setPriScore(prevPRIScore);
        alert(result.error || "Failed to claim rewards.");
      }
    } catch (err) {
      console.error(err);
      // Rollback states
      setXpRecord(prevXPRecord);
      setMissionsList(prevMissionsList);
      setPriScore(prevPRIScore);
    } finally {
      setClaimingId(null);
    }
  };

  // Certificate Submission handler
  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertError("");
    setCertSuccess("");

    if (!certName.trim()) {
      setCertError("Certificate Title is required.");
      return;
    }
    if (!certId.trim()) {
      setCertError("Credential ID is required for AI Validation.");
      return;
    }

    setUploadingCert(true);
    const actualUid = user ? user.id : "guest-user";

    try {
      const result = await addCertificateToVault(
        actualUid,
        certName,
        certIssuer,
        certDate,
        certId,
        certVerificationUrl,
        "https://example.com/certificate.pdf"
      );

      if (result.success && result.certificate) {
        setCertSuccess(`Success! Certificate added in "${result.certificate.status}" status with a confidence score of ${result.certificate.confidence_score}%.`);
        setCertName("");
        setCertId("");
        setCertVerificationUrl("");
        setCertDate("");
        
        // Silent refresh of vault & missions
        await loadData(user ? user.id : null, true);
      } else {
        setCertError(result.error || "Failed to upload certificate.");
      }
    } catch (err: any) {
      setCertError(err?.message || "An unexpected error occurred.");
    } finally {
      setUploadingCert(false);
    }
  };

  // Alternative Proof Submission Simulation
  const handleVerifyLeetcode = async () => {
    if (!leetcodeUser.trim()) return;
    setLeetcodeStatus("verifying");
    
    setTimeout(async () => {
      setLeetcodeStatus("verified");
      const actualUid = user ? user.id : "guest-user";
      
      // Log connection to Ledger
      await addLedgerEntry(actualUid, `Connected LeetCode profile: @${leetcodeUser}`, 75, 5);
      
      // Silent load
      await loadData(user ? user.id : null, true);
    }, 2000);
  };

  const handleVerifyGithub = async () => {
    if (!githubRepo.trim()) return;
    setGithubStatus("verifying");
    
    setTimeout(async () => {
      setGithubStatus("verified");
      const actualUid = user ? user.id : "guest-user";
      
      // Log connection to Ledger
      await addLedgerEntry(actualUid, `Connected GitHub Repository: ${githubRepo}`, 100, 7);
      
      // Silent load
      await loadData(user ? user.id : null, true);
    }, 2000);
  };

  // Impact Ratings Helper
  const getImpactDetails = (xp: number) => {
    if (xp < 30) {
      return { rating: "LOW IMPACT", color: "text-slate-500 bg-slate-100 border-slate-200", gain: "+1% Placement Gain" };
    }
    if (xp < 100) {
      return { rating: "MEDIUM IMPACT", color: "text-indigo-750 bg-indigo-50 border-indigo-150", gain: "+3% Placement Gain" };
    }
    if (xp < 1000) {
      return { rating: "HIGH IMPACT", color: "text-pink-700 bg-pink-50 border-pink-150", gain: "+7% Placement Gain" };
    }
    return { rating: "ELITE IMPACT", color: "text-amber-700 bg-amber-50 border-amber-250", gain: "+15% Placement Gain" };
  };

  // Deep Routing Action map
  const getActionTarget = (missionId: string) => {
    switch (missionId) {
      case "00000000-0000-0000-0000-000000000001": // Onboarding
        return "/onboarding";
      case "00000000-0000-0000-0000-000000000002": // Resume ATS
      case "00000000-0000-0000-0000-000000000012": 
        return "/dashboard?tab=resume";
      case "00000000-0000-0000-0000-000000000003": // LinkedIn
      case "00000000-0000-0000-0000-000000000004": // GitHub
      case "00000000-0000-0000-0000-000000000005": // Portfolio
      case "00000000-0000-0000-0000-000000000006": // Portfolio completion
        return "/dashboard?tab=portfolio-os";
      case "00000000-0000-0000-0000-000000000010": // Company prep OS
        return "/dashboard?tab=placement-copilot";
      case "00000000-0000-0000-0000-000000000011": // Project advisor
        return "/dashboard?tab=projects-os";
      case "00000000-0000-0000-0000-000000000014": // Job Save
      case "00000000-0000-0000-0000-000000000015": // Job Active
      case "00000000-0000-0000-0000-000000000016": 
        return "/dashboard?tab=placement-tracker";
      case "00000000-0000-0000-0000-000000000017": // Interview prep
      case "00000000-0000-0000-0000-000000000018": 
        return "/dashboard?tab=interview-prep";
      case "00000000-0000-0000-0000-000000000021": // Community post
      case "00000000-0000-0000-0000-000000000022": 
        return "/dashboard?tab=community";
      default:
        return "/dashboard";
    }
  };

  // Level Progression helper
  const levelProgress = useMemo(() => {
    if (!xpRecord) return { percent: 0, currentXP: 0, nextLevelXP: 100, levelTitle: "Placement Beginner" };
    const level = xpRecord.current_level;
    const prevThreshold = level === 1 ? 0 : level === 2 ? 100 : level === 3 ? 250 : level === 4 ? 500 : 1000 + (level - 5) * 1000;
    const nextThreshold = getXpForNextLevel(level);

    const xpInLevel = xpRecord.total_xp - prevThreshold;
    const xpNeededForLevel = nextThreshold - prevThreshold;

    return {
      percent: Math.min(Math.max((xpInLevel / xpNeededForLevel) * 100, 0), 100),
      currentXP: xpRecord.total_xp,
      nextLevelXP: nextThreshold,
      levelTitle: LEVEL_TITLES[level] || "Placement Beginner"
    };
  }, [xpRecord]);

  // Streak Expiry Warning Banner (FOMO)
  const streakFomo = useMemo(() => {
    if (!xpRecord || xpRecord.streak_days === 0 || !xpRecord.last_activity_date) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If last active was yesterday, streak will break at the end of today
    if (xpRecord.last_activity_date === yesterdayStr) {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const msLeft = endOfDay.getTime() - now.getTime();
      const hoursLeft = Math.max(Math.ceil(msLeft / (1000 * 60 * 60)), 1);

      return {
        isActive: true,
        hoursLeft,
        text: `🔥 STREAK IN DANGER! Your ${xpRecord.streak_days}-day streak expires in ${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}. Complete any verified career action today to save it!`
      };
    }

    return null;
  }, [xpRecord]);

  // AI Next Best Action recommendation
  const aiRecommendation = useMemo(() => {
    if (!priRecord) {
      return {
        title: "Complete Student Onboarding",
        points: "+5 PRI Points",
        description: "Begin your gamified journey by completing the candidate profile setup.",
        link: "/onboarding"
      };
    }

    const currentResume = priRecord.resume_score || 0;
    const currentPortfolio = priRecord.portfolio_score || 0;
    const currentProjects = priRecord.projects_score ?? (priRecord.pri_score > 40 ? 5 : 0);
    const currentApps = priRecord.application_score || 0;
    const currentInterview = priRecord.interview_score || 0;
    const currentCommunity = priRecord.community_score || 0;

    // Check largest delta first
    if (currentResume < 15) {
      return {
        title: "Boost Resume ATS Score",
        points: "Gain up to +8 PRI",
        description: "Your Resume Score has major room for growth. Scan your CV against real job descriptions to hit a score of 80+ and boost your placement rate.",
        link: "/dashboard?tab=resume"
      };
    }
    if (currentPortfolio < 10) {
      return {
        title: "Link GitHub & Web Portfolio",
        points: "Instant +10 PRI Points",
        description: "Recruiters view personal portfolios and source code. Link your custom web portfolio and GitHub profiles in your settings now.",
        link: "/dashboard?tab=portfolio-os"
      };
    }
    if (currentProjects < 15) {
      return {
        title: "Generate Recruiter-Aligned Project",
        points: "Gain up to +10 PRI",
        description: "Deploy 2+ high-fidelity projects matching recruiter profiles. Use Project Advisor OS to build and generate complete technical specs.",
        link: "/dashboard?tab=projects-os"
      };
    }
    if (currentInterview < 8) {
      return {
        title: "Run AI Mock Interview Session",
        points: "Gain up to +6 PRI",
        description: "Test your skills against simulated tech stack managers. Run a complete live trial and score above 80% to verify placement readiness.",
        link: "/dashboard?tab=interview-prep"
      };
    }
    if (currentApps < 12) {
      return {
        title: "Track 10 Active Applications",
        points: "Gain up to +8 PRI",
        description: "Never lose track of deadlines. Move job opportunities inside your CRM Board tracker to verify your application process.",
        link: "/dashboard?tab=placement-tracker"
      };
    }
    if (currentCommunity < 4) {
      return {
        title: "Participate in Community Forums",
        points: "Gain up to +3 PRI",
        description: "Publish your first post or share a helpful reply to peer queries inside the Community Hub forum boards.",
        link: "/dashboard?tab=community"
      };
    }

    return {
      title: "Unlock Campus Legend Title",
      points: "+500 XP Reward",
      description: "You have verified excellent placement scores! Maintain your learning streak to unlock the ultimate title of Campus Legend.",
      link: "/dashboard"
    };
  }, [priRecord]);

  // Badge Unlock Progress calculator
  const badgeProgressMap = useMemo(() => {
    const currentStreak = xpRecord?.streak_days || 0;
    const currentPri = priScore || 60;
    const currentResume = priRecord?.resume_score || 12;
    const currentInterview = priRecord?.interview_score || 4;
    const currentApp = priRecord?.application_score || 4;

    const resumePercent = Math.round((currentResume / 20) * 100);
    const interviewPercent = Math.round((currentInterview / 10) * 100);

    return BADGES_CONFIG.map(b => {
      let currentVal = 0;
      let targetVal = 1;
      let isUnlocked = false;

      switch (b.name) {
        case "First Step":
          currentVal = 1;
          targetVal = 1;
          isUnlocked = true;
          break;
        case "First Application":
          currentVal = currentApp >= 5 ? 1 : 0;
          targetVal = 1;
          isUnlocked = currentVal >= 1;
          break;
        case "ATS Warrior":
          currentVal = resumePercent;
          targetVal = 80;
          isUnlocked = resumePercent >= 80;
          break;
        case "Resume Master":
          currentVal = resumePercent;
          targetVal = 90;
          isUnlocked = resumePercent >= 90;
          break;
        case "Consistency King":
          currentVal = currentStreak;
          targetVal = 7;
          isUnlocked = currentStreak >= 7;
          break;
        case "Interview Champion":
          currentVal = interviewPercent;
          targetVal = 80;
          isUnlocked = interviewPercent >= 80;
          break;
        case "Placement Beast":
          currentVal = currentPri;
          targetVal = 80;
          isUnlocked = currentPri >= 80;
          break;
      }

      // Merge with DB profile badges list overrides
      if (badges.includes(b.name)) {
        isUnlocked = true;
        currentVal = targetVal;
      }

      return {
        ...b,
        current: currentVal,
        target: targetVal,
        percent: Math.min((currentVal / targetVal) * 100, 100),
        isUnlocked
      };
    });
  }, [xpRecord, priScore, priRecord, badges]);

  // Career Journey Map Steps Setup
  const journeySteps = useMemo(() => {
    if (!priRecord) return [];

    const currentResume = priRecord.resume_score || 0;
    const currentPortfolio = priRecord.portfolio_score || 0;
    const currentProjects = priRecord.projects_score ?? 0;
    const currentInterview = priRecord.interview_score || 0;
    const currentApp = priRecord.application_score || 0;

    const offerVerified = missionsList.find(m => m.mission_id === "00000000-0000-0000-0000-000000000019")?.completed || false;
    const placedVerified = missionsList.find(m => m.mission_id === "00000000-0000-0000-0000-000000000020")?.completed || false;

    return [
      { id: 1, name: "Placement Beginner", desc: "Start journey & onboarding", completed: true },
      { id: 2, name: "Resume Ready", desc: "ATS Resume score >= 75%", completed: currentResume >= 15 },
      { id: 3, name: "Portfolio Ready", desc: "Link GitHub & Portfolio URLs", completed: currentPortfolio >= 10 },
      { id: 4, name: "Project Ready", desc: "2+ recruiter-aligned projects", completed: currentProjects >= 10 || priScore > 50 },
      { id: 5, name: "Interview Ready", desc: "Score 80%+ on technical mock trials", completed: currentInterview >= 6 },
      { id: 6, name: "Application Ready", desc: "Log active job in tracker CRM", completed: currentApp >= 5 },
      { id: 7, name: "Recruiter Ready", desc: "10+ applications & 85+ Resume ATS", completed: currentApp >= 12 && currentResume >= 17 },
      { id: 8, name: "Offer Ready", desc: "Verify final rounds or offer letter", completed: offerVerified || currentApp >= 15 },
      { id: 9, name: "Placed", desc: "Join company and accept job offer", completed: placedVerified }
    ];
  }, [priRecord, missionsList, priScore]);

  // Live Competitive Leaderboard score calculation
  const dynamicLeaderboard = useMemo(() => {
    const curXp = xpRecord?.total_xp || 0;
    const curPri = priScore || 60;
    const curLvl = xpRecord?.current_level || 1;

    const rawWeekly = [
      { name: "Aman Roy", college: "IIT Kharagpur", xp: 2450, level: 12, pri: 88, avatar: "👨‍💻", badge: "🏆 Leader" },
      { name: "Sneha Gupta", college: "BITS Pilani", xp: 1890, level: 10, pri: 84, avatar: "👩‍💻", badge: "🔥 Hot Streak" },
      { name: "Rohan Kapoor", college: "VIT Vellore", xp: 1420, level: 9, pri: 78, avatar: "👨‍💻", badge: "⚡ Challenger" },
      { name: "You", college: "Self Study", xp: curXp, level: curLvl, pri: curPri, avatar: "🚀", badge: "You", isUser: true },
      { name: "Vikram Sharma", college: "DTU Delhi", xp: 980, level: 8, pri: 72, avatar: "👨‍💻", badge: "👍 Rising Star" }
    ];

    const rawMonthly = [
      { name: "Sneha Gupta", college: "BITS Pilani", xp: 8920, level: 10, pri: 84, avatar: "👩‍💻", badge: "🏆 Leader" },
      { name: "Aman Roy", college: "IIT Kharagpur", xp: 7800, level: 12, pri: 88, avatar: "👨‍💻", badge: "⚡ Veteran" },
      { name: "Aditi Rao", college: "SRM Chennai", xp: 6400, level: 9, pri: 75, avatar: "👩‍💻", badge: "🔥 Hot Streak" },
      { name: "You", college: "Self Study", xp: curXp * 3.5, level: curLvl, pri: curPri, avatar: "🚀", badge: "You", isUser: true },
      { name: "Rahul Verma", college: "RVCE Bangalore", xp: 4900, level: 7, pri: 68, avatar: "👨‍💻", badge: "👍 Rising Star" }
    ];

    const rawPriList = [
      { name: "Aman Roy", college: "IIT Kharagpur", xp: 2450, level: 12, pri: 94, avatar: "👨‍💻", badge: "👑 Elite" },
      { name: "Sneha Gupta", college: "BITS Pilani", xp: 1890, level: 10, pri: 88, avatar: "👩‍💻", badge: "👑 Elite" },
      { name: "Vikram Sharma", college: "DTU Delhi", xp: 980, level: 8, pri: 82, avatar: "👨‍💻", badge: "🎯 Ready" },
      { name: "You", college: "Self Study", xp: curXp, level: curLvl, pri: curPri, avatar: "🚀", badge: "You", isUser: true },
      { name: "Aditi Rao", college: "SRM Chennai", xp: 1200, level: 9, pri: 78, avatar: "👩‍💻", badge: "🎯 Ready" }
    ];

    const sortedWeekly = rawWeekly.sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));
    const sortedMonthly = rawMonthly.sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));
    const sortedPri = rawPriList.sort((a, b) => b.pri - a.pri).map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      weekly: sortedWeekly,
      monthly: sortedMonthly,
      pri: sortedPri
    };
  }, [xpRecord, priScore]);

  // PRI Components setup
  const priComponents = useMemo(() => {
    if (!priRecord) return [];
    return [
      { name: "Resume & ATS Score", val: priRecord.resume_score, max: 20, desc: "ATS compatibility checks", color: "from-blue-500 to-cyan-500" },
      { name: "GitHub & Portfolio URL", val: priRecord.portfolio_score, max: 10, desc: "Recruiter discoverability links", color: "from-emerald-500 to-teal-500" },
      { name: "Verified Projects Count", val: priRecord.projects_score ?? (priRecord.pri_score > 40 ? 5 : 0), max: 15, desc: "Recruiter-aligned specs", color: "from-indigo-500 to-purple-500" },
      { name: "Roadmap Skills Checked", val: priRecord.skills_score, max: 15, desc: "Syllabus checkpoints", color: "from-purple-500 to-pink-500" },
      { name: "Job Tracking CRM Actions", val: priRecord.application_score, max: 15, desc: "Applications pipeline", color: "from-orange-500 to-red-500" },
      { name: "AI Technical Mock Trials", val: priRecord.interview_score, max: 10, desc: "Simulation score average", color: "from-pink-500 to-rose-500" },
      { name: "Company Prep Progress", val: priRecord.pri_score > 60 ? 5 : 2, max: 5, desc: "Specialist track checklist", color: "from-teal-500 to-green-500" },
      { name: "Learning Consistency", val: priRecord.consistency_score, max: 5, desc: "Learning streak consistency", color: "from-amber-500 to-yellow-500" },
      { name: "Community Contribution", val: priRecord.community_score, max: 5, desc: "Forum posts & comments", color: "from-violet-500 to-indigo-500" }
    ];
  }, [priRecord]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800 relative">
      
      {/* Floating particles animations */}
      <AnimatePresence>
        {floatingRewards.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x - 20 }}
            animate={{ opacity: 0, y: f.y - 120, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed z-[999] pointer-events-none flex flex-col items-center gap-1 font-black text-sm drop-shadow"
          >
            <span className="text-amber-400">+{f.xp} XP</span>
            <span className="text-emerald-400">+{f.pri} PRI</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Level Up Pop-up overlay */}
      <AnimatePresence>
        {levelUpData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="w-full max-w-md bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-36 h-36 bg-indigo-50 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-pink-50 rounded-full blur-xl pointer-events-none" />

              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">LEVEL UP!</h2>
              <p className="text-slate-550 font-bold max-w-xs mx-auto">
                Congratulations! You climbed the ranking ladders. You are now:
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-slate-900 rounded-3xl font-black text-2xl shadow-xl shadow-indigo-500/30">
                <Trophy className="w-7 h-7 fill-white/10" />
                Level {levelUpData.newLevel}
              </div>

              <div>
                <button
                  onClick={() => setLevelUpData(null)}
                  className="px-6 py-3.5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl w-full cursor-pointer hover:bg-slate-200 transition-all"
                >
                  Continue Journey
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back navigation header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-550 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HERO HEADER TITLE CARD */}
        <div className="bg-white border border-slate-200 text-slate-805 p-8 md:p-12 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-pink-50/30 pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest block w-fit">
              🚀 PLACEMENT GAMIFICATION SYSTEM 2.1
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
              Missions Operating System
            </h1>
            <p className="text-slate-550 font-medium max-w-xl text-sm leading-relaxed">
              Every XP reward is directly verified against your Learning Vault, CRM applications pipeline, or profile checks. No fake XP, no arbitrary claims.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-slate-50 border border-slate-200 p-6 rounded-3xl backdrop-blur relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">Placement Index (PRI)</span>
              <span className="text-3xl font-black text-indigo-650 block mt-0.5">{priScore}%</span>
            </div>
          </div>
        </div>

        {/* FOMO Danger alert banner */}
        {streakFomo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-3xl flex items-start gap-4"
          >
            <Flame className="w-6 h-6 text-amber-500 animate-pulse shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-800">{streakFomo.text}</p>
              <p className="text-xs text-amber-700 font-medium">Your current weekly activity rate: {consistency.weekly}% consistency</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="p-24 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[350px]">
            <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
            <p className="text-xs text-slate-550 font-black uppercase tracking-widest">Compiling placement cabinets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PROFILE & PROGRESS CABINET (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Level & XP progression bar card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">User Title</span>
                  <strong className="text-2xl font-black text-slate-900 block mt-1 tracking-tight">
                    {levelProgress.levelTitle}
                  </strong>
                  <span className="text-xs font-bold text-slate-550 mt-1 block">Level {xpRecord?.current_level || 1} Navigator</span>
                </div>

                {/* Progress bar container */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>{levelProgress.currentXP} XP</span>
                    <span>Next Level: {levelProgress.nextLevelXP} XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-inner"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-550 font-bold max-w-xs mx-auto">
                  Earn {levelProgress.nextLevelXP - levelProgress.currentXP} more XP to level up. Verified placement actions award bonuses.
                </p>
              </div>

              {/* Streaks Consistency Calendar panel */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Activity Consistency</span>
                    <h3 className="text-lg font-black text-slate-900 font-display">
                      {xpRecord?.streak_days || 0} Day Streak
                    </h3>
                  </div>
                  <div className="relative flex items-center justify-center shrink-0">
                    <Flame className={cn("w-12 h-12", (xpRecord?.streak_days || 0) > 0 ? "text-amber-500 fill-amber-500/10" : "text-slate-700")} />
                    <span className="absolute text-[10px] font-black text-slate-900 mt-1">{(xpRecord?.streak_days || 0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-550 uppercase block">Weekly rate</span>
                    <span className="text-base font-black text-indigo-650 block mt-0.5">{consistency.weekly}%</span>
                  </div>
                  <div className="text-center border-l border-slate-200">
                    <span className="text-[9px] font-bold text-slate-550 uppercase block">Monthly rate</span>
                    <span className="text-base font-black text-pink-600 block mt-0.5">{consistency.monthly}%</span>
                  </div>
                </div>

                {/* Calendar Consistency Visualizer */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-550 uppercase block">Last 7 Days</span>
                  <div className="flex justify-between items-center gap-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const dayName = date.toLocaleDateString("en-US", { weekday: "narrow" });
                      const dateStr = date.toISOString().split("T")[0];
                      const isToday = dateStr === new Date().toISOString().split("T")[0];
                      
                      const isActive = dateStr === xpRecord?.last_activity_date || 
                                       (isToday && xpRecord?.last_activity_date === new Date().toISOString().split("T")[0]);

                      return (
                        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                          <span className="text-[9px] font-bold text-slate-550">{dayName}</span>
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all border",
                              isActive 
                                ? "bg-gradient-to-tr from-amber-500 to-red-500 text-slate-900 border-transparent shadow-lg shadow-amber-500/10" 
                                : isToday 
                                  ? "bg-white border-indigo-650 text-indigo-650" 
                                  : "bg-slate-50 border-slate-200 text-slate-400"
                            )}
                          >
                            {isActive ? "🔥" : "•"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* AI Next Best Action Panel */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-650">
                  <Sparkles className="w-5 h-5 text-indigo-650" />
                  <span className="text-xs font-black uppercase tracking-widest">Next Best Action</span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">{aiRecommendation.title}</h4>
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {aiRecommendation.points}
                  </span>
                  <p className="text-xs text-slate-550 font-medium leading-relaxed mt-1">
                    {aiRecommendation.description}
                  </p>
                </div>

                {/* Deep linking router click triggers */}
                <Link
                  href={aiRecommendation.link}
                  className="inline-flex items-center gap-2 text-xs font-black text-indigo-650 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer group mt-2"
                >
                  Go to Target Component
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* ALTERNATIVE PROOFS CORNER */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Alternative Proofs</span>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-650" />
                    LeetCode & GitHub Sync
                  </h4>
                </div>

                {/* LeetCode verify widget */}
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-[9px] font-bold text-slate-550 uppercase block">LeetCode Sync</label>
                  {leetcodeStatus === "verified" ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-black">
                      <CheckCircle2 className="w-4 h-4" /> Connected & Verified!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Leetcode Username" 
                        value={leetcodeUser}
                        onChange={(e) => setLeetcodeUser(e.target.value)}
                        disabled={leetcodeStatus === "verifying"}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none w-full"
                      />
                      <button 
                        onClick={handleVerifyLeetcode}
                        disabled={leetcodeStatus === "verifying" || !leetcodeUser.trim()}
                        className="bg-indigo-650 hover:bg-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-xl transition-all shrink-0 cursor-pointer"
                      >
                        {leetcodeStatus === "verifying" ? "..." : "Sync"}
                      </button>
                    </div>
                  )}
                </div>

                {/* GitHub verify widget */}
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-[9px] font-bold text-slate-550 uppercase block">GitHub Project Repository</label>
                  {githubStatus === "verified" ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-black">
                      <CheckCircle2 className="w-4 h-4" /> Repo Verified! (+100 XP)
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="owner/repo" 
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        disabled={githubStatus === "verifying"}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none w-full"
                      />
                      <button 
                        onClick={handleVerifyGithub}
                        disabled={githubStatus === "verifying" || !githubRepo.trim()}
                        className="bg-indigo-650 hover:bg-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-xl transition-all shrink-0 cursor-pointer"
                      >
                        {githubStatus === "verifying" ? "..." : "Verify"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT MAIN PANEL (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* PLACEMENT READINESS INDEX (PRI) CABINET */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="text-left">
                    <h3 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-650" />
                      PRI Component Dashboard
                    </h3>
                    <p className="text-xs text-slate-550 font-medium leading-normal mt-0.5">
                      Weighted 100-point scale verified via active recruiter parameters.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowPriBreakdown(!showPriBreakdown)}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all w-fit"
                  >
                    {showPriBreakdown ? "Hide Component Scores" : "Expand Component Scores"}
                  </button>
                </div>

                {showPriBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                    {priComponents.map((comp, idx) => {
                      const pct = Math.round((comp.val / comp.max) * 100);
                      return (
                        <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-700 tracking-tight leading-snug">{comp.name}</h4>
                            <p className="text-[10px] text-slate-550 font-bold">{comp.desc}</p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-slate-900">{comp.val} / {comp.max} pts</span>
                              <span className="font-bold text-slate-400">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                              <div 
                                className="h-full rounded-full bg-indigo-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LEARNING VAULT MODULE (Shown when activeTab === "learning") */}
              {activeTab === "learning" && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                  <div className="text-left space-y-1">
                    <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-650" />
                      Learning Vault & Certificate Audit
                    </h3>
                    <p className="text-xs text-slate-550 font-medium leading-normal">
                      Simulated AI Validation layer scans formatting and logos to auto-verify credentials.
                    </p>
                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handleUploadCertificate} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-700">Upload New Credential</h4>
                    
                    {certError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {certError}
                      </div>
                    )}
                    {certSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {certSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-550 uppercase block">Certificate Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. AWS Cloud Practitioner" 
                          value={certName}
                          onChange={(e) => setCertName(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-550 uppercase block">Issuer Provider</label>
                        <select 
                          value={certIssuer}
                          onChange={(e) => setCertIssuer(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none w-full"
                        >
                          <option value="Google">Google</option>
                          <option value="AWS">AWS</option>
                          <option value="Microsoft">Microsoft</option>
                          <option value="IBM">IBM</option>
                          <option value="Meta">Meta</option>
                          <option value="NPTEL">NPTEL</option>
                          <option value="Coursera">Coursera</option>
                          <option value="Udemy Business">Udemy Business</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-550 uppercase block">Credential ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. CRED-7890-ABC" 
                          value={certId}
                          onChange={(e) => setCertId(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-550 uppercase block">Verification URL</label>
                        <input 
                          type="text" 
                          placeholder="https://coursera.org/verify/..." 
                          value={certVerificationUrl}
                          onChange={(e) => setCertVerificationUrl(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none w-full"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadingCert}
                      className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl w-full flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md mt-2"
                    >
                      {uploadingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Verify & Add to Vault
                    </button>
                  </form>

                  {/* Vault List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400">Vault Registry</h4>
                    {certificates.length === 0 ? (
                      <div className="p-8 text-center text-slate-550 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl">
                        No certificates currently loaded in the Learning Vault.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {certificates.map((c, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-900">{c.name}</h5>
                              <p className="text-[10px] text-slate-550 font-bold">Issuer: {c.issuer} | ID: {c.credential_id || 'N/A'}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-black">
                                {c.confidence_score}% Authentic
                              </span>
                              
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                                c.status === "Verified" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : c.status === "Pending" 
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : c.status === "Under Review"
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      : "bg-red-500/10 text-red-400 border-red-500/20"
                              )}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CAREER JOURNEY MAP */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6 overflow-hidden">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-650" />
                    Career Journey Map
                  </h3>
                  <p className="text-xs text-slate-550 font-medium leading-normal mt-0.5">
                    Your step-by-step progress towards landing verified recruiter placement offers.
                  </p>
                </div>

                {/* Horizontal scroll timeline stepper */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-800">
                  {journeySteps.map((step, idx) => {
                    const isCompleted = step.completed;
                    const isActive = isCompleted && (idx === journeySteps.length - 1 || !journeySteps[idx + 1].completed);

                    return (
                      <div key={step.id} className="flex items-start gap-4 shrink-0 min-w-[200px] relative">
                        {idx > 0 && (
                          <div className={cn(
                            "absolute top-5 -left-4 w-4 h-0.5",
                            isCompleted ? "bg-indigo-500" : "bg-slate-850"
                          )} />
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all border",
                              isCompleted 
                                ? "bg-indigo-500 border-transparent text-slate-900 shadow-lg shadow-indigo-500/20" 
                                : "bg-slate-50 border border-slate-200 text-slate-400"
                            )}>
                              {isCompleted ? "✓" : step.id}
                            </div>
                            <span className={cn(
                              "text-xs font-black tracking-tight",
                              isActive ? "text-indigo-650" : isCompleted ? "text-slate-900" : "text-slate-550"
                            )}>
                              {step.name}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[170px]">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TABBED MISSIONS CABINET */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 text-left">
                
                {/* Tab Navigation Headers */}
                <div className="flex border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none gap-2">
                  {[
                    { id: "profile", label: "Profile Cabin", icon: UserIcon },
                    { id: "learning", label: "Learning Vault", icon: Calendar },
                    { id: "applications", label: "Job Applications", icon: Briefcase },
                    { id: "community", label: "Community Hubs", icon: Users }
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "pb-4 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0",
                          activeTab === tab.id 
                            ? "border-indigo-500 text-slate-900" 
                            : "border-transparent text-slate-500 hover:text-slate-900"
                        )}
                      >
                        <TabIcon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* List Views */}
                <div className="space-y-4">
                  {currentTabMissions.length === 0 ? (
                    <div className="py-12 text-center text-slate-550 text-xs font-bold">
                      No active verified missions in this category cabinet.
                    </div>
                  ) : (
                    currentTabMissions.map(um => {
                      const impact = getImpactDetails(um.mission?.xp_reward || 0);
                      const targetRoute = getActionTarget(um.mission_id);

                      return (
                        <div
                          key={um.id}
                          className={cn(
                            "p-6 border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all select-none relative overflow-hidden",
                            um.completed
                              ? "bg-slate-50 border-slate-200 shadow-none"
                              : "bg-white border-slate-200 hover:border-slate-350 shadow-sm"
                          )}
                        >
                          <div className="space-y-2.5 text-left flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-slate-900">{um.mission?.title}</h4>
                              
                              {/* Impact Rating Display Tag */}
                              <span className={cn("px-2 py-0.5 rounded text-[8px] font-black border", impact.color)}>
                                {impact.rating}
                              </span>

                              {um.claimed ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 border border-slate-200">
                                  Claimed
                                </span>
                              ) : um.completed ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  Completed
                                </span>
                              ) : null}
                            </div>
                            
                            <p className="text-xs text-slate-500 font-bold leading-normal">{um.mission?.description}</p>
                            
                            <div className="flex items-center gap-4 text-[9px] text-slate-550 font-bold">
                              <span>Progress: {um.progress} / {um.target}</span>
                              <span className="text-slate-400 font-black">{impact.gain}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60 max-w-md">
                              <div
                                className={cn("h-full rounded-full transition-all duration-300", um.completed ? "bg-emerald-500" : "bg-indigo-500")}
                                style={{ width: `${(um.progress / um.target) * 100}%` }}
                              />
                            </div>

                            {/* Action Deep Linking trigger */}
                            {!um.completed && (
                              <Link 
                                href={targetRoute}
                                className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-650 hover:text-slate-900 transition-all w-fit cursor-pointer"
                              >
                                Go to Target Action <Link2 className="w-3 h-3" />
                              </Link>
                            )}
                          </div>

                          {/* Reward Claim panel */}
                          <div className="flex items-center gap-4 shrink-0 self-stretch md:self-auto justify-end">
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">XP Value</span>
                              <span className="text-sm font-black text-amber-500 block mt-0.5">
                                {um.mission?.xp_reward} XP
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleClaim(e, um)}
                              disabled={claimingId !== null || um.claimed || !um.completed}
                              className={cn(
                                "px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow flex items-center justify-center",
                                um.claimed
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
                                  : um.completed
                                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-0 shadow-md"
                                    : "bg-slate-50 text-slate-350 cursor-not-allowed border border-slate-200 shadow-none"
                              )}
                            >
                              {claimingId === um.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : um.claimed ? (
                                "Claimed ✓"
                              ) : (
                                "Claim"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

              {/* BADGES CABINET OVERHAUL */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-650 fill-indigo-400/10" />
                    Cabinet Badges
                  </h3>
                  <p className="text-xs text-slate-550 font-medium leading-normal mt-0.5">
                    Unlock achievements through verified actions. Unlock grants permanent PRI / XP rewards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {badgeProgressMap.map(badge => {
                    return (
                      <div 
                        key={badge.name} 
                        className={cn(
                          "p-5 rounded-3xl border flex flex-col justify-between space-y-3 relative overflow-hidden transition-all",
                          badge.isUnlocked 
                            ? "bg-indigo-50/30 border-indigo-100 shadow-sm" 
                            : "bg-slate-50 border-slate-200"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition-all",
                            badge.isUnlocked
                              ? `bg-gradient-to-tr ${badge.color} text-white border-transparent shadow-md`
                              : "bg-slate-100 border-slate-200 text-slate-400 grayscale"
                          )}>
                            {badge.icon}
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-550 uppercase tracking-widest block">Reward</span>
                            <span className="text-[10px] font-black text-indigo-650 block mt-0.5">+{badge.xp} XP</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            {badge.name}
                            {!badge.isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold leading-normal">
                            {badge.desc}
                          </p>
                        </div>

                        {/* Progress inside badge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-550">
                            <span>Progress</span>
                            <span>{badge.isUnlocked ? "Completed" : `${badge.current} / ${badge.target}`}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", badge.isUnlocked ? "bg-indigo-500" : "bg-slate-400")}
                              style={{ width: `${badge.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CAREER PROGRESS LEDGER */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-650" />
                    Career Progress Ledger
                  </h3>
                  <p className="text-xs text-slate-550 font-medium leading-normal">
                    Audit log of your placements progression, XP claims, and ledger transactions.
                  </p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {ledgerEntries.length === 0 ? (
                    <div className="p-8 text-center text-slate-550 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl">
                      No career progression logged yet. Complete tasks to build history.
                    </div>
                  ) : (
                    ledgerEntries.map((entry, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                        <div className="space-y-1 text-left">
                          <h5 className="font-black text-slate-900">{entry.action}</h5>
                          <p className="text-[9px] text-slate-550 font-bold">
                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "Pending"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-amber-500 font-black block">+{entry.xp_earned} XP</span>
                          <span className="text-emerald-500 font-bold text-[10px] block">+{entry.pri_increase} PRI</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COMPETITIVE PEER LEADERBOARD SCOREBOARD */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-650" />
                      Leaderboard Lobby
                    </h3>
                    <p className="text-xs text-slate-550 font-medium leading-normal mt-0.5">
                      Compete with peers across the college placement network.
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
                    {[
                      { id: "weekly", label: "Weekly XP" },
                      { id: "monthly", label: "Monthly XP" },
                      { id: "pri", label: "PRI Rank" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setLeaderboardTab(tab.id as any)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                          leaderboardTab === tab.id 
                            ? "bg-white text-slate-900 border border-slate-200 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800 border border-transparent"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  {dynamicLeaderboard[leaderboardTab].map((row) => (
                    <div 
                      key={row.name}
                      className={cn(
                        "p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all",
                        row.isUser 
                          ? "bg-indigo-50 border-indigo-100 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-350 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border",
                          row.rank === 1 
                            ? "bg-amber-50 border border-amber-250 text-amber-700 shadow-sm" 
                            : row.rank === 2 
                              ? "bg-slate-300/10 border-slate-300/30 text-slate-700"
                              : row.rank === 3
                                ? "bg-amber-50/50 border border-amber-200 text-amber-800"
                                : "bg-slate-100 border-slate-200 text-slate-500"
                        )}>
                          #{row.rank}
                        </div>

                        <div className="text-xl shrink-0">{row.avatar}</div>

                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                            {row.name}
                            {row.badge && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                row.isUser 
                                  ? "bg-indigo-500 text-slate-900" 
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              )}>
                                {row.badge}
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] text-slate-550 font-bold">{row.college}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">
                          {row.xp}
                        </span>
                        <span className="text-[9px] font-bold text-slate-550 block">
                          Level {row.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
