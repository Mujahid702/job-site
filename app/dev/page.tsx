"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Terminal, Shield, ArrowRight, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";

export default function DevTenantPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Set tenant context
    try {
      localStorage.setItem("bb_active_tenant", "dev");
      document.cookie = "bb_tenant=dev; path=/; max-age=2592000; SameSite=Lax";
    } catch {}

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace("/?tenant=dev");
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
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Development Tenant Active
        </div>

        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Developer Workspace
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Activated tenant profile for new feature iteration, bug fixing, automated UI testing, and developer tools.
          </p>
        </div>

        {/* Feature List */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Isolated Cache Keyspace
            </span>
            <code className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded font-mono">dev:*</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Simulated Payment Gateway
            </span>
            <span className="text-emerald-400 font-medium">Mock Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              1-Click Admin Privileges
            </span>
            <span className="text-amber-300 font-medium">Unrestricted</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/?tenant=dev"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Enter Dev Tenant Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/admin"
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Admin Portal
            </Link>
            <Link
              href="/signup"
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Register User
            </Link>
          </div>
        </div>

        {/* Countdown footer */}
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
          Redirecting to main interface in {countdown}s...
        </p>
      </div>
    </div>
  );
}
