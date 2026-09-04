"use client";

import React, { useState, useEffect } from "react";
import { getCurrentTenant, getTenantConfig, setActiveTenant, TenantConfig, TenantId } from "@/lib/tenant";
import { 
  ShieldCheck, 
  Terminal, 
  TestTube2, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Layers, 
  Globe, 
  Database,
  CheckCircle2,
  ExternalLink,
  Shield,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

export default function TenantIndicator() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTenant(getTenantConfig());
  }, []);

  if (!mounted || !tenant) {
    return null;
  }

  const isDev = tenant.isDev;
  const isStage = tenant.isStage;
  const isProd = tenant.isProd;

  const bgGradient = isDev
    ? "from-amber-500/15 via-slate-900/95 to-slate-950/95 border-amber-500/40"
    : isStage
    ? "from-purple-500/15 via-slate-900/95 to-slate-950/95 border-purple-500/40"
    : "from-emerald-500/15 via-slate-900/95 to-slate-950/95 border-emerald-500/40";

  const handleSwitchTenant = (id: TenantId) => {
    setActiveTenant(id);
  };

  const copyCurrentTenantLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/?tenant=${tenant.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside 
      aria-label="Environment and Tenant Switcher"
      className="fixed bottom-4 right-4 z-50 font-sans select-none print:hidden"
    >
      {/* Expanded Tenant Details & Switcher Panel */}
      {expanded && (
        <div 
          className={`mb-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border p-4 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgGradient}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div 
                className={`p-1.5 rounded-lg ${
                  isDev 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : isStage 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isDev ? (
                  <Terminal className="w-4 h-4" />
                ) : isStage ? (
                  <TestTube2 className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {tenant.name}
                </h4>
                <p className="text-[10px] text-slate-400">Active Tenant Environment</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {tenant.tagline}
            </p>

            {/* Tenant Selector Buttons */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Switch Active Tenant:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {/* DEV */}
                <button
                  onClick={() => handleSwitchTenant("dev")}
                  className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all ${
                    isDev
                      ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400"
                      : "bg-slate-800 text-slate-300 hover:bg-amber-950/40 hover:text-amber-300 border border-slate-700"
                  }`}
                >
                  🟡 DEV
                </button>

                {/* STAGE */}
                <button
                  onClick={() => handleSwitchTenant("stage")}
                  className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all ${
                    isStage
                      ? "bg-purple-500 text-white ring-2 ring-purple-400"
                      : "bg-slate-800 text-slate-300 hover:bg-purple-950/40 hover:text-purple-300 border border-slate-700"
                  }`}
                >
                  🟣 STAGE
                </button>

                {/* PROD */}
                <button
                  onClick={() => handleSwitchTenant("prod")}
                  className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all ${
                    isProd
                      ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-400"
                      : "bg-slate-800 text-slate-300 hover:bg-emerald-950/40 hover:text-emerald-300 border border-slate-700"
                  }`}
                >
                  🟢 PROD
                </button>
              </div>
            </div>

            {/* Tenant Attributes */}
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Cache Keyspace:
                </span>
                <code className="font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded text-[10px]">
                  {tenant.redisPrefix}*
                </code>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Payments:
                </span>
                <span className={`text-[11px] font-medium ${isDev || isStage ? "text-amber-300" : "text-emerald-400"}`}>
                  {tenant.features.allowMockPayments ? "Sandbox Simulated" : "Production Gateway"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Role:
                </span>
                <span className="text-slate-200 text-[11px]">
                  {isDev ? "Developer (Unit Tests & UI)" : isStage ? "UAT Manual / Auto QA" : "Live User Operations"}
                </span>
              </div>
            </div>

            {/* Direct Tenant Action Links */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/admin"
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                Admin Panel
              </Link>
              <button
                onClick={copyCurrentTenantLink}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Pill Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${
          isDev
            ? "bg-slate-900/90 border-amber-500/40 text-amber-300 shadow-amber-500/10 hover:border-amber-400"
            : isStage
            ? "bg-slate-900/90 border-purple-500/40 text-purple-300 shadow-purple-500/10 hover:border-purple-400"
            : "bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10 hover:border-emerald-400"
        }`}
        title={`Active: ${tenant.name}. Click to switch tenants.`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span 
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDev ? "bg-amber-400" : isStage ? "bg-purple-400" : "bg-emerald-400"
              }`}
            />
            <span 
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isDev ? "bg-amber-500" : isStage ? "bg-purple-500" : "bg-emerald-500"
              }`}
            />
          </span>

          <span className="text-[11px] font-bold tracking-wider uppercase">
            {isDev ? "DEV TENANT" : isStage ? "STAGE (UAT)" : "PROD LIVE"}
          </span>
        </div>

        <div className="pl-1 border-l border-slate-700/60 text-slate-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </button>
    </aside>
  );
}
