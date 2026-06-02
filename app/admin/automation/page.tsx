"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Sparkles,
  Link as LinkIcon,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Briefcase,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderSync,
  Share2,
  Copy,
  Globe,
  Link2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppPublisher } from "@/lib/publishers";
import PublishSuccessModal from "@/components/PublishSuccessModal";

// Job Types & Categories matching the existing DB schemas
const CATEGORIES = ["Software", "Core", "Finance", "AI", "Marketing", "Sales", "Design", "Management"];

interface ImportItem {
  id: string;
  url: string;
  status: "pending" | "scraping" | "generating" | "saving" | "success" | "failed";
  progress: number; // 0 to 100
  error?: string;
  extractedTitle?: string;
  draftId?: string;
}

export default function ContentAutomation() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "drafts" | "published" | "failed" | "whatsapp">("single");
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Publish Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState({
    jobTitle: "",
    companyName: "",
    whatsappMessage: "",
    jobUrl: ""
  });

  // WhatsApp Distribution Tab State
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | 'C'>('B');
  const [whatsappMessagePreview, setWhatsappMessagePreview] = useState("");
  const [copiedMessageTab, setCopiedMessageTab] = useState(false);
  const [copiedUrlTab, setCopiedUrlTab] = useState(false);

  // Single Import State
  const [singleUrl, setSingleUrl] = useState("");
  const [singleStatus, setSingleStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [singleProgress, setSingleProgress] = useState("");
  const [singleError, setSingleError] = useState("");
  const [singleResult, setSingleResult] = useState<any | null>(null);

  // Bulk Import State
  const [bulkUrlsText, setBulkUrlsText] = useState("");
  const [bulkQueue, setBulkQueue] = useState<ImportItem[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Queues & Lists State
  const [draftJobs, setDraftJobs] = useState<any[]>([]);
  const [publishedJobs, setPublishedJobs] = useState<any[]>([]);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);

  // Gemini API Key from LocalStorage fallback
  const [geminiKey, setGeminiKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setGeminiKey(savedKey);
    }
    fetchQueues();
  }, []);

  // Safe helper to extract WhatsApp message from database columns or JSON metadata
  const getWhatsAppMessage = (job: any): string => {
    if (job?.whatsapp_message) return job.whatsapp_message;
    try {
      if (job?.approval_status) {
        const metadata = JSON.parse(job.approval_status);
        return metadata.whatsapp_message || "";
      }
    } catch (e) {}
    return "";
  };

  // Safe helper to extract Template Used from database columns or JSON metadata
  const getTemplateUsed = (job: any): 'A' | 'B' | 'C' => {
    if (job?.template_used === 'A' || job?.template_used === 'B' || job?.template_used === 'C') {
      return job.template_used;
    }
    try {
      if (job?.approval_status) {
        const metadata = JSON.parse(job.approval_status);
        if (metadata.template_used === 'A' || metadata.template_used === 'B' || metadata.template_used === 'C') {
          return metadata.template_used;
        }
      }
    } catch (e) {}
    return 'B'; // default
  };

  // Pre-populate template selection when a job is selected
  useEffect(() => {
    if (!selectedJobId) return;
    const job = publishedJobs.find(j => j.id === selectedJobId) || draftJobs.find(j => j.id === selectedJobId);
    if (!job) return;
    
    setSelectedTemplate(getTemplateUsed(job));
  }, [selectedJobId, publishedJobs, draftJobs]);

  // Trigger real-time template generation when selected job or template changes
  useEffect(() => {
    if (!selectedJobId) {
      setWhatsappMessagePreview("");
      return;
    }
    const job = publishedJobs.find(j => j.id === selectedJobId) || draftJobs.find(j => j.id === selectedJobId);
    if (!job) return;

    const publisher = new WhatsAppPublisher();
    const siteUrl = typeof window !== "undefined"
      ? `${window.location.origin}/jobs/${job.drive_slug}`
      : `https://mywebsite.com/jobs/${job.drive_slug}`;

    const message = publisher.generate(job, {
      websiteUrl: siteUrl,
      templateId: selectedTemplate
    });
    setWhatsappMessagePreview(message);
  }, [selectedJobId, selectedTemplate, publishedJobs, draftJobs]);

  // If a job is selected for the first time, auto-select it
  useEffect(() => {
    if (activeTab === "whatsapp" && !selectedJobId && publishedJobs.length > 0) {
      setSelectedJobId(publishedJobs[0].id);
    }
  }, [activeTab, publishedJobs, selectedJobId]);

  const formatWhatsAppText = (text: string) => {
    if (!text) return "";
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
    return escaped.replace(/\n/g, "<br />");
  };

  // Fetch Jobs from Supabase and classify into Draft, Published, Failed queues
  const fetchQueues = async () => {
    setLoadingQueues(true);
    try {
      const { data: jobs, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (jobs) {
        const drafts: any[] = [];
        const published: any[] = [];
        const failed: any[] = [];

        jobs.forEach(job => {
          let metadata: any = {};
          try {
            if (job.approval_status) {
              metadata = JSON.parse(job.approval_status);
            }
          } catch (e) {
            // standard text
          }

          if (metadata.status === "failed" || job.drive_title.startsWith("Failed Import:")) {
            failed.push(job);
          } else if (job.is_active) {
            published.push(job);
          } else {
            drafts.push(job);
          }
        });

        setDraftJobs(drafts);
        setPublishedJobs(published);
        setFailedJobs(failed);
      }
    } catch (err) {
      console.error("Error fetching queues:", err);
    } finally {
      setLoadingQueues(false);
    }
  };

  // One-click Publish
  const handlePublishNow = async (id: string, currentJob: any) => {
    try {
      let parsedStatus: any = {};
      try {
        if (currentJob.approval_status) {
          parsedStatus = JSON.parse(currentJob.approval_status);
        }
      } catch (e) {}

      // Generate WhatsApp copy for modal & database storage
      const publisher = new WhatsAppPublisher();
      const siteUrl = typeof window !== "undefined"
        ? `${window.location.origin}/jobs/${currentJob.drive_slug}`
        : `https://mywebsite.com/jobs/${currentJob.drive_slug}`;

      const generatedMessage = publisher.generate(currentJob, {
        websiteUrl: siteUrl,
        templateId: "B" // Default Template
      });

      const updatedStatus = {
        ...parsedStatus,
        status: "published",
        publish_date: new Date().toISOString(),
        last_updated_date: new Date().toISOString(),
        whatsapp_message: generatedMessage,
        template_used: "B",
        whatsapp_generated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("job_postings")
        .update({
          is_active: true,
          approval_status: JSON.stringify(updatedStatus),
          posted_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", id);

      if (error) throw error;
      await fetchQueues();

      // Show WhatsApp Success Modal
      setSuccessModalData({
        jobTitle: currentJob.drive_title,
        companyName: currentJob.company_name,
        whatsappMessage: generatedMessage,
        jobUrl: siteUrl
      });
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert("Failed to publish: " + err.message);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCopyMessageFromTab = async (job: any) => {
    if (!whatsappMessagePreview) return;
    try {
      // 1. Copy to clipboard
      await navigator.clipboard.writeText(whatsappMessagePreview);
      setCopiedMessageTab(true);
      setTimeout(() => setCopiedMessageTab(false), 2000);

      // 2. Save/Sync to Supabase inside approval_status to prevent schema cache errors
      let parsedStatus: any = {};
      try {
        if (job.approval_status) {
          parsedStatus = JSON.parse(job.approval_status);
        }
      } catch (e) {}

      const updatedStatus = {
        ...parsedStatus,
        whatsapp_message: whatsappMessagePreview,
        template_used: selectedTemplate,
        whatsapp_generated_at: new Date().toISOString()
      };

      await supabase
        .from("job_postings")
        .update({
          approval_status: JSON.stringify(updatedStatus)
        })
        .eq("id", job.id);
        
      // Refresh queues to keep lists in sync
      await fetchQueues();
    } catch (err) {
      console.error("Failed to copy/save message:", err);
    }
  };

  // Revert Job to Draft
  const handleRevertToDraft = async (id: string, currentJob: any) => {
    try {
      let parsedStatus: any = {};
      try {
        if (currentJob.approval_status) {
          parsedStatus = JSON.parse(currentJob.approval_status);
        }
      } catch (e) {}

      const updatedStatus = {
        ...parsedStatus,
        status: "draft",
        publish_date: null,
        last_updated_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from("job_postings")
        .update({
          is_active: false,
          approval_status: JSON.stringify(updatedStatus)
        })
        .eq("id", id);

      if (error) throw error;
      await fetchQueues();
    } catch (err: any) {
      alert("Failed to revert to draft: " + err.message);
    }
  };

  // Delete Job Posting
  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job draft or posting permanently?")) {
      return;
    }
    try {
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchQueues();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  // Process a single URL end-to-end
  const processUrl = async (
    url: string,
    onProgress: (step: "scraping" | "generating" | "saving" | "success" | "failed", msg?: string, data?: any) => void
  ) => {
    try {
      // Step 1: Scrape
      onProgress("scraping", "Scraping raw page content...");
      const scrapeRes = await fetch("/api/admin/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        let errMsg = "Scraping failed";
        try {
          const err = await scrapeRes.json();
          errMsg = err.error || errMsg;
        } catch (_) {
          try {
            const html = await scrapeRes.text();
            const match = html.match(/<title>([^<]+)<\/title>/i);
            const pageTitle = match ? match[1].trim() : "";
            errMsg = `Scraping failed (HTTP ${scrapeRes.status})${pageTitle ? `: ${pageTitle}` : ""}`;
          } catch (_) {
            errMsg = `Scraping failed (HTTP ${scrapeRes.status})`;
          }
        }
        throw new Error(errMsg);
      }

      let scrapeData;
      try {
        scrapeData = await scrapeRes.json();
      } catch (e) {
        throw new Error(`Scraper API returned invalid response (HTTP ${scrapeRes.status})`);
      }

      // Step 2: AI Generation
      onProgress("generating", "AI extracting and generating rich SEO content...");
      const genRes = await fetch("/api/admin/generate-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey,
        },
        body: JSON.stringify({
          rawText: scrapeData.text,
          sourceUrl: url,
        }),
      });

      if (!genRes.ok) {
        let errMsg = "AI Extraction failed";
        try {
          const err = await genRes.json();
          errMsg = err.error?.message || err.error || errMsg;
        } catch (_) {
          try {
            const html = await genRes.text();
            const match = html.match(/<title>([^<]+)<\/title>/i);
            const pageTitle = match ? match[1].trim() : "";
            errMsg = `AI Extraction failed (HTTP ${genRes.status})${pageTitle ? `: ${pageTitle}` : ""}`;
          } catch (_) {
            errMsg = `AI Extraction failed (HTTP ${genRes.status})`;
          }
        }
        throw new Error(errMsg);
      }

      let genData;
      try {
        genData = await genRes.json();
      } catch (e) {
        throw new Error(`AI Generation API returned invalid response (HTTP ${genRes.status})`);
      }
      const jobObject = genData.data;

      // Step 3: Save to Supabase
      onProgress("saving", "Creating database draft...");
      
      // Clean up date to prevent Postgres errors
      if (!jobObject.expiry_date) {
        delete jobObject.expiry_date;
      }

      const { data, error: dbError } = await supabase
        .from("job_postings")
        .insert([jobObject])
        .select();

      if (dbError) throw dbError;

      onProgress("success", "Successfully imported as draft!", data?.[0]);
      return data?.[0];
    } catch (err: any) {
      console.error(`Import Error for ${url}:`, err);
      onProgress("failed", err.message || "Unknown error occurred");
      throw err;
    }
  };

  // Single URL Import Trigger
  const handleSingleImport = async () => {
    if (!singleUrl.trim() || !singleUrl.startsWith("http")) {
      alert("Please paste a valid career page URL.");
      return;
    }

    setSingleStatus("loading");
    setSingleError("");
    setSingleResult(null);

    try {
      const draft = await processUrl(singleUrl, (step, msg, data) => {
        setSingleProgress(msg || "");
        if (step === "success") {
          setSingleStatus("success");
          setSingleResult(data);
        } else if (step === "failed") {
          setSingleStatus("error");
          setSingleError(msg || "Extraction failed");
        }
      });
      await fetchQueues();
    } catch (err: any) {
      // Managed in callback
    }
  };

  // Bulk Ingestion Trigger
  const handleBulkImport = async () => {
    const urls = bulkUrlsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.startsWith("http"));

    if (urls.length === 0) {
      alert("Please enter at least one valid HTTP/HTTPS URL (one per line).");
      return;
    }

    // Set up bulk queue items
    const items: ImportItem[] = urls.map((url, i) => ({
      id: `${Date.now()}-${i}`,
      url,
      status: "pending",
      progress: 0,
    }));

    setBulkQueue(items);
    setBulkUrlsText("");
    setIsProcessingBulk(true);

    // Process URLs sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Update item status to Scraping
      updateBulkItem(item.id, { status: "scraping", progress: 20 });

      try {
        await processUrl(item.url, (step, msg, data) => {
          if (step === "scraping") {
            updateBulkItem(item.id, { status: "scraping", progress: 30 });
          } else if (step === "generating") {
            updateBulkItem(item.id, { status: "generating", progress: 60 });
          } else if (step === "saving") {
            updateBulkItem(item.id, { status: "saving", progress: 85 });
          } else if (step === "success") {
            updateBulkItem(item.id, {
              status: "success",
              progress: 100,
              extractedTitle: `${data.company_name} - ${data.drive_title}`,
              draftId: data.id,
            });
          } else if (step === "failed") {
            // Handle DB persistence of failures
            saveFailedRecord(item.url, msg || "Unknown extraction error");
            updateBulkItem(item.id, { status: "failed", progress: 100, error: msg });
          }
        });
      } catch (err: any) {
        // Already handled in callback
      }
    }

    setIsProcessingBulk(false);
    await fetchQueues();
  };

  const updateBulkItem = (id: string, updates: Partial<ImportItem>) => {
    setBulkQueue(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Persistence of Failed Scrapes inside job_postings as a tracked failed record
  const saveFailedRecord = async (url: string, errorMsg: string) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      const companyName = domain.split('.')[0].toUpperCase();
      
      const failedJob = {
        drive_title: `Failed Import: ${url.substring(0, 50)}...`,
        drive_slug: `failed-import-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        company_name: companyName || "Unknown",
        company_logo: `https://logo.clearbit.com/${domain}`,
        apply_link: url,
        location: "Scrape Failed",
        job_type: "Full Time",
        experience_level: "Fresher",
        is_active: false,
        is_featured: false,
        drive_description: `Scrape error occurred: ${errorMsg}`,
        approval_status: JSON.stringify({
          status: "failed",
          source_url: url,
          error: errorMsg,
          extraction_date: new Date().toISOString()
        })
      };

      await supabase.from("job_postings").insert([failedJob]);
    } catch (e) {
      console.error("Failed to persist scrape failure in DB", e);
    }
  };

  // Bulk Retry Single Item
  const handleRetryBulkItem = async (id: string, url: string) => {
    updateBulkItem(id, { status: "scraping", progress: 15, error: undefined });
    try {
      await processUrl(url, (step, msg, data) => {
        if (step === "scraping") {
          updateBulkItem(id, { status: "scraping", progress: 35 });
        } else if (step === "generating") {
          updateBulkItem(id, { status: "generating", progress: 65 });
        } else if (step === "saving") {
          updateBulkItem(id, { status: "saving", progress: 85 });
        } else if (step === "success") {
          updateBulkItem(id, {
            status: "success",
            progress: 100,
            extractedTitle: `${data.company_name} - ${data.drive_title}`,
            draftId: data.id,
          });
        } else if (step === "failed") {
          updateBulkItem(id, { status: "failed", progress: 100, error: msg });
        }
      });
      await fetchQueues();
    } catch (e) {}
  };

  const getSourceUrl = (job: any): string => {
    try {
      if (job.approval_status) {
        const metadata = JSON.parse(job.approval_status);
        return metadata.source_url || job.apply_link || "";
      }
    } catch (e) {}
    return job.apply_link || "";
  };

  const getExtractionDate = (job: any): string => {
    try {
      if (job.approval_status) {
        const metadata = JSON.parse(job.approval_status);
        if (metadata.extraction_date) {
          return new Date(metadata.extraction_date).toLocaleString();
        }
      }
    } catch (e) {}
    return new Date(job.created_at).toLocaleString();
  };

  const getFailedReason = (job: any): string => {
    try {
      if (job.approval_status) {
        const metadata = JSON.parse(job.approval_status);
        return metadata.error || "Scrape or API error";
      }
    } catch (e) {}
    return job.drive_description || "Unknown scrape error";
  };

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 fill-indigo-100" />
            AI Content Ingestion Engine
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Content Automation</h1>
          <p className="text-slate-500 mt-2">Scrape job details from career pages, auto-generate SEO copy, and manage your editorial drafts.</p>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveTab("drafts")}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 shadow-sm flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Draft Queue</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{draftJobs.length} Drafts</h4>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>

        <div 
          onClick={() => setActiveTab("published")}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 shadow-sm flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Listings</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{publishedJobs.length} Live</h4>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>

        <div 
          onClick={() => setActiveTab("failed")}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 shadow-sm flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Failed Imports</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{failedJobs.length} Failed</h4>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("single")}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "single"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <LinkIcon className="w-4 h-4" />
          URL Importer
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "bulk"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Layers className="w-4 h-4" />
          Bulk Ingestor
        </button>
        <button
          onClick={() => { setActiveTab("drafts"); fetchQueues(); }}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "drafts"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Clock className="w-4 h-4" />
          Draft Queue ({draftJobs.length})
        </button>
        <button
          onClick={() => { setActiveTab("published"); fetchQueues(); }}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "published"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          Publish Queue ({publishedJobs.length})
        </button>
        <button
          onClick={() => { setActiveTab("failed"); fetchQueues(); }}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "failed"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Failed Logs ({failedJobs.length})
        </button>
        <button
          onClick={() => { setActiveTab("whatsapp"); fetchQueues(); }}
          className={cn(
            "px-6 py-3.5 font-black text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "whatsapp"
              ? "border-green-600 text-green-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Share2 className="w-4 h-4" />
          WhatsApp Distribution
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-8">
        
        {/* TAB 1: Single URL Importer */}
        {activeTab === "single" && (
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-indigo-600 animate-bounce" />
                Import Job From URL
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                Paste any external job description URL (TCS Careers, IBM Hiring, Greenhouse, Lever, etc.). Our system will automatically scrape, reuse established company knowledge, generate SEO sections, auto-tag, and draft the opportunity.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="url"
                value={singleUrl}
                onChange={e => setSingleUrl(e.target.value)}
                placeholder="https://careers.ibm.com/job/12345/associate-system-engineer/"
                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                disabled={singleStatus === "loading"}
              />
              <button
                onClick={handleSingleImport}
                disabled={singleStatus === "loading" || !singleUrl.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-200"
              >
                {singleStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>AI Ingest Job</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Feedback */}
            {singleStatus === "loading" && (
              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4 text-indigo-800 animate-pulse font-medium">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <div className="space-y-1">
                  <p className="font-bold">Processing Ingestion...</p>
                  <p className="text-xs text-indigo-600 font-semibold">{singleProgress}</p>
                </div>
              </div>
            )}

            {singleStatus === "error" && (
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4 text-red-800">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Extraction Failure</p>
                  <p className="text-sm mt-1">{singleError}</p>
                </div>
              </div>
            )}

            {singleStatus === "success" && singleResult && (
              <div className="p-8 bg-green-50/50 rounded-3xl border border-green-100 space-y-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                  <div>
                    <h4 className="text-lg font-black leading-tight">Draft Saved Successfully!</h4>
                    <p className="text-xs font-semibold text-green-600">Saved to Draft Queue. Nothing is live automatically.</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-green-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {singleResult.company_logo && (
                      <img src={singleResult.company_logo} alt="Company" className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1" />
                    )}
                    <div>
                      <h5 className="font-black text-slate-800 text-lg leading-tight">{singleResult.drive_title}</h5>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{singleResult.company_name} • {singleResult.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a 
                      href={`/admin/edit/${singleResult.id}`} 
                      className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Review & Edit
                    </a>
                    <button 
                      onClick={() => handlePublishNow(singleResult.id, singleResult)}
                      className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-blue-200 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Publish Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Bulk Importer */}
        {activeTab === "bulk" && (
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-600" />
                Bulk Ingest Mode
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                Paste up to **10-20 job page URLs** (one URL per line). The system will queue, scrape, generate rich SEO pages, auto-tag, and cache drafts sequentially without blocking your interface.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={bulkUrlsText}
                onChange={e => setBulkUrlsText(e.target.value)}
                placeholder="https://careers.google.com/jobs/results/12345/&#10;https://careers.ibm.com/job/67890/&#10;https://tcs.com/careers/99912/"
                rows={8}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 resize-none leading-relaxed"
                disabled={isProcessingBulk}
              />
              <button
                onClick={handleBulkImport}
                disabled={isProcessingBulk || !bulkUrlsText.trim()}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-slate-300"
              >
                {isProcessingBulk ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Ingest Queue...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white text-white" />
                    <span>Process Queue</span>
                  </>
                )}
              </button>
            </div>

            {/* Queue Item Progress Panel */}
            {bulkQueue.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Ingestion Queue ({bulkQueue.length} jobs)</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {bulkQueue.map(item => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between md:items-center gap-4",
                        item.status === "success" && "bg-green-50/20 border-green-100",
                        item.status === "failed" && "bg-red-50/20 border-red-100",
                        item.status !== "success" && item.status !== "failed" && "bg-slate-50/50 border-slate-200"
                      )}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0",
                            item.status === "pending" && "bg-slate-100 text-slate-500",
                            item.status === "scraping" && "bg-blue-50 text-blue-600 animate-pulse",
                            item.status === "generating" && "bg-purple-50 text-purple-600 animate-pulse",
                            item.status === "saving" && "bg-indigo-50 text-indigo-600 animate-pulse",
                            item.status === "success" && "bg-green-100 text-green-800",
                            item.status === "failed" && "bg-red-100 text-red-800"
                          )}>
                            {item.status}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate block max-w-sm" title={item.url}>
                            {item.url}
                          </span>
                        </div>

                        {item.status !== "success" && item.status !== "failed" && item.status !== "pending" && (
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}

                        {item.status === "success" && (
                          <p className="text-xs font-black text-green-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Extracted: {item.extractedTitle}
                          </p>
                        )}

                        {item.status === "failed" && (
                          <p className="text-xs font-semibold text-red-600 flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            Error: {item.error}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === "success" && item.draftId && (
                          <>
                            <a 
                              href={`/admin/edit/${item.draftId}`} 
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="Edit Draft"
                            >
                              <Edit2 className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={async () => {
                                if (item.draftId) {
                                  const { data } = await supabase.from("job_postings").select("*").eq("id", item.draftId).single();
                                  if (data) handlePublishNow(item.draftId, data);
                                }
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-green-100 cursor-pointer"
                            >
                              Publish
                            </button>
                          </>
                        )}

                        {item.status === "failed" && (
                          <button
                            onClick={() => handleRetryBulkItem(item.id, item.url)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Draft Queue */}
        {activeTab === "drafts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Draft Opportunities</h3>
                <p className="text-xs text-slate-500 mt-1">Review AI-generated details, edit descriptions or tags, and publish listings live.</p>
              </div>
              <button 
                onClick={fetchQueues}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Sync Queues"
              >
                <FolderSync className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Opportunity</th>
                      <th className="px-8 py-5">Extracted Date</th>
                      <th className="px-8 py-5">Source Link</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Briefcase className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.drive_title}</p>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{job.company_name} • {job.location || 'Remote'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-600 font-bold whitespace-nowrap">
                          {getExtractionDate(job)}
                        </td>
                        <td className="px-8 py-6">
                          {getSourceUrl(job) ? (
                            <a 
                              href={getSourceUrl(job)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-blue-500 font-bold hover:underline inline-flex items-center gap-1.5 max-w-[200px] truncate"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Source Careers Page
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Not Tracked</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <a 
                              href={`/admin/edit/${job.id}`} 
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="Edit Posting"
                            >
                              <Edit2 className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={() => handlePublishNow(job.id, job)}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Publish
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete Posting"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {draftJobs.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white">
                  No draft opportunities found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Publish Queue */}
        {activeTab === "published" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Live Opportunities</h3>
              <p className="text-xs text-slate-500 mt-1">Review active job listings that are currently visible to all public graduates.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Opportunity</th>
                      <th className="px-8 py-5">Extracted Date</th>
                      <th className="px-8 py-5">Analytics</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publishedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Briefcase className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.drive_title}</p>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{job.company_name} • {job.location || 'Remote'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-600 font-bold whitespace-nowrap">
                          {getExtractionDate(job)}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex gap-4 text-xs font-bold text-slate-600">
                            <span>{job.views_count || 0} Views</span>
                            <span>•</span>
                            <span>{job.applications_count || 0} Clicks</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <a 
                              href={`/jobs/${job.drive_slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="View Live"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            <a 
                              href={`/admin/edit/${job.id}`} 
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="Edit Posting"
                            >
                              <Edit2 className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={() => handleRevertToDraft(job.id, job)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Revert to Draft
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete Posting"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {publishedJobs.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white">
                  No published opportunities found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Failed Logs */}
        {activeTab === "failed" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Failed Ingestions</h3>
              <p className="text-xs text-slate-500 mt-1">Review URL scraping and parsing failures, verify target links, and retry them.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Source URL</th>
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">Failure Reason</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {failedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <a 
                            href={getSourceUrl(job)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-500 font-bold hover:underline max-w-[280px] truncate block"
                          >
                            {getSourceUrl(job)}
                          </a>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-600 font-bold whitespace-nowrap">
                          {getExtractionDate(job)}
                        </td>
                        <td className="px-8 py-6 text-xs text-red-500 font-semibold max-w-[300px]">
                          {getFailedReason(job)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                const url = getSourceUrl(job);
                                if (url) {
                                  setSingleUrl(url);
                                  setActiveTab("single");
                                  handleSingleImport();
                                  // delete old failed record
                                  await supabase.from("job_postings").delete().eq("id", job.id);
                                }
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Retry Ingest
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Dismiss Error Log"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {failedJobs.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white">
                  No failed ingestion logs found. Perfect health!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: WhatsApp Distribution Tab */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">WhatsApp Broadcast Distribution</h3>
                <p className="text-xs text-slate-500 mt-1">Select any published listing, choose your promotion template format, and preview or copy it instantly.</p>
              </div>
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                Semi-Automated Workflow Active
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Job Selection & Template Tuning */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                  {/* Select Opportunity Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">
                      1. Select Opportunity
                    </label>
                    {publishedJobs.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500 text-center">
                        No active live opportunities found. Publish a draft first!
                      </div>
                    ) : (
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800 text-sm appearance-none select-custom"
                      >
                        {publishedJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.company_name} — {job.drive_title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Select Broadcast Template */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">
                      2. Choose Promotion Format
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'A', name: 'Template A: Short & Punchy', desc: 'Saves vertical height, focuses purely on essentials.' },
                        { id: 'B', name: 'Template B: Detailed & Modern (Default)', desc: 'Branded layout featuring comprehensive steps and callouts.' },
                        { id: 'C', name: 'Template C: High Engagement', desc: 'Focuses on drive scope and includes a custom overview paragraph.' }
                      ].map((tpl) => (
                        <label 
                          key={tpl.id}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                            selectedTemplate === tpl.id 
                              ? "bg-green-50/50 border-green-200 text-green-900" 
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <input 
                            type="radio" 
                            name="whatsapp_template"
                            checked={selectedTemplate === tpl.id}
                            onChange={() => setSelectedTemplate(tpl.id as 'A' | 'B' | 'C')}
                            className="mt-1 accent-green-600 shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-xs block">{tpl.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 leading-relaxed">{tpl.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Database Synchronization Status Box */}
                {selectedJobId && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <FolderSync className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-800">Database Sync Status</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Copying the message from this panel will automatically update the database record (`whatsapp_message` and `template_used`) to keep your channels highly tracked and unified.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: WhatsApp Live View Phone Preview */}
              <div className="lg:col-span-7">
                {selectedJobId ? (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-md flex flex-col bg-white">
                      {/* Mockup WhatsApp Top Bar */}
                      <div className="bg-[#075e54] text-white px-6 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-black select-none">
                            {publishedJobs.find(j => j.id === selectedJobId)?.company_name?.substring(0, 2).toUpperCase() || 'JD'}
                          </div>
                          <div>
                            <h5 className="font-black text-sm tracking-tight">Placement Drives & Jobs</h5>
                            <p className="text-[10px] text-emerald-100 opacity-90 font-semibold">Channel Broadcast</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-100 font-semibold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Broadcast Live</span>
                        </div>
                      </div>

                      {/* Mockup WhatsApp Chat Field */}
                      <div className="p-6 bg-[#efeae2] min-h-[300px] max-h-[#420px] overflow-y-auto relative flex flex-col">
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                        
                        {/* Light Green Speech Bubble */}
                        <div className="bg-[#d9fdd3] text-[#111b21] max-w-[85%] rounded-2xl rounded-tl-none p-5 shadow-sm text-xs md:text-sm font-normal leading-relaxed relative self-start z-10">
                          <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-[#d9fdd3] border-r-[#d9fdd3]" />
                          <p 
                            className="whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ __html: formatWhatsAppText(whatsappMessagePreview) }}
                          />
                          <span className="text-[9px] text-slate-400 font-semibold float-right mt-2 ml-4">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Control Panel Buttons */}
                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 shrink-0 justify-between items-center">
                        <div className="flex flex-wrap gap-3">
                          {/* Copy Message Action */}
                          <button
                            onClick={() => {
                              const job = publishedJobs.find(j => j.id === selectedJobId) || draftJobs.find(j => j.id === selectedJobId);
                              if (job) handleCopyMessageFromTab(job);
                            }}
                            className={cn(
                              "py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-md cursor-pointer",
                              copiedMessageTab 
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100" 
                                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
                            )}
                          >
                            {copiedMessageTab ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Copied Message!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Message</span>
                              </>
                            )}
                          </button>

                          {/* Copy Job URL Action */}
                          <button
                            onClick={async () => {
                              const job = publishedJobs.find(j => j.id === selectedJobId) || draftJobs.find(j => j.id === selectedJobId);
                              if (job) {
                                const url = `${window.location.origin}/jobs/${job.drive_slug}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  setCopiedUrlTab(true);
                                  setTimeout(() => setCopiedUrlTab(false), 2000);
                                } catch (err) {
                                  console.error("Failed to copy URL:", err);
                                }
                              }
                            }}
                            className={cn(
                              "py-3.5 px-5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer",
                              copiedUrlTab 
                                ? "bg-green-50 border-green-200 text-green-700" 
                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                            )}
                          >
                            {copiedUrlTab ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Copied URL!</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-4 h-4" />
                                <span>Copy Job URL</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* View Live Link */}
                        <a
                          href={`/jobs/${publishedJobs.find(j => j.id === selectedJobId)?.drive_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3.5 px-5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-black text-xs text-slate-700 hover:text-slate-800 uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Page</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white shadow-sm">
                    <Share2 className="w-12 h-12 text-slate-300 animate-bounce mb-3" />
                    <p className="font-extrabold text-sm text-slate-500 uppercase tracking-wider">No Active Selection</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed max-w-xs">
                      Publish a draft or select an active opportunity in the left menu to preview or format it for WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Broadcast Copy Modal Overlay */}
      <PublishSuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        jobTitle={successModalData.jobTitle}
        companyName={successModalData.companyName}
        whatsappMessage={successModalData.whatsappMessage}
        jobUrl={successModalData.jobUrl}
      />

    </div>
  );
}
