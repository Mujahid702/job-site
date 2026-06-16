"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Sparkles, Loader2 } from "lucide-react";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { code } = React.use(params);
  const router = useRouter();

  useEffect(() => {
    if (code) {
      // 1. Log referral code locally
      localStorage.setItem("referral_code", code);
      
      // 2. Log click event in background if user is anonymous
      fetch("/api/growth/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code })
      }).catch(err => console.error("Referral click tracking skipped:", err));
    }

    // 3. Auto redirect to signup after 2 seconds
    const timer = setTimeout(() => {
      router.push("/signup");
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      {/* Background glowing blur effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-650 rounded-full blur-[150px] opacity-25"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[150px] opacity-25"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10"
      >
        <div className="relative inline-flex mb-2">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/5"
          >
            <UserPlus className="w-10 h-10" />
          </motion.div>
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight leading-none font-display">
            Invitation Accepted
          </h1>
          <p className="text-indigo-200/60 font-semibold text-xs uppercase tracking-widest">
            Referral Code: <span className="text-indigo-400 font-black">{code}</span>
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-slate-350 text-xs font-semibold leading-relaxed">
            Welcome to BuggedBrain Placement OS. You've been invited to join the distributed placement network. Setting up your secure portal details...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to signup...</span>
        </div>
      </motion.div>
    </div>
  );
}
