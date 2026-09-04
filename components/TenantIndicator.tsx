"use client";

import React, { useState, useEffect } from "react";
import { getCurrentTenant, getTenantConfig, TenantConfig } from "@/lib/tenant";
import { 
  ShieldCheck, 
  Terminal, 
  TestTube2, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Layers, 
  Cpu, 
  Database,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function TenantIndicator() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);

  useEffect(() => {
    setMounted(true);
    setTenant(getTenantConfig());
  }, []);

  if (!mounted || !tenant || tenant.isProd) {
    // Production tenant renders pristine, clean UI with zero indicator footprint
    return null;
  }

  const isDev = tenant.isDev;
  const isStage = tenant.isStage;

  const bgGradient = isDev
    ? "from-amber-500/10 via-amber-500/5 to-slate-900/90 border-amber-500/30"
    : "from-purple-500/10 via-purple-500/5 to-slate-900/90 border-purple-500/30";

  const accentColor = isDev ? "text-amber-400" : "text-purple-400";
  const badgeClass = isDev
    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-purple-500/20 text-purple-300 border-purple-500/40";

  return (
    <aside 
      aria-label="Environment and Tenant Indicator"
      className="fixed bottom-4 right-4 z-50 font-sans select-none print:hidden"
    >
      {/* Expanded Tenant Details Card */}
      {expanded && (
        <div 
          className={`mb-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border p-4 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgGradient}`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isDev ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {isDev ? <Terminal className="w-4 h-4" /> : <TestTube2 className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {tenant.name}
                </h4>
                <p className="text-[10px] text-slate-400">Environment Active Profile</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {tenant.tagline}
            </p>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Cache Namespace:
                </span>
                <code className="font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded text-[10px]">
                  {tenant.redisPrefix}*
                </code>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Payments Gateway:
                </span>
                <span className="text-amber-300 text-[11px] font-medium">
                  {tenant.features.allowMockPayments ? "Sandbox Simulated" : "Live Gateway"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Target Role:
                </span>
                <span className="text-slate-200 text-[11px]">
                  {isDev ? "Developer (Unit Testing)" : "UAT Tester (QA)"}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Isolated Tenant Context
              </span>
              <span className="font-mono">v0.1.0-alpha</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${
          isDev
            ? "bg-slate-900/90 border-amber-500/40 text-amber-300 shadow-amber-500/10 hover:border-amber-400"
            : "bg-slate-900/90 border-purple-500/40 text-purple-300 shadow-purple-500/10 hover:border-purple-400"
        }`}
        title={`Click to view ${tenant.name} parameters`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span 
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDev ? "bg-amber-400" : "bg-purple-400"
              }`}
            />
            <span 
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isDev ? "bg-amber-500" : "bg-purple-500"
              }`}
            />
          </span>

          <span className="text-[11px] font-bold tracking-wider uppercase">
            {tenant.badgeLabel}
          </span>
        </div>

        <div className="pl-1 border-l border-slate-700/60 text-slate-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </button>
    </aside>
  );
}
