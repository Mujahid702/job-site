"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Eye, 
  Share2, 
  X,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  whatsappMessage: string;
  jobUrl: string;
}

export default function PublishSuccessModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  whatsappMessage,
  jobUrl
}: PublishSuccessModalProps) {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  // Safe formatter to display WhatsApp formatting in HTML
  const formatWhatsAppText = (text: string) => {
    if (!text) return "";
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // *bold* -> <strong>bold</strong>
    escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    
    // _italics_ -> <em>italics</em>
    escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
    
    // \n -> <br />
    return escaped.replace(/\n/g, "<br />");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Job Published Successfully!</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {companyName} • {jobTitle} is now live
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          {/* Action Callout */}
          <div className="bg-indigo-600/5 border border-indigo-500/10 p-5 rounded-2xl flex items-center gap-4 text-indigo-950">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm">One-Click Ingestion & Share Workflow</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                Copy the pre-formatted WhatsApp post below, jump straight into your placement groups, and paste it to drive high-CTR traffic back to your site.
              </p>
            </div>
          </div>

          {/* High-Fidelity WhatsApp Chat Mockup */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">
              WhatsApp Broadcast Preview
            </label>
            
            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              {/* WhatsApp Window Top Header */}
              <div className="bg-[#075e54] text-white px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-black select-none border border-emerald-500/30">
                    JD
                  </div>
                  <div>
                    <h5 className="font-black text-xs tracking-tight">Placement Drives & Jobs</h5>
                    <p className="text-[9px] text-emerald-100 font-semibold opacity-90">Channel Broadcast</p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* WhatsApp Message Body Area */}
              <div className="p-5 bg-[#efeae2] min-h-[200px] max-h-[320px] overflow-y-auto relative flex flex-col">
                {/* Visual Chat Pattern Background Overlays (Optional, but gives rich styling) */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Classic WhatsApp Light Green Bubble */}
                <div className="bg-[#d9fdd3] text-[#111b21] max-w-[88%] rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#e1f5fe]/10 text-xs md:text-sm font-normal leading-relaxed relative self-start z-10">
                  {/* Speech Bubble Tail */}
                  <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-[#d9fdd3] border-r-[#d9fdd3]" />
                  
                  {/* Formatted Text */}
                  <p 
                    className="whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: formatWhatsAppText(whatsappMessage) }}
                  />
                  
                  {/* Dynamic timestamp */}
                  <span className="text-[9px] text-slate-400 font-semibold float-right mt-2 ml-4">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          {/* Copy Message Action */}
          <button
            onClick={handleCopyMessage}
            className={cn(
              "py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer",
              copiedMessage 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100" 
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
            )}
          >
            {copiedMessage ? (
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

          {/* Copy URL Action */}
          <button
            onClick={handleCopyUrl}
            className={cn(
              "py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border cursor-pointer",
              copiedUrl 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-800"
            )}
          >
            {copiedUrl ? (
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

          {/* Preview Live Action */}
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-700 hover:text-slate-800 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Live</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
}
