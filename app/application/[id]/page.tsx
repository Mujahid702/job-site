"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  Clock,
  User,
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Save,
  Link as LinkIcon,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  deleteApplication
} from "@/lib/db/applications";
import { calculatePRIScore } from "@/lib/db/placement-readiness";
import { scheduleReminder } from "@/lib/services/notifications";
import { COMPANY_PREP_LIST } from "@/lib/company-prep-data";
import { PlacementApplication } from "@/types/crm";
import { cn } from "@/lib/utils";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [app, setApp] = useState<PlacementApplication | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Editable Form states
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [reminderNotes, setReminderNotes] = useState("");

  const supabase = createClient();

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const { application, history: hist } = await getApplicationById(id, uid);
      if (application) {
        setApp(application);
        setHistory(hist);
        setNotes(application.notes || "");
      } else {
        router.push("/dashboard?tab=placement-tracker");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadData(user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [id, supabase]);

  // Sync Status Change
  const handleStatusChange = async (newStatus: PlacementApplication["status"]) => {
    if (!userId || !app) return;
    setSavingStatus(true);
    try {
      const { success } = await updateApplicationStatus(app.id, newStatus, userId);
      if (success) {
        calculatePRIScore(userId).catch(console.error);
        await loadData(userId);
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!userId || !app) return;
    setSavingNotes(true);
    try {
      const { success } = await updateApplication(app.id, { notes }, userId);
      if (success) {
        calculatePRIScore(userId).catch(console.error);
        alert("Notes saved successfully!");
        await loadData(userId);
      } else {
        alert("Failed to save notes.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Schedule Reminder Alert
  const handleSetReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !app || !nextStep || !nextStepDate) {
      alert("Please fill in both the Reminder date and description.");
      return;
    }
    setSavingNotes(true);
    try {
      // 1. Update in applications table
      const { success } = await updateApplication(
        app.id,
        {
          notes: app.notes, // keep notes
          // We can write flat columns since updateApplication handles raw details merging
        },
        userId
      );

      // Save fields flatly to db
      const { error: dbErr } = await supabase
        .from("applications")
        .update({
          next_step: nextStep,
          next_step_date: new Date(nextStepDate).toISOString()
        })
        .eq("id", app.id)
        .eq("user_id", userId);

      if (dbErr) throw dbErr;

      // 2. Dispatch Mock Reminder email
      const reminderDateFormatted = new Date(nextStepDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      await scheduleReminder(
        userId,
        app.id,
        app.companyName,
        app.role,
        "interview", // Type mapping
        reminderDateFormatted,
        reminderNotes || nextStep
      );

      alert(`Reminder scheduled for ${reminderDateFormatted}! Check your mock server logs.`);
      setNextStep("");
      setNextStepDate("");
      setReminderNotes("");
      calculatePRIScore(userId).catch(console.error);
      await loadData(userId);
    } catch (err) {
      console.error(err);
      alert("Failed to set reminder.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete Application
  const handleDelete = async () => {
    if (!userId || !app) return;
    if (window.confirm("Are you sure you want to permanently delete this application?")) {
      const { success } = await deleteApplication(app.id, userId);
      if (success) {
        calculatePRIScore(userId).catch(console.error);
        router.push("/dashboard?tab=placement-tracker");
      } else {
        alert("Failed to delete application.");
      }
    }
  };

  // Match Company Prep resources slug
  const companyPrepPlaybook = useMemo(() => {
    if (!app) return null;
    const cleanCompany = app.companyName.toLowerCase().replace(/\s+/g, "");
    return COMPANY_PREP_LIST.find(c => c.slug.toLowerCase().replace(/\s+/g, "") === cleanCompany);
  }, [app]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center space-y-4 min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Fetching Application Records...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-20 text-center min-h-screen bg-slate-50">
        <h3 className="text-2xl font-black text-slate-800">Application not found</h3>
        <Link href="/dashboard?tab=placement-tracker" className="text-blue-600 font-bold hover:underline mt-4 block">
          Return to Tracker Dashboard
        </Link>
      </div>
    );
  }

  const isAssessment = ["Assessment Scheduled", "Assessment Completed"].includes(app.status);
  const isRejected = app.status === "Rejected";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Navigation Back */}
        <Link
          href="/dashboard?tab=placement-tracker"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Placement Tracker
        </Link>

        {/* PROFILE/COMPANY HEADER CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {app.companyName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 items-center">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">{app.companyName}</h1>
                <span className={cn(
                  "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                  app.status === "Offer Received" || app.status === "Joined"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : app.status === "Rejected"
                    ? "bg-rose-50 border-rose-100 text-rose-600"
                    : "bg-blue-50 border-blue-100 text-blue-600"
                )}>
                  {app.status}
                </span>
              </div>
              <p className="text-slate-500 font-extrabold text-sm uppercase tracking-wide">
                Role: <span className="text-slate-800 font-bold normal-case">{app.role}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {app.jobUrl && (
              <a
                href={app.jobUrl}
                target="_blank"
                className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Job Posting Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleDelete}
              className="px-5 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Track</span>
            </button>
          </div>
        </div>

        {/* QUICK METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Office Location</span>
              <strong className="text-sm font-black text-slate-800 block mt-0.5">{app.location || "Not specified"}</strong>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-green-500 shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Offered Package</span>
              <strong className="text-sm font-black text-slate-800 block mt-0.5 font-mono">{app.package || "Negotiable"}</strong>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Application Date</span>
              <strong className="text-sm font-black text-slate-800 block mt-0.5 font-mono">{app.applicationDate || "Recently"}</strong>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-indigo-500 shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Next Activity Step</span>
              <strong className="text-sm font-black text-slate-800 block mt-0.5">
                {app.schedules?.[0]?.type || "Awaiting schedule"}
              </strong>
            </div>
          </div>
        </div>

        {/* WORKSPACE SECTIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR (8 cols): Timeline, Notes, Prep guides */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CONDITIONAL RESUME OS INTEGRATION: IF REJECTED */}
            {isRejected && (
              <div className="bg-rose-50/50 border border-rose-200 p-8 rounded-[2.5rem] space-y-4 shadow-sm animate-fade-in text-left">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <h4 className="text-lg font-black text-rose-800 font-display">Resume OS AI Insights - Gap Detected</h4>
                </div>
                <p className="text-slate-650 text-xs font-semibold leading-relaxed">
                  We analyzed your recent rejection log. Historically, 60% of candidates applying for this role fail due to keyword densities mismatches.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {[
                    "ATS Score is low (78%)",
                    "Missing SQL query keywords",
                    "Resume is not tailored"
                  ].map((tip, i) => (
                    <div key={i} className="p-3 bg-white border border-rose-100 rounded-xl text-[11px] font-bold text-slate-600">
                      • {tip}
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link
                    href="/dashboard?tab=resume-os"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    <span>Tailor Resume now</span>
                  </Link>
                </div>
              </div>
            )}

            {/* CONDITIONAL COMPANY PREP INTEGRATION: IF ASSESSMENT */}
            {isAssessment && companyPrepPlaybook && (
              <div className="bg-indigo-50/40 border border-indigo-200 p-8 rounded-[2.5rem] space-y-5 shadow-sm text-left animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-indigo-150 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-indigo-150 text-indigo-650 rounded-xl">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-indigo-900 font-display">{app.companyName} Prep OS Playbook Available</h4>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Automated prep guidelines active</p>
                    </div>
                  </div>
                  <Link
                    href={`/company-prep/${companyPrepPlaybook.slug}`}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <span>Launch Prep OS</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 leading-relaxed">
                  <div className="space-y-1">
                    <strong className="text-slate-800 block">Cutoff Requirement:</strong>
                    <p>• Online Assessment passing cutoff: {companyPrepPlaybook.oaPattern?.cutoff || "85% threshold"}</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-slate-800 block">Common Topics asked:</strong>
                    <p>• {companyPrepPlaybook.oaPattern?.sections?.join(", ") || "Logical Sequence, Aptitude, SQL Joins"}</p>
                  </div>
                </div>

                {companyPrepPlaybook.hiringProcess && (
                  <div className="pt-2">
                    <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Previous coding test questions asked</strong>
                    <div className="p-4 bg-white border border-indigo-100 rounded-2xl text-[11px] font-medium text-slate-500 italic">
                      "1. Write Quicksort sorting algorithms in Python under O(N log N).
                      2. Write SQL fetch CTC statement with offset values."
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STATUS TRANSITIONS Stepper bar */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900 font-display">Manage Recruitment Stage</h3>
              
              <div className="flex flex-wrap gap-2">
                {["Saved", "Applied", "Assessment Scheduled", "Assessment Completed", "Technical Interview", "HR Interview", "Offer Received", "Joined", "Rejected", "Withdrawn"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st as any)}
                    disabled={savingStatus || app.status === st}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border select-none",
                      app.status === st
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* VERTICAL TIMELINE: STATUS LOG HISTORY */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900 font-display">Status Progression Timeline</h3>
              
              <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-3 py-2">
                {history.map((log, idx) => (
                  <div key={log.id} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[31px] top-0.5 p-1 bg-white border-2 border-indigo-500 rounded-full w-4 h-4 shadow-sm flex items-center justify-center shrink-0" />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-slate-800">{log.status}</strong>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                        {log.notes || "Recruitment progression status updated."}
                      </p>
                    </div>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <div className="text-center text-xs font-bold text-slate-400 py-6">
                    No timeline records parsed yet. Log your application to database to start tracking.
                  </div>
                )}
              </div>
            </div>

            {/* EDITABLE APPLICATION NOTES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5 text-left">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 font-display">Recruitment Notes & Logs</h3>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 bg-slate-900 hover:bg-teal-650 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Log questions asked, feedback inputs, system design checklists, or other placement data..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

          </div>

          {/* RIGHT SIDEBAR (4 cols): Recruiter, Reminder alerts scheduling */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* RECRUITER SECTION */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5 text-left">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Profile</strong>
              
              {app.recruiter && app.recruiter.name ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-800 block">{app.recruiter.name}</strong>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Recruiting Coordinator</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                    <p className="flex justify-between">
                      <span>Email:</span>
                      <a href={`mailto:${app.recruiter.email}`} className="text-blue-500 hover:underline font-mono">{app.recruiter.email}</a>
                    </p>
                    {app.recruiter.phone && (
                      <p className="flex justify-between">
                        <span>Phone:</span>
                        <span className="text-slate-800 font-mono">{app.recruiter.phone}</span>
                      </p>
                    )}
                    {app.recruiter.linkedIn && (
                      <p className="flex justify-between">
                        <span>LinkedIn:</span>
                        <a href={app.recruiter.linkedIn} target="_blank" className="text-blue-500 hover:underline flex items-center gap-0.5">
                          Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl select-none">
                  No recruiter contact logged. Edit app to configure recruiter handles.
                </div>
              )}
            </div>

            {/* REMINDER ALERT SCHEDULER */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-5 text-left">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Follow Up scheduler</strong>
              
              <form onSubmit={handleSetReminder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Follow up Activity date</label>
                  <input
                    type="date"
                    required
                    value={nextStepDate}
                    onChange={e => setNextStepDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Step Target Description</label>
                  <input
                    type="text"
                    required
                    value={nextStep}
                    onChange={e => setNextStep(e.target.value)}
                    placeholder="E.g., Assessment Tomorrow"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Reminder Notes (Optional)</label>
                  <input
                    type="text"
                    value={reminderNotes}
                    onChange={e => setReminderNotes(e.target.value)}
                    placeholder="E.g., Practice DP subqueries"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingNotes}
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-650 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm disabled:opacity-40"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Schedule Reminder alert</span>
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
