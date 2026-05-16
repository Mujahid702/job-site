"use client";

import { Share2, Linkedin, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SocialShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    { 
      name: "WhatsApp", 
      icon: <MessageCircle className="w-5 h-5" />, 
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-green-500 hover:text-white"
    },
    { 
      name: "LinkedIn", 
      icon: <Linkedin className="w-5 h-5" />, 
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:bg-blue-600 hover:text-white"
    },
    { 
      name: "Twitter", 
      icon: <Twitter className="w-5 h-5" />, 
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-slate-900 hover:text-white"
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest">
        <Share2 className="w-4 h-4" />
        Share this Opening
      </div>
      
      <div className="flex flex-wrap gap-4">
        {shareLinks.map((link) => (
          <a 
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 transition-all shadow-sm ${link.color}`}
            title={`Share on ${link.name}`}
          >
            {link.icon}
          </a>
        ))}
        
        <button 
          onClick={copyToClipboard}
          className="relative px-6 rounded-2xl bg-white border border-slate-100 flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-all shadow-sm font-bold text-sm"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div 
                key="check"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2 text-emerald-500"
              >
                <Check className="w-4 h-4" />
                Copied!
              </motion.div>
            ) : (
              <motion.div 
                key="link"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Copy Link
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
