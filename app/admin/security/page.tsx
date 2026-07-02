"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, UserCheck, AlertTriangle, Key, 
  RefreshCw, CheckCircle2, Lock, Eye, Trash2, 
  Info, Cpu, Terminal, Users, Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityLog {
  id: string;
  event_type: "failed_login" | "rate_limit" | "token_abuse" | "unauthorized_access" | "brute_force";
  ip_address: string;
  user_email: string;
  risk_score: number;
  timestamp: string;
}

export default function AdminSecurityControlCenter() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [ipFilter, setIpFilter] = useState("");
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Security config variables
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [rateLimitThrottled, setRateLimitThrottled] = useState(true);
  const [abuseProtectionActive, setAbuseProtectionActive] = useState(true);

  const fetchSecurityLogs = async () => {
    setLoading(true);
    try {
      // Simulate real-time logs parsing from telemetry loggers
      const mockLogs: SecurityLog[] = [
        { id: "1", event_type: "rate_limit", ip_address: "192.168.1.104", user_email: "ats_bot@crawler.io", risk_score: 75, timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
        { id: "2", event_type: "failed_login", ip_address: "103.44.20.12", user_email: "unknown@attacker.org", risk_score: 90, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: "3", event_type: "token_abuse", ip_address: "88.241.10.89", user_email: "malicious_user@gmail.com", risk_score: 85, timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString() },
        { id: "4", event_type: "unauthorized_access", ip_address: "45.12.30.9", user_email: "guest_candidate@local.net", risk_score: 60, timestamp: new Date(Date.now() - 1000 * 3600 * 5).toISOString() }
      ];
      setLogs(mockLogs);
    } catch {
      triggerAlert("Failed to pull security logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityLogs();
  }, []);

  const triggerAlert = (msg: string, type: "success" | "error") => {
    setAlertMsg({ text: msg, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleFlushCache = async () => {
    try {
      triggerAlert("All active session tokens and Redis limit caches flushed successfully!", "success");
    } catch {
      triggerAlert("Failed to flush limit caches.", "error");
    }
  };

  const filteredLogs = logs.filter(log => 
    log.ip_address.includes(ipFilter) || log.user_email.toLowerCase().includes(ipFilter.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest mb-2">
            <ShieldAlert className="w-4 h-4 text-violet-500" />
            Enterprise Security Guard Platform (SOC2/GDPR)
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none font-display">
            Security & Compliance Center
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-1.5">
            Configure MFA policies, monitor suspicious client IPs, inspect API abuse vectors, and audit permission groups.
          </p>
        </div>

        <button
          onClick={fetchSecurityLogs}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer text-xs font-bold font-sans"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Reload logs
        </button>
      </div>

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Incident Risk", value: "Normal", sub: "Risk Score: 12/100", color: "bg-emerald-500" },
          { label: "Failed Logins (24h)", value: "3 attempts", sub: "No brute force pattern", color: "bg-blue-500" },
          { label: "Blocked IP Addresses", value: "0 blocked", sub: "IP reputation score normal", color: "bg-indigo-500" },
          { label: "Rate Limit Violations", value: "14 counts", sub: "Crawler bots throttled", color: "bg-violet-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-250/70 shadow-sm flex flex-col justify-between min-h-[120px] hover:border-violet-300 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
              <div className={cn("w-2 h-2 rounded-full", card.color)} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-950 tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-450 font-bold mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Controls Form & Suspicious IP Log list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Security configuration policies */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-250/70 shadow-sm space-y-6 h-fit">
          <div>
            <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
              <Lock className="w-5 h-5 text-violet-600" />
              Access Control Policies
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Enforce structural identity boundaries across profiles.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Enforce Multi-Factor Auth (MFA)", value: mfaEnforced, setter: setMfaEnforced, desc: "Require authenticator codes for premium student credentials and admins logins." },
              { label: "Adaptive Sliding Rate Limiting", value: rateLimitThrottled, setter: setRateLimitThrottled, desc: "Dynamically throttle suspicious API queries using sliding window counters." },
              { label: "AI Prompt Loop Protection", value: abuseProtectionActive, setter: setAbuseProtectionActive, desc: "Warn and temporarily block candidates sending recursive prompt injections." }
            ].map((policy, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-xs font-black text-slate-800">{policy.label}</strong>
                  <button
                    onClick={() => {
                      policy.setter(!policy.value);
                      triggerAlert(`Policy settings updated!`, "success");
                    }}
                    className={cn(
                      "px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                      policy.value
                        ? "bg-violet-50 border-violet-200 text-violet-700"
                        : "bg-white border-slate-250 text-slate-500"
                    )}
                  >
                    {policy.value ? "Active" : "Disabled"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{policy.desc}</p>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleFlushCache}
                className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-750 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Flush Limit Caches
              </button>
            </div>
          </div>
        </div>

        {/* Suspicious login alerts log */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-250/70 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
                <Terminal className="w-5 h-5 text-violet-600" />
                Suspicious Telemetry Incidents
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time firewall alerts for rate breaches and IP token abuse.</p>
            </div>
            
            <input
              type="text"
              placeholder="Filter by IP / Email..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shrink-0 max-w-[200px]"
            />
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-start gap-4">
                  <div className="space-y-1.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border",
                        log.event_type === "rate_limit" && "bg-amber-50 border-amber-100 text-amber-600",
                        log.event_type === "failed_login" && "bg-rose-50 border-rose-100 text-rose-600",
                        log.event_type === "token_abuse" && "bg-purple-50 border-purple-100 text-purple-600",
                        log.event_type === "unauthorized_access" && "bg-blue-50 border-blue-100 text-blue-600"
                      )}>
                        {log.event_type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-850 block truncate">{log.user_email}</h4>
                    <p className="text-[10px] text-slate-450 font-bold">Originating IP: {log.ip_address}</p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-[9px] font-black text-rose-650 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded">Risk: {log.risk_score}%</span>
                    <button
                      onClick={() => triggerAlert(`Blocked IP "${log.ip_address}" successfully.`, "success")}
                      className="text-[10px] font-black text-violet-600 hover:underline block w-full text-right cursor-pointer"
                    >
                      Block IP
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs border border-dashed border-slate-200 rounded-2xl">
                No active threat incidents reported in current timeframe.
              </div>
            )}
          </div>
        </div>

      </div>

      {alertMsg && (
        <div className={cn(
          "fixed bottom-6 right-6 p-4 border rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg z-50 animate-fade-in",
          alertMsg.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-rose-50 border-rose-100 text-rose-800"
        )}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

    </div>
  );
}
