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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Edit", "Preview"];

export default function NewJob() {
  const [activeTab, setActiveTab] = useState("Edit");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    company: "",
    salary: "",
    location: "",
    description: "",
    eligibility: "",
    responsibilities: "",
    required_skills: "",
    selection_process: "",
    resume_tips: "",
    interview_tips: "",
    apply_link: "",
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from("jobs").insert([form]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/admin/jobs");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Rocket className="w-4 h-4" />
            Job Creator
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
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Details */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                Primary Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Job Title</label>
                  <input name="title" onChange={handleChange} value={form.title} placeholder="Software Engineer Intern" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Job Slug (URL)</label>
                  <input name="slug" onChange={handleChange} value={form.slug} placeholder="ibm-software-engineer-intern-2026" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Company Name</label>
                  <input name="company" onChange={handleChange} value={form.company} placeholder="IBM India" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Location</label>
                  <input name="location" onChange={handleChange} value={form.location} placeholder="Bangalore / Remote" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Salary Range</label>
                  <input name="salary" onChange={handleChange} value={form.salary} placeholder="₹6,00,000 - ₹12,00,000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Apply Link</label>
                  <input name="apply_link" onChange={handleChange} value={form.apply_link} placeholder="https://careers.ibm.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </section>

            {/* Content Sections */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                Job Content
              </h3>

              {[
                { name: "description", label: "Job Description" },
                { name: "eligibility", label: "Eligibility Criteria" },
                { name: "responsibilities", label: "Key Responsibilities" },
                { name: "required_skills", label: "Required Skills (Comma separated)" },
                { name: "selection_process", label: "Selection Process" },
                { name: "resume_tips", label: "Resume Tips" },
                { name: "interview_tips", label: "Interview Questions/Tips" },
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">{field.label}</label>
                  <textarea 
                    name={field.name} 
                    onChange={handleChange} 
                    value={(form as any)[field.name]} 
                    rows={field.name === "description" ? 6 : 4}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  />
                </div>
              ))}
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 sticky top-12">
               <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                 <Info className="w-6 h-6" />
                 Publishing Guide
               </h4>
               <ul className="space-y-4 text-blue-100 font-medium">
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                    Ensure the slug is unique and SEO-friendly.
                 </li>
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                    Use clear formatting for descriptions.
                 </li>
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                    Mention salary clearly to increase clicks.
                 </li>
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                    Always test the apply link before publishing.
                 </li>
               </ul>

               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-10 py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-2"
               >
                 {loading ? "Publishing..." : "Publish Opportunity 🚀"}
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
           {/* Simple Preview */}
           <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900">{form.company} Hiring {form.title}</h2>
                <div className="flex gap-4">
                   <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold">{form.salary}</span>
                   <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">{form.location}</span>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none">
                 <h3 className="text-2xl font-bold">Overview</h3>
                 <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{form.description}</p>
                 
                 <h3 className="text-2xl font-bold mt-10">Eligibility</h3>
                 <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{form.eligibility}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
