"use client";

import { useState } from "react";
import { Mail, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubscribed(true);
      setEmail("");
    }, 1500);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-blue-400 rounded-full text-sm font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 fill-blue-400" />
                Join 50,000+ Graduates
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] font-display">
                Get Daily Job <br />
                <span className="text-accent">Alerts</span> in Your Inbox.
              </h2>
              
              <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed">
                Stay ahead of the competition. Receive exclusive off-campus drives and preparation guides every morning.
              </p>
              
              <div className="flex items-center gap-4 text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold">No Spam</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold">1-Click Unsubscribe</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-8 md:p-12 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {!isSubscribed ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-white/10 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-medium"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isLoading ? "Subscribing..." : "Join the Community"}
                      {!isLoading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                    
                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      By signing up, you agree to our Privacy Policy.
                    </p>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-8"
                  >
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-black text-white font-display">You're in!</h3>
                    <p className="text-slate-400 font-medium">
                      Check your inbox for a welcome gift. We've sent you our **2026 Placement Handbook** for free!
                    </p>
                    <button 
                      onClick={() => setIsSubscribed(false)}
                      className="text-accent font-black text-xs uppercase tracking-widest hover:underline"
                    >
                      Subscribe another email
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
