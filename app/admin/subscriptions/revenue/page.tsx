"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, ShieldAlert, Sparkles, TrendingUp, Users, ArrowUpRight, BarChart3, CreditCard, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueMetrics {
  totalRevenue: number;
  mrr: number;
  subscribers: number;
  conversionRate: number;
  plansDistribution: Record<string, number>;
  providerSplit: {
    stripe: number;
    razorpay: number;
  };
  growthTimeline: { month: string; amount: number }[];
}

export default function AdminRevenuePage() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/revenue");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-800">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiling Financial Metrics...</p>
      </div>
    );
  }

  // Draw clean responsive SVG Graph paths if growth timeline is present
  const timeline = metrics?.growthTimeline || [];
  const maxVal = timeline.length > 0 ? Math.max(...timeline.map(t => t.amount)) * 1.2 : 1000;
  
  // Convert months to SVG coordinates
  const svgWidth = 500;
  const svgHeight = 200;
  
  const points = timeline.map((t, idx) => {
    const x = (idx / Math.max(1, timeline.length - 1)) * (svgWidth - 60) + 30;
    const y = svgHeight - (t.amount / maxVal) * (svgHeight - 40) - 20;
    return { x, y, label: t.month, val: t.amount };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - 10} L ${points[0].x} ${svgHeight - 10} Z`
    : "";

  return (
    <div className="space-y-12 max-w-5xl mx-auto p-4 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left border-b border-slate-100 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            Revenue Analytics Hub
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight font-display">
            Financial & Growth KPIs
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Live metrics reporting conversion rates, growth trajectories, and subscription distribution.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
          title="Reload Metrics"
        >
          <RefreshCcw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {metrics && (
        <div className="space-y-8">
          
          {/* HUD Scorecards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] space-y-2 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">MRR Run-Rate</span>
              <strong className="text-2xl font-black text-slate-900 block">${metrics.mrr}</strong>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.4% vs last week</span>
              </span>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] space-y-2 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Total Revenue</span>
              <strong className="text-2xl font-black text-slate-900 block">${metrics.totalRevenue}</strong>
              <span className="text-[9px] font-bold text-slate-400 font-mono">Gross aggregate bookings</span>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] space-y-2 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Premium Accounts</span>
              <strong className="text-2xl font-black text-slate-900 block">{metrics.subscribers}</strong>
              <span className="text-[9px] font-bold text-slate-400 font-mono">Active paying subscribers</span>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] space-y-2 shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono block">Conversion Rate</span>
              <strong className="text-2xl font-black text-slate-900 block">{metrics.conversionRate}%</strong>
              <span className="text-[9px] font-bold text-indigo-650 font-mono">Free-to-Premium ratio</span>
            </div>
          </div>

          {/* Graph & Splits Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Revenue growth graph */}
            <div className="lg:col-span-8 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">MRR Growth Timeline</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Monthly aggregates (USD)</span>
              </div>

              {/* SVG Line Graph */}
              <div className="relative">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = svgHeight - ratio * (svgHeight - 40) - 20;
                    return (
                      <line
                        key={idx}
                        x1="30"
                        y1={y}
                        x2={svgWidth - 30}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Gradient fill */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#mrr-glow)"
                      opacity="0.25"
                    />
                  )}

                  {/* Line path */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Data Point Nodes */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        fill="#ffffff"
                        stroke="#4f46e5"
                        strokeWidth="3"
                      />
                      {/* Price tooltip */}
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#1e293b"
                        fontFamily="monospace"
                      >
                        ${p.val}
                      </text>
                      {/* Month label */}
                      <text
                        x={p.x}
                        y={svgHeight - 2}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="mrr-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Provider Split & Distribution */}
            <div className="lg:col-span-4 bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Gateway Channel split</h4>
              </div>

              <div className="space-y-6">
                {/* Stripe Split */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Stripe Checkout</span>
                    <span>{metrics.providerSplit.stripe} txs</span>
                  </div>
                  <div className="w-full h-3 bg-slate-150 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-650"
                      style={{ width: `${(metrics.providerSplit.stripe / Math.max(1, metrics.providerSplit.stripe + metrics.providerSplit.razorpay)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Razorpay Split */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-blue-500" /> Razorpay Checkout</span>
                    <span>{metrics.providerSplit.razorpay} txs</span>
                  </div>
                  <div className="w-full h-3 bg-slate-150 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(metrics.providerSplit.razorpay / Math.max(1, metrics.providerSplit.stripe + metrics.providerSplit.razorpay)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Plan Distribution ratios */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs font-semibold text-slate-500">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Plan Allocations</span>
                  
                  {Object.entries(metrics.plansDistribution || {}).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between items-center capitalize border-b border-slate-50 pb-2 last:border-0">
                      <span>{plan} Tier:</span>
                      <span className="font-bold text-slate-800 font-mono">{count} subscriber{count === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
