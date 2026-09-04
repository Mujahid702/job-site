"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TestTube2, Shield, ArrowRight, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";

export default function StageTenantPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Set tenant context to stage
    try {
      localStorage.setItem("bb_active_tenant", "stage");
      document.cookie = "bb_tenant=stage; path=/; max-age=2592000; SameSite=Lax";
    } catch {}

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace("/?tenant=stage");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          Staging & UAT Tenant Active
        </div>

        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
            <TestTube2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            UAT Acceptance Environment
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pre-production environment for User Acceptance Testing (UAT), end-to-end regression suites, and release sign-offs.
          </p>
        </div>

        {/* Feature List */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Isolated Cache Keyspace
            </span>
            <code className="text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded font-mono">stage:*</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Payment Gateway
            </span>
            <span className="text-purple-300 font-medium">Sandbox Mode</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Target Audience
            </span>
            <span className="text-slate-200 font-medium">QA Testers & Stakeholders</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/?tenant=stage"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Enter UAT Tenant Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/admin"
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Admin Portal
            </Link>
            <Link
              href="/signup"
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Register User
            </Link>
          </div>
        </div>

        {/* Countdown footer */}
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />
          Redirecting to UAT interface in {countdown}s...
        </p>
      </div>
    </div>
  );
}
