import { getPortfolioGenerationById } from '@/lib/db/portfolio';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import {
  Globe,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  Terminal,
  Compass,
  Cpu
} from 'lucide-react';

const Github = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const generation = await getPortfolioGenerationById(id, supabase);

  if (!generation) return { title: 'Portfolio Not Found' };

  const name = generation.structured_schema?.hero?.name || 'Professional Portfolio';
  const role = generation.structured_schema?.hero?.role || 'Software Engineer';
  const tagline = generation.structured_schema?.hero?.tagline || '';

  return {
    title: `${name} | ${role} Portfolio`,
    description: tagline || `Explore the professional developer portfolio of ${name}.`,
    openGraph: {
      title: `${name} | ${role} Portfolio`,
      description: tagline || `Explore the professional developer portfolio of ${name}.`,
      images: generation.profile_image_url ? [{ url: generation.profile_image_url }] : [],
      type: 'profile'
    }
  };
}

export default async function PublicPortfolioPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const generation = await getPortfolioGenerationById(id, supabase);

  if (!generation) {
    return notFound();
  }

  const schema = generation.structured_schema;
  const theme = generation.theme || 'Modern';
  const fontFamily = generation.font_family || 'Poppins';
  const colorScheme = generation.color_scheme || 'Blue';

  // Font Family Maps
  const fontClass = 
    fontFamily === 'Poppins' ? 'font-sans' :
    fontFamily === 'Inter' ? 'font-sans antialiased' :
    fontFamily === 'Montserrat' ? 'font-sans tracking-wide' : 'font-mono';

  // Color Accent styling helper
  const accentTextClass = 
    colorScheme === 'Blue' ? 'text-blue-500' :
    colorScheme === 'Purple' ? 'text-purple-500' :
    colorScheme === 'Green' ? 'text-emerald-500' : 'text-slate-400';

  const accentBgClass =
    colorScheme === 'Blue' ? 'bg-blue-600' :
    colorScheme === 'Purple' ? 'bg-purple-600' :
    colorScheme === 'Green' ? 'bg-emerald-600' : 'bg-slate-800';

  const accentBorderClass =
    colorScheme === 'Blue' ? 'border-blue-500/20' :
    colorScheme === 'Purple' ? 'border-purple-500/20' :
    colorScheme === 'Green' ? 'border-emerald-500/20' : 'border-slate-800';

  // LD-JSON schema
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": schema.hero.name,
    "jobTitle": schema.hero.role,
    "description": schema.about.description,
    "knowsAbout": schema.skills,
    "email": schema.contact.email,
    "url": `https://PlacementOS.com/portfolio/${id}`
  };

  return (
    <div className={`min-h-screen ${fontClass}`}>
      {/* Dynamic Font loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Montserrat:wght@300;400;700;800;900&family=Poppins:wght@300;400;600;700;900&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />

      {/* RENDER THEME STYLES */}

      {/* 1. DEVELOPER THEME (Retro Terminal Mode) */}
      {theme === 'Developer' && (
        <div className="bg-zinc-950 text-zinc-300 min-h-screen py-12 px-6 font-mono selection:bg-zinc-800 selection:text-green-400">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Terminal Header */}
            <div className="border border-zinc-800 bg-zinc-900 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-850 flex justify-between items-center text-[11px] text-zinc-500">
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
                <span>brand_studio@buggedbrain:~</span>
                <span className="w-6" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-1.5 text-green-400 text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>$ cat profile.json</span>
                </div>
                <h1 className="text-3xl font-black text-white">{schema.hero.name}</h1>
                <p className="text-green-500 text-sm font-bold">{schema.hero.role}</p>
                <p className="text-xs text-zinc-400 leading-relaxed italic">&quot;{schema.hero.tagline}&quot;</p>
              </div>
            </div>

            {/* About Biography Section */}
            <section className="space-y-4 border border-zinc-900 p-6 rounded-lg">
              <span className="text-green-400 text-xs block">$ execute --bio</span>
              <p className="text-xs leading-relaxed text-zinc-400 font-sans">{schema.about.description}</p>
            </section>

            {/* Skills Segment */}
            <section className="space-y-4 border border-zinc-900 p-6 rounded-lg">
              <span className="text-green-400 text-xs block">$ list --skills</span>
              <div className="flex flex-wrap gap-2 pt-2">
                {schema.skills.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 text-xs border border-zinc-850 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Projects Grid */}
            <section className="space-y-6">
              <span className="text-green-400 text-xs block">$ run --projects</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.projects.map((p: any, idx: number) => (
                  <div key={idx} className="border border-zinc-900 bg-zinc-900/30 p-5 rounded-lg flex flex-col justify-between h-44 hover:border-zinc-800 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <h4 className="text-white text-xs truncate max-w-[150px]">{p.title}</h4>
                        <span className="text-green-500 text-[10px]">Impact: {p.impact_score}%</span>
                      </div>
                      <p className="text-[11px] text-zinc-450 line-clamp-3 leading-normal font-sans">{p.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-900/60 font-sans">
                      <div className="flex gap-2">
                        {p.tech_stack?.slice(0, 3).map((t: string) => (
                          <span key={t} className="text-zinc-500">{t}</span>
                        ))}
                      </div>
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer" className="text-green-400 hover:underline flex items-center gap-0.5">
                          Code <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Details */}
            <section className="space-y-4 border border-zinc-900 p-6 rounded-lg text-xs space-y-2">
              <span className="text-green-400 text-xs block">$ ping --contacts</span>
              <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                {schema.contact.email && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="w-4 h-4 text-green-500" />
                    <span>{schema.contact.email}</span>
                  </div>
                )}
                {schema.contact.github && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Github className="w-4 h-4 text-green-500" />
                    <span>{schema.contact.github}</span>
                  </div>
                )}
                {schema.contact.linkedin && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Linkedin className="w-4 h-4 text-green-500" />
                    <span>{schema.contact.linkedin}</span>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      )}

      {/* 2. GLASSMORPHISM THEME */}
      {theme === 'Glassmorphism' && (
        <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-slate-100 min-h-screen py-16 px-6 relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
          {/* Neon mesh circles background styling */}
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            {/* Glass Container Header */}
            <header className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">{schema.hero.name}</h1>
                <p className={`text-sm font-black uppercase tracking-wider ${accentTextClass}`}>{schema.hero.role}</p>
                <p className="text-xs text-slate-400 italic font-medium max-w-md">&quot;{schema.hero.tagline}&quot;</p>
              </div>
              {schema.hero.avatar && (
                <img src={schema.hero.avatar} alt={schema.hero.name} className="w-24 h-24 rounded-full border border-white/20 object-cover shadow-inner shrink-0" />
              )}
            </header>

            {/* About Biography Section */}
            <section className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4">
              <strong className="text-xs font-black uppercase tracking-widest text-indigo-300 block">About Biography</strong>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">{schema.about.description}</p>
            </section>

            {/* Skills */}
            <section className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4">
              <strong className="text-xs font-black uppercase tracking-widest text-indigo-300 block">Skills Matrix</strong>
              <div className="flex flex-wrap gap-2 pt-2">
                {schema.skills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 text-slate-200 text-xs rounded-xl font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Factual Projects */}
            <section className="space-y-6">
              <strong className="text-xs font-black uppercase tracking-widest text-indigo-300 block">Factual Projects</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.projects.map((p: any, idx: number) => (
                  <div key={idx} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between h-44 shadow-lg hover:border-white/20 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black truncate max-w-[160px]">{p.title}</h4>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-black">
                          {p.impact_score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-normal font-medium">{p.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      <div className="flex gap-2">
                        {p.tech_stack?.slice(0, 3).map((t: string) => (
                          <span key={t} className="text-slate-400">{t}</span>
                        ))}
                      </div>
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 font-bold">
                          Codebase <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contacts Footer */}
            <footer className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
              <span className="text-slate-400 font-bold">Connect with {schema.hero.name}</span>
              <div className="flex gap-4">
                {schema.contact.email && (
                  <a href={`mailto:${schema.contact.email}`} className="text-slate-300 hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {schema.contact.github && (
                  <a href={`https://${schema.contact.github}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {schema.contact.linkedin && (
                  <a href={`https://${schema.contact.linkedin}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </footer>

          </div>
        </div>
      )}

      {/* 3. MINIMAL THEME (Monochrome serif) */}
      {theme === 'Minimal' && (
        <div className="bg-white text-slate-900 min-h-screen py-20 px-6 font-serif selection:bg-slate-100 selection:text-slate-900">
          <div className="max-w-3xl mx-auto space-y-16">
            
            <header className="space-y-4 pb-8 border-b border-slate-200">
              <h1 className="text-5xl font-normal text-slate-950 tracking-tight font-display">{schema.hero.name}</h1>
              <p className="text-sm font-semibold italic text-slate-500 uppercase tracking-widest">{schema.hero.role}</p>
              <p className="text-xs text-slate-400 max-w-md font-sans leading-relaxed">&quot;{schema.hero.tagline}&quot;</p>
            </header>

            {/* Biography */}
            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-sans">Biography</h3>
              <p className="text-sm leading-relaxed text-slate-650 font-normal">{schema.about.description}</p>
            </section>

            {/* Skills */}
            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-sans">Skills</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-sans text-slate-700">
                {schema.skills.map((s: string) => (
                  <span key={s} className="underline decoration-slate-250 underline-offset-4">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Projects list */}
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-sans">Featured Projects</h3>
              <div className="divide-y divide-slate-200">
                {schema.projects.map((p: any, idx: number) => (
                  <div key={idx} className="py-6 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold font-sans">
                      <h4 className="font-extrabold text-slate-950">{p.title}</h4>
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-0.5 text-xs font-normal">
                          Repository <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{p.description}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 uppercase tracking-wide font-sans">
                      <span>Tech: {p.tech_stack?.join(', ')}</span>
                      <span>•</span>
                      <span>Factual Score: {p.impact_score || 80}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact links footer */}
            <footer className="pt-8 border-t border-slate-200 flex flex-wrap gap-6 text-xs text-slate-500 font-sans">
              {schema.contact.email && (
                <a href={`mailto:${schema.contact.email}`} className="hover:text-slate-900 hover:underline">
                  {schema.contact.email}
                </a>
              )}
              {schema.contact.linkedin && (
                <a href={`https://${schema.contact.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-slate-900 hover:underline">
                  LinkedIn
                </a>
              )}
              {schema.contact.github && (
                <a href={`https://${schema.contact.github}`} target="_blank" rel="noreferrer" className="hover:text-slate-900 hover:underline">
                  GitHub
                </a>
              )}
            </footer>

          </div>
        </div>
      )}

      {/* 4. MODERN THEME & 5. STARTUP FOUNDER THEME */}
      {(theme === 'Modern' || theme === 'Startup Founder') && (
        <div className={cn(
          "min-h-screen py-16 px-6 select-none",
          theme === 'Startup Founder' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
        )}>
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Header Box */}
            <div className={cn(
              "p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 border shadow-lg",
              theme === 'Startup Founder' 
                ? 'bg-slate-950 border-slate-800 text-white shadow-slate-950/20' 
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-100/50'
            )}>
              <div className="space-y-4 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display">{schema.hero.name}</h1>
                <p className={`text-sm font-black uppercase tracking-wider ${accentTextClass}`}>{schema.hero.role}</p>
                <p className="text-xs text-slate-500 font-medium max-w-md italic">&quot;{schema.hero.tagline}&quot;</p>
              </div>
              {schema.hero.avatar && (
                <img src={schema.hero.avatar} alt={schema.hero.name} className="w-28 h-28 rounded-3xl object-cover shadow border border-slate-200/20" />
              )}
            </div>

            {/* Biography */}
            <section className={cn(
              "p-8 rounded-[2rem] border shadow-sm space-y-4",
              theme === 'Startup Founder' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            )}>
              <strong className="text-xs font-black uppercase tracking-widest text-slate-400 block">About Biography</strong>
              <p className="text-xs leading-relaxed text-slate-500 font-semibold">{schema.about.description}</p>
            </section>

            {/* Skills */}
            <section className={cn(
              "p-8 rounded-[2rem] border shadow-sm space-y-4",
              theme === 'Startup Founder' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            )}>
              <strong className="text-xs font-black uppercase tracking-widest text-slate-400 block">Competencies</strong>
              <div className="flex flex-wrap gap-2 pt-2">
                {schema.skills.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Projects Grid */}
            <section className="space-y-6">
              <strong className="text-xs font-black uppercase tracking-widest text-slate-400 block">Verified Projects</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.projects.map((p: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-6 rounded-[2rem] border flex flex-col justify-between h-44 shadow-sm hover:shadow-md transition-all",
                    theme === 'Startup Founder' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  )}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black truncate max-w-[160px]">{p.title}</h4>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {p.impact_score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 line-clamp-3 leading-normal font-semibold">{p.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      <div className="flex gap-2 font-mono text-[9px]">
                        {p.tech_stack?.slice(0, 3).map((t: string) => (
                          <span key={t} className="text-slate-450">{t}</span>
                        ))}
                      </div>
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline flex items-center gap-0.5 font-bold">
                          Code <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Timelines Experiences */}
            {schema.experience && schema.experience.length > 0 && (
              <section className={cn(
                "p-8 rounded-[2rem] border shadow-sm space-y-6",
                theme === 'Startup Founder' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              )}>
                <strong className="text-xs font-black uppercase tracking-widest text-slate-400 block">Work History</strong>
                <div className="space-y-6 text-xs text-left">
                  {schema.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="flex gap-4 border-l-2 border-slate-200 pl-4 py-1">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-xs">{exp.role} at {exp.company}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block">{exp.period}</span>
                        <p className="text-slate-500 font-semibold leading-relaxed mt-1">{exp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="flex justify-between items-center pt-8 border-t border-slate-200 text-xs text-slate-400 font-bold">
              <span>Connect with {schema.hero.name}</span>
              <div className="flex gap-4">
                {schema.contact.email && (
                  <a href={`mailto:${schema.contact.email}`} className="hover:text-slate-800 transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {schema.contact.linkedin && (
                  <a href={`https://${schema.contact.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {schema.contact.github && (
                  <a href={`https://${schema.contact.github}`} target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
              </div>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}
