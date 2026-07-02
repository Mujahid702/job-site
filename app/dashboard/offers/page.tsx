"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ChevronLeft,
  Briefcase,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Award,
  ChevronRight,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OfferComparisonPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  // Add Manual Offer Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newOffer, setNewOffer] = useState({
    applicationId: "",
    ctc: "",
    baseSalary: "",
    bonus: "",
    location: "",
    joiningDate: ""
  });

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch offers
      const res = await fetch("/api/placement/offers");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOffers(data.offers || []);
        }
      }

      // 2. Fetch applications (to select from when manually logging)
      const appRes = await fetch("/api/placement/intelligence");
      if (appRes.ok) {
        const intel = await appRes.json();
        if (intel.success && intel.data?.fitScores) {
          setApplications(intel.data.fitScores || []);
        }
      }
    } catch (err) {
      console.error("Failed to load offer comparison data:", err);
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
  }, []);

  const handleUpdateStatus = async (offerId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/placement/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, status: newStatus })
      });
      const data = await res.json();
      if (data.success && user) {
        await loadData(user.id);
      } else {
        alert(data.message || "Failed to update offer status.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newOffer.applicationId || !newOffer.ctc) return;
    setSubmitting(true);

    try {
      // Find company/role details from matched application selection
      const matchedApp = applications.find(a => a.id === newOffer.applicationId);
      if (!matchedApp) {
        alert("Selected application is invalid.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/placement/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: newOffer.applicationId,
          company: matchedApp.company,
          role: matchedApp.role,
          ctc: newOffer.ctc,
          baseSalary: newOffer.baseSalary || null,
          bonus: newOffer.bonus || null,
          location: newOffer.location || matchedApp.location || "Remote",
          joiningDate: newOffer.joiningDate || null,
          status: "Pending"
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewOffer({
          applicationId: "",
          ctc: "",
          baseSalary: "",
          bonus: "",
          location: "",
          joiningDate: ""
        });
        await loadData(user.id);
      } else {
        alert(data.message || "Failed to log manual offer.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper values
  const totalOffers = offers.length;
  const parseNum = (val: string) => {
    const m = (val || "").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  };
  const highestCtc = offers.length > 0 ? Math.max(...offers.map(o => parseNum(o.ctc))) : 0;
  const acceptedOffer = offers.find(o => o.status === "Accepted");

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        {/* Hero Banner Header */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-650 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
              <Award className="w-3.5 h-3.5 animate-pulse" />
              Compensation Comparison Suite
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none font-display">
              Offer Analytics Board
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Compare package values side-by-side, evaluate offer strength scores, and unlock AI negotiation blueprints.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log Manual Offer
          </button>
        </div>

        {/* Key Metrics Widgets */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Offers Cataloged</span>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalOffers}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Highest Package</span>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{highestCtc ? `${highestCtc} LPA` : "TBD"}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acceptance Status</span>
                <p className="text-xl font-black text-slate-850 mt-0.5 truncate">
                  {acceptedOffer ? `Accepted: ${acceptedOffer.company}` : "Awaiting Decision"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Telemetry Comparison Workspace */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Compiling offers data...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">No active offers detected</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Connect your Gmail Sync pipeline to automatically detect job offers, or click "Log Manual Offer" to catalog package details.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow"
            >
              Log An Offer Package
            </button>
          </div>
        ) : (
          /* Offers Grid list */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {offers.map((offer) => {
              const isAccepted = offer.status === "Accepted";
              const isDeclined = offer.status === "Declined";
              const isCounter = offer.status === "Counter-offered";

              return (
                <div
                  key={offer.id}
                  className={cn(
                    "bg-white rounded-[2.5rem] border shadow-md overflow-hidden transition-all flex flex-col justify-between h-[640px] text-left relative",
                    isAccepted ? "border-emerald-300 ring-2 ring-emerald-500/10" : "border-slate-200"
                  )}
                >
                  {/* Status Banner */}
                  <div className={cn(
                    "px-6 py-3.5 text-xs font-black uppercase tracking-widest text-center border-b flex justify-between items-center",
                    isAccepted ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                    isDeclined ? "bg-rose-50 border-rose-100 text-rose-700" :
                    isCounter ? "bg-amber-50 border-amber-100 text-amber-700" :
                    "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    <span>Offer Status: {offer.status}</span>
                    <div className="flex gap-2">
                      {!isAccepted && (
                        <button
                          onClick={() => handleUpdateStatus(offer.id, "Accepted")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Accept
                        </button>
                      )}
                      {!isDeclined && (
                        <button
                          onClick={() => handleUpdateStatus(offer.id, "Declined")}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Decline
                        </button>
                      )}
                      {!isCounter && !isAccepted && !isDeclined && (
                        <button
                          onClick={() => handleUpdateStatus(offer.id, "Counter-offered")}
                          className="px-2.5 py-1 bg-amber-550 hover:bg-amber-600 text-slate-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Counter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Header Details */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">{offer.company}</span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{offer.role}</h3>
                      <div className="flex gap-4 items-center text-[10px] font-bold text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {offer.location || "Remote"}
                        </span>
                        {offer.joining_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(offer.joining_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CTC Package</span>
                      <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{offer.ctc}</p>
                    </div>
                  </div>

                  {/* Details Grid & Scores */}
                  <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    {/* Package breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Base Salary</span>
                        <p className="text-sm font-black text-slate-850 mt-0.5">{offer.base_salary || "Not Specified"}</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Bonuses / Sign-on</span>
                        <p className="text-sm font-black text-slate-850 mt-0.5">{offer.bonus || "Not Specified"}</p>
                      </div>
                    </div>

                    {/* Gauges section */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Strength Gauge */}
                      <div className="p-4 bg-indigo-50/25 border border-indigo-100/40 rounded-3xl flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-lg font-black text-slate-805 tracking-tight">{offer.strength_score}%</p>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Offer Strength</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full" style={{ width: `${offer.strength_score}%` }} />
                        </div>
                      </div>

                      {/* Benchmark Score */}
                      <div className="p-4 bg-emerald-50/25 border border-emerald-100/40 rounded-3xl flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-lg font-black text-slate-805 tracking-tight">{offer.market_benchmark_score}%</p>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Market Benchmark</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-650 rounded-full" style={{ width: `${offer.market_benchmark_score}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* AI Suggestions Blueprint */}
                    {offer.negotiation_suggestions && offer.negotiation_suggestions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-100" />
                          AI Negotiation Strategy Suggestions
                        </h4>
                        <div className="space-y-2">
                          {offer.negotiation_suggestions.map((suggestion: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-start p-3 bg-indigo-50/15 border border-indigo-100/20 rounded-2xl">
                              <span className="w-4 h-4 bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-[9px] font-black text-indigo-700 shrink-0 mt-0.5">{idx + 1}</span>
                              <p className="text-[10px] font-semibold text-slate-700 leading-relaxed">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MANUAL OFFER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] w-full max-w-md overflow-hidden relative p-8 text-left"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Log Manual Offer
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Track offers received from your pipeline companies to perform analysis comparison.</p>
              </div>

              <form onSubmit={handleAddOfferSubmit} className="space-y-4">
                {/* Select Application */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Select Pipeline Job</label>
                  <select
                    required
                    value={newOffer.applicationId}
                    onChange={(e) => setNewOffer({ ...newOffer, applicationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">Choose an active application...</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.company} — {app.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CTC package */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">CTC Package (e.g. 12 LPA)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12 LPA, $110,000"
                    value={newOffer.ctc}
                    onChange={(e) => setNewOffer({ ...newOffer, ctc: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                  />
                </div>

                {/* Base and Bonus */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Base Salary</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 LPA"
                      value={newOffer.baseSalary}
                      onChange={(e) => setNewOffer({ ...newOffer, baseSalary: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Sign-on Bonus</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Lakhs"
                      value={newOffer.bonus}
                      onChange={(e) => setNewOffer({ ...newOffer, bonus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Location and Joining Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote, Bangalore"
                      value={newOffer.location}
                      onChange={(e) => setNewOffer({ ...newOffer, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Joining Date</label>
                    <input
                      type="date"
                      value={newOffer.joiningDate}
                      onChange={(e) => setNewOffer({ ...newOffer, joiningDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md mt-4"
                >
                  {submitting ? "Saving Offer..." : "Save Offer Details"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
