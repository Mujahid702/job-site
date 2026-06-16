"use client";

import React, { useState } from "react";
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
  TrendingUp,
  ChevronLeft,
  X,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacementApplication, InterviewSchedule, OfferDetails, CrmDocument } from "@/types/crm";

// Constants
const KANBAN_STAGES: { id: PlacementApplication["status"]; label: string; color: string; border: string; bg: string; dot: string }[] = [
  { id: "Saved", label: "Saved", color: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50/50", dot: "bg-slate-400" },
  { id: "Applied", label: "Applied", color: "text-blue-500", border: "border-blue-200", bg: "bg-blue-50/10", dot: "bg-blue-500" },
  { id: "Assessment Scheduled", label: "OA Scheduled", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50/10", dot: "bg-amber-500" },
  { id: "Assessment Completed", label: "OA Completed", color: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50/10", dot: "bg-emerald-500" },
  { id: "Technical Interview", label: "Technical Interview", color: "text-indigo-600", border: "border-indigo-200", bg: "bg-indigo-50/10", dot: "bg-indigo-500" },
  { id: "HR Interview", label: "HR Interview", color: "text-pink-600", border: "border-pink-200", bg: "bg-pink-50/10", dot: "bg-pink-500" },
  { id: "Offer Received", label: "Offer Received", color: "text-teal-600", border: "border-teal-200", bg: "bg-teal-50/10", dot: "bg-teal-500" },
  { id: "Rejected", label: "Rejected", color: "text-rose-600", border: "border-rose-200", bg: "bg-rose-50/10", dot: "bg-rose-500" },
  { id: "Joined", label: "Joined", color: "text-cyan-700", border: "border-cyan-200", bg: "bg-cyan-50/10", dot: "bg-cyan-500" },
  { id: "Withdrawn", label: "Withdrawn", color: "text-slate-400", border: "border-slate-200", bg: "bg-slate-50/10", dot: "bg-slate-300" }
];

const PREDEFINED_COMPANIES = ["IBM", "TCS", "Infosys", "Wipro", "Capgemini", "Cognizant", "Accenture", "Deloitte", "HCLTech"];

const INITIAL_MOCK_APPLICATIONS: PlacementApplication[] = [
  {
    id: "app-1",
    companyName: "IBM",
    role: "Software Engineer",
    location: "Hyderabad",
    package: "9.5 LPA",
    applicationDate: "2026-05-10",
    jobUrl: "https://ibm.com/careers",
    referralStatus: "None",
    status: "Technical Interview",
    notes: "Completed online assessment on May 20. Code review feedback was positive. Technical interview round focuses on distributed systems and concurrency controls.",
    recruiter: {
      name: "Satya K.",
      email: "satya.k@ibm.com",
      phone: "+91 98765 43210",
      linkedIn: "https://linkedin.com/in/satya-k-ibm"
    },
    schedules: [
      { id: "sch-1", type: "Online Assessment", date: "2026-05-20", time: "10:00 AM", platform: "HackerRank", notes: "Scored 100% on programming challenges." },
      { id: "sch-2", type: "Technical Interview", date: "2026-06-06", time: "11:30 AM", platform: "WebEx", notes: "Reviewing graph algorithms and caching patterns." }
    ],
    matchScore: {
      resumeMatch: 86,
      interviewReadiness: 72,
      overallProbability: 79
    }
  },
  {
    id: "app-2",
    companyName: "Deloitte",
    role: "Full Stack Developer",
    location: "Bengaluru",
    package: "12.5 LPA",
    applicationDate: "2026-05-01",
    jobUrl: "https://deloitte.com/careers",
    referralStatus: "Referred",
    status: "Offer Received",
    notes: "Excellent conversation with the director during the final partner round. Received official offer letter. Decision pending review against location index costs.",
    recruiter: {
      name: "Anjali Gupta",
      email: "anjali.g@deloitte.com",
      linkedIn: "https://linkedin.com/in/anjaligupta-deloitte"
    },
    schedules: [
      { id: "sch-3", type: "Online Assessment", date: "2026-05-08", time: "02:00 PM", platform: "Mettl" },
      { id: "sch-4", type: "Technical Interview", date: "2026-05-15", time: "03:00 PM", platform: "Teams" },
      { id: "sch-5", type: "Final Round", date: "2026-05-24", time: "04:00 PM", platform: "Teams" }
    ],
    offer: {
      ctc: "12.5 LPA",
      location: "Bengaluru",
      joiningDate: "2026-07-15",
      growthRating: 4,
      exposureRating: 4,
      brandValueRating: 5,
      potentialRating: 4
    },
    matchScore: {
      resumeMatch: 92,
      interviewReadiness: 85,
      overallProbability: 88
    }
  },
  {
    id: "app-3",
    companyName: "TCS",
    role: "System Engineer",
    location: "Chennai",
    package: "4.2 LPA",
    applicationDate: "2026-04-15",
    jobUrl: "https://tcs.com/careers",
    referralStatus: "None",
    status: "Rejected",
    notes: "Rejected after technical interview. Questions mainly related to DBMS query normalization and Java concepts. Candidate struggled to articulate microservice communications.",
    recruiter: {
      name: "Ramesh Sharma",
      email: "ramesh.s@tcs.com"
    },
    schedules: [
      { id: "sch-6", type: "Online Assessment", date: "2026-04-28", time: "09:00 AM", platform: "TCS iON", notes: "NQT Aptitude cleared with 82 percentile." },
      { id: "sch-7", type: "Technical Interview", date: "2026-05-05", time: "02:30 PM", platform: "TCS Platform", notes: "Stumbled on SQL indexing queries." }
    ],
    matchScore: {
      resumeMatch: 64,
      interviewReadiness: 50,
      overallProbability: 57
    }
  }
];

const INITIAL_MOCK_DOCUMENTS: CrmDocument[] = [
  { id: "doc-1", title: "Deloitte Offer Letter", type: "Offer Letter", fileName: "Deloitte_Offer_Letter_Signed.pdf", uploadDate: "2026-05-25", notes: "Official offer received via portal." },
  { id: "doc-2", title: "ATS Gold Standard Resume", type: "Resume", fileName: "Mujahid_Resume_Software_Eng_v4.pdf", uploadDate: "2026-05-18", notes: "Customized for Full Stack & Cloud Developer tracks." },
  { id: "doc-3", title: "TCS NQT Scorecard", type: "Assessment Result", fileName: "TCS_NQT_Report_2026.pdf", uploadDate: "2026-04-30" }
];

export default function PlacementCRM() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "comparison" | "documents" | "badges">("dashboard");
  
  // Applications and Doc state
  const [apps, setApps] = useState<PlacementApplication[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_crm_applications");
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return INITIAL_MOCK_APPLICATIONS;
  });

  const [documents, setDocuments] = useState<CrmDocument[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_crm_documents");
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return INITIAL_MOCK_DOCUMENTS;
  });

  // Save changes
  const saveApps = (updated: PlacementApplication[]) => {
    setApps(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("placement_crm_applications", JSON.stringify(updated));
    }
  };

  const saveDocs = (updated: CrmDocument[]) => {
    setDocuments(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("placement_crm_documents", JSON.stringify(updated));
    }
  };

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<PlacementApplication | null>(null);

  // Form fields state
  const [companyName, setCompanyName] = useState("");
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [packageCtc, setPackageCtc] = useState("");
  const [appDate, setAppDate] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [referralStatus, setReferralStatus] = useState<PlacementApplication["referralStatus"]>("None");
  const [status, setStatus] = useState<PlacementApplication["status"]>("Saved");
  const [notes, setNotes] = useState("");

  // Recruiter fields
  const [recName, setRecName] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [recLinkedIn, setRecLinkedIn] = useState("");

  // Offer fields
  const [offerCtc, setOfferCtc] = useState("");
  const [offerLocation, setOfferLocation] = useState("");
  const [offerJoinDate, setOfferJoinDate] = useState("");
  const [growthVal, setGrowthVal] = useState(4);
  const [exposureVal, setExposureVal] = useState(4);
  const [brandVal, setBrandVal] = useState(4);
  const [potentialVal, setPotentialVal] = useState(4);

  // Schedules subform
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [newSchType, setNewSchType] = useState<InterviewSchedule["type"]>("Online Assessment");
  const [newSchDate, setNewSchDate] = useState("");
  const [newSchTime, setNewSchTime] = useState("");
  const [newSchPlatform, setNewSchPlatform] = useState("");
  const [newSchNotes, setNewSchNotes] = useState("");

  // AI comparison outcome
  const [offerComparisonText, setOfferComparisonText] = useState<string | null>(null);
  const [isComparingOffers, setIsComparingOffers] = useState(false);
  
  // AI insights outcome
  const [aiInsights, setAiInsights] = useState<{ strengths: string[]; weaknesses: string[]; recommendations: string[] } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Doc upload state simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<CrmDocument["type"]>("Resume");
  const [newDocFileName, setNewDocFileName] = useState("");
  const [newDocNotes, setNewDocNotes] = useState("");

  // Open Form Modal Helper
  const openFormModal = (app?: PlacementApplication) => {
    if (app) {
      setEditingApp(app);
      setCompanyName(PREDEFINED_COMPANIES.includes(app.companyName) ? app.companyName : "Custom...");
      setCustomCompanyName(PREDEFINED_COMPANIES.includes(app.companyName) ? "" : app.companyName);
      setRole(app.role);
      setLocation(app.location);
      setPackageCtc(app.package);
      setAppDate(app.applicationDate);
      setJobUrl(app.jobUrl || "");
      setReferralStatus(app.referralStatus);
      setStatus(app.status);
      setNotes(app.notes || "");
      setRecName(app.recruiter?.name || "");
      setRecEmail(app.recruiter?.email || "");
      setRecPhone(app.recruiter?.phone || "");
      setRecLinkedIn(app.recruiter?.linkedIn || "");
      setSchedules(app.schedules);
      if (app.offer) {
        setOfferCtc(app.offer.ctc);
        setOfferLocation(app.offer.location);
        setOfferJoinDate(app.offer.joiningDate);
        setGrowthVal(app.offer.growthRating);
        setExposureVal(app.offer.exposureRating);
        setBrandVal(app.offer.brandValueRating);
        setPotentialVal(app.offer.potentialRating);
      } else {
        setOfferCtc("");
        setOfferLocation("");
        setOfferJoinDate("");
        setGrowthVal(4);
        setExposureVal(4);
        setBrandVal(4);
        setPotentialVal(4);
      }
    } else {
      setEditingApp(null);
      setCompanyName("IBM");
      setCustomCompanyName("");
      setRole("");
      setLocation("");
      setPackageCtc("");
      setAppDate(new Date().toISOString().split("T")[0]);
      setJobUrl("");
      setReferralStatus("None");
      setStatus("Saved");
      setNotes("");
      setRecName("");
      setRecEmail("");
      setRecPhone("");
      setRecLinkedIn("");
      setSchedules([]);
      setOfferCtc("");
      setOfferLocation("");
      setOfferJoinDate("");
      setGrowthVal(4);
      setExposureVal(4);
      setBrandVal(4);
      setPotentialVal(4);
    }
    setIsFormOpen(true);
  };

  // Move Stage Helper
  const moveApplicationStage = (id: string, targetStatus: PlacementApplication["status"]) => {
    const updated = apps.map(app => {
      if (app.id === id) {
        // Adjust offer block if stage changes to Offer Received and offer is blank
        let offerObj = app.offer;
        if (targetStatus === "Offer Received" && !offerObj) {
          offerObj = {
            ctc: app.package,
            location: app.location,
            joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            growthRating: 4,
            exposureRating: 4,
            brandValueRating: 4,
            potentialRating: 4
          };
        }
        return { ...app, status: targetStatus, offer: offerObj };
      }
      return app;
    });
    saveApps(updated);
    
    // Confetti logic if Offer Received or Joined unlocked
    if (targetStatus === "Offer Received" || targetStatus === "Joined") {
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    if (typeof window !== "undefined") {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  };

  // Add Schedule Handler
  const handleAddSchedule = () => {
    if (!newSchDate || !newSchTime || !newSchPlatform) return;
    const newSch: InterviewSchedule = {
      id: `sch-${Date.now()}`,
      type: newSchType,
      date: newSchDate,
      time: newSchTime,
      platform: newSchPlatform,
      notes: newSchNotes
    };
    setSchedules([...schedules, newSch]);
    setNewSchDate("");
    setNewSchTime("");
    setNewSchPlatform("");
    setNewSchNotes("");
  };

  const handleRemoveSchedule = (schId: string) => {
    setSchedules(schedules.filter(s => s.id !== schId));
  };

  // Save Application Form Handler
  const handleSaveAppForm = () => {
    const finalCompanyName = companyName === "Custom..." ? customCompanyName.trim() : companyName;
    if (!finalCompanyName || !role || !location || !packageCtc || !appDate) {
      alert("Please fill in all mandatory application details fields.");
      return;
    }

    // Heuristic Match Score Calculation based on target tracking
    // Generates a mock but sensible score based on CV length caches and interview statistics
    let atsMatch = 70;
    let interviewReadinessVal = 65;
    if (typeof window !== "undefined") {
      atsMatch = Number(localStorage.getItem("ats_score") || "72");
      const savedProgress = localStorage.getItem("roadmap_progress_states");
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          const checked = Object.values(parsed).filter(Boolean).length;
          interviewReadinessVal = Math.min(60 + checked * 4, 95);
        } catch {}
      }
    }
    const weightOverall = Math.round((atsMatch * 0.4) + (interviewReadinessVal * 0.4) + (referralStatus !== "None" ? 15 : 5));
    const finalMatchScore = {
      resumeMatch: atsMatch,
      interviewReadiness: interviewReadinessVal,
      overallProbability: Math.min(weightOverall, 99)
    };

    let offerObj: OfferDetails | undefined;
    if (status === "Offer Received" || status === "Joined") {
      offerObj = {
        ctc: offerCtc || packageCtc,
        location: offerLocation || location,
        joiningDate: offerJoinDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        growthRating: growthVal,
        exposureRating: exposureVal,
        brandValueRating: brandVal,
        potentialRating: potentialVal
      };
    }

    const appObj: PlacementApplication = {
      id: editingApp ? editingApp.id : `app-${Date.now()}`,
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
      schedules,
      offer: offerObj,
      matchScore: editingApp?.matchScore || finalMatchScore
    };

    let updatedList: PlacementApplication[];
    if (editingApp) {
      updatedList = apps.map(a => a.id === editingApp.id ? appObj : a);
    } else {
      updatedList = [...apps, appObj];
    }

    saveApps(updatedList);
    setIsFormOpen(false);
  };

  // Delete Application
  const handleDeleteApp = (appId: string) => {
    if (window.confirm("Are you sure you want to delete this job application record?")) {
      const updated = apps.filter(a => a.id !== appId);
      saveApps(updated);
      setIsFormOpen(false);
    }
  };

  // Dynamic KPI Metric Computations
  const totalApps = apps.filter(a => a.status !== "Saved").length;
  const interviewCallsList = apps.filter(a => 
    ["Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(a.status) || 
    a.schedules.some(s => s.type.toLowerCase().includes("interview"))
  );
  const interviewCallsCount = interviewCallsList.length;
  const offersCount = apps.filter(a => ["Offer Received", "Joined"].includes(a.status)).length;
  const rejectionsCount = apps.filter(a => a.status === "Rejected").length;
  const oasClearedCount = apps.filter(a => 
    ["Assessment Completed", "Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(a.status) ||
    a.schedules.some(s => s.type === "Online Assessment" && s.notes?.toLowerCase().includes("clear"))
  ).length;

  const interviewConversionRate = totalApps > 0 ? Math.round((interviewCallsCount / totalApps) * 100) : 0;
  const offerConversionRate = interviewCallsCount > 0 ? Math.round((offersCount / interviewCallsCount) * 100) : 0;
  const overallSuccessRate = totalApps > 0 ? Math.round((offersCount / totalApps) * 100) : 0;

  // Drag and Drop Column Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PlacementApplication["status"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      moveApplicationStage(id, targetStatus);
    }
  };

  // Upcoming Tasks/Schedules compilation
  const upcomingSchedules = apps.flatMap(a => 
    a.schedules.map(s => ({ ...s, companyName: a.companyName, role: a.role, appId: a.id }))
  ).filter(s => {
    const today = new Date().toISOString().split("T")[0];
    return s.date >= today;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Today's tasks vs Week's tasks
  const todayDate = new Date().toISOString().split("T")[0];
  const todaySchedules = upcomingSchedules.filter(s => s.date === todayDate);
  const weekSchedules = upcomingSchedules.filter(s => {
    const diff = (new Date(s.date).getTime() - new Date(todayDate).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  // Rejection Analytics diagnostics
  const rejectedAfterOA = apps.filter(a => a.status === "Rejected" && a.schedules.length === 1 && a.schedules[0].type === "Online Assessment").length;
  const rejectedAfterTech = apps.filter(a => a.status === "Rejected" && a.schedules.some(s => s.type === "Technical Interview" || s.type === "Managerial Round") && !a.schedules.some(s => s.type === "HR Round")).length;
  const rejectedAfterHR = apps.filter(a => a.status === "Rejected" && a.schedules.some(s => s.type === "HR Round")).length;
  const otherRejections = Math.max(0, rejectionsCount - (rejectedAfterOA + rejectedAfterTech + rejectedAfterHR));

  // AI Offer Comparison trigger
  const handleCompareOffers = async () => {
    const offerApps = apps.filter(a => ["Offer Received", "Joined"].includes(a.status));
    if (offerApps.length === 0) {
      alert("No active job offers detected to compare. Move a card into the 'Offer Received' column first!");
      return;
    }
    
    setIsComparingOffers(true);
    setOfferComparisonText(null);

    const compiledOffers = offerApps.map(a => ({
      company: a.companyName,
      role: a.role,
      ctc: a.offer?.ctc || a.package,
      location: a.offer?.location || a.location,
      growthRating: a.offer?.growthRating || 4,
      exposureRating: a.offer?.exposureRating || 4,
      brandRating: a.offer?.brandValueRating || 4,
      potentialRating: a.offer?.potentialRating || 4
    }));

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          task: "compare-offers",
          offers: compiledOffers
        })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to compile comparison");
      setOfferComparisonText(responseData.data.aiRecommendation);
    } catch (err) {
      // Offline Heuristic Fallback
      console.warn("Gemini API comparison errored, running offline heuristics", err);
      // Construct detailed heuristic advice
      const sortedByCtc = [...compiledOffers].sort((a, b) => {
        const parseCtc = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
        return parseCtc(b.ctc) - parseCtc(a.ctc);
      });
      const highestCtc = sortedByCtc[0];
      const highestBrand = [...compiledOffers].sort((a, b) => b.brandRating - a.brandRating)[0];

      const heuristicVerdict = `### ⚖️ Job Offer Comparison Analysis (Offline Heuristic)

Based on the parameters analyzed:
- **Highest Salary**: **${highestCtc.company}** offering **${highestCtc.ctc}**.
- **Strongest Brand Reputation**: **${highestBrand.company}** (Brand Index: ${highestBrand.brandRating}/5).

#### 💼 Key Recommendations:
1. **${highestCtc.company}** provides the best initial financial reward (**${highestCtc.ctc}**). If compensation is your top priority to offset student loans or start independent budgets, this is the optimal choice.
2. If career acceleration is prioritized, choose the offer representing the highest **Growth Rating** and **Technical Exposure** to ensure you build skills that appreciate over the next 3 years.
3. Keep location costs in mind. An offer of **12 LPA in Bengaluru** might have equivalent real disposable value to **9 LPA in Hyderabad** after adjustments for rent and transport indices.

*Verdict*: We recommend prioritizing **${highestBrand.brandRating >= highestCtc.brandRating ? highestBrand.company : highestCtc.company}** due to its superior brand weight which benefits early career transitions.`;

      setOfferComparisonText(heuristicVerdict);
    } finally {
      setIsComparingOffers(false);
    }
  };

  // AI Application Insights trigger
  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setAiInsights(null);

    let atsRating = 72;
    let intAvg = 55;
    if (typeof window !== "undefined") {
      atsRating = Number(localStorage.getItem("ats_score") || "72");
      const interviewHistory = localStorage.getItem("interview_history");
      if (interviewHistory) {
        try {
          const list = JSON.parse(interviewHistory);
          if (list.length > 0) {
            intAvg = Math.round(list.reduce((acc: number, curr: { overallScore?: number }) => acc + (curr.overallScore || 0), 0) / list.length);
          }
        } catch {}
      }
    }

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
        },
        body: JSON.stringify({
          task: "application-insights",
          targetRole: "Software Engineer",
          atsScore: atsRating,
          averageInterviewScore: intAvg,
          applications: apps.map(a => ({ companyName: a.companyName, status: a.status, matchScore: a.matchScore }))
        })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to generate insights");
      setAiInsights(responseData.data);
    } catch (err) {
      console.warn("Gemini insights call failed, running heuristic audit", err);
      // Heuristic fallback logic
      const strengths = ["Good initial response on ATS parsing indexes", "Good persistence on bookmarking roles"];
      const weaknesses = [];
      const recommendations = [];

      if (rejectionsCount > 0) {
        weaknesses.push("Drop-offs detected in technical interview rounds");
        recommendations.push("Utilize the AI Interview Prep simulator to audit filler words and Pace variables");
      } else {
        weaknesses.push("Limited active interview conversion logs");
        recommendations.push("Apply to at least 5 more high-match roles to generate initial assessment invites");
      }

      if (oasClearedCount === 0 && apps.some(a => a.schedules.some(s => s.type === "Online Assessment"))) {
        weaknesses.push("Online Assessment clearance is below standard benchmarks");
        recommendations.push("Study object-oriented database schema indexing and common aptitude arrays in practice resources");
      } else {
        strengths.push("Active practice logs on online coding tests");
      }

      if (apps.filter(a => a.referralStatus !== "None").length === 0) {
        weaknesses.push("No referral request tags active on your application tracking records");
        recommendations.push("Use the LinkedIn Optimizer checklist to add contacts and ask for job referrals");
      } else {
        strengths.push("Effective networking utilizing student referrals");
      }

      if (strengths.length < 3) strengths.push("Strong core tech stack matching");
      if (weaknesses.length < 3) weaknesses.push("Sub-optimal scheduling follow-up timelines");
      if (recommendations.length < 3) recommendations.push("Run customized ATS scans before uploading resumes to recruiter links");

      setAiInsights({
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3),
        recommendations: recommendations.slice(0, 3)
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Document upload simulation
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !newDocFileName) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc: CrmDocument = {
              id: `doc-${Date.now()}`,
              title: newDocTitle,
              type: newDocType,
              fileName: newDocFileName,
              uploadDate: new Date().toISOString().split("T")[0],
              notes: newDocNotes || undefined
            };
            const updated = [...documents, newDoc];
            saveDocs(updated);
            
            // Clean state
            setIsUploading(false);
            setNewDocTitle("");
            setNewDocFileName("");
            setNewDocNotes("");
            setUploadProgress(0);
          }, 300);
          return 100;
        }
        return p + 20;
      });
    }, 100);
  };

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm("Are you sure you want to delete this document from the center?")) {
      saveDocs(documents.filter(d => d.id !== docId));
    }
  };

  // Badges lists & status checkers
  const badgesList = [
    { id: "b1", title: "First Step", desc: "Submit your first job application.", unlocked: apps.some(a => a.status !== "Saved") },
    { id: "b2", title: "Power Applicant", desc: "Submit 10 or more job applications.", unlocked: totalApps >= 10 },
    { id: "b3", title: "CRM Master", desc: "Log 30 applications in the system.", unlocked: totalApps >= 30 },
    { id: "b4", title: "Call to Action", desc: "Schedule or secure your first interview invitation.", unlocked: interviewCallsCount >= 1 },
    { id: "b5", title: "Winner's Circle", desc: "Receive at least one placement offer letter.", unlocked: offersCount >= 1 },
    { id: "b6", title: "Mission Completed", desc: "Officially mark yourself as 'Joined' a company.", unlocked: apps.some(a => a.status === "Joined") }
  ];

  return (
    <div className="space-y-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
            <Layers className="w-3.5 h-3.5" />
            Recruitment CRM
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Placement Tracker CRM
          </h1>
          <p className="text-slate-500 font-medium text-base leading-relaxed">
            Centralize your entire job application cycle, schedule interviews, compare offers, and diagnose rejections using custom analytics dashboard checks.
          </p>
        </div>

        <button
          onClick={() => openFormModal()}
          className="px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Plus className="w-4.5 h-4.5 text-teal-300" />
          <span>Add Application</span>
        </button>
      </div>

      {/* CORE NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "dashboard", label: "Analytics Hub", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "kanban", label: `Kanban Board (${apps.length})`, icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: "comparison", label: "Offer Comparison", icon: <DollarSign className="w-4 h-4" /> },
          { id: "documents", label: "Document Center", icon: <FileText className="w-4 h-4" /> },
          { id: "badges", label: "Badges & Shelf", icon: <Award className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setOfferComparisonText(null);
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border",
              activeTab === tab.id
                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. ANALYTICS / OVERVIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-12 animate-fade-in">
          {/* KPI Widget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Submitted applications", val: totalApps, sub: `${apps.filter(a => a.status === "Saved").length} saved bookmarks`, color: "text-blue-600", bg: "bg-blue-50/30", border: "border-blue-100" },
              { label: "Interview calls", val: interviewCallsCount, sub: `${interviewConversionRate}% Conversion rate`, color: "text-indigo-600", bg: "bg-indigo-50/30", border: "border-indigo-100" },
              { label: "Offers received", val: offersCount, sub: `${offerConversionRate}% Offer rate`, color: "text-emerald-600", bg: "bg-emerald-50/30", border: "border-emerald-100" },
              { label: "Total rejections", val: rejectionsCount, sub: `${overallSuccessRate}% Overall Success rate`, color: "text-rose-600", bg: "bg-rose-50/30", border: "border-rose-100" }
            ].map((card, idx) => (
              <div key={idx} className={cn("p-6 rounded-3xl border bg-white flex flex-col justify-between min-h-[140px] shadow-sm", card.bg, card.border)}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{card.label}</span>
                <div className="my-2">
                  <span className={cn("text-4xl font-black font-display tracking-tight", card.color)}>{card.val}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold block">{card.sub}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Planner and Reminders (Left) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Daily Planner Checklist */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 font-display">Daily Placement Planner</h3>
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{todayDate}</span>
                </div>

                <div className="space-y-4">
                  {todaySchedules.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        const originalApp = apps.find(a => a.id === task.appId);
                        if (originalApp) openFormModal(originalApp);
                      }}
                      className="p-4 border border-amber-200 bg-amber-50/20 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-amber-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <strong className="text-sm font-black text-slate-800">{task.type} @ {task.companyName}</strong>
                        </div>
                        <p className="text-xs text-slate-400 font-bold">{task.role} • Platform: {task.platform} • Time: {task.time}</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase tracking-widest rounded-lg">Today</span>
                    </div>
                  ))}

                  {/* Pending Follow-ups check */}
                  {apps.filter(a => a.status === "Applied" && (new Date(todayDate).getTime() - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) > 7).map(a => (
                    <div
                      key={a.id}
                      onClick={() => openFormModal(a)}
                      className="p-4 border border-indigo-100 bg-indigo-50/10 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-200 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <strong className="text-sm font-black text-slate-800">Pending Recruiter Follow-up: {a.companyName}</strong>
                        </div>
                        <p className="text-xs text-slate-400 font-bold">{a.role} • Applied on {a.applicationDate} ({Math.round((new Date(todayDate).getTime() - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24))} days ago)</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[9px] font-black uppercase tracking-widest rounded-lg">Follow up</span>
                    </div>
                  ))}

                  {todaySchedules.length === 0 && apps.filter(a => a.status === "Applied" && (new Date(todayDate).getTime() - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) > 7).length === 0 && (
                    <p className="text-xs text-slate-400 font-bold text-center py-8">No specific assessments or interviews scheduled for today. Great job keeping your pipeline updated!</p>
                  )}
                </div>
              </div>

              {/* Reminders list (This Week) */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 font-display">This Week&apos;s Schedules</h3>
                
                <div className="space-y-3">
                  {weekSchedules.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        const originalApp = apps.find(a => a.id === task.appId);
                        if (originalApp) openFormModal(originalApp);
                      }}
                      className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <strong className="text-xs font-black text-slate-800 block">{task.type} - {task.companyName} ({task.role})</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Date: {task.date} | Time: {task.time} | Venue: {task.platform}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}

                  {weekSchedules.length === 0 && (
                    <p className="text-xs text-slate-400 font-bold text-center py-6">No scheduled events remaining for the upcoming week.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Diagnostics & AI Insights (Right) */}
            <div className="lg:col-span-5 space-y-8">
              {/* Failure Pipeline Diagnostic */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 font-display">Rejection Pipeline Diagnostics</h3>
                <p className="text-[10px] text-slate-400 font-bold">Trace which recruitment layers represent critical bottlenecks in landing placements.</p>

                <div className="space-y-4">
                  {[
                    { label: "Dropped after Online Assessment (OA)", count: rejectedAfterOA, pct: rejectionsCount > 0 ? Math.round((rejectedAfterOA / rejectionsCount) * 100) : 0, color: "bg-amber-500" },
                    { label: "Dropped after Tech/Managerial Interviews", count: rejectedAfterTech, pct: rejectionsCount > 0 ? Math.round((rejectedAfterTech / rejectionsCount) * 100) : 0, color: "bg-indigo-500" },
                    { label: "Dropped after HR Partner Rounds", count: rejectedAfterHR, pct: rejectionsCount > 0 ? Math.round((rejectedAfterHR / rejectionsCount) * 100) : 0, color: "bg-pink-500" },
                    { label: "Other / Direct Rejections", count: otherRejections, pct: rejectionsCount > 0 ? Math.round((otherRejections / rejectionsCount) * 100) : 0, color: "bg-slate-400" }
                  ].map((layer, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>{layer.label}</span>
                        <span>{layer.count} ({layer.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", layer.color)} style={{ width: `${layer.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI CRM Insights Panel */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white border border-slate-800 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-indigo-500/10" />
                <div className="flex justify-between items-center z-10 relative">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">AI Placement Copilot</span>
                    <h4 className="text-lg font-black font-display">Journey Diagnostics</h4>
                  </div>
                  <button
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingInsights ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-teal-300" />
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {aiInsights ? (
                    <motion.div
                      key="insights"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 text-xs z-10 relative leading-relaxed"
                    >
                      <div>
                        <strong className="text-teal-300 block mb-1 font-black uppercase tracking-wider">Strengths Identified:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 font-bold">
                          {aiInsights.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-rose-300 block mb-1 font-black uppercase tracking-wider">Critical Bottlenecks:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 font-bold">
                          {aiInsights.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-indigo-300 block mb-1 font-black uppercase tracking-wider">Next Strategic Steps:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 font-bold">
                          {aiInsights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-bold text-xs z-10 relative">
                      Click the sparkle button to analyze your history, search for patterns, and unlock suggestions.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. KANBAN BOARD */}
      {activeTab === "kanban" && (
        <div className="space-y-6 animate-fade-in">
          {/* Scrollable Column Container */}
          <div className="flex gap-6 overflow-x-auto pb-6 select-none max-w-full items-start">
            {KANBAN_STAGES.map(stage => {
              const stageApps = apps.filter(app => app.status === stage.id);
              
              return (
                <div
                  key={stage.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className="w-72 bg-slate-50 p-4 rounded-3xl border border-slate-200/50 flex-shrink-0 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", stage.dot)} />
                      <strong className="text-xs font-black text-slate-700 uppercase tracking-wider">{stage.label}</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200/80 rounded-lg text-[9px] font-black text-slate-500">{stageApps.length}</span>
                  </div>

                  {/* Card Container */}
                  <div className="space-y-3 flex-grow overflow-y-auto max-h-[460px] pr-1">
                    {stageApps.map(app => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => openFormModal(app)}
                        className="p-4 bg-white border border-slate-200/80 hover:border-teal-300 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer space-y-3 relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-xs font-black text-slate-800 block truncate max-w-[150px]">{app.companyName}</strong>
                            <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[150px]">{app.role}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[8px] font-black rounded uppercase">
                            {app.package}
                          </span>
                        </div>

                        {/* Mini match rating progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                            <span>Match Prob.</span>
                            <span>{app.matchScore.overallProbability}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${app.matchScore.overallProbability}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[8px] text-slate-400 font-bold">
                          <span>{app.location}</span>
                          <span>{app.applicationDate}</span>
                        </div>

                        {/* Move controls helper (arrows for quick swap without drag) */}
                        <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                          <button
                            title="Move Left"
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = KANBAN_STAGES.findIndex(s => s.id === stage.id);
                              if (idx > 0) moveApplicationStage(app.id, KANBAN_STAGES[idx - 1].id);
                            }}
                            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            title="Move Right"
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = KANBAN_STAGES.findIndex(s => s.id === stage.id);
                              if (idx < KANBAN_STAGES.length - 1) moveApplicationStage(app.id, KANBAN_STAGES[idx + 1].id);
                            }}
                            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {stageApps.length === 0 && (
                      <div className="h-24 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[10px] text-slate-400 font-bold text-center p-4">
                        Drag application here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. OFFER COMPARISON */}
      {activeTab === "comparison" && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-black text-slate-900 font-display">Offer Comparison Engine</h3>
              <p className="text-[10px] text-slate-400 font-bold">Evaluate your offer letters side-by-side on CTC, Brand, Skills Growth, and Location variables.</p>
            </div>
            <button
              onClick={handleCompareOffers}
              disabled={isComparingOffers || apps.filter(a => ["Offer Received", "Joined"].includes(a.status)).length === 0}
              className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isComparingOffers ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing offers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span>Run AI Comparison</span>
                </>
              )}
            </button>
          </div>

          {/* Cards Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apps.filter(a => ["Offer Received", "Joined"].includes(a.status)).map(app => (
              <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-teal-100 shadow-sm relative space-y-4">
                <div className="absolute right-4 top-4 px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Active Offer</div>
                <div>
                  <strong className="text-lg font-black text-slate-800 leading-tight block">{app.companyName}</strong>
                  <span className="text-xs text-slate-400 font-bold block mt-0.5">{app.role}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3 text-xs font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Offered Package (CTC)</span>
                    <span className="text-slate-800 font-black">{app.offer?.ctc || app.package}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="text-slate-800 font-black">{app.offer?.location || app.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joining Date</span>
                    <span className="text-slate-800 font-black">{app.offer?.joiningDate || "TBD"}</span>
                  </div>
                </div>

                {/* Star levels display */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {[
                    { label: "Career Growth Potential", val: app.offer?.growthRating || 4 },
                    { label: "Technical exposure", val: app.offer?.exposureRating || 4 },
                    { label: "Company Brand Value", val: app.offer?.brandValueRating || 4 },
                    { label: "Work-life Potential", val: app.offer?.potentialRating || 4 }
                  ].map((attr, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{attr.label}</span>
                      <span className="text-teal-600 font-black">{attr.val} / 5</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {apps.filter(a => ["Offer Received", "Joined"].includes(a.status)).length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white rounded-[2rem] border border-slate-200/60 text-slate-400 font-bold text-xs">
                No active placement offers logged yet. Once you move an application card to &quot;Offer Received&quot;, it will display here.
              </div>
            )}
          </div>

          {/* AI Comparison verdict */}
          <AnimatePresence>
            {offerComparisonText && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-5 h-5 text-teal-300" />
                  <strong className="text-sm font-black uppercase tracking-wider text-teal-400">AI Comparison recommendation</strong>
                </div>
                <div className="text-xs font-semibold leading-relaxed text-slate-300 space-y-4 whitespace-pre-wrap">
                  {offerComparisonText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. DOCUMENT CENTER */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Upload panel (Left) */}
          <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 font-display">Document Vault</h3>
            
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accenture Offer Letter"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as CrmDocument["type"])}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                >
                  {["Resume", "Offer Letter", "Certificate", "Assessment Result", "Notes"].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accenture_FullStack_Offer.pdf"
                  value={newDocFileName}
                  onChange={(e) => setNewDocFileName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Additional Description notes</label>
                <textarea
                  placeholder="Reference notes or validity dates..."
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Register File"}
              </button>
            </form>

            {/* Simulating progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Uploading to cloud storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Files List (Right) */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 font-display">Registered Files</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-150 rounded-2xl flex items-start gap-4 hover:border-slate-300 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-teal-600 shrink-0 border border-slate-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1 flex-1 overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-xs font-black text-slate-800 truncate leading-none block">{doc.title}</strong>
                      <button
                        title="Delete document"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-black rounded uppercase tracking-wider inline-block">
                      {doc.type}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold truncate">{doc.fileName}</p>
                    {doc.notes && <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic mt-1">{doc.notes}</p>}
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="col-span-2 text-center py-16 text-slate-400 font-bold text-xs">No documents uploaded to this space.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. GAMIFICATION / BADGES */}
      {activeTab === "badges" && (
        <div className="space-y-8 animate-fade-in">
          <div className="max-w-xl space-y-2">
            <h3 className="text-xl font-black text-slate-900 font-display">Placement Badge Shelf</h3>
            <p className="text-xs text-slate-400 font-bold">Collect virtual badges automatically as you apply to companies, clear interviews, and secure offer letters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {badgesList.map(badge => (
              <div
                key={badge.id}
                className={cn(
                  "p-6 border rounded-[2rem] flex gap-4 transition-all relative overflow-hidden",
                  badge.unlocked
                    ? "bg-teal-50/20 border-teal-200 text-slate-800"
                    : "bg-slate-50 border-slate-200 opacity-60"
                )}
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-inner shrink-0 border border-slate-100">
                  {badge.unlocked ? (
                    <CheckCircle2 className="w-8 h-8 text-teal-600" />
                  ) : (
                    <Award className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="space-y-1 my-auto">
                  <strong className="text-sm font-black text-slate-800 leading-none block">{badge.title}</strong>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal mt-1">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 md:p-10 space-y-8 shadow-2xl relative animate-scale-up">
            
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 font-display">
                {editingApp ? "Edit Application Details" : "Log New Job Application"}
              </h3>
              <p className="text-xs text-slate-400 font-bold">Track references, notes, recruiter emails, and scheduling calendars.</p>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Mandatory Fields */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Core details</h4>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company Name</label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    {PREDEFINED_COMPANIES.map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                    <option value="Custom...">Custom / Other...</option>
                  </select>
                </div>

                {companyName === "Custom..." && (
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custom Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google, Flipkart"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Job Role / Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai, Remote"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Package CTC</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 8 LPA, 45k/mo"
                      value={packageCtc}
                      onChange={(e) => setPackageCtc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Application Date</label>
                    <input
                      type="date"
                      required
                      value={appDate}
                      onChange={(e) => setAppDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referral Status</label>
                    <select
                      value={referralStatus}
                      onChange={(e) => setReferralStatus(e.target.value as PlacementApplication["referralStatus"])}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    >
                      {["None", "Requested", "Applied", "Referred"].map(ref => (
                        <option key={ref} value={ref}>{ref}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Job Link URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com/job/123"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status Column</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PlacementApplication["status"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    {KANBAN_STAGES.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extra details (Recruiter & Offer block) */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Recruiter & notes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Recruiter Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HR Team"
                      value={recName}
                      onChange={(e) => setRecName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="hr@company.com"
                      value={recEmail}
                      onChange={(e) => setRecEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={recPhone}
                      onChange={(e) => setRecPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/..."
                      value={recLinkedIn}
                      onChange={(e) => setRecLinkedIn(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Application Notes / Feedback</label>
                  <textarea
                    placeholder="Provide any details about rounds, feedback or custom links..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs h-28 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Conditionally Display Offer Details Fields if status is Offer/Joined */}
            {(status === "Offer Received" || status === "Joined") && (
              <div className="p-6 bg-teal-50/20 border border-teal-100 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  Offer Compensation & Valuation Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Final CTC Offered</label>
                    <input
                      type="text"
                      placeholder="e.g. 12.5 LPA"
                      value={offerCtc}
                      onChange={(e) => setOfferCtc(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Office Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={offerLocation}
                      onChange={(e) => setOfferLocation(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={offerJoinDate}
                      onChange={(e) => setOfferJoinDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {[
                    { label: "Career Growth", val: growthVal, setVal: setGrowthVal },
                    { label: "Tech Exposure", val: exposureVal, setVal: setExposureVal },
                    { label: "Brand Prestige", val: brandVal, setVal: setBrandVal },
                    { label: "Role Potential", val: potentialVal, setVal: setPotentialVal }
                  ].map((sl, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{sl.label} (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={sl.val}
                        onChange={(e) => sl.setVal(Math.max(1, Math.min(5, parseInt(e.target.value) || 4)))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none text-xs text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-form: Manage Assessment & Interview Schedules */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Assessment & Interview Scheduler</h4>
              
              {/* Display logged schedules */}
              <div className="space-y-2">
                {schedules.map(sch => (
                  <div key={sch.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600 font-bold">
                    <div>
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] mr-2 uppercase tracking-wide inline-block">{sch.type}</span>
                      <span>Date: {sch.date} | Time: {sch.time} | Platform: {sch.platform}</span>
                      {sch.notes && <p className="text-[10px] text-slate-400 mt-1 italic">Notes: {sch.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(sch.id)}
                      className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add schedule input strip */}
              <div className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Type</label>
                    <select
                      value={newSchType}
                      onChange={(e) => setNewSchType(e.target.value as InterviewSchedule["type"])}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      {["Online Assessment", "Technical Interview", "Managerial Round", "HR Round", "Final Round"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 block mb-1">Date</label>
                    <input
                      type="date"
                      value={newSchDate}
                      onChange={(e) => setNewSchDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 block mb-1">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={newSchTime}
                      onChange={(e) => setNewSchTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 block mb-1">Platform</label>
                    <input
                      type="text"
                      placeholder="HackerRank, Teams..."
                      value={newSchPlatform}
                      onChange={(e) => setNewSchPlatform(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[8px] font-black text-slate-400 block mb-1">Round Notes</label>
                    <input
                      type="text"
                      placeholder="Syllabus, topics to focus..."
                      value={newSchNotes}
                      onChange={(e) => setNewSchNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className="px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-teal-600 transition-all cursor-pointer"
                  >
                    Add Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t flex justify-between gap-4">
              {editingApp ? (
                <button
                  type="button"
                  onClick={() => handleDeleteApp(editingApp.id)}
                  className="px-5 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAppForm}
                  className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all cursor-pointer shadow-md"
                >
                  Save Application
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
