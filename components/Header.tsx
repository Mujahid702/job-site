"use client";

import Link from "next/link";
import { Menu, LogOut, LayoutDashboard, Heart } from "lucide-react";
import { useSavedJobs } from "@/lib/context/SavedJobsContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { savedJobs } = useSavedJobs();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = (u: User | null) => {
      if (!u) return false;
      return u.email === 'admin@example.com' || 
             u.email === 'buggedbrain2026@gmail.com' || 
             u.email === 'mujjumujahid1992@gmail.com' || 
             u.user_metadata?.role === 'admin';
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAdmin(checkAdmin(user));
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(checkAdmin(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "My Dashboard" },
    { href: "/prep-hub", label: "Prep Hub" },
    { href: "/latest-jobs", label: "Latest Jobs" },
    { href: "/salary-insights", label: "Salary" },
  ];

  return (
    <header className="bg-white border-b border-slate-100 py-6 px-4 md:px-8">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Bugged<span className="text-accent">Brain</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="text-sm font-extrabold text-slate-700 hover:text-accent transition-colors tracking-tight"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/saved" className="flex items-center gap-2 group/saved">
             <div className="relative">
               <Heart className={cn("w-5 h-5 text-slate-700 group-hover/saved:text-red-500 transition-colors", savedJobs.length > 0 && "fill-red-500 text-red-500")} />
               {savedJobs.length > 0 && (
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                   {savedJobs.length}
                 </span>
               )}
             </div>
             <span className="text-sm font-extrabold text-slate-700 group-hover/saved:text-red-500 transition-colors">Saved</span>
          </Link>
          <div className="flex items-center gap-4 ml-4 pl-8 border-l border-slate-100">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-black text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <form action="/auth/logout" method="post">
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-red-50 text-red-600 text-sm font-black rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-black text-slate-600 hover:text-accent transition-colors">
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="px-6 py-2.5 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-accent transition-all shadow-lg shadow-slate-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-slate-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-slate-50">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="block py-3 text-sm font-bold text-slate-700 hover:text-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link 
            href="/saved" 
            className="flex items-center justify-between py-3 text-sm font-bold text-slate-700 hover:text-accent"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Heart className={cn("w-5 h-5", savedJobs.length > 0 && "fill-red-500 text-red-500")} />
              Saved Jobs
            </div>
            {savedJobs.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {savedJobs.length}
              </span>
            )}
          </Link>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
            {user ? (
              <>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center justify-center gap-2 py-3 text-sm font-black text-slate-600 bg-slate-50 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <form action="/auth/logout" method="post" className="w-full">
                  <button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-black text-white bg-red-600 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center py-3 text-sm font-black text-slate-600 bg-slate-50 rounded-xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="flex items-center justify-center py-3 text-sm font-black text-white bg-slate-900 rounded-xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
