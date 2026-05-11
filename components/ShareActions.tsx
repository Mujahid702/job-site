"use client";

import { Send, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ShareActions({ jobUrl, jobTitle, company }: { jobUrl: string, jobTitle: string, company: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappText = encodeURIComponent(`Check out this ${jobTitle} role at ${company}: ${jobUrl}`);

  return (
    <div className="grid grid-cols-2 gap-4">
      <a 
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
      >
        <Send className="w-4 h-4 fill-white" />
        WhatsApp
      </a>
      <button 
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
