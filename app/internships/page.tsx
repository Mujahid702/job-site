import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export const metadata = {
  title: "Internships 2026 | BuggedBrain",
  description: "Find the best internships for college students and freshers in 2026.",
};

export default async function Internships() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .ilike("title", "%intern%")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
              <GraduationCap className="w-4 h-4" />
              Early Career
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              Premium <span className="text-gradient">Internships</span>
           </h1>
           <p className="text-lg text-slate-500 font-medium mt-4">Start your career journey with these exciting internship opportunities.</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
           <TrendingUp className="w-4 h-4" />
           {jobs?.length || 0} Open Roles
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
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No internships found</h3>
                  <p className="text-slate-500 font-medium">Check back soon for new opportunities!</p>
                </div>
              )}
            </div>
         </div>

         <aside className="lg:col-span-4 space-y-8">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
               <h4 className="text-xl font-black mb-4">Resume Review</h4>
               <p className="text-indigo-100 mb-6 font-medium text-sm leading-relaxed">Get your resume reviewed by industry experts to increase your internship selection chances.</p>
               <button className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all">Get Reviewed</button>
            </div>

            <SidebarPromo 
               title="How to get Internships at Google/Amazon"
               description="A step-by-step roadmap for 2026 graduates to land Big Tech internships."
               ctaText="Watch Roadmap"
               youtubeLink="https://youtube.com"
               thumbnail="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2071"
            />
         </aside>
      </div>
    </div>
  );
}
