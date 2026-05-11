import { CheckCircle2, GraduationCap, Trophy, ArrowRight, Zap, Star } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Exam Clearance Service | BuggedBrain",
  description: "Boost your chances of clearing top tech company exams with our expert guidance.",
};

export default function ExamClearancePage() {
  return (
    <div className="pb-32">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-10">
             <div className="absolute top-[10%] left-0 w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[10%] right-0 w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
           </div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-black uppercase tracking-widest mb-10 border border-blue-100 shadow-sm">
            <Trophy className="w-4 h-4" />
            98% Success Rate
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
            Master the <br />
            <span className="text-accent">Recruitment Code</span>.
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            Personalized coaching and resources designed specifically for 2026 graduates to clear aptitude and technical rounds of top MNCs.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-accent transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest flex items-center gap-3">
              Enroll Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-5 bg-white text-slate-900 border border-slate-200 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest">
              View Curriculum
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Aptitude Mastery",
              description: "Shortcuts and tricks for Quant, Logical, and Verbal rounds tailored for companies like TCS, Infosys, and Wipro.",
              color: "bg-blue-50 text-blue-600"
            },
            {
              icon: <Star className="w-8 h-8" />,
              title: "Coding Simplified",
              description: "Step-by-step guidance on DSA and programming fundamentals asked in product-based company rounds.",
              color: "bg-indigo-50 text-indigo-600"
            },
            {
              icon: <GraduationCap className="w-8 h-8" />,
              title: "Mock Assessments",
              description: "Real-time exam simulation with platform interfaces that mirror actual recruitment tests.",
              color: "bg-emerald-50 text-emerald-600"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-accent transition-all group">
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-900 py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
                Our Proven Process to <br />
                <span className="text-blue-400">Clear Any Exam</span>.
              </h2>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Assessment", text: "We analyze your current skill level through a diagnostic test." },
                  { step: "02", title: "Targeted Training", text: "Focus only on concepts relevant to your dream companies." },
                  { step: "03", title: "Intensive Practice", text: "Solve 1000+ hand-picked questions from past papers." },
                  { step: "04", title: "Final Simulation", text: "Clear 5 full-length mock exams before the real deal." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <span className="text-2xl font-black text-blue-500/50">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-slate-400 font-medium">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2">
               <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-sm relative">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[80px]"></div>
                  <h3 className="text-3xl font-black text-white mb-8">What You'll Get:</h3>
                  <ul className="space-y-4">
                    {[
                      "Daily Live Sessions (Recorded Available)",
                      "Handwritten Notes & Cheat Sheets",
                      "Company-Specific Question Banks",
                      "Interview Preparation Guidance",
                      "Lifetime Access to Community"
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-300 font-bold">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full mt-12 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all uppercase tracking-widest">
                    Start Your Prep Today
                  </button>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
