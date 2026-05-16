"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Trophy, Lightbulb, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PrepItem {
  id: string;
  label: string;
  tip: string;
}

const defaultItems: PrepItem[] = [
  { id: "resume", label: "Customize Resume", tip: "Match keywords from the job description to bypass ATS." },
  { id: "research", label: "Company Research", tip: "Read about their recent products and company culture." },
  { id: "dsa", label: "DSA Practice", tip: "Solve at least 2-3 Medium LeetCode problems related to this role." },
  { id: "behavioral", label: "Behavioral Prep", tip: "Prepare 3 stories using the STAR method for HR rounds." },
  { id: "mock", label: "Technical Mock", tip: "Do a peer mock interview focusing on system design/coding." },
];

export default function PrepChecklist({ jobId }: { jobId: string }) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`prep_checklist_${jobId}`);
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, [jobId]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(`prep_checklist_${jobId}`, JSON.stringify(checkedItems));
    }
  }, [checkedItems, jobId, isLoaded]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = Math.round((checkedItems.length / defaultItems.length) * 100);

  return (
    <section className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter font-display">Prep Checklist :-</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          {progress}% Ready
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 w-full">
          <motion.div 
            className="h-full bg-accent" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="p-8 md:p-12 space-y-6">
          {defaultItems.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group p-6 rounded-2xl border transition-all cursor-pointer flex items-start gap-6",
                checkedItems.includes(item.id) 
                  ? "bg-emerald-50/50 border-emerald-100" 
                  : "bg-slate-50 border-slate-100 hover:border-accent/20 hover:bg-white"
              )}
              onClick={() => toggleItem(item.id)}
            >
              <div className="shrink-0 mt-1">
                {checkedItems.includes(item.id) ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-50" />
                ) : (
                  <Circle className="w-7 h-7 text-slate-300 group-hover:text-accent" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <h4 className={cn(
                  "text-xl font-black tracking-tight font-display",
                  checkedItems.includes(item.id) ? "text-emerald-900 line-through opacity-60" : "text-slate-900"
                )}>
                  {item.label}
                </h4>
                <p className={cn(
                  "text-sm font-medium leading-relaxed",
                  checkedItems.includes(item.id) ? "text-emerald-700/60" : "text-slate-500"
                )}>
                  {item.tip}
                </p>
              </div>
              <div className="shrink-0 hidden md:block">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                   <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 p-8 text-center">
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-4">Pro Tip</p>
          <p className="text-white text-lg font-medium max-w-xl mx-auto italic">
            "Candidates who complete at least 80% of their prep checklist have a 3x higher chance of clearing the first technical round."
          </p>
        </div>
      </div>
    </section>
  );
}
