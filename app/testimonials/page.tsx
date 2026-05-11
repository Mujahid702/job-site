import { Quote, Star, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Testimonials | BuggedBrain",
  description: "Read success stories from students who found their dream jobs through BuggedBrain.",
};

const testimonials = [
  {
    name: "Aditya Sharma",
    role: "SDE-1 @ Microsoft",
    content: "BuggedBrain was a game-changer for my off-campus prep. The real-time alerts helped me apply to Microsoft within minutes of the link going live!",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    name: "Priya Patel",
    role: "Analyst @ Accenture",
    content: "The exam clearance service is top-notch. I cleared the Accenture cognitive round solely because of the mock assessments provided here.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    name: "Rahul Verma",
    role: "Graduate Trainee @ TCS",
    content: "Finally a platform that understands what 2026 graduates actually need. No spam, only verified job links and high-quality preparation material.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    name: "Sneha Reddy",
    role: "Full Stack Dev @ Swiggy",
    content: "The interface is so clean and easy to use. I love how they categorize jobs by fresher, remote, and internship roles. Saved me hours of searching!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    rating: 4
  },
  {
    name: "Karthik Nair",
    role: "Intern @ Google",
    content: "I found my summer internship through a post on BuggedBrain. The company-specific interview guides were incredibly helpful for my technical rounds.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    name: "Anjali Gupta",
    role: "QA Engineer @ Oracle",
    content: "Highly recommend for all freshers. The community support and the direct hiring links make it the best job portal in India currently.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    rating: 5
  }
];

export default function TestimonialsPage() {
  return (
    <div className="pb-32">
      {/* Header */}
      <section className="pt-20 pb-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 blur-[120px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-slate-200 shadow-sm">
            <MessageCircle className="w-4 h-4" />
            Voices of Success
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            Real Stories, <span className="text-accent">Real Results</span>.
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Join thousands of successful candidates who started their professional journey with BuggedBrain.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col hover:-translate-y-2 transition-all duration-300 group">
              <div className="mb-8 flex justify-between items-start">
                 <div className="flex gap-1 text-amber-400">
                   {[...Array(t.rating)].map((_, idx) => (
                     <Star key={idx} className="w-4 h-4 fill-amber-400" />
                   ))}
                 </div>
                 <Quote className="w-10 h-10 text-slate-100 group-hover:text-blue-100 transition-colors" />
              </div>
              
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10 flex-grow italic">
                "{t.content}"
              </p>

              <div className="flex items-center gap-5 pt-8 border-t border-slate-50">
                 <img 
                   src={t.image} 
                   alt={t.name}
                   className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-md"
                 />
                 <div>
                    <h4 className="text-lg font-black text-slate-900">{t.name}</h4>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">{t.role}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="bg-slate-900 rounded-[4rem] p-16 text-center text-white relative overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-600 blur-[100px] opacity-20"></div>
            <h2 className="text-4xl font-black mb-6 relative z-10">Ready to be our next success story?</h2>
            <p className="text-xl text-slate-400 font-medium mb-10 max-w-xl mx-auto relative z-10">
              Your dream job is just one application away. Start browsing the latest opportunities now.
            </p>
            <button className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-400 hover:text-white transition-all relative z-10 uppercase tracking-widest">
              Explore Jobs
            </button>
         </div>
      </section>
    </div>
  );
}
