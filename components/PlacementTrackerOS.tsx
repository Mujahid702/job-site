"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Award,
  RefreshCw,
  CheckCircle2,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  X,
  Bot,
  User,
  Send,
  Calendar as CalendarIcon,
  AlertCircle,
  Check,
  Star,
  Info,
  Trophy,
  Activity,
  ThumbsUp,
  Edit2,
  ExternalLink,
  Mail,
  Globe,
  Video,
  MapPin,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication
} from "@/lib/db/applications";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import {
  PlacementApplication,
  InterviewSchedule,
  OfferDetails,
  OARecord,
  InterviewRoundRecord
} from "@/types/crm";

export function generateInterviewPrepMaterial(company: string, role: string, roundType: string) {
  const checklist = [
    "Review your resume projects and be ready to explain architectural choices",
    "Research the company values, culture, and recent news",
    "Prepare 3-5 thoughtful questions to ask the interviewer",
    "Test your meeting setup (camera, microphone, internet speed, quiet space)",
    "Prepare clean attire and check meeting software (Google Meet / Zoom)"
  ];

  let companyTasks = [
    `Study ${company}'s core business model and products`,
    `Review past interview experiences at ${company} on Glassdoor/GeeksforGeeks`,
    `Check standard interview structure for ${company}`
  ];

  if (company.toLowerCase().includes("google")) {
    companyTasks = [
      "Review Google's 3-step coding review rubric (Googley/Leadership, DSA, System Design)",
      "Focus heavily on clean coding, time/space complexity optimization",
      "Read about Google's culture of 'Googliness' and leadership principles",
      "Solve Google-tagged LeetCode mediums and hard questions"
    ];
  } else if (company.toLowerCase().includes("amazon")) {
    companyTasks = [
      "Study Amazon's 16 Leadership Principles (LPs) and prepare STAR stories for each",
      "Amazon LP answers count for 50%+ of the total round score. Practice telling stories concisely",
      "Be prepared for deep system scalability questions (for Software roles)",
      "Practice writeups for coding logic questions with test cases"
    ];
  } else if (company.toLowerCase().includes("tcs") || company.toLowerCase().includes("tata consultancy")) {
    companyTasks = [
      "Revise basic concepts of Java, OOPs, DBMS, and SQL queries",
      "Prepare to talk about final year college project details",
      "Review basic HR questions (Why TCS, relocation preference, night shifts)",
      "Practice basic aptitude coding questions (TCS NQT style)"
    ];
  } else if (company.toLowerCase().includes("deloitte")) {
    companyTasks = [
      "Revise Case Interview framework and business technology problems",
      "Prepare explanation of technical stacks used in resume projects",
      "Deloitte values consulting presence. Practice professional speaking and clarity",
      "Review SQL joins and basic databases concept"
    ];
  }

  let roleTasks = [
    `Review core technical stacks related to ${role}`,
    "Prepare project deep-dives detailing challenges faced and metrics achieved",
    "Review basic data structures & algorithms (DSA) concepts"
  ];

  const lowerRole = role.toLowerCase();
  const lowerRound = roundType.toLowerCase();

  if (lowerRole.includes("software") || lowerRole.includes("developer") || lowerRole.includes("backend") || lowerRole.includes("frontend") || lowerRole.includes("sde")) {
    roleTasks = [
      "Revise key Data Structures (Arrays, Strings, Trees, Graphs, HashMaps)",
      "Practice coding syntax in your primary language on a clean canvas",
      "Review core CS fundamentals (OS, Computer Networks, DBMS)",
      "Solve 2-3 medium complexity questions on recursion/dynamic programming"
    ];
    if (lowerRole.includes("frontend") || lowerRole.includes("web")) {
      roleTasks.push(
        "Brush up on JS concepts (closures, event loop, promises, scoping)",
        "Review React/Next.js lifecycle, state management, and DOM optimization",
        "Practice building UI layouts using CSS Flexbox/Grid under 30 mins"
      );
    } else if (lowerRole.includes("backend")) {
      roleTasks.push(
        "Review REST API designs, status codes, and server performance optimizations",
        "Review database design patterns, normalization, indexes, and caching (Redis)",
        "Review concurrency, multithreading, and message queues (Kafka)"
      );
    }
  } else if (lowerRole.includes("analyst") || lowerRole.includes("data")) {
    roleTasks = [
      "Review advanced SQL queries (Window functions, CTEs, Joins, Group By)",
      "Revise probability, statistics, and hypothesis testing concepts",
      "Be ready to explain ML models (regression, classification) if on resume",
      "Practice mock business scenarios to extract metric gains from data tables"
    ];
  }

  if (lowerRound.includes("managerial") || lowerRound.includes("system design")) {
    roleTasks.push(
      "Review System Design core principles (scaling, load balancers, caching, databases)",
      "Practice whiteboarding clean component layout structure designs",
      "Prepare answers around engineering leadership, conflict resolution, and timelines"
    );
  } else if (lowerRound.includes("hr") || lowerRound.includes("behavioral")) {
    roleTasks.push(
      "Prepare answers for: Tell me about yourself, Why did you apply, Where do you see yourself in 5 years",
      "Be ready to discuss salary expectations and relocation parameters",
      "Prepare stories demonstrating team collaborations and handling mistakes"
    );
  }

  return {
    checklist,
    companyTasks,
    roleTasks
  };
}

// Kanban columns definitions
const KANBAN_STAGES: { id: string; label: string; statuses: PlacementApplication["status"][]; color: string; border: string; bg: string; dot: string }[] = [
  { id: "Saved", label: "Saved", statuses: ["Saved"], color: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50/20", dot: "bg-slate-400" },
  { id: "Applied", label: "Applied", statuses: ["Applied"], color: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50/10", dot: "bg-blue-500" },
  { id: "Assessment", label: "Assessment", statuses: ["Assessment Scheduled", "Assessment Completed"], color: "text-yellow-600", border: "border-yellow-200", bg: "bg-yellow-50/10", dot: "bg-yellow-500" },
  { id: "Technical", label: "Technical", statuses: ["Technical Interview"], color: "text-indigo-650", border: "border-indigo-200", bg: "bg-indigo-50/10", dot: "bg-indigo-650" },
  { id: "HR", label: "HR Round", statuses: ["HR Interview"], color: "text-pink-600", border: "border-pink-200", bg: "bg-pink-50/10", dot: "bg-pink-500" },
  { id: "Offer", label: "Offer", statuses: ["Offer Received"], color: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50/10", dot: "bg-emerald-500" },
  { id: "Joined", label: "Joined", statuses: ["Joined"], color: "text-cyan-600", border: "border-cyan-200", bg: "bg-cyan-50/10", dot: "bg-cyan-500" },
  { id: "Rejected", label: "Rejected", statuses: ["Rejected"], color: "text-rose-600", border: "border-rose-200", bg: "bg-rose-50/10", dot: "bg-rose-500" }
];

const PREDEFINED_COMPANIES = ["Google", "IBM", "Deloitte", "TCS", "Accenture", "Microsoft", "Amazon", "Wipro", "Infosys", "Custom..."];

export default function PlacementTrackerOS() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "calendar" | "oas" | "interviews" | "offers" | "copilot" | "gmail" | "extension">("dashboard");
  const [apps, setApps] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Accordion state for checklist expansion in Interviews tab
  const [expandedChecklistSchId, setExpandedChecklistSchId] = useState<string | null>(null);

  // Gmail Ingestion States
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailLastSync, setGmailLastSync] = useState<string | null>(null);
  const [gmailSyncLogs, setGmailSyncLogs] = useState<any[]>([]);
  const [gmailSyncLoading, setGmailSyncLoading] = useState(false);
  const [gmailActionLoading, setGmailActionLoading] = useState(false);
  const [approvingLogId, setApprovingLogId] = useState<string | null>(null);

  // Outlook Calendar Sync States
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState<string | null>(null);
  const [outlookLastSync, setOutlookLastSync] = useState<string | null>(null);
  const [outlookActionLoading, setOutlookActionLoading] = useState(false);
  const [googleCalendarSyncEnabled, setGoogleCalendarSyncEnabled] = useState(true);
  const [outlookCalendarSyncEnabled, setOutlookCalendarSyncEnabled] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Load User and CRM Applications
  const loadTrackerData = async (uid: string) => {
    setLoading(true);
    try {
      const data = await getApplications(uid);
      setApps(data);
      localStorage.setItem("placement_crm_applications", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to load crm tracker:", err);
      // Fallback cache
      const stored = localStorage.getItem("placement_crm_applications");
      if (stored) {
        setApps(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadTrackerData(user.id);
      } else {
        setLoading(false);
      }
    }
    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadTrackerData(session.user.id);
      } else {
        setUserId(null);
        setApps([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchGmailStatus = async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/placement/gmail/sync");
      const data = await res.json();
      if (res.ok && data.success) {
        setGmailConnected(data.connected);
        setGmailEmail(data.gmailEmail);
        setGmailLastSync(data.lastSync);
        setGmailSyncLogs(data.logs || []);
        setGoogleCalendarSyncEnabled(data.syncEnabled);
      }
    } catch (err) {
      console.error("Failed to fetch gmail status:", err);
    }
  };

  const fetchOutlookStatus = async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/placement/outlook/sync");
      const data = await res.json();
      if (res.ok && data.success) {
        setOutlookConnected(data.connected);
        setOutlookEmail(data.outlookEmail);
        setOutlookLastSync(data.lastSync);
        setOutlookCalendarSyncEnabled(data.syncEnabled);
      }
    } catch (err) {
      console.error("Failed to fetch outlook status:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchGmailStatus();
      fetchOutlookStatus();
    }
  }, [userId, activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("gmail_sync") === "success") {
        alert("Gmail Integration successfully connected!");
        window.history.replaceState({}, document.title, window.location.pathname);
        if (userId) {
          fetchGmailStatus();
        }
      } else if (params.get("gmail_sync_error")) {
        const error = params.get("gmail_sync_error");
        alert(`Failed to connect Gmail integration: ${error}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get("outlook_sync") === "success") {
        alert("Outlook Calendar Integration successfully connected!");
        window.history.replaceState({}, document.title, window.location.pathname);
        if (userId) {
          fetchOutlookStatus();
        }
      } else if (params.get("outlook_sync_error")) {
        const error = params.get("outlook_sync_error");
        alert(`Failed to connect Outlook integration: ${error}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [userId]);

  const handleConnectGmail = async () => {
    setGmailActionLoading(true);
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to generate Google auth URL.");
      }
    } catch {
      alert("Failed to initialize Google OAuth connection.");
    } finally {
      setGmailActionLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setGmailSyncLoading(true);
    try {
      const res = await fetch("/api/placement/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Sync complete! Ingested ${data.countCreated} new applications and updated ${data.countUpdated} existing pipelines.`);
        if (userId) {
          await loadTrackerData(userId);
          await fetchGmailStatus();
        }
      } else {
        alert(data.message || "Gmail synchronization failed.");
      }
    } catch {
      alert("An unexpected error occurred during sync.");
    } finally {
      setGmailSyncLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm("Are you sure you want to disconnect Gmail? Auto sync updates will cease.")) return;
    setGmailActionLoading(true);
    try {
      const res = await fetch("/api/placement/gmail/disconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Gmail integration disconnected.");
        setGmailConnected(false);
        setGmailEmail(null);
        setGmailLastSync(null);
        setGmailSyncLogs([]);
      } else {
        alert(data.message || "Disconnect action failed.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setGmailActionLoading(false);
    }
  };

  const handleApproveSuspiciousLog = async (logId: string) => {
    setApprovingLogId(logId);
    try {
      const res = await fetch("/api/placement/trust/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Email approved and CRM application updated successfully!");
        if (userId) {
          await loadTrackerData(userId);
          await fetchGmailStatus();
        }
      } else {
        alert(data.message || "Approval action failed.");
      }
    } catch (err) {
      alert("An unexpected error occurred during approval.");
    } finally {
      setApprovingLogId(null);
    }
  };

  const handleConnectOutlook = async () => {
    setOutlookActionLoading(true);
    try {
      const res = await fetch("/api/auth/outlook/url");
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to generate Outlook auth URL.");
      }
    } catch {
      alert("Failed to initialize Outlook OAuth connection.");
    } finally {
      setOutlookActionLoading(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    if (!window.confirm("Are you sure you want to disconnect Outlook Calendar? Sync will cease.")) return;
    setOutlookActionLoading(true);
    try {
      const res = await fetch("/api/placement/outlook/disconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Outlook integration disconnected.");
        setOutlookConnected(false);
        setOutlookEmail(null);
        setOutlookLastSync(null);
        setOutlookCalendarSyncEnabled(false);
      } else {
        alert(data.message || "Disconnect action failed.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setOutlookActionLoading(false);
    }
  };

  const handleToggleGoogleCalendar = async (checked: boolean) => {
    try {
      const res = await fetch("/api/placement/gmail/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleCalendarSyncEnabled(checked);
      } else {
        alert(data.message || "Failed to toggle Google Calendar sync.");
      }
    } catch {
      alert("An error occurred toggling Google Calendar sync.");
    }
  };

  const handleToggleOutlookCalendar = async (checked: boolean) => {
    try {
      const res = await fetch("/api/placement/outlook/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOutlookCalendarSyncEnabled(checked);
      } else {
        alert(data.message || "Failed to toggle Outlook Calendar sync.");
      }
    } catch {
      alert("An error occurred toggling Outlook Calendar sync.");
    }
  };

  // Visual metrics calculations
  const totalAppsCount = apps.length;
  const activeApps = apps.filter(a => !["Saved", "Offer Received", "Joined", "Rejected", "Withdrawn"].includes(a.status));
  const activeAppsCount = activeApps.length;
  const offersCount = apps.filter(a => a.status === "Offer Received" || a.status === "Joined").length;
  const rejectionsCount = apps.filter(a => a.status === "Rejected").length;

  // Schedules (OA or Interviews in next 48 hours)
  const upcomingInterviewsCount = apps.reduce((count, app) => {
    const today = new Date();
    const schedules = app.schedules || [];
    const upcomingSchedules = schedules.filter(sch => {
      const schDate = new Date(sch.date);
      const diffTime = schDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7; // Next 7 days
    });
    return count + upcomingSchedules.length;
  }, 0);

  // Success Rates Formulations
  const offerSuccessRate = totalAppsCount > 0 ? Math.round((offersCount / totalAppsCount) * 100) : 0;
  
  const totalInterviewsCount = apps.reduce((sum, a) => sum + (a.interviews?.length || 0), 0);
  const interviewConversion = totalAppsCount > 0 ? Math.round((totalInterviewsCount / totalAppsCount) * 100) : 0;
  
  const offerConversion = totalInterviewsCount > 0 ? Math.round((offersCount / totalInterviewsCount) * 100) : 0;
  const rejectionRate = totalAppsCount > 0 ? Math.round((rejectionsCount / totalAppsCount) * 100) : 0;

  // total OAs count
  const totalOAsCount = apps.reduce((sum, a) => sum + (a.oas?.length || 0), 0);
  const clearedOAsCount = apps.reduce((sum, a) => sum + (a.oas?.filter(o => o.result === "Cleared").length || 0), 0);
  const oaSuccessRate = totalOAsCount > 0 ? Math.round((clearedOAsCount / totalOAsCount) * 100) : 0;

  // Streaks indicators
  const platformScores = { ats: 78, mockInterviews: 65, projects: 2, linkedin: 75 };

  // Drag and drop mechanics
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("text/plain", appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain");
    if (!appId || !userId) return;

    // Map column ID to default status
    const colStatusMap: Record<string, PlacementApplication["status"]> = {
      Saved: "Saved",
      Applied: "Applied",
      Assessment: "Assessment Scheduled",
      Technical: "Technical Interview",
      HR: "HR Interview",
      Offer: "Offer Received",
      Joined: "Joined",
      Rejected: "Rejected"
    };

    const targetStatus = colStatusMap[targetColId] || "Applied";

    // Optimistic Update
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: targetStatus } : a));

    try {
      const { success } = await updateApplicationStatus(appId, targetStatus, userId);
      if (success) {
        calculatePRIScore(userId).catch(console.error);
        // Confetti trigger sounds
        if (targetStatus === "Offer Received" || targetStatus === "Joined") {
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
            audio.volume = 0.15;
            audio.play().catch(() => {});
          } catch {}
        }
      } else {
        // Rollback
        loadTrackerData(userId);
      }
    } catch (err) {
      console.error(err);
      loadTrackerData(userId);
    }
  };

  // Applications Form Modal and Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<PlacementApplication | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [packageCtc, setPackageCtc] = useState("");
  const [appDate, setAppDate] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [referralStatus, setReferralStatus] = useState<PlacementApplication["referralStatus"]>("None");
  const [status, setStatus] = useState<PlacementApplication["status"]>("Applied");
  const [notes, setNotes] = useState("");

  const [recName, setRecName] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [recLinkedIn, setRecLinkedIn] = useState("");

  // Subform lists
  const [subOas, setSubOas] = useState<OARecord[]>([]);
  const [subInterviews, setSubInterviews] = useState<InterviewRoundRecord[]>([]);

  // Detailed Offer Fields
  const [offerCtc, setOfferCtc] = useState("");
  const [offerBase, setOfferBase] = useState("");
  const [offerBonus, setOfferBonus] = useState("");
  const [offerLoc, setOfferLoc] = useState("");
  const [offerJoinDate, setOfferJoinDate] = useState("");

  const openAppForm = (app?: PlacementApplication) => {
    if (app) {
      setEditingApp(app);
      setCompanyName(PREDEFINED_COMPANIES.includes(app.companyName) ? app.companyName : "Custom...");
      setCustomCompany(PREDEFINED_COMPANIES.includes(app.companyName) ? "" : app.companyName);
      setRole(app.role);
      setLocation(app.location);
      setPackageCtc(app.package);
      setAppDate(app.applicationDate || new Date().toISOString().split("T")[0]);
      setJobUrl(app.jobUrl || "");
      setReferralStatus(app.referralStatus || "None");
      setStatus(app.status);
      setNotes(app.notes || "");
      setRecName(app.recruiter?.name || "");
      setRecEmail(app.recruiter?.email || "");
      setRecPhone(app.recruiter?.phone || "");
      setRecLinkedIn(app.recruiter?.linkedIn || "");
      setSubOas(app.oas || []);
      setSubInterviews(app.interviews || []);
      setSubSchedules(app.schedules || []);

      if (app.offer) {
        setOfferCtc(app.offer.ctc || "");
        setOfferBase(app.offer.baseSalary || "");
        setOfferBonus(app.offer.joiningBonus || "");
        setOfferLoc(app.offer.location || "");
        setOfferJoinDate(app.offer.joiningDate || "");
      } else {
        setOfferCtc("");
        setOfferBase("");
        setOfferBonus("");
        setOfferLoc("");
        setOfferJoinDate("");
      }
    } else {
      setEditingApp(null);
      setCompanyName("IBM");
      setCustomCompany("");
      setRole("");
      setLocation("");
      setPackageCtc("");
      setAppDate(new Date().toISOString().split("T")[0]);
      setJobUrl("");
      setReferralStatus("None");
      setStatus("Applied");
      setNotes("");
      setRecName("");
      setRecEmail("");
      setRecPhone("");
      setRecLinkedIn("");
      setSubOas([]);
      setSubInterviews([]);
      setSubSchedules([]);
      setOfferCtc("");
      setOfferBase("");
      setOfferBonus("");
      setOfferLoc("");
      setOfferJoinDate("");
    }
    setIsFormOpen(true);
  };

  const handleSaveApplication = async () => {
    const finalCompanyName = companyName === "Custom..." ? customCompany.trim() : companyName;
    if (!finalCompanyName || !role || !location || !packageCtc || !appDate || !userId) {
      alert("Please enter all mandatory fields (Company, Role, Location, Package, Date).");
      return;
    }

    let detailedOffer: OfferDetails | undefined = undefined;
    if (status === "Offer Received" || status === "Joined") {
      detailedOffer = {
        ctc: offerCtc || packageCtc,
        baseSalary: offerBase || packageCtc,
        joiningBonus: offerBonus || "0",
        location: offerLoc || location,
        joiningDate: offerJoinDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        growthRating: editingApp?.offer?.growthRating || 4,
        exposureRating: editingApp?.offer?.exposureRating || 4,
        brandValueRating: editingApp?.offer?.brandValueRating || 4,
        potentialRating: editingApp?.offer?.potentialRating || 4
      };
    }

    const payloadApp: Partial<PlacementApplication> = {
      companyName: finalCompanyName,
      role,
      location,
      package: packageCtc,
      applicationDate: appDate,
      jobUrl: jobUrl || undefined,
      referralStatus,
      status,
      notes: notes || undefined,
      recruiter: recName ? {
        name: recName,
        email: recEmail,
        phone: recPhone || undefined,
        linkedIn: recLinkedIn || undefined
      } : undefined,
      schedules: subSchedules,
      oas: subOas,
      interviews: subInterviews,
      offer: detailedOffer,
      matchScore: editingApp?.matchScore || {
        resumeMatch: platformScores.ats,
        interviewReadiness: platformScores.mockInterviews,
        overallProbability: 70
      }
    };

    setLoading(true);
    try {
      if (editingApp) {
        const { success } = await updateApplication(editingApp.id, payloadApp, userId);
        if (!success) throw new Error("Update failed");
      } else {
        const { success } = await createApplication(userId, payloadApp);
        if (!success) throw new Error("Insert failed");
      }
      calculatePRIScore(userId).catch(console.error);
      await loadTrackerData(userId);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save application to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!userId) return;
    if (window.confirm("Are you sure you want to delete this application log?")) {
      setLoading(true);
      try {
        const { success } = await deleteApplication(id, userId);
        if (success) {
          calculatePRIScore(userId).catch(console.error);
          await loadTrackerData(userId);
          setIsFormOpen(false);
        } else {
          alert("Failed to delete application.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add individual Schedule to the form scope
  const [subSchedules, setSubSchedules] = useState<InterviewSchedule[]>([]);
  const [newSchType, setNewSchType] = useState<InterviewSchedule["type"]>("Technical Interview");
  const [newSchDate, setNewSchDate] = useState("");
  const [newSchTime, setNewSchTime] = useState("");
  const [newSchPlatform, setNewSchPlatform] = useState("Google Meet");
  const [newSchMode, setNewSchMode] = useState("Online"); // Online, In-Person, Phone Call
  const [newSchMeetingLink, setNewSchMeetingLink] = useState("");
  const [newSchRecName, setNewSchRecName] = useState("");
  const [newSchRecEmail, setNewSchRecEmail] = useState("");
  const [newSchRecPhone, setNewSchRecPhone] = useState("");
  const [newSchNotes, setNewSchNotes] = useState("");

  const handleAddScheduleToForm = () => {
    if (!newSchDate) return;
    const finalCompanyName = companyName === "Custom..." ? customCompany.trim() : companyName;
    const prep = generateInterviewPrepMaterial(finalCompanyName || "Custom Company", role || "Job Role", newSchType);
    const newSch: InterviewSchedule = {
      id: `sch-${Date.now()}`,
      type: newSchType,
      date: newSchDate,
      time: newSchTime || "12:00 PM",
      platform: newSchPlatform,
      mode: newSchMode,
      meetingLink: newSchMeetingLink || undefined,
      recruiterName: newSchRecName || undefined,
      recruiterEmail: newSchRecEmail || undefined,
      recruiterPhone: newSchRecPhone || undefined,
      notes: newSchNotes || undefined,
      checklist: prep.checklist,
      companyTasks: prep.companyTasks,
      roleTasks: prep.roleTasks
    };
    setSubSchedules([...subSchedules, newSch]);
    setNewSchDate("");
    setNewSchTime("");
    setNewSchPlatform("Google Meet");
    setNewSchMode("Online");
    setNewSchMeetingLink("");
    setNewSchRecName("");
    setNewSchRecEmail("");
    setNewSchRecPhone("");
    setNewSchNotes("");
  };

  const handleToggleChecklistTask = async (appId: string, scheduleId: string, taskType: "checklist" | "companyTasks" | "roleTasks", taskIndex: number) => {
    if (!userId) return;
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const updatedSchedules = app.schedules.map(sch => {
      if (sch.id !== scheduleId) return sch;
      const taskList = [...(sch[taskType] || [])];
      const task = taskList[taskIndex];
      if (task.startsWith("[x] ")) {
        taskList[taskIndex] = task.substring(4);
      } else {
        taskList[taskIndex] = `[x] ${task}`;
      }
      return {
        ...sch,
        [taskType]: taskList
      };
    });

    // Optimistic update
    setApps(prev => prev.map(a => a.id === appId ? { ...a, schedules: updatedSchedules } : a));

    try {
      await updateApplication(appId, { schedules: updatedSchedules }, userId);
    } catch (err) {
      console.error("Failed to update checklist task:", err);
      loadTrackerData(userId);
    }
  };

  // Add individual OA to the form scope
  const [newOaDate, setNewOaDate] = useState("");
  const [newOaDiff, setNewOaDiff] = useState<OARecord["difficulty"]>("Medium");
  const [newOaScore, setNewOaScore] = useState(80);
  const [newOaResult, setNewOaResult] = useState<OARecord["result"]>("Pending");
  const [newOaTopics, setNewOaTopics] = useState("");
  const [newOaNotes, setNewOaNotes] = useState("");
  const [newOaPlatform, setNewOaPlatform] = useState("HackerRank");
  const [newOaDuration, setNewOaDuration] = useState(90);

  const handleAddOaToForm = () => {
    if (!newOaDate) return;
    const newOa: OARecord = {
      id: `oa-${Date.now()}`,
      oaDate: newOaDate,
      difficulty: newOaDiff,
      topicsAsked: newOaTopics.split(",").map(t => t.trim()).filter(Boolean),
      score: Number(newOaScore),
      result: newOaResult,
      prepNotes: newOaNotes,
      platform: newOaPlatform,
      duration: Number(newOaDuration) || 90,
      deadline: newOaDate,
      status: newOaResult === "Pending" ? "Pending" : newOaResult === "Failed" ? "Expired" : "Completed"
    };
    setSubOas([...subOas, newOa]);
    setNewOaDate("");
    setNewOaTopics("");
    setNewOaNotes("");
  };

  // Add individual Interview Round to the form scope
  const [newIntName, setNewIntName] = useState("Technical Round");
  const [newIntFeedback, setNewIntFeedback] = useState("");
  const [newIntRating, setNewIntRating] = useState(4);
  const [newIntWeak, setNewIntWeak] = useState("");
  const [newIntImprove, setNewIntImprove] = useState("");
  const [newIntOutcome, setNewIntOutcome] = useState<InterviewRoundRecord["outcome"]>("Pending");
  const [newIntQuestions, setNewIntQuestions] = useState("");

  const handleAddIntToForm = () => {
    const newInt: InterviewRoundRecord = {
      id: `int-${Date.now()}`,
      roundName: newIntName,
      questionsAsked: newIntQuestions.split("\n").map(q => q.trim()).filter(Boolean),
      feedback: newIntFeedback,
      performanceRating: Number(newIntRating),
      weakAreas: newIntWeak.split(",").map(w => w.trim()).filter(Boolean),
      improvementAreas: newIntImprove.split(",").map(i => i.trim()).filter(Boolean),
      outcome: newIntOutcome
    };
    setSubInterviews([...subInterviews, newInt]);
    setNewIntFeedback("");
    setNewIntWeak("");
    setNewIntImprove("");
    setNewIntQuestions("");
  };

  // AI Offer Comparison Interface
  const [comparingOffers, setComparingOffers] = useState(false);
  const [offerRecommendation, setOfferRecommendation] = useState<string | null>(null);

  const handleTriggerOfferComparison = async () => {
    const offersList = apps.filter(a => a.status === "Offer Received" || a.status === "Joined");
    if (offersList.length === 0) {
      alert("No active offers received. Change an application status to 'Offer Received' first.");
      return;
    }

    setComparingOffers(true);
    setOfferRecommendation(null);

    const compiledOffers = offersList.map(a => ({
      company: a.companyName,
      role: a.role,
      ctc: a.offer?.ctc || a.package,
      baseSalary: a.offer?.baseSalary || "N/A",
      joiningBonus: a.offer?.joiningBonus || "N/A",
      location: a.offer?.location || a.location,
      brandValue: a.offer?.brandValueRating || 4,
      potential: a.offer?.potentialRating || 4
    }));

    try {
      const res = await fetch("/api/placement/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "compare-offers",
          offers: compiledOffers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOfferRecommendation(data.data.aiRecommendation);
    } catch {
      const topOffer = compiledOffers[0];
      setOfferRecommendation(`### ⚖️ AI Career Recommendation (Offline Fallback)
Evaluating your active offers:
*   **${topOffer.company}** offering **${topOffer.ctc}** in **${topOffer.location}**.

We recommend accepting **${topOffer.company}** due to higher compensation package guidelines.`);
    } finally {
      setComparingOffers(false);
    }
  };

  // AI Insights report generator
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{ strengths: string[]; weaknesses: string[]; recommendations: string[] } | null>(null);

  const generateAiInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/placement/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "application-insights",
          applications: apps,
          targetRole: "Software Engineer",
          atsScore: platformScores.ats,
          averageInterviewScore: platformScores.mockInterviews
        })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAiReport(data.data);
      } else {
        throw new Error();
      }
    } catch {
      setAiReport({
        strengths: [
          "Healthy volume of job logs tracked.",
          "Target role alignment is clear.",
          "Good active responses logged."
        ],
        weaknesses: [
          "Online assessment pass ratios are average.",
          "High volume in Applied state without update transitions.",
          "Fewer mock interview logs practiced."
        ],
        recommendations: [
          "Take more simulated coding challenges on HackerRank.",
          "Schedule technical mock interviews inside Mentorship OS.",
          "Reach out to recruiters directly on LinkedIn to secure referrals."
        ]
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  // Placement Copilot Strategic Chat Section
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "cop-welcome",
      role: "copilot",
      content: "Hello! I am your **AI Placement Strategy Advisor**. Ask me questions like:\n* *Why am I getting rejected?*\n* *What should I improve to hit placement readiness?*\n* *Am I placement ready?*\n* *What companies should I target based on my stack?*"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendCopilotQuery = async (customPrompt?: string) => {
    const query = (customPrompt || chatInput).trim();
    if (!query) return;

    setChatInput("");
    const userMsg = { id: `cop-msg-${Date.now()}-user`, role: "user" as const, content: query };
    const updatedMessages = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: "Software Engineer",
            atsScore: platformScores.ats,
            interviewAvg: platformScores.mockInterviews,
            crmApplications: apps
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();
      setCopilotMessages([
        ...updatedMessages,
        { id: `cop-msg-${Date.now()}-cop`, role: "copilot" as const, content: data.data.reply }
      ]);
    } catch {
      setCopilotMessages([
        ...updatedMessages,
        { id: `cop-msg-${Date.now()}-cop`, role: "copilot" as const, content: "My server is currently busy. Focus on completing your planner checklist and scaling application volumes." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Monthly Calendar View Mechanics
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const calendarEvents = useMemo(() => {
    const events: Record<string, Array<{ id: string; appId: string; label: string; type: "oa" | "interview" | "followup"; color: string }>> = {};
    
    apps.forEach(app => {
      // OA Dates
      (app.oas || []).forEach(oa => {
        if (oa.oaDate) {
          const dateStr = oa.oaDate;
          if (!events[dateStr]) events[dateStr] = [];
          events[dateStr].push({
            id: oa.id,
            appId: app.id,
            label: `${app.companyName} OA`,
            type: "oa",
            color: "bg-yellow-500 text-yellow-950 text-[9px] border-yellow-200"
          });
        }
      });

      // Interviews
      (app.schedules || []).forEach(sch => {
        if (sch.date) {
          const dateStr = sch.date;
          if (!events[dateStr]) events[dateStr] = [];
          events[dateStr].push({
            id: sch.id,
            appId: app.id,
            label: `${app.companyName} ${sch.type}`,
            type: "interview",
            color: "bg-indigo-500 text-white text-[9px] border-indigo-300"
          });
        }
      });
    });

    return events;
  }, [apps]);

  const allSchedules = useMemo(() => {
    const list: Array<{ app: PlacementApplication; schedule: InterviewSchedule }> = [];
    apps.forEach(app => {
      (app.schedules || []).forEach(schedule => {
        list.push({ app, schedule });
      });
    });
    return list.sort((a, b) => new Date(a.schedule.date).getTime() - new Date(b.schedule.date).getTime());
  }, [apps]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const days = [];

    // Prev Month filler days
    for (let i = firstDayIndex; i > 0; i--) {
      const date = new Date(year, month - 1, prevLastDay - i + 1);
      days.push({
        date,
        isCurrentMonth: false,
        key: `prev-${prevLastDay - i + 1}`
      });
    }

    // Current Month days
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        key: `curr-${i}`
      });
    }

    // Next Month filler days
    const totalSlots = 35; // 5 weeks row
    const remaining = totalSlots - days.length;
    const nextMonthFill = remaining > 0 ? remaining : (remaining + 7);
    for (let i = 1; i <= nextMonthFill; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        key: `next-${i}`
      });
    }

    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Table view states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");

  const filteredApps = useMemo(() => {
    return apps.filter(a => {
      const matchesSearch = a.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "All" || a.status === filterStatus;
      const matchesLocation = filterLocation === "All" || a.location.toLowerCase().includes(filterLocation.toLowerCase());
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [apps, searchQuery, filterStatus, filterLocation]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set(apps.map(a => a.location?.trim()).filter(Boolean));
    return Array.from(locs);
  }, [apps]);

  if (loading && totalAppsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading Tracker OS PERSISTENCE LAYER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans pb-16">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100 shadow-sm animate-pulse">
            <Layers className="w-3.5 h-3.5" />
            Supabase Database Persistent Layer Active
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
            Application Tracker OS
          </h1>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            Connect directly to Supabase CRM to manage pipelines, status progression history, and strategic insights.
          </p>
        </div>

        {userId ? (
          <button
            onClick={() => openAppForm()}
            className="px-5 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-teal-650 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-teal-100/10"
          >
            <Plus className="w-4.5 h-4.5 text-teal-300" />
            <span>Add Application</span>
          </button>
        ) : (
          <div className="px-5 py-3.5 bg-amber-50 text-amber-700 font-black text-xs uppercase rounded-2xl">
            🔒 Log in to Track Applications
          </div>
        )}
      </div>

      {/* CORE NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
        {[
          { id: "dashboard", label: "Analytics Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "kanban", label: `Kanban Board (${apps.length})`, icon: <Layers className="w-4 h-4" /> },
          { id: "calendar", label: "Application Calendar", icon: <CalendarIcon className="w-4 h-4" /> },
          { id: "oas", label: `OA Tracker (${totalOAsCount})`, icon: <Activity className="w-4 h-4" /> },
          { id: "interviews", label: `Interview Tracker (${totalInterviewsCount})`, icon: <FileText className="w-4 h-4" /> },
          { id: "offers", label: "Offer Comparisons", icon: <DollarSign className="w-4 h-4" /> },
          { id: "copilot", label: "AI Intelligence", icon: <Bot className="w-4 h-4" /> },
          { id: "gmail", label: "Sync & Integrations", icon: <Mail className="w-4 h-4" /> },
          { id: "extension", label: "Browser Extension", icon: <Globe className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <AnimatePresence mode="wait">
        
        {/* 1. ANALYTICS DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* METRIC CARDS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: "Total Applications", value: `${totalAppsCount} Apps`, sub: "Logged in tracker", color: "text-slate-800", bg: "bg-white" },
                { label: "Active Applications", value: `${activeAppsCount} Active`, sub: "In recruitment cycles", color: "text-blue-600", bg: "bg-white" },
                { label: "Interviews Scheduled", value: `${upcomingInterviewsCount} Upcoming`, sub: "In next 7 calendar days", color: "text-indigo-650", bg: "bg-white" },
                { label: "Offers Received", value: `${offersCount} Offers`, sub: "Success offers cleared", color: "text-emerald-600", bg: "bg-white" },
                { label: "Total Rejections", value: `${rejectionsCount} Rejections`, sub: "Rejection drop-offs logs", color: "text-rose-500", bg: "bg-white" }
              ].map((card, idx) => (
                <div key={idx} className={cn("p-6 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[140px]", card.bg)}>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{card.label}</span>
                  <strong className={cn("text-3xl font-black font-display tracking-tight my-2 block", card.color)}>{card.value}</strong>
                  <span className="text-[9px] text-slate-400 font-bold block leading-none">{card.sub}</span>
                </div>
              ))}
            </div>

            {/* HIGH FIDELITY CUSTOM SVG CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Funnels and SVG chart indicators */}
              <div className="md:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-8 text-left">
                <h3 className="text-xl font-black text-slate-900 font-display">Placement Conversion Funnels</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Gauge 1: Success Rate */}
                  <div className="bg-slate-50/50 p-6 border border-slate-150 rounded-3xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Success Rate</span>
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="44" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                        <circle cx="56" cy="56" r="44" className="text-emerald-500" strokeWidth="8" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 * (1 - offerSuccessRate / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-800">{offerSuccessRate}%</span>
                        <span className="text-[7px] font-black text-slate-400 block uppercase tracking-widest">CTC Cleared</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-450 font-bold block text-center mt-3">{offersCount} Offers out of {totalAppsCount} apps</span>
                  </div>

                  {/* Gauge 2: Interview Conversion */}
                  <div className="bg-slate-50/50 p-6 border border-slate-150 rounded-3xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Interview Conv.</span>
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="44" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                        <circle cx="56" cy="56" r="44" className="text-blue-500" strokeWidth="8" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 * (1 - interviewConversion / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-800">{interviewConversion}%</span>
                        <span className="text-[7px] font-black text-slate-400 block uppercase tracking-widest">Invites rate</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-450 font-bold block text-center mt-3">{totalInterviewsCount} Interviews out of {totalAppsCount} apps</span>
                  </div>

                  {/* Gauge 3: Offer Conversion */}
                  <div className="bg-slate-50/50 p-6 border border-slate-150 rounded-3xl flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Offer Conversion</span>
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="44" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                        <circle cx="56" cy="56" r="44" className="text-indigo-650" strokeWidth="8" stroke="currentColor" fill="transparent"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 * (1 - offerConversion / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-800">{offerConversion}%</span>
                        <span className="text-[7px] font-black text-slate-400 block uppercase tracking-widest">Cleared rate</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-450 font-bold block text-center mt-3">{offersCount} Offers from {totalInterviewsCount} rounds</span>
                  </div>
                </div>

                {/* Horizontal Funnel Progress representation */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recruitment Stages Dropping Rates</strong>
                  <div className="space-y-2">
                    {[
                      { label: "Applied Pipelines Volume", count: totalAppsCount, rate: 100, color: "bg-blue-500" },
                      { label: "Assessment Tests Scheduled", count: totalOAsCount, rate: totalAppsCount > 0 ? Math.round((totalOAsCount / totalAppsCount) * 100) : 0, color: "bg-yellow-500" },
                      { label: "Cleared Assessments (Passed)", count: clearedOAsCount, rate: totalOAsCount > 0 ? Math.round((clearedOAsCount / totalOAsCount) * 100) : 0, color: "bg-purple-500" },
                      { label: "Interview Scheduled Loops", count: totalInterviewsCount, rate: totalAppsCount > 0 ? Math.round((totalInterviewsCount / totalAppsCount) * 100) : 0, color: "bg-indigo-600" },
                      { label: "Definitive Offers Received", count: offersCount, rate: totalAppsCount > 0 ? Math.round((offersCount / totalAppsCount) * 100) : 0, color: "bg-emerald-500" }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>{item.label}</span>
                          <span>{item.count} ({item.rate}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Diagnostics & Integrations suggestions */}
              <div className="md:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Failures Diagnostics</span>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">Rejection Rate Breakdown</h3>
                  </div>

                  <div className="bg-rose-50/40 p-4 border border-rose-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-rose-700 font-extrabold">Overall Rejection Rate:</strong>
                      <span className="font-mono font-black text-rose-600 text-sm">{rejectionRate}%</span>
                    </div>
                    <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${rejectionRate}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resume OS ATS advice</strong>
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
                      {rejectionRate >= 50 ? (
                        <p>⚠️ **ATS score is lagging (Currently 78%)**. Your target roles require more keywords alignment like **SQL Subqueries**, **Spring Boot**, and **System Design API limits**.</p>
                      ) : (
                        <p>✓ Resume is healthy. Keep tailoring keyword densities using JD Matcher prior to uploads.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab("copilot")}
                    className="w-full py-3 bg-slate-900 hover:bg-teal-650 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Bot className="w-4 h-4 text-teal-300 animate-pulse" />
                    <span>Run AI Diagnostics</span>
                  </button>
                </div>
              </div>

            </div>

            {/* TABLE VIEW: SEARCH & FILTER APPLICATION ENTRIES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl font-black text-slate-900 font-display">Applications Log Directory</h3>
                
                {/* Search query inputs */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search company or role..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Assessment Scheduled">Assessment Scheduled</option>
                    <option value="Assessment Completed">Assessment Completed</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="HR Interview">HR Interview</option>
                    <option value="Offer Received">Offer Received</option>
                    <option value="Joined">Joined</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              {/* Applications directory Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-250 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-250">
                    <tr>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Applied Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Salary</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {filteredApps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <strong className="text-slate-800 text-xs block">{app.companyName}</strong>
                          {app.jobUrl && (
                            <a href={app.jobUrl} target="_blank" className="text-[9px] text-blue-500 font-bold hover:underline flex items-center gap-1 mt-0.5">
                              Portal Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">{app.role}</td>
                        <td className="px-6 py-4 font-mono">{app.applicationDate || "N/A"}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-black uppercase rounded border",
                            app.status === "Offer Received" || app.status === "Joined"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : app.status === "Rejected"
                              ? "bg-rose-50 border-rose-100 text-rose-600"
                              : "bg-blue-50 border-blue-100 text-blue-600"
                          )}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-800">{app.package}</td>
                        <td className="px-6 py-4 text-slate-500">{app.location}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => openAppForm(app)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <Link
                            href={`/application/${app.id}`}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-650 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-extrabold uppercase">
                          No tracked applications match your current queries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. KANBAN PIPELINE */}
        {activeTab === "kanban" && (
          <motion.div
            key="kanban-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Horizontal swipe instructions for mobile */}
            <div className="block lg:hidden p-3 bg-slate-100 rounded-xl text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
              ← Horizontal swipe to view columns & drag cards →
            </div>

            {/* Kanban Drag-and-drop Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 pr-1 min-h-[600px] select-none items-start">
              {KANBAN_STAGES.map(col => {
                const columnApps = apps.filter(a => col.statuses.includes(a.status));
                return (
                  <div
                    key={col.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={cn("w-72 bg-slate-50/50 border border-slate-200/80 rounded-[2rem] p-4 flex-shrink-0 space-y-4 min-h-[500px] flex flex-col justify-between", col.bg)}
                  >
                    <div className="space-y-4 flex-grow">
                      {/* Header Stage */}
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", col.dot)} />
                          <strong className="text-xs font-black text-slate-800 uppercase tracking-widest">{col.label}</strong>
                        </div>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500">
                          {columnApps.length}
                        </span>
                      </div>

                      {/* Cards log */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-0.5">
                        {columnApps.map(app => (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onClick={() => openAppForm(app)}
                            className="bg-white p-4.5 rounded-2xl border border-slate-200 hover:border-slate-350 hover:shadow shadow-sm transition-all cursor-grab active:cursor-grabbing text-left space-y-3 block relative overflow-hidden group"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-teal-500 transition-colors"></div>
                            
                            <div>
                              <strong className="text-xs font-black text-slate-800 block leading-tight group-hover:text-indigo-650">{app.companyName}</strong>
                              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{app.role} &bull; {app.location}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-450">
                              <span>CTC: {app.package}</span>
                              <span className="font-mono">{app.applicationDate}</span>
                            </div>

                            {/* Details tags */}
                            <div className="flex flex-wrap gap-1">
                              {app.oas && app.oas.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-yellow-50 border border-yellow-150 text-yellow-600 text-[8px] font-black uppercase rounded">
                                  OA ({app.oas.length})
                                </span>
                              )}
                              {app.interviews && app.interviews.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-600 text-[8px] font-black uppercase rounded">
                                  Rounds ({app.interviews.length})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                        {columnApps.length === 0 && (
                          <div className="py-12 text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/20 select-none">
                            No items tracked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 3. APPLICATION CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              {/* Calendar Controller */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-display">Recruitment Calendar</h3>
                  <p className="text-slate-500 font-semibold text-xs">Track OA dates, schedules, and follow-ups in a monthly view.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <strong className="text-xs font-black uppercase tracking-widest text-slate-800 w-36 text-center select-none">
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </strong>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day column headers */}
              <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 select-none">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}
              </div>

              {/* Monthly days grid */}
              <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((cell, idx) => {
                  const dateString = cell.date.toISOString().split("T")[0];
                  const dayEvents = calendarEvents[dateString] || [];
                  const isToday = new Date().toDateString() === cell.date.toDateString();

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[100px] border rounded-2xl p-2.5 flex flex-col justify-between transition-all hover:bg-slate-50/50",
                        cell.isCurrentMonth ? "bg-white border-slate-200" : "bg-slate-50/20 border-slate-100 text-slate-300",
                        isToday && "border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/5"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-xs font-black select-none",
                          isToday ? "text-indigo-650" : (cell.isCurrentMonth ? "text-slate-800" : "text-slate-300")
                        )}>
                          {cell.date.getDate()}
                        </span>
                        {isToday && <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping" />}
                      </div>

                      {/* Day Cell scheduled Events list */}
                      <div className="space-y-1 mt-2 flex-grow">
                        {dayEvents.map(evt => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              const selected = apps.find(a => a.id === evt.appId);
                              if (selected) openAppForm(selected);
                            }}
                            className={cn(
                              "p-1.5 rounded border font-bold text-[8px] uppercase tracking-wider cursor-pointer truncate hover:brightness-95 transition-all block text-left",
                              evt.color
                            )}
                          >
                            {evt.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. OA TRACKER */}
        {activeTab === "oas" && (
          <motion.div
            key="oas-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900 font-display">Online Assessments (OA) Logs</h3>
              
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none">
                    <tr>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Result</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {apps.flatMap(app => (app.oas || []).map(oa => {
                      const getUrgencyBadge = () => {
                        if (oa.result === "Cleared" || oa.result === "Failed" || oa.result === "Expired") {
                          return (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded border bg-slate-50 border-slate-200 text-slate-400">
                              Inactive
                            </span>
                          );
                        }
                        const targetDate = oa.deadline || oa.oaDate;
                        if (!targetDate) return <span className="text-slate-400">-</span>;

                        const deadlineDate = new Date(targetDate);
                        if (isNaN(deadlineDate.getTime())) {
                          return <span className="text-slate-400">-</span>;
                        }
                        
                        // Treat deadline date as end-of-day if no time specified
                        const deadlineTime = targetDate.includes("T") ? deadlineDate.getTime() : new Date(targetDate + "T23:59:59").getTime();
                        const diffMs = deadlineTime - Date.now();
                        const diffHours = diffMs / (1000 * 60 * 60);

                        if (diffHours < 0) {
                          return (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded border bg-slate-100 border-slate-200 text-slate-400">
                              Expired
                            </span>
                          );
                        } else if (diffHours < 24) {
                          return (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded border bg-rose-50 border-rose-100 text-rose-600 animate-pulse">
                              Red (&lt;24h)
                            </span>
                          );
                        } else if (diffHours < 72) {
                          return (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded border bg-amber-50 border-amber-100 text-amber-600">
                              Orange (&lt;72h)
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded border bg-emerald-50 border-emerald-100 text-emerald-600">
                              Green (&gt;72h)
                            </span>
                          );
                        }
                      };

                      return (
                        <tr key={oa.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <strong className="text-slate-800 block text-xs">{app.companyName}</strong>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{app.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {oa.platform || "HackerRank"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-650">{oa.deadline || oa.oaDate}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{oa.duration || 90} mins</td>
                          <td className="px-6 py-4">{getUrgencyBadge()}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-black uppercase rounded border",
                              oa.result === "Cleared"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : oa.result === "Failed" || oa.result === "Expired"
                                ? "bg-rose-50 border-rose-100 text-rose-600"
                                : "bg-yellow-50 border-yellow-100 text-yellow-600"
                            )}>
                              {oa.result}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => openAppForm(app)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-[9px] uppercase tracking-wider"
                            >
                              Edit App
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                    {totalOAsCount === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                          No assessment logs found. Edit an application to log OA parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. INTERVIEW TRACKER */}
        {activeTab === "interviews" && (
          <motion.div
            key="interviews-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 text-left"
          >
            {/* Section A: Upcoming Scheduled Interviews (Tracker) */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Event Tracker</span>
                <h3 className="text-xl font-black text-slate-900 font-display">Upcoming Scheduled Interviews</h3>
                <p className="text-slate-500 text-xs font-medium">Real-time scheduling synced from Gmail, Google Calendar, and manual logs.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {allSchedules.map(({ app, schedule }) => {
                  const standardTasks = schedule.checklist || [];
                  const companyTasksList = schedule.companyTasks || [];
                  const roleTasksList = schedule.roleTasks || [];
                  const totalTasks = standardTasks.length + companyTasksList.length + roleTasksList.length;
                  const completedTasks = [...standardTasks, ...companyTasksList, ...roleTasksList].filter(t => t.startsWith("[x] ")).length;
                  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  const isExpanded = expandedChecklistSchId === schedule.id;

                  return (
                    <div key={schedule.id} className="p-6 border border-slate-200 rounded-[2rem] bg-slate-50/20 hover:border-indigo-250 transition-colors space-y-5">
                      {/* Top Info Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1.5 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-black text-slate-800 leading-tight">{app.companyName} &bull; {schedule.type}</h4>
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-600 text-[9px] font-black uppercase rounded">
                              {schedule.mode}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-black uppercase rounded">
                              {schedule.platform}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-bold block">Target Role: {app.role} &bull; {app.location}</span>
                        </div>

                        {/* Date Time Badge */}
                        <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[140px]">
                          <span className="text-[9px] font-black uppercase tracking-widest text-teal-300 block mb-0.5">Date & Time</span>
                          <strong className="text-xs font-black tracking-tight block">{schedule.date}</strong>
                          <span className="text-[10px] font-bold text-slate-350 block mt-0.5">{schedule.time}</span>
                        </div>
                      </div>

                      {/* Middle Platform/Venue & Recruiter details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-650">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Venue / Meeting URL</span>
                          {schedule.meetingLink ? (
                            <a
                              href={schedule.meetingLink}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-150 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meeting</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-500 inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {schedule.platform || "N/A"}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Contact</span>
                          {schedule.recruiterName || schedule.recruiterEmail ? (
                            <div className="space-y-1">
                              {schedule.recruiterName && <span className="text-slate-800 block">👤 {schedule.recruiterName}</span>}
                              {schedule.recruiterEmail && (
                                <a href={`mailto:${schedule.recruiterEmail}`} className="text-indigo-650 hover:underline block font-mono text-[10px]">
                                  ✉️ {schedule.recruiterEmail}
                                </a>
                              )}
                              {schedule.recruiterPhone && <span className="text-slate-500 block font-mono text-[10px]">📞 {schedule.recruiterPhone}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400">No recruiter details logged</span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Schedules Notes</span>
                          <p className="text-[11px] font-medium text-slate-550 leading-relaxed">
                            {schedule.notes || "No special instructions or prep syllabus guidelines logged."}
                          </p>
                        </div>
                      </div>

                      {/* Prep Readiness Progress & Checklist drawer toggler */}
                      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-grow w-full sm:max-w-md space-y-1.5">
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Preparation Readiness checklist</span>
                            <span className="text-indigo-650">{percent}% Complete ({completedTasks}/{totalTasks} tasks)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            onClick={() => openAppForm(app)}
                            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Reschedule / Edit
                          </button>
                          <button
                            onClick={() => setExpandedChecklistSchId(isExpanded ? null : schedule.id)}
                            className="px-4 py-2 bg-slate-900 hover:bg-indigo-650 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                            <span>{isExpanded ? "Hide Prep Plan" : "Prepare Plan Checklist"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded preparation checklist workspace drawer */}
                      {isExpanded && (
                        <div className="mt-4 p-5 bg-slate-50 border border-slate-205 rounded-2xl space-y-5 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Column 1: Standard Checklist */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block border-b border-slate-200 pb-1">1. Standard Checks</span>
                              <div className="space-y-2">
                                {standardTasks.map((task, tIdx) => {
                                  const isDone = task.startsWith("[x] ");
                                  const text = isDone ? task.substring(4) : task;
                                  return (
                                    <label key={tIdx} className="flex items-start gap-2.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => handleToggleChecklistTask(app.id, schedule.id, "checklist", tIdx)}
                                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                                      />
                                      <span className={cn("text-xs font-semibold leading-tight", isDone ? "text-slate-400 line-through" : "text-slate-700")}>
                                        {text}
                                      </span>
                                    </label>
                                  );
                                })}
                                {standardTasks.length === 0 && <p className="text-[10px] text-slate-400 italic font-bold">No checklist tasks</p>}
                              </div>
                            </div>

                            {/* Column 2: Company Specific */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block border-b border-slate-200 pb-1">2. Company Specific Rubrics</span>
                              <div className="space-y-2">
                                {companyTasksList.map((task, tIdx) => {
                                  const isDone = task.startsWith("[x] ");
                                  const text = isDone ? task.substring(4) : task;
                                  return (
                                    <label key={tIdx} className="flex items-start gap-2.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => handleToggleChecklistTask(app.id, schedule.id, "companyTasks", tIdx)}
                                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                                      />
                                      <span className={cn("text-xs font-semibold leading-tight", isDone ? "text-slate-400 line-through" : "text-slate-700")}>
                                        {text}
                                      </span>
                                    </label>
                                  );
                                })}
                                {companyTasksList.length === 0 && <p className="text-[10px] text-slate-400 italic font-bold">No company specific tasks</p>}
                              </div>
                            </div>

                            {/* Column 3: Role Specific */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-teal-650 uppercase tracking-widest block border-b border-slate-200 pb-1">3. Technical Revise</span>
                              <div className="space-y-2">
                                {roleTasksList.map((task, tIdx) => {
                                  const isDone = task.startsWith("[x] ");
                                  const text = isDone ? task.substring(4) : task;
                                  return (
                                    <label key={tIdx} className="flex items-start gap-2.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => handleToggleChecklistTask(app.id, schedule.id, "roleTasks", tIdx)}
                                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer"
                                      />
                                      <span className={cn("text-xs font-semibold leading-tight", isDone ? "text-slate-400 line-through" : "text-slate-700")}>
                                        {text}
                                      </span>
                                    </label>
                                  );
                                })}
                                {roleTasksList.length === 0 && <p className="text-[10px] text-slate-400 italic font-bold">No role specific tasks</p>}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {allSchedules.length === 0 && (
                  <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/10">
                    🎉 No scheduled interviews pending! Sync Gmail or add schedules in application modals.
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Completed Interviews (Performance Log) */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 font-display">Interviews Performance Log</h3>

              <div className="space-y-6">
                {apps.flatMap(app => (app.interviews || []).map(round => (
                  <div key={round.id} className="p-6 border border-slate-200 rounded-[2rem] bg-slate-50/30 hover:border-indigo-250 transition-colors flex flex-col md:flex-row justify-between gap-6">
                    
                    {/* Left: General */}
                    <div className="space-y-4 flex-grow max-w-2xl">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <strong className="text-base font-black text-slate-800 block">{app.companyName} &bull; {round.roundName}</strong>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Role: {app.role}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider",
                            round.outcome === "Cleared"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : round.outcome === "Rejected"
                              ? "bg-rose-50 border-rose-100 text-rose-600"
                              : "bg-yellow-50 border-yellow-100 text-yellow-600"
                          )}>
                            Outcome: {round.outcome}
                          </span>
                          
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-3.5 h-3.5 shrink-0",
                                  star <= round.performanceRating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      {round.questionsAsked.length > 0 && (
                        <div className="space-y-1">
                          <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Questions Asked:</strong>
                          <ul className="space-y-1 text-xs font-semibold text-slate-650 pl-4 list-disc leading-relaxed">
                            {round.questionsAsked.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Feedback */}
                      {round.feedback && (
                        <div className="p-3 bg-white border border-slate-150 rounded-xl text-xs font-medium text-slate-650 leading-relaxed">
                          <strong className="text-slate-800">Recruiter Feedback:</strong> {round.feedback}
                        </div>
                      )}
                    </div>

                    {/* Right: Weak / Improvement Areas */}
                    <div className="w-full md:w-64 space-y-3 md:border-l border-slate-250/60 md:pl-6 shrink-0 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Weak Areas</span>
                        <div className="flex flex-wrap gap-1">
                          {round.weakAreas.length > 0 ? (
                            round.weakAreas.map((w, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px]">
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">None logged</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-black text-teal-650 uppercase tracking-widest block">Improvement Areas</span>
                        <div className="flex flex-wrap gap-1">
                          {round.improvementAreas.length > 0 ? (
                            round.improvementAreas.map((imp, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-[9px]">
                                {imp}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">None logged</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => openAppForm(app)}
                        className="w-full mt-3 py-2 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-colors text-center"
                      >
                        Edit Details
                      </button>
                    </div>

                  </div>
                )))}

                {totalInterviewsCount === 0 && (
                  <div className="p-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2rem]">
                    No interview rounds logged yet. Add interviews in application edit form modal.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. OFFER COMPARISON */}
        {activeTab === "offers" && (
          <motion.div
            key="offers-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-8">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-display">Job Offers Tracker & Comparison</h3>
                  <p className="text-slate-500 font-semibold text-xs">Analyze CTC breakdown configurations across offers.</p>
                </div>

                <button
                  onClick={handleTriggerOfferComparison}
                  disabled={comparingOffers || apps.filter(a => a.status === "Offer Received" || a.status === "Joined").length === 0}
                  className="px-4 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {comparingOffers ? "Triggering AI Analysis..." : "Run AI Offer Comparison"}
                </button>
              </div>

              {/* Offer recommendation box */}
              {offerRecommendation && (
                <div className="p-6 bg-indigo-50/50 border border-indigo-100 text-slate-800 rounded-[2rem] space-y-4 shadow-sm select-none whitespace-pre-wrap leading-relaxed text-xs">
                  {offerRecommendation.split("\n").map((line, idx) => {
                    if (line.startsWith("### ")) {
                      return <h4 key={idx} className="font-black text-indigo-400 text-sm mt-3 mb-1 font-display first:mt-0">{line.replace("### ", "")}</h4>;
                    }
                    if (line.startsWith("#### ")) {
                      return <strong key={idx} className="text-slate-200 text-xs block mt-2.5">{line.replace("#### ", "")}</strong>;
                    }
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return <li key={idx} className="ml-4 list-disc text-slate-300 font-medium my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                    }
                    return <p key={idx} className="my-1.5">{line}</p>;
                  })}
                </div>
              )}

              {/* Offer detail cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apps.filter(a => a.status === "Offer Received" || a.status === "Joined").map(app => (
                  <div key={app.id} className="p-6 border border-slate-200 rounded-[2.5rem] bg-slate-50/20 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-base font-black text-slate-800 block leading-tight">{app.companyName}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{app.role} &bull; {app.location}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded">
                        Offer
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CTC (LPA)</span>
                        <strong className="text-base font-black text-slate-800 block mt-0.5">{app.offer?.ctc || app.package}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Base Salary</span>
                        <strong className="text-base font-black text-slate-800 block mt-0.5">{app.offer?.baseSalary || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Joining Bonus</span>
                        <strong className="text-base font-black text-slate-800 block mt-0.5">{app.offer?.joiningBonus || "N/A"}</strong>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] font-bold text-slate-500">
                      <div className="flex justify-between">
                        <span>Offer Date:</span>
                        <span className="text-slate-800">{app.applicationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Joining Date:</span>
                        <span className="text-slate-800">{app.offer?.joiningDate || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {apps.filter(a => a.status === "Offer Received" || a.status === "Joined").length === 0 && (
                  <div className="col-span-2 py-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2.5rem]">
                    No job offers tracked yet. Drag/drop a candidate card into the 'Offer Received' stage to track detailed salary packages.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 6. AI INTELLIGENCE COGNITIVE OS */}
        {activeTab === "copilot" && (
          <motion.div
            key="copilot-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
          >
            {/* Left AI insights report generator card */}
            <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block font-mono">🤖 Application Intelligence Report</span>
                <h3 className="text-xl font-display font-black text-slate-800">Gemini Analytics Diagnostician</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Submit your complete pipeline metadata, ATS metrics, and Mock Interview rates to generate tailored diagnostic advice.</p>
              </div>

              <button
                onClick={generateAiInsights}
                disabled={insightsLoading || apps.length === 0}
                className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-650 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
              >
                {insightsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                    <span>Crunching Pipeline Metadatas...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-teal-300 animate-pulse" />
                    <span>Generate AI Insights report</span>
                  </>
                )}
              </button>

              {/* Generated AI report Display */}
              {aiReport && (
                <div className="space-y-6 border-t border-slate-100 pt-6 animate-fade-in">
                  
                  {/* Strengths */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">💪 Highlighted Strengths</span>
                    <ul className="space-y-2">
                      {aiReport.strengths.map((str, idx) => (
                        <li key={idx} className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl text-xs text-slate-650 font-semibold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">⚠️ Areas of Improvement</span>
                    <ul className="space-y-2">
                      {aiReport.weaknesses.map((weak, idx) => (
                        <li key={idx} className="p-3 bg-rose-50/20 border border-rose-100 rounded-xl text-xs text-slate-650 font-semibold flex items-center gap-2">
                          <X className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable recommendations */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">🚀 Actionable playbooks advice</span>
                    <ul className="space-y-2">
                      {aiReport.recommendations.map((rec, idx) => (
                        <li key={idx} className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl text-xs text-slate-700 font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 fill-indigo-100" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>

            {/* Strategic Chat screen (Right column) */}
            <div className="lg:col-span-6 flex flex-col bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden h-[550px]">
              
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 relative">
                  <Bot className="w-4.5 h-4.5 animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <strong className="text-xs font-black text-slate-800 block">Placement Strategy Copilot</strong>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Interactive Mentorship Advisor</span>
                </div>
              </div>

              {/* Chat thread */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
                {copilotMessages.map(msg => {
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
                        isCopilot ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-900 border-slate-900 text-white"
                      )}>
                        {isCopilot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      
                      <div className={cn(
                        "p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                        isCopilot ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                      )}>
                        {msg.content.split("\n").map((line, idx) => {
                          if (line.startsWith("### ")) {
                            return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2.5 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return <li key={idx} className="ml-3 list-disc text-slate-650 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                          }
                          return <p key={idx} className="my-1">{line}</p>;
                        })}
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex gap-3 max-w-[80%] self-start animate-pulse text-xs">
                    <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                    <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                      <span>Analyzing funnel drop-offs...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input */}
              <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask copilot about rejections, strategy, or readiness indices..."
                  value={chatInput}
                  disabled={chatLoading}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !chatLoading) handleSendCopilotQuery();
                  }}
                  className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  onClick={() => handleSendCopilotQuery()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-650 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
        {/* 7. SYNC & INTEGRATIONS SERVICE PANEL */}
        {activeTab === "gmail" && (
          <motion.div
            key="gmail-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-left"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Google Workspace Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-black text-slate-800 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-teal-600 animate-pulse" />
                      Google Workspace
                    </h3>
                    {gmailConnected ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-slate-550 text-xs font-semibold leading-relaxed">
                    Ingest assessments, interview schedules, and job status notifications directly from your Gmail inbox, and sync them to your Google Calendar.
                  </p>
                  
                  {gmailConnected && (
                    <div className="space-y-3 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-500 uppercase tracking-wider">Google Account</span>
                        <span className="font-bold text-slate-800">{gmailEmail}</span>
                      </div>
                      {gmailLastSync && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-500 uppercase tracking-wider">Last Sync Checked</span>
                          <span className="font-medium text-slate-650">{new Date(gmailLastSync).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Google Calendar Sync */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Google Calendar Sync</span>
                      <span className="text-[10px] text-slate-450 font-bold leading-normal block">
                        Automatically push OAs, interviews, and deadlines to your Google Calendar.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        disabled={!gmailConnected}
                        checked={googleCalendarSyncEnabled}
                        onChange={(e) => handleToggleGoogleCalendar(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-650"></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-4">
                  {gmailConnected ? (
                    <>
                      <button
                        onClick={handleTriggerSync}
                        disabled={gmailSyncLoading || gmailActionLoading}
                        className="flex-grow px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {gmailSyncLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                            <span>Syncing Gmail...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-teal-300" />
                            <span>Scan Inbox Now</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDisconnectGmail}
                        disabled={gmailSyncLoading || gmailActionLoading}
                        className="px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 transition-all cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnectGmail}
                      disabled={gmailActionLoading}
                      className="w-full px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-teal-650 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-teal-100/10"
                    >
                      <Mail className="w-4.5 h-4.5 text-teal-300" />
                      <span>Connect Google Account</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Microsoft Outlook Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-black text-slate-800 flex items-center gap-2">
                      <CalendarIcon className="w-6 h-6 text-indigo-600 animate-pulse" />
                      Outlook Calendar
                    </h3>
                    {outlookConnected ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-slate-550 text-xs font-semibold leading-relaxed">
                    Synchronize assessment deadlines, interview sessions, and pipeline schedules directly to your Microsoft Outlook Calendar.
                  </p>

                  {outlookConnected && (
                    <div className="space-y-3 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-500 uppercase tracking-wider">Outlook Account</span>
                        <span className="font-bold text-slate-800">{outlookEmail}</span>
                      </div>
                      {outlookLastSync && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-500 uppercase tracking-wider">Last Synced</span>
                          <span className="font-medium text-slate-650">{new Date(outlookLastSync).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Outlook Calendar Sync */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Outlook Calendar Sync</span>
                      <span className="text-[10px] text-slate-450 font-bold leading-normal block">
                        Automatically push OAs, interviews, and deadlines to your Outlook Calendar.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        disabled={!outlookConnected}
                        checked={outlookCalendarSyncEnabled}
                        onChange={(e) => handleToggleOutlookCalendar(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-4">
                  {outlookConnected ? (
                    <>
                      <button
                        disabled={true}
                        className="flex-grow px-5 py-3.5 bg-slate-100 text-slate-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Outlook Sync Active</span>
                      </button>
                      <button
                        onClick={handleDisconnectOutlook}
                        disabled={outlookActionLoading}
                        className="px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-40 transition-all cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnectOutlook}
                      disabled={outlookActionLoading}
                      className="w-full px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-650 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-100/10"
                    >
                      <CalendarIcon className="w-4.5 h-4.5 text-indigo-300" />
                      <span>Connect Outlook Account</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Sync History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-slate-500" />
                  Ingestion Audit logs
                </h4>
                <Link
                  href="/dashboard/admin/trust"
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Admin Trust Panel
                </Link>
              </div>

              {gmailSyncLogs.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/20">
                  No Gmail emails ingested yet. Setup a connection and scan inbox to retrieve updates.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-bold text-slate-650 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest text-left font-display">
                        <th className="pb-3 font-black">Company</th>
                        <th className="pb-3 font-black">Target Role</th>
                        <th className="pb-3 font-black">Detected Stage</th>
                        <th className="pb-3 font-black">Recruitment Trust</th>
                        <th className="pb-3 font-black">Confidence</th>
                        <th className="pb-3 font-black">Ingested Date</th>
                        <th className="pb-3 font-black">Status / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {gmailSyncLogs.map((log) => {
                        const trustDecision = log.extracted_entities?.trustDecision || "Likely Recruitment Email";
                        const trustScore = log.extracted_entities?.trustScore ?? 75;
                        
                        let trustBg = "bg-slate-50 text-slate-700 border-slate-200";
                        let trustDot = "bg-slate-400";
                        let trustLabel = "Unknown";
                        
                        if (trustDecision === "Verified Recruitment Email" || trustDecision === "Verified") {
                          trustBg = "bg-emerald-50 text-emerald-700 border border-emerald-255";
                          trustDot = "bg-emerald-500";
                          trustLabel = "Verified";
                        } else if (trustDecision === "Likely Recruitment Email" || trustDecision === "Likely") {
                          trustBg = "bg-teal-50 text-teal-700 border border-teal-200";
                          trustDot = "bg-teal-500";
                          trustLabel = "Likely";
                        } else if (trustDecision === "Suspicious") {
                          trustBg = "bg-amber-50 text-amber-700 border border-amber-250";
                          trustDot = "bg-amber-500";
                          trustLabel = "Suspicious";
                        } else if (trustDecision === "Potential Scam" || trustDecision === "Scam") {
                          trustBg = "bg-rose-50 text-rose-700 border border-rose-250";
                          trustDot = "bg-rose-500";
                          trustLabel = "Scam";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4.5 font-black text-slate-800">{log.company}</td>
                            <td className="py-4.5 text-slate-600 font-semibold">{log.role}</td>
                            <td className="py-4.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide",
                                log.detected_status === "Offer Received" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                log.detected_status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                log.detected_status.includes("Interview") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                log.detected_status.includes("Assessment") ? "bg-yellow-50 text-yellow-750 border border-yellow-100" :
                                log.detected_status.includes("Scam") ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                "bg-slate-50 text-slate-700 border border-slate-150"
                              )}>
                                {log.detected_status}
                              </span>
                            </td>
                            <td className="py-4.5 font-medium">
                              <span className={cn("px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide inline-flex items-center gap-1.5", trustBg)}>
                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", trustDot)} />
                                <span>{trustLabel} ({trustScore})</span>
                              </span>
                            </td>
                            <td className="py-4.5 font-mono">{log.confidence_score}%</td>
                            <td className="py-4.5 font-medium text-slate-500">
                              {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-4.5">
                              {log.processed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Processed</span>
                                </span>
                              ) : log.detected_status === "Scam Blocked" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-black uppercase">
                                  <X className="w-3.5 h-3.5" />
                                  <span>Scam Blocked</span>
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-black uppercase">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Review Needed</span>
                                  </span>
                                  <button
                                    onClick={() => handleApproveSuspiciousLog(log.id)}
                                    disabled={approvingLogId === log.id}
                                    className="px-2 py-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded disabled:opacity-50 transition-colors"
                                  >
                                    {approvingLogId === log.id ? "Approving..." : "Add to CRM"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 8. BROWSER EXTENSION SYNC INTEGRATION */}
        {activeTab === "extension" && (
          <motion.div
            key="extension-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-left"
          >
            {/* Download & Auth Token Setup Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Credentials & Downloads */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xl font-display font-black text-slate-850 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-indigo-500 animate-pulse" />
                    Chrome Extension Setup
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Auto-capture job listings directly from LinkedIn, Indeed, Naukri, Foundit, and custom career portals. The connector automatically identifies successful submits and logs them into your CRM instantly.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Your Personal Extension Token</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={userId || ""} 
                        className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (userId) {
                            navigator.clipboard.writeText(userId);
                            alert("Copied token to clipboard!");
                          }
                        }}
                        className="px-4 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer shrink-0"
                      >
                        Copy Key
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">This key connects the browser extension to your private account database. Keep it private.</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <a
                    href="/api/placement/extension/download"
                    className="flex-grow py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-indigo-100 text-center flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-white" />
                    Download Extension Package
                  </a>
                </div>
              </div>

              {/* Instructions Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  Installation Instructions
                </h4>

                <ol className="space-y-4 text-xs font-semibold text-slate-650 list-decimal pl-4">
                  <li>
                    Click <strong className="text-slate-800">Download Extension Package</strong> and extract the downloaded <code>.zip</code> file onto your system.
                  </li>
                  <li>
                    Open Google Chrome and navigate to <code className="text-indigo-650 font-mono">chrome://extensions/</code> in the URL bar.
                  </li>
                  <li>
                    Enable <strong className="text-slate-800">Developer mode</strong> using the toggle button in the top-right corner of the Extensions dashboard.
                  </li>
                  <li>
                    Click <strong className="text-slate-800">Load unpacked</strong> in the top-left menu, and select the extracted extension directory.
                  </li>
                  <li>
                    Pin the <strong className="text-indigo-600">Placement Tracker OS Connector</strong> extension to your toolbar, paste your copied token inside the settings box, and save!
                  </li>
                </ol>
              </div>
            </div>

            {/* Supported Platforms Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight">Supported Platforms</h4>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Scraping hooks are customized for the following recruitment pages:</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                {[
                  { name: "LinkedIn", detail: "Easy Apply overlay & description parse", badge: "Live Tracking" },
                  { name: "Indeed", detail: "Job cards & submission dialog checks", badge: "Live Tracking" },
                  { name: "Naukri", detail: "One-click application redirect parse", badge: "Live Tracking" },
                  { name: "Foundit", detail: "Title details & redirect thank-you tracking", badge: "Live Tracking" },
                  { name: "Career Portals", detail: "Lever, Greenhouse, Workday success checks", badge: "ATS Auto Capture" }
                ].map((site, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between min-h-[90px]">
                    <div>
                      <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider block">{site.badge}</span>
                      <strong className="text-xs font-black text-slate-850 block mt-1.5">{site.name}</strong>
                    </div>
                    <p className="text-[10px] text-slate-450 font-bold mt-2 leading-relaxed">{site.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED ADD APPLICATION MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in animate-duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-left"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-900 font-display">
                {editingApp ? `Edit Application: ${editingApp.companyName}` : "Add New Application Record"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Contents */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Mandatory Fields */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Company Name</label>
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  {PREDEFINED_COMPANIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {companyName === "Custom..." && (
                  <input
                    type="text"
                    required
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Enter Custom Company Name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none mt-2"
                  />
                )}
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Target Job Role</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="E.g., Software Developer"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Package / Salary Range (CTC)</label>
                <input
                  type="text"
                  required
                  value={packageCtc}
                  onChange={(e) => setPackageCtc(e.target.value)}
                  placeholder="E.g., 12.5 LPA or $110,000"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Office Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g., Bengaluru, Remote"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Application Date</label>
                <input
                  type="date"
                  required
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Referral Status</label>
                <select
                  value={referralStatus}
                  onChange={(e) => setReferralStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  <option value="None">None</option>
                  <option value="Requested">Requested</option>
                  <option value="Applied">Applied</option>
                  <option value="Referred">Referred</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hiring Stage Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Assessment Scheduled">Assessment Scheduled</option>
                  <option value="Assessment Completed">Assessment Completed</option>
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="HR Interview">HR Interview</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Joined">Joined</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="md:col-span-8 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Job Link URL</label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-id"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Application Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write relevant recruiter notes, eligibility thresholds, or follow-up timelines..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Recruiter Details Section */}
              <div className="md:col-span-12 border-t border-slate-100 pt-5 space-y-4">
                <strong className="text-xs font-black text-slate-800 block">Recruiter Contact Details</strong>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Name</label>
                    <input type="text" value={recName} onChange={e => setRecName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="E.g., Arnav Gupta" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                    <input type="email" value={recEmail} onChange={e => setRecEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="arnav@company.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Phone</label>
                    <input type="tel" value={recPhone} onChange={e => setRecPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">LinkedIn Profile</label>
                    <input type="url" value={recLinkedIn} onChange={e => setRecLinkedIn(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="https://linkedin.com/in/username" />
                  </div>
                </div>
              </div>

              {/* Offer Details Conditional Box */}
              {(status === "Offer Received" || status === "Joined") && (
                <div className="md:col-span-12 p-5 bg-emerald-50/30 border border-emerald-150 rounded-2xl space-y-4 animate-fade-in">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">💼 Offer CTC configuration Breakdown</span>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Gross CTC</label>
                      <input type="text" value={offerCtc} onChange={e => setOfferCtc(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="12 LPA" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Base Salary</label>
                      <input type="text" value={offerBase} onChange={e => setOfferBase(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="10 LPA" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Signing Bonus</label>
                      <input type="text" value={offerBonus} onChange={e => setOfferBonus(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="1.5 Lakhs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Office Loc</label>
                      <input type="text" value={offerLoc} onChange={e => setOfferLoc(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" placeholder="Bengaluru" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Joining Date</label>
                      <input type="date" value={offerJoinDate} onChange={e => setOfferJoinDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Records logging sections: OAs & Interviews */}
              <div className="md:col-span-12 border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Online Assessments Section inside form */}
                <div className="space-y-4">
                  <strong className="text-xs font-black text-slate-800 block">Assessment Records ({subOas.length})</strong>
                  
                  {/* OA Form */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Date</label>
                        <input type="date" value={newOaDate} onChange={e => setNewOaDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Difficulty</label>
                        <select value={newOaDiff} onChange={e => setNewOaDiff(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none">
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Result</label>
                        <select value={newOaResult} onChange={e => setNewOaResult(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none">
                          <option value="Pending">Pending</option>
                          <option value="Cleared">Cleared</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Platform</label>
                        <select value={newOaPlatform} onChange={e => setNewOaPlatform(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none">
                          <option value="HackerRank">HackerRank</option>
                          <option value="CodeSignal">CodeSignal</option>
                          <option value="Codility">Codility</option>
                          <option value="SHL">SHL</option>
                          <option value="Mercer Mettl">Mercer Mettl</option>
                          <option value="AMCAT">AMCAT</option>
                          <option value="eLitmus">eLitmus</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Duration (mins)</label>
                        <input type="number" value={newOaDuration} onChange={e => setNewOaDuration(Number(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Topics (comma-sep)</label>
                        <input type="text" value={newOaTopics} onChange={e => setNewOaTopics(e.target.value)} placeholder="DP, SQL" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Score (%)</label>
                        <input type="number" value={newOaScore} onChange={e => setNewOaScore(Number(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase">OA Notes</label>
                      <input type="text" value={newOaNotes} onChange={e => setNewOaNotes(e.target.value)} placeholder="Puzzle questions were tough." className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddOaToForm}
                      className="w-full py-2 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-teal-650 transition-colors"
                    >
                      Log Assessment Round
                    </button>
                  </div>

                  {/* Logged subOas list */}
                  <div className="space-y-2">
                    {subOas.map(oa => (
                      <div key={oa.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong>{oa.oaDate}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{oa.platform || "HackerRank"} &bull; {oa.difficulty} &bull; {oa.duration || 90}m &bull; Score: {oa.score}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] rounded font-bold">{oa.result}</span>
                          <button type="button" onClick={() => setSubOas(subOas.filter(o => o.id !== oa.id))} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"><Trash2 className="w-4.5 h-4.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Interview Rounds Section inside form */}
                <div className="space-y-4">
                  <strong className="text-xs font-black text-slate-800 block">Interview Round Records ({subInterviews.length})</strong>

                  {/* Interview Form */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Round Name</label>
                        <input type="text" value={newIntName} onChange={e => setNewIntName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Outcome</label>
                        <select value={newIntOutcome} onChange={e => setNewIntOutcome(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none">
                          <option value="Pending">Pending</option>
                          <option value="Cleared">Cleared</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Performance Rating (1-5)</label>
                        <input type="number" min={1} max={5} value={newIntRating} onChange={e => setNewIntRating(Number(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-450 uppercase">Weak areas (comma-sep)</label>
                        <input type="text" value={newIntWeak} onChange={e => setNewIntWeak(e.target.value)} placeholder="System Design limits" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase">Improvement Areas</label>
                      <input type="text" value={newIntImprove} onChange={e => setNewIntImprove(e.target.value)} placeholder="Review Redis caching" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase">Questions Asked (one per line)</label>
                      <textarea rows={2} value={newIntQuestions} onChange={e => setNewIntQuestions(e.target.value)} placeholder="Write quicksort logic..." className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase">Feedback Notes</label>
                      <input type="text" value={newIntFeedback} onChange={e => setNewIntFeedback(e.target.value)} placeholder="Very good code structure." className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddIntToForm}
                      className="w-full py-2 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-teal-650 transition-colors"
                    >
                      Log Interview Round
                    </button>
                  </div>

                  {/* Logged subInterviews list */}
                  <div className="space-y-2">
                    {subInterviews.map(round => (
                      <div key={round.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong>{round.roundName}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Rating: {round.performanceRating}/5 &bull; Outcome: {round.outcome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setSubInterviews(subInterviews.filter(i => i.id !== round.id))} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. Scheduled Upcoming Interviews inside form */}
              <div className="md:col-span-12 border-t border-slate-100 pt-5 space-y-4">
                <strong className="text-xs font-black text-slate-800 block">Scheduled Upcoming Interviews ({subSchedules.length})</strong>
                
                {/* Schedule Form */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Round Type</label>
                      <select value={newSchType} onChange={e => setNewSchType(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold">
                        <option value="Online Assessment">Online Assessment</option>
                        <option value="Technical Interview">Technical Interview</option>
                        <option value="Managerial Round">Managerial Round</option>
                        <option value="HR Round">HR Round</option>
                        <option value="Final Round">Final Round</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Date</label>
                      <input type="date" value={newSchDate} onChange={e => setNewSchDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Time</label>
                      <input type="text" value={newSchTime} onChange={e => setNewSchTime(e.target.value)} placeholder="e.g. 10:00 AM" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Mode</label>
                      <select value={newSchMode} onChange={e => setNewSchMode(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold">
                        <option value="Online">Online</option>
                        <option value="In-Person">In-Person</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Platform / Location / Venue</label>
                      <input type="text" value={newSchPlatform} onChange={e => setNewSchPlatform(e.target.value)} placeholder="Google Meet, Zoom, Office Address..." className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Meeting Link (Zoom, Meet, Teams)</label>
                      <input type="url" value={newSchMeetingLink} onChange={e => setNewSchMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Recruiter Name</label>
                      <input type="text" value={newSchRecName} onChange={e => setNewSchRecName(e.target.value)} placeholder="E.g., Sarah Jenkins" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Recruiter Email</label>
                      <input type="email" value={newSchRecEmail} onChange={e => setNewSchRecEmail(e.target.value)} placeholder="sarah@recruitment.com" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-black">Recruiter Phone</label>
                      <input type="tel" value={newSchRecPhone} onChange={e => setNewSchRecPhone(e.target.value)} placeholder="E.g. +1 555-0199" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 uppercase font-black">Notes / Syllabus / Details</label>
                    <input type="text" value={newSchNotes} onChange={e => setNewSchNotes(e.target.value)} placeholder="e.g. Focus on system design, revise oops" className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold" />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddScheduleToForm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-teal-650 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                  >
                    Log Upcoming Interview Schedule
                  </button>
                </div>

                {/* Logged subSchedules list */}
                <div className="space-y-2">
                  {subSchedules.map(sch => (
                    <div key={sch.id} className="p-4.5 bg-white border border-slate-200 rounded-xl flex justify-between items-start text-xs hover:border-indigo-150 transition-colors">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-800 text-xs">{sch.type}</strong>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-[8px] text-indigo-650 border border-indigo-100 rounded font-black uppercase">{sch.mode}</span>
                          <span className="px-1.5 py-0.5 bg-slate-50 text-[8px] text-slate-550 border border-slate-200 rounded font-bold">{sch.platform}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          📅 {sch.date} at {sch.time}
                        </p>
                        {sch.meetingLink && (
                          <p className="text-[10px] text-blue-500 font-bold truncate max-w-md mt-0.5">
                            🔗 <a href={sch.meetingLink} target="_blank" className="hover:underline">{sch.meetingLink}</a>
                          </p>
                        )}
                        {(sch.recruiterName || sch.recruiterEmail) && (
                          <p className="text-[9px] text-slate-450 font-semibold mt-0.5">
                            👤 Recruiter: {sch.recruiterName || "N/A"} {sch.recruiterEmail ? `(${sch.recruiterEmail})` : ""}
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => setSubSchedules(subSchedules.filter(s => s.id !== sch.id))} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"><Trash2 className="w-4.5 h-4.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {editingApp ? (
                <button
                  type="button"
                  onClick={() => handleDeleteApp(editingApp.id)}
                  className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Application</span>
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApplication}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-teal-650 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Save Record
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}

// Simple loader helper icon
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
