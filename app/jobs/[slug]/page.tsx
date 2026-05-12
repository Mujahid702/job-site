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
import { ChevronRight, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ViewTracker from "@/components/ViewTracker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!job) return {};

  return {
    title: `${job.company} Hiring ${job.title} 2026 | Eligibility, Salary & Apply`,
    description: `Apply for ${job.title} at ${job.company}. Check eligibility, salary details, selection process and interview questions for 2026 graduates.`,
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!job) return <div className="p-10 text-center">Job not found</div>;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-24">
            
            {/* Header Area */}
            <div className="space-y-10">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded">2025-2026 Jobs</span>
                <span className="px-3 py-1 bg-pink-50 text-pink-500 text-[10px] font-black uppercase tracking-widest rounded">Experienced</span>
                <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded">Freshers</span>
              </div>

              <h1 className="text-3xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                {job.company} Careers Hiring Hybrid {job.salary} 2026 Apply Now
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  BuggedBrain
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  No Comments
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-accent" />
                  2025-2026 Jobs, Experienced, Freshers
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
               <Eye className="w-4 h-4" />
               {job.views || 0} views
            </div>

            <ViewTracker jobId={job.id} />

            {/* YouTube Guide Section - NEW */}
            <section className="p-10 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                  <Video className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
                     <Video className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-3xl font-black tracking-tight">Watch Preparation Guide</h3>
                     <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                        We've created a complete video guide on how to crack the {job.company} recruitment process for 2026.
                     </p>
                  </div>
                  <Link 
                    href="https://youtube.com" 
                    target="_blank"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-red-50 transition-colors shadow-xl"
                  >
                     Watch on YouTube
                     <ChevronRight className="w-5 h-5" />
                  </Link>
               </div>
            </section>

            {/* Job Description Table */}
            <section className="space-y-10 section-spacing">
               <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Job Description :-</h2>
               <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                 <table className="job-table">
                   <tbody>
                     <tr>
                       <td>Company Name</td>
                       <td>{job.company}</td>
                     </tr>
                     <tr>
                       <td>Job Role</td>
                       <td>{job.title}</td>
                     </tr>
                     <tr>
                       <td>Qualification</td>
                       <td>{job.eligibility.split('\n')[0] || 'Any Degree'}</td>
                     </tr>
                     <tr>
                       <td>Experience</td>
                       <td>Freshers</td>
                     </tr>
                     <tr>
                       <td>Batch</td>
                       <td>2024, 2025, 2026</td>
                     </tr>
                     <tr>
                       <td>Location</td>
                       <td>{job.location}</td>
                     </tr>
                     <tr>
                       <td>CTC/Salary</td>
                       <td>{job.salary}</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </section>

            {/* Resume Tips */}
            <section className="space-y-10 section-spacing">
               <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Tips to Prepare an ATS-Friendly Resume :-</h2>
               <p className="text-xl text-slate-500 leading-relaxed font-medium">
                  Getting your resume noticed by the Applicant Tracking System is super important if you want employers to actually see it. I'll give some tips to help make your resume look good to the computer system if you're applying to be a {job.title}.
               </p>
               <div className="space-y-6">
                  {[
                    { title: "Keep your resume concise and one page", desc: "Recruiters prefer short, focused resumes that highlight only key details." },
                    { title: "Use a clean, professional design", desc: "Simple layouts make your resume easy to read and look polished." },
                    { title: "Add job-related keywords for ATS", desc: "Including relevant terms helps your resume pass automated screening systems." },
                    { title: "Include a professional email and LinkedIn link", desc: "Shows credibility and makes it easy for recruiters to connect." },
                    { title: "Highlight key projects and achievements", desc: "Demonstrates real results and practical experience." }
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                      <p className="text-lg text-slate-700 leading-relaxed">
                        <span className="font-black">{tip.title}</span> – {tip.desc}
                      </p>
                    </div>
                  ))}
               </div>
            </section>

            {/* WhatsApp Community CTA - NEW */}
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

            {/* Interview Tips */}
            <section className="space-y-12 section-spacing">
               <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Tips for acing the job interview :-</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8 p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                     <h3 className="text-2xl font-black text-green-600 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" />
                        The Do's:
                     </h3>
                     <div className="space-y-6">
                       {[
                         "Look into the company and the stuff they need help with.",
                         "If you don't get something, ask them to explain More.",
                         "Walk them through how you think about fixing problems.",
                         "Use real examples from past work to show your skills.",
                         "Stay calm and confident. Work through problems slowly."
                       ].map((item, i) => (
                         <div key={i} className="flex gap-4 text-slate-600 font-bold leading-relaxed">
                           <span className="text-accent">—</span>
                           {item}
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="space-y-8 p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                     <h3 className="text-2xl font-black text-red-600 flex items-center gap-3">
                        <XCircle className="w-6 h-6" />
                        The Don'ts:
                     </h3>
                     <div className="space-y-6">
                       {[
                         "Don’t guess if you aren’t sure. Explain your thinking.",
                         "Keep your answers simple and clear.",
                         "Remember to talk about teamwork and problem fixing.",
                         "Take your time to think before answering.",
                         "Ask good questions to show you care."
                       ].map((item, i) => (
                         <div key={i} className="flex gap-4 text-slate-600 font-bold leading-relaxed">
                           <span className="text-accent">—</span>
                           {item}
                         </div>
                       ))}
                     </div>
                  </div>
               </div>
            </section>

            <section className="p-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
               <h2 className="text-2xl font-black text-slate-900">We post only official company job openings – verified</h2>
               <div className="space-y-2 text-slate-600 font-medium">
                  <p>Read the <span className="font-black text-slate-900">full job description carefully</span> before applying.</p>
                  <p>Apply <span className="font-black text-slate-900">only once per job</span> to avoid duplicate submissions.</p>
                  <p>Submitting the form correctly <span className="font-black text-slate-900">increases your shortlisting chances.</span></p>
                  <p>Stay active — shortlisted candidates are contacted <span className="font-black text-slate-900">directly by the company.</span></p>
               </div>
            </section>

            {/* Application Suggestions (From User) */}
            <section className="space-y-6">
               <h2 className="text-3xl font-black text-slate-900 uppercase">General Suggestions for Filling Out an Application Form :-</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { title: "Read Instructions Carefully", desc: "Don’t skip any part. Follow formatting rules (dates as MM/DD/YYYY)." },
                    { title: "Gather Your Documents First", desc: "ID/passport, transcripts, résumé/CV, certificates, etc." },
                    { title: "Use Clear and Consistent Information", desc: "Make sure your name, contact info, and dates match across documents." },
                    { title: "Avoid Leaving Fields Blank", desc: "Write “N/A” if something doesn’t apply to you." },
                    { title: "Highlight Strengths Clearly", desc: "Use bullet points for skills or accomplishments." },
                    { title: "Proofread Everything", desc: "Double-check spelling, grammar, and accuracy." },
                    { title: "Be Honest", desc: "False information can lead to rejection or disqualification." },
                    { title: "Double-Check Attachments", desc: "Ensure you’ve uploaded all required documents." }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <h4 className="font-black text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </section>

            {/* Apply Now Section */}
            <section id="apply" className="py-12 border-t border-slate-100 space-y-10">
               <h2 className="text-4xl font-black text-slate-900 uppercase text-center">Apply Link :-</h2>
               
               <div className="flex flex-col items-center gap-8">
                  <a href={`/api/track/apply?id=${job.id}&url=${encodeURIComponent(job.apply_link)}`} target="_blank" className="w-full max-w-sm">
                    <button className="w-full py-5 bg-accent text-white text-xl font-black rounded-xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
                      Apply Now
                    </button>
                  </a>

                  <div className="w-full max-w-2xl space-y-6 text-sm">
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <p className="font-black text-slate-900 mb-1">Read the Job Description Carefully</p>
                        <p className="text-slate-500">Understand the required qualifications, job responsibilities, and any specific skills needed.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <p className="font-black text-slate-900 mb-1">Click on ‘Apply’ or ‘Submit Resume’</p>
                        <p className="text-slate-500">Create or log in to your profile, then click on the Apply button.</p>
                      </div>
                    </div>
                  </div>
               </div>
            </section>

            {/* Post Navigation */}
            <div className="flex justify-between items-center py-10 border-t border-slate-100">
               <Link href="#" className="text-sm font-bold text-slate-400 uppercase hover:text-accent flex items-center gap-2">
                 <ChevronRight className="w-4 h-4 rotate-180" />
                 Previous Post
               </Link>
               <Link href="#" className="text-sm font-bold text-slate-400 uppercase hover:text-accent flex items-center gap-2">
                 Next Post
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
