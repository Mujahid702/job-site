"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Trash2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackedApplication {
  id: string;
  company: string;
  role: string;
  salary: string;
  status: "Applied" | "OA Cleared" | "Interview Cleared" | "Offer Received";
  dateAdded: string;
  lastUpdated: string;
}

const DEFAULT_APPLICATIONS: TrackedApplication[] = [
  {
    id: "app-1",
    company: "Google",
    role: "Software Engineer",
    salary: "$120k - $140k",
    status: "Interview Cleared",
    dateAdded: "2026-05-15",
    lastUpdated: "2026-06-02"
  },
  {
    id: "app-2",
    company: "IBM",
    role: "AI Developer",
    salary: "$90k - $110k",
    status: "OA Cleared",
    dateAdded: "2026-05-20",
    lastUpdated: "2026-05-30"
  },
  {
    id: "app-3",
    company: "Amazon",
    role: "Frontend Engineer",
    salary: "$110k - $130k",
    status: "Applied",
    dateAdded: "2026-06-01",
    lastUpdated: "2026-06-01"
  }
];

export default function SuccessTrackerOS() {
  const [apps, setApps] = useState<TrackedApplication[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("placement_success_tracking_applications");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return DEFAULT_APPLICATIONS;
  });

  // New Application inputs
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newStatus, setNewStatus] = useState<TrackedApplication["status"]>("Applied");

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("placement_success_tracking_applications", JSON.stringify(apps));
  }, [apps]);

  // Sync back to CRM if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCrm = localStorage.getItem("placement_crm_applications");
      if (storedCrm) {
        try {
          const parsedCrm = JSON.parse(storedCrm);
          // Check if we need to sync applications that don't exist in CRM or update them
          let modified = false;
          const updatedCrm = [...parsedCrm];

          apps.forEach(app => {
            const index = updatedCrm.findIndex((c: { company: string; role: string; status: string; id?: string | number }) => c.company === app.company && c.role === app.role);
            const crmStatus = app.status === "Offer Received" ? "Offer Received" :
                              app.status === "Interview Cleared" ? "Interview Cleared" :
                              app.status === "OA Cleared" ? "Assessment Cleared" : "Applied";
            
            if (index >= 0) {
              if (updatedCrm[index].status !== crmStatus) {
                updatedCrm[index].status = crmStatus;
                modified = true;
              }
            } else {
              updatedCrm.push({
                id: app.id,
                company: app.company,
                role: app.role,
                salary: app.salary,
                status: crmStatus,
                date: app.dateAdded
              });
              modified = true;
            }
          });

          if (modified) {
            localStorage.setItem("placement_crm_applications", JSON.stringify(updatedCrm));
          }
        } catch {}
      }
    }
  }, [apps]);

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    const newApp: TrackedApplication = {
      id: `app-${Date.now()}`,
      company: newCompany,
      role: newRole,
      salary: newSalary || "N/A",
      status: newStatus,
      dateAdded: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0]
    };

    setApps([newApp, ...apps]);
    setNewCompany("");
    setNewRole("");
    setNewSalary("");
    setNewStatus("Applied");
    alert(`Added tracked application for ${newCompany}!`);
  };

  const handleUpdateStatus = (id: string, status: TrackedApplication["status"]) => {
    setApps(apps.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status,
          lastUpdated: new Date().toISOString().split("T")[0]
        };
      }
      return app;
    }));
  };

  const handleDeleteApp = (id: string) => {
    if (confirm("Are you sure you want to delete this application log?")) {
      setApps(apps.filter(app => app.id !== id));
    }
  };

  // Diagnostics & Probabilities math formulas
  const calculateMetrics = () => {
    let atsScore = 75;
    if (typeof window !== "undefined") {
      atsScore = Number(localStorage.getItem("ats_score") || "75");
    }

    const hasOffer = apps.some(app => app.status === "Offer Received");
    
    // Placement Probability
    let placementProb = 30; // base probability
    placementProb += (atsScore - 50) * 0.4; // ATS contribution (up to 20%)
    placementProb += Math.min(apps.length * 4, 20); // Application volume (up to 20%)
    
    const oaClearedCount = apps.filter(app => ["OA Cleared", "Interview Cleared", "Offer Received"].includes(app.status)).length;
    placementProb += Math.min(oaClearedCount * 5, 15); // OA cleared contribution (up to 15%)
    
    const interviewClearedCount = apps.filter(app => ["Interview Cleared", "Offer Received"].includes(app.status)).length;
    placementProb += Math.min(interviewClearedCount * 8, 15); // Interview cleared contribution (up to 15%)
    
    if (hasOffer) {
      placementProb = 100;
    }

    placementProb = Math.max(10, Math.min(Math.round(placementProb), 100));

    // Offer Probability (Average across active/interview cleared applications)
    let offerProb = 15; // default applied base
    if (apps.length > 0) {
      const totalScore = apps.reduce((sum, app) => {
        if (app.status === "Offer Received") return sum + 100;
        if (app.status === "Interview Cleared") return sum + 75;
        if (app.status === "OA Cleared") return sum + 45;
        return sum + 15;
      }, 0);
      offerProb = Math.round(totalScore / apps.length);
    }
    if (hasOffer) {
      offerProb = 100;
    }

    // Average Time to Placement (derived using placement readiness indicators)
    const timeToPlacement = Math.max(15, Math.round(90 - (placementProb * 0.6)));

    return {
      placementProb,
      offerProb,
      timeToPlacement
    };
  };

  const metrics = calculateMetrics();

  // Funnel calculations
  const funnelCount = {
    applied: apps.length,
    oa: apps.filter(app => ["OA Cleared", "Interview Cleared", "Offer Received"].includes(app.status)).length,
    interview: apps.filter(app => ["Interview Cleared", "Offer Received"].includes(app.status)).length,
    offer: apps.filter(app => app.status === "Offer Received").length
  };

  // Custom gap diagnostic recommendation
  const getSuccessRecommendations = () => {
    const recommendations = [];
    if (funnelCount.applied < 4) {
      recommendations.push("Your application funnel is narrow. Apply to at least 2 more roles using JD Matcher to increase visibility volume.");
    }
    if (funnelCount.applied > 0 && funnelCount.oa === 0) {
      recommendations.push("OA transition rate is low. Practice MNC Aptitude and SQL tests inside Company Preparation OS.");
    }
    if (funnelCount.oa > 0 && funnelCount.interview === 0) {
      recommendations.push("Interview conversion rate is lower than optimal. Consider scheduling a mock session with Amazon Recruiter Arnav Gupta inside Mentorship OS.");
    }
    return recommendations;
  };

  const recommendationsList = getSuccessRecommendations();

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Title Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <TrendingUp className="w-3.5 h-3.5" />
          Success & Probability OS
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
          Success Tracker OS
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-xl">
          Track interview clearing milestones, model pipeline conversions, and display real-time placement probability metrics to address preparation bottlenecks.
        </p>
      </div>

      {/* SVG Gauges and Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Placement Probability SVG ring */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Placement Probability</span>
            <p className="text-xs text-slate-450 font-bold max-w-[130px] mt-1">Odds of landing at least one placement offer.</p>
          </div>
          
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
              <circle cx="48" cy="48" r="38" className="text-emerald-500" strokeWidth="8" stroke="currentColor" fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - metrics.placementProb / 100)} 
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-slate-900">{metrics.placementProb}%</span>
          </div>
        </div>

        {/* Offer Probability SVG ring */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Offer Probability</span>
            <p className="text-xs text-slate-450 font-bold max-w-[130px] mt-1">Average conversion score across active applications.</p>
          </div>
          
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="38" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
              <circle cx="48" cy="48" r="38" className="text-indigo-500" strokeWidth="8" stroke="currentColor" fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - metrics.offerProb / 100)} 
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-black text-slate-900">{metrics.offerProb}%</span>
          </div>
        </div>

        {/* Estimated Days to Placement */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between gap-6 shadow-md">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Time to Placement</span>
            <p className="text-xs text-slate-400 font-bold max-w-[130px] mt-1">Estimated calendar days to secure an offer letter.</p>
          </div>
          <div className="text-center shrink-0">
            <strong className="text-4xl font-black text-white font-display block">~{metrics.timeToPlacement}</strong>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Days Estimated</span>
          </div>
        </div>

      </div>

      {/* Main Content Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT CARD: Add applications and logs list */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm space-y-8">
          
          {/* Add Tracker Log */}
          <form onSubmit={handleAddApplication} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 p-6 border border-slate-200 rounded-2xl">
            <div className="md:col-span-4">
              <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Target Company</label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="E.g. Microsoft"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Target Role</label>
              <input
                type="text"
                required
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="E.g. AI Engineer"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1">Salary Range</label>
              <input
                type="text"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="E.g. $110k"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-650 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Log Job</span>
              </button>
            </div>
          </form>

          {/* Active Job Tracker List */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800">Tracked Applications Funnel Log</h3>
            
            <div className="space-y-3">
              {apps.map(app => (
                <div key={app.id} className="border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/20 hover:border-emerald-200 transition-colors">
                  <div>
                    <div className="flex gap-2 items-center">
                      <strong className="text-sm font-black text-slate-800">{app.company}</strong>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">({app.salary})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">Role: {app.role} • Updated: {app.lastUpdated}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Picker Selector buttons */}
                    <div className="flex gap-1 border border-slate-200 bg-white p-1 rounded-xl shadow-inner">
                      {(["Applied", "OA Cleared", "Interview Cleared", "Offer Received"] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateStatus(app.id, st)}
                          className={cn(
                            "px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                            app.status === st
                              ? "bg-slate-900 text-white"
                              : "text-slate-450 hover:bg-slate-50"
                          )}
                        >
                          {st === "Offer Received" ? "Offer" : st.replace(" Cleared", "")}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}

              {apps.length === 0 && (
                <div className="p-12 text-center text-xs font-bold text-slate-405 border border-dashed border-slate-200 rounded-[2rem]">
                  No job applications active. Use the generator log form to add your first job card tracker.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT CARD: Conversion funnels and diagnostic recommendations */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Funnel Dropoff Chart widget */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Application Stage Funnel</strong>
            
            <div className="space-y-4">
              {[
                { stage: "Applied Volume", count: funnelCount.applied, color: "bg-slate-500", percent: 100 },
                { stage: "OA Cleared", count: funnelCount.oa, color: "bg-indigo-500", percent: funnelCount.applied > 0 ? Math.round((funnelCount.oa / funnelCount.applied) * 100) : 0 },
                { stage: "Interview Cleared", count: funnelCount.interview, color: "bg-pink-500", percent: funnelCount.oa > 0 ? Math.round((funnelCount.interview / funnelCount.oa) * 100) : 0 },
                { stage: "Offer Received", count: funnelCount.offer, color: "bg-emerald-500", percent: funnelCount.interview > 0 ? Math.round((funnelCount.offer / funnelCount.interview) * 100) : 0 }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>{item.stage}</span>
                    <span>{item.count} ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", item.color)}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations checklist panel */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-4">
            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Copilot Funnel Advice</strong>
            
            <div className="space-y-3">
              {recommendationsList.length > 0 ? (
                recommendationsList.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed leading-normal">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-bold">
                  🚀 Awesome conversion funnels! Keep moving candidates towards interview stages!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
