"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  AlertOctagon, 
  FileText, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Filter, 
  CheckSquare, 
  Square,
  MessageSquare,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  Calendar,
  Lock,
  Unlock,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Recruiter {
  id: string;
  name: string;
  company: string;
  designation?: string;
  email?: string;
}

interface Verification {
  id: string;
  recruiter_id: string;
  verification_status: "Pending" | "Under Review" | "Verified" | "Rejected" | "Suspended";
  verification_method?: string;
  company_email?: string;
  company_domain?: string;
  linkedin_url?: string;
  linkedin_verified: boolean;
  email_verified: boolean;
  admin_verified: boolean;
  verification_notes?: string;
  trust_score: number;
  reputation_score: number;
  fraud_risk_score: number;
  document_url?: string;
  updated_at: string;
  recruiters?: Recruiter;
}

interface Report {
  id: string;
  recruiter_id: string;
  reporter_user_id: string;
  reason: string;
  evidence?: string;
  status: "Pending" | "Resolved" | "Dismissed";
  created_at: string;
  recruiters?: Recruiter;
}

export default function AdminVerificationDashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "reports">("queue");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [notesModalId, setNotesModalId] = useState<string | null>(null);
  const [actionNotesText, setActionNotesText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Verifications
      const verRes = await fetch("/api/recruiter-verifications/admin?refresh=true");
      const verJson = await verRes.json();
      if (verJson.success) {
        setVerifications(verJson.verifications);
      }

      // 2. Fetch Reports
      const repRes = await fetch("/api/recruiter-verifications/reports");
      const repJson = await repRes.json();
      if (repJson.success) {
        setReports(repJson.reports);
      }
    } catch (err) {
      console.error("Failed to load admin verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (recruiterIds: string[], status: "Pending" | "Under Review" | "Verified" | "Rejected" | "Suspended", customNotes?: string) => {
    try {
      const res = await fetch("/api/recruiter-verifications/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: recruiterIds,
          status,
          notes: customNotes || actionNotesText || "Updated by Admin"
        })
      });
      const data = await res.json();
      if (data.success) {
        // Clear variables
        setSelectedIds([]);
        setNotesModalId(null);
        setActionNotesText("");
        // Reload data
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: "Resolved" | "Dismissed") => {
    try {
      const res = await fetch("/api/recruiter-verifications/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: resolution })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredVerifications.map(v => v.recruiter_id);
    if (selectedIds.length === visibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  // Filter queue
  const filteredVerifications = verifications.filter(v => {
    const name = v.recruiters?.name || "Unknown";
    const company = v.recruiters?.company || "Unknown";
    const searchMatch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        company.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "All") return searchMatch;
    return v.verification_status === filterStatus && searchMatch;
  });

  // Stats
  const pendingCount = verifications.filter(v => v.verification_status === "Under Review" || v.verification_status === "Pending").length;
  const verifiedCount = verifications.filter(v => v.verification_status === "Verified").length;
  const suspendedCount = verifications.filter(v => v.verification_status === "Suspended").length;
  const avgTrustScore = verifications.length > 0 
    ? Math.round(verifications.reduce((sum, v) => sum + (v.trust_score || 0), 0) / verifications.length) 
    : 72;
  const fraudAlerts = reports.filter(r => r.status === "Pending").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-teal-500/30">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-500/10 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 text-[11px] font-bold tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full uppercase">
                Admin Terminal
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-200 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
              Recruiter Verification & Audits
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Mitigate scam hires, verify identity claims, and moderate active recruiter trust states.
            </p>
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-sm font-semibold text-slate-300"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? "Refreshing..." : "Refresh Queue"}
          </button>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
              <FileText className="w-12 h-12 text-teal-400" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Cue</p>
            <h3 className="text-3xl font-black text-white mt-2">{pendingCount}</h3>
            <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Needs Review</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verified Recruiters</p>
            <h3 className="text-3xl font-black text-white mt-2">{verifiedCount}</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Badges Active</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
              <UserX className="w-12 h-12 text-rose-400" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Suspended Profiles</p>
            <h3 className="text-3xl font-black text-white mt-2">{suspendedCount}</h3>
            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Locks Triggered</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
              <TrendingUp className="w-12 h-12 text-cyan-400" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Trust Score</p>
            <h3 className="text-3xl font-black text-white mt-2">{avgTrustScore}%</h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Heuristics Target: 70%</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 col-span-2 lg:col-span-1 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
              <AlertOctagon className="w-12 h-12 text-rose-500" />
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Fraud Threat Alerts</p>
            <h3 className={cn("text-3xl font-black mt-2", fraudAlerts > 0 ? "text-rose-500" : "text-white")}>{fraudAlerts}</h3>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block", fraudAlerts > 0 ? "text-rose-400 bg-rose-500/10 animate-pulse" : "text-slate-400 bg-slate-800")}>
              {fraudAlerts > 0 ? "Spam Threat Active" : "No Reports Pending"}
            </span>
          </div>
        </div>

        {/* View Navigation tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-6">
          <button 
            onClick={() => setActiveTab("queue")}
            className={cn("pb-4 text-sm font-bold tracking-wide transition relative uppercase", 
              activeTab === "queue" ? "text-teal-400" : "text-slate-400 hover:text-white"
            )}
          >
            Verification Queue ({filteredVerifications.length})
            {activeTab === "queue" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("reports")}
            className={cn("pb-4 text-sm font-bold tracking-wide transition relative uppercase", 
              activeTab === "reports" ? "text-rose-400" : "text-slate-400 hover:text-white"
            )}
          >
            Spam & Scam Reports ({reports.length})
            {activeTab === "reports" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-400" />
            )}
          </button>
        </div>

        {/* Dashboard Tabs Rendering */}
        <AnimatePresence mode="wait">
          {activeTab === "queue" ? (
            <motion.div
              key="queue-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 border border-slate-800 p-4 rounded-2xl mb-6 backdrop-blur-sm">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by recruiter or company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-teal-500 focus:outline-none text-sm"
                  />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase shrink-0">
                    <Filter className="w-3.5 h-3.5" />
                    Status Filters
                  </span>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                    {["All", "Pending", "Under Review", "Verified", "Rejected", "Suspended"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0", 
                          filterStatus === status ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-white"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk operations bar */}
              {selectedIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 mb-6 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/30 rounded-2xl"
                >
                  <p className="text-sm font-semibold text-slate-200">
                    Selected <span className="text-teal-400 font-bold">{selectedIds.length}</span> recruiter profile(s) for bulk actions:
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAction(selectedIds, "Verified", "Bulk approved by Admin.")}
                      className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition"
                    >
                      Bulk Approve (Verified)
                    </button>
                    <button
                      onClick={() => handleAction(selectedIds, "Rejected", "Bulk rejected by Admin.")}
                      className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition"
                    >
                      Bulk Reject
                    </button>
                    <button
                      onClick={() => handleAction(selectedIds, "Suspended", "Bulk suspended by Admin.")}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                    >
                      Bulk Suspend
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Clear Select
                    </button>
                  </div>
                </motion.div>
              )}

              {/* List grid */}
              {loading ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">Compiling recruiter verification records...</p>
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-3xl">
                  <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No recruiter verifications found matching the filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVerifications.map((v) => {
                    const rec = v.recruiters;
                    const isSelected = selectedIds.includes(v.recruiter_id);
                    return (
                      <div 
                        key={v.id} 
                        className={cn(
                          "relative bg-slate-900/30 border rounded-2xl transition duration-300 hover:border-slate-700 hover:bg-slate-900/50 backdrop-blur-md overflow-hidden",
                          isSelected ? "border-teal-500/50 ring-1 ring-teal-500/20" : "border-slate-800/80"
                        )}
                      >
                        {/* Status bar indication */}
                        <div className={cn("h-1 w-full",
                          v.verification_status === "Verified" && "bg-emerald-500",
                          v.verification_status === "Pending" && "bg-amber-500",
                          v.verification_status === "Under Review" && "bg-cyan-500",
                          v.verification_status === "Rejected" && "bg-rose-500",
                          v.verification_status === "Suspended" && "bg-slate-500"
                        )} />

                        <div className="p-5">
                          {/* Selection Checkbox */}
                          <button 
                            onClick={() => toggleSelect(v.recruiter_id)} 
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-teal-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          {/* Profile Header */}
                          <div className="mb-4">
                            <h4 className="text-lg font-bold text-slate-100">{rec?.name || "Anonymous Recruiter"}</h4>
                            <p className="text-xs text-slate-400 font-semibold">{rec?.designation || "Hiring Lead"} @ <span className="text-slate-300 font-bold">{rec?.company || "Unknown Company"}</span></p>
                          </div>

                          {/* Scores metrics row */}
                          <div className="grid grid-cols-3 gap-2 border-y border-slate-800 py-3 mb-4 text-center">
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">Trust Score</p>
                              <span className={cn("text-lg font-black mt-0.5 inline-block",
                                v.trust_score >= 81 ? "text-emerald-400" :
                                v.trust_score >= 61 ? "text-cyan-400" :
                                v.trust_score >= 31 ? "text-amber-500" : "text-rose-500"
                              )}>
                                {v.trust_score}%
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">Reputation</p>
                              <span className="text-lg font-black mt-0.5 inline-block text-yellow-400">
                                ⭐ {v.reputation_score || "0.0"}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">Fraud Risk</p>
                              <span className={cn("text-lg font-black mt-0.5 inline-block",
                                v.fraud_risk_score >= 70 ? "text-rose-500 animate-pulse" :
                                v.fraud_risk_score >= 40 ? "text-amber-500" : "text-emerald-400"
                              )}>
                                {v.fraud_risk_score}%
                              </span>
                            </div>
                          </div>

                          {/* Credentials Checks */}
                          <div className="space-y-2.5 mb-5 text-xs text-slate-300">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Corporate Email:</span>
                              {v.company_email ? (
                                <span className="font-mono flex items-center gap-1 text-[11px] text-slate-200">
                                  {v.company_email}
                                  {v.email_verified ? (
                                    <span className="text-emerald-400 text-[10px] font-bold">✔ Verified</span>
                                  ) : (
                                    <span className="text-amber-500 text-[10px]">Unverified</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-650">Not Provided</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">LinkedIn Profile:</span>
                              {v.linkedin_url ? (
                                <a 
                                  href={v.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-teal-400 flex items-center gap-1 hover:underline text-[11px]"
                                >
                                  Open Link
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-650">Not Provided</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Proof Document:</span>
                              {v.document_url ? (
                                <button
                                  onClick={() => alert(`Reviewing document: ${v.document_url}`)}
                                  className="text-teal-400 flex items-center gap-1 hover:underline text-[11px]"
                                >
                                  ID / Business Card
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-slate-650">No Document Uploaded</span>
                              )}
                            </div>
                          </div>

                          {/* Notes Preview */}
                          {v.verification_notes && (
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 mb-5 text-[11px] text-slate-400 font-mono">
                              <span className="text-teal-400 font-bold block mb-0.5">Moderation Notes:</span>
                              {v.verification_notes}
                            </div>
                          )}

                          {/* Actions button strip */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setNotesModalId(v.recruiter_id);
                                setActionNotesText(v.verification_notes || "");
                              }}
                              className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-800 hover:text-white transition flex-1"
                            >
                              Add Notes
                            </button>
                            <button
                              onClick={() => handleAction([v.recruiter_id], "Verified", "Approved manually after credentials validation.")}
                              className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-xl text-xs font-bold transition flex-1"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleAction([v.recruiter_id], "Rejected", "Verification rejected.")}
                              className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl text-xs font-bold transition flex-1"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction([v.recruiter_id], "Suspended", "Account suspended.")}
                              className="px-2.5 py-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 rounded-xl text-xs transition"
                              title="Suspend"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Reports List */}
              {loading ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">Compiling user-submitted fraud reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-3xl">
                  <ShieldCheck className="w-12 h-12 text-slate-650 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No scam/spam reports filed by students.</p>
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-4">Recruiter Profile</th>
                          <th className="p-4">Reporter ID</th>
                          <th className="p-4">Report Type (Reason)</th>
                          <th className="p-4">Evidence Notes</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50">
                        {reports.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-900/30 transition">
                            <td className="p-4">
                              <span className="font-bold text-slate-100">{r.recruiters?.name || "Unknown"}</span>
                              <span className="block text-xs text-slate-400">{r.recruiters?.company || "Unknown Company"}</span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500">
                              {r.reporter_user_id.substring(0, 8)}...
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                                {r.reason}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-400 max-w-xs truncate">
                              {r.evidence || "No written statements provided."}
                            </td>
                            <td className="p-4">
                              <span className={cn("px-2 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider",
                                r.status === "Pending" ? "text-amber-500 bg-amber-500/10" : "text-slate-500 bg-slate-800"
                              )}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {r.status === "Pending" ? (
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => handleResolveReport(r.id, "Resolved")}
                                    className="px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition"
                                  >
                                    Resolve (Action Taken)
                                  </button>
                                  <button
                                    onClick={() => handleResolveReport(r.id, "Dismissed")}
                                    className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition"
                                  >
                                    Dismiss (Clear)
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs font-semibold">Archived</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes editor overlay */}
        {notesModalId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Edit Moderation Notes</h3>
              <textarea
                value={actionNotesText}
                onChange={(e) => setActionNotesText(e.target.value)}
                placeholder="Include verification checklists, LinkedIn discrepancies, or suspended explanations..."
                className="w-full h-32 p-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 resize-none font-mono"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setNotesModalId(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save locally in DB
                    handleAction([notesModalId], verifications.find(v => v.recruiter_id === notesModalId)?.verification_status || "Pending", actionNotesText);
                  }}
                  className="px-5 py-2 bg-teal-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-teal-400 transition"
                >
                  Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
