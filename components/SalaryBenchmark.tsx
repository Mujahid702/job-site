"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Info, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalaryBenchmarkProps {
  salaryRange: string;
  category: string;
}

export default function SalaryBenchmark({ salaryRange, category }: SalaryBenchmarkProps) {
  // Parsing logic for "X - Y LPA"
  const parseSalary = (str: string) => {
    const numbers = str.match(/\d+(\.\d+)?/g);
    if (!numbers) return 4; // Default average
    return parseFloat(numbers[0]);
  };

  const currentSalary = parseSalary(salaryRange);
  const industryAverage = category?.toLowerCase().includes("software") ? 6.5 : 4.5;
  const isHigh = currentSalary > industryAverage;
  const percentDiff = Math.abs(Math.round(((currentSalary - industryAverage) / industryAverage) * 100));

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 font-display">Salary Benchmarking</h2>
      </div>

      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry Average (2026)</p>
            <p className="text-2xl font-black text-slate-900 font-display">{industryAverage} LPA</p>
          </div>
          <div className="space-y-1 text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Comparison</p>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
              isHigh ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              <TrendingUp className={cn("w-3.5 h-3.5", !isHigh && "rotate-180")} />
              {percentDiff}% {isHigh ? "Above" : "Below"} Average
            </div>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="space-y-4">
          <div className="relative h-12 bg-white rounded-2xl border border-slate-100 p-2 overflow-hidden flex items-center">
             {/* Average Line */}
             <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-200 z-10">
               <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-slate-400"></div>
             </div>
             
             {/* Current Salary Indicator */}
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(currentSalary / (industryAverage * 2)) * 100}%` }}
               transition={{ duration: 1, ease: "circOut" }}
               className={cn(
                 "h-full rounded-xl flex items-center justify-end pr-4 text-white text-[10px] font-black uppercase tracking-widest",
                 isHigh ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-amber-500 to-orange-500"
               )}
             >
               {currentSalary} LPA
             </motion.div>
          </div>
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            <span>0 LPA</span>
            <span>Market Average</span>
            <span>{industryAverage * 2} LPA</span>
          </div>
        </div>

        <div className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100">
           <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
             <Wallet className="w-5 h-5 text-blue-600" />
           </div>
           <p className="text-sm text-slate-600 font-medium leading-relaxed">
             This offer is in the <span className="text-indigo-600 font-black">Top {isHigh ? '15%' : '40%'}</span> of salaries for {category || 'this role'} in India for the 2026 batch.
           </p>
        </div>
      </div>
    </section>
  );
}
