import { AlertTriangle, Info } from "lucide-react";

export const metadata = {
  title: "Disclaimer | BuggedBrain",
  description: "Read our disclaimer regarding the content and services provided by BuggedBrain.",
};

export default function DisclaimerPage() {
  return (
    <div className="pb-32">
      {/* Header */}
      <section className="pt-20 pb-16 bg-amber-50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-700 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            Important Notice
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            Disclaimer
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            Please read this disclaimer carefully before relying on any information provided on our site.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-12">
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-6">General Information</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              The information provided by BuggedBrain on this platform is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>
          </div>

          <div className="bg-slate-900 p-12 rounded-[3rem] text-white">
            <h2 className="text-3xl font-black mb-6">External Links Disclaimer</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              BuggedBrain may contain links to external websites that are not provided or maintained by or in any way affiliated with BuggedBrain. Please note that BuggedBrain does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              We highly recommend that you verify the authenticity of any job posting on the official company website before providing any personal information or making any payments.
            </p>
          </div>

          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-6">No Professional Advice</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              The site cannot and does not contain professional career advice. The information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals.
            </p>
          </div>

          <div className="flex items-center gap-6 p-8 bg-blue-50 rounded-3xl border border-blue-100">
             <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
               <Info className="w-6 h-6" />
             </div>
             <p className="text-blue-900 font-bold">
               Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site.
             </p>
          </div>
        </div>
      </section>
    </div>
  );
}
