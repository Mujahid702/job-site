"use client";

import Link from "next/link";
import { MapPin, DollarSign, Calendar, ArrowUpRight, ShieldCheck, Zap, Briefcase, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSavedJobs } from "@/lib/context/SavedJobsContext";

import { Job } from "@/types/job";

export default function JobCard({ job }: { job: Job }) {
  const { toggleSaveJob, isJobSaved } = useSavedJobs();
  const saved = isJobSaved(job.id);

  // Simple logic for company initials or logo placeholder
  const initials = job.company_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Link 
        href={`/jobs/${job.drive_slug}`} 
        className="group block p-8 rounded-[2rem] glass-card hover-lift transition-all relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name} className="w-14 h-14 rounded-2xl object-contain bg-slate-50 p-2 shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform" />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors font-display">
                    {job.drive_title}
                  </h3>
                  {job.location?.toLowerCase().includes("remote") && (
                    <div className="p-1 bg-green-50 text-green-600 rounded-lg" title="Remote">
                      <Zap className="w-3.5 h-3.5 fill-green-600" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wider">
                  <span className="hover:text-slate-900 transition-colors cursor-pointer">{job.company_name}</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSaveJob(job);
                }}
                className={cn(
                  "p-3 rounded-2xl transition-all duration-300 border border-slate-100",
                  saved ? "bg-red-50 text-red-500 border-red-100" : "bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50"
                )}
              >
                <Heart className={cn("w-5 h-5", saved && "fill-red-500")} />
              </button>
              <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-slate-100">
                 <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-xs font-bold uppercase tracking-widest group-hover:bg-white transition-colors">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location}
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 border border-blue-100/50 rounded-xl text-blue-700 text-xs font-bold uppercase tracking-widest group-hover:bg-blue-50 transition-colors">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                {job.salary_range}
             </div>
             {job.job_type && (
               <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-indigo-700 text-xs font-bold uppercase tracking-widest group-hover:bg-indigo-50 transition-colors">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  {job.job_type}
               </div>
             )}
          </div>

          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
             <div suppressHydrationWarning className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                {job.created_at ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
             </div>
             <div className="text-blue-600 text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                View Details
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

