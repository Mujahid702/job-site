import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-24 pb-12 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter text-white uppercase">
                Bugged<span className="text-blue-500">Brain</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              The premium career destination for the class of 2026. Empowering freshers with verified opportunities and expert roadmaps.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Mail className="w-5 h-5 text-slate-300" />
              </a>
            </div>
          </div>

          {/* Career Resources */}
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Resources</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-300">
              <li><Link href="/prep-hub" className="hover:text-blue-400 transition-colors">Preparation Hub</Link></li>
              <li><Link href="/salary-insights" className="hover:text-blue-400 transition-colors">Salary Insights</Link></li>
              <li><Link href="/latest-jobs" className="hover:text-blue-400 transition-colors">Latest Openings</Link></li>
              <li><Link href="/software-jobs" className="hover:text-blue-400 transition-colors">Software Jobs</Link></li>
            </ul>
          </div>

          {/* Companies */}
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Top Companies</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-300">
              <li><Link href="/search?q=google" className="hover:text-blue-400 transition-colors">Google Careers</Link></li>
              <li><Link href="/search?q=amazon" className="hover:text-blue-400 transition-colors">Amazon Jobs</Link></li>
              <li><Link href="/search?q=tcs" className="hover:text-blue-400 transition-colors">TCS Off-Campus</Link></li>
              <li><Link href="/search?q=wipro" className="hover:text-blue-400 transition-colors">Wipro Drives</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Support</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">Need help? Reach out to our team.</p>
            <a href="mailto:buggedbrain2026@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
              Email Support
            </a>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            &copy; 2026 BuggedBrain — Built for the Future.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
