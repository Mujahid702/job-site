"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Send, 
  Plus, 
  BarChart2, 
  TrendingUp, 
  Users, 
  Check, 
  Trash2, 
  Clock, 
  Loader2, 
  Sparkles,
  Settings,
  Mail,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Campaign {
  id: string;
  title: string;
  type: "Placement Drives" | "Referral Campaigns" | "Hackathons" | "Community Growth" | "Premium Upsells";
  status: "Draft" | "Scheduled" | "Sent";
  message_template: string;
  scheduled_at: string | null;
  sent_at: string | null;
  target_group: string;
  created_at: string;
  campaign_analytics?: {
    id: string;
    sent_count: number;
    click_count: number;
    join_count: number;
    registration_count: number;
    application_count: number;
    conversion_count: number;
  };
}

export default function AdminCampaignManagerPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Campaign["type"]>("Placement Drives");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const supabase = createClient();

  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/growth/campaigns");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCampaigns(data.campaigns || []);
        }
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!title.trim() || !messageTemplate.trim()) {
      setFormError("Title and Message Template are required.");
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/growth/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          messageTemplate,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          targetGroup
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setTitle("");
        setMessageTemplate("");
        setScheduledAt("");
        setTargetGroup("all");
        await loadCampaigns();
      } else {
        setFormError(data.message || "Failed to create campaign.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Server error occurred.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTriggerBroadcast = async (campaignId: string) => {
    setDispatchingId(campaignId);
    try {
      const res = await fetch(`/api/growth/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Broadcast sent successfully! Mock CTR statistics populated.");
        await loadCampaigns();
      } else {
        alert(data.message || "Failed to trigger broadcast.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/growth/campaigns/${campaignId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadCampaigns();
      } else {
        alert(data.message || "Failed to delete campaign.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aggregates dashboard stats
  const sentCampaigns = campaigns.filter(c => c.status === "Sent");
  const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.campaign_analytics?.sent_count || 0), 0);
  const totalClicks = sentCampaigns.reduce((acc, c) => acc + (c.campaign_analytics?.click_count || 0), 0);
  const totalConversions = sentCampaigns.reduce((acc, c) => acc + (c.campaign_analytics?.conversion_count || 0), 0);
  const avgCtr = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;
  const avgConversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Loading campaigns dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Back Link navigation header */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin Control
        </Link>

        {/* HERO TITLE SECTION CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Send className="w-3.5 h-3.5" />
              WhatsApp Campaign Manager
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Broadcast Engine
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Create, target, schedule, and evaluate marketing and placement drives campaign templates distributed over student channels.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all shrink-0 w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

        {/* GLOBAL CAMPAIGNS TELEMETRY SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Dispatched", value: totalSent.toLocaleString(), desc: "Messages delivered" },
            { label: "Aggregate CTR", value: `${avgCtr}%`, desc: "Avg campaign click rate" },
            { label: "Total Conversions", value: totalConversions.toLocaleString(), desc: "Registered referrals" },
            { label: "Conversion Rate", value: `${avgConversionRate}%`, desc: "Clicks to action loop" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{item.label}</span>
              <div className="space-y-0.5">
                <p className="text-3xl font-black text-slate-900 leading-none">{item.value}</p>
                <span className="text-[10px] text-slate-400 font-semibold block">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CAMPAIGNS HISTORY LIST DIRECTORY */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center w-24">Sends</th>
                  <th className="px-6 py-4 text-center w-24">Clicks</th>
                  <th className="px-6 py-4 text-center w-24">Conversions</th>
                  <th className="px-6 py-4 text-center w-24">CTR</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-bold text-slate-650">
                {campaigns.map((camp) => {
                  const ctr = camp.campaign_analytics?.sent_count 
                    ? Math.round((camp.campaign_analytics.click_count / camp.campaign_analytics.sent_count) * 100)
                    : 0;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-800 text-sm block">{camp.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-xs">{camp.message_template}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500">{camp.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border",
                          camp.status === "Sent" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : 
                          camp.status === "Scheduled" ? "bg-blue-50 text-blue-700 border-blue-150" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        )}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-800 font-black">{camp.campaign_analytics?.sent_count || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-850">{camp.campaign_analytics?.click_count || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-850">{camp.campaign_analytics?.conversion_count || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-indigo-650 font-black">{ctr}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {camp.status !== "Sent" && (
                            <button
                              onClick={() => handleTriggerBroadcast(camp.id)}
                              disabled={dispatchingId === camp.id}
                              className="px-3 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {dispatchingId === camp.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer border border-rose-150"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      No broadcast campaigns available. Create a template to initialize logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE CAMPAIGN SLIDE OUT DIALOG MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6 overflow-hidden relative"
            >
              <div className="text-left space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5.5 h-5.5 text-indigo-500 fill-indigo-50" />
                  Create Broadcast
                </h3>
                <p className="text-slate-500 text-xs font-semibold">
                  Specify details to register a new campaigns template.
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Placement Drive SDE Infosys"
                    className="w-full p-3 bg-slate-50 border border-slate-250 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Campaign Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                    >
                      <option value="Placement Drives">Placement Drives</option>
                      <option value="Referral Campaigns">Referral Campaigns</option>
                      <option value="Hackathons">Hackathons</option>
                      <option value="Community Growth">Community Growth</option>
                      <option value="Premium Upsells">Premium Upsells</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Target Group</label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                    >
                      <option value="all">All Registered</option>
                      <option value="placement_active">Placement Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Template</label>
                  <textarea
                    required
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={4}
                    placeholder="🚀 Hi SDE candidates! A new hiring drive has been unlocked..."
                    className="w-full p-3 bg-slate-50 border border-slate-250 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Schedule Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-250 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Campaign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
