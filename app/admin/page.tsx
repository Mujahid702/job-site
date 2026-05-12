import { createClient } from "@/lib/supabase/server";
import { Briefcase, Users, Eye, TrendingUp, Calendar, MapPin, ExternalLink, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch some stats
  const { count: totalJobs } = await supabase.from("jobs").select("*", { count: 'exact', head: true });
  
  // For now, let's just fetch latest 5 jobs for the table
  const { data: latestJobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total Jobs", value: totalJobs || 0, icon: Briefcase, color: "bg-blue-500" },
    { label: "Total Applications", value: "2.4k", icon: Users, color: "bg-green-500" },
    { label: "Page Views", value: "15.8k", icon: Eye, color: "bg-indigo-500" },
    { label: "Engagement", value: "+12%", icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2">Overview of your job portal performance</p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/admin/new" 
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Post New Job
          </Link>
          <Link 
            href="/admin/drives/new" 
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Post New Drive
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900">Latest Job Postings</h2>
          <Link href="/admin/jobs" className="text-blue-600 font-bold hover:underline text-sm">View All Jobs</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Job Title & Company</th>
                <th className="px-8 py-4">Location</th>
                <th className="px-8 py-4">Date Posted</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestJobs?.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500 font-medium">{job.company}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {job.location}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/jobs/${job.slug}`} 
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link 
                        href={`/admin/edit/${job.id}`} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}