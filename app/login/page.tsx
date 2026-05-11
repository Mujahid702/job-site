"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-200 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 mb-6 group-hover:rotate-6 transition-transform">
            <Rocket className="w-8 h-8 fill-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-gradient">Welcome Back</h1>
          <p className="text-slate-500 mt-3 font-medium">Sign in to manage your career journey.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Access Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-500 font-medium">
            New here?{" "}
            <Link href="/signup" className="text-blue-600 font-black hover:underline underline-offset-4">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
