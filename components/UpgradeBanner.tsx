"use client";

import React from "react";
import { Sparkles, CheckCircle2, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeBannerProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const BENEFIT_LIST = [
  "Unlimited ATS Resume Scans",
  "Unlimited Job Description Matching",
  "Unlimited Project Advisor blueprints",
  "Unlimited Assessment Exam Mode attempts",
  "Priority AI responses & zero queuing latency",
  "1-on-1 mentorship bookings priority slot",
  "Dedicated premium candidate profile badge"
];

export default function UpgradeBanner({
  isOpen,
  onClose,
  featureName
}: UpgradeBannerProps) {
  const router = useRouter();

  const handleUpgradeClick = () => {
    onClose();
    router.push("/dashboard/subscription");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-hidden text-center z-10 font-sans"
          >
            {/* Ambient Top Light Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Close Trigger */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-55 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon */}
            <div className="w-16 h-16 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-md mb-6">
              <ShieldAlert className="w-8 h-8 text-indigo-600" />
            </div>

            {/* Title */}
            <div className="space-y-2 mb-6">
              <h3 className="text-2xl font-black text-slate-900 font-display">
                Free Monthly Limit Reached
              </h3>
              <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                You have consumed all your free tier credits for this feature. Upgrade to a premium plan to continue.
              </p>
            </div>

            {/* Benefits box */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-6 text-left space-y-4 mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">
                Premium Account Benefits
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BENEFIT_LIST.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-xs text-slate-655 font-bold leading-tight">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-4.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer border border-slate-200"
              >
                Close
              </button>
              <button
                onClick={handleUpgradeClick}
                className="flex-grow px-8 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-350 fill-yellow-350 animate-pulse" />
                <span>Upgrade Now</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
