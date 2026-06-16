"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Rocket, 
  Eye, 
  Edit3, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Link as LinkIcon, 
  Building2,
  ChevronRight,
  CheckCircle2,
  Info,
  Globe,
  Tag,
  Search,
  Layout,
  FileText,
  Calendar as CalendarIcon,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Settings,
  Key,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Edit", "Preview"];

const CATEGORIES = ["Software", "Core", "Finance", "AI", "Marketing", "Sales", "Design", "Management"];
const JOB_TYPES = ["Full Time", "Internship", "Remote", "Hybrid", "Contract"];
const EXPERIENCE_LEVELS = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5+ Years"];

export default function NewJob() {
  const [activeTab, setActiveTab] = useState("Edit");
  const [form, setForm] = useState({
    drive_title: "",
    drive_slug: "",
    company_name: "",
    company_logo: "",
    company_website: "",
    location: "",
    job_type: "Full Time",
    experience_level: "Fresher",
    salary_range: "",
    apply_link: "",
    drive_description: "",
    eligibility_criteria: "",
    key_responsibilities: "",
    required_skills: "",
    selection_process: "",
    resume_tips: "",
    interview_questions_tips: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    category: "Software",
    tags: [] as string[],
    is_featured: false,
    is_active: true,
    expiry_date: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // AI Autopilot State
  const [autopilotOpen, setAutopilotOpen] = useState(true);
  const [rawJd, setRawJd] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [autopilotStatus, setAutopilotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setGeminiKey(savedKey);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setGeminiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", key);
    }
  };

  const checkDuplicate = async (slug: string, companyName: string) => {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("id, drive_title, company_name")
        .eq("drive_slug", slug)
        .maybeSingle();
        
      if (error) {
        console.error("Duplicate check error:", error);
        return;
      }
      
      if (data) {
        setDuplicateWarning(
          `Warning: A job posting with slug "${slug}" already exists for "${data.company_name}" (${data.drive_title}). Please update the slug to prevent overwrites or duplicate entries.`
        );
      }
    } catch (err) {
      console.error("Error in duplicate check:", err);
    }
  };

  const handleGenerateJob = async () => {
    if (!rawJd.trim()) {
      alert("Please paste a job description first.");
      return;
    }
    
    setAutopilotStatus("loading");
    setErrorMessage("");
    setDuplicateWarning(null);
    setActiveStepIndex(0);
    
    const steps = [
      "Analyzing raw job description...",
      "Extracting basic role & company details...",
      "Creating SEO slug and metadata...",
      "Generating criteria & skills...",
      "Polishing interview prep & resume tips...",
      "Structuring output into form fields..."
    ];
    
    let currentStep = 0;
    setLoadingStep(steps[0]);
    
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setActiveStepIndex(currentStep);
        setLoadingStep(steps[currentStep]);
      }
    }, 1500);
    
    try {
      const response = await fetch("/api/admin/generate-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey,
        },
        body: JSON.stringify({ rawText: rawJd }),
      });
      
      clearInterval(interval);
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData?.error?.message || "Failed to parse job description.");
      }
      
      const jobData = resData.data;
      
      // Auto-populate the form state!
      setForm({
        drive_title: jobData.drive_title || "",
        drive_slug: jobData.drive_slug || "",
        company_name: jobData.company_name || "",
        company_logo: jobData.company_logo || "",
        company_website: jobData.company_website || "",
        location: jobData.location || "",
        job_type: jobData.job_type || "Full Time",
        experience_level: jobData.experience_level || "Fresher",
        salary_range: jobData.salary_range || "",
        apply_link: jobData.apply_link || "",
        drive_description: jobData.drive_description || "",
        eligibility_criteria: jobData.eligibility_criteria || "",
        key_responsibilities: jobData.key_responsibilities || "",
        required_skills: jobData.required_skills || "",
        selection_process: jobData.selection_process || "",
        resume_tips: jobData.resume_tips || "",
        interview_questions_tips: jobData.interview_questions_tips || "",
        meta_title: jobData.meta_title || "",
        meta_description: jobData.meta_description || "",
        keywords: jobData.keywords || "",
        category: jobData.category || "Software",
        tags: Array.isArray(jobData.tags) ? jobData.tags : [],
        is_featured: false,
        is_active: true,
        expiry_date: jobData.expiry_date || "",
      });
      
      setAutopilotStatus("success");
      setAutopilotOpen(false); // Collapse on success so they see the populated fields!
      
      // Proactively check for duplicate postings!
      if (jobData.drive_slug) {
        await checkDuplicate(jobData.drive_slug, jobData.company_name);
      }
    } catch (err: any) {
      clearInterval(interval);
      setAutopilotStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during AI processing.");
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (name === "drive_slug") {
      setDuplicateWarning(null);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tagToRemove) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const jobData = { ...form };
      // Clean up empty date to prevent PostgreSQL parsing errors
      if (!jobData.expiry_date) {
        delete (jobData as any).expiry_date;
      }

      const { data, error } = await supabase
        .from("job_postings")
        .insert([jobData])
        .select();

      if (error) {
        alert(error.message || 'Failed to publish job');
        console.error('Publish error:', error);
        setLoading(false);
        return;
      }

      // Log audit action to analytics center
      await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_action",
          details: {
            actionName: "Job Published",
            actionData: {
              title: jobData.drive_title,
              company: jobData.company_name,
              category: jobData.category
            }
          }
        })
      }).catch(err => console.error("Failed to log job creation:", err));

      router.push('/admin/jobs');
    } catch (err: any) {
      console.error('Error while publishing job:', err);
      alert(err?.message || 'Error: Failed to publish job');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Rocket className="w-4 h-4" />
            Job Creator Pro
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Post New Opportunity</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === tab 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "Edit" ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Edit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            
            {/* AI Autopilot Section */}
            <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                      AI Job Autopilot
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                        Agent Mode
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      Extract structure from raw JD text automatically
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all border cursor-pointer",
                      showSettings 
                        ? "bg-indigo-600 border-indigo-400 text-white" 
                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAutopilotOpen(!autopilotOpen)}
                    className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    {autopilotOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible content */}
              {autopilotOpen && (
                <div className="mt-6 space-y-6 relative z-10 transition-all">
                  
                  {/* Settings Panel */}
                  {showSettings && (
                    <div className="p-5 bg-slate-800/50 border border-slate-700/80 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
                          <Key className="w-4 h-4" />
                          Gemini API Credentials
                        </h4>
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-black text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Get Free Key <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        To run job extraction, you can use your own Google Gemini API key. It is saved securely inside your browser's local storage and is never sent to any third-party servers.
                      </p>
                      
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => handleSaveKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="flex-1 p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold tracking-wider placeholder:text-slate-600 text-indigo-200"
                        />
                        <div className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-green-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Auto-Saved
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning banner */}
                  {duplicateWarning && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-sm flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold">Slug Conflict Detected</span>
                        <p className="text-xs opacity-90">{duplicateWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Input JD Panel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Raw Job Description (Copy-paste from careers page)</span>
                      <span className="text-[10px] lowercase text-slate-500 font-normal">Supports long JDs</span>
                    </label>
                    <textarea
                      value={rawJd}
                      onChange={(e) => setRawJd(e.target.value)}
                      placeholder="Paste your raw JD text here... Company, Role, Responsibilities, Requirements, etc."
                      rows={6}
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 placeholder:text-slate-600 text-sm font-medium resize-none transition-all"
                      disabled={autopilotStatus === "loading"}
                    />
                  </div>

                  {/* API Actions */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      {autopilotStatus === "success" && (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          Successfully filled! Review form below.
                        </div>
                      )}
                      {autopilotStatus === "error" && (
                        <div className="text-red-400 text-xs font-semibold max-w-[400px] flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {autopilotStatus === "success" && (
                        <button
                          onClick={() => {
                            setRawJd("");
                            setAutopilotStatus("idle");
                            setAutopilotOpen(true);
                          }}
                          className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-2xl transition-all border border-slate-700 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      
                      <button
                        onClick={handleGenerateJob}
                        disabled={autopilotStatus === "loading"}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-900/30 disabled:opacity-50 transition-all flex items-center gap-2 border border-indigo-400/20 active:scale-[0.98] cursor-pointer"
                      >
                        {autopilotStatus === "loading" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            <span>{autopilotStatus === "success" ? "Regenerate Content" : "Analyze & Auto-fill"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Loading step tracker */}
                  {autopilotStatus === "loading" && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Autopilot Extraction Status</span>
                        <span className="text-xs font-black text-indigo-400 animate-pulse">{loadingStep}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${(activeStepIndex + 1) * 16.6}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}
            </section>

            {/* 1. Basic Information */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Drive Title</label>
                  <input name="drive_title" onChange={handleChange} value={form.drive_title} placeholder="Software Engineer Intern" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Drive Slug (URL)</label>
                  <input name="drive_slug" onChange={handleChange} value={form.drive_slug} placeholder="ibm-software-engineer-intern-2026" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                  <input name="company_name" onChange={handleChange} value={form.company_name} placeholder="IBM India" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Logo URL</label>
                  <input name="company_logo" onChange={handleChange} value={form.company_logo} placeholder="https://logo.url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Website</label>
                  <input name="company_website" onChange={handleChange} value={form.company_website} placeholder="https://ibm.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Apply Link</label>
                  <input name="apply_link" onChange={handleChange} value={form.apply_link} placeholder="https://careers.ibm.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>
            </section>

            {/* 2. Job Details */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                Job Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</label>
                  <input name="location" onChange={handleChange} value={form.location} placeholder="Bangalore / Remote" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Salary Range</label>
                  <input name="salary_range" onChange={handleChange} value={form.salary_range} placeholder="₹6,00,000 - ₹12,00,000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Job Type</label>
                  <select name="job_type" onChange={handleChange} value={form.job_type} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none">
                    {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Experience Level</label>
                  <select name="experience_level" onChange={handleChange} value={form.experience_level} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none">
                    {EXPERIENCE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select name="category" onChange={handleChange} value={form.category} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                  <input type="date" name="expiry_date" onChange={handleChange} value={form.expiry_date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags (Press Enter)</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[64px]">
                  {form.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg flex items-center gap-2">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-200">×</button>
                    </span>
                  ))}
                  <input 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="bg-transparent outline-none flex-1 min-w-[100px] text-sm font-bold"
                  />
                </div>
              </div>
            </section>

            {/* 3. Content Sections */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                Rich Content
              </h3>

              {[
                { name: "drive_description", label: "Drive Description" },
                { name: "eligibility_criteria", label: "Eligibility Criteria" },
                { name: "key_responsibilities", label: "Key Responsibilities" },
                { name: "required_skills", label: "Required Skills" },
                { name: "selection_process", label: "Selection Process" },
                { name: "resume_tips", label: "Resume Tips" },
                { name: "interview_questions_tips", label: "Interview Questions/Tips" },
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                  <textarea 
                    name={field.name} 
                    onChange={handleChange} 
                    value={(form as any)[field.name]} 
                    rows={field.name === "drive_description" ? 6 : 4}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium" 
                  />
                </div>
              ))}
            </section>

            {/* 4. SEO & Metadata */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                SEO & Metadata
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Title</label>
                  <input name="meta_title" onChange={handleChange} value={form.meta_title} placeholder="SEO Title" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                  <textarea name="meta_description" onChange={handleChange} value={form.meta_description} placeholder="SEO Description" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Keywords (Comma separated)</label>
                  <input name="keywords" onChange={handleChange} value={form.keywords} placeholder="jobs, hiring, freshers" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 sticky top-12">
               <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                 <ShieldCheck className="w-6 h-6" />
                 Status & Visibility
               </h4>
               
               <div className="space-y-6 mb-10">
                  <label className="flex items-center justify-between p-4 bg-white/10 rounded-2xl cursor-pointer hover:bg-white/20 transition-all border border-white/10">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-300" />
                      <span className="font-bold">Featured Listing</span>
                    </div>
                    <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="w-5 h-5 accent-blue-400" />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/10 rounded-2xl cursor-pointer hover:bg-white/20 transition-all border border-white/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                      <span className="font-bold">Active Status</span>
                    </div>
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-5 h-5 accent-blue-400" />
                  </label>
               </div>

               <div className="p-6 bg-blue-700 rounded-2xl mb-10 space-y-4">
                  <h5 className="font-black text-xs uppercase tracking-widest text-blue-200">Post Information</h5>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-blue-100">Creation Date</span>
                    <span className="font-black">Today</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-blue-100">Status</span>
                    <span className="font-black uppercase tracking-widest text-green-300">New</span>
                  </div>
               </div>

               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-2"
               >
                 {loading ? "Publishing..." : "Publish Opportunity 🚀"}
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{form.category}</span>
                <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{form.job_type}</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">{form.company_name} Hiring {form.drive_title}</h2>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600 text-sm font-bold">
                    <MapPin className="w-4 h-4" /> {form.location}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl text-green-600 text-sm font-bold">
                    <DollarSign className="w-4 h-4" /> {form.salary_range}
                  </div>
              </div>
            </div>
            
            <div className="prose prose-slate max-w-none">
                <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">Overview</h3>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg">{form.drive_description}</p>
                
                <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4 mt-12">Eligibility</h3>
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg">{form.eligibility_criteria}</p>
            </div>
        </div>
      )}
    </div>
  );
}
