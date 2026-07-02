"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, Search, PlusCircle, CheckCircle2, 
  UserPlus, FileText, ArrowRight, UserCheck, 
  MapPin, Filter, Briefcase, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  company: string;
  targetRole: string;
  status: "active" | "completed" | "paused";
  applicantsCount: number;
}

interface Candidate {
  id: string;
  name: string;
  college: string;
  targetRole: string;
  skills: string[];
  priScore: number;
  portfolioUrl: string;
}

export default function RecruiterPortalDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchSkill, setSearchSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertText, setAlertText] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching campaigns and qualified candidates
    setTimeout(() => {
      setCampaigns([
        { id: "1", title: "AWS Core Infrastructure Drive", company: "Amazon", targetRole: "Cloud Engineer", status: "active", applicantsCount: 42 },
        { id: "2", title: "Enterprise Systems Graduate Program", company: "Deloitte", targetRole: "Consulting Analyst", status: "active", applicantsCount: 128 },
        { id: "3", title: "Global Technology Hiring Drive", company: "TCS", targetRole: "System Engineer", status: "completed", applicantsCount: 310 }
      ]);
      setCandidates([
        { id: "c1", name: "Rohan Sharma", college: "VIT University", targetRole: "Full Stack Engineer", skills: ["React", "Node.js", "TypeScript", "Redis"], priScore: 84, portfolioUrl: "#" },
        { id: "c2", name: "Ananya Goel", college: "BMS College", targetRole: "Backend Engineer", skills: ["Python", "Docker", "SQL", "Kubernetes"], priScore: 78, portfolioUrl: "#" },
        { id: "c3", name: "Vikram Malhotra", college: "PES University", targetRole: "Cloud Architect", skills: ["AWS", "Terraform", "Java", "Docker"], priScore: 82, portfolioUrl: "#" }
      ]);
      setLoading(false);
    }, 450);
  }, []);

  const handleLaunchCampaign = () => {
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      title: "New Talent Drive 2026",
      company: "BuggedBrain Partner",
      targetRole: "Software Development Intern",
      status: "active",
      applicantsCount: 0
    };
    setCampaigns([newCamp, ...campaigns]);
    triggerAlert("Hiring Campaign launched successfully!");
  };

  const triggerAlert = (msg: string) => {
    setAlertText(msg);
    setTimeout(() => setAlertText(null), 3500);
  };

  const filteredCandidates = candidates.filter(cand => 
    searchSkill === "" || cand.skills.some(s => s.toLowerCase().includes(searchSkill.toLowerCase()))
  );

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest mb-2">
            <Building2 className="w-4.5 h-4.5 text-violet-500" />
            Recruiter Campaign Management Portal
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none font-display">
            Hiring & Campaigns Panel
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-1.5">
            Post job placements drives, inspect student PRI readiness indices, and review verified engineering portfolios.
          </p>
        </div>

        <button
          onClick={handleLaunchCampaign}
          className="p-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer text-xs font-black uppercase tracking-widest font-sans border-none"
        >
          <PlusCircle className="w-4 h-4" />
          Launch Campaign
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
          Loading recruiter portal context...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Drives & Campaigns */}
          <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
                <Briefcase className="w-5 h-5 text-violet-600" />
                Active Hiring Campaigns
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage live drive configurations and applicant statistics.</p>
            </div>

            <div className="space-y-4">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-start">
                  <div>
                    <strong className="text-xs font-black text-slate-800 block">{camp.title}</strong>
                    <span className="text-[10px] text-slate-400 font-bold">{camp.company} • {camp.targetRole}</span>
                    <span className="block text-[10px] text-slate-500 mt-2 font-semibold">
                      {camp.applicantsCount} qualified candidates applied
                    </span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border",
                    camp.status === "active" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-200 border-slate-300 text-slate-500"
                  )}>
                    {camp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate database lookup tool */}
          <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
                  <UserCheck className="w-5 h-5 text-violet-600" />
                  Qualified Candidates Lookup
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Search candidates by skill keywords matching placement requirements.</p>
              </div>

              <input
                type="text"
                placeholder="Filter by skill (e.g. React)..."
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shrink-0 max-w-[200px]"
              />
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {filteredCandidates.map((cand) => (
                <div key={cand.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <strong className="text-xs font-black text-slate-850 block">{cand.name}</strong>
                    <span className="text-[10px] text-slate-400 font-bold block">{cand.college} • {cand.targetRole}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cand.skills.map((s, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                    <div className="text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Readiness PRI</span>
                      <strong className="text-sm font-black text-slate-900">{cand.priScore}</strong>
                    </div>
                    <a
                      href={cand.portfolioUrl}
                      className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-650 transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                      Portfolio
                      <ExternalLink className="w-3 h-3 text-slate-450" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {alertText && (
        <div className="fixed bottom-6 right-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg z-50 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{alertText}</span>
        </div>
      )}

    </div>
  );
}
