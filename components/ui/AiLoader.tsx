"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

const STAGES = [
  "Understanding query instructions...",
  "Analyzing candidate profile contexts...",
  "Checking company requirements guidelines...",
  "Running compatibility simulations...",
  "Refining personalized guidelines...",
  "Finalizing response payload..."
];

export default function AiLoader({ 
  loading, 
  customStages = STAGES 
}: { 
  loading: boolean; 
  customStages?: string[] 
}) {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!loading) {
      setStageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % customStages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading, customStages]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="p-8 border border-slate-200 bg-white rounded-[2rem] shadow-xs text-center flex flex-col items-center justify-center gap-4 min-h-[220px]"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center relative">
            <RefreshCw className="w-6 h-6 animate-spin absolute" />
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse relative z-10" />
          </div>
          
          <div className="space-y-1">
            <strong className="text-sm font-black text-slate-800 block">AI Agent working</strong>
            <AnimatePresence mode="wait">
              <motion.span
                key={stageIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-slate-400 font-bold uppercase tracking-wider block"
              >
                {customStages[stageIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
