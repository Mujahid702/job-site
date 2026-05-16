"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Job } from "@/types/job";

interface SavedJobsContextType {
  savedJobs: Job[];
  toggleSaveJob: (job: Job) => void;
  isJobSaved: (jobId: string) => boolean;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("saved_jobs");
    if (stored) {
      try {
        setSavedJobs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved jobs", e);
      }
    }
  }, []);

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    localStorage.setItem("saved_jobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const toggleSaveJob = (job: Job) => {
    setSavedJobs((prev) => {
      const isSaved = prev.some((j) => j.id === job.id);
      if (isSaved) {
        return prev.filter((j) => j.id !== job.id);
      } else {
        return [...prev, job];
      }
    });
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
