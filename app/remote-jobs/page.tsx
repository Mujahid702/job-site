import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Globe, Sparkles, TrendingUp } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export const metadata = {
  title: "Remote Jobs 2026 | BuggedBrain",
  description: "Browse remote-first job opportunities and work from anywhere in 2026.",
};

export default async function RemoteJobs() {
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .ilike("location", "%remote%")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Globe className="w-4 h-4" />
              Work from Anywhere
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Remote <span className="text-gradient">Opportunities</span>
           </h1>
           <p className="text-lg text-slate-500 font-medium mt-4">Work from the comfort of your home with these remote-first companies.</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
           <TrendingUp className="w-4 h-4" />
           {jobs?.length || 0} Global Roles
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
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No remote jobs found</h3>
                  <p className="text-slate-500 font-medium">Check back soon for new opportunities!</p>
                </div>
              )}
            </div>
         </div>

         <aside className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
               <h4 className="text-xl font-black mb-4">Remote Setup Guide</h4>
               <p className="text-slate-400 mb-6 font-bold text-sm leading-relaxed">Everything you need to set up a productive home office and land a remote job.</p>
               <button className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg">Download Guide</button>
            </div>

            <SidebarPromo 
               title="Top 5 Remote Skills"
               description="What companies look for when hiring remote software engineers in 2026."
               ctaText="Watch Masterclass"
               youtubeLink="https://youtube.com/@buggedbrain25"
               thumbnail="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=2070"
            />
         </aside>
      </div>
    </div>
  );
}
