"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden bg-slate-50/50">
      {/* Custom Styles for Animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-3deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 7s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>

      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-rose-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "-4s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "-8s" }} />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-2xl w-full text-center space-y-8 z-10">
        
        {/* Main 404 Illustration with Glassmorphic Floating Elements */}
        <div className="relative flex flex-col items-center justify-center py-6">
          {/* Background Rotating Ring */}
          <div className="absolute w-64 h-64 border border-dashed border-slate-200 rounded-full animate-spin-slow pointer-events-none" />
          <div className="absolute w-48 h-48 border border-dashed border-indigo-100 rounded-full animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "15s" }} />

          {/* Big Stylized 404 Typography */}
          <h1 className="text-[10rem] md:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-400/30 leading-none tracking-tighter select-none font-display drop-shadow-sm">
            404
          </h1>

          {/* Floating Focal Icon */}
          <div className="absolute -top-4 md:-top-8 animate-float-slow">
            <div className="relative w-28 h-28 bg-white/80 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-xl border border-white/60">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Search className="w-10 h-10 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Text Message Content */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100/60 shadow-sm">
            <span>Listing Unavailable</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-display">
            Oops! This page is out of office.
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved or the job listing might have expired.
          </p>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
          <Link 
            href="/" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-lg hover:shadow-indigo-150 hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2.5 shadow-md shadow-indigo-100"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition-all flex items-center justify-center gap-2.5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

