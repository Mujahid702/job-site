"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function FeatureUnavailable() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
        {/* Soft background glow decoration */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-rose-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner border border-rose-100/50 animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display leading-tight">
              Feature Temporarily Unavailable
            </h3>
            <p className="text-slate-550 font-bold text-xs uppercase tracking-widest text-indigo-500 font-mono">
              System Enhancement In Progress
            </p>
          </div>

          <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm mx-auto">
            This module is currently under enhancement and will return in an upcoming platform release.
          </p>
          
          <div className="pt-4 border-t border-slate-100">
            <Link 
              href="/dashboard"
              className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-650 transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-100 flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
