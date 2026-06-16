"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, Cpu, Activity, TrendingUp, Search, 
  HelpCircle, RefreshCw, Layers, Users, BarChart3, 
  CheckCircle2, XCircle, Clock, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiCostAnalytics } from "@/lib/db/ai-analytics";

export default function AdminAiCostAnalytics() {
  const [data, setData] = useState<AiCostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-analytics");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load cost analytics.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching AI logs.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 text-violet-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Compiling spend data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Failed to Load Spend Data</h2>
        <p className="text-slate-500 text-sm max-w-sm mt-1 mb-4">{error || "Verify Supabase logging connections."}</p>
        <button 
          onClick={fetchAnalytics}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = data.recentLogs.filter(log => {
    const query = searchQuery.toLowerCase();
    return log.userName.toLowerCase().includes(query) ||
           log.feature.toLowerCase().includes(query) ||
           log.provider.toLowerCase().includes(query) ||
           log.model.toLowerCase().includes(query);
  });

  // Chart config
  const chartWidth = 600;
  const chartHeight = 240;
  const padding = 45;

  const points = data.dailyTrend.map((d, idx) => {
    const maxCost = Math.max(...data.dailyTrend.map(x => x.cost)) || 0.1;
    const x = padding + (idx / (data.dailyTrend.length - 1 || 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.cost / maxCost) * (chartHeight - 2 * padding);
    return { x, y, label: d.date, val: d.cost };
  });

  const linePath = points.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` 
    : "";

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest mb-2">
            <DollarSign className="w-4 h-4 text-violet-500" />
            AI Portal Spend Telemetry
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Cost & Usage Analytics</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Real-time visual monitoring of platform token volumes, model billing ratios, and feature-specific spending distributions.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer text-xs font-bold shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Sync Spend metrics
        </button>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        {[
          { label: "Today's Spend", value: `$${data.summary.dailyCost.toFixed(4)}`, sub: "Daily Run-rate", color: "bg-amber-500" },
          { label: "Month Spend", value: `$${data.summary.monthlyCost.toFixed(4)}`, sub: "Current Month", color: "bg-blue-600" },
          { label: "Cumulative Spend", value: `$${data.summary.cumulativeCost.toFixed(4)}`, sub: "Platform Spend", color: "bg-violet-600" },
          { label: "Total Requests", value: data.summary.totalRequests.toLocaleString(), sub: "Invocations count", color: "bg-emerald-600" },
          { label: "Gemini Share", value: `${data.summary.geminiPercentage.toFixed(1)}%`, sub: "Premium logic model", color: "bg-indigo-600" },
          { label: "Llama/Free Share", value: `${data.summary.freePercentage.toFixed(1)}%`, sub: "High-speed free tier", color: "bg-rose-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-violet-200 transition-all">
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

      {/* Grid: Spend Trends & Features breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Spend Trend chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              Daily Spend Curve
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Chronological summary of daily platform API expenses.</p>
          </div>

          <div className="relative bg-slate-50 p-4 border border-slate-150 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[260px]">
            {points.length > 0 ? (
              <svg className="w-full min-w-[420px]" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="2" />

                {/* Area */}
                <path d={areaPath} fill="url(#spendGrad)" />

                {/* Line */}
                <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-black fill-slate-800 font-sans">${p.val.toFixed(4)}</text>
                    <text x={p.x} y={chartHeight - 12} textAnchor="middle" className="text-[8px] font-bold fill-slate-400 font-sans">{p.label.substring(5)}</text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-slate-400 font-bold text-xs">No daily logs found.</div>
            )}
          </div>
        </div>

        {/* Feature Cost breakdown */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Feature Cost Distribution
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Understand which capabilities generate the most expenses.</p>
          </div>

          <div className="space-y-4 pt-2">
            {data.featureBreakdown.map((feat, idx) => {
              const maxCost = Math.max(...data.featureBreakdown.map(x => x.cost)) || 1;
              const pct = (feat.cost / maxCost) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                    <span className="font-black text-slate-800 truncate capitalize">
                      {feat.feature.replace('_', ' ')}
                    </span>
                    <div className="flex gap-3 text-right">
                      <span>{feat.requests.toLocaleString()} reqs</span>
                      <span className="text-violet-600 font-black">${feat.cost.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all rounded-r-lg" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* User leaderboard & detailed transactions table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* User Cost Leaderboard */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              Top Spenders
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Top 10 candidates by cumulative model billing.</p>
          </div>

          <div className="space-y-3">
            {data.userBreakdown.length > 0 ? (
              data.userBreakdown.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="truncate max-w-[180px]">
                    <span className="text-xs font-black text-slate-800 block truncate">{user.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold truncate block">{user.email}</span>
                  </div>
                  <div className="text-right text-xs shrink-0 flex flex-col items-end">
                    <span className="text-amber-600 font-black">${user.cost.toFixed(4)}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{user.requests} requests</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs border border-dashed border-slate-200 rounded-2xl">
                No user logs found.
              </div>
            )}
          </div>
        </div>

        {/* Transactions log table */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Execution Log Terminal
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time log of gateway completion requests.</p>
            </div>
            
            <div className="relative w-full sm:w-[240px] shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input 
                type="text" 
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3 text-center">Tokens</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-[9px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-black text-slate-800 truncate max-w-[100px]">
                        {log.userName}
                      </td>
                      <td className="px-5 py-3 capitalize truncate max-w-[100px]">
                        {log.feature.replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3 font-mono text-[9px] truncate max-w-[90px]">
                        {log.provider === 'gemini' ? 'Gemini' : 'Llama'}
                      </td>
                      <td className="px-5 py-3 text-center font-mono text-[10px]">
                        {log.tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-violet-650 font-mono text-[10px]">
                        ${log.cost.toFixed(6)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {log.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                      No logs matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
