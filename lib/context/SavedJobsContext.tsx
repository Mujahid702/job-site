"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Job } from "@/types/job";
import { supabase } from "@/lib/supabase";
import { getSavedJobs, saveJob, unsaveJob } from "@/lib/db/jobs";

interface SavedJobsContextType {
  savedJobs: Job[];
  toggleSaveJob: (job: Job) => void;
  isJobSaved: (jobId: string) => boolean;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize offline sync triggers
  useEffect(() => {
    import("@/lib/db/sync").then(({ initOfflineSyncListeners, syncQueue }) => {
      initOfflineSyncListeners();
      syncQueue();
    });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load saved jobs
  useEffect(() => {
    async function loadJobs() {
      if (userId) {
        const dbJobs = await getSavedJobs(userId);
        setSavedJobs(dbJobs);
      } else {
        const stored = localStorage.getItem("saved_jobs");
        if (stored) {
          try {
            setSavedJobs(JSON.parse(stored));
          } catch (e) {
            console.error("Failed to parse saved jobs", e);
          }
        }
      }
    }
    loadJobs();
  }, [userId]);

  // Keep localStorage as temporary fallback
  useEffect(() => {
    localStorage.setItem("saved_jobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const toggleSaveJob = async (job: Job) => {
    const isSaved = savedJobs.some((j) => j.id === job.id);
    
    setSavedJobs((prev) => {
      if (isSaved) {
        return prev.filter((j) => j.id !== job.id);
      } else {
        return [...prev, job];
      }
    });

    if (userId) {
      if (isSaved) {
        await unsaveJob(userId, job.id);
      } else {
        await saveJob(userId, job.id);
      }
    }
  };

  const isJobSaved = (jobId: string) => {
    return savedJobs.some((j) => j.id === jobId);
  };

  return (
    <SavedJobsContext.Provider value={{ savedJobs, toggleSaveJob, isJobSaved }}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
}

