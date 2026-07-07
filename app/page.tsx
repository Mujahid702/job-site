import { createClient } from "@/lib/supabase/server";
import JobCard from "@/components/JobCard";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import NewsletterSection from "@/components/NewsletterSection";
import { 
  Sparkles,
  Zap,
  ChevronRight
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!jobs) return null;

  // Personalization of job feeds
  let sortedJobs = [...jobs];
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_role, skills")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const target = (profile.target_role || "").toLowerCase().trim();
        const skillsList = (profile.skills || []).map((s: string) => s.toLowerCase().trim());

        sortedJobs.sort((a, b) => {
          const aTitle = (a.drive_title || "").toLowerCase();
          const aCompany = (a.company_name || "").toLowerCase();
          const aJD = (a.job_description || "").toLowerCase();
          
          const bTitle = (b.drive_title || "").toLowerCase();
          const bCompany = (b.company_name || "").toLowerCase();
          const bJD = (b.job_description || "").toLowerCase();

          // Target role matches
          const aMatchRole = target && (aTitle.includes(target) || aCompany.includes(target));
          const bMatchRole = target && (bTitle.includes(target) || bCompany.includes(target));

          if (aMatchRole && !bMatchRole) return -1;
          if (!aMatchRole && bMatchRole) return 1;

          // Skills matches count
          let aSkillsCount = 0;
          let bSkillsCount = 0;
          skillsList.forEach((skill: string) => {
            if (aTitle.includes(skill) || aJD.includes(skill)) aSkillsCount++;
            if (bTitle.includes(skill) || bJD.includes(skill)) bSkillsCount++;
          });

          return bSkillsCount - aSkillsCount;
        });
      }
    }
  } catch (err) {
    console.error("Personalization failed in Home page:", err);
  }

  const latestJobs = sortedJobs.slice(0, 10);

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

      {/* High-Value Tools Section */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Link href="/latest-jobs" className="max-w-md w-full group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
                <Sparkles className="w-8 h-8 fill-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">MNC Off-Campus</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-6">Direct application links to mass recruitment drives at TCS, Wipro & more.</p>
              <div className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                View Drives <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Career & Placement OS Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-[3rem] sm:rounded-[4rem] mx-4 sm:mx-8 px-6 sm:px-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-20">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-[0.25em] mb-4">
              <Sparkles className="w-4 h-4 fill-blue-400" />
              BuggedBrain Placement OS
            </div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.95] font-display">
              Ace Your Placement. <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-extrabold">From Zero to Offer.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
              Don't just apply. Build an ATS-friendly resume, master role-specific roadmaps, practice company prep sets, and track your placement readiness index with our all-in-one Career Operating System.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: Resume Builder */}
            <div className="p-8 sm:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between hover:border-blue-500/30 hover:bg-white/10 transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-black">1</div>
                <h3 className="text-2xl font-black tracking-tight">Build ATS-Friendly Resume</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Analyze your keyword relevance, readability, skills alignment, and formatting instantly. Avoid critical resume errors and boost recruiter visibility.
                </p>
                <div className="space-y-3">
                  {["Simulated 7-parameter ATS score", "Recruiter-friendliness checklist", "Role & skills matching suggestions"].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="text-blue-400 font-black">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/dashboard?tab=resume" className="mt-8 py-4 bg-white text-slate-900 text-center font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2">
                Analyze My Resume <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 2: Roadmaps */}
            <div className="p-8 sm:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between hover:border-indigo-500/30 hover:bg-white/10 transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center font-black">2</div>
                <h3 className="text-2xl font-black tracking-tight">Role-Based Connected Roadmaps</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Interactive learning paths for Software Developer, AI/ML, Full Stack, Data Analyst, DevOps, and more. Track your progress with visual flowchart interfaces.
                </p>
                <div className="space-y-3">
                  {["Beginner to advanced sequences", "Recommended tools & tech stacks", "Placement preparation strategies"].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="text-indigo-400 font-black">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/dashboard?tab=roadmap" className="mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                Start My Roadmap <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 3: Mentorship */}
            <div className="p-8 sm:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col justify-between hover:border-purple-500/30 hover:bg-white/10 transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center font-black">3</div>
                <h3 className="text-2xl font-black tracking-tight">One-to-One Expert Guidance</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Book direct placement strategy slots, ATS resume review calls, mock coding rounds, and interview coaching with elite engineering mentors.
                </p>
                <div className="space-y-3">
                  {["Personalized session slots booking", "Direct dashboard calendar tracking", "Curated coding prep coaching"].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span className="text-purple-400 font-black">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/dashboard?tab=mentorship" className="mt-8 py-4 bg-white/10 border border-white/20 text-white text-center font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                Book Mentorship <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Connected OS Footer stats */}
          <div className="pt-12 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { title: "Placement Readiness Index", value: "Real-time Metrics" },
              { title: "Smart Project Recommendation", value: "Beginner → Advanced" },
              { title: "LinkedIn Recruiter Visibility", value: "Headline & About Builder" },
              { title: "Streak Counter & Badges", value: "Gamified Streaks" }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.value}</p>
                <p className="text-base font-black text-slate-200">{stat.title}</p>
              </div>
            ))}
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
                  href={`/jobs/${job.drive_slug}`}
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
                        {job.company_name} Careers Hiring {job.drive_title} 2026 Apply Now
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

      <div className="mt-32">
        <NewsletterSection />
      </div>
    </div>
  );
}