"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-12">
        <div className="relative">
          <h1 className="text-[12rem] font-black text-slate-100 leading-none tracking-tighter select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 animate-float">
                <Search className="w-12 h-12" />
             </div>
          </div>
        </div>

        <div className="space-y-4">
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Oops! This page is out of office.</h2>
           <p className="text-xl text-slate-500 font-medium leading-relaxed">
              We couldn't find the page you're looking for. It might have been moved or the job listing might have expired.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link 
            href="/" 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
           >
              <Home className="w-5 h-5" />
              Back to Home
           </Link>
           <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
           >
              <ArrowLeft className="w-5 h-5" />
              Go Back
           </button>
        </div>
      </div>
    </div>
  );
}
