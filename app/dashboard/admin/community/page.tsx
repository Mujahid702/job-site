"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Check, 
  X, 
  SlidersHorizontal, 
  Loader2, 
  Eye, 
  EyeOff,
  UserCheck,
  TrendingUp,
  Award,
  Globe,
  Lock,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  group_name: string;
  group_description: string;
  group_category: string;
  platform_type: string;
  group_link: string;
  group_image: string;
  group_banner: string;
  group_status: "Active" | "Disabled" | "Archived";
  visibility: "Public" | "Private" | "Unlisted";
  display_order: number;
  featured: boolean;
  member_count: number;
  verification_status: "Verified" | "Official" | "Partner Community" | "Student Managed" | "Private" | "None";
  unlock_min_profile_completion: number;
  unlock_min_ats_score: number;
  unlock_resume_uploaded: boolean;
  unlock_onboarding_completed: boolean;
}

interface AmbassadorRequest {
  id: string;
  user_id: string;
  status: "Pending" | "Approved" | "Rejected";
  referred_count: number;
  community_impact_score: number;
  created_at: string;
  profiles?: {
    full_name: string;
    college: string;
    email: string;
  };
}

export default function AdminCommunityManagerPage() {
  const [activeSubTab, setActiveSubTab] = useState<"groups" | "ambassadors" | "analytics">("groups");
  
  // Data States
  const [groups, setGroups] = useState<Group[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorRequest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Editing / Creation States
  const [editingGroup, setEditingGroup] = useState<Partial<Group> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Group fields
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupCategory, setGroupCategory] = useState("Placement Updates");
  const [platformType, setPlatformType] = useState("WhatsApp");
  const [groupLink, setGroupLink] = useState("");
  const [groupStatus, setGroupStatus] = useState<"Active" | "Disabled" | "Archived">("Active");
  const [visibility, setVisibility] = useState<"Public" | "Private" | "Unlisted">("Public");
  const [featured, setFeatured] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<Group["verification_status"]>("Verified");
  const [unlockMinProfileCompletion, setUnlockMinProfileCompletion] = useState(0);
  const [unlockMinAtsScore, setUnlockMinAtsScore] = useState(0);
  const [unlockResumeUploaded, setUnlockResumeUploaded] = useState(false);
  const [unlockOnboardingCompleted, setUnlockOnboardingCompleted] = useState(false);
  const [groupImage, setGroupImage] = useState("");
  const [groupBanner, setGroupBanner] = useState("");
  
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch groups list
      const groupsRes = await fetch("/api/admin/community");
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        if (data.success) setGroups(data.groups || []);
      }

      // 2. Fetch ambassador list
      const ambRes = await fetch("/api/admin/ambassadors");
      if (ambRes.ok) {
        const data = await ambRes.json();
        if (data.success) setAmbassadors(data.list || []);
      }

      // 3. Fetch analytics
      const analyticsRes = await fetch("/api/admin/growth/analytics");
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.success) setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Error loading admin community data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupCategory("Placement Updates");
    setPlatformType("WhatsApp");
    setGroupLink("");
    setGroupStatus("Active");
    setVisibility("Public");
    setFeatured(false);
    setVerificationStatus("Verified");
    setUnlockMinProfileCompletion(0);
    setUnlockMinAtsScore(0);
    setUnlockResumeUploaded(false);
    setUnlockOnboardingCompleted(false);
    setGroupImage("");
    setGroupBanner("");
    setEditingGroup(null);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupLink.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          groupDescription,
          groupCategory,
          platformType,
          groupLink,
          groupImage,
          groupBanner,
          groupStatus,
          visibility,
          featured,
          verificationStatus,
          unlockMinProfileCompletion,
          unlockMinAtsScore,
          unlockResumeUploaded,
          unlockOnboardingCompleted,
          displayOrder: groups.length
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setShowAddForm(false);
          resetForm();
          await loadData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setGroupDescription(group.group_description || "");
    setGroupCategory(group.group_category);
    setPlatformType(group.platform_type);
    setGroupLink(group.group_link);
    setGroupStatus(group.group_status);
    setVisibility(group.visibility);
    setFeatured(group.featured);
    setVerificationStatus(group.verification_status);
    setUnlockMinProfileCompletion(group.unlock_min_profile_completion);
    setUnlockMinAtsScore(group.unlock_min_ats_score);
    setUnlockResumeUploaded(group.unlock_resume_uploaded);
    setUnlockOnboardingCompleted(group.unlock_onboarding_completed);
    setGroupImage(group.group_image || "");
    setGroupBanner(group.group_banner || "");
    setShowAddForm(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGroup.id,
          groupName,
          groupDescription,
          groupCategory,
          platformType,
          groupLink,
          groupImage,
          groupBanner,
          groupStatus,
          visibility,
          featured,
          verificationStatus,
          unlockMinProfileCompletion,
          unlockMinAtsScore,
          unlockResumeUploaded,
          unlockOnboardingCompleted
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setShowAddForm(false);
          resetForm();
          await loadData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this community group?")) return;
    try {
      const res = await fetch(`/api/admin/community?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await loadData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (group: Group) => {
    const nextStatus = group.group_status === "Active" ? "Disabled" : "Active";
    try {
      const res = await fetch("/api/admin/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: group.id, groupStatus: nextStatus })
      });
      if (res.ok) {
        setGroups(groups.map(g => g.id === group.id ? { ...g, group_status: nextStatus as any } : g));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (group: Group, direction: "up" | "down") => {
    const index = groups.findIndex(g => g.id === group.id);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === groups.length - 1) return;

    const swapWithIndex = direction === "up" ? index - 1 : index + 1;
    const targetGroup = groups[swapWithIndex];

    try {
      // Swapping order values
      const res1 = await fetch("/api/admin/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: group.id, displayOrder: targetGroup.display_order })
      });
      
      const res2 = await fetch("/api/admin/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetGroup.id, displayOrder: group.display_order })
      });

      if (res1.ok && res2.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAmbassadorReview = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch("/api/admin/ambassadors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        setAmbassadors(ambassadors.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Categories & Platform Options
  const categoriesList = [
    "Placement Updates", "Placement Preparation", "Internships", "Hackathons", 
    "Off-Campus Hiring", "On-Campus Hiring", "DSA Preparation", "System Design", 
    "Full Stack", "Data Science", "AI/ML", "Cyber Security", "Cloud Computing", 
    "Open Source", "Startup Networking", "Referral Network", "Mock Interviews", 
    "Career Guidance", "Mentorship", "Alumni Network", "Custom Category"
  ];

  const platformsList = ["WhatsApp", "Telegram", "Discord", "LinkedIn", "Slack", "Facebook", "Reddit", "Website", "Other"];

  if (loading && groups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-550 font-extrabold uppercase tracking-widest text-xs">Opening Admin Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left text-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        
        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HEADER */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Community growth admin control
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Admin Manager
            </h1>
            <p className="text-slate-550 font-medium text-sm max-w-xl leading-relaxed">
              Create, edit, feature, and lock-gate placement communities. Audit ambassador campus registrations and track conversion funnel telemetry.
            </p>
          </div>

          <div className="flex gap-2 bg-slate-100 p-1.5 border border-slate-200 rounded-2xl">
            {[
              { id: "groups", label: "Groups Catalog", icon: Globe },
              { id: "ambassadors", label: "Campus Ambassadors", icon: UserCheck },
              { id: "analytics", label: "Telemetry Metrics", icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                  activeSubTab === tab.id 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/55"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABS CONTAINER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 1. GROUPS CRUD TAB */}
            {activeSubTab === "groups" && (
              <div className="space-y-6">
                
                {/* Actions bar */}
                <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Community Channels list</h3>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </button>
                </div>

                {/* Catalog Table */}
                <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="py-4 px-6 w-16 text-center">Order</th>
                        <th className="py-4 px-6">Group Info</th>
                        <th className="py-4 px-6">Platform & Category</th>
                        <th className="py-4 px-6">Gate Requirements</th>
                        <th className="py-4 px-6 text-center">Members</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group, idx) => (
                        <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button 
                                onClick={() => handleReorder(group, "up")}
                                disabled={idx === 0}
                                className="text-slate-400 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <span className="font-black text-sm text-slate-800">{group.display_order}</span>
                              <button 
                                onClick={() => handleReorder(group, "down")}
                                disabled={idx === groups.length - 1}
                                className="text-slate-400 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-black text-slate-900">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {group.group_name}
                                {group.featured && <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[7px] font-black uppercase px-1.5 py-0.2 rounded">Featured</span>}
                              </div>
                              <span className="block text-[10px] text-slate-500 font-semibold truncate max-w-xs">{group.group_description}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold">
                            <span className={cn(
                              "px-2 py-0.5 border rounded font-black text-[9px] mr-2",
                              group.platform_type === "WhatsApp" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              group.platform_type === "Telegram" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-indigo-50 text-indigo-700 border-indigo-200"
                            )}>{group.platform_type}</span>
                            <span className="text-slate-500">{group.group_category}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-semibold">
                            {/* Unlock metrics display */}
                            <div className="flex flex-col gap-0.5 text-[10px]">
                              {group.unlock_onboarding_completed && <span>&bull; Onboarding</span>}
                              {group.unlock_resume_uploaded && <span>&bull; Resume OS</span>}
                              {group.unlock_min_profile_completion > 0 && <span>&bull; Profile &gt; {group.unlock_min_profile_completion}%</span>}
                              {group.unlock_min_ats_score > 0 && <span>&bull; ATS &gt; {group.unlock_min_ats_score}</span>}
                              {!group.unlock_onboarding_completed && !group.unlock_resume_uploaded && group.unlock_min_profile_completion === 0 && group.unlock_min_ats_score === 0 && <span className="text-emerald-600">Open Access</span>}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-black text-sm text-slate-800">{group.member_count}</td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleToggleActive(group)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer border",
                                group.group_status === "Active" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                                  : "bg-rose-50 text-rose-700 border-rose-250"
                              )}
                            >
                              {group.group_status}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(group)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {groups.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            No community groups available. Click Create Group to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. CAMPUS AMBASSADORS TAB */}
            {activeSubTab === "ambassadors" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ambassador Registrations Queue</h3>
                </div>

                <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="py-4 px-6">Student Name & Info</th>
                        <th className="py-4 px-6">College Campus</th>
                        <th className="py-4 px-6 text-center">Referrals Count</th>
                        <th className="py-4 px-6 text-center">Impact Score</th>
                        <th className="py-4 px-6 text-center">Joined Date</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ambassadors.map(amb => (
                        <tr key={amb.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-black text-slate-900">
                            <div className="space-y-0.5">
                              <div>{amb.profiles?.full_name || "Applicant"}</div>
                              <span className="block text-[10px] text-slate-500 font-semibold">{amb.profiles?.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-650">{amb.profiles?.college || "Placement Academy"}</td>
                          <td className="py-4 px-6 text-center font-black text-sm text-slate-850">{amb.referred_count}</td>
                          <td className="py-4 px-6 text-center font-black text-sm text-indigo-655">{amb.community_impact_score}</td>
                          <td className="py-4 px-6 text-center font-bold text-slate-400">{new Date(amb.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={cn(
                              "px-2 py-0.5 text-[8px] font-black uppercase rounded border tracking-wider",
                              amb.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                              amb.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-250"
                            )}>
                              {amb.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {amb.status === "Pending" && (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleAmbassadorReview(amb.id, "Approved")}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-0.5 shadow-sm"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleAmbassadorReview(amb.id, "Rejected")}
                                  className="px-2.5 py-1.5 bg-slate-100 text-rose-600 border border-slate-200 font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-0.5 hover:bg-rose-50"
                                >
                                  <X className="w-3 h-3" /> Decline
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {ambassadors.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            No ambassador applications in queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. TELEMETRY ANALYTICS TAB */}
            {activeSubTab === "analytics" && analytics && (
              <div className="space-y-8">
                
                {/* Stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Active/Total Communities", value: `${analytics.activeGroups}/${analytics.totalGroups}`, desc: "Active database channels" },
                    { label: "Total Members Joined", value: analytics.totalJoins, desc: "Aggregated group participants" },
                    { label: "Signups from Referrals", value: analytics.referrals.registrations, desc: "Invitations accepted & registered" },
                    { label: "Flagged Suspicious Accounts", value: analytics.referrals.flagged, desc: "Device/IP duplication triggers" }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">{card.label}</span>
                      <span className="text-3xl font-black text-slate-900 leading-none block">{card.value}</span>
                      <span className="text-[10px] font-semibold text-slate-500 block leading-tight pt-1">{card.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Conversion funnel telemetry & Top referrers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Funnel card */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-indigo-650" />
                      Referral Conversion Pipeline Funnel
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { stage: "Invite Clicks (Opens)", val: analytics.referrals.clicks, width: "100%", color: "bg-blue-600" },
                        { stage: "Registrations (Created Accounts)", val: analytics.referrals.registrations, width: `${analytics.referrals.clicks > 0 ? (analytics.referrals.registrations / analytics.referrals.clicks) * 100 : 0}%`, color: "bg-amber-500" },
                        { stage: "Onboarding Completed", val: analytics.referrals.activations, width: `${analytics.referrals.registrations > 0 ? (analytics.referrals.activations / analytics.referrals.registrations) * 100 : 0}%`, color: "bg-emerald-500" },
                        { stage: "Premium Conversions", val: analytics.referrals.conversions, width: `${analytics.referrals.activations > 0 ? (analytics.referrals.conversions / analytics.referrals.activations) * 100 : 0}%`, color: "bg-indigo-650" }
                      ].map((step, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">{step.stage}</span>
                            <span className="text-slate-950 font-black">{step.val} ({step.width})</span>
                          </div>
                          <div className="h-3 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all", step.color)} style={{ width: step.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Ambassadors card */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-indigo-650" />
                      Highest Impact Campus Leaders
                    </h3>

                    <div className="space-y-4">
                      {analytics.topAmbassadors?.map((amb: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-slate-900">{amb.name}</h4>
                            <span className="text-[10px] font-semibold text-slate-550 block">{amb.college}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-600 block">{amb.referrals} Refers</span>
                            <span className="text-[9px] font-black text-indigo-655 block uppercase">Impact Score: {amb.impact}</span>
                          </div>
                        </div>
                      ))}

                      {(!analytics.topAmbassadors || analytics.topAmbassadors.length === 0) && (
                        <p className="text-slate-400 text-xs font-semibold text-center py-8">No campus leaders currently ranked.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Modal for Group Creation & Editing */}
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border border-slate-200 max-w-2xl w-full p-8 rounded-[2.5rem] shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 text-left"
              >
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                    {editingGroup ? "Edit Community Group" : "Create Community Group"}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4 text-xs font-bold text-slate-850">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Group Name *</label>
                      <input
                        type="text"
                        required
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. SDE Practice Loops"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Platform Link URL *</label>
                      <input
                        type="url"
                        required
                        value={groupLink}
                        onChange={(e) => setGroupLink(e.target.value)}
                        placeholder="e.g. https://chat.whatsapp.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Group Image / Logo URL</label>
                      <input
                        type="url"
                        value={groupImage}
                        onChange={(e) => setGroupImage(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/logo..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Group Banner / Card URL</label>
                      <input
                        type="url"
                        value={groupBanner}
                        onChange={(e) => setGroupBanner(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/card..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Category *</label>
                      <select
                        value={groupCategory}
                        onChange={(e) => setGroupCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 focus:outline-none focus:border-indigo-650 cursor-pointer"
                      >
                        {categoriesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Platform Type *</label>
                      <select
                        value={platformType}
                        onChange={(e) => setPlatformType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 focus:outline-none focus:border-indigo-650 cursor-pointer"
                      >
                        {platformsList.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Visibility</label>
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-855 focus:outline-none focus:border-indigo-650 cursor-pointer"
                      >
                        <option value="Public">Public (Discoverable)</option>
                        <option value="Private">Private (Members only)</option>
                        <option value="Unlisted">Unlisted (Secret link)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase tracking-widest text-[9px]">Verification Status Badge</label>
                      <select
                        value={verificationStatus}
                        onChange={(e) => setVerificationStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-855 focus:outline-none focus:border-indigo-650 cursor-pointer"
                      >
                        <option value="Verified">Verified Badge</option>
                        <option value="Official">Official Badge</option>
                        <option value="Partner Community">Partner Community Badge</option>
                        <option value="Student Managed">Student Managed Badge</option>
                        <option value="Private">Private Badge</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-550 uppercase tracking-widest text-[9px]">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Detail group focus, scheduling or targets details..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-650 font-sans font-medium"
                    />
                  </div>

                  {/* Locked and Lock criteria config options */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-650 uppercase tracking-wider">Progress Lock Gates Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-slate-650 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={unlockOnboardingCompleted}
                          onChange={(e) => setUnlockOnboardingCompleted(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Require Onboarding Finished</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-650 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={unlockResumeUploaded}
                          onChange={(e) => setUnlockResumeUploaded(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Require Resume Uploaded (Resume OS)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-550 uppercase tracking-widest text-[8px]">Min Profile Completeness % Required</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={unlockMinProfileCompletion}
                          onChange={(e) => setUnlockMinProfileCompletion(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none focus:border-indigo-650"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-550 uppercase tracking-widest text-[8px]">Min ATS Resume Score Required</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={unlockMinAtsScore}
                          onChange={(e) => setUnlockMinAtsScore(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none focus:border-indigo-650"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Pin / Feature Group (Pushes to top with badges)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="flex-grow py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-grow py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {saving ? "Saving Details..." : "Save Group"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
