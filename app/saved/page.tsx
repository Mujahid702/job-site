"use client";

import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import JobCard from "@/components/JobCard";
import { Heart, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SavedJobsPage() {
  const { savedJobs } = useSavedJobs();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <section className="bg-white border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-black uppercase tracking-widest">
                <Heart className="w-4 h-4 fill-red-600" />
                Your Bookmarks
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter font-display">
                Saved <span className="text-red-500">Jobs</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                Review and apply to the roles you've bookmarked. Your list is saved locally on this device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {savedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-32 space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
              <Heart className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 font-display">No saved jobs yet</h2>
              <p className="text-slate-500 font-medium max-w-sm">
                Start browsing and click the heart icon on any job to save it for later review.
              </p>
            </div>
            <Link 
              href="/latest-jobs" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-accent transition-all uppercase tracking-widest shadow-xl"
            >
              Browse Jobs
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
