import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Suspense } from "react";
import { SidebarPromo } from "@/components/PromoComponents";
import { Search as SearchIcon, Filter, Briefcase } from "lucide-react";

export const metadata = {
  title: "Search Jobs | BuggedBrain",
  description: "Search for the latest fresher jobs, internships and recruitment drives for 2026.",
};

async function SearchResults({ query }: { query: string }) {
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .or(`drive_title.ilike.%${query}%,company_name.ilike.%${query}%,drive_description.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (!jobs || jobs.length === 0) {
    return (
      <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
         <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
            <SearchIcon className="w-10 h-10" />
         </div>
         <h3 className="text-2xl font-black text-slate-900 mb-2">No matches found</h3>
         <p className="text-slate-500 font-medium max-w-sm mx-auto">
            We couldn't find any jobs matching "{query}". Try searching for broader terms like "Software" or "Intern".
         </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
           <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <SearchIcon className="w-4 h-4" />
              Search Results
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Found for <span className="text-gradient">"{q}"</span>
           </h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
           <Briefcase className="w-4 h-4" />
           Showing active listings
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Main Content */}
         <div className="lg:col-span-8">
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
                ))}
              </div>
            }>
              <SearchResults query={q || ""} />
            </Suspense>
         </div>

         {/* Sidebar */}
         <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
               <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Filter Results
               </h4>
               <p className="text-sm text-slate-500 font-bold leading-relaxed">Advanced filters for Location, Salary, and Experience are coming soon.</p>
            </div>

            <SidebarPromo 
               title="Resume Optimization"
               description="Increase your shortlisted chances by 80% with these ATS hacks for freshers."
               ctaText="Watch Masterclass"
               youtubeLink="https://youtube.com/@buggedbrain25"
               thumbnail="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2070"
            />
         </aside>
      </div>
    </div>
  );
}
