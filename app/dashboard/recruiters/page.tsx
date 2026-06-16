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
  Archive,
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
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Recruiter, RecruiterActivity, RecruiterFollowup, RecruiterTemplate } from "@/lib/db/recruiters";

const PIPELINE_STAGES = [
  "Lead Found",
  "Connection Sent",
  "Connected",
  "Conversation Started",
  "Follow Up",
  "Referral Requested",
  "Referral Received",
  "Interview Opportunity",
  "Hired",
  "Lost"
];

const STAGE_COLORS: Record<string, string> = {
  "Lead Found": "bg-slate-100 text-slate-700 border-slate-200",
  "Connection Sent": "bg-blue-50 text-blue-700 border-blue-100",
  "Connected": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Conversation Started": "bg-purple-50 text-purple-700 border-purple-100",
  "Follow Up": "bg-pink-50 text-pink-700 border-pink-100",
  "Referral Requested": "bg-orange-50 text-orange-700 border-orange-100",
  "Referral Received": "bg-teal-50 text-teal-700 border-teal-100",
  "Interview Opportunity": "bg-amber-50 text-amber-700 border-amber-100",
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

export default function RecruitersCRMPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [followups, setFollowups] = useState<RecruiterFollowup[]>([]);
  const [templates, setTemplates] = useState<RecruiterTemplate[]>([]);
  
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
    averageRelationshipScore: 0
  });

  // Search, Filter, Sort States
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [strengthFilter, setStrengthFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentView, setCurrentView] = useState<"pipeline" | "list">("pipeline");

  // Selected Recruiter Drawer/Detail states
  const [selectedRecruiter, setSelectedRecruiter] = useState<any | null>(null);
  const [recruiterActivities, setRecruiterActivities] = useState<RecruiterActivity[]>([]);
  const [newActivityType, setNewActivityType] = useState("Message Sent");
  const [newActivityNotes, setNewActivityNotes] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // New Recruiter Form states
  const [newRec, setNewRec] = useState({
    name: "",
    company: "",
    designation: "",
    linkedin_url: "",
    email: "",
    phone: "",
    location: "",
    hiring_roles: "",
    relationship_strength: "Cold" as Recruiter["relationship_strength"],
    pipeline_stage: "Lead Found" as Recruiter["pipeline_stage"],
    notes: "",
    tagsString: ""
  });

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

  // Recruiter Verification & Reputation States
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [minReputationScore, setMinReputationScore] = useState(0);
  const [drawerTab, setDrawerTab] = useState<"activities" | "verification" | "rate_report">("activities");

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
      if (minReputationScore > 0) queryParams.set("minReputationScore", minReputationScore.toString());
      queryParams.set("sortField", sortField);
      queryParams.set("sortOrder", sortOrder);

      const recRes = await fetch(`/api/recruiter?${queryParams.toString()}`);
      if (recRes.ok) {
        const result = await recRes.json();
        if (result.success) {
          setRecruiters(result.recruiters || []);
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
      const insightsRes = await fetch("/api/recruiter/insights");
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
            averageRelationshipScore: result.averageRelationshipScore
          });
        }
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
  }, [search, companyFilter, stageFilter, strengthFilter, sortField, sortOrder, verifiedOnly, minTrustScore, minReputationScore]);

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
      if (data.success) {
        setOtpSent(true);
        alert(data.message);
      } else {
        alert(data.message);
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
      if (data.success) {
        alert(data.message);
        // Refresh recruiter details
        const fresh = await fetch(`/api/recruiter/${selectedRecruiter.id}`);
        const result = await fresh.json();
        if (result.success && result.recruiter) {
          setSelectedRecruiter(result.recruiter);
        }
        await loadData(user?.id || "");
      } else {
        alert(data.message);
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

  const handleSelectRecruiter = async (rec: any) => {
    setSelectedRecruiter(rec);
    setVerificationEmail(rec.email || "");
    setLinkedinUrlInput(rec.linkedin_url || "");
    setDocUrlInput("");
    setOtpSent(false);
    setVerificationOtp("");
    setDrawerTab("activities");
    await refreshRecruiterDetails(rec.id);
  };

  // Add Recruiter
  const handleAddRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const parsedTags = newRec.tagsString
        ? newRec.tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const res = await fetch("/api/recruiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRec,
          tags: parsedTags
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowAddModal(false);
        setNewRec({
          name: "",
          company: "",
          designation: "",
          linkedin_url: "",
          email: "",
          phone: "",
          location: "",
          hiring_roles: "",
          relationship_strength: "Cold",
          pipeline_stage: "Lead Found",
          notes: "",
          tagsString: ""
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

  // Update Recruiter Stage (Kanban Drag and Drop or button click)
  const handleUpdateStage = async (recId: string, targetStage: string) => {
    if (!user) return;
    
    // Optimistic Local State Update
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
        // Rollback
        setRecruiters(previousRecruiters);
        alert("Failed to update pipeline stage");
      } else {
        // Load fresh aggregate statistics
        await loadData(user.id);
        if (selectedRecruiter && selectedRecruiter.id === recId) {
          setSelectedRecruiter(result.recruiter);
          await refreshRecruiterDetails(recId);
        }
      }
    } catch (err) {
      console.error(err);
      setRecruiters(previousRecruiters);
    }
  };

  // Update Recruiter Strength
  const handleUpdateStrength = async (recId: string, strength: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/recruiter/${recId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationship_strength: strength })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await loadData(user.id);
        if (selectedRecruiter && selectedRecruiter.id === recId) {
          setSelectedRecruiter(result.recruiter);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Log Interaction activity
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

  // Delete recruiter profile
  const handleDeleteRecruiter = async (recId: string) => {
    if (!user || !confirm("Are you sure you want to delete this recruiter profile?")) return;
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

  // Add Follow Up reminder
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

  // Complete Followup task
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

  // Google Sheets/LinkedIn CSV Importing
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

        // Ignores commas in quote blocks
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ""));
        const contact: any = {};
        
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(" ", "_");
          contact[key] = values[index] || "";
        });

        parsedContacts.push({
          name: contact.name || contact.recruiter_name || contact.first_name + " " + contact.last_name || "",
          company: contact.company || contact.organization || "",
          designation: contact.designation || contact.role || contact.title || "",
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

  // AI Message Generator Triggers
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
      // Load user profile details
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
          interactionHistory: selectedRecruiter ? recruiterActivities.map(a => a.activity_type + ": " + a.notes).join("\n") : ""
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAiGeneratedText({
          subject: result.subject || "",
          body: result.body
        });
        
        // Log outreach action dynamically to recruiter log
        await fetch("/api/recruiter/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recruiterId: aiRecruiter.id,
            activityType: "Message Sent",
            notes: `AI Generated Outreach generated: '${selectedTemplate.name}'`
          })
        });
      } else {
        setAiError(result.message || "Outreach drafting failed.");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate outreach via Gemini REST SDK.");
    } finally {
      setAiLoading(false);
    }
  };

  // drag-and-drop HTML5 Kanban events
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

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back Link navigation header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HERO TITLE SECTION CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              Recruiter CRM Growth Engine
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Networking Command Center
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Construct relationships with university recruiters and hiring managers. Request referral channels and track outreach funnels.
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

        {/* OUTREACH METRICS PANEL */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Recruiters", count: metrics.totalRecruiters, icon: Users, color: "text-indigo-500" },
            { label: "Active Conversations", count: metrics.activeConversations, icon: MessageSquare, color: "text-purple-500" },
            { label: "Referrals Received", count: metrics.referralsReceived, icon: Award, color: "text-teal-500" },
            { label: "Pending Follow-ups", count: metrics.pendingFollowups, icon: Clock, color: "text-rose-500" },
            { label: "Interview Leads", count: metrics.interviewOpportunities, icon: TrendingUp, color: "text-emerald-500" }
          ].map((card, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{card.label}</span>
              <div className="flex justify-between items-end">
                <p className="text-3xl font-black text-slate-900 leading-none">{card.count}</p>
                <card.icon className={cn("w-5 h-5 absolute bottom-5 right-5 opacity-40 group-hover:scale-110 transition-transform", card.color)} />
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH, FILTER AND NAVIGATION BAR */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center flex-wrap">
            <div className="relative w-full md:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
              />
              Verified Only
            </label>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
              <span>Min Trust:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(Number(e.target.value))}
                className="w-20 accent-indigo-650 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
              <span className="text-indigo-600 font-extrabold">{minTrustScore}%+</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-650">
              <span>Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none text-slate-700 cursor-pointer"
              >
                <option value="created_at">Date Logged</option>
                <option value="name">Recruiter Name</option>
                <option value="company">Company</option>
                <option value="trust_score">Highest Trust</option>
                <option value="reputation_score">Highest Rating</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-end">
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setCurrentView("pipeline")}
                className={cn("px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] cursor-pointer transition-all", currentView === "pipeline" ? "bg-slate-900 text-white shadow" : "text-slate-500")}
              >
                Kanban
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className={cn("px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] cursor-pointer transition-all", currentView === "list" ? "bg-slate-900 text-white shadow" : "text-slate-500")}
              >
                Directory
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC PIPELINE VS LIST PANEL VIEWS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading networking pipelines...</p>
          </div>
        ) : recruiters.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">No networking leads</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your recruiter database is currently empty. Add contacts manually or import your connections from LinkedIn to initiate relationship tracking.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Add Your First Recruiter
            </button>
          </div>
        ) : currentView === "pipeline" ? (
          /* KANBAN BOARD VIEW */
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px] select-none text-left items-start">
            {PIPELINE_STAGES.map((stage) => {
              const stageRecs = recruiters.filter(r => r.pipeline_stage === stage);
              return (
                <div
                  key={stage}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, stage)}
                  className="bg-white border border-slate-200 rounded-[2rem] p-4 min-w-[280px] max-w-[280px] shrink-0 space-y-4 shadow-sm min-h-[480px]"
                >
                  {/* Stage Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border", STAGE_COLORS[stage])}>
                      {stage}
                    </span>
                    <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{stageRecs.length}</span>
                  </div>

                  {/* Stage Cards Container */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {stageRecs.map((rec) => (
                      <div
                        key={rec.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, rec.id)}
                        onClick={() => handleSelectRecruiter(rec)}
                        className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all space-y-3 relative group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.company}</span>
                            {rec.verification?.verification_status && (
                              <span className={cn("px-1 py-0.2 text-[7px] font-black uppercase rounded border", 
                                rec.verification.verification_status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                rec.verification.verification_status === "Under Review" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                rec.verification.verification_status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                rec.verification.verification_status === "Suspended" ? "bg-zinc-800 text-zinc-150 border-zinc-900" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {rec.verification.verification_status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-black text-slate-900 truncate">{rec.name}</h4>
                            {rec.verification?.verification_status === "Verified" && (
                              <Check className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 shrink-0" />
                            )}
                          </div>
                          {rec.designation && <p className="text-[10px] text-slate-500 font-bold truncate">{rec.designation}</p>}
                        </div>

                        {/* Dial badge score */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Relationship Strength:</span>
                          <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase rounded", STRENGTH_COLORS[rec.relationship_strength] || "bg-slate-100 text-slate-600")}>
                            {rec.relationship_strength}
                          </span>
                        </div>

                        {/* Score dial visual indicator */}
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-600 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
                          <div className="flex justify-between w-full">
                            <span>Health: <strong className="text-indigo-650">{rec.relationshipScore}/100</strong></span>
                            <span>Trust: <strong className="text-emerald-650">{rec.verification?.trust_score || 0}%</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {stageRecs.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Drop Leads here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DIRECTORY LIST VIEW */
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Company & Designation</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4 text-center">Relationship Score</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-650">
                  {recruiters.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => handleSelectRecruiter(rec)}>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm block">{rec.name}</span>
                            {rec.verification?.verification_status === "Verified" && (
                              <Check className="w-4 h-4 text-emerald-500 fill-emerald-100 shrink-0" />
                            )}
                            {rec.verification?.verification_status && (
                              <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border", 
                                rec.verification.verification_status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                                rec.verification.verification_status === "Under Review" ? "bg-blue-50 text-blue-700 border-blue-150" :
                                rec.verification.verification_status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-150" :
                                rec.verification.verification_status === "Suspended" ? "bg-zinc-850 text-zinc-100 border-zinc-950" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                              )}>
                                {rec.verification.verification_status}
                              </span>
                            )}
                          </div>
                          {rec.email && <span className="text-[10px] text-slate-400 font-semibold">{rec.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-700 block">{rec.company}</span>
                          <span className="text-[10px] text-slate-450 font-semibold">{rec.designation || "Hiring Professional"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border", STAGE_COLORS[rec.pipeline_stage])}>
                          {rec.pipeline_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-900 text-sm">{rec.relationshipScore}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.relationshipLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
        )}

        {/* BOTTOM METRICS PANEL: REFERRAL TRACKER FUNNEL & STRATEGIC NETWORKING INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Referral Conversion Funnel
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Tracks stage progression success rates from requests to hired status.</p>
            </div>

            {metrics.funnel.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-3xl text-center">
                <span className="text-xs font-semibold text-slate-400">Generate referral requests to compile funnel telemetry.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.funnel.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{step.stage}</span>
                      <span className="font-black">{step.count} candidates ({step.percentage}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full" style={{ width: `${step.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic Insights */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                CRM Strategy Insights
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Correlation statistics compiled by the AI placement networking coach.</p>
            </div>

            {metrics.insights.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-3xl text-center">
                <span className="text-xs font-semibold text-slate-400">Log networking responses to compile insights logs.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.insights.map((ins, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3.5 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl">
                    <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-slate-750 leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RECRUITER DETAIL DRAWER */}
      <AnimatePresence>
        {selectedRecruiter && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-end print:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-md h-full flex flex-col justify-between overflow-hidden relative"
            >
              {/* Header Info */}
              <div className="p-6 border-b border-slate-100 space-y-4">
                <button
                  onClick={() => setSelectedRecruiter(null)}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">{selectedRecruiter.company}</span>
                    {selectedRecruiter.verification?.verification_status === "Verified" && (
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
                  {selectedRecruiter.verification?.verification_status && (
                    <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase rounded-md border", 
                      selectedRecruiter.verification.verification_status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                      selectedRecruiter.verification.verification_status === "Under Review" ? "bg-blue-50 text-blue-700 border-blue-150" :
                      selectedRecruiter.verification.verification_status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-150" :
                      selectedRecruiter.verification.verification_status === "Suspended" ? "bg-zinc-850 text-zinc-100 border-zinc-950" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {selectedRecruiter.verification.verification_status}
                    </span>
                  )}
                  <span className="px-2 py-1 text-[9px] font-black bg-indigo-50 text-indigo-750 border border-indigo-150 rounded-md">
                    Trust: {selectedRecruiter.verification?.trust_score || 0}%
                  </span>
                  {selectedRecruiter.verification?.reputation_score > 0 && (
                    <span className="px-2 py-1 text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-150 rounded-md">
                      ★ {selectedRecruiter.verification.reputation_score.toFixed(1)} Rating
                    </span>
                  )}
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 text-xs font-black uppercase tracking-wider shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setDrawerTab("activities")}
                  className={cn("flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all", drawerTab === "activities" ? "border-indigo-600 text-indigo-650 bg-white" : "border-transparent text-slate-450 hover:text-slate-700")}
                >
                  Activities
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("verification")}
                  className={cn("flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all", drawerTab === "verification" ? "border-indigo-600 text-indigo-650 bg-white" : "border-transparent text-slate-450 hover:text-slate-700")}
                >
                  Verification
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("rate_report")}
                  className={cn("flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all", drawerTab === "rate_report" ? "border-indigo-600 text-indigo-650 bg-white" : "border-transparent text-slate-450 hover:text-slate-700")}
                >
                  Rate & Report
                </button>
              </div>

              {/* Scrollable details and timeline */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {drawerTab === "activities" && (
                  <div className="space-y-6">
                    {/* Contact items */}
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Contact Details</span>
                      {selectedRecruiter.linkedin_url && (
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Link2 className="w-4 h-4 text-slate-400" />
                          <a href={selectedRecruiter.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-black hover:underline truncate">LinkedIn Profile Link</a>
                        </div>
                      )}
                      {selectedRecruiter.email && (
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{selectedRecruiter.email}</span>
                        </div>
                      )}
                      {selectedRecruiter.phone && (
                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{selectedRecruiter.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags and Notes */}
                    <div className="space-y-2 text-xs font-semibold">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Candidate Notes & Tags</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 text-xs italic">
                        {selectedRecruiter.notes || "No notes logged for this contact."}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedRecruiter.tags.map((t: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Edit Pipeline Stage Quick Controls */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Quick Pipeline Transition</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PIPELINE_STAGES.slice(0, 8).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStage(selectedRecruiter.id, st)}
                            className={cn("px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border cursor-pointer transition-all", selectedRecruiter.pipeline_stage === st ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200")}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Log new activity */}
                    <form onSubmit={handleAddActivitySubmit} className="space-y-3 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Log New Outreach Activity</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {["Message Sent", "Reply Received", "Call Completed", "Referral Requested", "Referral Approved", "Interview Scheduled"].map((act) => (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setNewActivityType(act)}
                            className={cn("px-3 py-2 text-[10px] font-black uppercase rounded-xl border text-center cursor-pointer transition-all", newActivityType === act ? "bg-indigo-50 border-indigo-250 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-650")}
                          >
                            {act}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Outreach notes (e.g. sent thank you email)..."
                        value={newActivityNotes}
                        onChange={(e) => setNewActivityNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                      />
                      
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Log Outreach
                      </button>
                    </form>

                    {/* Chronological Timeline */}
                    <div className="space-y-3 border-t border-slate-100 pt-4 text-left">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Outreach Timeline</span>
                      {recruiterActivities.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-6">No interactions logged yet.</p>
                      ) : (
                        <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-150">
                          {recruiterActivities.map((act) => (
                            <div key={act.id} className="flex gap-4 items-start pl-6 relative">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 absolute left-2 top-2 border border-white" />
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-800 uppercase block">{act.activity_type}</span>
                                {act.notes && <p className="text-xs text-slate-500 font-medium">{act.notes}</p>}
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
                    {/* SECTION 1: CORPORATE EMAIL VERIFICATION */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Corporate Email Verification</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Verify that this recruiter uses a valid corporate domain email. Public email hosts (Gmail, Yahoo) are not accepted.</p>
                      
                      {selectedRecruiter.verification?.email_verified ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Corporate Email Verified</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder="e.g. recruiter@company.com"
                              value={verificationEmail}
                              onChange={(e) => setVerificationEmail(e.target.value)}
                              className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading || !verificationEmail}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                              {otpLoading ? "Sending..." : "Send OTP"}
                            </button>
                          </div>

                          {otpSent && (
                            <div className="space-y-2 border-t border-slate-250/60 pt-3">
                              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Enter 6-Digit OTP</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="123456"
                                  maxLength={6}
                                  value={verificationOtp}
                                  onChange={(e) => setVerificationOtp(e.target.value)}
                                  className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black tracking-widest focus:outline-none text-slate-800 text-center"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                  Verify Code
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: LINKEDIN SCANNER */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-blue-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">LinkedIn Authenticity Check</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Scan the recruiter's LinkedIn URL to calculate an authenticity score based on profile signals.</p>
                      
                      <div className="space-y-3">
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/recruiter-profile"
                          value={linkedinUrlInput}
                          onChange={(e) => setLinkedinUrlInput(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleLinkedinValidate}
                          disabled={!linkedinUrlInput}
                          className="w-full py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                          Check Authenticity Heuristics
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: DOCUMENT SUBMISSION */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Manual Credentials Submission</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Provide official verification documents (e.g. employee card, business card, work contract) for manual review by system moderators.</p>

                      {selectedRecruiter.verification?.verification_status === "Under Review" ? (
                        <div className="p-3.5 bg-blue-50 border border-blue-150 rounded-xl text-blue-700 text-xs font-bold flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Verification is Under Review by Admins</span>
                        </div>
                      ) : selectedRecruiter.verification?.verification_status === "Verified" ? (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Recruiter profile is fully verified</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Document URL (or path to files)"
                            value={docUrlInput}
                            onChange={(e) => setDocUrlInput(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={handleDocumentSubmit}
                            disabled={!docUrlInput}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                          >
                            Submit for Admin Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {drawerTab === "rate_report" && (
                  <div className="space-y-6">
                    {/* RATING FORM */}
                    <form onSubmit={handleRatingSubmit} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Submit Professional Rating</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Provide constructive, structured feedback on your interactions with this recruiter.</p>
                      
                      <div className="space-y-3">
                        {[
                          { label: "Professionalism", value: professionalism, setter: setProfessionalism },
                          { label: "Response Time", value: responseTime, setter: setResponseTime },
                          { label: "Helpfulness", value: helpfulness, setter: setHelpfulness },
                          { label: "Referral Quality", value: referralQuality, setter: setReferralQuality },
                          { label: "Communication", value: communication, setter: setCommunication }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span>{item.label}:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={item.value}
                                onChange={(e) => item.setter(Number(e.target.value))}
                                className="w-20 accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-amber-600 text-xs font-black">{item.value} ★</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block font-sans">Written Review (Optional)</span>
                        <textarea
                          placeholder="Describe your conversation, interview style, or response timeline..."
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          className="w-full h-16 p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Submit Feedback Review
                      </button>
                    </form>

                    {/* SCAM REPORT FORM */}
                    <form onSubmit={handleReportSubmit} className="p-5 bg-red-50/50 border border-red-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <h4 className="text-xs font-black text-red-950 uppercase tracking-wider">Report Suspicious Activity</h4>
                      </div>
                      <p className="text-[10px] text-red-700/80 font-bold">Report spam accounts, fraudulent job offers, referral extortion schemes, or fake identities.</p>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-red-900 uppercase tracking-widest">Reason for Report</label>
                          <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-red-200/60 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                          >
                            <option value="Fake Recruiter">Fake Recruiter Profile / Identity Theft</option>
                            <option value="Scam Postings">Scam Job Postings</option>
                            <option value="Extortion/Money Request">Charging Money for Placements/Referrals</option>
                            <option value="Spam/Harassment">Spam Outreach or Harassment</option>
                            <option value="Other">Other Violations</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-red-900 uppercase tracking-widest">Evidence Details</label>
                          <textarea
                            required
                            placeholder="Paste text messages, describe the scam, or include evidence details..."
                            value={reportEvidence}
                            onChange={(e) => setReportEvidence(e.target.value)}
                            className="w-full h-16 p-2 bg-white border border-red-250/65 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 resize-none"
                          />
                        </div>

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

      {/* MODAL: ADD RECRUITER */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full text-left relative overflow-hidden"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleAddRecruiterSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">New Recruiter Profile</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Log a new contact details profile.</p>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation/Role</label>
                    <input
                      type="text"
                      placeholder="University Recruiter"
                      value={newRec.designation}
                      onChange={(e) => setNewRec({ ...newRec, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="jane@company.com"
                      value={newRec.email}
                      onChange={(e) => setNewRec({ ...newRec, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9999999999"
                      value={newRec.phone}
                      onChange={(e) => setNewRec({ ...newRec, phone: e.target.value })}
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    >
                      {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship Status</label>
                    <select
                      value={newRec.relationship_strength}
                      onChange={(e: any) => setNewRec({ ...newRec, relationship_strength: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    >
                      {["Cold", "Connected", "Messaged", "Responded", "Referral Possible", "Strong Connection"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Startup, Tech, HR"
                    value={newRec.tagsString}
                    onChange={(e) => setNewRec({ ...newRec, tagsString: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bio Notes</label>
                  <textarea
                    placeholder="Enter notes about interactions or targets..."
                    value={newRec.notes}
                    onChange={(e) => setNewRec({ ...newRec, notes: e.target.value })}
                    className="w-full h-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Create Recruiter
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD FOLLOW-UP REMINDER */}
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
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">Schedule Follow-up</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Set alerts for outreach dates.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Recruiter *</label>
                  <select
                    required
                    value={newFollow.recruiter_id}
                    onChange={(e) => setNewFollow({ ...newFollow, recruiter_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
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
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Task Priority</label>
                  <select
                    value={newFollow.priority}
                    onChange={(e: any) => setNewFollow({ ...newFollow, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  >
                    {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alert Message</label>
                  <input
                    type="text"
                    placeholder="Check referral status, thank you email..."
                    value={newFollow.message}
                    onChange={(e) => setNewFollow({ ...newFollow, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="reminderCheckbox"
                    checked={newFollow.reminder}
                    onChange={(e) => setNewFollow({ ...newFollow, reminder: e.target.checked })}
                    className="rounded border-slate-200 text-indigo-650 focus:ring-indigo-550"
                  />
                  <label htmlFor="reminderCheckbox" className="text-xs font-bold text-slate-600 cursor-pointer">Activate email notification reminders</label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Schedule Reminder
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
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none font-display">Bulk Import Contacts</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Injest sheets or LinkedIn export CSV files.</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl text-xs font-semibold text-slate-650 leading-relaxed">
                CSV files must contain headers: <strong>name, company</strong>. Optional column headers include: <em>designation, linkedin_url, email, phone, location, hiring_roles, tags</em>.
              </div>

              <div className="border border-dashed border-slate-250 rounded-2xl p-6 text-center hover:bg-slate-50 transition-all relative">
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
              <div className="p-6 border-b border-slate-100">
                <button
                  onClick={() => setShowAIGenerator(false)}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
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
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={cn("px-3 py-2.5 text-[10px] font-black uppercase rounded-xl border text-center cursor-pointer transition-all", selectedTemplate?.id === t.id ? "bg-indigo-50 border-indigo-250 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-650")}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overrides parameter fields */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Tech Skills</label>
                    <input
                      type="text"
                      placeholder="React, Python, AWS"
                      value={skillsOverride}
                      onChange={(e) => setSkillsOverride(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Target Role</label>
                    <input
                      type="text"
                      placeholder="Full Stack Developer"
                      value={roleOverride}
                      onChange={(e) => setRoleOverride(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Generate Action */}
                <button
                  onClick={handleGenerateAIMessage}
                  disabled={aiLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Outreach Message</span>
                </button>

                {aiError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
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
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Generated Body Context</span>
                      <textarea
                        readOnly
                        value={aiGeneratedText.body}
                        className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiGeneratedText.body);
                        alert("Message copied to clipboard!");
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
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
