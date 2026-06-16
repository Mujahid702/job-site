import Link from "next/link";
import { LayoutDashboard, PlusCircle, Briefcase, LogOut, ChevronRight, Sparkles, Shield, TrendingUp, BookOpen, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
            B
          </div>
          <span className="font-black text-slate-900 tracking-tight">Admin Portal</span>
        </div>

        <nav className="flex-grow p-6 space-y-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <Link 
            href="/admin/analytics" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Analytics Dashboard
          </Link>

          <Link 
            href="/admin/ai-analytics" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <DollarSign className="w-5 h-5 text-amber-500" />
            AI Cost Analytics
          </Link>

          <Link 
            href="/admin/automation" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Content Automation
          </Link>

          <Link 
            href="/admin/knowledge" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <BookOpen className="w-5 h-5 text-violet-500" />
            Knowledge Base (RAG)
          </Link>

          <Link 
            href="/admin/drives/new" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <PlusCircle className="w-5 h-5" />
            Post New Drive
          </Link>
          <Link 
            href="/admin/jobs" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <Briefcase className="w-5 h-5" />
            Manage Jobs
          </Link>

          <Link 
            href="/admin/moderation" 
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold"
          >
            <Shield className="w-5 h-5 text-rose-500" />
            Moderation Panel
          </Link>
        </nav>


        <div className="p-6 border-t border-slate-100">
           <form action="/auth/logout" method="post">
              <button 
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
           </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow min-h-screen">
        {/* Mobile Header (Simplified) */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
            <span className="font-black text-slate-900">Admin Portal</span>
            {/* Mobile menu trigger could go here */}
        </header>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
