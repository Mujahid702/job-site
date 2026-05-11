import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { 
  Sparkles,
  Zap,
  ChevronRight
} from "lucide-react";

export default async function Home() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!jobs) return null;

  const latestJobs = jobs.slice(0, 10);

  return (
    <div className="pb-32">
      {/* Premium Hero Section - RETAINED */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-indigo-400 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-black uppercase tracking-widest animate-bounce">
              <Sparkles className="w-4 h-4 fill-blue-600" />
              Over 500+ New Jobs Posted Today
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] max-w-4xl">
              Landing Your First <br />
              <span className="text-accent">Dream Job</span> Made Easy.
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed">
              The premier hiring destination for 2026 graduates. Exclusive roles at top tech companies, all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-padding section-spacing">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Latest Jobs (Left) */}
          <div className="lg:col-span-8 space-y-16">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase">Latest Job Openings</h2>
            </div>

            <div className="space-y-6">
              {latestJobs.map((job) => (
                <Link 
                  key={job.id} 
                  href={`/jobs/${job.slug}`}
                  className="block bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-accent/20 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-widest rounded-md">
                          2025-2026 Jobs
                        </span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-md">
                          Freshers
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-accent transition-colors leading-tight">
                        {job.company} Careers Hiring {job.title} 2026 Apply Now
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>jobs adda freshers</span>
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-slate-100 group-hover:bg-accent group-hover:text-white transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-12 text-center">
              <Link href="/fresher-jobs" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-accent transition-all uppercase tracking-widest shadow-xl shadow-slate-200">
                View All Posts
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}