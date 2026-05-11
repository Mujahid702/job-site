"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Edit", "Preview"];

export default function EditJob() {
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function fetchJob() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        setForm(data);
      }
      setLoading(false);
    }
    fetchJob();
  }, [params.id, supabase]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update(form)
      .eq("id", params.id);

    if (error) {
      alert(error.message);
      setSaving(false);
    } else {
      router.push("/admin/jobs");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Edit3 className="w-4 h-4" />
            Job Editor
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Edit Opportunity</h1>
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
                  <input name="title" onChange={handleChange} value={form.title} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Job Slug (URL)</label>
                  <input name="slug" onChange={handleChange} value={form.slug} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Company Name</label>
                  <input name="company" onChange={handleChange} value={form.company} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Location</label>
                  <input name="location" onChange={handleChange} value={form.location} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Salary Range</label>
                  <input name="salary" onChange={handleChange} value={form.salary} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Apply Link</label>
                  <input name="apply_link" onChange={handleChange} value={form.apply_link} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </section>

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
                { name: "required_skills", label: "Required Skills" },
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
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  />
                </div>
              ))}
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 sticky top-12">
               <h4 className="text-xl font-black mb-4">Action Center</h4>
               <p className="text-slate-400 mb-8 font-medium">Changes will be reflected immediately after update.</p>

               <button 
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-2"
               >
                 {saving ? "Updating..." : "Update Opportunity 💾"}
               </button>
               
               <button 
                onClick={() => router.back()}
                className="w-full mt-4 py-4 bg-white/5 text-slate-300 font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
               >
                 Discard Changes
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
