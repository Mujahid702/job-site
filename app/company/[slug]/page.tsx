import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Briefcase, GraduationCap, DollarSign, MessageCircle, ChevronRight, Share2, TrendingUp } from "lucide-react";
import { SidebarPromo } from "@/components/PromoComponents";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const companyName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `${companyName} Jobs, Salary & Interview Process | BuggedBrain`,
    description: `Find latest ${companyName} fresher jobs, internships, salary details and interview process for 2026.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const companySearch = slug.replace(/-/g, ' ');

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .ilike("company", `%${companySearch}%`);

  if (!jobs || jobs.length === 0) {
    return notFound();
  }

  const companyName = jobs[0].company;
  const fresherJobs = jobs.filter(job => !job.title?.toLowerCase().includes("intern"));
  const internshipJobs = jobs.filter(job => job.title?.toLowerCase().includes("intern"));
  
  const salaries = Array.from(new Set(jobs.map(j => j.salary))).filter(Boolean);
  const interviewTips = Array.from(new Set(jobs.map(j => j.interview_tips))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Premium Header */}
      <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm mb-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Building2 className="w-64 h-64" />
         </div>
         
         <div className="relative z-10 space-y-6">
            <nav className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Company</span>
            </nav>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
               <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
                    {companyName}
                  </h1>
                  <p className="text-xl text-slate-500 font-medium max-w-xl">
                    Discover latest opportunities, salary insights, and preparation guides for {companyName}.
                  </p>
               </div>
               <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black text-xl shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                  {jobs.length} Active Roles
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-20">
          
          {/* Fresher Jobs Section */}
          <section>
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Briefcase className="w-6 h-6" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Full-Time Positions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {fresherJobs.length > 0 ? (
                fresherJobs.map(job => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                   <p className="text-slate-500 font-medium">No full-time fresher jobs currently listed.</p>
                </div>
              )}
            </div>
          </section>

          {/* Internships Section */}
          <section>
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <GraduationCap className="w-6 h-6" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Internship Opportunities</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {internshipJobs.length > 0 ? (
                internshipJobs.map(job => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                   <p className="text-slate-500 font-medium">No internship opportunities currently listed.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="sticky top-32 space-y-8">
              
              {/* Salary Insights */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                    Salary Insights
                 </h3>
                 <div className="space-y-6">
                    {salaries.map((salary, idx) => (
                      <div key={idx} className="pb-6 border-b border-slate-800 last:border-0 last:pb-0">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Standard Package</p>
                        <p className="text-2xl font-black text-blue-400">{salary}</p>
                      </div>
                    ))}
                    {salaries.length === 0 && <p className="text-slate-500 italic">Data not available yet.</p>}
                 </div>

                 <div className="mt-12 pt-12 border-t border-slate-800">
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                       <MessageCircle className="w-6 h-6 text-indigo-400" />
                       Interview Tips
                    </h3>
                    <div className="space-y-4">
                      {interviewTips.slice(0, 2).map((tip, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-sm text-slate-300 leading-relaxed italic">
                          "{tip.slice(0, 150)}..."
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Promo Slot */}
              <SidebarPromo 
                 title={`Preparation Guide for ${companyName}`}
                 description={`Learn how to crack the ${companyName} selection process with real interview experiences.`}
                 ctaText="Watch on YouTube"
                 youtubeLink="https://youtube.com"
                 thumbnail="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=2072"
              />

           </div>
        </aside>
      </div>
    </div>
  );
}
