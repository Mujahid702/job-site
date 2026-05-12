import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                Bugged<span className="text-accent">Brain</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Leading job board for freshers and experienced candidates. Find the perfect job for your profile with our verified openings.
            </p>
          </div>

          {/* Discover More */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-6">Discover more</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><Link href="/latest-jobs" className="hover:text-accent">Latest Jobs</Link></li>
              <li><Link href="/exam-clearance" className="hover:text-accent">Exam Clearance</Link></li>
              <li><Link href="/testimonials" className="hover:text-accent">Testimonials</Link></li>
              <li><Link href="/software-jobs" className="hover:text-accent">Software Jobs</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-6">Legal Links</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><Link href="/about" className="hover:text-accent">About US</Link></li>
              <li><Link href="/contact" className="hover:text-accent">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-accent">Terms and Conditions</Link></li>
              <li><Link href="/disclaimer" className="hover:text-accent">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                buggedbrain2026@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Copyright 2026 — BuggedBrain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
