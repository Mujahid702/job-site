import { 
  BookOpen, 
  Code2, 
  Terminal, 
  Cpu, 
  Layers, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GitBranch
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Preparation Hub | BuggedBrain",
  description: "Master interview rounds with curated roadmaps, DSA resources, and system design guides for 2026 graduates.",
};

const roadmaps = [
  {
    title: "Frontend Mastery",
    description: "React, Next.js, and Modern CSS architectures.",
    icon: <Code2 className="w-6 h-6" />,
    color: "blue",
    steps: ["JavaScript Fundamentals", "React & Hooks", "Performance Optimization", "Browser Internals"]
  },
  {
    title: "Backend Engineering",
    description: "Scalable APIs, Databases, and System Design.",
    icon: <Terminal className="w-6 h-6" />,
    color: "indigo",
    steps: ["Node.js/Go Basics", "SQL & NoSQL Design", "Caching Strategies", "Message Queues"]
  },
  {
    title: "Data Structures & Algo",
    description: "Mastering the coding rounds at Big Tech.",
    icon: <Layers className="w-6 h-6" />,
    color: "emerald",
    steps: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Bit Manipulation"]
  }
];

export default function PrepHubPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-slate-900 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">
            <Sparkles className="w-4 h-4 fill-blue-400" />
            Ace Your Next Interview
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
            The Ultimate <br />
            <span className="text-blue-500">Career Playbook.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Curated resources, industry roadmaps, and interview experiences to help you land offers from companies like Google, TCS, and Amazon.
          </p>
        </div>
      </section>

      {/* Roadmaps Grid */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Learning Roadmaps</h2>
              <p className="text-lg text-slate-500 font-medium">Step-by-step guides for modern tech roles.</p>
            </div>
            <Link href="/latest-jobs" className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest hover:translate-x-1 transition-transform">
              View Openings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {roadmaps.map((roadmap, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
                <div className={`w-16 h-16 bg-${roadmap.color}-50 text-${roadmap.color}-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner`}>
                  {roadmap.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{roadmap.title}</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{roadmap.description}</p>
                <div className="space-y-4">
                  {roadmap.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 text-${roadmap.color}-500`} />
                      {step}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-10 py-4 bg-slate-900 text-white font-black rounded-2xl group-hover:bg-blue-600 transition-all shadow-lg">
                  Start Roadmap
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Cards */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/30 blur-[100px] -mb-32 -mr-32"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-8">
                  Open Source <br /> Interview Kit.
                </h2>
                <p className="text-xl text-slate-400 font-medium leading-relaxed mb-12">
                  Our community-driven interview kit includes 200+ solved problems, mock interview templates, and behavioral guides.
                </p>
                <div className="flex flex-wrap gap-6">
                  <a href="#" className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-50 transition-all">
                    <GitBranch className="w-5 h-5" />
                    Star on GitHub
                  </a>
                  <a href="#" className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                    Get Access
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "DSA Problems", count: "250+" },
                  { label: "Company Sets", count: "40+" },
                  { label: "System Design", count: "15+" },
                  { label: "HR Templates", count: "10+" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                    <div className="text-3xl font-black text-white mb-2">{stat.count}</div>
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
