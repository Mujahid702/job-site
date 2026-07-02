"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, Activity, TrendingUp, Search, RefreshCw, 
  CheckCircle2, XCircle, Clock, AlertTriangle, Cpu,
  ChevronDown, ChevronUp, Layers, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface IngestionLog {
  id: string;
  gmail_message_id: string;
  company: string;
  role: string;
  detected_status: string;
  confidence_score: number;
  processed: boolean;
  ai_reasoning: string;
  extracted_entities: any;
  email_subject: string;
  sender: string;
  provider_used: string;
  created_at: string;
}

interface DiagnosticsData {
  totalLogs: number;
  parsingAccuracy: number;
  geminiFallbackRate: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  failedDetections: IngestionLog[];
  recentLogs: IngestionLog[];
}

export default function AdminGmailDiagnostics() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "failed" | "processed">("all");

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch("/api/admin/gmail-diagnostics");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load diagnostics analytics.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching diagnostics.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();

    // Subscribe to realtime updates on email_ingestion_logs
    const supabase = createClient();
    const channel = supabase
      .channel("email-ingestion-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_ingestion_logs"
        },
        (payload) => {
          console.log("[Realtime] email_ingestion_logs database update:", payload);
          fetchDiagnostics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDiagnostics();
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Compiling AI parsing diagnostics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Failed to Load Diagnostics Data</h2>
        <p className="text-slate-500 text-sm max-w-sm mt-1 mb-4">{error || "Verify database migrations and configurations."}</p>
        <button 
          onClick={fetchDiagnostics}
          className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter the logs
  const logsToRender = filterMode === "all" 
    ? data.recentLogs 
    : filterMode === "failed" 
      ? data.failedDetections 
      : data.recentLogs.filter(l => l.processed);

  const filteredLogs = logsToRender.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.company.toLowerCase().includes(query) ||
      log.role.toLowerCase().includes(query) ||
      log.detected_status.toLowerCase().includes(query) ||
      (log.email_subject || "").toLowerCase().includes(query) ||
      (log.sender || "").toLowerCase().includes(query)
    );
  });

  const excellentCount = data.distribution.excellent;
  const goodCount = data.distribution.good;
  const fairCount = data.distribution.fair;
  const poorCount = data.distribution.poor;
  const maxDist = Math.max(excellentCount, goodCount, fairCount, poorCount) || 1;

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            AI Ingestion Metrics & Insights
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Email Intelligence Layer</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Real-time diagnostics of Gmail AI parsing workflows, confidence distributions, and ingestion accuracy.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer text-xs font-bold shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Sync Diagnostics
        </button>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Parsed Emails", value: data.totalLogs.toLocaleString(), sub: "Total Gmail Syncs", color: "bg-blue-600" },
          { label: "Parsing Ingestion Accuracy", value: `${data.parsingAccuracy}%`, sub: "Confidence Score >= 80%", color: "bg-emerald-600" },
          { label: "Gemini Fallback Rate", value: `${data.geminiFallbackRate}%`, sub: "Qwen Low Confidence Fallbacks", color: "bg-amber-500" },
          { label: "Failed Detections", value: data.failedDetections.length.toLocaleString(), sub: "Require Manual Verification", color: "bg-rose-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={cn("w-2.5 h-2.5 rounded-full", card.color)} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Confidence Distribution Chart */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Confidence Distribution
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Classification score split across quality ranges.</p>
          </div>

          <div className="space-y-5 py-4">
            {[
              { label: "Excellent (90-100)", count: excellentCount, pct: (excellentCount / maxDist) * 100, color: "from-emerald-500 to-teal-500", rawPct: data.totalLogs ? (excellentCount / data.totalLogs) * 100 : 0 },
              { label: "Good (80-89)", count: goodCount, pct: (goodCount / maxDist) * 100, color: "from-blue-500 to-indigo-500", rawPct: data.totalLogs ? (goodCount / data.totalLogs) * 100 : 0 },
              { label: "Fair (50-79)", count: fairCount, pct: (fairCount / maxDist) * 100, color: "from-amber-500 to-orange-500", rawPct: data.totalLogs ? (fairCount / data.totalLogs) * 100 : 0 },
              { label: "Poor (<50 / Failed)", count: poorCount, pct: (poorCount / maxDist) * 100, color: "from-rose-500 to-red-500", rawPct: data.totalLogs ? (poorCount / data.totalLogs) * 100 : 0 }
            ].map((dist, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">{dist.label}</span>
                  <span className="text-slate-500">{dist.count} logs ({dist.rawPct.toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                  <div 
                    className={cn("h-full bg-gradient-to-r transition-all rounded-r-lg", dist.color)}
                    style={{ width: `${dist.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-start gap-3">
            <Cpu className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
              We employ <strong className="text-slate-800">Qwen 2.5 7B</strong> to process incoming mailbox updates. On low-confidence responses (&lt;80%), logic safely transparently routes requests to <strong className="text-slate-800">Gemini Flash</strong> fallback systems to preserve overall placement data integrity.
            </p>
          </div>
        </div>

        {/* Executed Emails log table */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Ingestion Logs Terminal
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Filter and review details of synced emails.</p>
            </div>
            
            <div className="relative w-full sm:w-[220px] shrink-0">
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

          {/* Filter Modes */}
          <div className="flex gap-2 border-b border-slate-100 pb-4">
            {[
              { id: "all", label: "All Logs" },
              { id: "failed", label: "Failed / Fallback Logs" },
              { id: "processed", label: "Processed Only" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilterMode(btn.id as any)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all border",
                  filterMode === btn.id 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div 
                    key={log.id} 
                    className={cn(
                      "border rounded-2xl transition-all overflow-hidden",
                      log.processed 
                        ? "border-slate-200 hover:border-indigo-200 bg-white" 
                        : "border-rose-200 bg-rose-50/20 hover:border-rose-300"
                    )}
                  >
                    <div 
                      onClick={() => toggleExpandLog(log.id)}
                      className="p-5 flex justify-between items-start gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm">
                            {log.company || "Unknown Company"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-black text-slate-500 border border-slate-150 uppercase tracking-wider">
                            {log.role || "Software Engineer"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 truncate max-w-[320px] sm:max-w-[420px]">
                          {log.email_subject || "No Subject Line Available"}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                          <span>From: {log.sender || "Unknown Sender"}</span>
                          <span>•</span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={cn(
                              "text-xs font-black",
                              log.confidence_score >= 80 ? "text-emerald-650" : "text-rose-600"
                            )}>
                              {log.confidence_score}%
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Confidence</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
                            via {log.provider_used === "gemini" ? "Gemini Fallback" : "Qwen 2.5"}
                          </p>
                        </div>

                        {log.processed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs font-semibold">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">AI Reasoning Details</h4>
                          <p className="text-slate-650 font-medium leading-relaxed bg-white border border-slate-200 p-3 rounded-xl">
                            {log.ai_reasoning || "No reasoning logged."}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Extracted Payload Entities</h4>
                          <pre className="text-[10px] font-mono text-indigo-750 bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-xl overflow-x-auto">
                            {JSON.stringify(log.extracted_entities || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                No parsing logs matching filters
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
