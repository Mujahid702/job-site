import { createClient } from "@/lib/supabase/server";
import { Briefcase, Users, Eye, TrendingUp, Calendar, MapPin, ExternalLink, Edit2, Trash2, Rocket } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch all jobs to aggregate analytics
  const { data: allJobs } = await supabase.from("job_postings").select("views_count, applications_count");

  const totalJobs = allJobs?.length || 0;
  const totalViews = allJobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0;
  const totalApplications = allJobs?.reduce((sum, job) => sum + (job.applications_count || 0), 0) || 0;
  
  // Calculate Engagement (Applications / Views * 100)
  const engagementRate = totalViews > 0 
    ? ((totalApplications / totalViews) * 100).toFixed(1) + "%" 
    : "0%";
  
  // Fetch latest 5 jobs for the table
  const { data: latestJobs } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Active Jobs", value: totalJobs, icon: Briefcase, color: "bg-blue-600" },
    { label: "Total Clicks", value: totalApplications, icon: Users, color: "bg-green-600" },
    { label: "Total Views", value: totalViews, icon: Eye, color: "bg-indigo-600" },
    { label: "Conversion", value: engagementRate, icon: TrendingUp, color: "bg-orange-600" },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Rocket className="w-4 h-4" />
            Admin Overview
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Dashboard</h1>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/admin/new" 
            className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2"
          >
            <Briefcase className="w-5 h-5" />
            Post Job
          </Link>
          <Link 
            href="/admin/drives/new" 
            className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            <Rocket className="w-5 h-5 text-indigo-400" />
            Post Drive
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-blue-200 transition-all">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Jobs Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Recently Added</h2>
          </div>
          <Link href="/admin/jobs" className="text-blue-600 font-black hover:text-blue-700 text-xs uppercase tracking-widest flex items-center gap-2 group">
            Manage All
            <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Opportunity & Company</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestJobs?.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       {job.company_logo ? (
                         <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100" />
                       ) : (
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <Briefcase className="w-5 h-5" />
                         </div>
                       )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.drive_title}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{job.company_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {job.location}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/jobs/${job.drive_slug}`} 
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link 
                        href={`/admin/edit/${job.id}`} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!latestJobs?.length && (
          <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            No active postings found
          </div>
        )}
      </div>
    </div>
  );
}