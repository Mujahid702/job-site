import Link from "next/link";
import { Search, Video, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default async function Sidebar() {
  const { data: recentJobs } = await supabase
    .from("job_postings")
    .select("drive_title, drive_slug, company_name")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <aside className="space-y-16">
      {/* Search Widget */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="sidebar-header">Search Opportunities</h3>
        <form action="/search" method="GET" className="relative group">
          <input 
            suppressHydrationWarning
            name="q"
            type="text" 
            placeholder="Search jobs..." 
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all font-medium"
          />
          <button suppressHydrationWarning type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-accent text-white rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-md">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* YouTube Promotion Widget */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 bg-gradient-to-br from-red-50 to-white">
        <h3 className="sidebar-header">YouTube Channel</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
          Subscribe to our YouTube channel for latest job updates, interview tips, and placement preparation guides.
        </p>
        <Link 
          href="https://youtube.com/@buggedbrain25?si=KCFxnvILvUyn3M5_" 
          target="_blank"
          className="flex items-center justify-center gap-3 w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
        >
          <Video className="w-5 h-5" />
          Subscribe Now
        </Link>
      </div>

      {/* WhatsApp Community Widget */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 bg-gradient-to-br from-green-50 to-white">
        <h3 className="sidebar-header">WhatsApp Group</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
          Join our WhatsApp community to get instant job alerts directly on your phone.
        </p>
        <Link 
          href="https://chat.whatsapp.com/DYALTIh1csSHuV0zdD9ONW" 
          target="_blank"
          className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
        >
          <MessageSquare className="w-5 h-5" />
          Join Community
        </Link>
      </div>

      {/* Recent Posts Widget */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="sidebar-header">Recent Posts</h3>
        <div className="space-y-6">
          {recentJobs?.map((job) => (
            <div key={job.drive_slug} className="group">
              <Link 
                href={`/jobs/${job.drive_slug}`}
                className="text-sm font-extrabold text-slate-700 group-hover:text-accent transition-colors line-clamp-2 leading-snug"
              >
                {job.drive_title} {job.company_name ? `at ${job.company_name}` : ''}
              </Link>
              <div className="mt-4 h-[1px] w-full bg-slate-50 group-last:hidden" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
