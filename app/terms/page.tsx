import { Gavel, Info } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | BuggedBrain",
  description: "Read our terms and conditions for using the BuggedBrain platform.",
};

export default function TermsPage() {
  return (
    <div className="pb-32">
      {/* Header */}
      <section className="pt-20 pb-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-slate-200">
            <Gavel className="w-4 h-4 text-slate-600" />
            Legal Agreement
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            Terms & Conditions
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-slate max-w-none">
          <div className="space-y-16">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">1. Acceptance of Terms</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                By accessing and using BuggedBrain, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">2. Use of Service</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                BuggedBrain provides a platform for job seekers to find employment opportunities. You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the service.
              </p>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Prohibited Activities:</h4>
                <ul className="space-y-3 text-slate-700 font-bold">
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2"></div> Posting false or misleading information.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2"></div> Scraping content without prior written permission.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2"></div> Interfering with the proper working of the platform.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[3rem] text-white">
              <h2 className="text-3xl font-black mb-6">3. Intellectual Property</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                All content included on this site, such as text, graphics, logos, button icons, images, and software, is the property of BuggedBrain or its content suppliers and protected by international copyright laws.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">4. Limitation of Liability</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                BuggedBrain shall not be liable for any special or consequential damages that result from the use of, or the inability to use, the materials on this site or the performance of the products, even if BuggedBrain has been advised of the possibility of such damages.
              </p>
            </div>

            <div className="flex items-start gap-6 p-8 bg-amber-50 rounded-3xl border border-amber-100">
               <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                 <Info className="w-6 h-6" />
               </div>
               <p className="text-amber-900 font-bold">
                 We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
               </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
