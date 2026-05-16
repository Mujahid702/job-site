"use client";

import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import JobCard from "@/components/JobCard";
import { 
  LayoutDashboard, 
  Heart, 
  Briefcase, 
  CheckCircle2, 
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const { savedJobs } = useSavedJobs();
  const [user, setUser] = useState<User | null>(null);
  const [prepTasksCount, setPrepTasksCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // 1. Get User
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // 2. Aggregate Prep Tasks from localStorage
    const getPrepTasks = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("prep_checklist_")) {
          try {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            total += items.length;
          } catch (e) {}
        }
      }
      setPrepTasksCount(total);
    };
    getPrepTasks();

    // 3. Get Job Alerts (Jobs in last 7 days)
    const getAlerts = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count } = await supabase
        .from("job_postings")
        .select("*", { count: "exact", head: true })
        .gt("created_at", sevenDaysAgo.toISOString());
      
      setAlertsCount(count || 0);
    };
    getAlerts();
  }, []);
  
  const stats = [
    { label: "Saved Jobs", value: savedJobs.length, icon: <Heart className="w-5 h-5 text-red-500" />, color: "bg-red-50" },
    { label: "Prep Tasks", value: prepTasksCount, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: "bg-emerald-50" },
    { label: "Job Alerts", value: alertsCount, icon: <Sparkles className="w-5 h-5 text-blue-500" />, color: "bg-blue-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Dashboard Header */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                <LayoutDashboard className="w-4 h-4" />
                Member Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter font-display">
                Welcome Back, <span className="text-accent">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Graduate"}!</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-xl">
                Track your recruitment journey, manage bookmarks, and ace your preparation in one place.
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <UserIcon className="w-6 h-6 text-slate-400" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class of 2026</p>
                  <p className="text-sm font-black text-slate-900">{user ? "Student Member" : "Guest Member"}</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:border-accent/20 transition-all"
            >
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900 font-display">{stat.value}</p>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Dashboard Content */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Recent Activity */}
            <section className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-slate-900 font-display">Recent Saved Jobs</h2>
                  <Link href="/saved" className="text-xs font-black text-accent uppercase tracking-widest hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
               </div>
               
               {savedJobs.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {savedJobs.slice(0, 4).map((job) => (
                     <JobCard key={job.id} job={job} />
                   ))}
                 </div>
               ) : (
                 <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-medium mb-6">No jobs saved recently.</p>
                    <Link href="/latest-jobs" className="inline-flex items-center gap-2 text-sm font-black text-accent uppercase tracking-widest">
                      Start Browsing <ChevronRight className="w-4 h-4" />
                    </Link>
                 </div>
               )}
            </section>

            {/* Recommended Roadmap Section */}
            <section className="p-10 bg-indigo-600 rounded-[3rem] text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                  <TrendingUp className="w-32 h-32" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="space-y-4 flex-1">
                     <h3 className="text-3xl font-black font-display leading-tight">Your Custom Preparation Roadmap</h3>
                     <p className="text-indigo-100 font-medium text-lg leading-relaxed">
                        Based on your interest in software roles, we've generated a 4-week preparation plan.
                     </p>
                     <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-3">
                           {[1,2,3,4].map(i => (
                             <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-black">202{i}</div>
                           ))}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">500+ Graduates following this</p>
                     </div>
                  </div>
                  <button className="shrink-0 px-10 py-5 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl">
                     Start Learning
                  </button>
               </div>
            </section>

          </div>

          {/* Sidebar / Sidebar Content */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Daily Checklist Widget */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
               <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black text-slate-900 font-display">Daily Goals</h3>
               </div>
               
               <div className="space-y-4">
                  {[
                    "Solve 1 DSA Problem",
                    "Check New Off-Campus Drives",
                    "Review Interview Questions",
                    "Apply to 3 New Jobs"
                  ].map((goal, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-6 h-6 rounded-lg border-2 border-slate-100 group-hover:border-accent transition-colors flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white group-hover:text-accent transition-colors" />
                       </div>
                       <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{goal}</span>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Consistency is Key to Success</p>
               </div>
            </div>

            {/* Quick Links */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6">
               <h3 className="text-xl font-black font-display">Quick Access</h3>
               <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: "Resume Builder", href: "/prep-hub" },
                    { label: "Mock Interviews", href: "/prep-hub" },
                    { label: "Company Pages", href: "/latest-jobs" }
                  ].map(link => (
                    <Link key={link.label} href={link.href} className="p-4 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-between group">
                       {link.label}
                       <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
