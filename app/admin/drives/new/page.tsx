"use client";

import { useState } from "react";
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
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Edit", "Preview"];

const CATEGORIES = ["Software", "Core", "Finance", "AI", "Marketing", "Sales", "Design", "Management"];
const JOB_TYPES = ["Full Time", "Internship", "Remote", "Hybrid", "Contract"];
const EXPERIENCE_LEVELS = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5+ Years"];

export default function NewDrive() {
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

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
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
    // Use the job_postings table as per the new schema
    const { error } = await supabase.from("job_postings").insert([form]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/admin/jobs");
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Rocket className="w-4 h-4" />
            Drive Creator Pro
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Post New Recruitment Drive</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === tab 
                  ? "bg-white text-indigo-600 shadow-sm" 
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
            
            {/* 1. Basic Information */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Drive Title</label>
                  <input name="drive_title" onChange={handleChange} value={form.drive_title} placeholder="Software Engineer Off-Campus Drive" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Drive Slug (URL)</label>
                  <input name="drive_slug" onChange={handleChange} value={form.drive_slug} placeholder="ibm-off-campus-drive-2026" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                  <input name="company_name" onChange={handleChange} value={form.company_name} placeholder="IBM India" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Logo URL</label>
                  <input name="company_logo" onChange={handleChange} value={form.company_logo} placeholder="https://logo.url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Website</label>
                  <input name="company_website" onChange={handleChange} value={form.company_website} placeholder="https://ibm.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Apply Link</label>
                  <input name="apply_link" onChange={handleChange} value={form.apply_link} placeholder="https://careers.ibm.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
              </div>
            </section>

            {/* 2. Drive Details */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                Drive Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</label>
                  <input name="location" onChange={handleChange} value={form.location} placeholder="Bangalore / Remote" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Salary Range</label>
                  <input name="salary_range" onChange={handleChange} value={form.salary_range} placeholder="₹6,00,000 - ₹12,00,000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Job Type</label>
                  <select name="job_type" onChange={handleChange} value={form.job_type} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none">
                    {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Experience Level</label>
                  <select name="experience_level" onChange={handleChange} value={form.experience_level} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none">
                    {EXPERIENCE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select name="category" onChange={handleChange} value={form.category} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                  <input type="date" name="expiry_date" onChange={handleChange} value={form.expiry_date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags (Press Enter)</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[64px]">
                  {form.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg flex items-center gap-2">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-200">×</button>
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
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-medium" 
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
                  <input name="meta_title" onChange={handleChange} value={form.meta_title} placeholder="SEO Title" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                  <textarea name="meta_description" onChange={handleChange} value={form.meta_description} placeholder="SEO Description" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Keywords (Comma separated)</label>
                  <input name="keywords" onChange={handleChange} value={form.keywords} placeholder="jobs, hiring, freshers" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 sticky top-12">
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
                    <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="w-5 h-5 accent-indigo-400" />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/10 rounded-2xl cursor-pointer hover:bg-white/20 transition-all border border-white/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                      <span className="font-bold">Active Status</span>
                    </div>
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-5 h-5 accent-indigo-400" />
                  </label>
               </div>

               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-900/20 flex items-center justify-center gap-2"
               >
                 {loading ? "Publishing..." : "Publish Drive 🚀"}
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{form.category}</span>
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
