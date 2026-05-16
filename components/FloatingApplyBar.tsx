"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";

export default function FloatingApplyBar({ 
  jobTitle, 
  companyName, 
  applyLink, 
  jobId 
}: { 
  jobTitle: string; 
  companyName: string; 
  applyLink: string;
  jobId: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden"
        >
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between shadow-2xl border-t border-white/50">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{companyName}</p>
              <h4 className="text-sm font-black text-slate-900 truncate font-display">{jobTitle}</h4>
            </div>
            <a 
              href={`/api/track/apply?id=${jobId}&url=${encodeURIComponent(applyLink)}`}
              target="_blank"
              className="shrink-0"
            >
              <button className="bg-accent text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-accent/20">
                Apply <ChevronRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </motion.div>
      )}

      {/* Desktop Version - Sidebar Floating (Optional, but let's stick to mobile for now as per plan) */}
    </AnimatePresence>
  );
}
