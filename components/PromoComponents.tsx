import Link from "next/link";
import { Play } from "lucide-react";
import Image from "next/image";

interface PromoProps {
  thumbnail?: string;
  title: string;
  description: string;
  ctaText: string;
  youtubeLink: string;
  className?: string;
}

export function PromoBanner({ title, description, ctaText, youtubeLink, thumbnail, className }: PromoProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white ${className}`}>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {thumbnail && (
          <div className="relative w-full md:w-64 h-36 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer shrink-0">
             <Image src={thumbnail} alt={title} fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover transition-transform group-hover:scale-110" />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-12 h-12 text-white fill-white" />
             </div>
          </div>
        )}
        <div className="flex-grow space-y-4">
          <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200">
            Featured Video
          </span>
          <h3 className="text-2xl md:text-3xl font-black">{title}</h3>
          <p className="text-blue-100/80 max-w-2xl">{description}</p>
        </div>
        <Link 
          href={youtubeLink} 
          target="_blank"
          className="shrink-0 px-8 py-4 bg-white text-blue-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          {ctaText}
        </Link>
      </div>
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -ml-32 -mb-32"></div>
    </div>
  );
}

export function SidebarPromo({ title, description, ctaText, youtubeLink, thumbnail, className }: PromoProps) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 group cursor-pointer">
        {thumbnail ? (
          <Image src={thumbnail} alt={title} fill sizes="(max-width: 768px) 100vw, 384px" className="object-cover transition-transform group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Play className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-10 h-10 text-white fill-white" />
        </div>
      </div>
      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">Sponsored Content</span>
      <h4 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{title}</h4>
      <p className="text-sm text-slate-500 mb-6 line-clamp-2">{description}</p>
      <Link 
        href={youtubeLink} 
        target="_blank"
        className="block w-full py-3 bg-slate-900 text-white text-center font-bold rounded-xl hover:bg-slate-800 transition-colors"
      >
        Watch Video
      </Link>
    </div>
  );
}

export function InlinePromo({ title, description, ctaText, youtubeLink, className }: PromoProps) {
  return (
    <div className={`my-12 p-8 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col md:flex-row items-center justify-between gap-8 ${className}`}>
      <div className="space-y-2">
        <h4 className="text-xl font-bold text-slate-900">{title}</h4>
        <p className="text-slate-600">{description}</p>
      </div>
      <Link 
        href={youtubeLink} 
        target="_blank"
        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
      >
        {ctaText}
      </Link>
    </div>
  );
}
