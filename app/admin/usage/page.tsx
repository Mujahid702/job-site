"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, Activity, Users, BarChart3, 
  CheckCircle2, XCircle, Clock, Calendar, AlertTriangle, ShieldAlert,
  Terminal, Search, RefreshCw, Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface UsageSummary {
  totalAtsScans: number;
  totalJdMatches: number;
  totalProjectsGenerated: number;
  totalExamsTaken: number;
  totalResumeBuilds: number;
  totalSpends: number;
  totalBlocks: number;
  uniqueUsers: number;
  averageRequests: number;
}

interface TelemetryLog {
  id: string;
  userName: string;
  email: string;
  feature: string;
  plan: string;
  timeMs: number;
  cost: number;
  blockedReason: string | null;
  timestamp: string;
}

interface SecurityEvent {
  id: string;
  userName: string;
  email: string;
  eventType: string;
  riskScore: number;
  timestamp: string;
  details: any;
}

export default function AdminUsageAnalytics() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<TelemetryLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsageData = async () => {
    try {
      const res = await fetch("/api/admin/usage-analytics");
      const result = await res.json();
      if (res.ok && result.success) {
        setSummary(result.summary);
        setRecentLogs(result.recentLogs || []);
        setSecurityEvents(result.securityEvents || []);
        setError(null);
      } else {
        setError(result.message || "Failed to load usage analytics.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();

    // Subscribe to realtime updates for feature telemetry and security events
    const supabase = createClient();
    const channel = supabase
      .channel("usage-telemetry-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_telemetry" },
        () => fetchUsageData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "security_events" },
        () => fetchUsageData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsageData();
  };

  if (loading && !summary) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-650 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Compiling telemetry details...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Failed to Load Usage Data</h2>
        <p className="text-slate-500 text-sm max-w-sm mt-1 mb-4">{error || "Verify database settings."}</p>
        <button 
          onClick={fetchUsageData}
          className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black rounded-xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredLogs = recentLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    return log.userName.toLowerCase().includes(q) ||
           log.feature.toLowerCase().includes(q) ||
           log.plan.toLowerCase().includes(q) ||
           (log.blockedReason && log.blockedReason.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-12 pb-20 font-sans text-left">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
            <Key className="w-4 h-4 text-indigo-500" />
            Identity-Based Management Console
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Usage & Quotas Dashboard</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Real-time audit monitoring of student monthly counters, limit exhausts, device hashes, and VPN/ disposable email alarms.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer text-xs font-bold shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Sync Quota metrics
        </button>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "AI Resource Spends", value: `$${summary.totalSpends.toFixed(4)}`, sub: "Estimated total billing", color: "bg-amber-500" },
          { label: "ATS Resume Scans", value: summary.totalAtsScans.toLocaleString(), sub: "Monthly allocations", color: "bg-blue-600" },
          { label: "JD Audits run", value: summary.totalJdMatches.toLocaleString(), sub: "Invocations count", color: "bg-violet-600" },
          { label: "Limit Exhaustions", value: summary.totalBlocks.toLocaleString(), sub: "Friction triggers block", color: "bg-rose-500" },
          { label: "Projects Advisor", value: summary.totalProjectsGenerated.toLocaleString(), sub: "Blueprints generated", color: "bg-indigo-600" },
          { label: "Mocks Exams Taken", value: summary.totalExamsTaken.toLocaleString(), sub: "Simulated exam rooms", color: "bg-emerald-600" },
          { label: "Avg Requests / User", value: `${summary.averageRequests} reqs`, sub: "Active preparing candidates", color: "bg-sky-500" },
          { label: "Active Candidates", value: summary.uniqueUsers.toLocaleString(), sub: "Preparing accounts", color: "bg-emerald-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={cn("w-2 h-2 rounded-full", card.color)} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Security Audit & Telemetry table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Real-time Telemetry Logs */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                API Execution Logs
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time log of resource limits evaluations.</p>
            </div>
            
            <div className="relative w-full sm:w-[240px] shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input 
                type="text" 
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[380px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Feature</th>
                  <th className="px-5 py-3 text-center">Plan</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-[9px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-black text-slate-800 truncate max-w-[120px]">
                        <div>
                          <p className="truncate">{log.userName}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate">{log.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 capitalize truncate max-w-[120px]">
                        {log.feature.replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black">{log.plan}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-indigo-650 font-mono text-[10px]">
                        ${log.cost.toFixed(6)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {!log.blockedReason ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Allowed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[9px] font-black uppercase" title={log.blockedReason}>
                            <XCircle className="w-3 h-3" />
                            <span>Blocked</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                      No logs matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Security Audits Risk board */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Security Events
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time alerts for multi-account abuse risk levels.</p>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {securityEvents.length > 0 ? (
              securityEvents.map((evt) => (
                <div key={evt.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-xs font-black text-slate-800 block">{evt.eventType}</strong>
                      <span className="text-[9px] font-bold text-slate-400">{evt.userName} ({evt.email})</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black font-mono",
                      evt.riskScore >= 70 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    )}>
                      Risk: {evt.riskScore}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">{evt.details?.msg || "Suspicious credentials/fingerprint mismatch alert triggers."}</p>
                  <p className="text-[8px] text-slate-400 font-mono font-bold text-right">{new Date(evt.timestamp).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs border border-dashed border-slate-200 rounded-2xl">
                No security alerts registered.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
