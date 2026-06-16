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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface GroupCard {
  id: string;
  name: string;
  description: string;
  platform: "WhatsApp" | "Telegram" | "Discord";
  link: string;
  member_count: number;
  activity_status: string;
  category: string;
}

export default function CommunityHubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sharingIndex, setSharingIndex] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser) {
          // Fetch groups
          const groupRes = await fetch("/api/growth/community");
          if (groupRes.ok) {
            const data = await groupRes.json();
            if (data.success) setGroups(data.groups || []);
          }

          // Fetch referrals stats
          const statsRes = await fetch("/api/growth/referrals");
          if (statsRes.ok) {
            const data = await statsRes.json();
            if (data.success) setStats(data);
          }
        }
      } catch (err) {
        console.error("Failed to load community page stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

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

  const handleShareWhatsApp = async (shareTarget: string, text: string, type = "community") => {
    setSharingIndex(shareTarget);
    try {
      // 1. Log share event
      await fetch("/api/growth/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType: type,
          shareTarget,
          metadata: { text }
        })
      });

      // 2. Open WhatsApp Web / App share url
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");

      // 3. Refresh referrals stats in UI
      if (user) {
        const statsRes = await fetch("/api/growth/referrals");
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.success) setStats(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSharingIndex(null);
    }
  };

  const inviteShareText = stats 
    ? `🚀 Just found a platform that gives SDE Placement Drives, ATS scan checks, Resume Enhancers, Roadmaps, and a Referral Network. Join me here:\n${stats.referralLink}`
    : "🚀 Join BuggedBrain Placement OS for drives, ATS scanner and roadmaps! https://buggedbrain.com";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading networking channels...</p>
      </div>
    );
  }

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
              WhatsApp Growth Engine
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Placement Networks
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Connect with fellow placement candidates, join dedicated updates loops, and share resources to drive viral community growth.
            </p>
          </div>
        </div>

        {/* TOP LEVEL GRID: SHARING SYSTEM & STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* VIRAL SHARE CONSOLE CARD */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Invite Friends & Earn XP
              </h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Copy your unique invite link or dispatch it directly on WhatsApp. Earn XP milestones and increase your Placement Readiness ranking when friends register and complete onboarding!
              </p>

              {/* Share Box displays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referral Link</span>
                    <p className="text-xs font-bold text-slate-700 truncate">{stats?.referralLink || "Loading link..."}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(stats?.referralLink || "", "link")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer",
                      copiedLink 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
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
                    <p className="text-base font-black text-slate-900 tracking-tight">{stats?.referralCode || "..."}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(stats?.referralCode || "", "code")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer",
                      copiedCode 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
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
              onClick={() => handleShareWhatsApp("whatsapp_general_invite", inviteShareText, "invite")}
              disabled={sharingIndex === "whatsapp_general_invite"}
              className="flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all w-full"
            >
              {sharingIndex === "whatsapp_general_invite" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 text-emerald-400" />
              )}
              Share Invite on WhatsApp
            </button>
          </div>

          {/* REFERRALS DASHBOARD CARD */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Referral Telemetry
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Invites Sent", value: stats?.invitesSent || 0 },
                { label: "Joined", value: stats?.joinedCount || 0 },
                { label: "Activated", value: stats?.activatedCount || 0 },
                { label: "Converted", value: stats?.convertedCount || 0 }
              ].map((stat, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between h-20">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                  <span className="text-2xl font-black text-slate-900 leading-none">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Activation Loop Rate:</span>
                <span>{stats?.activationRate || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-650 rounded-full" style={{ width: `${stats?.activationRate || 0}%` }} />
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 2: CHAT NETWORK CHANNELS */}
        <div className="space-y-6">
          <div className="text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Networking Groups</h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">Join loops directly to sync alerts, SDE hackathons, and mock interview preparations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "px-2.5 py-0.5 text-[8px] font-black uppercase rounded border tracking-wider",
                      group.platform === "WhatsApp" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : 
                      group.platform === "Telegram" ? "bg-blue-50 text-blue-700 border-blue-150" :
                      "bg-indigo-50 text-indigo-700 border-indigo-150"
                    )}>
                      {group.platform}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">
                      {group.activity_status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{group.name}</h3>
                    <p className="text-slate-500 text-[11px] font-bold leading-relaxed min-h-[48px]">{group.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 flex flex-col">
                  <div className="flex justify-between items-center text-xs font-black text-slate-400">
                    <span>Members count:</span>
                    <span className="text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {group.member_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={group.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => fetch("/api/growth/share", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ shareType: "community_join", shareTarget: group.name })
                      }).catch(console.error)}
                      className="flex-grow flex items-center justify-center gap-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                    >
                      Join Group
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleShareWhatsApp(
                        group.name, 
                        `🔥 Hey! Join the ${group.name} group on ${group.platform} for placement updates, internships, and SDE networking:\n${group.link}`
                      )}
                      disabled={sharingIndex === group.name}
                      className="px-3 py-2.5 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      {sharingIndex === group.name ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
