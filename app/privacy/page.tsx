import { ShieldCheck, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | BuggedBrain",
  description: "Read our privacy policy to understand how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="pb-32">
      {/* Header */}
      <section className="pt-20 pb-16 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Data Protection
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Last updated: May 11, 2026. Your privacy is our top priority.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-slate max-w-none">
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-8">1. Information We Collect</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              At BuggedBrain, we collect information to provide better services to all our users. The types of information we collect include:
            </p>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li className="flex gap-4"><span className="text-accent">●</span> Personal details (name, email) when you register or contact us.</li>
              <li className="flex gap-4"><span className="text-accent">●</span> Usage data (IP address, browser type, pages visited) via cookies.</li>
              <li className="flex gap-4"><span className="text-accent">●</span> Career-related information if you choose to share it for job alerts.</li>
            </ul>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-8">2. How We Use Information</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            We use the information we collect to maintain and improve our services, to develop new ones, and to protect BuggedBrain and our users. Specifically:
          </p>
          <ul className="space-y-4 text-slate-600 font-medium mb-12">
            <li className="flex gap-4"><span className="text-accent">●</span> To personalize your experience on our platform.</li>
            <li className="flex gap-4"><span className="text-accent">●</span> To send periodic emails regarding new job openings.</li>
            <li className="flex gap-4"><span className="text-accent">●</span> To monitor and analyze trends and usage.</li>
          </ul>

          <div className="bg-slate-900 p-12 rounded-[3rem] text-white mb-12">
            <h2 className="text-3xl font-black mb-8">3. Information Security</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We work hard to protect BuggedBrain and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We implement industry-standard security measures to safeguard your personal data.
            </p>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-8">4. Third-Party Links</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-12">
            Our platform contains links to other sites. Please be aware that we are not responsible for the content or privacy practices of such other sites. We encourage our users to be aware when they leave our site and to read the privacy statements of any other site that collects personally identifiable information.
          </p>

          <div className="flex items-center gap-6 p-8 bg-blue-50 rounded-3xl border border-blue-100">
             <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
               <FileText className="w-6 h-6" />
             </div>
             <p className="text-blue-900 font-bold">
               If you have any questions about this Privacy Policy, please contact us at <span className="underline">buggedbrain2026@gmail.com</span>.
             </p>
          </div>
        </div>
      </section>
    </div>
  );
}
