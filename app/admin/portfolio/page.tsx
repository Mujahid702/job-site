"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Settings,
  RefreshCw,
  Check,
  Save,
  XCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id?: string;
  name: string;
  theme: string;
  font_family: string;
  color_scheme: string;
  sections_config: Record<string, boolean>;
  is_active: boolean;
}

export default function AdminPortfolioStudio() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("Modern");
  const [fontFamily, setFontFamily] = useState("Poppins");
  const [colorScheme, setColorScheme] = useState("Blue");
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState<Record<string, boolean>>({
    hero: true, about: true, skills: true, projects: true,
    experience: true, achievements: true, certifications: true, contact: true
  });

  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio");
      const result = await res.json();
      if (res.ok && result.success) {
        setTemplates(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load templates.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEditClick = (tpl: Template) => {
    setCurrentId(tpl.id || null);
    setName(tpl.name);
    setTheme(tpl.theme);
    setFontFamily(tpl.font_family);
    setColorScheme(tpl.color_scheme);
    setSections(tpl.sections_config);
    setIsActive(tpl.is_active);
    setIsEditing(true);
  };

  const handleNewClick = () => {
    setCurrentId(null);
    setName("");
    setTheme("Modern");
    setFontFamily("Poppins");
    setColorScheme("Blue");
    setSections({
      hero: true, about: true, skills: true, projects: true,
      experience: true, achievements: true, certifications: true, contact: true
    });
    setIsActive(true);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        id: currentId,
        name: name.trim(),
        theme,
        font_family: fontFamily,
        color_scheme: colorScheme,
        sections_config: sections,
        is_active: isActive
      };

      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setIsEditing(false);
        await fetchTemplates();
      } else {
        alert(result.message || "Failed to save template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/portfolio?id=${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await fetchTemplates();
      } else {
        alert(result.message || "Failed to delete template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting template.");
    }
  };

  const handleToggleSection = (sec: string) => {
    setSections(prev => ({
      ...prev,
      [sec]: !prev[sec]
    }));
  };

  return (
    <div className="space-y-12 pb-20 font-sans text-left">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-650 font-black text-xs uppercase tracking-widest mb-2">
            <Globe className="w-4 h-4" />
            Theme Design Studio
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Portfolio Templates & Layouts</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Manage template palettes, customize responsive font rules, toggle page layout sections, and define branding packages.
          </p>
        </div>

        <button
          onClick={handleNewClick}
          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Add New Theme
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-violet-650 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading templates...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">Failure loading templates</h3>
          <p className="text-slate-500 text-xs font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Templates lists (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-between h-56 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/5 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <strong className="text-sm font-black text-slate-800 group-hover:text-violet-650 transition-colors block">
                          {tpl.name}
                        </strong>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">
                          Theme: {tpl.theme} • Font: {tpl.font_family}
                        </span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                        tpl.is_active
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      )}>
                        {tpl.is_active ? "Active" : "Disabled"}
                      </span>
                    </div>

                    {/* Palette indicator bubbles */}
                    <div className="flex gap-2 items-center">
                      <span className={cn(
                        "w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-white",
                        tpl.color_scheme === 'Blue' ? 'bg-blue-600' :
                        tpl.color_scheme === 'Purple' ? 'bg-purple-650' :
                        tpl.color_scheme === 'Green' ? 'bg-emerald-600' : 'bg-slate-900'
                      )} />
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">
                        {tpl.color_scheme} Palette
                      </span>
                    </div>

                    {/* Config sectors text */}
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Sections: {Object.keys(tpl.sections_config).filter(k => tpl.sections_config[k]).join(', ')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(tpl)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id || "")}
                      className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side Drawer (1 column if editing) */}
          {isEditing && (
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900 font-display">
                  {currentId ? "Edit Styling Theme" : "Create Branding Theme"}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Theme Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="e.g. Modern Glassmorphic Indigo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Base Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      {["Modern", "Glassmorphism", "Minimal", "Developer", "Startup Founder"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Font Style</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      {["Inter", "Poppins", "Roboto", "Montserrat"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Color Scheme</label>
                    <select
                      value={colorScheme}
                      onChange={(e) => setColorScheme(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      {["Blue", "Purple", "Green", "Dark"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Visibility State</label>
                    <select
                      value={isActive ? "active" : "disabled"}
                      onChange={(e) => setIsActive(e.target.value === "active")}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="disabled">Disabled (Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Section Toggle List */}
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Configure Layout Sections</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(sections).map(sec => (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => handleToggleSection(sec)}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border transition-all",
                          sections[sec]
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        )}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
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
                    className="flex-grow py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Theme</span>
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
