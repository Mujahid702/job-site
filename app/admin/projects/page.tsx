"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Shield, RefreshCw, Briefcase, Tag, 
  Compass, Sparkles, Database, MessageSquare, BarChart2, Check, Award, Eye, Code, HelpCircle
} from "lucide-react";
import { CompanyProfile } from "@/lib/db/projects";
import { supabase } from "@/lib/supabase";

interface ProjectTemplate {
  id?: string;
  title: string;
  role: string;
  difficulty: string;
  tech: string[];
  summary: string;
  recommended_stack: string;
  architecture: string;
  learning_outcomes: string[];
  recruiter_value: string;
  is_featured: boolean;
  is_trending: boolean;
  is_beginner_friendly: boolean;
  is_high_demand: boolean;
  version: number;
  created_at?: string;
}

export default function AdminProjectsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recruiters" | "templates" | "qa" | "analytics">("recruiters");
  
  // Recruiter Profiles State
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [refreshingCompanies, setRefreshingCompanies] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companySkills, setCompanySkills] = useState("");
  const [companyFocus, setCompanyFocus] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  // Project Templates State
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [refreshingTemplates, setRefreshingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateRole, setTemplateRole] = useState("Full Stack Developer");
  const [templateDifficulty, setTemplateDifficulty] = useState("Intermediate");
  const [templateTech, setTemplateTech] = useState("");
  const [templateSummary, setTemplateSummary] = useState("");
  const [templateStack, setTemplateStack] = useState("");
  const [templateArch, setTemplateArch] = useState("");
  const [templateLearning, setTemplateLearning] = useState("");
  const [templateRecruiterValue, setTemplateRecruiterValue] = useState("");
  const [templateFeatured, setTemplateFeatured] = useState(false);
  const [templateTrending, setTemplateTrending] = useState(false);
  const [templateBeginnerFriendly, setTemplateBeginnerFriendly] = useState(false);
  const [templateHighDemand, setTemplateHighDemand] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(1);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Mock Q&A Builder State
  const [qaRound, setQaRound] = useState("sectionB");
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [qaLevel, setQaLevel] = useState("Intermediate");
  const [qaTech, setQaTech] = useState("");
  const [qaExpectation, setQaExpectation] = useState("");
  const [qaMistakes, setQaMistakes] = useState("");
  const [qaCode, setQaCode] = useState("");
  const [qaFollowUps, setQaFollowUps] = useState("");
  const [qaList, setQaList] = useState<any[]>([]);

  // Check admin access
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile?.role === "admin") {
        setIsAdmin(true);
        loadCompanies();
        loadTemplates();
      } else {
        setLoading(false);
      }
    }
    checkRole();
  }, []);

  // -- COMPANY API CALLS --
  const loadCompanies = async () => {
    setRefreshingCompanies(true);
    try {
      const res = await fetch("/api/admin/projects");
      const result = await res.json();
      if (result.success) setCompanies(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingCompanies(false);
      setLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companySkills || !companyFocus || !companyDesc) {
      alert("Please fill in all fields.");
      return;
    }
    setSavingCompany(true);

    const payload = {
      id: editingCompanyId || undefined,
      name: companyName,
      priority_skills: companySkills.split(",").map(s => s.trim()).filter(Boolean),
      focus: companyFocus,
      description: companyDesc
    };

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        alert("Company profile saved successfully!");
        resetCompanyForm();
        loadCompanies();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("Failed to save company: " + err.message);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleEditCompany = (company: CompanyProfile) => {
    setEditingCompanyId(company.id || null);
    setCompanyName(company.name);
    setCompanySkills(company.priority_skills.join(", "));
    setCompanyFocus(company.focus);
    setCompanyDesc(company.description);
    setShowCompanyForm(true);
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from target list?`)) return;
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        alert("Company target deleted.");
        loadCompanies();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("Failed to delete company: " + err.message);
    }
  };

  const resetCompanyForm = () => {
    setCompanyName("");
    setCompanySkills("");
    setCompanyFocus("");
    setCompanyDesc("");
    setEditingCompanyId(null);
    setShowCompanyForm(false);
  };

  // -- TEMPLATES API CALLS --
  const loadTemplates = async () => {
    setRefreshingTemplates(true);
    try {
      const res = await fetch("/api/admin/project-templates");
      const result = await res.json();
      if (result.success) setTemplates(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingTemplates(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle || !templateSummary || !templateStack || !templateArch) {
      alert("Please fill in required template details.");
      return;
    }
    setSavingTemplate(true);

    const payload = {
      id: editingTemplateId || undefined,
      title: templateTitle,
      role: templateRole,
      difficulty: templateDifficulty,
      tech: templateTech.split(",").map(s => s.trim()).filter(Boolean),
      summary: templateSummary,
      recommended_stack: templateStack,
      architecture: templateArch,
      learning_outcomes: templateLearning.split(",").map(s => s.trim()).filter(Boolean),
      recruiter_value: templateRecruiterValue,
      is_featured: templateFeatured,
      is_trending: templateTrending,
      is_beginner_friendly: templateBeginnerFriendly,
      is_high_demand: templateHighDemand,
      version: templateVersion
    };

    try {
      const res = await fetch("/api/admin/project-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        alert("Project template saved successfully!");
        resetTemplateForm();
        loadTemplates();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleEditTemplate = (tmpl: ProjectTemplate) => {
    setEditingTemplateId(tmpl.id || null);
    setTemplateTitle(tmpl.title);
    setTemplateRole(tmpl.role);
    setTemplateDifficulty(tmpl.difficulty);
    setTemplateTech((tmpl.tech || []).join(", "));
    setTemplateSummary(tmpl.summary);
    setTemplateStack(tmpl.recommended_stack || "");
    setTemplateArch(tmpl.architecture || "");
    setTemplateLearning((tmpl.learning_outcomes || []).join(", "));
    setTemplateRecruiterValue(tmpl.recruiter_value || "");
    setTemplateFeatured(tmpl.is_featured);
    setTemplateTrending(tmpl.is_trending);
    setTemplateBeginnerFriendly(tmpl.is_beginner_friendly);
    setTemplateHighDemand(tmpl.is_high_demand);
    setTemplateVersion(tmpl.version || 1);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete template "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/project-templates?id=${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        alert("Project template deleted.");
        loadTemplates();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("Failed to delete template: " + err.message);
    }
  };

  const resetTemplateForm = () => {
    setTemplateTitle("");
    setTemplateRole("Full Stack Developer");
    setTemplateDifficulty("Intermediate");
    setTemplateTech("");
    setTemplateSummary("");
    setTemplateStack("");
    setTemplateArch("");
    setTemplateLearning("");
    setTemplateRecruiterValue("");
    setTemplateFeatured(false);
    setTemplateTrending(false);
    setTemplateBeginnerFriendly(false);
    setTemplateHighDemand(false);
    setTemplateVersion(1);
    setEditingTemplateId(null);
    setShowTemplateForm(false);
  };

  // Mock Q&A additions
  const handleAddQaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion || !qaAnswer) {
      alert("Question and Answer are required.");
      return;
    }
    const newItem = {
      round: qaRound,
      q: qaQuestion,
      a: qaAnswer,
      level: qaLevel,
      tech: qaTech,
      expectation: qaExpectation,
      mistakes: qaMistakes,
      codeSnippet: qaCode,
      followUps: qaFollowUps.split("\n").map(s => s.trim()).filter(Boolean)
    };
    setQaList([newItem, ...qaList]);
    setQaQuestion("");
    setQaAnswer("");
    setQaExpectation("");
    setQaMistakes("");
    setQaCode("");
    setQaFollowUps("");
    alert("Question created locally! Under a production configuration, this indexes into target models databases.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Verifying admin permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">Unauthorized Access</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            You do not have administrative privileges to access the projects metadata control panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Shield className="w-3.5 h-3.5" />
            Project OS Admin Panel
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-display">
            Engineering Mentor Registry
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Configure recruitment parameters, structured system blueprints templates, and mock interview databases.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: "recruiters", label: "Target Recruiters", icon: Briefcase },
            { id: "templates", label: "Project Templates", icon: Database },
            { id: "qa", label: "Interview Builder", icon: MessageSquare },
            { id: "analytics", label: "Analytics Panel", icon: BarChart2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white text-slate-950 shadow-sm border border-slate-200" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- TAB 1: RECRUITERS CRUD --- */}
      {activeTab === "recruiters" && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display">Target Recruiters Profiles</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Manage target companies, core priority skills, and recruitment focus fields.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCompanyForm(!showCompanyForm);
                  setEditingCompanyId(null);
                  resetCompanyForm();
                }}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showCompanyForm ? "Close Drawer" : "Add Recruiter"}</span>
              </button>
              <button
                onClick={loadCompanies}
                disabled={refreshingCompanies}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-650 disabled:opacity-50"
              >
                <RefreshCw className={refreshingCompanies ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              </button>
            </div>
          </div>

          {showCompanyForm && (
            <form onSubmit={handleSaveCompany} className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-md space-y-6 animate-slide-up">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b pb-2">
                {editingCompanyId ? "Edit Recruiter Details" : "Register New Recruiter Target"}
              </strong>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="E.g. Netflix, Stripe"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Priority Skills (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={companySkills}
                    onChange={e => setCompanySkills(e.target.value)}
                    placeholder="E.g. Go, Kubernetes, Redis"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hiring Focus Theme</label>
                  <input
                    type="text"
                    required
                    value={companyFocus}
                    onChange={e => setCompanyFocus(e.target.value)}
                    placeholder="E.g. Real-Time Telemetry / ACID compliance"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hiring & Engineering Culture Summary</label>
                <textarea
                  required
                  rows={3}
                  value={companyDesc}
                  onChange={e => setCompanyDesc(e.target.value)}
                  placeholder="Summarize target systems architecture requirements or interview style standards."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetCompanyForm}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingCompany ? "Saving..." : "Save Company"}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(comp => (
              <div key={comp.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between gap-4 hover:border-indigo-300 transition-colors group">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">{comp.name}</h4>
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100 block self-start">
                        {comp.focus}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditCompany(comp)} className="p-1 hover:text-indigo-650 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCompany(comp.id!, comp.name)} className="p-1 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">{comp.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Core Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {comp.priority_skills.map((skill, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded text-[9px] font-bold text-slate-650">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs border border-dashed rounded-[2rem]">
                No registered recruiters found
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: PROJECT TEMPLATES CRUD --- */}
      {activeTab === "templates" && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display">System Blueprint templates</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Index primary structured templates representing reference architectures for roles.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTemplateForm(!showTemplateForm);
                  setEditingTemplateId(null);
                  resetTemplateForm();
                }}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showTemplateForm ? "Close Drawer" : "Add Blueprint Template"}</span>
              </button>
              <button
                onClick={loadTemplates}
                disabled={refreshingTemplates}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-650 disabled:opacity-50"
              >
                <RefreshCw className={refreshingTemplates ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              </button>
            </div>
          </div>

          {showTemplateForm && (
            <form onSubmit={handleSaveTemplate} className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-md space-y-6 animate-slide-up">
              <strong className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b pb-2">
                {editingTemplateId ? "Modify Blueprint Parameters" : "Publish Reference Architecture Blueprint"}
              </strong>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={templateTitle}
                    onChange={e => setTemplateTitle(e.target.value)}
                    placeholder="E.g. Microservice Order Processing Engine"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Target Role *</label>
                  <select
                    value={templateRole}
                    onChange={e => setTemplateRole(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  >
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Frontend Engineer">Frontend Engineer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Mobile Developer">Mobile Developer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Difficulty *</label>
                  <select
                    value={templateDifficulty}
                    onChange={e => setTemplateDifficulty(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Technologies (Comma separated)</label>
                  <input
                    type="text"
                    value={templateTech}
                    onChange={e => setTemplateTech(e.target.value)}
                    placeholder="E.g. Node.js, CitusDB, Redis, Docker"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Learning Outcomes (Comma separated)</label>
                  <input
                    type="text"
                    value={templateLearning}
                    onChange={e => setTemplateLearning(e.target.value)}
                    placeholder="E.g. Database sharding, Write locks resolution"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Blueprint Summary (1-2 sentences) *</label>
                <textarea
                  required
                  rows={2}
                  value={templateSummary}
                  onChange={e => setTemplateSummary(e.target.value)}
                  placeholder="Briefly state the engineering challenge and database caching limits optimized."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recommended Stack Specifications *</label>
                  <textarea
                    required
                    rows={4}
                    value={templateStack}
                    onChange={e => setTemplateStack(e.target.value)}
                    placeholder="Frontend: Next.js/React.js&#10;Backend: Express/Node.js&#10;Database: PostgreSQL&#10;Caching: Redis"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:bg-white transition-colors resize-none leading-normal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">System Architecture Core Rules *</label>
                  <textarea
                    required
                    rows={4}
                    value={templateArch}
                    onChange={e => setTemplateArch(e.target.value)}
                    placeholder="Clients connect via route proxies. Write locks are bypassed by queuing task requests on Redis BullMQ blocks."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:bg-white transition-colors resize-none leading-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Appeal & Selling Points</label>
                <input
                  type="text"
                  value={templateRecruiterValue}
                  onChange={e => setTemplateRecruiterValue(e.target.value)}
                  placeholder="E.g. Demonstrates ACID relational structures and high-throughput thread concurrency handlers."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 border border-slate-150 rounded-2xl">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={templateFeatured}
                    onChange={e => setTemplateFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Featured blueprint</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={templateTrending}
                    onChange={e => setTemplateTrending(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Trending project</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={templateBeginnerFriendly}
                    onChange={e => setTemplateBeginnerFriendly(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Beginner friendly</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={templateHighDemand}
                    onChange={e => setTemplateHighDemand(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>High Recruiter Demand</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetTemplateForm}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingTemplate ? "Publishing..." : "Save Template"}
                </button>
              </div>
            </form>
          )}

          {/* Templates list table */}
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs leading-normal">
                <thead className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Blueprint Title</th>
                    <th className="px-6 py-4">Target Role</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Attributes</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {templates.map(tmpl => (
                    <tr key={tmpl.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <strong className="text-sm font-black text-slate-900">{tmpl.title}</strong>
                          <p className="text-[10px] text-slate-400 max-w-md truncate font-medium">{tmpl.summary}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{tmpl.role}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black rounded border uppercase",
                          tmpl.difficulty === "Advanced" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          tmpl.difficulty === "Intermediate" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {tmpl.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {tmpl.is_featured && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100">FEATURED</span>}
                          {tmpl.is_trending && <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">TRENDING</span>}
                          {tmpl.is_high_demand && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">HIGH DEMAND</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleEditTemplate(tmpl)} className="p-1.5 hover:text-indigo-650 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteTemplate(tmpl.id!, tmpl.title)} className="p-1.5 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                        No blueprint templates registered in project_templates
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: MOCK INTERVIEW BUILDER --- */}
      {activeTab === "qa" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-left">
          {/* Creator Form */}
          <form onSubmit={handleAddQaItem} className="lg:col-span-5 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              <span>Q&A Index Builder</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-normal">
              Construct high-fidelity system interview questions that test specific database, caching, or code-review issues.
            </p>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Target Round Category</label>
              <select
                value={qaRound}
                onChange={e => setQaRound(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-colors"
              >
                <option value="sectionA">Round A: Project Explanation</option>
                <option value="sectionB">Round B: Tech Deep Dive</option>
                <option value="sectionC">Round C: Production Engineering</option>
                <option value="sectionD">Round D: Code Review</option>
                <option value="sectionE">Round E: STAR Behavioral</option>
                <option value="sectionF">Round F: FAANG Rapid Fire</option>
                <option value="sectionG">Round G: Common Scenario Probes</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Skill / Tech Tag</label>
                <input
                  type="text"
                  value={qaTech}
                  onChange={e => setQaTech(e.target.value)}
                  placeholder="E.g. Redis"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Difficulty Level</label>
                <select
                  value={qaLevel}
                  onChange={e => setQaLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                  <option value="Production">Production</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Question Prompt</label>
              <input
                type="text"
                required
                value={qaQuestion}
                onChange={e => setQaQuestion(e.target.value)}
                placeholder="E.g. How does multi-version concurrency control solve write locks?"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ideal Model Answer</label>
              <textarea
                required
                rows={3}
                value={qaAnswer}
                onChange={e => setQaAnswer(e.target.value)}
                placeholder="Explain the concept, reasoning, and database optimization steps."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold resize-none leading-normal"
              />
            </div>

            {qaRound === "sectionD" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Code Snippet Context</label>
                <textarea
                  rows={2}
                  value={qaCode}
                  onChange={e => setQaCode(e.target.value)}
                  placeholder="EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1;"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs resize-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Common Mistakes</label>
                <input
                  type="text"
                  value={qaMistakes}
                  onChange={e => setQaMistakes(e.target.value)}
                  placeholder="E.g. Relying on global locks"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Recruiter Expectation</label>
                <input
                  type="text"
                  value={qaExpectation}
                  onChange={e => setQaExpectation(e.target.value)}
                  placeholder="E.g. Mentions row level locks"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Follow-Up Probes (One per line)</label>
              <textarea
                rows={2}
                value={qaFollowUps}
                onChange={e => setQaFollowUps(e.target.value)}
                placeholder="What is write amplification?&#10;How does lock eviction work?"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
            >
              Add Q&A to Registry
            </button>
          </form>

          {/* Builder Registry Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-indigo-400">FAANG System Design Evaluator</h4>
                  <span className="text-[9px] text-slate-400">Preview indexed interview queries generated by administrative staff.</span>
                </div>
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-2 py-0.5 rounded uppercase">Active Simulator</span>
              </div>
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {qaList.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] font-black text-indigo-400 bg-indigo-950 border border-indigo-900 px-1.5 py-0.5 rounded uppercase">{item.round}</span>
                      {item.level && <span className="text-[8px] font-black text-amber-500 bg-amber-950 border border-amber-900 px-1.5 py-0.5 rounded uppercase">{item.level}</span>}
                      {item.tech && <span className="text-[8px] font-black text-blue-400 bg-blue-950 border border-blue-900 px-1.5 py-0.5 rounded uppercase">{item.tech}</span>}
                    </div>
                    <strong className="text-xs text-slate-200 block">Q: {item.q}</strong>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">A: {item.a}</p>
                    {item.codeSnippet && (
                      <pre className="bg-slate-950 p-2.5 rounded font-mono text-[9px] text-indigo-300 border border-slate-900 leading-normal">
                        {item.codeSnippet}
                      </pre>
                    )}
                  </div>
                ))}
                {qaList.length === 0 && (
                  <div className="py-20 text-center text-slate-500 font-black uppercase tracking-widest text-[10px]">
                    No items generated in this session. Complete builder form on the left.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: TEMPLATE PERFORMANCE ANALYTICS --- */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-fade-in text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Blueprints Compiled", val: "1,420", change: "+12.5% vs last week", color: "text-blue-600" },
              { label: "Active Project Templates", val: templates.length.toString(), change: "Primary paths covered", color: "text-indigo-600" },
              { label: "Interview Station Pass Rate", val: "87.5%", change: "+2.1% ATS match gains", color: "text-emerald-600" },
              { label: "Recruiter Referral Leads", val: "68%", change: "High engineering demand", color: "text-purple-600" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                <strong className={cn("text-3xl font-black block font-display", stat.color)}>{stat.val}</strong>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">{stat.change}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-900 font-display">Compilation Activity Telemetry</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Tuned daily project generation counts over last 7 periods.</span>
                </div>
                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg border">
                  {["Day", "Week", "Month"].map((p, pIdx) => (
                    <span key={pIdx} className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer", p === "Week" ? "bg-white shadow-sm" : "text-slate-400")}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock Chart Visualization */}
              <div className="h-64 flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { label: "Mon", val: 40, active: false },
                  { label: "Tue", val: 55, active: false },
                  { label: "Wed", val: 80, active: false },
                  { label: "Thu", val: 65, active: false },
                  { label: "Fri", val: 120, active: true },
                  { label: "Sat", val: 95, active: false },
                  { label: "Sun", val: 110, active: false }
                ].map((bar, bIdx) => (
                  <div key={bIdx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl h-48 flex items-end overflow-hidden relative shadow-inner">
                      <div 
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-1000 origin-bottom",
                          bar.active ? "bg-gradient-to-t from-indigo-500 to-indigo-650" : "bg-gradient-to-t from-slate-200 to-slate-350"
                        )}
                        style={{ height: `${(bar.val / 130) * 100}%` }}
                      />
                      <span className="absolute inset-x-0 bottom-2 text-center text-[9px] font-black text-slate-400 group-hover:text-slate-700">{bar.val}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mt-1">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popularity listings */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 font-display">Path Popularity Distribution</h4>
              <p className="text-xs text-slate-500 font-semibold">Tuned templates indexing rates based on student submissions.</p>

              <div className="space-y-4 pt-2 text-xs">
                {[
                  { label: "E-Commerce Microservices", pct: 45, color: "bg-indigo-600" },
                  { label: "Real-Time Telemetry Logs", pct: 32, color: "bg-blue-600" },
                  { label: "Decoupled Banking Systems", pct: 15, color: "bg-purple-600" },
                  { label: "Mobile Video Streaming APIs", pct: 8, color: "bg-emerald-600" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>{item.label}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility class concatenator helper
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
