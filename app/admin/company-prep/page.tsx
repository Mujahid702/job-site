"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Award,
  Zap,
  RefreshCw,
  Save,
  Check,
  XCircle,
  X,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Round {
  round_number: number;
  name: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tips: string;
}

interface Resource {
  round_number: number;
  name: string;
  type: "pdf" | "link" | "video" | "sheet";
  url: string;
  description: string;
}

interface CompanyPrep {
  id?: string;
  slug: string;
  name: string;
  overview: string;
  difficulty: "Medium" | "Hard" | "Extreme";
  salary_range: string;
  eligibility_cgpa: number;
  eligibility_branches: string[];
  eligibility_criteria: string;
  hiring_frequency: string;
  roles_hired: string[];
  must_have_skills: string[];
  good_to_have_skills: string[];
  bonus_skills: string[];
  package_value?: string;
  active_rounds: number;
  is_active: boolean;
  rounds?: Round[];
  resources?: Resource[];
}

interface Analytics {
  id: string;
  name: string;
  slug: string;
  views: number;
  attempts: number;
  completions: number;
}

export default function AdminCompanyPrepOS() {
  const [companies, setCompanies] = useState<CompanyPrep[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form drawers state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Metadata form values
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [overview, setOverview] = useState("");
  const [difficulty, setDifficulty] = useState<"Medium" | "Hard" | "Extreme">("Hard");
  const [salaryRange, setSalaryRange] = useState("");
  const [cgpa, setCgpa] = useState(6.0);
  const [branches, setBranches] = useState("");
  const [criteria, setCriteria] = useState("");
  const [frequency, setFrequency] = useState("Annual");
  const [roles, setRoles] = useState("");
  const [mustSkills, setMustSkills] = useState("");
  const [goodSkills, setGoodSkills] = useState("");
  const [bonusSkills, setBonusSkills] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Rounds subform list
  const [formRounds, setFormRounds] = useState<Round[]>([]);
  // Resources subform list
  const [formResources, setFormResources] = useState<Resource[]>([]);

  // Role details overrides state
  const [roleDetails, setRoleDetails] = useState<Record<string, any>>({});
  const [activeRoleTab, setActiveRoleTab] = useState<string>("default");

  const updateRoleDetailField = (field: string, value: any) => {
    if (activeRoleTab === "default") return;
    setRoleDetails(prev => ({
      ...prev,
      [activeRoleTab]: {
        ...prev[activeRoleTab],
        [field]: value
      }
    }));
  };

  // Current sub-form triggers
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundDuration, setNewRoundDuration] = useState("");
  const [newRoundDifficulty, setNewRoundDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newRoundTips, setNewRoundTips] = useState("");

  const [newResRoundNumber, setNewResRoundNumber] = useState(0);
  const [newResName, setNewResName] = useState("");
  const [newResType, setNewResType] = useState<"pdf" | "link" | "video" | "sheet">("pdf");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDesc, setNewResDesc] = useState("");

  const [saving, setSaving] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch metadata list
      const metaRes = await fetch("/api/admin/company-prep");
      const metaData = await metaRes.json();
      
      // 2. Fetch analytics
      const analRes = await fetch("/api/admin/company-prep/analytics");
      const analData = await analRes.json();

      if (metaRes.ok && metaData.success) {
        setCompanies(metaData.data);
      } else {
        setError(metaData.message || "Failed to load playbooks.");
      }

      if (analRes.ok && analData.success) {
        setAnalytics(analData.data);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleEditClick = async (compSlug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/company-prep?slug=${compSlug}`);
      const result = await res.json();
      
      if (res.ok && result.success) {
        const fullComp: CompanyPrep = result.data;
        setSelectedSlug(fullComp.slug);
        setSlug(fullComp.slug);
        setName(fullComp.name);
        setOverview(fullComp.overview || "");
        setDifficulty(fullComp.difficulty);
        setSalaryRange(fullComp.salary_range);
        setCgpa(fullComp.eligibility_cgpa);
        setBranches(fullComp.eligibility_branches?.join(", ") || "");
        setCriteria(fullComp.eligibility_criteria || "");
        setFrequency(fullComp.hiring_frequency || "Annual");
        setRoles(fullComp.roles_hired?.join(", ") || "");
        setMustSkills(fullComp.must_have_skills?.join(", ") || "");
        setGoodSkills(fullComp.good_to_have_skills?.join(", ") || "");
        setBonusSkills(fullComp.bonus_skills?.join(", ") || "");
        setIsActive(fullComp.is_active);

        setFormRounds(fullComp.rounds || []);
        setFormResources(fullComp.resources || []);
        setRoleDetails((fullComp as any).role_details || (fullComp as any).roleDetails || {});
        setActiveRoleTab("default");
        setIsEditing(true);
      } else {
        alert(result.message || "Failed to load detailed record.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading playbook details.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewClick = () => {
    setSelectedSlug(null);
    setSlug("");
    setName("");
    setOverview("");
    setDifficulty("Hard");
    setSalaryRange("");
    setCgpa(6.0);
    setBranches("Computer Science, Information Technology, Software Engineering");
    setCriteria("Minimum 60% or 6.0 CGPA standard across academic tracks, with no active backlogs.");
    setFrequency("Annual");
    setRoles("Software Engineer I, SWE Intern");
    setMustSkills("Data Structures & Algorithms, Java or Python, SQL databases");
    setGoodSkills("REST Web APIs, Git Code Versioning");
    setBonusSkills("AWS Cloud Foundations");
    setIsActive(true);
    setFormRounds([]);
    setFormResources([]);
    setRoleDetails({});
    setActiveRoleTab("default");
    setIsEditing(true);
  };

  const handleAddRound = () => {
    if (!newRoundName.trim()) return;
    const newRnd: Round = {
      round_number: 1,
      name: newRoundName.trim(),
      duration: newRoundDuration.trim() || "45 Mins",
      difficulty: newRoundDifficulty,
      tips: newRoundTips.trim()
    };

    if (activeRoleTab === "default") {
      newRnd.round_number = formRounds.length + 1;
      setFormRounds([...formRounds, newRnd]);
    } else {
      const currentRounds = roleDetails[activeRoleTab]?.hiringProcess || roleDetails[activeRoleTab]?.rounds || [];
      newRnd.round_number = currentRounds.length + 1;
      updateRoleDetailField("hiringProcess", [...currentRounds, newRnd]);
    }

    setNewRoundName("");
    setNewRoundDuration("");
    setNewRoundTips("");
  };

  const handleRemoveRound = (idx: number) => {
    if (activeRoleTab === "default") {
      const updated = formRounds.filter((_, i) => i !== idx).map((r, i) => ({
        ...r,
        round_number: i + 1
      }));
      setFormRounds(updated);
    } else {
      const currentRounds = roleDetails[activeRoleTab]?.hiringProcess || roleDetails[activeRoleTab]?.rounds || [];
      const updated = currentRounds.filter((_: any, i: number) => i !== idx).map((r: any, i: number) => ({
        ...r,
        round_number: i + 1
      }));
      updateRoleDetailField("hiringProcess", updated);
    }
  };

  const handleAddResource = () => {
    if (!newResName.trim() || !newResUrl.trim()) return;
    const newRes: Resource = {
      round_number: newResRoundNumber,
      name: newResName.trim(),
      type: newResType,
      url: newResUrl.trim(),
      description: newResDesc.trim()
    };

    if (activeRoleTab === "default") {
      setFormResources([...formResources, newRes]);
    } else {
      const currentRes = roleDetails[activeRoleTab]?.resources || [];
      updateRoleDetailField("resources", [...currentRes, newRes]);
    }

    setNewResName("");
    setNewResUrl("");
    setNewResDesc("");
    setNewResRoundNumber(0);
  };

  const handleRemoveResource = (idx: number) => {
    if (activeRoleTab === "default") {
      setFormResources(formResources.filter((_, i) => i !== idx));
    } else {
      const currentRes = roleDetails[activeRoleTab]?.resources || [];
      updateRoleDetailField("resources", currentRes.filter((_: any, i: number) => i !== idx));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !name.trim() || !salaryRange.trim()) {
      alert("Missing required primary metadata fields.");
      return;
    }

    setSaving(true);
    try {
      const splitCsv = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);

      const payload = {
        prep: {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          overview: overview.trim(),
          difficulty,
          salary_range: salaryRange.trim(),
          eligibility_cgpa: cgpa,
          eligibility_branches: splitCsv(branches),
          eligibility_criteria: criteria.trim(),
          hiring_frequency: frequency.trim(),
          roles_hired: splitCsv(roles),
          must_have_skills: splitCsv(mustSkills),
          good_to_have_skills: splitCsv(goodSkills),
          bonus_skills: splitCsv(bonusSkills),
          active_rounds: formRounds.length,
          role_details: roleDetails,
          is_active: isActive
        },
        rounds: formRounds,
        resources: formResources
      };

      const res = await fetch("/api/admin/company-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setIsEditing(false);
        await fetchInitialData();
        alert("Company preparation playbook saved successfully!");
      } else {
        alert(result.message || "Failed to save company prep.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving company preparation details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company prep playbook? This deletes all associated rounds, resources, and student roadmaps.")) return;

    try {
      const res = await fetch(`/api/admin/company-prep?id=${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await fetchInitialData();
        alert("Playbook deleted successfully.");
      } else {
        alert(result.message || "Failed to delete company prep.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting company prep playbook.");
    }
  };

  return (
    <div className="space-y-12 pb-20 font-sans text-left">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-650 font-black text-xs uppercase tracking-widest mb-2">
            <Building2 className="w-4 h-4" />
            Recruiter Playbook OS
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Company Prep Engine</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Build recruitment structures, write eligibility rules, upload round-specific resources, and track candidate study logs.
          </p>
        </div>

        <button
          onClick={handleNewClick}
          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Playbook
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Playbooks...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">Failure loading configurations</h3>
          <p className="text-slate-500 text-xs font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main workspace section: Playbooks lists & analytics (8 cols or full) */}
          <div className={cn("space-y-8", isEditing ? "lg:col-span-6" : "lg:col-span-12")}>
            
            {/* Analytics Overview Metrics (only shown if not full edit mode to optimize layout space) */}
            {!isEditing && analytics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Total Views", value: analytics.reduce((acc, c) => acc + c.views, 0), desc: "Direct views on Playbook hub page.", color: "text-blue-600 bg-blue-50/50" },
                  { label: "Active Attempted Roadmaps", value: analytics.reduce((acc, c) => acc + c.attempts, 0), desc: "AI personalized playbooks built.", color: "text-indigo-600 bg-indigo-50/50" },
                  { label: "Most Visited Company", value: analytics.length > 0 ? analytics.sort((a,b) => b.views - a.views)[0].name : "None", desc: "Highest traffic counts tracker.", color: "text-emerald-600 bg-emerald-50/50" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 p-6 rounded-[2rem] space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                    <strong className="text-2xl font-black text-slate-800 block">{stat.value}</strong>
                    <span className="text-[10px] text-slate-450 font-bold block">{stat.desc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* List grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map(comp => {
                const stat = analytics.find(a => a.slug === comp.slug);
                return (
                  <div
                    key={comp.id}
                    className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-between h-64 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <strong className="text-base font-black text-slate-850 group-hover:text-indigo-650 transition-colors block">
                            {comp.name}
                          </strong>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">
                            Slug: {comp.slug} • Frequency: {comp.hiring_frequency}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                          comp.is_active
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        )}>
                          {comp.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 font-black block">CGPA Cutoff</span>
                          <span className="font-bold text-slate-700">{comp.eligibility_cgpa} CGPA</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-black block">Salary Packages</span>
                          <span className="font-bold text-slate-700">{comp.salary_range}</span>
                        </div>
                      </div>

                      {/* Mini stats tracker */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Rounds: {comp.active_rounds || 0}</span>
                        {stat && (
                          <span className="text-slate-500">
                            Views: {stat.views} • Attempts: {stat.attempts}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <a
                        href={`/company-prep/${comp.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest flex items-center gap-1"
                      >
                        Live Hub <ExternalLink className="w-3 h-3" />
                      </a>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(comp.slug)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(comp.id || "")}
                          className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Form Editing Column (6 cols if active) */}
          {isEditing && (
            <div className="lg:col-span-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl space-y-6 max-h-[85vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900 font-display">
                  {selectedSlug ? `Edit Playbook: ${name}` : "Create Recruitment Playbook"}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6 text-xs">
                
                {/* 0. Role Tabs Selector */}
                {(() => {
                  const activeFormRounds = activeRoleTab === "default" ? formRounds : (roleDetails[activeRoleTab]?.hiringProcess || roleDetails[activeRoleTab]?.rounds || []);
                  const activeFormResources = activeRoleTab === "default" ? formResources : (roleDetails[activeRoleTab]?.resources || []);

                  const currentRoleData = roleDetails[activeRoleTab] || {};
                  const activeRoleSalary = currentRoleData.salaryRange || currentRoleData.salary_range || "";
                  const activeRolePrepTime = currentRoleData.prepTime || "25 Days";
                  const activeRoleSelectionRatio = currentRoleData.selectionRatio || "10 - 12%";
                  const activeRoleMustSkills = currentRoleData.mustHaveSkills?.join(", ") || currentRoleData.must_have_skills?.join(", ") || "";
                  const activeRoleGoodSkills = currentRoleData.goodToHaveSkills?.join(", ") || currentRoleData.good_to_have_skills?.join(", ") || "";
                  const activeRoleBonusSkills = currentRoleData.bonusSkills?.join(", ") || currentRoleData.bonus_skills?.join(", ") || "";
                  const activeRoleRoadmap30 = currentRoleData.roadmap30?.join("\n") || "";
                  const activeRoleRoadmap60 = currentRoleData.roadmap60?.join("\n") || "";
                  const activeRoleRoadmap90 = currentRoleData.roadmap90?.join("\n") || "";
                  const activeRolePlannerChecklist = currentRoleData.plannerChecklist?.join("\n") || "";

                  return (
                    <>
                      <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200/60 flex flex-wrap gap-1 mb-6">
                        <button
                          key="default"
                          type="button"
                          onClick={() => setActiveRoleTab("default")}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                            activeRoleTab === "default"
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-505 hover:text-slate-900 hover:bg-slate-200/50"
                          )}
                        >
                          Global Defaults
                        </button>
                        {roles.split(",").map(r => r.trim()).filter(Boolean).map(roleName => (
                          <button
                            key={roleName}
                            type="button"
                            onClick={() => setActiveRoleTab(roleName)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                              activeRoleTab === roleName
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-505 hover:text-slate-900 hover:bg-slate-200/50"
                            )}
                          >
                            {roleName}
                          </button>
                        ))}
                      </div>

                      {activeRoleTab === "default" ? (
                        <>
                          {/* 1. Core Meta */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company Slug (lowercase)</label>
                              <input
                                type="text"
                                required
                                disabled={!!selectedSlug}
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. amazon"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company Name</label>
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. Amazon"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company Overview</label>
                            <textarea
                              rows={3}
                              required
                              value={overview}
                              onChange={(e) => setOverview(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold leading-relaxed focus:outline-none focus:bg-white"
                              placeholder="Short description of the company and target culture..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Default Salary Range Description</label>
                              <input
                                type="text"
                                required
                                value={salaryRange}
                                onChange={(e) => setSalaryRange(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                                placeholder="e.g. ₹18 - ₹45 LPA"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hiring Difficulty</label>
                              <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as any)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                              >
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Extreme">Extreme</option>
                              </select>
                            </div>
                          </div>

                          {/* 2. Eligibility & Criteria */}
                          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 space-y-4">
                            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Eligibility Thresholds</strong>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Minimum CGPA</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  required
                                  value={cgpa}
                                  onChange={(e) => setCgpa(parseFloat(e.target.value) || 6.0)}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hiring Frequency</label>
                                <input
                                  type="text"
                                  required
                                  value={frequency}
                                  onChange={(e) => setFrequency(e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold focus:outline-none"
                                  placeholder="e.g. Annual"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Allowed Branches (Comma separated)</label>
                              <input
                                type="text"
                                value={branches}
                                onChange={(e) => setBranches(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold focus:outline-none"
                                placeholder="e.g. Computer Science, Information Technology"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Detailed Criteria Text</label>
                              <input
                                type="text"
                                value={criteria}
                                onChange={(e) => setCriteria(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold focus:outline-none"
                                placeholder="e.g. Minimum 60% throughout 10th and 12th"
                              />
                            </div>
                          </div>

                          {/* Skills configuration */}
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Roles Hired (Comma separated)</label>
                              <input
                                type="text"
                                value={roles}
                                onChange={(e) => setRoles(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Default Must Have Skills (Comma separated)</label>
                              <input
                                type="text"
                                value={mustSkills}
                                onChange={(e) => setMustSkills(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Default Good Have Skills</label>
                                <input
                                  type="text"
                                  value={goodSkills}
                                  onChange={(e) => setGoodSkills(e.target.value)}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Default Bonus Skills</label>
                                <input
                                  type="text"
                                  value={bonusSkills}
                                  onChange={(e) => setBonusSkills(e.target.value)}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Role Overrides Editing */}
                          <div className="p-5 bg-indigo-50 border border-indigo-150 rounded-[1.5rem] flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block">Role Overrides Active</span>
                              <strong className="text-sm font-black text-slate-800">{activeRoleTab}</strong>
                            </div>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Configure specific parameters below</span>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Salary Range Override</label>
                              <input
                                type="text"
                                value={activeRoleSalary}
                                onChange={(e) => updateRoleDetailField("salaryRange", e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. ₹5.0 - ₹8.0 LPA"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Prep Time Override</label>
                              <input
                                type="text"
                                value={activeRolePrepTime}
                                onChange={(e) => updateRoleDetailField("prepTime", e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. 20 Days"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Selection Ratio Override</label>
                              <input
                                type="text"
                                value={activeRoleSelectionRatio}
                                onChange={(e) => updateRoleDetailField("selectionRatio", e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. 10 - 12%"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Must Have Skills (Comma separated)</label>
                              <input
                                type="text"
                                value={activeRoleMustSkills}
                                onChange={(e) => updateRoleDetailField("mustHaveSkills", e.target.value.split(",").map(s => s.trim()))}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                placeholder="e.g. Java, DBMS, SQL"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Good Have Skills (Comma separated)</label>
                                <input
                                  type="text"
                                  value={activeRoleGoodSkills}
                                  onChange={(e) => updateRoleDetailField("goodToHaveSkills", e.target.value.split(",").map(s => s.trim()))}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                  placeholder="e.g. Cloud Foundations, Git"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bonus Skills (Comma separated)</label>
                                <input
                                  type="text"
                                  value={activeRoleBonusSkills}
                                  onChange={(e) => updateRoleDetailField("bonusSkills", e.target.value.split(",").map(s => s.trim()))}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:bg-white"
                                  placeholder="e.g. Docker, Kubernetes"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Roadmaps and daily checklist override textareas */}
                          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 space-y-4">
                            <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-display">Roadmap & Checklist Overrides</strong>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">30-Day Plan Milestones (One per line)</label>
                                <textarea
                                  rows={4}
                                  value={activeRoleRoadmap30}
                                  onChange={(e) => updateRoleDetailField("roadmap30", e.target.value.split("\n"))}
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold leading-relaxed focus:outline-none"
                                  placeholder="e.g. Days 1-7: Python core..."
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">60-Day Plan Milestones (One per line)</label>
                                <textarea
                                  rows={4}
                                  value={activeRoleRoadmap60}
                                  onChange={(e) => updateRoleDetailField("roadmap60", e.target.value.split("\n"))}
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold leading-relaxed focus:outline-none"
                                  placeholder="e.g. Days 15-30: ETL normalizations..."
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">90-Day Plan Milestones (One per line)</label>
                                <textarea
                                  rows={4}
                                  value={activeRoleRoadmap90}
                                  onChange={(e) => updateRoleDetailField("roadmap90", e.target.value.split("\n"))}
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold leading-relaxed focus:outline-none"
                                  placeholder="e.g. Days 60-90: Direct mocks..."
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Daily Checklist Planner Tasks (One per line)</label>
                              <textarea
                                rows={3}
                                value={activeRolePlannerChecklist}
                                onChange={(e) => updateRoleDetailField("plannerChecklist", e.target.value.split("\n"))}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold leading-relaxed focus:outline-none"
                                placeholder="e.g. Code 2 SQL joins queries..."
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* 3. Hiring rounds subform */}
                      <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 space-y-4">
                        <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Configure Hiring Rounds {activeRoleTab !== "default" && `(${activeRoleTab})`}
                        </strong>
                        
                        {activeFormRounds.length > 0 ? (
                          <div className="space-y-2">
                            {activeFormRounds.map((rnd: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-black text-slate-800">Round {rnd.round_number || (idx + 1)}: {rnd.name}</span>
                                  <span className="text-[10px] text-slate-400 block">{rnd.duration} • Difficulty: {rnd.difficulty}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRound(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No rounds defined. Add at least one step.</p>
                        )}

                        <div className="border-t border-slate-200 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Round Name (e.g. Technical Interview)"
                              value={newRoundName}
                              onChange={(e) => setNewRoundName(e.target.value)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Duration (e.g. 60 Minutes)"
                              value={newRoundDuration}
                              onChange={(e) => setNewRoundDuration(e.target.value)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={newRoundDifficulty}
                              onChange={(e) => setNewRoundDifficulty(e.target.value as any)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleAddRound}
                              className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                              Add Round
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Tips to clear this round..."
                            value={newRoundTips}
                            onChange={(e) => setNewRoundTips(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 4. Resources subform */}
                      <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 space-y-4">
                        <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Upload Study Resources Vault {activeRoleTab !== "default" && `(${activeRoleTab})`}
                        </strong>
                        
                        {activeFormResources.length > 0 ? (
                          <div className="space-y-2">
                            {activeFormResources.map((res: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-black text-slate-800">{res.name}</span>
                                  <span className="text-[10px] text-slate-450 block">Round {res.round_number || 0} ({res.type}) • Link: {res.url}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveResource(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No resources added. Add files or sheets for reference.</p>
                        )}

                        <div className="border-t border-slate-200 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Resource Name (e.g. SDE Guide)"
                              value={newResName}
                              onChange={(e) => setNewResName(e.target.value)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Resource URL Link"
                              value={newResUrl}
                              onChange={(e) => setNewResUrl(e.target.value)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <select
                              value={newResType}
                              onChange={(e) => setNewResType(e.target.value as any)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            >
                              <option value="pdf">PDF File</option>
                              <option value="link">Web Link</option>
                              <option value="video">Video URL</option>
                              <option value="sheet">Excel Sheet</option>
                            </select>
                            
                            <select
                              value={newResRoundNumber}
                              onChange={(e) => setNewResRoundNumber(parseInt(e.target.value) || 0)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                            >
                              <option value={0}>General Resource</option>
                              {activeFormRounds.map((r: any) => (
                                <option key={r.round_number} value={r.round_number}>Round {r.round_number}: {r.name.slice(0, 12)}...</option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={handleAddResource}
                              className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                              Add File
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Brief description of file contents..."
                            value={newResDesc}
                            onChange={(e) => setNewResDesc(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* State active checklist */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4.5 h-4.5 border-slate-200 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-slate-700 font-bold select-none">Make this playbook active (visible to students)</label>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-grow py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-grow py-3 bg-slate-900 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Playbook</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
