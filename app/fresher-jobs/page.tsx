import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Briefcase, Sparkles, TrendingUp } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export const metadata = {
  title: "Fresher Jobs 2026 | BuggedBrain",
  description: "Browse all latest fresher jobs and recruitment drives for 2026 graduates.",
};

export default async function FresherJobs() {
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Sparkles className="w-4 h-4 fill-blue-600" />
              Direct Hiring
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Fresher <span className="text-gradient">Jobs 2026</span>
           </h1>
           <p className="text-lg text-slate-500 font-medium mt-4">Browse all latest full-time opportunities and recruitment drives.</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
           <TrendingUp className="w-4 h-4" />
           {jobs?.length || 0} Positions Available
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {jobs?.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {(!jobs || jobs.length === 0) && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No jobs found</h3>
                  <p className="text-slate-500 font-medium">Check back soon for new opportunities!</p>
                </div>
              )}
            </div>
         </div>

         <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Instant Alerts</h4>
               <p className="text-sm text-slate-500 mb-6 font-bold">Get notified about new fresher jobs matching your profile instantly.</p>
               <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg text-[10px] uppercase tracking-widest">Enable Alerts</button>
            </div>

            <SidebarPromo 
               title="High Paying Fresher Jobs"
               description="A curated list of companies paying 12LPA+ for 2026 graduates across India."
               ctaText="Watch Masterclass"
               youtubeLink="https://youtube.com/@buggedbrain25"
               thumbnail="https://images.unsplash.com/photo-1454165833767-027eeef1593e?auto=format&fit=crop&q=80&w=2070"
            />
         </aside>
      </div>
    </div>
  );
}