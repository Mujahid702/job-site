import { Users, Target, Award, Sparkles } from "lucide-react";

export const metadata = {
  title: "About Us | BuggedBrain",
  description: "Learn more about BuggedBrain, the leading job board for freshers and 2026 graduates.",
};

export default function AboutPage() {
  return (
    <div className="pb-32">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-black uppercase tracking-widest mb-8 border border-blue-500/20">
            <Sparkles className="w-4 h-4 fill-blue-400" />
            Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
            Empowering the Next <br />
            <span className="text-blue-400">Generation of Talent</span>.
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            BuggedBrain is more than just a job board. We are a dedicated ecosystem built to bridge the gap between ambitious freshers and top-tier tech companies.
          </p>
        </div>
      </section>

      {/* Vision & Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-500 transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors">
              <Users className="w-8 h-8 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">User-First Approach</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Every feature we build is designed to make the job search process smoother, faster, and more transparent for candidates.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-500 transition-all">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors">
              <Target className="w-8 h-8 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Precision Hiring</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              We curate only the most relevant and high-quality opportunities, ensuring that graduates find roles that truly match their potential.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-blue-500 transition-all">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors">
              <Award className="w-8 h-8 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Excellence Always</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              We strive for excellence in everything we do, from the quality of our listings to the support we provide to our community.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Who We Are</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            Founded in 2026, BuggedBrain emerged from a simple observation: the transition from campus to corporate is often chaotic and overwhelming. Our founders, veterans of the recruitment industry, set out to create a platform that doesn't just list jobs but guides careers.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mb-12">
            Today, BuggedBrain serves thousands of students across the country, providing them with real-time updates on off-campus drives, internships, and full-time software roles at companies ranging from agile startups to Fortune 500 giants.
          </p>

          <div className="bg-slate-50 rounded-[2.5rem] p-12 border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Why Choose Us?</h3>
            <ul className="space-y-4">
              {[
                "100% Verified Job Postings",
                "Dedicated focus on 2026 graduates",
                "Expert career guidance and exam preparation",
                "Direct links to official application portals",
                "Active community of job seekers"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-700 font-bold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
