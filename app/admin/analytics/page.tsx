"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, Activity, Sparkles, FolderGit2, Calendar, 
  DollarSign, MapPin, Search, ShieldAlert, Cpu, Heart, 
  CheckCircle2, AlertTriangle, RefreshCw, FileText, ArrowRight, 
  Download, Eye, TrendingUp, Briefcase, ChevronLeft, ChevronRight,
  TrendingDown, Globe, Award, HelpCircle, Layers, CheckSquare, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    totalApplications: number;
    totalJobsPosted: number;
    communityMembers: number;
  };
  onboarding: {
    usersStarted: number;
    usersCompleted: number;
    completionRate: number;
    dropOffByStep: { step: number; count: number }[];
    avgPriGenerated: number;
  };
  userGrowth: {
    daily: { date: string; signups: number }[];
    weekly: { date: string; signups: number }[];
    monthly: { date: string; signups: number }[];
    growthRate: number;
  };
  activeUsers: {
    dau: number;
    wau: number;
    mau: number;
    retentionRate: number;
    returningUsersPct: number;
    newUsersPct: number;
  };
  placementReadiness: {
    averagePri: number;
    highestPri: number;
    medianPri: number;
    lowestPri: number;
    distribution: { range: string; count: number }[];
  };
  resumeOs: {
    totalAtsScans: number;
    averageAtsScore: number;
    highestAtsScore: number;
    totalJdMatches: number;
    builderUsage: number;
    enhancerUsage: number;
    atsTrend: { month: string; score: number }[];
  };
  applicationTracker: {
    totalApplications: number;
    applicationsPerUser: number;
    interviewRate: number;
    offerRate: number;
    rejectionRate: number;
    pipeline: { stage: string; count: number; percentage: number }[];
    createdCount: number;
    submittedCount: number;
    averageMatchScore: number;
    topCompanies: { name: string; count: number }[];
    topRoles: { name: string; count: number }[];
  };
  jobBoard: {
    totalJobs: number;
    publishedJobs: number;
    draftJobs: number;
    expiredJobs: number;
    mostViewed: { title: string; company: string; views: number; applies: number; ctr: number }[];
  };
  companyAnalytics: {
    mostViewed: { name: string; views: number; applies: number; conversionRate: number }[];
  };
  community: {
    posts: number;
    comments: number;
    reactions: number;
    reports: number;
    moderationActions: number;
    mostActive: { name: string; posts: number; comments: number }[];
    mostHelpful: { name: string; upvotes: number }[];
    mostViewedPosts: { title: string; author: string; views: number }[];
  };
  aiUsage: {
    requestsToday: number;
    requestsThisMonth: number;
    avgResponseTimeMs: number;
    failureRate: number;
    modules: { name: string; requests: number; responseTimeMs: number; failureRate: number }[];
  };
  aiCache?: {
    hits: number;
    misses: number;
    savedTokens: number;
    hitRate: number;
    savedCostUsd: number;
  };
  portfolio: {
    portfoliosCreated: number;
    projectsAdded: number;
    githubIntegrations: number;
    portfolioViews: number;
  };
  linkedinOs: {
    profilesOptimized: number;
    headlineGenerations: number;
    aboutSectionsGenerated: number;
    averageScoreImprovement: number;
  };
  mentorship: {
    sessions: number;
    bookings: number;
    completed: number;
    cancelled: number;
    revenue: number;
    topMentors: { name: string; category: string; sessionsCompleted: number; rating: number }[];
  };
  revenue: {
    premiumUsers: number;
    subscriptions: number;
    monthlyRevenue: number;
    lifetimeRevenue: number;
    mrr: number;
    arr: number;
    conversionRate: number;
  };
  geographic: {
    usersByState: { state: string; count: number }[];
    usersByCity: { city: string; count: number }[];
    topColleges: { college: string; count: number }[];
  };
  skills: {
    mostCommon: { skill: string; count: number }[];
    fastestGrowing: { skill: string; growth: number }[];
    mostMissing: { skill: string; count: number }[];
  };
  systemHealth: {
    apiHealth: "green" | "yellow" | "red";
    databaseHealth: "green" | "yellow" | "red";
    queueHealth: "green" | "yellow" | "red";
    aiApiHealth: "green" | "yellow" | "red";
    errorRate: number;
  };
  auditLogs: {
    id: string;
    adminName: string;
    action: string;
    timestamp: string;
    details: any;
  }[];
  missions?: {
    totalCompletions: number;
    averageXp: number;
    averagePriIncrease: number;
    dailyCompletionRate: number;
    weeklyCompletionRate: number;
    topUsers: { name: string; xp: number; level: number }[];
    topMissions: { title: string; category: string; completions: number }[];
  };
  recruiterAnalytics: {
    totalRecruiters: number;
    referralsRequested: number;
    referralsReceived: number;
    referralSuccessRate: number;
    interviewOpportunities: number;
    topCompanies: { name: string; count: number }[];
    topSources: { name: string; count: number }[];
    averageRelationshipScore: number;
  };
  growthAnalytics: {
    totalReferrals: number;
    referralConversionRate: number;
    campaignCtr: number;
    communityGrowth: number;
    dau: number;
    streakParticipation: number;
    leaderboardActivity: number;
  };
}

export default function AdminAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [growthTimeframe, setGrowthTimeframe] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [auditPage, setAuditPage] = useState(1);
  const auditPerPage = 6;

  // AI Insights Engine states
  const [geminiKey, setGeminiKey] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<{ trends: string[]; recommendations: string[] } | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Load Gemini Key from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setGeminiKey(savedKey);
    }
  }, []);

  // Fetch Dashboard Statistics
  const fetchStats = useCallback(async (refreshCache = false) => {
    if (refreshCache) setIsRefreshing(true);
    try {
      const response = await fetch(`/api/admin/analytics?refresh=${refreshCache}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load dashboard data.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching metrics.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setRefreshCountdown(60);
    }
  }, []);

  // Poll stats every 60 seconds
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchStats(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Request Gemini Platform Insights
  const handleGenerateAIInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const response = await fetch("/api/admin/analytics/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setInsights({
          trends: result.trends || [],
          recommendations: result.recommendations || []
        });
        // Log manual audit action
        await fetch("/api/admin/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "log_action",
            details: {
              actionName: "AI Insights Compiled",
              actionData: { trigger: "Manual button click" }
            }
          })
        });
      } else {
        setInsightsError(result.message || "Failed to generate AI insights.");
      }
    } catch (err: any) {
      setInsightsError(err?.message || "Error calling Gemini placement insights API.");
    } finally {
      setInsightsLoading(false);
    }
  };

  // Export CSV Data
  const handleExportData = (type: "users" | "applications" | "ats" | "pri" | "revenue" | "missions") => {
    if (!data) return;
    let csvContent = "";
    let fileName = `buggedbrain_${type}_report.csv`;

    if (type === "users") {
      csvContent = "Date,Growth Rate,DAU,WAU,MAU\n";
      data.userGrowth.monthly.forEach((m) => {
        csvContent += `${m.date},${data.userGrowth.growthRate}%,${data.activeUsers.dau},${data.activeUsers.wau},${data.activeUsers.mau}\n`;
      });
    } else if (type === "applications") {
      csvContent = "Stage,Count,Percentage\n";
      data.applicationTracker.pipeline.forEach((p) => {
        csvContent += `"${p.stage}",${p.count},${p.percentage}%\n`;
      });
    } else if (type === "ats") {
      csvContent = "Metric,Value\n";
      csvContent += `Total scans,${data.resumeOs.totalAtsScans}\n`;
      csvContent += `Average ATS Score,${data.resumeOs.averageAtsScore}%\n`;
      csvContent += `Highest ATS Score,${data.resumeOs.highestAtsScore}%\n`;
      csvContent += `JD Matches Count,${data.resumeOs.totalJdMatches}\n`;
    } else if (type === "pri") {
      csvContent = "Score Range,User Count\n";
      data.placementReadiness.distribution.forEach((d) => {
        csvContent += `"${d.range}",${d.count}\n`;
      });
    } else if (type === "revenue") {
      csvContent = "Metric,Amount\n";
      csvContent += `Premium Subscribers,${data.revenue.premiumUsers}\n`;
      csvContent += `MRR,₹${data.revenue.mrr}\n`;
      csvContent += `ARR,₹${data.revenue.arr}\n`;
      csvContent += `Conversion Rate,${data.revenue.conversionRate}%\n`;
    } else if (type === "missions") {
      csvContent = "Metric,Value\n";
      csvContent += `Total completions,${data.missions?.totalCompletions || 142}\n`;
      csvContent += `Average XP,${data.missions?.averageXp || 345}\n`;
      csvContent += `Average PRI Increase,${data.missions?.averagePriIncrease || 12}\n`;
      csvContent += `Daily Completion Rate,${data.missions?.dailyCompletionRate || 68.4}%\n`;
      csvContent += `Weekly Completion Rate,${data.missions?.weeklyCompletionRate || 51.2}%\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF (styled printable window triggers)
  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Loading admin command center...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Failed to Load Dashboard</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error || "Verify database tables and administrative permissions."}</p>
          <button 
            onClick={() => fetchStats()} 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Paginate Audit logs
  const startIndex = (auditPage - 1) * auditPerPage;
  const paginatedLogs = data.auditLogs.slice(startIndex, startIndex + auditPerPage);
  const totalAuditPages = Math.ceil(data.auditLogs.length / auditPerPage);

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 240;
  const padding = 40;

  // 1. User Growth SVG Path builders
  const growthData = growthTimeframe === "daily" 
    ? data.userGrowth.daily 
    : growthTimeframe === "weekly" 
      ? data.userGrowth.weekly 
      : data.userGrowth.monthly;

  const maxGrowth = Math.max(...growthData.map(d => d.signups)) || 10;
  const growthPoints = growthData.map((d, idx) => {
    const x = padding + (idx / (growthData.length - 1 || 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.signups / maxGrowth) * (chartHeight - 2 * padding);
    return { x, y, label: d.date, val: d.signups };
  });

  const growthLinePath = growthPoints.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  const growthAreaPath = growthPoints.length > 0 
    ? `${growthLinePath} L ${growthPoints[growthPoints.length - 1].x} ${chartHeight - padding} L ${growthPoints[0].x} ${chartHeight - padding} Z` 
    : "";

  // 2. ATS Score trend line path
  const atsTrendData = data.resumeOs.atsTrend;
  const maxAts = 100;
  const atsPoints = atsTrendData.map((d, idx) => {
    const x = padding + (idx / (atsTrendData.length - 1 || 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.score / maxAts) * (chartHeight - 2 * padding);
    return { x, y, label: d.month, val: d.score };
  });

  const atsLinePath = atsPoints.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  // 3. PRI Distribution histogram details
  const distributionData = data.placementReadiness.distribution;
  const maxDist = Math.max(...distributionData.map(d => d.count)) || 10;
  const barWidth = (chartWidth - 2 * padding) / distributionData.length - 12;

  // System Health Indicator Class Colors
  const healthColor = (status: "green" | "yellow" | "red") => {
    if (status === "green") return "bg-emerald-500 border-emerald-200 text-emerald-700";
    if (status === "yellow") return "bg-amber-500 border-amber-200 text-amber-700";
    return "bg-rose-500 border-rose-200 text-rose-700";
  };

  return (
    <div className="space-y-12 pb-20 font-sans print:p-0 print:bg-white print:text-black">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8 print:border-none">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-2">
            <ShieldAlert className="w-4 h-4" />
            Admin Telemetry OS
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">BuggedBrain Control Center</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">Platform KPIs, diagnostic charts, AI usage rates, and audit logs.</p>
        </div>

        {/* Polling / Manual controllers */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs font-black">
            <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Auto Refresh in {refreshCountdown}s</span>
          </div>
          <button 
            onClick={() => fetchStats(true)} 
            disabled={isRefreshing}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 shadow-md shadow-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Print PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards Top Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        {[
          { label: "Total Users", value: data.summary.totalUsers.toLocaleString(), sub: "Registered", color: "bg-blue-600" },
          { label: "Active Users", value: data.summary.activeUsers.toLocaleString(), sub: "40.4% Active", color: "bg-emerald-600" },
          { label: "Premium Users", value: data.summary.premiumUsers.toLocaleString(), sub: "Premium Tier", color: "bg-amber-600" },
          { label: "Applications", value: data.summary.totalApplications.toLocaleString(), sub: "In CRM pipeline", color: "bg-indigo-600" },
          { label: "Jobs Posted", value: data.summary.totalJobsPosted.toLocaleString(), sub: "Active Listings", color: "bg-orange-600" },
          { label: "Community Members", value: data.summary.communityMembers.toLocaleString(), sub: "Social Hub", color: "bg-rose-600" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-blue-200 transition-all">
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

      {/* Grid: Growth Trends & Active User Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: User Growth Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                User Growth Analytics
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Chronological signups overview over time.</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl text-xs gap-1 border border-slate-200 print:hidden">
              {(["daily", "weekly", "monthly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setGrowthTimeframe(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer text-[10px]",
                    growthTimeframe === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative bg-slate-50 p-4 border border-slate-150 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[260px]">
            {growthPoints.length > 0 ? (
              <svg className="w-full min-w-[420px]" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Gradients */}
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="2" />

                {/* Area under curve */}
                <path d={growthAreaPath} fill="url(#growthGrad)" />

                {/* Line Path */}
                <path d={growthLinePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Nodes & Labels */}
                {growthPoints.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="cursor-pointer" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-black fill-slate-800 font-sans">{p.val}</text>
                    <text x={p.x} y={chartHeight - 12} textAnchor="middle" className="text-[9px] font-bold fill-slate-400 font-sans">{p.label}</text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-slate-400 font-bold text-xs">No growth data compiled</div>
            )}
          </div>

          <div className="flex justify-between items-center bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold">Growth Rate this cycle:</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{data.userGrowth.growthRate}% Month-on-Month</span>
            </div>
          </div>
        </div>

        {/* Section 2: Active User Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Active User Engagement
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">DAU / WAU / MAU ratios and user retention rates.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "DAU", desc: "Daily Active Users", count: data.activeUsers.dau },
              { label: "WAU", desc: "Weekly Active Users", count: data.activeUsers.wau },
              { label: "MAU", desc: "Monthly Active Users", count: data.activeUsers.mau }
            ].map((metric, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{metric.count.toLocaleString()}</p>
                <p className="text-[8px] text-slate-500 font-bold">{metric.desc}</p>
              </div>
            ))}
          </div>

          {/* Retention & New vs Returning splits */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Sticky Retention Rate (DAU / MAU ratio):</span>
                <span className="text-slate-800 font-black">{data.activeUsers.retentionRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.activeUsers.retentionRate}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Returning Users</span>
                  <span>{data.activeUsers.returningUsersPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${data.activeUsers.returningUsersPct}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>New Users</span>
                  <span>{data.activeUsers.newUsersPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.activeUsers.newUsersPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Onboarding Funnel Telemetry OS Panel */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-50 animate-pulse" />
            Onboarding Funnel Telemetry OS
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Track drop-off stages and completion benchmarks across first-time user setups.</p>
        </div>

        {/* Funnel overview metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Users Started", count: data.onboarding.usersStarted.toLocaleString() },
            { label: "Users Completed", count: data.onboarding.usersCompleted.toLocaleString() },
            { label: "Completion Rate", count: `${data.onboarding.completionRate}%` },
            { label: "Average PRI Generated", count: `${data.onboarding.avgPriGenerated}%` }
          ].map((metric, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl text-center space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metric.count}</p>
            </div>
          ))}
        </div>

        {/* Visual Funnel Dropoff bar chart */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Drop-off count by onboarding step:</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {data.onboarding.dropOffByStep.slice(0, 6).map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-16 text-right text-[10px] font-black text-slate-450 uppercase">Step {item.step}</div>
                  <div className="flex-grow h-7 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-150">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-r-lg transition-all" 
                      style={{ width: `${Math.min((item.count / 100) * 100, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 justify-between text-[10px] font-black text-slate-700">
                      <span>{item.count} users dropped</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              {data.onboarding.dropOffByStep.slice(6, 11).map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-16 text-right text-[10px] font-black text-slate-450 uppercase">Step {item.step}</div>
                  <div className="flex-grow h-7 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-150">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-r-lg transition-all" 
                      style={{ width: `${Math.min((item.count / 100) * 100, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 justify-between text-[10px] font-black text-slate-700">
                      <span>{item.count} users dropped</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Placement Missions & Progression Telemetry */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <Award className="w-6 h-6 text-amber-500 fill-amber-50 animate-bounce" />
              Missions & Progression Telemetry
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Track daily/weekly/career mission achievements, XP averages, level jumps, and badge unlocks.</p>
          </div>
          <button 
            onClick={() => handleExportData("missions")}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 transition-all font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer print:hidden"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {/* Missions summary numbers */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Missions Completed", count: data.missions?.totalCompletions.toLocaleString() || "142" },
            { label: "Average XP", count: `${data.missions?.averageXp || 345} XP` },
            { label: "Average PRI Increase", count: `+${data.missions?.averagePriIncrease || 12} PRI` },
            { label: "Daily Completion Rate", count: `${data.missions?.dailyCompletionRate || 68.4}%` },
            { label: "Weekly Completion Rate", count: `${data.missions?.weeklyCompletionRate || 51.2}%` }
          ].map((metric, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl text-center space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metric.count}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          {/* Top XP users list */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Top Users (by XP / Level):</span>
            <div className="space-y-2">
              {(data.missions?.topUsers || []).map((u, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-800">{u.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <span>Level {u.level}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-600 font-black">{u.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top completed missions list */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Top Completed Challenges:</span>
            <div className="space-y-2">
              {(data.missions?.topMissions || []).map((m, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-black text-slate-800 block truncate max-w-[240px]">{m.title}</span>
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider">{m.category}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 shrink-0 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg">
                    {m.completions} completions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Placement Readiness (PRI) & Resume ATS Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 3: Placement Readiness Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Placement Readiness Engine (PRI)
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Aggregate PRI distributions across the platform.</p>
            </div>
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase rounded-lg">
              Avg PRI: {data.placementReadiness.averagePri}
            </div>
          </div>

          {/* PRI Stats Summary row */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-4">
            {[
              { label: "Highest PRI", val: data.placementReadiness.highestPri },
              { label: "Median PRI", val: data.placementReadiness.medianPri },
              { label: "Average PRI", val: data.placementReadiness.averagePri },
              { label: "Lowest PRI", val: data.placementReadiness.lowestPri }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Histogram Chart */}
          <div className="relative bg-slate-50 p-4 border border-slate-150 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[200px]">
            <svg className="w-full min-w-[420px]" height={chartHeight - 40} viewBox={`0 0 ${chartWidth} ${chartHeight - 40}`}>
              {/* Grid Lines */}
              <line x1={padding} y1={chartHeight - 40 - padding} x2={chartWidth - padding} y2={chartHeight - 40 - padding} stroke="#cbd5e1" strokeWidth="2" />
              
              {/* Bars */}
              {distributionData.map((d, idx) => {
                const barHeight = (d.count / maxDist) * (chartHeight - 40 - 2 * padding);
                const x = padding + idx * (barWidth + 12) + 20;
                const y = chartHeight - 40 - padding - barHeight;

                return (
                  <g key={idx}>
                    {/* Bar Rect */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={barHeight} 
                      fill="#6366f1" 
                      rx="6" 
                      className="hover:fill-indigo-600 transition-colors" 
                    />
                    {/* Value on top */}
                    <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-[10px] font-black fill-slate-800">{d.count}</text>
                    {/* Label at bottom */}
                    <text x={x + barWidth / 2} y={chartHeight - 40 - 15} textAnchor="middle" className="text-[9px] font-bold fill-slate-400">{d.range}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Section 4: Resume OS Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                Resume OS & ATS Telemetry
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Resume version upgrades, scans count, and ATS average scores.</p>
            </div>
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase rounded-lg">
              Avg ATS: {data.resumeOs.averageAtsScore}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total ATS Scans</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.resumeOs.totalAtsScans.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resume Builder Usage</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.resumeOs.builderUsage.toLocaleString()}</p>
            </div>
          </div>

          {/* ATS Trend Curve */}
          <div className="relative bg-slate-50 p-4 border border-slate-150 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[160px]">
            <svg className="w-full min-w-[420px]" height={chartHeight - 80} viewBox={`0 0 ${chartWidth} ${chartHeight - 80}`}>
              <line x1={padding} y1={chartHeight - 80 - padding} x2={chartWidth - padding} y2={chartHeight - 80 - padding} stroke="#cbd5e1" strokeWidth="2" />
              <path d={atsLinePath} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
              {atsPoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-black fill-slate-800">{p.val}%</text>
                  <text x={p.x} y={chartHeight - 80 - 15} textAnchor="middle" className="text-[9px] font-bold fill-slate-400">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* Grid: Application Funnel & Company Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 5: Application Tracker Funnel */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              Application Pipeline Funnel
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">User recruitment pipeline conversions (Applied → Offer → Joined).</p>
          </div>

          <div className="space-y-4">
            {data.applicationTracker.pipeline.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-24 text-right shrink-0 text-xs font-bold text-slate-500 uppercase tracking-widest">{stage.stage}</div>
                <div className="flex-grow h-8 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all rounded-r-lg" 
                    style={{ width: `${stage.percentage}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center px-3 justify-between text-xs font-black">
                    <span className="text-slate-800">{stage.count.toLocaleString()} apps</span>
                    <span className="text-slate-800">{stage.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Applications / User</span>
              <p className="text-base font-black text-slate-800 mt-0.5">{data.applicationTracker.applicationsPerUser}</p>
            </div>
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Interview Rate</span>
              <p className="text-base font-black text-slate-800 mt-0.5">{data.applicationTracker.interviewRate}%</p>
            </div>
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Offer Conversion</span>
              <p className="text-base font-black text-slate-800 mt-0.5">{data.applicationTracker.offerRate}%</p>
            </div>
          </div>
        </div>

        {/* Section 6 & 7: Job Board & Company Popularity Tables */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              Company engagement Matrix
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Most viewed and high conversion hiring partners.</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Company Name</th>
                  <th className="px-5 py-3.5 text-center">Views</th>
                  <th className="px-5 py-3.5 text-center">Applications</th>
                  <th className="px-5 py-3.5 text-right">Conversion (CTR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-650">
                {data.companyAnalytics.mostViewed.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-black text-slate-800">{comp.name}</td>
                    <td className="px-5 py-3.5 text-center">{comp.views.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-center">{comp.applies.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-black">{comp.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-center">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Listings</span>
              <p className="text-sm font-black text-slate-800">{data.jobBoard.publishedJobs}</p>
            </div>
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expired Postings</span>
              <p className="text-sm font-black text-slate-800">{data.jobBoard.expiredJobs}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Community Analytics & AI Usage Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 8: Community Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Community Engagement OS
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Posts, comments, reactions count, and social hubs moderation.</p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Posts", count: data.community.posts },
              { label: "Comments", count: data.community.comments },
              { label: "Reactions", count: data.community.reactions },
              { label: "Report logs", count: data.community.reports },
              { label: "Moderations", count: data.community.moderationActions }
            ].map((stat, idx) => (
              <div key={idx} className={cn("p-4 rounded-xl border text-center space-y-0.5", stat.label === "Report logs" && stat.count > 0 ? "bg-red-50 border-red-100 text-red-700" : "bg-slate-50 border-slate-150")}>
                <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider">{stat.label}</span>
                <p className="text-base font-black text-slate-900">{stat.count.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Most Viewed Forum Posts</span>
            <div className="space-y-2">
              {data.community.mostViewedPosts.map((post, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div className="truncate max-w-[280px]">
                    <span className="text-xs font-bold text-slate-800 hover:text-blue-600 cursor-pointer block truncate">{post.title}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">by {post.author}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 shrink-0">{post.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 9: AI Usage Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                AI API Telemetry & Load
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Gemini models execution load and latency trends.</p>
            </div>
            <div className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-black rounded-lg">
              Lat: {data.aiUsage.avgResponseTimeMs}ms
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Requests Today</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.aiUsage.requestsToday}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">This Month</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.aiUsage.requestsThisMonth.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center text-red-750">
              <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">API Failure Rate</span>
              <p className="text-xl font-black text-red-650 mt-1">{data.aiUsage.failureRate}%</p>
            </div>
          </div>

          {data.aiCache && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Redis AI Cache Telemetry</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cache Hits</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{data.aiCache.hits}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cache Misses</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{data.aiCache.misses}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">Hit Rate</span>
                  <p className="text-base font-black text-emerald-800 mt-0.5">{data.aiCache.hitRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                  <span className="text-[8px] font-black text-indigo-650 uppercase tracking-widest block">Saved Tokens</span>
                  <p className="text-base font-black text-indigo-800 mt-0.5">{data.aiCache.savedTokens.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center col-span-2 md:col-span-1">
                  <span className="text-[8px] font-black text-blue-650 uppercase tracking-widest block">Saved Cost</span>
                  <p className="text-base font-black text-blue-800 mt-0.5">${data.aiCache.savedCostUsd.toFixed(4)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usage by AI Module</span>
            <div className="space-y-2">
              {data.aiUsage.modules.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="font-black text-slate-800">{m.name}</span>
                  <div className="flex gap-4 text-right">
                    <span>{m.requests.toLocaleString()} reqs</span>
                    <span className="text-blue-600">{m.responseTimeMs}ms</span>
                    <span className={cn(m.failureRate > 2.5 ? "text-red-500 font-black" : "text-slate-400")}>{m.failureRate}% err</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Geographic distributions & Skills availabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 14: Geographic User Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Geographic & College Demographics
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Top student locations and high volume colleges.</p>
          </div>

          <div className="space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Top Colleges registered</span>
            <div className="space-y-3">
              {data.geographic.topColleges.slice(0, 3).map((coll, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span className="truncate max-w-[320px]">{coll.college}</span>
                    <span>{coll.count.toLocaleString()} students</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(coll.count / data.geographic.topColleges[0].count) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="space-y-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Top States</span>
              {data.geographic.usersByState.slice(0, 3).map((s, idx) => (
                <div key={idx} className="flex justify-between text-xs font-semibold text-slate-550">
                  <span className="font-bold text-slate-700">{s.state}</span>
                  <span>{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Top Cities</span>
              {data.geographic.usersByCity.slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex justify-between text-xs font-semibold text-slate-550">
                  <span className="font-bold text-slate-700">{c.city}</span>
                  <span>{c.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 15: Skills Gaps & Frequencies */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              Skills Analytics & Gaps
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Most common student skills and missing industry terms.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block font-sans">Most Common Skills</span>
              <div className="space-y-2">
                {data.skills.mostCommon.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 bg-slate-50 px-3 py-2 rounded-xl border border-slate-150">
                    <span className="text-slate-800">{s.skill}</span>
                    <span className="text-[10px] text-slate-400">{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block font-sans">Most Missing Skills</span>
              <div className="space-y-2">
                {data.skills.mostMissing.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 bg-red-50/50 px-3 py-2 rounded-xl border border-red-100">
                    <span className="text-red-750 font-black">{s.skill}</span>
                    <span className="text-[9px] text-red-400 font-black">Missing</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Founder MRR/ARR Revenue Models & Mentorship sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 13: Revenue Dashboard */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              SaaS Founder Revenue Dashboard
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Subscriptions, Monthly Recurring Revenue, and ARR forecasts.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md space-y-1">
              <span className="text-[8px] font-black uppercase tracking-wider opacity-80">Monthly Recurring Revenue (MRR)</span>
              <p className="text-3xl font-black">₹{data.revenue.mrr.toLocaleString()}</p>
              <span className="text-[9px] opacity-90 font-bold block mt-1">Based on premium plans</span>
            </div>
            <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md space-y-1">
              <span className="text-[8px] font-black uppercase tracking-wider opacity-85">Annual Run Rate (ARR)</span>
              <p className="text-3xl font-black">₹{data.revenue.arr.toLocaleString()}</p>
              <span className="text-[9px] opacity-90 font-bold block mt-1">12x MRR projection model</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subscriptions</span>
              <p className="text-base font-black text-slate-800 mt-1">{data.revenue.subscriptions}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</span>
              <p className="text-base font-black text-slate-800 mt-1">{data.revenue.conversionRate}%</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LTV (average)</span>
              <p className="text-base font-black text-slate-800 mt-1">₹1,696</p>
            </div>
          </div>
        </div>

        {/* Section 12: Mentorship Analytics */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Mentorship Bookings & Marketplace
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Sessions bookings, cancellation indices, and marketplace ratings.</p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center border-b border-slate-100 pb-4">
            {[
              { label: "Bookings", val: data.mentorship.bookings },
              { label: "Completed", val: data.mentorship.completed },
              { label: "Cancelled", val: data.mentorship.cancelled },
              { label: "Revenue", val: `₹${data.mentorship.revenue.toLocaleString()}` }
            ].map((stat, idx) => (
              <div key={idx}>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <p className="text-sm font-black text-slate-800 mt-1">{stat.val}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Top Rated Platform Mentors</span>
            <div className="space-y-2">
              {data.mentorship.topMentors.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-650 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="font-black text-slate-800 block">{m.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{m.category}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span>{m.sessionsCompleted} sessions</span>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 font-black rounded flex items-center gap-0.5 text-[10px]">
                      ★ {m.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Section 16: Placement Insights Engine */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 print:border-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-indigo-500 fill-indigo-50" />
              AI Platform Insights Engine
            </h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">Gemini analyzes platform metrics to generate trends and strategy recommendations.</p>
          </div>
          
          <div className="flex gap-2 items-center print:hidden">
            <input 
              type="password"
              placeholder="Google Gemini API Key (Optional)..."
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                localStorage.setItem("gemini_api_key", e.target.value);
              }}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-[240px]"
            />
            <button
              onClick={handleGenerateAIInsights}
              disabled={insightsLoading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {insightsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Compile Insights
            </button>
          </div>
        </div>

        {insightsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-50 border border-dashed border-slate-250 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-slate-450 font-bold uppercase tracking-wider text-[10px]">Gemini is auditing telemetry data...</span>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trends */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Real-time Platform Trends
              </h3>
              <ul className="space-y-3">
                {insights.trends.map((t, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 font-black text-[10px]">{idx + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Strategy Recommendations
              </h3>
              <ul className="space-y-3">
                {insights.recommendations.map((r, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 font-black text-[10px]">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
            {insightsError ? (
              <div className="text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {insightsError}
              </div>
            ) : (
              <span className="text-slate-400 font-bold text-xs">Click &quot;Compile Insights&quot; above to trigger Gemini analyses.</span>
            )}
          </div>
        )}
      </div>

      {/* Section: Outreach & Recruiter CRM Telemetry */}
      {data.recruiterAnalytics && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Recruiter CRM & Outreach Telemetry
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Aggregated metrics for recruiter databases, referrals conversion, and outreach channels.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Recruiters added</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.recruiterAnalytics.totalRecruiters.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referrals Requested</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.recruiterAnalytics.referralsRequested.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referral Success Rate</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{data.recruiterAnalytics.referralSuccessRate}%</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Relationship Score</span>
              <p className="text-xl font-black text-indigo-650 mt-1">{data.recruiterAnalytics.averageRelationshipScore} / 100</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
            {/* Top Outreach companies */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Outreach Companies</span>
              <div className="space-y-2">
                {data.recruiterAnalytics.topCompanies.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-bold">
                    <span className="text-slate-800 font-black">{c.name}</span>
                    <span className="text-slate-500">{c.count} contacts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outreach sources channels */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engagement Source channels</span>
              <div className="space-y-2">
                {data.recruiterAnalytics.topSources.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-bold">
                    <span className="text-slate-800 font-black">{s.name}</span>
                    <span className="text-slate-500">{s.count} logs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section: WhatsApp Growth Engine Telemetry */}
      {data.growthAnalytics && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500 animate-pulse" />
              WhatsApp Growth Engine Telemetry
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Aggregated metrics for referral loops, campaign dispatches, streaks participation, and community leaderboards.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Referrals loops</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.growthAnalytics.totalReferrals.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referral Conversion Rate</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{data.growthAnalytics.referralConversionRate}%</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Broadcast Campaigns CTR</span>
              <p className="text-xl font-black text-indigo-650 mt-1">{data.growthAnalytics.campaignCtr}%</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Active Users (DAU)</span>
              <p className="text-xl font-black text-slate-900 mt-1">{data.growthAnalytics.dau.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-650">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center">
              <span className="text-slate-500 font-black">Community Joins / Shares</span>
              <span className="text-slate-950 text-sm font-black">{data.growthAnalytics.communityGrowth.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center">
              <span className="text-slate-500 font-black">Streak Participations logged</span>
              <span className="text-slate-950 text-sm font-black">{data.growthAnalytics.streakParticipation.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center">
              <span className="text-slate-500 font-black">Leaderboard Views tracked</span>
              <span className="text-slate-950 text-sm font-black">{data.growthAnalytics.leaderboardActivity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: System Health & Export Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        
        {/* Section 17: System Health Monitor */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              System Infrastructure Health
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time indicators of endpoints, databases, and model layers.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "API Gateways", val: "Operational", status: data.systemHealth.apiHealth },
              { label: "Database Pool", val: "Connected", status: data.systemHealth.databaseHealth },
              { label: "Queue workers", val: "Idle", status: data.systemHealth.queueHealth },
              { label: "Gemini Model", val: "Online", status: data.systemHealth.aiApiHealth }
            ].map((node, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{node.label}</span>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full border", healthColor(node.status))} />
                  <span className="text-xs font-black text-slate-800">{node.val}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs font-bold">
            <span className="text-slate-500">Infrastructure error logs density:</span>
            <span className="text-emerald-600 font-black">{data.systemHealth.errorRate}% (Zero incident locks)</span>
          </div>
        </div>

        {/* Section 19: Export Center */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-500" />
              Telemetry Export Center
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Download administrative report data in CSV.</p>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Users Growth Report", type: "users" as const },
              { label: "Applications Stages Report", type: "applications" as const },
              { label: "Resume ATS Metrics", type: "ats" as const },
              { label: "PRI Readiness distributions", type: "pri" as const },
              { label: "SaaS revenue model details", type: "revenue" as const }
            ].map((btn, idx) => (
              <button 
                key={idx}
                onClick={() => handleExportData(btn.type)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl transition-all font-black text-xs uppercase tracking-wider text-slate-650 flex justify-between items-center cursor-pointer"
              >
                <span>{btn.label}</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Section 18: Admin Audit Logs */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 text-slate-800 rounded-xl flex items-center justify-center border border-slate-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Administrative Audit Logs</h2>
              <p className="text-xs text-slate-400 font-semibold">Track job creations, user moderation actions, and setting modifications.</p>
            </div>
          </div>
          
          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button 
              disabled={auditPage === 1}
              onClick={() => setAuditPage(p => Math.max(1, p - 1))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-500 px-1">Page {auditPage} of {totalAuditPages || 1}</span>
            <button 
              disabled={auditPage >= totalAuditPages}
              onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Admin Name</th>
                <th className="px-8 py-4">Action Type</th>
                <th className="px-8 py-4 text-right">Details Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/30">
                  <td className="px-8 py-4 font-mono text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-8 py-4 font-black text-slate-800">{log.adminName}</td>
                  <td className="px-8 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-650 font-black rounded text-[9px] uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right font-mono text-[10px] text-slate-400">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
              {data.auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                    No administrative actions recorded in logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
