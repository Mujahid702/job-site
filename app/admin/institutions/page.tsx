"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Trophy, BookOpen, 
  ArrowUpRight, Award, ChevronRight, Activity,
  Briefcase, GraduationCap, MapPin, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentMetric {
  id: string;
  name: string;
  totalStudents: number;
  placedStudents: number;
  placementRate: number;
  averagePri: number;
  topRole: string;
}

export default function CollegeInstitutionalDashboard() {
  const [departments, setDepartments] = useState<DepartmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "departments">("overview");

  useEffect(() => {
    // Simulate fetching institutional department data
    setTimeout(() => {
      setDepartments([
        { id: "1", name: "Computer Science & Engineering", totalStudents: 180, placedStudents: 145, placementRate: 80.5, averagePri: 78, topRole: "Software Development Engineer (SDE)" },
        { id: "2", name: "Information Science & Technology", totalStudents: 120, placedStudents: 92, placementRate: 76.6, averagePri: 74, topRole: "Full Stack Engineer" },
        { id: "3", name: "Electronics & Communication", totalStudents: 150, placedStudents: 85, placementRate: 56.6, averagePri: 68, topRole: "Embedded Systems Engineer" },
        { id: "4", name: "Mechanical Engineering", totalStudents: 90, placedStudents: 42, placementRate: 46.6, averagePri: 58, topRole: "CAD Design Engineer" }
      ]);
      setLoading(false);
    }, 400);
  }, []);

  const totalStudentsCount = departments.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const totalPlacedCount = departments.reduce((acc, curr) => acc + curr.placedStudents, 0);
  const avgPlacementRate = departments.length > 0
    ? parseFloat((departments.reduce((acc, curr) => acc + curr.placementRate, 0) / departments.length).toFixed(1))
    : 0;

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
            <GraduationCap className="w-4.5 h-4.5 text-indigo-500" />
            Institutional Portal & Placement Cell Control
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none font-display">
            College Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-1.5">
            Monitor department readiness metrics, track placed statistics ratios, and audit student skill gaps.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: "overview", label: "Readiness Overview" },
            { id: "departments", label: "Department Metrics" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
          Loading college metrics...
        </div>
      ) : activeTab === "overview" ? (
        <div className="space-y-10">
          
          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Batches Size", value: `${totalStudentsCount} Students`, sub: "2026 Graduating Batch", color: "bg-indigo-500" },
              { label: "Overall Placed Students", value: `${totalPlacedCount} Placed`, sub: `${avgPlacementRate}% average rate`, color: "bg-emerald-500" },
              { label: "Highest CTC Offered", value: "42.5 LPA", sub: "Offered by Amazon Web Services", color: "bg-amber-500" }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[130px] hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{card.label}</span>
                  <div className={cn("w-2.5 h-2.5 rounded-full", card.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{card.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Skill gaps & Placement Readiness sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Department skill gaps list */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Key Industry Skill Gaps
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Top skills missing from resumes according to active hiring partners.</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: "System Design & Microservices", missingPct: 68, critical: true },
                  { name: "Docker & Kubernetes Deployment", missingPct: 54, critical: false },
                  { name: "Redis Caching Layers", missingPct: 42, critical: false },
                  { name: "Database Indexing & SQL Tuning", missingPct: 35, critical: false }
                ].map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{skill.name}</span>
                      <span className={cn(skill.critical ? "text-rose-600 font-black" : "text-slate-500")}>
                        {skill.missingPct}% students missing
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", skill.critical ? "bg-rose-500" : "bg-indigo-500")} style={{ width: `${skill.missingPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Activity overview */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Recruitment Drives Pipeline
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Active interview opportunities and campus drives status.</p>
              </div>

              <div className="space-y-3">
                {[
                  { company: "Deloitte", drive: "Consulting Analyst", date: "Jul 12, 2026", status: "Applications Open" },
                  { company: "TCS", drive: "Ninja & Digital Developer", date: "Jul 24, 2026", status: "Assessment Scheduled" },
                  { company: "Accenture", drive: "Associate Software Engineer", date: "Aug 05, 2026", status: "Drive Planned" }
                ].map((drive, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center">
                    <div>
                      <strong className="text-xs font-black text-slate-800 block">{drive.company}</strong>
                      <span className="text-[10px] text-slate-400 font-bold">{drive.drive} • {drive.date}</span>
                    </div>
                    <span className="text-[9px] font-black text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg">
                      {drive.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Department detail table */
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Department Comparison Matrix</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Compare student counts, placement rate ratios, and average PRI scores.</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Department Name</th>
                  <th className="px-5 py-3.5 text-center">Students Count</th>
                  <th className="px-5 py-3.5 text-center">Placed Ratios</th>
                  <th className="px-5 py-3.5 text-center">Average PRI Score</th>
                  <th className="px-5 py-3.5 text-right">Primary Target Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-650">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-black text-slate-800">{dept.name}</td>
                    <td className="px-5 py-3.5 text-center">{dept.totalStudents}</td>
                    <td className="px-5 py-3.5 text-center text-emerald-600 font-black">{dept.placementRate}%</td>
                    <td className="px-5 py-3.5 text-center font-black">{dept.averagePri}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500 font-semibold">{dept.topRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
