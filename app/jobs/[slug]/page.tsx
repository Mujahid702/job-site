import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  MessageSquare,
  User,
  Calendar,
  FolderOpen,
  Eye,
  CheckCircle2,
  AlertCircle,
  Video,
  ChevronRight,
  XCircle,
  Globe,
  MapPin,
  Briefcase,
  Zap,
  Target,
  Sparkles
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ViewTracker from "@/components/ViewTracker";
import FloatingApplyBar from "@/components/FloatingApplyBar";
import PrepChecklist from "@/components/PrepChecklist";
import SalaryBenchmark from "@/components/SalaryBenchmark";
import SocialShare from "@/components/SocialShare";
import { Job } from "@/types/job";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: job } = await supabase
    .from("job_postings")
    .select("*")
    .eq("drive_slug", slug)
    .single();

  if (!job) return {};

  return {
    title: job.meta_title || `${job.company_name} Hiring ${job.drive_title} 2026 | Eligibility, Salary & Apply`,
    description: job.meta_description || `Apply for ${job.drive_title} at ${job.company_name}. Check eligibility, salary details, selection process and interview questions for 2026 graduates.`,
    keywords: job.keywords,
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: jobData } = await supabase
    .from("job_postings")
    .select("*")
    .eq("drive_slug", slug)
    .single();

  const job = jobData as Job;

  if (!job) return <div className="p-10 text-center">Job not found</div>;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      <FloatingApplyBar 
        jobTitle={job.drive_title} 
        companyName={job.company_name} 
        applyLink={job.apply_link}
        jobId={job.id}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-24">
            
            {/* Header Area */}
            <div className="space-y-10">
              <div className="flex flex-wrap gap-2">
                {job.category && (
                  <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded">{job.category}</span>
                )}
                {job.job_type && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded">{job.job_type}</span>
                )}
                {job.experience_level && (
                  <span className="px-3 py-1 bg-pink-50 text-pink-500 text-[10px] font-black uppercase tracking-widest rounded">{job.experience_level}</span>
                )}
                {job.is_featured && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                    <Zap className="w-2 h-2 fill-amber-600" />
                    Featured
                  </span>
                )}
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {job.company_logo && (
                  <div className="shrink-0 w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-center justify-center shadow-sm">
                    <img src={job.company_logo} alt={job.company_name} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight font-display">
                    {job.company_name} Careers Hiring {job.drive_title} 2026 Apply Now
                  </h1>
                  {job.company_website && (
                    <a href={job.company_website} target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">
                      <Globe className="w-3.5 h-3.5" />
                      Visit Company Website
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  BuggedBrain
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                {job.tags && job.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-accent" />
                    {job.tags.join(', ')}
                  </div>
                )}
              </div>
              <SocialShare url={`/jobs/${job.drive_slug}`} title={`${job.company_name} is hiring ${job.drive_title} 2026 - Apply Now!`} />
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
               <Eye className="w-4 h-4" />
               {job.views_count || 0} views
            </div>

            <ViewTracker jobId={job.id} />

            {/* AI Job Pulse Section */}
            <div className="p-8 md:p-12 glass-card rounded-[3rem] space-y-8 relative overflow-hidden border-2 border-accent/10">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="w-32 h-32 fill-accent" />
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">Job Pulse Live</p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 font-display">Role Insights & Activity</h3>
                  </div>
                  
                  {(job.views_count || 0) > 100 && (
                    <div className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-lg shadow-accent/20 animate-bounce">
                      <Zap className="w-3 h-3 fill-white" />
                      Trending Job
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</p>
                    <p className="text-lg font-black text-slate-900">
                      {Math.floor((job.views_count || 0) * 0.4) + 5} people viewed today
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Difficulty</p>
                    <p className="text-lg font-black text-blue-600">
                      {job.experience_level?.toLowerCase().includes('fresher') ? 'Moderate' : 'Advanced'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Rating</p>
                    <div className="flex items-center gap-1">
                       {[1,2,3,4].map(i => <Zap key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                       <Zap className="w-4 h-4 text-slate-200" />
                    </div>
                  </div>
               </div>

               <div className="p-6 bg-white/50 rounded-2xl border border-white/50 space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-black text-accent uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Summary
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed italic">
                    "This role at {job.company_name} is ideal for {job.experience_level || 'Freshers'} looking to start in {job.location || 'India'}. 
                    Key focus is on {job.required_skills?.split(',')[0] || 'Technical Skills'} and {job.required_skills?.split(',')[1] || 'Problem Solving'}. 
                    Apply early to beat the high volume of interest."
                  </p>
               </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-lg font-black text-slate-900">{job.location || 'Not Specified'}</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Type</p>
                    <p className="text-lg font-black text-slate-900">{job.job_type || 'Full Time'}</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                    <p className="text-lg font-black text-slate-900">{job.experience_level || 'Freshers'}</p>
                  </div>
               </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-24">
              {job.drive_description && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Overview :-</h2>
                  <p className="text-xl text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                    {job.drive_description}
                  </p>
                </section>
              )}

              <section className="space-y-10 section-spacing">
                 <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Job Details :-</h2>
                 <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <table className="job-table w-full">
                     <tbody className="divide-y divide-slate-100">
                       <tr className="bg-white">
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50 w-1/3">Company</td>
                         <td className="px-8 py-6 text-slate-600 font-bold">{job.company_name}</td>
                       </tr>
                       <tr className="bg-white">
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50">Role</td>
                         <td className="px-8 py-6 text-slate-600 font-bold">{job.drive_title}</td>
                       </tr>
                       <tr className="bg-white">
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50">Experience</td>
                         <td className="px-8 py-6 text-slate-600 font-bold">{job.experience_level || 'Freshers'}</td>
                       </tr>
                       <tr className="bg-white">
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50">Salary</td>
                         <td className="px-8 py-6 text-slate-600 font-bold font-mono">{job.salary_range || 'Competitive'}</td>
                       </tr>
                       <tr className="bg-white">
                         <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50">Location</td>
                         <td className="px-8 py-6 text-slate-600 font-bold">{job.location || 'India'}</td>
                       </tr>
                       {job.required_skills && (
                        <tr className="bg-white">
                          <td className="px-8 py-6 font-black text-slate-900 uppercase text-xs tracking-widest bg-slate-50/50">Skills</td>
                          <td className="px-8 py-6 text-slate-600 font-bold">{job.required_skills}</td>
                        </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </section>

              <SalaryBenchmark salaryRange={job.salary_range || "4 LPA"} category={job.category || "Software"} />

              {job.eligibility_criteria && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Eligibility Criteria :-</h2>
                  <div className="p-10 bg-blue-50/50 border border-blue-100 rounded-[2.5rem]">
                    <p className="text-xl text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {job.eligibility_criteria}
                    </p>
                  </div>
                </section>
              )}

              {job.key_responsibilities && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Responsibilities :-</h2>
                  <p className="text-xl text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                    {job.key_responsibilities}
                  </p>
                </section>
              )}

              {job.selection_process && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Selection Process :-</h2>
                  <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white">
                    <p className="text-xl text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                      {job.selection_process}
                    </p>
                  </div>
                </section>
              )}

              <PrepChecklist jobId={job.id} />

              {/* YouTube Guide Section */}
              <section className="p-10 bg-red-600 rounded-[2.5rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                    <Video className="w-32 h-32" />
                 </div>
                 <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Video className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black tracking-tight">Watch Preparation Guide</h3>
                       <p className="text-red-50 text-lg font-medium leading-relaxed max-w-xl">
                          We've created a complete video guide on how to crack the {job.company_name} recruitment process for 2026.
                       </p>
                    </div>
                    <Link 
                      href="https://youtube.com" 
                      target="_blank"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 font-black rounded-2xl hover:bg-slate-50 transition-colors shadow-xl"
                    >
                       Watch on YouTube
                       <ChevronRight className="w-5 h-5" />
                    </Link>
                 </div>
              </section>

              {job.resume_tips && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Resume Tips :-</h2>
                  <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
                    <p className="text-xl text-indigo-900 leading-relaxed font-bold whitespace-pre-wrap">
                      {job.resume_tips}
                    </p>
                  </div>
                </section>
              )}

              {job.interview_questions_tips && (
                <section className="space-y-10">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Interview Preparation :-</h2>
                  <div className="p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
                    <p className="text-xl text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                      {job.interview_questions_tips}
                    </p>
                  </div>
                </section>
              )}

              {/* WhatsApp Community CTA */}
              <section className="p-10 bg-green-600 rounded-[2.5rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                    <MessageSquare className="w-32 h-32" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black tracking-tight">Join WhatsApp Community</h3>
                       <p className="text-green-50 text-lg font-medium leading-relaxed max-w-md">
                          Get instant job alerts and exclusive placement material directly on your phone.
                       </p>
                    </div>
                    <Link 
                      href="https://whatsapp.com" 
                      target="_blank"
                      className="inline-flex items-center gap-3 px-10 py-5 bg-white text-green-600 font-black rounded-2xl hover:bg-green-50 transition-all shadow-2xl"
                    >
                       Join Now
                       <ChevronRight className="w-6 h-6" />
                    </Link>
                 </div>
              </section>

              {/* Apply Now Section */}
              <section id="apply" className="py-24 border-t border-slate-100 space-y-16">
                 <div className="text-center space-y-4">
                    <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter font-display">Ready to Apply?</h2>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Click the button below to submit your application on the official portal.</p>
                 </div>
                 
                 <div className="flex flex-col items-center gap-12">
                    <a href={`/api/track/apply?id=${job.id}&url=${encodeURIComponent(job.apply_link)}`} target="_blank" className="w-full max-w-md">
                      <button className="w-full py-6 bg-accent text-white text-2xl font-black rounded-[2rem] shadow-2xl shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                        Apply Now
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </a>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                      <div className="flex gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <AlertCircle className="w-6 h-6 text-accent" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-black text-slate-900 leading-tight">Review Carefully</p>
                          <p className="text-slate-500 font-medium">Make sure you meet all the eligibility criteria before applying.</p>
                        </div>
                      </div>
                      <div className="flex gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-accent" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-black text-slate-900 leading-tight">Verified Postings</p>
                          <p className="text-slate-500 font-medium">All our job links lead directly to official company career portals.</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </section>

              {/* Post Navigation */}
              <div className="flex justify-between items-center py-10 border-t border-slate-100">
                 <Link href="/" className="text-sm font-black text-slate-400 uppercase hover:text-accent flex items-center gap-2 transition-colors">
                   <ChevronRight className="w-4 h-4 rotate-180" />
                   Back to Home
                 </Link>
                 <div className="hidden md:flex gap-4">
                    {job.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl">{tag}</span>
                    ))}
                 </div>
              </div>
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

