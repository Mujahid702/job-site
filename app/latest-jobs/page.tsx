import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Zap, Sparkles, TrendingUp, Filter } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export const metadata = {
  title: "Latest Jobs 2026 | BuggedBrain",
  description: "Explore the most recent job openings, off-campus drives, and internships for freshers.",
};

export default async function LatestJobsPage() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-[0.2em] mb-4">
              <Zap className="w-4 h-4 fill-accent" />
              Freshly Posted
           </div>
           <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">
              Latest <span className="text-gradient">Opportunities</span>
           </h1>
           <p className="text-lg text-slate-500 font-medium mt-4 max-w-xl">
             Your daily destination for the most recent career openings from top tech companies across India.
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <div className="px-5 py-3 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest rounded-xl border border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {jobs?.length || 0} Open Roles
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Jobs List */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {jobs?.map((job) => (
                 <JobCard key={job.id} job={job} />
               ))}
               {(!jobs || jobs.length === 0) && (
                 <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Filter className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">No jobs listed yet</h3>
                    <p className="text-slate-500 font-medium">We're currently scouring the web for new roles. Check back in an hour!</p>
                 </div>
               )}
             </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
             <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[60px]"></div>
                <h4 className="text-2xl font-black mb-4 relative z-10">Job Alerts 24/7</h4>
                <p className="text-slate-400 font-medium mb-8 relative z-10 leading-relaxed text-sm">
                  Never miss an opportunity. Get instant notifications when a job matching your profile is posted.
                </p>
                <button className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-accent hover:text-white transition-all relative z-10 uppercase tracking-widest text-xs">
                  Subscribe to Alerts
                </button>
             </div>

             <SidebarPromo 
                title="Prepare for Interviews"
                description="Our curated guides help you clear rounds at TCS, Wipro, and Infosys with ease."
                ctaText="Start Learning"
                youtubeLink="https://youtube.com"
                thumbnail="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070"
             />

             <div className="bg-blue-50 p-10 rounded-[3rem] border border-blue-100">
                <h4 className="text-xl font-black text-blue-900 mb-4">Quick Stats</h4>
                <div className="space-y-6">
                   <div className="flex justify-between items-center pb-4 border-b border-blue-200/50">
                      <span className="text-sm font-bold text-blue-700/70">MNC Roles</span>
                      <span className="text-lg font-black text-blue-900">45+</span>
                   </div>
                   <div className="flex justify-between items-center pb-4 border-b border-blue-200/50">
                      <span className="text-sm font-bold text-blue-700/70">Startup Roles</span>
                      <span className="text-lg font-black text-blue-900">120+</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-700/70">Internships</span>
                      <span className="text-lg font-black text-blue-900">30+</span>
                   </div>
                </div>
             </div>
          </aside>
      </div>
    </div>
  );
}
