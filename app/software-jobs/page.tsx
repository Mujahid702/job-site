import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Cpu, Sparkles, TrendingUp } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export const metadata = {
  title: "Software Engineering Jobs 2026 | BuggedBrain",
  description: "Latest Software Engineer, Developer, and IT jobs for freshers in 2026.",
};

export default async function SoftwareJobs() {
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .or("drive_title.ilike.%software%,drive_title.ilike.%developer%,drive_title.ilike.%engineer%,drive_title.ilike.%it%")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Cpu className="w-4 h-4" />
              Tech & Engineering
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Software <span className="text-gradient">Engineering</span>
           </h1>
           <p className="text-lg text-slate-500 font-medium mt-4">The best tech opportunities for the class of 2026 graduates.</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
           <TrendingUp className="w-4 h-4" />
           {jobs?.length || 0} Openings
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
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No software jobs found</h3>
                  <p className="text-slate-500 font-medium">Check back soon for new opportunities!</p>
                </div>
              )}
            </div>
         </div>

         <aside className="lg:col-span-4 space-y-8">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100/50">
               <h4 className="text-xl font-black mb-4">Interview Prep</h4>
               <p className="text-blue-100 mb-6 font-bold text-sm leading-relaxed">Master Data Structures and Algorithms with our curated problem list for 2026 grads.</p>
               <button className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-lg">Start Practicing</button>
            </div>

            <SidebarPromo 
               title="2026 Salary Report"
               description="How much should you expect as a fresher software engineer in 2026? Live data from top companies."
               ctaText="Watch Report"
               youtubeLink="https://youtube.com/@buggedbrain25"
               thumbnail="https://images.unsplash.com/photo-1551288049-bbbda5366991?auto=format&fit=crop&q=80&w=2070"
            />
         </aside>
      </div>
    </div>
  );
}
