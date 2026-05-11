"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/exam-clearance", label: "Exam Clearance Service" },
    { href: "/latest-jobs", label: "Latest Jobs" },
    { href: "/testimonials", label: "Testimonials" },
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
        </div>
      )}
    </header>
  );
}
