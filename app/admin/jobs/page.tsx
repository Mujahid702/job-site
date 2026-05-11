import { createClient } from "@/lib/supabase/server";
import { Briefcase, MapPin, Calendar, ExternalLink, Edit2, Trash2, Search } from "lucide-react";
import Link from "next/link";

export default async function ManageJobs() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage Jobs</h1>
          <p className="text-slate-500 mt-2">Manage your active job postings</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search jobs..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Job Title & Company</th>
                <th className="px-8 py-4">Location</th>
                <th className="px-8 py-4">Salary</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs?.map((job) => (
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
                    <div className="text-sm font-bold text-blue-600">
                      {job.salary}
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
