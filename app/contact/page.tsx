import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Contact Us | BuggedBrain",
  description: "Get in touch with the BuggedBrain team for any queries or support.",
};

export default function ContactPage() {
  return (
    <div className="pb-32">
      {/* Header Section */}
      <section className="pt-20 pb-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-slate-200">
            <MessageSquare className="w-4 h-4" />
            Get In Touch
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            We're Here to <span className="text-accent">Help</span>.
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Have a question about a job listing or need assistance with your application? Reach out to us anytime.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Information */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Contact Information</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                    <p className="text-xl font-bold text-slate-900">buggedbrain2026@gmail.com</p>
                  </div>
                </div>


                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Our Location</p>
                    <p className="text-xl font-bold text-slate-900">Hyderabad, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-20"></div>
               <h3 className="text-2xl font-black mb-4 relative z-10">Follow Our Journey</h3>
               <p className="text-slate-400 font-medium mb-8 relative z-10 leading-relaxed">
                 Stay updated with the latest job alerts and career tips on our social media channels.
               </p>
               <div className="flex gap-4 relative z-10">
                 {/* Social icons could go here */}
                 <Link href="https://chat.whatsapp.com/DYALTIh1csSHuV0zdD9ONW" target="_blank" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-center">WhatsApp</Link>
                 <Link href="https://youtube.com/@buggedbrain25?si=KCFxnvILvUyn3M5_" target="_blank" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-center">YouTube</Link>
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Send us a message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <input 
                  type="text" 
                  placeholder="How can we help?"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent font-bold text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                <textarea 
                  rows={5}
                  placeholder="Tell us more about your inquiry..."
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent font-bold text-slate-900 resize-none"
                ></textarea>
              </div>
              <button className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-accent transition-all flex items-center justify-center gap-2 group uppercase tracking-widest">
                Send Message
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
