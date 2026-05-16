import { createClient } from "@/lib/supabase/server";
import { Briefcase, MapPin, Calendar, ExternalLink, Edit2, Trash2, Search, Eye, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function ManageJobs() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage Opportunities</h1>
          <p className="text-slate-500 mt-2">View and manage all active job postings and recruitment drives</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search jobs, companies..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Opportunity & Company</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Analytics</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${job.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${job.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
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
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{job.drive_title}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{job.company_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{job.job_type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Views</span>
                        <div className="flex items-center gap-1.5 text-slate-900 font-black">
                          <Eye className="w-4 h-4 text-blue-500" />
                          {job.views_count || 0}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Clicks</span>
                        <div className="flex items-center gap-1.5 text-slate-900 font-black">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          {job.applications_count || 0}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <Link 
                        href={`/jobs/${job.drive_slug}`} 
                        target="_blank"
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View Live"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link 
                        href={`/admin/edit/${job.id}`} 
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Posting"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button 
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Posting"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!jobs?.length && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No jobs found</h3>
            <p className="text-slate-500 mt-2">Start by posting a new opportunity</p>
          </div>
        )}
      </div>
    </div>
  );
}
