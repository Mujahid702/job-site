"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  ExternalLink,
  Info,
  Calendar,
  Send,
  Loader2,
  Lock,
  Unlock,
  Bookmark,
  Search,
  Award,
  Globe,
  QrCode,
  SlidersHorizontal,
  ThumbsUp,
  UserCheck,
  TrendingUp,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface GroupCard {
  id: string;
  group_name: string;
  group_description: string;
  group_category: string;
  platform_type: string;
  group_link: string;
  group_image: string;
  group_banner: string;
  group_status: string;
  visibility: string;
  display_order: number;
  featured: boolean;
  member_count: number;
  verification_status: string;
  isJoined: boolean;
  isSaved: boolean;
  isLocked: boolean;
  lockDetails: {
    requirements: string[];
    currentAts: number;
    minAts: number;
    currentCompletion: number;
    minCompletion: number;
    resumeUploaded: boolean;
    onboardingCompleted: boolean;
  };
}

interface EventCard {
  id: string;
  event_name: string;
  event_description: string;
  event_type: string;
  event_date: string;
  join_link: string;
  visibility: string;
  isRegistered: boolean;
  isBookmarked: boolean;
}

export default function CommunityHubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"discover" | "my-groups" | "referral" | "events" | "leaderboard" | "ambassador">("discover");
  
  // Data States
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [ambassador, setAmbassador] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Interaction/UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [unlockedOnly, setUnlockedOnly] = useState(false);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null);
  
  // Modal for locked communities
  const [lockModalGroup, setLockModalGroup] = useState<GroupCard | null>(null);
  
  // Submitting application states
  const [applyingAmbassador, setApplyingAmbassador] = useState(false);

  const supabase = createClient();

  const loadAllData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser) {
        // 1. Fetch community groups
        const groupsRes = await fetch("/api/growth/community");
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          if (data.success) setGroups(data.groups || []);
        }

        // 2. Fetch referrals stats
        const statsRes = await fetch("/api/growth/referrals");
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.success) setStats(data);
        }

        // 3. Fetch events
        const eventsRes = await fetch("/api/growth/events");
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          if (data.success) setEvents(data.events || []);
        }

        // 4. Fetch ambassador status
        const ambRes = await fetch("/api/growth/ambassadors");
        if (ambRes.ok) {
          const data = await ambRes.json();
          if (data.success) setAmbassador(data.ambassador);
        }

        // 5. Fetch leaderboard users
        const demoLeaderboard = [
          { name: "Siddharth Verma", college: "Google Candidate", points: 480, level: "Champion", streak: 45 },
          { name: "Rahul Sharma", college: "IBM Selected", points: 395, level: "Expert", streak: 28 },
          { name: "Neha Patel", college: "Accenture Grad", points: 290, level: "Mentor", streak: 15 },
          { name: "Amit Kumar", college: "TCS Scholar", points: 210, level: "Contributor", streak: 9 },
          { name: "Priya Rao", college: "Deloitte Aspirant", points: 185, level: "Contributor", streak: 7 }
        ];
        setLeaderboard(demoLeaderboard);
      }
    } catch (err) {
      console.error("Failed to load community page stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareGroup = (groupName: string, link: string) => {
    setSharingGroupId(groupName);
    const text = `🔥 Join the verified ${groupName} community for instant placement updates, internships leads, and prep roadmaps!\nJoin here: ${link}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
    setSharingGroupId(null);
  };

  const handleJoin = async (groupId: string, link: string) => {
    try {
      const res = await fetch("/api/growth/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGroups(groups.map(g => g.id === groupId ? { ...g, isJoined: true, member_count: data.nextCount } : g));
          window.open(link, "_blank");
        } else {
          alert(data.message || "Failed to join group.");
        }
      }
    } catch (err) {
      console.error("Join group error:", err);
    }
  };

  const handleLeave = async (groupId: string) => {
    try {
      const res = await fetch(`/api/growth/community?groupId=${groupId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGroups(groups.map(g => g.id === groupId ? { ...g, isJoined: false, member_count: data.nextCount } : g));
        }
      }
    } catch (err) {
      console.error("Leave group error:", err);
    }
  };

  const handleToggleSave = async (groupId: string, currentSaved: boolean) => {
    try {
      const res = await fetch("/api/growth/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, status: !currentSaved })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGroups(groups.map(g => g.id === groupId ? { ...g, isSaved: !currentSaved } : g));
        }
      }
    } catch (err) {
      console.error("Toggle save error:", err);
    }
  };

  const handleRegisterEvent = async (eventId: string, currentStatus: "Registered" | "Bookmarked" | "Unregistered", target: "Registered" | "Bookmarked") => {
    const nextStatus = currentStatus === target ? "Unregistered" : target;
    try {
      const res = await fetch("/api/growth/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: nextStatus })
      });
      if (res.ok) {
        setEvents(events.map(e => e.id === eventId ? {
          ...e,
          isRegistered: nextStatus === "Registered",
          isBookmarked: nextStatus === "Bookmarked"
        } : e));
      }
    } catch (err) {
      console.error("Event registration error:", err);
    }
  };

  const handleApplyAmbassador = async () => {
    setApplyingAmbassador(true);
    try {
      const res = await fetch("/api/growth/ambassadors", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAmbassador({ status: "Pending", referred_count: 0, community_impact_score: 0 });
          alert("Your Ambassador application has been submitted and is currently pending review.");
        } else {
          alert(data.error || "Failed to submit application.");
        }
      }
    } catch (err) {
      console.error("Ambassador application error:", err);
    } finally {
      setApplyingAmbassador(false);
    }
  };

  // Filter Categories & Platforms list
  const categories = ["All", ...Array.from(new Set(groups.map(g => g.group_category)))];
  const platforms = ["All", ...Array.from(new Set(groups.map(g => g.platform_type)))];

  // Apply filters
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.group_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.group_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.group_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || g.group_category === selectedCategory;
    const matchesPlatform = selectedPlatform === "All" || g.platform_type === selectedPlatform;
    const matchesVerified = !verifiedOnly || g.verification_status !== "None";
    const matchesFeatured = !featuredOnly || g.featured;
    const matchesUnlocked = !unlockedOnly || !g.isLocked;

    return matchesSearch && matchesCategory && matchesPlatform && matchesVerified && matchesFeatured && matchesUnlocked;
  });

  const joinedGroups = groups.filter(g => g.isJoined);
  const savedGroups = groups.filter(g => g.isSaved);

  const inviteShareText = stats 
    ? `🚀 Get SDE placement drives updates, ATS scan enhancers, roadmaps, and refer loops. Register with my invite link here:\n${stats.referralLink}`
    : "🚀 Join BuggedBrain Placement OS for placement drives and referral networks! https://buggedbrain.com";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Accessing Distributed Networks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left text-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        
        {/* Back Link navigation header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* HERO TITLE SECTION CARD */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              Community Growth OS 2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Growth Hub
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl leading-relaxed">
              Join verified placement communities, internship groups, hackathon networks, referral circles, and preparation hubs managed directly by the platform.
            </p>
          </div>
          
          {/* Tabs navigation */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 border border-slate-200 rounded-2xl">
            {[
              { id: "discover", label: "Discover", icon: Globe },
              { id: "my-groups", label: "My Groups", icon: Bookmark },
              { id: "referral", label: "Referrals", icon: Share2 },
              { id: "events", label: "Events Center", icon: Calendar },
              { id: "leaderboard", label: "Leaderboard", icon: Award },
              { id: "ambassador", label: "Ambassador OS", icon: UserCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === tab.id 
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

        {/* MAIN BODY VIEW RENDERER BASED ON ACTIVE TAB */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 1. DISCOVER TAB */}
            {activeTab === "discover" && (
              <div className="space-y-6">
                
                {/* Search and Advanced filter panel */}
                <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        placeholder="Search groups by category, title, platform, keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-650 focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="All">All Platforms</option>
                        {platforms.filter(p => p !== "All").map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-650 focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        {categories.filter(c => c !== "All").map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-slate-500">
                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Verified Channels Only</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Featured Only</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={unlockedOnly}
                        onChange={(e) => setUnlockedOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Hide Gated Groups</span>
                    </label>
                  </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map(group => (
                    <div 
                      key={group.id} 
                      className={cn(
                        "bg-white border rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all space-y-5 relative overflow-hidden group/card",
                        group.featured ? "border-amber-400" : "border-slate-200"
                      )}
                    >
                      {/* Featured badge */}
                      {group.featured && (
                        <div className="absolute top-0 right-0 bg-amber-450 text-slate-950 font-black text-[9px] uppercase tracking-wider py-1 px-4 rounded-bl-2xl flex items-center gap-1 shadow-sm z-10">
                          <Sparkles className="w-3 h-3" />
                          Featured
                        </div>
                      )}

                      {/* Banner image if available */}
                      {group.group_banner && (
                        <div className="h-24 -mx-6 -mt-6 mb-2 relative overflow-hidden shrink-0 border-b border-slate-100">
                          <img src={group.group_banner} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="space-y-4 text-left">
                        <div className="flex justify-between items-center pr-16">
                          <span className={cn(
                            "px-2.5 py-0.5 text-[8px] font-black uppercase rounded border tracking-wider",
                            group.platform_type === "WhatsApp" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : 
                            group.platform_type === "Telegram" ? "bg-blue-50 text-blue-700 border-blue-150" :
                            "bg-indigo-50 text-indigo-700 border-indigo-150"
                          )}>
                            {group.platform_type}
                          </span>
                          
                          {group.verification_status !== "None" && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">
                              {group.verification_status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start gap-3">
                          {group.group_image && (
                            <img src={group.group_image} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1 flex-grow">
                            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                              {group.group_name}
                              {group.isLocked && <Lock className="w-3.5 h-3.5 text-indigo-650" />}
                            </h3>
                            <p className="text-slate-550 text-[11px] font-bold leading-relaxed min-h-[50px]">
                              {group.group_description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100 flex flex-col justify-end">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{group.group_category}</span>
                          <span className="text-slate-800 flex items-center gap-1 font-black">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {group.member_count.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {group.isLocked ? (
                            <button
                              onClick={() => setLockModalGroup(group)}
                              className="flex-grow flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                            >
                              Unlock Group
                              <Lock className="w-3 h-3 text-indigo-650" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (group.isJoined) {
                                  handleLeave(group.id);
                                } else {
                                  handleJoin(group.id, group.group_link);
                                }
                              }}
                              className={cn(
                                "flex-grow flex items-center justify-center gap-1.5 py-2.5 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all border",
                                group.isJoined 
                                  ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200" 
                                  : "bg-slate-900 border-transparent text-white hover:bg-slate-800"
                              )}
                            >
                              {group.isJoined ? "Leave Group" : "Join Group"}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleSave(group.id, group.isSaved)}
                            className={cn(
                              "px-3 py-2.5 border rounded-xl cursor-pointer transition-all",
                              group.isSaved 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-650 shadow-sm" 
                                : "bg-white border-slate-250 text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <Bookmark className={cn("w-3.5 h-3.5", group.isSaved && "fill-current")} />
                          </button>

                          {!group.isLocked && (
                            <button
                              onClick={() => handleShareGroup(group.group_name, group.group_link)}
                              className="px-3 py-2.5 bg-white border border-slate-250 text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {groups.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-2">
                      <Users className="w-8 h-8 text-slate-450 mx-auto" />
                      <h3 className="text-base font-black text-slate-900">No Groups Available</h3>
                      <p className="text-slate-550 text-xs font-semibold">No community groups are available at the moment. Please check back later.</p>
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-2">
                      <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
                      <h3 className="text-base font-black text-slate-900">No communities match filters</h3>
                      <p className="text-slate-550 text-xs font-semibold">Reset platform/category filters or modify search terms to view active networks.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* 2. MY GROUPS TAB */}
            {activeTab === "my-groups" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                
                {/* Joined Communities */}
                <div className="space-y-4">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    Joined Communities ({joinedGroups.length})
                  </h2>

                  <div className="space-y-4">
                    {joinedGroups.map(group => (
                      <div key={group.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-sm">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-900">{group.group_name}</h3>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">{group.group_category} &bull; {group.platform_type}</p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={group.group_link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 hover:bg-slate-800"
                          >
                            Open Link
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleLeave(group.id)}
                            className="px-3 py-2 bg-red-50 border border-red-200 text-red-650 font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-red-50/50"
                          >
                            Leave
                          </button>
                        </div>
                      </div>
                    ))}

                    {joinedGroups.length === 0 && (
                      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                        You have not joined any community networks yet. Find and join prep circles in the Discover tab.
                      </div>
                    )}
                  </div>
                </div>

                {/* Saved Communities */}
                <div className="space-y-4">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-indigo-600 fill-current" />
                    Saved Communities ({savedGroups.length})
                  </h2>

                  <div className="space-y-4">
                    {savedGroups.map(group => (
                      <div key={group.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-sm">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1">
                            {group.group_name}
                            {group.isLocked && <Lock className="w-3 h-3 text-indigo-650" />}
                          </h3>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">{group.group_category} &bull; {group.platform_type}</p>
                        </div>
                        <div className="flex gap-2">
                          {group.isLocked ? (
                            <button
                              onClick={() => setLockModalGroup(group)}
                              className="px-4 py-2 bg-slate-100 text-indigo-700 border border-slate-200 font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 hover:bg-slate-200"
                            >
                              Unlock
                              <Lock className="w-3 h-3 text-indigo-650" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoin(group.id, group.group_link)}
                              className="px-4 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 hover:bg-slate-800"
                            >
                              Join Group
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleSave(group.id, true)}
                            className="px-3 py-2 border border-slate-250 text-slate-500 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          >
                            Unsave
                          </button>
                        </div>
                      </div>
                    ))}

                    {savedGroups.length === 0 && (
                      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                        Saved/bookmarked channels will be bookmarked here for offline reference.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 3. REFERRAL NETWORK TAB */}
            {activeTab === "referral" && (
              <div className="space-y-8 text-left">
                
                {/* Analytics summary row */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Invites Opened (Clicks)", value: stats?.clicksCount || 0, color: "text-blue-650" },
                    { label: "Signups Logged", value: stats?.joinedCount || 0, color: "text-amber-600" },
                    { label: "Activated Users", value: stats?.activatedCount || 0, color: "text-emerald-600" },
                    { label: "Premium Converted", value: stats?.convertedCount || 0, color: "text-indigo-650" },
                    { label: "Viral Loop Conversion", value: `${stats?.activationRate || 0}%`, color: "text-purple-650" },
                    { label: "Total Referral XP Earned", value: stats?.referralScore || 0, color: "text-amber-500" }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">{stat.label}</span>
                      <span className={cn("text-3xl font-black leading-none block", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Conversion lifecycle details & invite actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Copy & Share actions */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-650" />
                        Invite Friends & Earn Rewards
                      </h3>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        Share SDE opportunities and placement engines. Receive automatic XP bumps based on milestones (signup, onboarding, scanning resume, applying).
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referral Link</span>
                            <p className="text-xs font-bold text-slate-700 truncate">{stats?.referralLink || "Loading..."}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(stats?.referralLink || "", "link")}
                            className={cn(
                              "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer",
                              copiedLink 
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedLink ? "Copied Link!" : "Copy Invite Link"}
                          </button>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Invite Code</span>
                            <p className="text-base font-black text-slate-900">{stats?.referralCode || "..."}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(stats?.referralCode || "", "code")}
                            className={cn(
                              "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer",
                              copiedCode 
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedCode ? "Copied Code!" : "Copy Invite Code"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleShareGroup("general_invite", stats?.referralLink || inviteShareText)}
                      className="flex items-center justify-center gap-2 py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md w-full transition-all mt-4"
                    >
                      <Share2 className="w-4 h-4 text-emerald-350" />
                      Share Link on WhatsApp
                    </button>
                  </div>

                  {/* QR Code Card */}
                  <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between items-center text-center space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900">Your Referral QR Code</h3>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Scan to register</p>
                    </div>

                    {/* Styled Mock SVG QR Code */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm inline-block">
                      <svg width="150" height="150" viewBox="0 0 100 100" className="text-slate-900 fill-current">
                        <rect x="0" y="0" width="25" height="25" />
                        <rect x="5" y="5" width="15" height="15" fill="white" />
                        <rect x="8" y="8" width="9" height="9" />
                        
                        <rect x="75" y="0" width="25" height="25" />
                        <rect x="80" y="5" width="15" height="15" fill="white" />
                        <rect x="83" y="8" width="9" height="9" />

                        <rect x="0" y="75" width="25" height="25" />
                        <rect x="5" y="80" width="15" height="15" fill="white" />
                        <rect x="8" y="83" width="9" height="9" />

                        <rect x="35" y="35" width="10" height="10" />
                        <rect x="55" y="35" width="15" height="10" />
                        <rect x="35" y="55" width="20" height="15" />
                        
                        <rect x="75" y="75" width="10" height="10" />
                        <rect x="85" y="65" width="15" height="10" />
                        <rect x="65" y="85" width="10" height="15" />
                        <rect x="85" y="85" width="15" height="15" />
                      </svg>
                    </div>

                    <p className="text-slate-500 text-[10px] leading-snug max-w-[180px] font-semibold">
                      Friends can scan this QR code directly to accept your invitation instantly.
                    </p>
                  </div>

                </div>

                {/* Reward Engine Configuration List */}
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-650" />
                    Configured Reward Milestones Rules
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { action: "Account Registered", xp: "10 XP", desc: "Awarded when code matches signup" },
                      { action: "Onboarding Finished", xp: "20 XP", desc: "Awarded upon profile onboarding setup" },
                      { action: "Resume Uploaded", xp: "30 XP", desc: "Verified scan creation on Resume OS" },
                      { action: "First ATS Scan", xp: "15 XP", desc: "Candidate runs their first resume check" },
                      { action: "First Application", xp: "25 XP", desc: "Friend tracks application in CRM" },
                      { action: "Premium Upgrade", xp: "100 XP", desc: "Awarded upon premium unlock" }
                    ].map((rule, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 flex flex-col justify-between text-left shadow-sm">
                        <div>
                          <span className="text-[10px] font-black text-indigo-650 block leading-tight">{rule.action}</span>
                          <span className="text-slate-400 text-[9px] block leading-tight mt-1 font-semibold">{rule.desc}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 leading-none block mt-3">{rule.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 4. EVENTS CENTER TAB */}
            {activeTab === "events" && (
              <div className="space-y-6 text-left">
                <div className="text-left">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Community Events & Campaigns</h2>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Participate in workshops, hackathons, and mock interview drives.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(event => (
                    <div key={event.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded border border-indigo-150 bg-indigo-50 text-indigo-700 tracking-wider">
                            {event.event_type}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            {new Date(event.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">{event.event_name}</h3>
                          <p className="text-slate-550 text-xs leading-relaxed font-semibold">{event.event_description}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleRegisterEvent(event.id, event.isRegistered ? "Registered" : event.isBookmarked ? "Bookmarked" : "Unregistered", "Registered")}
                          className={cn(
                            "flex-grow py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer",
                            event.isRegistered 
                              ? "bg-slate-100 border-slate-200 text-emerald-700" 
                              : "bg-slate-900 border-transparent text-white hover:bg-slate-800"
                          )}
                        >
                          {event.isRegistered ? "Registered" : "Register Now"}
                        </button>

                        <button
                          onClick={() => handleRegisterEvent(event.id, event.isRegistered ? "Registered" : event.isBookmarked ? "Bookmarked" : "Unregistered", "Bookmarked")}
                          className={cn(
                            "px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all",
                            event.isBookmarked 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-650" 
                              : "bg-white border-slate-250 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", event.isBookmarked && "fill-current")} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {events.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                      <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <h3 className="text-base font-black text-slate-900">No upcoming events</h3>
                      <p className="text-slate-500 text-xs font-semibold">Platform administrator hasn't scheduled any webinars or hackathons.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. LEADERBOARD TAB */}
            {activeTab === "leaderboard" && (
              <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                      <Award className="w-6 h-6 text-indigo-650" />
                      Community Leaderboard
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold">Top placement performers, referrers, and active network advocates.</p>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-550 uppercase tracking-widest">
                          <th className="py-4 px-6 text-center w-16">Rank</th>
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Badges & Category</th>
                          <th className="py-4 px-6 text-center w-24">Streak</th>
                          <th className="py-4 px-6 text-right w-28">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((member, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <td className="py-4 px-6 text-center font-black text-lg">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                            </td>
                            <td className="py-4 px-6 font-black text-slate-800">
                              {member.name}
                              <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">{member.college}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                                {member.level}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-black text-amber-600">
                              {member.streak} Days
                            </td>
                            <td className="py-4 px-6 text-right font-black text-slate-900 text-lg">
                              {member.points} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 6. AMBASSADOR TAB */}
            {activeTab === "ambassador" && (
              <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] text-center shadow-sm space-y-6">
                  <div className="max-w-xl mx-auto space-y-3">
                    <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <UserCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Placement Ambassador Program</h2>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-md mx-auto">
                      Lead the placement network in your college campus. Help peers discover placement prep resources, coordinate events, and secure referral pipelines.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-6 max-w-2xl mx-auto">
                    {!ambassador && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 text-left shadow-sm">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Perks & Milestones:</h4>
                          <ul className="text-slate-500 text-xs space-y-2 list-disc pl-5 font-semibold leading-relaxed">
                            <li>Verified <strong>Ambassador Gold Badge</strong> next to profile feed.</li>
                            <li>Direct access to VIP employee referral directory lists.</li>
                            <li>Priority mock interview allocations with Google, Amazon, and Deloitte mentors.</li>
                            <li>2x multiplier on invite registrations XP.</li>
                          </ul>
                        </div>

                        <button
                          onClick={handleApplyAmbassador}
                          disabled={applyingAmbassador}
                          className="px-8 py-4 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md w-full md:w-auto transition-all"
                        >
                          {applyingAmbassador ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                          Apply to represent your campus
                        </button>
                      </div>
                    )}

                    {ambassador && ambassador.status === "Pending" && (
                      <div className="p-6 bg-slate-50 border border-amber-300 rounded-2xl inline-flex flex-col items-center space-y-3 shadow-sm">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-250">
                          Application Pending Review
                        </span>
                        <p className="text-slate-550 text-xs font-semibold leading-relaxed max-w-md">
                          Your application to join the Placement Ambassador loop is received. Review takes 48 hours. We will email you onboarding links upon approval.
                        </p>
                      </div>
                    )}

                    {ambassador && ambassador.status === "Approved" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center shadow-sm space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Referred Count</span>
                            <span className="text-2xl font-black text-slate-800">{ambassador.referred_count}</span>
                          </div>
                          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center shadow-sm space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Community Impact Score</span>
                            <span className="text-2xl font-black text-indigo-650">{ambassador.community_impact_score}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl font-bold text-xs shadow-sm">
                          🥇 You are a verified Placement Ambassador. Keep pushing referrals to increase your impact!
                        </div>
                      </div>
                    )}

                    {ambassador && ambassador.status === "Rejected" && (
                      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center shadow-sm">
                        <p className="text-red-500 text-xs font-bold uppercase tracking-wider">Application Declined</p>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-md mt-1 mx-auto">
                          Unfortunately, your application does not meet the campus representation limits at this time. You can apply again next term.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

      {/* Lock unlock details dialog */}
      <AnimatePresence>
        {lockModalGroup && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl relative space-y-6 text-left"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{lockModalGroup.group_name}</h3>
                <span className="inline-block text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Locked Placement Channel
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 text-left">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 pb-2">Unlock Criteria Requirements:</p>
                
                <div className="space-y-2.5 font-bold text-xs text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Onboarding completed:</span>
                    <span className="flex items-center gap-1 font-black">
                      {lockModalGroup.lockDetails.onboardingCompleted ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-red-500">Not Completed</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Resume Uploaded (Resume OS):</span>
                    <span className="flex items-center gap-1 font-black">
                      {lockModalGroup.lockDetails.resumeUploaded ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-red-500">No Resume</span>
                      )}
                    </span>
                  </div>

                  {lockModalGroup.lockDetails.minCompletion > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Profile completeness ({lockModalGroup.lockDetails.minCompletion}% required):</span>
                      <span className="flex items-center gap-1 font-black">
                        {lockModalGroup.lockDetails.currentCompletion >= lockModalGroup.lockDetails.minCompletion ? (
                          <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-4 h-4 inline" /> {lockModalGroup.lockDetails.currentCompletion}%</span>
                        ) : (
                          <span className="text-red-500">{lockModalGroup.lockDetails.currentCompletion}%</span>
                        )}
                      </span>
                    </div>
                  )}

                  {lockModalGroup.lockDetails.minAts > 0 && (
                    <div className="flex justify-between items-center">
                      <span>ATS Resume Score ({lockModalGroup.lockDetails.minAts} required):</span>
                      <span className="flex items-center gap-1 font-black">
                        {lockModalGroup.lockDetails.currentAts >= lockModalGroup.lockDetails.minAts ? (
                          <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-4 h-4 inline" /> {lockModalGroup.lockDetails.currentAts}%</span>
                        ) : (
                          <span className="text-red-500">{lockModalGroup.lockDetails.currentAts}%</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLockModalGroup(null)}
                  className="flex-grow py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all border border-slate-200"
                >
                  Close
                </button>
                
                {!lockModalGroup.lockDetails.resumeUploaded ? (
                  <Link
                    href="/dashboard/placement-readiness"
                    className="flex-grow py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow hover:bg-slate-800"
                  >
                    Upload Resume
                  </Link>
                ) : lockModalGroup.lockDetails.currentCompletion < lockModalGroup.lockDetails.minCompletion ? (
                  <Link
                    href="/dashboard/profile"
                    className="flex-grow py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow hover:bg-slate-800"
                  >
                    Complete Profile
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/placement-readiness"
                    className="flex-grow py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow hover:bg-slate-800"
                  >
                    Boost ATS Score
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
