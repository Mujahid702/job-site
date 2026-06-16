"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Plus, Trash2, Search, Cpu, FileText, 
  CheckCircle2, AlertTriangle, RefreshCw, Filter, 
  Database, Info, Calendar, ArrowRight, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeDoc {
  id: string;
  title: string;
  category: "roadmap" | "interview" | "playbook" | "guide";
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function AdminKnowledgeDashboard() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"roadmap" | "interview" | "playbook" | "guide">("guide");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Detail state
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDoc | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge");
      const result = await res.json();
      if (res.ok && result.success) {
        setDocs(result.data || []);
        setError(null);
      } else {
        setError(result.message || "Failed to load knowledge base items.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching RAG indices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !category) {
      setSubmitMessage({ type: "error", text: "Title, category, and content are required." });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    const metadata: Record<string, any> = {
      ingestedAt: new Date().toISOString(),
    };
    if (source.trim()) metadata.source = source.trim();
    if (author.trim()) metadata.author = author.trim();

    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content, metadata }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setSubmitMessage({ type: "success", text: `"${title}" successfully vectorized and ingested!` });
        setTitle("");
        setContent("");
        setSource("");
        setAuthor("");
        // Refresh list
        fetchDocs();
      } else {
        setSubmitMessage({ type: "error", text: result.message || "Ingestion process encountered a model error." });
      }
    } catch (err: any) {
      setSubmitMessage({ type: "error", text: err?.message || "Connection timeout during vector calculation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from the knowledge base? This action removes its vector chunks completely.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setDocs(prev => prev.filter(d => d.id !== id));
        if (viewingDoc?.id === id) setViewingDoc(null);
      } else {
        alert(result.message || "Failed to delete document.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to request document removal.");
    }
  };

  // Filtered results
  const filteredDocs = docs.filter(doc => {
    const matchesCategory = selectedFilter === "all" || doc.category === selectedFilter;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate statistics
  const totalCount = docs.length;
  const roadmapCount = docs.filter(d => d.category === "roadmap").length;
  const interviewCount = docs.filter(d => d.category === "interview").length;
  const playbookCount = docs.filter(d => d.category === "playbook").length;
  const guideCount = docs.filter(d => d.category === "guide").length;

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest mb-2">
            <Cpu className="w-4 h-4 text-violet-500" />
            AI Placement Copilot RAG Foundation
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">RAG Knowledge Base Control</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Ingest text files, compute semantic embeddings (768 dimensions), manage document vectors, and query the search engine.
          </p>
        </div>

        <button 
          onClick={fetchDocs}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-650 cursor-pointer text-xs font-bold shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Reload Database
        </button>
      </div>

      {/* RAG statistics card grids */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Vector Collection", value: totalCount, sub: "Total documents", color: "bg-violet-600" },
          { label: "Roadmaps", value: roadmapCount, sub: "Category: 'roadmap'", color: "bg-blue-500" },
          { label: "Interview Qs", value: interviewCount, sub: "Category: 'interview'", color: "bg-emerald-500" },
          { label: "Company Playbooks", value: playbookCount, sub: "Category: 'playbook'", color: "bg-indigo-500" },
          { label: "Guides & Docs", value: guideCount, sub: "Category: 'guide'", color: "bg-amber-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] hover:border-violet-200 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={cn("w-2 h-2 rounded-full", card.color)} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Document Creator Form & Database List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Document Ingestion Creator */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-fit space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-500" />
              Ingest Document Chunk
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Calculates embeddings and indexes data for Copilot matching.</p>
          </div>

          <form onSubmit={handleIngest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Document Title</label>
              <input 
                type="text" 
                placeholder="e.g. SDE Interview Prep Guide or TCS FAQ Pack..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="guide">Placement Guide</option>
                  <option value="roadmap">Roadmap</option>
                  <option value="interview">Interview Qs</option>
                  <option value="playbook">Company Playbook</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Author (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Placement Cell"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Source (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Internal PDF, Recruitment Portal"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Content text</label>
              <textarea 
                placeholder="Paste the document text to be stored in the vector database..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none leading-relaxed"
                required
              />
            </div>

            {submitMessage && (
              <div className={cn(
                "p-4 border rounded-xl flex items-start gap-2.5 text-xs font-semibold",
                submitMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-rose-50 border-rose-100 text-rose-800"
              )}>
                {submitMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{submitMessage.text}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-violet-250 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Vectorizing document...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Ingest & Index Vector
                </>
              )}
            </button>
          </form>
        </div>

        {/* Knowledge database list */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-500" />
                Ingested Vectors
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Explore semantic nodes available for Copilot chat contexts.</p>
            </div>
            
            {/* Category Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-[10px] shrink-0 font-bold uppercase">
              {["all", "roadmap", "interview", "playbook", "guide"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                    selectedFilter === cat ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {cat === "all" ? "All" : cat === "interview" ? "Interview Qs" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title, contents, or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* List Content */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-7 h-7 text-violet-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Querying collections...</span>
              </div>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-start gap-4 hover:border-violet-200 transition-all cursor-pointer group"
                  onClick={() => setViewingDoc(doc)}
                >
                  <div className="space-y-1.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border",
                        doc.category === "roadmap" && "bg-blue-50 border-blue-100 text-blue-700",
                        doc.category === "interview" && "bg-emerald-50 border-emerald-100 text-emerald-700",
                        doc.category === "playbook" && "bg-indigo-50 border-indigo-100 text-indigo-700",
                        doc.category === "guide" && "bg-amber-50 border-amber-100 text-amber-700"
                      )}>
                        {doc.category === "interview" ? "Interview Qs" : doc.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-slate-800 truncate group-hover:text-violet-650 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">
                      {doc.content}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs border border-dashed border-slate-200 rounded-2xl">
                No matching documents stored in the database.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Document details modal panel */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start gap-4">
              <div>
                <span className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border mb-2 inline-block",
                  viewingDoc.category === "roadmap" && "bg-blue-50 border-blue-100 text-blue-700",
                  viewingDoc.category === "interview" && "bg-emerald-50 border-emerald-100 text-emerald-700",
                  viewingDoc.category === "playbook" && "bg-indigo-50 border-indigo-100 text-indigo-700",
                  viewingDoc.category === "guide" && "bg-amber-50 border-amber-100 text-amber-700"
                )}>
                  {viewingDoc.category}
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {viewingDoc.title}
                </h3>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-grow space-y-6 text-xs font-semibold text-slate-650 leading-relaxed max-h-[50vh]">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Document Content</span>
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl leading-relaxed whitespace-pre-wrap font-mono text-[11px] text-slate-800">
                  {viewingDoc.content}
                </div>
              </div>

              {viewingDoc.metadata && Object.keys(viewingDoc.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Metadata Schema</span>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(viewingDoc.metadata).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="text-slate-450 uppercase font-black text-[9px]">{key}</span>
                        <span className="font-bold text-slate-800">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-violet-500" />
                Indexed in pgvector collection (768d)
              </span>
              <button
                onClick={() => handleDelete(viewingDoc.id)}
                className="px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 font-black rounded-xl uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
