"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ShieldAlert, Sparkles, LogIn } from "lucide-react";

export default function VerifiedPage() {
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("already") === "true") {
        setAlreadyVerified(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 px-4 md:px-8 font-sans flex items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600 rounded-full blur-[140px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600 rounded-full blur-[140px] opacity-10"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-200 overflow-hidden relative z-10 text-center space-y-8">
        
        {/* Animated Icon Area */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-indigo-100 rounded-[2rem] animate-pulse"></div>
          <div className="absolute inset-2 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg relative z-10">
            {alreadyVerified ? (
              <ShieldAlert className="w-9 h-9" />
            ) : (
              <CheckCircle className="w-9 h-9" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Email Validation OS</span>
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {alreadyVerified ? "Already Verified" : "Verification Complete"}
          </h1>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            {alreadyVerified
              ? "This email address has already been verified. You can log in directly."
              : "Your email has been verified. You can now sign in to your BuggedBrain account and begin building your placement journey."}
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="pt-2">
          <Link
            href="/login"
            className="w-full py-4 bg-indigo-650 text-white hover:bg-indigo-750 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Proceed to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
