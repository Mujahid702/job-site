"use client";

import React, { useState, useEffect } from "react";
import { Heart, CheckCircle2, Bookmark, BookmarkCheck, ArrowRight, Loader2 } from "lucide-react";
import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import { createClient } from "@/lib/supabase/client";
import { trackSavedJob } from "@/lib/db/applications";
import { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobPageActionsProps {
  job: Job;
}

export default function JobPageActions({ job }: JobPageActionsProps) {
  const { toggleSaveJob, isJobSaved } = useSavedJobs();
  const saved = isJobSaved(job.id);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Check tracker status in Supabase applications table
          const { data, error } = await supabase
            .from("applications")
            .select("id, status")
            .eq("user_id", user.id)
            .eq("job_id", job.id)
            .maybeSingle();

          if (!error && data) {
            setAppliedStatus(data.status);
          }
        }
      } catch (err) {
        console.error("Failed to fetch session/tracker status:", err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("applications")
          .select("id, status")
          .eq("user_id", session.user.id)
          .eq("job_id", job.id)
          .maybeSingle();
        if (data) setAppliedStatus(data.status);
      } else {
        setUserId(null);
        setAppliedStatus(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [job.id, supabase]);

  // Keep saved state in sync with context
  useEffect(() => {
    if (saved && !appliedStatus) {
      setAppliedStatus("Saved");
    } else if (!saved && appliedStatus === "Saved") {
      setAppliedStatus(null);
    }
  }, [saved, appliedStatus]);

  const handleSaveClick = async () => {
    setActionLoading(true);
    try {
      await toggleSaveJob(job);
      if (saved) {
        setAppliedStatus(null);
      } else {
        setAppliedStatus("Saved");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkApplied = async () => {
    if (!userId) {
      alert("Please log in to track your job applications.");
      return;
    }
    setActionLoading(true);
    try {
      const { success, error } = await trackSavedJob(userId, job, "Applied");
      if (success) {
        setAppliedStatus("Applied");
        // Update SavedJobs context state too
        if (!saved) {
          await toggleSaveJob(job);
        }
      } else {
        alert("Failed to track application. Please try again.");
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest py-3">
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
        Syncing application state...
      </div>
    );
  }

  const isApplied = !!(appliedStatus && ["Applied", "Assessment Scheduled", "Assessment Completed", "Technical Interview", "HR Interview", "Offer Received", "Joined", "Rejected", "Withdrawn"].includes(appliedStatus) && appliedStatus !== "Saved");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
      {/* Save Job Action */}
      <button
        onClick={handleSaveClick}
        disabled={actionLoading}
        className={cn(
          "flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all cursor-pointer select-none",
          saved
            ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <Heart className={cn("w-4 h-4 transition-transform active:scale-125", saved && "fill-rose-600")} />
        <span>{saved ? "Job Saved" : "Save Job"}</span>
      </button>

      {/* Mark As Applied Action */}
      <button
        onClick={handleMarkApplied}
        disabled={actionLoading || isApplied}
        className={cn(
          "flex-grow flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all select-none",
          isApplied
            ? "bg-emerald-50 border-emerald-250 text-emerald-600 cursor-not-allowed"
            : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 cursor-pointer"
        )}
      >
        {isApplied ? (
          <>
            <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
            <span>Applied & Tracked</span>
          </>
        ) : (
          <>
            <BookmarkCheck className="w-4 h-4" />
            <span>Mark as Applied</span>
          </>
        )}
      </button>
      
      {!userId && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:max-w-[150px] leading-tight text-center sm:text-left">
          Log in to unlock placement CRM tracking.
        </p>
      )}
    </div>
  );
}
