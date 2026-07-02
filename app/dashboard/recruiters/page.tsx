"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  Mail,
  X,
  Check,
  Edit2,
  RefreshCw,
  Info,
  AlertCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Clock,
  ArrowRight,
  Send,
  Upload,
  Link2,
  FileText,
  Bookmark,
  Share2,
  UserCheck,
  ThumbsUp,
  Flame,
  CheckCircle2,
  FolderLock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Recruiter,
  RecruiterActivity,
  RecruiterFollowup,
  RecruiterTemplate,
  calculateRelationshipScore,
  calculateOpportunityScore,
  classifyOpportunityLevel
} from "@/lib/db/recruiters";
import { getApplications } from "@/lib/db/applications";

const PIPELINE_STAGES = [
  "Prospecting",
  "Connected",
  "Conversation Started",
  "Relationship Building",
  "Referral Requested",
  "Referral Received",
  "Application Submitted",
  "Interview Opportunity",
  "Offer Pipeline",
  "Long-Term Network"
];

const STAGE_COLORS: Record<string, string> = {
  "Prospecting": "bg-slate-100 text-slate-700 border-slate-200",
  "Connected": "bg-blue-50 text-blue-700 border-blue-100",
  "Conversation Started": "bg-purple-50 text-purple-700 border-purple-100",
  "Relationship Building": "bg-pink-50 text-pink-700 border-pink-100",
  "Referral Requested": "bg-orange-50 text-orange-700 border-orange-100",
  "Referral Received": "bg-teal-50 text-teal-700 border-teal-100",
  "Application Submitted": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Interview Opportunity": "bg-amber-50 text-amber-700 border-amber-100",
  "Offer Pipeline": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Long-Term Network": "bg-emerald-50 text-emerald-700 border-emerald-150",
  "Lead Found": "bg-slate-100 text-slate-700 border-slate-200",
  "Connection Sent": "bg-blue-50 text-blue-700 border-blue-100",
  "Follow Up": "bg-pink-50 text-pink-700 border-pink-100",
  "Hired": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Lost": "bg-rose-50 text-rose-700 border-rose-100"
};

const STRENGTH_COLORS: Record<string, string> = {
  "Cold": "bg-slate-100 text-slate-600",
  "Connected": "bg-blue-50 text-blue-600",
  "Messaged": "bg-indigo-50 text-indigo-600",
  "Responded": "bg-purple-50 text-purple-600",
  "Referral Possible": "bg-amber-50 text-amber-600",
  "Strong Connection": "bg-emerald-50 text-emerald-600"
};

const OPPORTUNITY_LEVEL_COLORS: Record<string, string> = {
  "High Opportunity": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Medium Opportunity": "bg-amber-50 text-amber-700 border-amber-200",
  "Low Opportunity": "bg-rose-50 text-rose-700 border-rose-200"
};

export default function RecruitersCRMPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [followups, setFollowups] = useState<RecruiterFollowup[]>([]);
  const [templates, setTemplates] = useState<RecruiterTemplate[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Page level Active Tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "board" | "directory" | "followups" | "analytics" | "opportunity" | "playbooks"
  >("dashboard");

  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalRecruiters: 0,
    activeConversations: 0,
    referralsReceived: 0,
    pendingFollowups: 0,
    interviewOpportunities: 0,
    referralSuccessRate: 0,
    funnel: [] as any[],
    insights: [] as string[],
    averageRelationshipScore: 0,
    averageOpportunityScore: 0,
    verifiedRecruitersCount: 0,
    suspiciousRecruitersCount: 0,
    responseRate: 0,
    highOpportunityCount: 0,
    monthlyActivities: [] as any[],
    successRateByType: [] as any[],
    successRateByCompany: [] as any[],
    highOpportunityProfiles: [] as any[]
  });

  // Search, Filter, Sort States
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [strengthFilter, setStrengthFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [oppLevelFilter, setOppLevelFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minTrustScore, setMinTrustScore] = useState(0);

  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected Recruiter Drawer/Detail states
  const [selectedRecruiter, setSelectedRecruiter] = useState<any | null>(null);
  const [recruiterActivities, setRecruiterActivities] = useState<RecruiterActivity[]>([]);
  const [newActivityType, setNewActivityType] = useState("Message Sent");
  const [newActivityNotes, setNewActivityNotes] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Recruiter Form states
  const [newRec, setNewRec] = useState({
    name: "",
    company: "",
    designation: "",
    department: "",
    company_domain: "",
    recruiter_type: "Technical Recruiter",
    linkedin_url: "",
    email: "",
    phone: "",
    location: "",
    hiring_roles: "",
    relationship_strength: "Cold" as Recruiter["relationship_strength"],
    pipeline_stage: "Prospecting" as Recruiter["pipeline_stage"],
    notes: "",
    tagsString: "",
    trust_score: 100,
    verification_status: "Verified" as any,
    referral_sent_count: 0,
    referral_accepted_count: 0,
    referral_rejected_count: 0,
    interview_count: 0,
    offer_count: 0
  });

  // Edit Recruiter Drawer Form states
  const [editRecName, setEditRecName] = useState("");
  const [editRecCompany, setEditRecCompany] = useState("");
  const [editRecDesignation, setEditRecDesignation] = useState("");
  const [editRecDept, setEditRecDept] = useState("");
  const [editRecDomain, setEditRecDomain] = useState("");
  const [editRecType, setEditRecType] = useState<any>("");
  const [editRecLinkedin, setEditRecLinkedin] = useState("");
  const [editRecEmail, setEditRecEmail] = useState("");
  const [editRecPhone, setEditRecPhone] = useState("");
  const [editRecLocation, setEditRecLocation] = useState("");
  const [editRecRoles, setEditRecRoles] = useState("");
  const [editRecStage, setEditRecStage] = useState<any>("");
  const [editRecStrength, setEditRecStrength] = useState<any>("");
  const [editRecNotes, setEditRecNotes] = useState("");
  const [editRecTags, setEditRecTags] = useState("");
  const [editRecTrust, setEditRecTrust] = useState(100);
  const [editRecStatus, setEditRecStatus] = useState<any>("Verified");
  const [editRecRefSent, setEditRecRefSent] = useState(0);
  const [editRecRefAcc, setEditRecRefAcc] = useState(0);
  const [editRecRefRej, setEditRecRefRej] = useState(0);
  const [editRecIntCount, setEditRecIntCount] = useState(0);
  const [editRecOffCount, setEditRecOffCount] = useState(0);

  // New Followup Form states
  const [newFollow, setNewFollow] = useState({
    recruiter_id: "",
    followup_date: "",
    message: "",
    priority: "Medium" as RecruiterFollowup["priority"],
    reminder: true
  });

  // AI Outreach Generator Drawer states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiRecruiter, setAiRecruiter] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RecruiterTemplate | null>(null);
  const [aiGeneratedText, setAiGeneratedText] = useState({ subject: "", body: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Personalization fields overrides
  const [skillsOverride, setSkillsOverride] = useState("");
  const [roleOverride, setRoleOverride] = useState("");

  const [drawerTab, setDrawerTab] = useState<"activities" | "verification" | "rate_report" | "edit_profile">("activities");

  // Verification Form states
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationOtp, setVerificationOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [docUrlInput, setDocUrlInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Rating states
  const [professionalism, setProfessionalism] = useState(5);
  const [responseTime, setResponseTime] = useState(5);
  const [helpfulness, setHelpfulness] = useState(5);
  const [referralQuality, setReferralQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");

  // Report states
  const [reportReason, setReportReason] = useState<string>("Fake Recruiter");
  const [reportEvidence, setReportEvidence] = useState("");

  // AI Coaching Chat States
  const [coachMessages, setCoachMessages] = useState<Array<{ sender: "user" | "coach"; text: string; date: Date }>>([
    {
      sender: "coach",
      text: "Hello! I am your AI Placement Networking Coach. I monitor your pipeline stages, response rates, and company segments to help you build referral connections. How can I help optimize your outreach today?",
      date: new Date()
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [coachTyping, setCoachTyping] = useState(false);

  // Opportunity matching dropdown selection
  const [matchingApplicationId, setMatchingApplicationId] = useState("");

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      // 1. Fetch recruiters
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (companyFilter) queryParams.set("company", companyFilter);
      if (stageFilter) queryParams.set("stage", stageFilter);
      if (strengthFilter) queryParams.set("strength", strengthFilter);
      if (verifiedOnly) queryParams.set("verifiedOnly", "true");
      if (minTrustScore > 0) queryParams.set("minTrustScore", minTrustScore.toString());
      queryParams.set("sortField", sortField);
      queryParams.set("sortOrder", sortOrder);

      const recRes = await fetch(`/api/recruiter?${queryParams.toString()}`);
      if (recRes.ok) {
        const result = await recRes.json();
        if (result.success) {
          // Normalize rows for potential missing schema properties
          const normalized = (result.recruiters || []).map((r: any) => {
            const calculatedOppScore = calculateOpportunityScore(r);
            const calculatedOppLevel = classifyOpportunityLevel(calculatedOppScore);
            return {
              ...r,
              department: r.department || "",
              company_domain: r.company_domain || "",
              recruiter_type: r.recruiter_type || "Technical Recruiter",
              trust_score: r.trust_score ?? r.verification?.trust_score ?? 100,
              verification_status: r.verification_status || r.verification?.verification_status || "Verified",
              referral_sent_count: r.referral_sent_count ?? 0,
              referral_accepted_count: r.referral_accepted_count ?? 0,
              referral_rejected_count: r.referral_rejected_count ?? 0,
              interview_count: r.interview_count ?? 0,
              offer_count: r.offer_count ?? 0,
              opportunity_score: r.opportunity_score ?? calculatedOppScore,
              opportunity_level: r.opportunity_level || calculatedOppLevel
            };
          });
          setRecruiters(normalized);
        }
      }

      // 2. Fetch followups
      const followRes = await fetch("/api/recruiter/followups?completed=false");
      if (followRes.ok) {
        const result = await followRes.json();
        if (result.success) {
          setFollowups(result.followups || []);
        }
      }

      // 3. Fetch templates
      const tempRes = await fetch("/api/recruiter/templates");
      if (tempRes.ok) {
        const result = await tempRes.json();
        if (result.success) {
          setTemplates(result.templates || []);
        }
      }

      // 4. Fetch Insights Metrics
      const insightsRes = await fetch("/api/recruiter/insights?refresh=true");
      if (insightsRes.ok) {
        const result = await insightsRes.json();
        if (result.success) {
          setMetrics({
            totalRecruiters: result.totalRecruiters,
            activeConversations: result.activeConversations,
            referralsReceived: result.referralsReceived,
            pendingFollowups: result.pendingFollowups,
            interviewOpportunities: result.interviewOpportunities,
            referralSuccessRate: result.referralSuccessRate,
            funnel: result.funnel || [],
            insights: result.insights || [],
            averageRelationshipScore: result.averageRelationshipScore,
            averageOpportunityScore: result.averageOpportunityScore || 0,
            verifiedRecruitersCount: result.verifiedRecruitersCount || 0,
            suspiciousRecruitersCount: result.suspiciousRecruitersCount || 0,
            responseRate: result.responseRate || 0,
            highOpportunityCount: result.highOpportunityCount || 0,
            monthlyActivities: result.monthlyActivities || [],
            successRateByType: result.successRateByType || [],
            successRateByCompany: result.successRateByCompany || [],
            highOpportunityProfiles: result.highOpportunityProfiles || []
          });
        }
      }

      // 5. Fetch applications list
      try {
        const apps = await getApplications(uid);
        setApplications(apps || []);
      } catch (err) {
        console.error("Failed to load applications in CRM:", err);
      }
    } catch (err) {
      console.error("Failed to load recruiter CRM data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadData(user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [search, companyFilter, stageFilter, strengthFilter, sortField, sortOrder, verifiedOnly, minTrustScore]);

  const refreshRecruiterDetails = async (recId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/recruiter/activities?recruiterId=${recId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setRecruiterActivities(result.activities || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOtp = async () => {
    if (!selectedRecruiter) return;
    setOtpLoading(true);
    try {
      const res = await fetch("/api/recruiter-verifications/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiter.id, email: verificationEmail })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setOtpSent(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter-verifications/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiter.id, email: verificationEmail, otp: verificationOtp })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        // Refresh details
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkedinValidate = async () => {
    if (!selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter-verifications/linkedin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiter.id, linkedinUrl: linkedinUrlInput })
      });
      const data = await res.json();
      alert(data.message + (data.authenticityScore ? ` (Authenticity Score: ${data.authenticityScore}%)` : ""));
      if (data.success) {
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter-verifications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiter.id, documentUrl: docUrlInput, linkedinUrl: linkedinUrlInput })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter-verifications/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterId: selectedRecruiter.id,
          professionalism,
          response_time: responseTime,
          helpfulness,
          referral_quality: referralQuality,
          communication,
          feedbackText: ratingFeedback
        })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setRatingFeedback("");
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter-verifications/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterId: selectedRecruiter.id, reason: reportReason, evidence: reportEvidence })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setReportEvidence("");
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getInfluenceScore = (rec: any) => {
    let score = 50; // base
    if (rec.verification_status === "Verified") score += 20;
    const trust = rec.trust_score || 0;
    score += Math.round(trust * 0.15); // max 15 points
    
    const company = (rec.company || "").toLowerCase();
    const FAANG = ["google", "amazon", "microsoft", "apple", "meta", "nvidia"];
    const Tier1 = ["deloitte", "accenture", "ibm", "oracle", "sap", "adobe", "goldman", "jpmorgan"];
    if (FAANG.some(c => company.includes(c))) {
      score += 15;
    } else if (Tier1.some(c => company.includes(c))) {
      score += 10;
    }
    
    const rating = rec.reputation_score ?? rec.verification?.reputation_score ?? 0;
    if (rating > 0) {
      score += Math.round(rating * 2); // max 10 points
    }
    
    return Math.min(100, score);
  };

  const handleSelectRecruiter = async (rec: any) => {
    const r = {
      ...rec,
      trust_score: rec.trust_score ?? rec.verification?.trust_score ?? 100,
      verification_status: rec.verification_status || rec.verification?.verification_status || "Verified",
      referral_sent_count: rec.referral_sent_count ?? 0,
      referral_accepted_count: rec.referral_accepted_count ?? 0,
      referral_rejected_count: rec.referral_rejected_count ?? 0,
      interview_count: rec.interview_count ?? 0,
      offer_count: rec.offer_count ?? 0,
      opportunity_score: rec.opportunity_score ?? calculateOpportunityScore(rec),
      opportunity_level: rec.opportunity_level || classifyOpportunityLevel(calculateOpportunityScore(rec)),
      department: rec.department || "",
      company_domain: rec.company_domain || "",
      recruiter_type: rec.recruiter_type || "Technical Recruiter"
    };

    setSelectedRecruiter(r);
    setVerificationEmail(r.email || "");
    setLinkedinUrlInput(r.linkedin_url || "");
    setDocUrlInput("");
    setOtpSent(false);
    setVerificationOtp("");
    setDrawerTab("activities");

    // Prefill Edit state variables
    setEditRecName(r.name || "");
    setEditRecCompany(r.company || "");
    setEditRecDesignation(r.designation || "");
    setEditRecDept(r.department || "");
    setEditRecDomain(r.company_domain || "");
    setEditRecType(r.recruiter_type || "Technical Recruiter");
    setEditRecLinkedin(r.linkedin_url || "");
    setEditRecEmail(r.email || "");
    setEditRecPhone(r.phone || "");
    setEditRecLocation(r.location || "");
    setEditRecRoles(r.hiring_roles || "");
    setEditRecStage(r.pipeline_stage || "Prospecting");
    setEditRecStrength(r.relationship_strength || "Cold");
    setEditRecNotes(r.notes || "");
    setEditRecTags(r.tags ? r.tags.join(", ") : "");
    setEditRecTrust(r.trust_score);
    setEditRecStatus(r.verification_status);
    setEditRecRefSent(r.referral_sent_count);
    setEditRecRefAcc(r.referral_accepted_count);
    setEditRecRefRej(r.referral_rejected_count);
    setEditRecIntCount(r.interview_count);
    setEditRecOffCount(r.offer_count);

    try {
      const { data: convs } = await supabase
        .from("recruiter_conversations")
        .select("*")
        .eq("recruiter_id", r.id)
        .order("sent_at", { ascending: false });
      setConversations(convs || []);
    } catch (err) {
      console.error("Failed to load recruiter conversations:", err);
    }

    await refreshRecruiterDetails(r.id);
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRecruiter) return;
    
    const parsedTags = editRecTags
      ? editRecTags.split(",").map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const oppScore = calculateOpportunityScore({
      recruiter_type: editRecType,
      verification_status: editRecStatus,
      referral_accepted_count: editRecRefAcc,
      offer_count: editRecOffCount,
      trust_score: editRecTrust
    });

    const bodyPayload = {
      name: editRecName,
      company: editRecCompany,
      designation: editRecDesignation,
      department: editRecDept,
      company_domain: editRecDomain,
      recruiter_type: editRecType,
      linkedin_url: editRecLinkedin,
      email: editRecEmail,
      phone: editRecPhone,
      location: editRecLocation,
      hiring_roles: editRecRoles,
      pipeline_stage: editRecStage,
      relationship_strength: editRecStrength,
      notes: editRecNotes,
      tags: parsedTags,
      trust_score: editRecTrust,
      verification_status: editRecStatus,
      referral_sent_count: editRecRefSent,
      referral_accepted_count: editRecRefAcc,
      referral_rejected_count: editRecRefRej,
      interview_count: editRecIntCount,
      offer_count: editRecOffCount,
      opportunity_score: oppScore,
      opportunity_level: classifyOpportunityLevel(oppScore)
    };

    try {
      const res = await fetch(`/api/recruiter/${selectedRecruiter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Recruiter profile updated successfully!");
        // Update local recruiter
        setSelectedRecruiter({
          ...selectedRecruiter,
          ...bodyPayload
        });
        await loadData(user.id);
      } else {
        alert(result.message || "Failed to update recruiter");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating recruiter profile.");
    }
  };

  const handleAddRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const parsedTags = newRec.tagsString
        ? newRec.tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const oppScore = calculateOpportunityScore({
        recruiter_type: newRec.recruiter_type as any,
        verification_status: newRec.verification_status as any,
        referral_accepted_count: newRec.referral_accepted_count,
        offer_count: newRec.offer_count,
        trust_score: newRec.trust_score
      });

      const payload = {
        ...newRec,
        tags: parsedTags,
        opportunity_score: oppScore,
        opportunity_level: classifyOpportunityLevel(oppScore)
      };

      const res = await fetch("/api/recruiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowAddModal(false);
        setNewRec({
          name: "",
          company: "",
          designation: "",
          department: "",
          company_domain: "",
          recruiter_type: "Technical Recruiter",
          linkedin_url: "",
          email: "",
          phone: "",
          location: "",
          hiring_roles: "",
          relationship_strength: "Cold",
          pipeline_stage: "Prospecting",
          notes: "",
          tagsString: "",
          trust_score: 100,
          verification_status: "Verified",
          referral_sent_count: 0,
          referral_accepted_count: 0,
          referral_rejected_count: 0,
          interview_count: 0,
          offer_count: 0
        });
        await loadData(user.id);
      } else {
        alert(result.message || "Failed to add recruiter");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding recruiter.");
    }
  };

  const handleUpdateStage = async (recId: string, targetStage: string) => {
    if (!user) return;
    
    // Optimistic Update
    const previousRecruiters = [...recruiters];
    const updated = recruiters.map(r => r.id === recId ? { ...r, pipeline_stage: targetStage } : r);
    setRecruiters(updated);

    try {
      const res = await fetch(`/api/recruiter/${recId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_stage: targetStage })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setRecruiters(previousRecruiters);
        alert("Failed to update pipeline stage");
      } else {
        await loadData(user.id);
        if (selectedRecruiter && selectedRecruiter.id === recId) {
          setSelectedRecruiter({
            ...selectedRecruiter,
            pipeline_stage: targetStage
          });
          await refreshRecruiterDetails(recId);
        }
      }
    } catch (err) {
      console.error(err);
      setRecruiters(previousRecruiters);
    }
  };

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRecruiter) return;
    try {
      const res = await fetch("/api/recruiter/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterId: selectedRecruiter.id,
          activityType: newActivityType,
          notes: newActivityNotes
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setNewActivityNotes("");
        await refreshRecruiterDetails(selectedRecruiter.id);
        await loadData(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecruiter = async (recId: string) => {
    if (!user || !confirm("Are you sure you want to delete this recruiter profile? This will clean all activity history.")) return;
    try {
      const res = await fetch(`/api/recruiter/${recId}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSelectedRecruiter(null);
        await loadData(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await fetch("/api/recruiter/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFollow)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowFollowupModal(false);
        setNewFollow({
          recruiter_id: "",
          followup_date: "",
          message: "",
          priority: "Medium",
          reminder: true
        });
        await loadData(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteFollowup = async (followId: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/recruiter/followups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followupId: followId })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await loadData(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) return;

      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
      const parsedContacts = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ""));
        const contact: any = {};
        
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(" ", "_");
          contact[key] = values[index] || "";
        });

        parsedContacts.push({
          name: contact.name || contact.recruiter_name || contact.first_name + " " + contact.last_name || "Unknown Recruiter",
          company: contact.company || contact.organization || "Unknown Company",
          designation: contact.designation || contact.role || contact.title || "",
          department: contact.department || "",
          company_domain: contact.company_domain || "",
          recruiter_type: contact.recruiter_type || "Technical Recruiter",
          linkedin_url: contact.linkedin_url || contact.linkedin || "",
          email: contact.email || "",
          phone: contact.phone || contact.phone_number || "",
          location: contact.location || "",
          hiring_roles: contact.hiring_roles || contact.hiring_for || "",
          tags: contact.tags || "Imported"
        });
      }

      try {
        const res = await fetch("/api/recruiter/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts: parsedContacts })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          alert(`Successfully imported ${result.importedCount} contacts! Skipped ${result.skippedCount} duplicates.`);
          setShowImportModal(false);
          await loadData(user.id);
        } else {
          alert(result.message || "Failed to import contacts");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing CSV import payload.");
      }
    };
    reader.readAsText(file);
  };

  const handleOpenAIGenerator = (rec: any) => {
    setAiRecruiter(rec);
    setSelectedTemplate(templates[0] || null);
    setAiGeneratedText({ subject: "", body: "" });
    setShowAIGenerator(true);
    setAiError(null);
  };

  const handleGenerateAIMessage = async () => {
    if (!user || !aiRecruiter || !selectedTemplate) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, skills, target_role, college")
        .eq("user_id", user.id)
        .maybeSingle();

      const response = await fetch("/api/recruiter/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({
          recruiterName: aiRecruiter.name,
          company: aiRecruiter.company,
          designation: aiRecruiter.designation,
          hiringRoles: aiRecruiter.hiring_roles,
          messageType: selectedTemplate.name,
          userName: profile?.full_name || user.email?.split("@")[0] || "Applicant",
          skills: skillsOverride || profile?.skills || [],
          targetRole: roleOverride || profile?.target_role || "Software Engineer",
          college: profile?.college || "University",
          interactionHistory: recruiterActivities.map(a => a.activity_type + ": " + a.notes).join("\n")
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAiGeneratedText({
          subject: result.subject || "",
          body: result.body
        });
        
        await fetch("/api/recruiter/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recruiterId: aiRecruiter.id,
            activityType: "Message Sent",
            notes: `AI Generated Outreach drafted: '${selectedTemplate.name}'`
          })
        });
        await refreshRecruiterDetails(aiRecruiter.id);
        await loadData(user.id);
      } else {
        setAiError(result.message || "Outreach drafting failed.");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate outreach via Gemini.");
    } finally {
      setAiLoading(false);
    }
  };

  // HTML5 Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      handleUpdateStage(id, targetStage);
    }
  };

  // Dynamic Silent Recruiters computation
  const getSilentRecruiters = () => {
    const silentList: any[] = [];
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    recruiters.forEach(r => {
      if (["Connected", "Conversation Started", "Relationship Building", "Referral Requested"].includes(r.pipeline_stage)) {
        const lastDateStr = r.last_interaction || r.updated_at || r.created_at;
        if (lastDateStr) {
          const lastTime = new Date(lastDateStr).getTime();
          if (lastTime < sevenDaysAgo) {
            silentList.push({ recruiter: r, severity: "Critical", days: Math.round((Date.now() - lastTime) / (1000 * 60 * 60 * 24)) });
          } else if (lastTime < threeDaysAgo) {
            silentList.push({ recruiter: r, severity: "Warning", days: Math.round((Date.now() - lastTime) / (1000 * 60 * 60 * 24)) });
          }
        }
      }
    });
    return silentList.sort((a, b) => b.days - a.days);
  };

  // AI Networking Coach response generator simulation
  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim()) return;

    const userMessage = { sender: "user" as const, text: coachInput, date: new Date() };
    setCoachMessages(prev => [...prev, userMessage]);
    setCoachInput("");
    setCoachTyping(true);

    try {
      const response = await fetch("/api/recruiter/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("gemini_api_key") || ""
        },
        body: JSON.stringify({
          recruiterName: "Coach",
          company: "Placement OS Network Coach AI",
          messageType: "Networking Advice",
          hiringRoles: "",
          designation: "AI Placement Mentor",
          userName: user?.email?.split("@")[0] || "Student",
          skills: ["Networking", "Cold Emailing", "Referral Negotiation"],
          targetRole: coachInput,
           college: "Command Center Academy",
          interactionHistory: `Telemetry metrics: responseRate=${metrics.responseRate}%, averageRelationshipScore=${metrics.averageRelationshipScore}/100, verifiedRecs=${metrics.verifiedRecruitersCount}, suspiciousRecs=${metrics.suspiciousRecruitersCount}, highOpportunityRecsCount=${metrics.highOpportunityCount}.`
        })
      });

      const result = await response.json();
      setCoachMessages(prev => [
        ...prev,
        {
          sender: "coach",
          text: result.success ? result.body : "I recommend structuring your message to focus on common grounds, mutual project interests, and asking for general professional advice before asking for referrals directly.",
          date: new Date()
        }
      ]);
    } catch (err) {
      console.error(err);
      setCoachMessages(prev => [
        ...prev,
        {
          sender: "coach",
          text: "I analyzed your outreach telemetry. Focus on startups founders and hiring managers directly since mid-market recruiters are currently experiencing a low response rate.",
          date: new Date()
        }
      ]);
    } finally {
      setCoachTyping(false);
    }
  };

  const handleLinkApplication = async (recruiterId: string, applicationId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/recruiter/${recruiterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId || null })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Referral contact successfully linked to job application!");
        await loadData(user.id);
        if (selectedRecruiter && selectedRecruiter.id === recruiterId) {
          setSelectedRecruiter({
            ...selectedRecruiter,
            application_id: applicationId || null
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRecruiters = recruiters.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.company.toLowerCase().includes(search.toLowerCase()) || (r.designation && r.designation.toLowerCase().includes(search.toLowerCase()));
    const matchesCompany = companyFilter ? r.company === companyFilter : true;
    const matchesStage = stageFilter ? r.pipeline_stage === stageFilter : true;
    const matchesStrength = strengthFilter ? r.relationship_strength === strengthFilter : true;
    const matchesType = typeFilter ? r.recruiter_type === typeFilter : true;
    const matchesOppLevel = oppLevelFilter ? r.opportunity_level === oppLevelFilter : true;
    const matchesTrust = r.trust_score >= minTrustScore;
    return matchesSearch && matchesCompany && matchesStage && matchesStrength && matchesType && matchesOppLevel && matchesTrust;
  });

  const uniqueCompanies = Array.from(new Set(recruiters.map(r => r.company))).filter(Boolean);
  const silentRecs = getSilentRecruiters();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Breadcrumb nav header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HEADER HERO SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              Recruiter Networking OS 2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Networking Pipeline
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Turn cold applications into interviews. Validate recruiters, optimize opportunity scores, and manage referral relationships.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-grow md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-grow md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>

            <button
              onClick={() => setShowFollowupModal(true)}
              className="flex-grow md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4" />
              Add Reminder
            </button>
          </div>
        </div>

        {/* WORKSPACE TAB NAVIGATION */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px text-xs font-black uppercase tracking-wider">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "board", label: "Networking Board", icon: TrendingUp },
            { id: "directory", label: "Directory Grid", icon: Users },
            { id: "followups", label: "Follow-Up Center", icon: Clock },
            { id: "analytics", label: "Analytics & Coach", icon: Sparkles },
            { id: "opportunity", label: "Opportunity Engine", icon: Award },
            { id: "playbooks", label: "Referral Playbooks", icon: Bookmark }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-4 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-650 font-black bg-white/50 rounded-t-xl"
                  : "border-transparent text-slate-450 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* DYNAMIC TAB SEGMENTS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Syncing CRM Command Station...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* TAB 1: DASHBOARD VIEW */}
              {activeTab === "dashboard" && (
                <div className="space-y-8">
                  {/* Top Stats Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                      { label: "Total Network Size", count: metrics.totalRecruiters, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
                      { label: "Active Convs", count: metrics.activeConversations, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
                      { label: "Verified Recs", count: metrics.verifiedRecruitersCount, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
                      { label: "Referral Success", count: `${metrics.referralSuccessRate}%`, icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
                      { label: "Response Rate", count: `${metrics.responseRate}%`, icon: Activity, color: "text-teal-500", bg: "bg-teal-50" },
                      { label: "Pending Tasks", count: metrics.pendingFollowups, icon: Clock, color: "text-rose-500", bg: "bg-rose-50" }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block leading-tight">{card.label}</span>
                        <div className="flex justify-between items-end">
                          <p className="text-2xl font-black text-slate-900 leading-none">{card.count}</p>
                          <div className={cn("p-1.5 rounded-lg absolute bottom-4 right-4", card.bg)}>
                            <card.icon className={cn("w-4 h-4", card.color)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Funnel Progress & Insights Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Funnel Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-7 space-y-6">
                      <div>
                        <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-indigo-500" />
                          Outreach Funnel Progress
                        </h3>
                        <p className="text-xs text-slate-400 font-bold mt-1">Telemetry stages of all networking contacts.</p>
                      </div>

                      {metrics.funnel.length === 0 ? (
                        <div className="bg-slate-50 p-8 rounded-3xl text-center text-slate-400 text-xs font-semibold">
                          No pipeline data available. Add recruiters to start.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {metrics.funnel.map((step, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-500 font-black">{idx + 1}</span>
                                  {step.stage}
                                </span>
                                <span className="font-black text-slate-800">{step.count} ({step.percentage}%)</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full" style={{ width: `${step.percentage}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Insights & Threat Monitoring */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Suspicious Alert Section */}
                      {metrics.suspiciousRecruitersCount > 0 && (
                        <div className="bg-rose-50 border border-rose-250 p-6 rounded-[2rem] shadow-sm flex items-start gap-4">
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide leading-none">Security Flag Alerts</h4>
                            <p className="text-xs text-rose-800/80 font-bold leading-normal">
                              We detected <strong>{metrics.suspiciousRecruitersCount} suspicious/unverified</strong> profiles. Take caution before providing sensitive details.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Strategy Insights card */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                            AI Coach Strategist
                          </h3>
                          <p className="text-xs text-slate-400 font-bold mt-1">Correlation statistics compiled dynamically from response rates.</p>
                        </div>

                        {metrics.insights.length === 0 ? (
                          <div className="bg-slate-50 p-6 rounded-3xl text-center text-slate-400 text-xs font-semibold">
                            Outreach observations will be compiled here as contacts respond.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {metrics.insights.map((ins, idx) => (
                              <div key={idx} className="flex gap-3 items-start p-4.5 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl">
                                <Info className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold text-slate-750 leading-relaxed">{ins}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KANBAN BOARD */}
              {activeTab === "board" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-1 select-none">
                    <p className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Drag and drop recruiter cards between pipeline stages to update relationship stages instantly.</p>
                  </div>
                  
                  {/* Pipeline columns wrapper */}
                  <div className="flex gap-4 overflow-x-auto pb-6 min-h-[550px] select-none text-left items-start">
                    {PIPELINE_STAGES.map(stage => {
                      const stageRecs = recruiters.filter(r => r.pipeline_stage === stage);
                      return (
                        <div
                          key={stage}
                          onDragOver={onDragOver}
                          onDrop={(e) => onDrop(e, stage)}
                          className="bg-white border border-slate-200 rounded-[2.5rem] p-4 min-w-[290px] max-w-[290px] shrink-0 space-y-4 shadow-sm min-h-[500px]"
                        >
                          {/* Stage Header */}
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border", STAGE_COLORS[stage])}>
                              {stage}
                            </span>
                            <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{stageRecs.length}</span>
                          </div>

                          {/* Cards box */}
                          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                            {stageRecs.map(rec => (
                              <div
                                key={rec.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, rec.id)}
                                onClick={() => handleSelectRecruiter(rec)}
                                className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all space-y-3 relative group"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.company}</span>
                                    <span className={cn("px-1.5 py-0.2 text-[7px] font-black uppercase rounded border", 
                                      rec.verification_status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      rec.verification_status === "Likely Genuine" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      rec.verification_status === "Suspicious" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                      "bg-zinc-800 text-zinc-150 border-zinc-900"
                                    )}>
                                      {rec.verification_status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <h4 className="text-xs font-black text-slate-900 truncate">{rec.name}</h4>
                                    {rec.verification_status === "Verified" && (
                                      <Check className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                                    )}
                                  </div>
                                  {rec.designation && <p className="text-[9px] text-slate-500 font-bold truncate">{rec.designation}</p>}
                                </div>

                                <div className="flex justify-between items-center text-[9px] font-black text-slate-650 bg-white px-2.5 py-1.5 border border-slate-200/55 rounded-xl">
                                  <div className="flex justify-between w-full">
                                    <span>Relationship: <strong className="text-indigo-650">{rec.relationshipScore ?? getInfluenceScore(rec)}/100</strong></span>
                                    <span>Opp Score: <strong className="text-amber-600">{rec.opportunity_score}</strong></span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {stageRecs.length === 0 && (
                              <div className="py-14 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Drop Leads Here</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: DIRECTORY SPREADSHEET */}
              {activeTab === "directory" && (
                <div className="space-y-6">
                  {/* Search and Advanced Filters */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search name, company, notes..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Recruiter Type Filter */}
                      <div>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                        >
                          <option value="">-- All Recruiter Types --</option>
                          {["Technical Recruiter", "Campus Recruiter", "Talent Acquisition", "Hiring Manager", "Engineering Manager", "HR Partner", "Founder", "Startup Recruiter"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Opportunity Level Filter */}
                      <div>
                        <select
                          value={oppLevelFilter}
                          onChange={(e) => setOppLevelFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                        >
                          <option value="">-- All Opportunity Levels --</option>
                          {["High Opportunity", "Medium Opportunity", "Low Opportunity"].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pipeline Stage Filter */}
                      <div>
                        <select
                          value={stageFilter}
                          onChange={(e) => setStageFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                        >
                          <option value="">-- All Stages --</option>
                          {PIPELINE_STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 border-t border-slate-100 flex-wrap">
                      <div className="flex gap-4 items-center flex-wrap">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-650 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={verifiedOnly}
                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                          />
                          Verified Corporate Email Only
                        </label>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
                          <span>Min Trust Score:</span>
                          <input
                            type="range"
                            min="0"
                            max="90"
                            step="10"
                            value={minTrustScore}
                            onChange={(e) => setMinTrustScore(Number(e.target.value))}
                            className="w-24 accent-indigo-650 h-1 bg-slate-100 rounded-lg cursor-pointer"
                          />
                          <span className="text-indigo-650 font-extrabold">{minTrustScore}%+</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
                        <span>Sort:</span>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                          className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none text-slate-750"
                        >
                          <option value="created_at">Date Added</option>
                          <option value="name">Name</option>
                          <option value="company">Company</option>
                          <option value="trust_score">Trust Score</option>
                          <option value="opportunity_score">Opportunity Score</option>
                        </select>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none text-slate-750"
                        >
                          <option value="desc">Descending</option>
                          <option value="asc">Ascending</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Spreadsheet Grid */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4">Name & Contact</th>
                            <th className="px-6 py-4">Company & Type</th>
                            <th className="px-6 py-4">Pipeline Stage</th>
                            <th className="px-6 py-4 text-center">Verification Trust</th>
                            <th className="px-6 py-4 text-center">Opportunity Index</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {filteredRecruiters.map(rec => (
                            <tr
                              key={rec.id}
                              onClick={() => handleSelectRecruiter(rec)}
                              className="hover:bg-slate-50/50 cursor-pointer transition-all"
                            >
                              <td className="px-6 py-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-slate-800 text-sm">{rec.name}</span>
                                    {rec.verification_status === "Verified" && (
                                      <Check className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                                    )}
                                  </div>
                                  {rec.email && <span className="text-[10px] text-slate-400 font-semibold block">{rec.email}</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-0.5">
                                  <span className="font-black text-slate-700 block">{rec.company}</span>
                                  <span className="text-[10px] text-slate-450 font-bold block">{rec.recruiter_type} {rec.department ? `(${rec.department})` : ""}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border", STAGE_COLORS[rec.pipeline_stage] || "bg-slate-100 text-slate-600 border-slate-200")}>
                                  {rec.pipeline_stage}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-black text-indigo-650">{rec.trust_score}%</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.verification_status}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-black text-slate-900">{rec.opportunity_score}/100</span>
                                  <span className={cn("px-1.5 py-0.2 rounded text-[7px] font-black uppercase mt-0.5 border", OPPORTUNITY_LEVEL_COLORS[rec.opportunity_level])}>
                                    {rec.opportunity_level}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenAIGenerator(rec)}
                                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecruiter(rec.id)}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FOLLOW-UP CENTER */}
              {activeTab === "followups" && (
                <div className="space-y-8">
                  {/* Silent Recruiter Alerts */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-500" />
                        Silent Recruiter Alerts
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Recruiters who have not responded to active communications after 3 or 7 days.</p>
                    </div>

                    {silentRecs.length === 0 ? (
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="text-sm font-black text-slate-900">All Threads Active</h4>
                        <p className="text-xs text-slate-500">You don't have any silent recruiter threads exceeding follow-up parameters. Excellent networking hygiene!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {silentRecs.map(({ recruiter: rec, severity, days }) => (
                          <div
                            key={rec.id}
                            className={cn(
                              "p-5 rounded-[2rem] border shadow-sm flex flex-col justify-between gap-4 transition-all text-left",
                              severity === "Critical" ? "bg-rose-50/50 border-rose-200" : "bg-orange-50/40 border-orange-200"
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.company}</span>
                                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    {rec.name}
                                    <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded", severity === "Critical" ? "bg-rose-100 text-rose-700" : "bg-orange-100 text-orange-700")}>
                                      {severity === "Critical" ? "Critical Silence" : "Needs Follow-up"}
                                    </span>
                                  </h4>
                                </div>
                                <span className="text-xs font-black text-slate-500 bg-white border px-2.5 py-1 rounded-xl">
                                  {days} Days Silent
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-bold leading-normal">
                                Last communication on stage <strong>{rec.pipeline_stage}</strong>. Recommended play: draft a gentle follow-up email.
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenAIGenerator(rec)}
                                className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Draft Follow-up
                              </button>
                              <button
                                onClick={() => handleSelectRecruiter(rec)}
                                className="px-4 py-2 bg-white hover:bg-slate-50 border text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                              >
                                Log Reply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Tasks checklist */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Reminders & Networking Tasks
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Checklist of active follow-up tasks scheduled manually or created automatically.</p>
                    </div>

                    {followups.length === 0 ? (
                      <div className="bg-slate-100 p-8 rounded-3xl text-center text-slate-400 text-xs font-semibold max-w-sm mx-auto">
                        No pending task reminders. Set one from the action center button.
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
                        <div className="divide-y divide-slate-150">
                          {followups.map(f => {
                            const recName = recruiters.find(r => r.id === f.recruiter_id)?.name || "Recruiter";
                            const company = recruiters.find(r => r.id === f.recruiter_id)?.company || "Company";
                            return (
                              <div key={f.id} className="p-4 flex items-center justify-between gap-4 text-xs font-semibold text-slate-650 hover:bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleCompleteFollowup(f.id)}
                                    className="w-5 h-5 border border-slate-300 rounded-md hover:bg-emerald-50 hover:border-emerald-500 flex items-center justify-center group cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-600" />
                                  </button>
                                  <div className="space-y-0.5">
                                    <span className="font-black text-slate-850 block">{f.message || "Follow up on email thread"}</span>
                                    <span className="text-[10px] text-slate-450 font-bold block">Target: {recName} at {company}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase rounded", 
                                    f.priority === "Critical" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                    f.priority === "High" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                                    f.priority === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {f.priority}
                                  </span>
                                  <span className="text-[10px] text-slate-450 font-bold font-mono">
                                    {new Date(f.followup_date).toLocaleDateString("en-US", { dateStyle: "short" })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ANALYTICS & COACH */}
              {activeTab === "analytics" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Response rate statistics */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Activity level bar chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-4 h-4 text-indigo-500" /> Outreach Volume History</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Monthly frequency logs of logged interactions.</p>
                      </div>

                      {metrics.monthlyActivities.length === 0 ? (
                        <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-400 text-xs">Awaiting activity logs.</div>
                      ) : (
                        <div className="flex items-end justify-between h-40 pt-4 px-2">
                          {metrics.monthlyActivities.map((m, idx) => {
                            const maxVal = Math.max(...metrics.monthlyActivities.map(x => x.count), 1);
                            const heightPct = Math.round((m.count / maxVal) * 100);
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 group w-full">
                                <span className="text-[10px] font-black text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">{m.count}</span>
                                <div className="w-8 bg-gradient-to-t from-indigo-500 to-indigo-650 rounded-lg group-hover:opacity-85 transition-all shadow-sm" style={{ height: `${Math.max(5, heightPct * 1.1)}px` }} />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{m.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Breakdown by recruiter type */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> Conversion By Recruiter Role</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Outreach response rates grouped by title category.</p>
                      </div>

                      <div className="space-y-4">
                        {metrics.successRateByType.map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{item.type} ({item.count} profiles)</span>
                              <span className="font-black">{item.successRate}% Response</span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-550 rounded-full" style={{ width: `${item.successRate}%` }} />
                            </div>
                          </div>
                        ))}
                        {metrics.successRateByType.length === 0 && (
                          <p className="text-xs text-slate-400 font-bold text-center py-6">Log contacts to compile role metrics.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Coaching Chatbox */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md lg:col-span-6 flex flex-col justify-between min-h-[500px]">
                    <div className="space-y-4 flex-grow overflow-hidden">
                      <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider block">Placement Coaching Agent</h4>
                            <span className="text-[8px] font-bold text-emerald-500 block uppercase tracking-widest">Active & Telemetry Aware</span>
                          </div>
                        </div>
                      </div>

                      {/* Chat messages */}
                      <div className="h-[300px] overflow-y-auto pr-1 space-y-3.5">
                        {coachMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex gap-2 text-xs font-semibold leading-relaxed max-w-[85%] rounded-2xl p-3.5",
                              msg.sender === "coach"
                                ? "bg-slate-50 border border-slate-200 text-slate-750 self-start mr-auto text-left"
                                : "bg-indigo-600 text-white self-end ml-auto text-left"
                            )}
                          >
                            <p>{msg.text}</p>
                          </div>
                        ))}
                        {coachTyping && (
                          <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-2xl p-3 w-20 text-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pre-prompt options */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 mb-3 text-left">
                      {[
                        "Draft follow-up template",
                        "Best networking script",
                        "Analyze my metrics",
                        "Referral request body"
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCoachInput(preset)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/65 text-[9px] font-black text-slate-750 uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleCoachSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask the AI Coach a question..."
                        value={coachInput}
                        onChange={e => setCoachInput(e.target.value)}
                        className="flex-grow px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: OPPORTUNITY MATRIX */}
              {activeTab === "opportunity" && (
                <div className="space-y-6">
                  {/* Opportunity lists matrix */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-500" />
                        Opportunity Success Matrix
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Opportunities ranked by recruiter response scores, company categories, and referrals.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4">Opportunity Profile</th>
                            <th className="px-6 py-4 text-center">Score Index</th>
                            <th className="px-6 py-4 text-center">Referrals (Sent/Acc/Rej)</th>
                            <th className="px-6 py-4 text-center">Interviews & Offers</th>
                            <th className="px-6 py-4 text-center">Linked Job Application</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {recruiters
                            .sort((a, b) => b.opportunity_score - a.opportunity_score)
                            .map(rec => {
                              const linkedApp = applications.find(a => a.id === rec.application_id);
                              return (
                                <tr key={rec.id} className="hover:bg-slate-50/50">
                                  <td className="px-6 py-4">
                                    <div className="space-y-0.5">
                                      <span className="font-black text-slate-800 block text-sm">{rec.name}</span>
                                      <span className="text-[10px] text-slate-450 block">{rec.company} • {rec.recruiter_type}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-black text-slate-900 text-sm">{rec.opportunity_score}/100</span>
                                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase mt-0.5 border", OPPORTUNITY_LEVEL_COLORS[rec.opportunity_level])}>
                                        {rec.opportunity_level}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center text-slate-800">
                                    <span className="text-indigo-650 font-bold">{rec.referral_sent_count || 0}</span>
                                    <span className="text-slate-400 px-1">/</span>
                                    <span className="text-emerald-600 font-bold">{rec.referral_accepted_count || 0}</span>
                                    <span className="text-slate-400 px-1">/</span>
                                    <span className="text-rose-600 font-bold">{rec.referral_rejected_count || 0}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="inline-flex gap-4">
                                      <span>Ints: <strong className="text-slate-800">{rec.interview_count || 0}</strong></span>
                                      <span>Offers: <strong className="text-emerald-600">{rec.offer_count || 0}</strong></span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {linkedApp ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="px-2 py-1 bg-indigo-50 border border-indigo-150 text-indigo-750 rounded-lg text-[10px] font-bold">
                                          {linkedApp.role}
                                        </span>
                                        <button
                                          onClick={() => handleLinkApplication(rec.id, "")}
                                          className="text-rose-600 hover:text-rose-800 font-black cursor-pointer text-[10px] uppercase"
                                        >
                                          Unlink
                                        </button>
                                      </div>
                                    ) : (
                                      <select
                                        onChange={(e) => handleLinkApplication(rec.id, e.target.value)}
                                        value=""
                                        className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none text-slate-700 cursor-pointer"
                                      >
                                        <option value="">-- Match Application --</option>
                                        {applications.map(app => (
                                          <option key={app.id} value={app.id}>{app.role} at {app.companyName}</option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => handleSelectRecruiter(rec)}
                                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PLAYBOOKS */}
              {activeTab === "playbooks" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map(t => (
                      <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between gap-4 text-left">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-150 text-indigo-750 text-[9px] font-black uppercase rounded-lg">
                              {t.type} Playbook
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GEMINI TEMPLATE</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-850">{t.name}</h4>
                          <div className="p-3.5 bg-slate-50 border rounded-xl text-xs text-slate-500 font-bold whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto">
                            {t.body}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setNewRec(prev => ({
                              ...prev,
                              notes: `Preferred outreach: ${t.name}`
                            }));
                            alert(`Playbook "${t.name}" loaded into quick outreach draft settings. Click "Add Contact" to test.`);
                          }}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Apply Playbook
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* DYNAMIC RECRUITER DETAIL DRAWER */}
      <AnimatePresence>
        {selectedRecruiter && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-end print:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-lg h-full flex flex-col justify-between overflow-hidden relative"
            >
              {/* Header Info */}
              <div className="p-6 border-b border-slate-100 space-y-4 text-left">
                <button
                  onClick={() => setSelectedRecruiter(null)}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">{selectedRecruiter.company}</span>
                    {selectedRecruiter.verification_status === "Verified" && (
                      <Check className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedRecruiter.name}</h3>
                  {selectedRecruiter.designation && <p className="text-xs text-slate-500 font-bold">{selectedRecruiter.designation}</p>}
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase rounded-md border", STAGE_COLORS[selectedRecruiter.pipeline_stage])}>
                    {selectedRecruiter.pipeline_stage}
                  </span>
                  <span className={cn("px-2 py-1 text-[9px] font-black uppercase rounded-md", STRENGTH_COLORS[selectedRecruiter.relationship_strength] || "bg-slate-100")}>
                    {selectedRecruiter.relationship_strength}
                  </span>
                  <span className="px-2 py-1 text-[9px] font-black bg-indigo-50 text-indigo-755 border border-indigo-150 rounded-md">
                    Trust: {selectedRecruiter.trust_score}%
                  </span>
                  <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase border", OPPORTUNITY_LEVEL_COLORS[selectedRecruiter.opportunity_level])}>
                    {selectedRecruiter.opportunity_level}
                  </span>
                </div>
              </div>

              {/* Drawer Tab Selection */}
              <div className="flex border-b border-slate-100 text-[10px] font-black uppercase tracking-wider shrink-0 bg-slate-50/50">
                {[
                  { id: "activities", label: "Activities" },
                  { id: "verification", label: "Verification" },
                  { id: "rate_report", label: "Rate & Report" },
                  { id: "edit_profile", label: "Edit Profile" }
                ].map(dTab => (
                  <button
                    key={dTab.id}
                    type="button"
                    onClick={() => setDrawerTab(dTab.id as any)}
                    className={cn(
                      "flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all",
                      drawerTab === dTab.id
                        ? "border-indigo-650 text-indigo-650 bg-white"
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    )}
                  >
                    {dTab.label}
                  </button>
                ))}
              </div>

              {/* Detail drawer scrollbox */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
                {drawerTab === "activities" && (
                  <div className="space-y-6">
                    {/* Contacts info */}
                    <div className="space-y-2 text-xs font-semibold text-slate-750">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Contact Coordinates</span>
                      {selectedRecruiter.linkedin_url && (
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Link2 className="w-4 h-4 text-slate-400" />
                          <a href={selectedRecruiter.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-black hover:underline truncate">LinkedIn Profile URL</a>
                        </div>
                      )}
                      {selectedRecruiter.email && (
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{selectedRecruiter.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Bio & tags */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Relationship Bio & Tags</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 text-xs italic">
                        {selectedRecruiter.notes || "No candidate notes logged."}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedRecruiter.tags && selectedRecruiter.tags.map((t: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Pipeline transition */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Stage Pipeline Transition</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PIPELINE_STAGES.map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStage(selectedRecruiter.id, st)}
                            className={cn(
                              "px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg border cursor-pointer transition-all",
                              selectedRecruiter.pipeline_stage === st
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                            )}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Log Outreach activity form */}
                    <form onSubmit={handleAddActivitySubmit} className="space-y-3 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block font-sans">Log Connection Activity</span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Message Sent", "Reply Received", "Meeting Scheduled", "Referral Submitted"].map(act => (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setNewActivityType(act)}
                            className={cn(
                              "px-3 py-2 text-[10px] font-black uppercase rounded-xl border text-center cursor-pointer transition-all",
                              newActivityType === act
                                ? "bg-indigo-50 border-indigo-250 text-indigo-700"
                                : "bg-slate-50 border-slate-200 text-slate-650"
                            )}
                          >
                            {act}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Log detail notes (e.g. details of reply message)..."
                        value={newActivityNotes}
                        onChange={e => setNewActivityNotes(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Log Activity Timeline
                      </button>
                    </form>

                    {/* Timeline items list */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Outreach Timeline Logs</span>
                      {recruiterActivities.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">No activity logged.</p>
                      ) : (
                        <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-150">
                          {recruiterActivities.map(act => (
                            <div key={act.id} className="flex gap-4 items-start pl-6 relative">
                              <div className="w-2 h-2 rounded-full bg-indigo-550 absolute left-2 top-2 border border-white" />
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-850 uppercase block">{act.activity_type}</span>
                                {act.notes && <p className="text-xs text-slate-500 font-bold">{act.notes}</p>}
                                <span className="text-[8px] font-bold text-slate-400">{new Date(act.created_at).toLocaleDateString("en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {drawerTab === "verification" && (
                  <div className="space-y-6">
                    {/* CORPORATE EMAIL VERIFICATION */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Corporate Email Verification</h4>
                      </div>
                      
                      {selectedRecruiter.email_verified || selectedRecruiter.verification?.email_verified ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Corporate Domain Email Verified</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder="e.g. recruiter@company.com"
                              value={verificationEmail}
                              onChange={e => setVerificationEmail(e.target.value)}
                              className="flex-grow px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading || !verificationEmail}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                              {otpLoading ? "Sending..." : "Send OTP"}
                            </button>
                          </div>

                          {otpSent && (
                            <div className="space-y-2 border-t border-slate-250/65 pt-3">
                              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Enter 6-Digit OTP</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="123456"
                                  maxLength={6}
                                  value={verificationOtp}
                                  onChange={e => setVerificationOtp(e.target.value)}
                                  className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black tracking-widest focus:outline-none text-slate-800 text-center"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                  Verify OTP
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* LINKEDIN SCANNER */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-blue-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">LinkedIn Verification Scan</h4>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/recruiter-profile"
                          value={linkedinUrlInput}
                          onChange={e => setLinkedinUrlInput(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleLinkedinValidate}
                          disabled={!linkedinUrlInput}
                          className="w-full py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                          Check LinkedIn Authenticity Heuristics
                        </button>
                      </div>
                    </div>

                    {/* MANUAL DOCUMENT SUBMISSION */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Official Document Verification</h4>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Document URL (ID Card, employee validation)"
                          value={docUrlInput}
                          onChange={e => setDocUrlInput(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleDocumentSubmit}
                          disabled={!docUrlInput}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                          Submit For Admin Manual Validation
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === "rate_report" && (
                  <div className="space-y-6">
                    {/* RATING FORM */}
                    <form onSubmit={handleRatingSubmit} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Rate Recruiter Interaction</h4>
                      </div>

                      <div className="space-y-3">
                        {[
                          { label: "Professionalism", value: professionalism, setter: setProfessionalism },
                          { label: "Response Speed", value: responseTime, setter: setResponseTime },
                          { label: "Helpfulness", value: helpfulness, setter: setHelpfulness },
                          { label: "Referral Conversion", value: referralQuality, setter: setReferralQuality },
                          { label: "Communication Integrity", value: communication, setter: setCommunication }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span>{item.label}:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={item.value}
                                onChange={e => item.setter(Number(e.target.value))}
                                className="w-20 accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-amber-600 text-xs font-black">{item.value} ★</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <textarea
                        placeholder="Write detailed interaction review notes..."
                        value={ratingFeedback}
                        onChange={e => setRatingFeedback(e.target.value)}
                        className="w-full h-16 p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 resize-none"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Submit Feedback Review
                      </button>
                    </form>

                    {/* REPORT SPAM/SCAM FORM */}
                    <form onSubmit={handleReportSubmit} className="p-5 bg-red-50/50 border border-red-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <h4 className="text-xs font-black text-rose-955 uppercase tracking-wider">Report Fake/Scam Profile</h4>
                      </div>

                      <div className="space-y-3">
                        <select
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-red-200/60 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        >
                          <option value="Fake Recruiter">Fake Recruiter Profile / Identity Theft</option>
                          <option value="Scam Postings">Scam Job Postings</option>
                          <option value="Extortion/Money Request">Charging Money for Placements/Referrals</option>
                          <option value="Spam/Harassment">Spam Outreach or Harassment</option>
                          <option value="Other">Other Violations</option>
                        </select>

                        <textarea
                          required
                          placeholder="Paste conversation logs or detail scam behavior evidence..."
                          value={reportEvidence}
                          onChange={e => setReportEvidence(e.target.value)}
                          className="w-full h-16 p-2 bg-white border border-red-250/65 rounded-xl text-xs font-semibold focus:outline-none text-slate-850 resize-none"
                        />

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-rose-650 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Submit Threat Report
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {drawerTab === "edit_profile" && (
                  <form onSubmit={handleSaveEditProfile} className="space-y-4">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block font-sans">Modify Profile Metrics</span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name *</label>
                        <input
                          required
                          type="text"
                          value={editRecName}
                          onChange={e => setEditRecName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company *</label>
                        <input
                          required
                          type="text"
                          value={editRecCompany}
                          onChange={e => setEditRecCompany(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                        <input
                          type="text"
                          value={editRecDesignation}
                          onChange={e => setEditRecDesignation(e.target.value)}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                        <input
                          type="text"
                          value={editRecDept}
                          onChange={e => setEditRecDept(e.target.value)}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Domain</label>
                        <input
                          type="text"
                          placeholder="company.com"
                          value={editRecDomain}
                          onChange={e => setEditRecDomain(e.target.value)}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recruiter Type</label>
                        <select
                          value={editRecType}
                          onChange={e => setEditRecType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                        >
                          {["Technical Recruiter", "Campus Recruiter", "Talent Acquisition", "Hiring Manager", "Engineering Manager", "HR Partner", "Founder", "Startup Recruiter"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                        <input
                          type="text"
                          value={editRecLocation}
                          onChange={e => setEditRecLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                        <input
                          type="email"
                          value={editRecEmail}
                          onChange={e => setEditRecEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          value={editRecLinkedin}
                          onChange={e => setEditRecLinkedin(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pipeline Stage</label>
                        <select
                          value={editRecStage}
                          onChange={e => setEditRecStage(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        >
                          {PIPELINE_STAGES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship Strength</label>
                        <select
                          value={editRecStrength}
                          onChange={e => setEditRecStrength(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        >
                          {["Cold", "Connected", "Messaged", "Responded", "Referral Possible", "Strong Connection"].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trust Score (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editRecTrust}
                          onChange={e => setEditRecTrust(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Status</label>
                        <select
                          value={editRecStatus}
                          onChange={e => setEditRecStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        >
                          {["Verified", "Likely Genuine", "Suspicious", "Potential Scam"].map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referrals Sent</label>
                        <input
                          type="number"
                          min="0"
                          value={editRecRefSent}
                          onChange={e => setEditRecRefSent(Number(e.target.value))}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referrals Accepted</label>
                        <input
                          type="number"
                          min="0"
                          value={editRecRefAcc}
                          onChange={e => setEditRecRefAcc(Number(e.target.value))}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referrals Rejected</label>
                        <input
                          type="number"
                          min="0"
                          value={editRecRefRej}
                          onChange={e => setEditRecRefRej(Number(e.target.value))}
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interviews Count</label>
                        <input
                          type="number"
                          min="0"
                          value={editRecIntCount}
                          onChange={e => setEditRecIntCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Offers Count</label>
                        <input
                          type="number"
                          min="0"
                          value={editRecOffCount}
                          onChange={e => setEditRecOffCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={editRecTags}
                        onChange={e => setEditRecTags(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bio & Notes</label>
                      <textarea
                        value={editRecNotes}
                        onChange={e => setEditRecNotes(e.target.value)}
                        className="w-full h-20 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-805 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Save Profile Changes
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => handleOpenAIGenerator(selectedRecruiter)}
                  className="flex-grow py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Outreach draft
                </button>
                <button
                  onClick={() => handleDeleteRecruiter(selectedRecruiter.id)}
                  className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD CONTACT */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-lg w-full text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleAddRecruiterSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">New Recruiter Profile</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block font-sans">Log a new networking contact details profile.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Jane Doe"
                      value={newRec.name}
                      onChange={(e) => setNewRec({ ...newRec, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company *</label>
                    <input
                      required
                      type="text"
                      placeholder="Google"
                      value={newRec.company}
                      onChange={(e) => setNewRec({ ...newRec, company: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                    <input
                      type="text"
                      placeholder="University Recruiter"
                      value={newRec.designation}
                      onChange={(e) => setNewRec({ ...newRec, designation: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                    <input
                      type="text"
                      placeholder="University Hiring"
                      value={newRec.department}
                      onChange={(e) => setNewRec({ ...newRec, department: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Domain</label>
                    <input
                      type="text"
                      placeholder="google.com"
                      value={newRec.company_domain}
                      onChange={(e) => setNewRec({ ...newRec, company_domain: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recruiter Type</label>
                    <select
                      value={newRec.recruiter_type}
                      onChange={(e) => setNewRec({ ...newRec, recruiter_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                    >
                      {["Technical Recruiter", "Campus Recruiter", "Talent Acquisition", "Hiring Manager", "Engineering Manager", "HR Partner", "Founder", "Startup Recruiter"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      value={newRec.location}
                      onChange={(e) => setNewRec({ ...newRec, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="jane@google.com"
                      value={newRec.email}
                      onChange={(e) => setNewRec({ ...newRec, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LinkedIn URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={newRec.linkedin_url}
                      onChange={(e) => setNewRec({ ...newRec, linkedin_url: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hiring Roles (hiring for)</label>
                  <input
                    type="text"
                    placeholder="SDE Intern, Cloud Engineer"
                    value={newRec.hiring_roles}
                    onChange={(e) => setNewRec({ ...newRec, hiring_roles: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pipeline Stage</label>
                    <select
                      value={newRec.pipeline_stage}
                      onChange={(e: any) => setNewRec({ ...newRec, pipeline_stage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                    >
                      {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship Status</label>
                    <select
                      value={newRec.relationship_strength}
                      onChange={(e: any) => setNewRec({ ...newRec, relationship_strength: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                    >
                      {["Cold", "Connected", "Messaged", "Responded", "Referral Possible", "Strong Connection"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Tech, Google, FAANG"
                    value={newRec.tagsString}
                    onChange={(e) => setNewRec({ ...newRec, tagsString: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bio Notes</label>
                  <textarea
                    placeholder="Enter notes about interactions..."
                    value={newRec.notes}
                    onChange={(e) => setNewRec({ ...newRec, notes: e.target.value })}
                    className="w-full h-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Create Recruiter Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SCHEDULE REMINDER */}
      <AnimatePresence>
        {showFollowupModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-sm w-full text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowFollowupModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleAddFollowupSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">Schedule Task</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Set follow-up reminders.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Recruiter *</label>
                  <select
                    required
                    value={newFollow.recruiter_id}
                    onChange={(e) => setNewFollow({ ...newFollow, recruiter_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Choose Recruiter --</option>
                    {recruiters.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.company})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Follow-up Date *</label>
                  <input
                    required
                    type="date"
                    value={newFollow.followup_date}
                    onChange={(e) => setNewFollow({ ...newFollow, followup_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={newFollow.priority}
                    onChange={(e: any) => setNewFollow({ ...newFollow, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
                  >
                    {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Message Reminder Alert</label>
                  <input
                    type="text"
                    placeholder="Check referral request, follow up email..."
                    value={newFollow.message}
                    onChange={(e) => setNewFollow({ ...newFollow, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 text-left">
                  <input
                    type="checkbox"
                    id="reminderCheckbox"
                    checked={newFollow.reminder}
                    onChange={(e) => setNewFollow({ ...newFollow, reminder: e.target.checked })}
                    className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-550 cursor-pointer"
                  />
                  <label htmlFor="reminderCheckbox" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">Activate email notification reminders</label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Schedule Reminder Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CSV IMPORT */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-sm w-full text-left relative overflow-hidden space-y-6"
            >
              <button
                onClick={() => setShowImportModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">Bulk Import</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Injest sheets or LinkedIn export CSV files.</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl text-[10px] font-bold text-slate-650 leading-relaxed">
                CSV files must contain headers: <strong>name, company</strong>. Optional column headers include: <em>designation, linkedin_url, email, phone, location, hiring_roles, tags</em>.
              </div>

              <div className="border border-dashed border-slate-250 rounded-2xl p-6 text-center hover:bg-slate-50 transition-all relative cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-slate-450 mx-auto mb-2" />
                <span className="text-xs font-black text-slate-700 block">Select CSV file</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Google Sheets / Excel / LinkedIn</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIDEBAR DRAWER: AI OUTREACH MESSAGE GENERATOR */}
      <AnimatePresence>
        {showAIGenerator && aiRecruiter && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end print:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-lg h-full flex flex-col justify-between overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 text-left">
                <button
                  onClick={() => setShowAIGenerator(false)}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">AI Outreach Generator</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Draft messages tailored for {aiRecruiter.name}.</p>
                  </div>
                </div>
              </div>

              {/* Console fields */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
                
                {/* Message selection */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Choose Outreach Script Strategy</span>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={cn(
                          "px-3 py-2.5 text-[10px] font-black uppercase rounded-xl border text-center cursor-pointer transition-all",
                          selectedTemplate?.id === t.id
                            ? "bg-indigo-50 border-indigo-250 text-indigo-700"
                            : "bg-slate-50 border-slate-200 text-slate-650"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overrides parameters */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Tech Skills</label>
                    <input
                      type="text"
                      placeholder="React, Python, AWS"
                      value={skillsOverride}
                      onChange={e => setSkillsOverride(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-805"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Target Role</label>
                    <input
                      type="text"
                      placeholder="Full Stack Developer"
                      value={roleOverride}
                      onChange={e => setRoleOverride(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-805"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateAIMessage}
                  disabled={aiLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Outreach Message</span>
                </button>

                {aiError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-650 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* Draft Results */}
                {aiGeneratedText.body && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    {aiGeneratedText.subject && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Outreach Subject</span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800">
                          {aiGeneratedText.subject}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block font-sans">Generated Body Context</span>
                      <textarea
                        readOnly
                        value={aiGeneratedText.body}
                        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-705 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiGeneratedText.body);
                        alert("Message copied to clipboard!");
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copy Outreach Draft
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
