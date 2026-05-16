import { 
  TrendingUp, 
  MapPin, 
  Building2, 
  DollarSign, 
  BarChart3, 
  ArrowUpRight,
  Info,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Fresher Salary Insights 2026 | BuggedBrain",
  description: "Real-time salary data for software engineers and freshers across major Indian cities and top tech companies.",
};

const topSalaries = [
  { company: "Google", role: "Software Engineer", salary: "18 - 32 LPA", growth: "+12%" },
  { company: "Amazon", role: "SDE-1", salary: "16 - 28 LPA", growth: "+8%" },
  { company: "Microsoft", role: "SDE", salary: "15 - 26 LPA", growth: "+10%" },
  { company: "TCS", role: "Digital/Prime", salary: "7.5 - 11 LPA", growth: "+15%" },
  { company: "Wipro", role: "Turbo", salary: "6.5 - 9 LPA", growth: "+5%" }
];

const cityTrends = [
  { city: "Bangalore", avg: "8.5 LPA", trend: "up", color: "blue" },
  { city: "Hyderabad", avg: "7.8 LPA", trend: "up", color: "indigo" },
  { city: "Pune", avg: "6.5 LPA", trend: "stable", color: "emerald" },
  { city: "NCR", avg: "7.2 LPA", trend: "up", color: "amber" }
];

export default function SalaryInsightsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <section className="bg-white border-b border-slate-200 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6">
                <TrendingUp className="w-4 h-4" />
                Live Salary Data 2026
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight mb-8">
                Know Your <span className="text-gradient">Worth.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                Access verified salary data from thousands of candidates. Make informed career decisions based on real market trends in India.
              </p>
            </div>
            <div className="shrink-0">
               <div className="w-64 h-64 bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-slate-200">
                  <BarChart3 className="w-12 h-12 text-blue-500" />
                  <div>
                    <div className="text-4xl font-black">7.2 LPA</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Avg. Fresher CTC</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Insights Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Top Company Salaries */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Top Company Payouts</h2>
                  <div className="px-4 py-2 bg-slate-50 rounded-xl text-slate-400 text-xs font-bold">2026 Batch</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {topSalaries.map((item, idx) => (
                    <div key={idx} className="p-10 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                          {item.company[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900">{item.company}</h3>
                          <p className="text-sm text-slate-500 font-bold">{item.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900">{item.salary}</div>
                          <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{item.growth} Growth</div>
                        </div>
                        <Link href={`/search?q=${item.company}`} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-slate-50 text-center">
                  <button className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline">View Full Database</button>
                </div>
              </div>
            </div>

            {/* Side Trends */}
            <div className="lg:col-span-4 space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">City Trends</h3>
                <div className="space-y-8">
                  {cityTrends.map((city, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 bg-${city.color}-500 rounded-full animate-pulse`}></div>
                        <span className="font-bold text-slate-700">{city.city}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">{city.avg}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg package</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] -mr-16 -mt-16"></div>
                <Info className="w-10 h-10 mb-6 text-blue-200" />
                <h4 className="text-xl font-black mb-4">Want more data?</h4>
                <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
                  Join our community of 10,000+ graduates to share and access detailed interview offers.
                </p>
                <button className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all uppercase tracking-widest text-xs">
                  Join the Community
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[4rem] p-12 md:p-20 text-center">
             <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8">Compare Offers & Benefits</h2>
             <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
               Beyond salary, we track ESOPs, Joining Bonuses, and Relocation packages to give you the full picture.
             </p>
             <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                   <Building2 className="w-5 h-5 text-blue-400" />
                   Stock Options
                </div>
                <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                   <DollarSign className="w-5 h-5 text-emerald-400" />
                   Sign-on Bonus
                </div>
                <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                   <Briefcase className="w-5 h-5 text-amber-400" />
                   Work Allowance
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
