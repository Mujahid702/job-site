"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar as CalendarIcon,
  Clock,
  Star,
  Award,
  DollarSign,
  Bot,
  User,
  Send,
  FileText,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
  HeartHandshake
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching DB schemas
export interface Mentor {
  id: string;
  full_name: string;
  profile_photo?: string;
  headline?: string;
  bio?: string;
  company: string;
  job_title: string;
  years_experience: number;
  skills: string[];
  specializations: string[];
  session_types: string[];
  pricing_type: 'FREE' | 'PAID' | 'PREMIUM' | 'INVITE ONLY';
  session_price: number;
  currency: string;
  rating: number;
  review_count: number;
  availability_status: 'Available' | 'Limited Availability' | 'Booked' | 'Vacation' | 'Unavailable';
  verified_status: string;
  featured_status: boolean;
  linkedin_url?: string;
  portfolio_url?: string;
  email?: string;
  location?: string;
  languages: string[];
  max_sessions_per_week: number;
  active_status: boolean;
  trust_score: number;
}

export interface Booking {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorCompany: string;
  sessionType: string;
  date: string;
  time: string;
  status: "Upcoming" | "Completed" | "Cancelled" | "Rescheduled";
  pricePaid: number;
  paymentMethod: string;
  notes?: {
    recommendations?: string;
    weakAreas?: string;
    actionPlan?: string;
    resources?: string[];
    homework?: string;
  };
  reviewRating?: number;
  reviewComment?: string;
}

export interface MentorSlot {
  id: string;
  mentor_id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

export default function MentorshipOS() {
  const [activeTab, setActiveTab] = useState<string>("marketplace");
  const [isMentorView, setIsMentorView] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Dynamic lists from API
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [aiMatches, setAiMatches] = useState<Array<{ mentor: Mentor; score: number; reasoning: string }>>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPricing, setFilterPricing] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Booking process states
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorSlots, setMentorSlots] = useState<MentorSlot[]>([]);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingType, setBookingType] = useState("Mock Technical Interview");
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Reviews submission
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRatingComm, setReviewRatingComm] = useState(5);
  const [reviewRatingKnow, setReviewRatingKnow] = useState(5);
  const [reviewRatingHelp, setReviewRatingHelp] = useState(5);
  const [reviewRatingAdv, setReviewRatingAdv] = useState(5);

  // Mentor Portal Simulation States
  const [simulatedMentorId, setSimulatedMentorId] = useState<string>("");
  const [newNoteBookingId, setNewNoteBookingId] = useState<string | null>(null);
  const [newNoteRec, setNewNoteRec] = useState("");
  const [newNoteWeak, setNewNoteWeak] = useState("");
  const [newNotePlan, setNewNotePlan] = useState("");
  const [newNoteHomework, setNewNoteHomework] = useState("");

  // Request a Mentor Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqCompany, setReqCompany] = useState("");
  const [reqRole, setReqRole] = useState("");
  const [reqHelp, setReqHelp] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  // Copilot Chat
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "mentor-welcome",
      role: "copilot",
      content: "Hello! I am your **Mentorship Copilot**. Ask me to match you with top mentors, find company experts (Google/IBM/Amazon), or suggest who should review your current resume project configurations."
    }
  ]);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch mentors catalog & AI Matches
  const loadMentors = async () => {
    setLoading(true);
    try {
      const url = `/api/mentorship/mentors?company=${filterCompany}&role=${filterRole}&pricing=${filterPricing}&verifiedOnly=${verifiedOnly}&query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMentors(data.mentors || []);
        setAiMatches(data.matches || []);
        if (data.mentors && data.mentors.length > 0 && !simulatedMentorId) {
          setSimulatedMentorId(data.mentors[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading mentors list:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings
  const loadBookings = async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/mentorship/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error("Error loading bookings queue:", e);
    }
  };

  // Trigger reloading on filter updates
  useEffect(() => {
    loadMentors();
  }, [filterCompany, filterRole, filterPricing, verifiedOnly, searchQuery]);

  useEffect(() => {
    if (userId) {
      loadBookings();
    }
  }, [userId]);

  // Load slots for selected mentor
  useEffect(() => {
    if (!selectedMentor) {
      setMentorSlots([]);
      setBookingDate("");
      setBookingTime("");
      return;
    }

    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/admin/mentors/slots?mentorId=${selectedMentor.id}`);
        const data = await res.json();
        if (data.success) {
          setMentorSlots(data.slots || []);
        }
      } catch (e) {
        console.error("Error loading availability slots:", e);
      }
    };
    fetchSlots();
  }, [selectedMentor]);

  // Unique available dates
  const availableDates = Array.from(new Set(mentorSlots.map(s => s.slot_date)));
  
  // Filtered available times for picked date
  const availableTimes = mentorSlots
    .filter(s => s.slot_date === bookingDate && !s.is_booked)
    .map(s => s.slot_time);

  // Apply Coupon Code
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!selectedMentor) return;

    if (code === "WELCOMEFREE") {
      setDiscountAmount(selectedMentor.session_price);
      alert("Coupon 'WELCOMEFREE' applied! 100% discount, session is now FREE.");
    } else if (code === "BUGGED50") {
      setDiscountAmount(Math.round(selectedMentor.session_price * 0.5));
      alert("Coupon 'BUGGED50' applied! 50% discount successfully calculated.");
    } else {
      alert("Invalid promotional or referral discount code.");
    }
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedMentor || !bookingDate || !bookingTime) {
      alert("Please select a valid date and available time slot.");
      return;
    }

    const pricePaid = Math.max(0, selectedMentor.session_price - discountAmount);

    try {
      const res = await fetch("/api/mentorship/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: selectedMentor.id,
          mentor_name: selectedMentor.full_name,
          session_type: bookingType,
          booking_date: bookingDate,
          booking_time: bookingTime,
          price_paid: pricePaid,
          payment_method: pricePaid === 0 ? "Free Access" : paymentMethod,
          notes: ""
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to finalize booking");
      }

      alert(`Successfully booked session with ${selectedMentor.full_name}! Details synced to My Bookings.`);
      setSelectedMentor(null);
      setBookingDate("");
      setBookingTime("");
      setPromoCode("");
      setDiscountAmount(0);
      loadBookings();
    } catch (e: any) {
      alert(e.message || "Something went wrong during checkout.");
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch("/api/mentorship/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          status: "Cancelled"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Booking cancelled successfully.");
      loadBookings();
    } catch (e: any) {
      alert(e.message || "Cancellation failed");
    }
  };

  // Submit Feedback Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId) return;

    try {
      const res = await fetch("/api/mentorship/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: reviewBookingId,
          mentor_id: bookings.find(b => b.id === reviewBookingId)?.mentorId,
          rating_communication: reviewRatingComm,
          rating_knowledge: reviewRatingKnow,
          rating_helpfulness: reviewRatingHelp,
          rating_advice: reviewRatingAdv,
          rating_overall: reviewRating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Review submission failed.");
      }

      alert("Feedback review submitted successfully!");
      setReviewBookingId(null);
      setReviewComment("");
      setReviewRating(5);
      loadBookings();
      loadMentors();
    } catch (err: any) {
      alert(err.message || "Failed to submit rating");
    }
  };

  // Simulated Mentor: Submit post-session feedback notes
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBookingId) return;

    const b = bookings.find(x => x.id === newNoteBookingId);
    if (!b) return;

    try {
      const res = await fetch("/api/mentorship/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: newNoteBookingId,
          mentor_id: b.mentorId,
          user_id: userId,
          feedback: newNoteRec,
          roadmap: newNotePlan,
          resources: ["Practice Sheet PDF", "BuggedBrain Company OS Guide"],
          questions: newNoteHomework.split(",").map(q => q.trim()),
          improvement_areas: newNoteWeak
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Session feedback notes uploaded successfully. Session marked COMPLETED.");
      setNewNoteBookingId(null);
      setNewNoteRec("");
      setNewNoteWeak("");
      setNewNotePlan("");
      setNewNoteHomework("");
      loadBookings();
    } catch (err: any) {
      alert(err.message || "Failed to save session notes");
    }
  };

  // Student: Request a Mentor
  const handleRequestMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCompany || !reqRole) {
      alert("Company and Role are required.");
      return;
    }

    setSubmittingReq(true);
    try {
      const res = await fetch("/api/mentorship/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: reqCompany,
          role: reqRole,
          help_needed: reqHelp
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Your mentor request has been logged! Admins will check demand metrics to onboard matching experts.");
      setReqCompany("");
      setReqRole("");
      setReqHelp("");
      setIsRequestModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  // Copilot Send message
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: "user" as const,
      content: query
    };

    const updatedMsgs = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMsgs);
    setCopilotLoading(true);

    try {
      const storedKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": storedKey
        },
        body: JSON.stringify({
          message: `Mentorship OS query: ${query}`,
          history: updatedMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            targetRole: "Full Stack Developer",
            targetCompany: "Google",
            bookingsCount: bookings.length
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: `copilot-${Date.now()}`,
          role: "copilot" as const,
          content: data.data?.reply || "I analyzed your mentorship history but got a blank suggestion. Try querying about specific FAANG roles!"
        }
      ]);
    } catch {
      // Fallback matching reasoning
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("google") || q.includes("system design")) {
        reply = `### Recommending Google Preparation Mentors:
- **Sarah Jenkins** is highly recommended (95% Match Index).
- **Specializations**: System Design Reviews, FAANG Interview Mocks.
- **Action Plan**: Book a Mock Interview Session. Apply code \`WELCOMEFREE\` to secure it for free.`;
      } else if (q.includes("resume") || q.includes("review") || q.includes("ats")) {
        reply = `### Recommending Resume Review Mentors:
- **Arnav Gupta** (Talent Recruiter at Amazon) is highly recommended.
- **Why**: Arnav has scanned over 50,000 resumes and specializes in Amazon Leadership Principles and ATS formats.`;
      } else if (q.includes("free") || q.includes("zero") || q.includes("cost")) {
        reply = `### Free Mentorship Opportunity:
- **Neha Patel** (Capgemini/Accenture) offers free sessions.
- **Why**: Neha focuses on Service Company OA preparation patterns and coding foundations.`;
      } else {
        reply = `I recommend looking at the **AI Matcher** tab. It analyzes your target role, projects, and skills to rank available mentors automatically.`;
      }

      setCopilotMessages([
        ...updatedMsgs,
        {
          id: `copilot-fallback-${Date.now()}`,
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Get active mentor data for simulation view
  const activeSimulatedMentor = mentors.find(m => m.id === simulatedMentorId) || mentors[0];

  const totalEarned = bookings
    .filter(b => b.mentorId === simulatedMentorId && b.status === "Completed")
    .reduce((sum, b) => sum + b.pricePaid, 0);

  const totalSessionsConducted = bookings.filter(
    b => b.mentorId === simulatedMentorId && b.status === "Completed"
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative font-sans">
      
      {/* LEFT COLUMN: Main Marketplace Workspaces */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Title Panel */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" />
              SaaS Mentorship Marketplace
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight font-display">
              Mentorship OS
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-xl">
              Connect with leading software engineers, cloud architects, and tech recruiters to schedule mock interviews, project designs, and resume reviews.
            </p>
          </div>

          <button
            onClick={() => setIsMentorView(!isMentorView)}
            className="px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
          >
            {isMentorView ? "Switch to Student Portal" : "Switch to Mentor Portal"}
          </button>
        </div>

        {/* Dynamic Context Tabs */}
        {!isMentorView ? (
          <div className="flex flex-wrap justify-between items-center border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-2">
            <div className="flex flex-wrap gap-1">
              {[
                { id: "marketplace", label: "Mentor Marketplace", icon: <Briefcase className="w-4 h-4" /> },
                { id: "matching", label: "AI Mentor Matcher", icon: <Bot className="w-4 h-4" /> },
                { id: "student-dashboard", label: "My Bookings & Notes", icon: <FileText className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Request a Mentor
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-2">
            <div className="flex flex-wrap gap-1">
              {[
                { id: "mentor-dashboard", label: "Mentor Console", icon: <Award className="w-4 h-4" /> },
                { id: "mentor-availability", label: "Manage Availability", icon: <CalendarIcon className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {mentors.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border">
                <span>Simulated Mentor:</span>
                <select
                  value={simulatedMentorId}
                  onChange={(e) => setSimulatedMentorId(e.target.value)}
                  className="bg-white border text-xs font-bold p-1 rounded focus:outline-none"
                >
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.company})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Tab Cards Content Frame */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[500px]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs gap-3">
              <Bot className="w-8 h-8 text-pink-400 animate-spin" />
              <span>Fetching Live Mentor Marketplace...</span>
            </div>
          ) : (
            <>
              {/* TAB: MARKETPLACE DIRECTORY */}
              {!isMentorView && activeTab === "marketplace" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Filters list */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <input
                      type="text"
                      placeholder="Search skills, company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                    
                    <select
                      value={filterCompany}
                      onChange={(e) => setFilterCompany(e.target.value)}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    >
                      <option value="all">All Companies</option>
                      <option value="google">Google</option>
                      <option value="microsoft">Microsoft</option>
                      <option value="amazon">Amazon</option>
                      <option value="meta">Meta</option>
                      <option value="netflix">Netflix</option>
                      <option value="deloitte">Deloitte</option>
                      <option value="accenture">Accenture</option>
                      <option value="tcs">TCS</option>
                      <option value="infosys">Infosys</option>
                      <option value="ibm">IBM</option>
                      <option value="capgemini">Capgemini</option>
                      <option value="cognizant">Cognizant</option>
                      <option value="wipro">Wipro</option>
                      <option value="startup">Startup</option>
                    </select>

                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="engineer">Software Engineer</option>
                      <option value="developer">Developer</option>
                      <option value="architect">Cloud Architect</option>
                      <option value="pm">Product Manager</option>
                      <option value="analyst">Data Analyst</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="consultant">Consultant</option>
                    </select>

                    <div className="flex flex-col gap-1 justify-center">
                      <select
                        value={filterPricing}
                        onChange={(e) => setFilterPricing(e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none w-full"
                      >
                        <option value="all">All Pricing</option>
                        <option value="free">Free Sessions</option>
                        <option value="paid">Paid Sessions</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                        />
                        Verified Only
                      </label>
                    </div>
                  </div>

                  {/* Mentors Cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mentors.map(mentor => (
                      <div
                        key={mentor.id}
                        className="border border-slate-200 hover:border-pink-300 rounded-[2rem] p-6 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          
                          {/* Avatar, Company and Rating Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                                {mentor.full_name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-sm font-black text-slate-800 leading-tight">{mentor.full_name}</strong>
                                  {mentor.verified_status !== "None" && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[8px] font-black uppercase">
                                      {mentor.verified_status.replace(" Badge", "")}
                                    </span>
                                  )}
                                  {mentor.featured_status && (
                                    <span className="px-1.5 py-0.5 bg-pink-50 text-pink-600 border border-pink-100 rounded text-[8px] font-black uppercase">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{mentor.job_title} @ {mentor.company}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{mentor.rating}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-450 uppercase">Trust: {mentor.trust_score}%</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-3">
                            {mentor.bio}
                          </p>

                          {/* Skills Tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {mentor.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded border border-slate-100">
                                {skill}
                              </span>
                            ))}
                            {mentor.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded border border-slate-100">
                                +{mentor.skills.length - 3}
                              </span>
                            )}
                          </div>

                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-3">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Session Price</span>
                            <strong className="text-base font-black text-slate-900 leading-none">
                              {mentor.session_price === 0 ? "FREE" : `$${mentor.session_price}`}
                            </strong>
                          </div>
                          
                          <button
                            onClick={() => setSelectedMentor(mentor)}
                            className="px-4 py-2 bg-slate-900 text-white hover:bg-pink-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Book Slot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {mentors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                      <AlertTriangle className="w-12 h-12 text-amber-500" />
                      <div>
                        <strong className="text-slate-800 text-sm font-black block">No Matching Mentors Found</strong>
                        <p className="text-slate-400 text-xs font-semibold mt-1">Try relaxing filters or request custom expert onboarding below.</p>
                      </div>
                      <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-pink-600 transition-all cursor-pointer"
                      >
                        Request a Mentor
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB: AI MATCHING ENGINE */}
              {!isMentorView && activeTab === "matching" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xs font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>AI Matcher computes compatibility based on your target role config settings, skills, and ATS weak spots.</span>
                  </div>

                  <div className="space-y-4">
                    {aiMatches.map((match, i) => (
                      <div key={i} className="border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 bg-slate-50/20">
                        <div className="space-y-3 flex-grow max-w-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                              {match.mentor.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-sm font-black text-slate-800 block">{match.mentor.full_name}</strong>
                                {match.mentor.verified_status !== "None" && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[7px] font-black uppercase">
                                    {match.mentor.verified_status.replace(" Badge", "")}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold block">{match.mentor.job_title} at {match.mentor.company}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed leading-normal">{match.reasoning}</p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                          <div className="text-center md:text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Compatibility Match</span>
                            <strong className="text-xl font-black text-indigo-600 block mt-1">{match.score}%</strong>
                          </div>
                          <button
                            onClick={() => setSelectedMentor(match.mentor)}
                            className="px-4.5 py-2 bg-slate-900 text-white hover:bg-indigo-650 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    ))}

                    {aiMatches.length === 0 && (
                      <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No mentors catalogued to run AI matches
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: STUDENT BOOKINGS */}
              {!isMentorView && activeTab === "student-dashboard" && (
                <div className="space-y-8 animate-fade-in">
                  <h2 className="text-xl font-black text-slate-900 font-display">My Bookings Queue & Mentor Notes</h2>

                  <div className="space-y-6">
                    {bookings.map(booking => (
                      <div
                        key={booking.id}
                        className="border border-slate-200 p-6 rounded-[2rem] bg-white space-y-4 shadow-sm"
                      >
                        {/* Header: Title / Status */}
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <strong className="text-sm font-black text-slate-850 block">{booking.sessionType}</strong>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Mentor: {booking.mentorName} ({booking.mentorCompany})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border",
                              booking.status === "Upcoming"
                                ? "bg-amber-50 border-amber-100 text-amber-600 animate-pulse"
                                : booking.status === "Completed"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-red-50 border-red-100 text-red-500"
                            )}>
                              {booking.status}
                            </span>
                            {booking.status === "Upcoming" && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            {booking.status === "Completed" && !booking.reviewRating && (
                              <button
                                onClick={() => setReviewBookingId(booking.id)}
                                className="px-2.5 py-1 bg-amber-500 text-white hover:bg-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                              >
                                Leave Review
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 border-y border-slate-100 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <span>Date: {booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Time: {booking.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span>Paid: {booking.pricePaid === 0 ? "FREE" : `$${booking.pricePaid}`}</span>
                          </div>
                        </div>

                        {/* Mentor Notes */}
                        {booking.notes && typeof booking.notes === 'object' && (
                          <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-3 mt-2">
                            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mentor Feedback & Notes</span>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              {booking.notes.recommendations && (
                                <div>
                                  <strong className="text-slate-800 font-black">Recommendations:</strong>
                                  <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.recommendations}</p>
                                </div>
                              )}
                              {booking.notes.weakAreas && (
                                <div>
                                  <strong className="text-slate-800 font-black">Weak Areas to Address:</strong>
                                  <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.weakAreas}</p>
                                </div>
                              )}
                              {booking.notes.actionPlan && (
                                <div>
                                  <strong className="text-slate-800 font-black">Action Items:</strong>
                                  <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.actionPlan}</p>
                                </div>
                              )}
                              {booking.notes.homework && (
                                <div>
                                  <strong className="text-slate-800 font-black">Homework Assignment:</strong>
                                  <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.homework}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Review Ratings display */}
                        {booking.status === "Completed" && booking.reviewRating && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Your Review:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={cn(
                                    "w-3 h-3",
                                    idx < (booking.reviewRating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  )}
                                />
                              ))}
                            </div>
                            {booking.reviewComment && (
                              <span className="text-[11px] text-slate-550 italic font-bold">&ldquo;{booking.reviewComment}&rdquo;</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {bookings.length === 0 && (
                      <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No bookings found. Book a session from the marketplace.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB: MENTOR CONSOLE (Simulated) */}
              {isMentorView && activeTab === "mentor-dashboard" && (
                <div className="space-y-8 animate-fade-in">
                  <h2 className="text-xl font-black text-slate-900 font-display">Simulated Mentor Dashboard</h2>

                  {activeSimulatedMentor ? (
                    <>
                      {/* Earnings Analytics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: "Total Earnings", value: `$${totalEarned}` },
                          { label: "Sessions Conducted", value: totalSessionsConducted },
                          { label: "Average Rating", value: activeSimulatedMentor.rating },
                          { label: "Reviews Received", value: activeSimulatedMentor.review_count }
                        ].map((stat, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                            <strong className="text-2xl font-black text-slate-900">{stat.value}</strong>
                          </div>
                        ))}
                      </div>

                      {/* Upcoming sessions details list */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-black text-slate-800">Student Bookings Queue</h3>
                        
                        <div className="space-y-3">
                          {bookings
                            .filter(b => b.mentorId === simulatedMentorId)
                            .map(booking => (
                              <div key={booking.id} className="border border-slate-200 p-5 rounded-2xl bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                  <strong className="text-sm font-black text-slate-800 block">{booking.sessionType}</strong>
                                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Date: {booking.date} @ {booking.time} • Status: {booking.status}</span>
                                </div>

                                <div className="flex gap-2 items-center">
                                  {booking.status === "Upcoming" && (
                                    <button
                                      onClick={() => setNewNoteBookingId(booking.id)}
                                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                                    >
                                      Submit Notes
                                    </button>
                                  )}
                                  <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-slate-50 border rounded text-slate-550 shrink-0">Paid: {booking.pricePaid === 0 ? "FREE" : `$${booking.pricePaid}`}</span>
                                </div>
                              </div>
                            ))}

                          {bookings.filter(b => b.mentorId === simulatedMentorId).length === 0 && (
                            <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-xl border">
                              No bookings recorded for this simulated mentor.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Please seed or add a mentor in the Admin Panel first.
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MANAGE AVAILABILITY (Simulated) */}
              {isMentorView && activeTab === "mentor-availability" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-xl font-black text-slate-900 font-display">Simulated Mentor Settings</h2>

                  {activeSimulatedMentor ? (
                    <form onSubmit={(e) => { e.preventDefault(); alert("Profile settings are fully managed in the central Admin Panel."); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                          <input
                            type="text"
                            readOnly
                            value={activeSimulatedMentor.full_name}
                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none text-slate-500"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Session Fee ($)</label>
                          <input
                            type="number"
                            readOnly
                            value={activeSimulatedMentor.session_price}
                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none text-slate-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Specializations</label>
                        <input
                          type="text"
                          readOnly
                          value={activeSimulatedMentor.specializations.join(", ")}
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none text-slate-500"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border text-xs font-bold text-slate-550 text-center">
                        Note: Dynamic availability slots and verification badges are controlled directly from the **Admin Mentor Manager**.
                      </div>
                    </form>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No active simulated mentor configuration.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN: Availability booking pane & strategics copilot */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Availability booking preview pane */}
        {selectedMentor && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-pink-200 shadow-xl space-y-6 animate-fade-in shrink-0 relative">
            <div className="flex justify-between items-center">
              <strong className="text-sm font-black text-slate-900 block font-display">Configure Booking</strong>
              <button onClick={() => setSelectedMentor(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">Close</button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Selected Expert</span>
                <strong className="text-base font-black text-slate-800 block mt-1">{selectedMentor.full_name}</strong>
                <span className="text-[10px] text-slate-550 block mt-0.5">{selectedMentor.job_title} at {selectedMentor.company}</span>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Session Type</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  {selectedMentor.session_types && selectedMentor.session_types.length > 0 ? (
                    selectedMentor.session_types.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))
                  ) : (
                    <>
                      <option value="Mock Technical Interview">Mock Technical Interview</option>
                      <option value="Resume Review & ATS Optimization">Resume Review & ATS Optimization</option>
                      <option value="Career Path Guidance">Career Path Guidance</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pick Date</label>
                  {availableDates.length > 0 ? (
                    <select
                      value={bookingDate}
                      onChange={(e) => { setBookingDate(e.target.value); setBookingTime(""); }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="">Choose Date</option>
                      {availableDates.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[10px] font-bold text-red-500 py-2">No active dates</div>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Time</label>
                  {bookingDate ? (
                    availableTimes.length > 0 ? (
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="">Choose Time</option>
                        {availableTimes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[10px] font-bold text-red-500 py-2">All booked</div>
                    )
                  ) : (
                    <div className="text-[10px] font-bold text-slate-400 py-2">Choose date first</div>
                  )}
                </div>
              </div>

              {/* Coupon discounts */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Promo / Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. WELCOMEFREE"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none uppercase"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Price summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-505">
                  <span>Base Fee:</span>
                  <span>${selectedMentor.session_price}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Discount:</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-805 border-t border-slate-200 pt-1.5">
                  <span>Payable Total:</span>
                  <span>${Math.max(0, selectedMentor.session_price - discountAmount)}</span>
                </div>
              </div>

              {selectedMentor.session_price - discountAmount > 0 && (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["UPI", "Stripe", "Razorpay"].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          "py-2 border rounded-xl text-[10px] font-black transition-all cursor-pointer",
                          paymentMethod === method
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-350"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirmBooking}
                className="w-full py-3.5 bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-md cursor-pointer mt-2"
              >
                Confirm Booking Checkout
              </button>

            </div>
          </div>
        )}

        {/* Student Feedback Reviews dialog overlay */}
        {reviewBookingId && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-amber-250 shadow-xl space-y-4 animate-fade-in relative shrink-0">
            <strong className="text-sm font-black text-slate-900 block font-display">Rate Mentor Session</strong>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600">Communication</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} onClick={() => setReviewRatingComm(s)} className={cn("w-4.5 h-4.5 cursor-pointer", s <= reviewRatingComm ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600">Technical Knowledge</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} onClick={() => setReviewRatingKnow(s)} className={cn("w-4.5 h-4.5 cursor-pointer", s <= reviewRatingKnow ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600">Helpfulness</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} onClick={() => setReviewRatingHelp(s)} className={cn("w-4.5 h-4.5 cursor-pointer", s <= reviewRatingHelp ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600">Practical Advice</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} onClick={() => setReviewRatingAdv(s)} className={cn("w-4.5 h-4.5 cursor-pointer", s <= reviewRatingAdv ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-xs font-black text-slate-800">Overall Rating</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} onClick={() => setReviewRating(s)} className={cn("w-5 h-5 cursor-pointer", s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="Share details about your mock prep experience..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all cursor-pointer"
                >
                  Submit Review Rating
                </button>
                <button
                  type="button"
                  onClick={() => setReviewBookingId(null)}
                  className="px-4 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mentor Notes Creator Overlay */}
        {isMentorView && newNoteBookingId && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4 animate-fade-in relative shrink-0">
            <div className="flex justify-between items-center">
              <strong className="text-sm font-black text-slate-900 block font-display">Write Session Feedback Notes</strong>
              <button onClick={() => setNewNoteBookingId(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">Close</button>
            </div>
            
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">General Recommendations</label>
                <textarea
                  rows={2}
                  value={newNoteRec}
                  onChange={(e) => setNewNoteRec(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Code structure looks solid..."
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Weak Areas Detected</label>
                <input
                  type="text"
                  value={newNoteWeak}
                  onChange={(e) => setNewNoteWeak(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. System Design locking threads"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Action Plan Roadmap</label>
                <input
                  type="text"
                  value={newNotePlan}
                  onChange={(e) => setNewNotePlan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Build collaborative whiteboard with canvas syncing logs"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Homework Questions (comma separated)</label>
                <input
                  type="text"
                  value={newNoteHomework}
                  onChange={(e) => setNewNoteHomework(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Implement Redis locks, Optimize SQL Indexes"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-650 transition-all cursor-pointer"
              >
                Submit Notes to Student File
              </button>
            </form>
          </div>
        )}

        {/* Request a Mentor Modal */}
        {isRequestModalOpen && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-pink-200 shadow-xl space-y-4 animate-fade-in relative shrink-0">
            <div className="flex justify-between items-center">
              <strong className="text-sm font-black text-slate-900 block font-display">Request a custom Mentor</strong>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleRequestMentorSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Company</label>
                <input
                  type="text"
                  value={reqCompany}
                  onChange={(e) => setReqCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Google, Deloitte, Atlassian..."
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Role</label>
                <input
                  type="text"
                  value={reqRole}
                  onChange={(e) => setReqRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Backend Developer, Data Scientist..."
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Help needed / Session Goal</label>
                <textarea
                  rows={2}
                  value={reqHelp}
                  onChange={(e) => setReqHelp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Mock interview on System Design and SQL indexing strategies..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingReq}
                className="w-full py-3 bg-pink-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingReq ? "Registering Demand..." : "Submit Demand Request"}
              </button>
            </form>
          </div>
        )}

        {/* Copilot strategically widget */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[480px]">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 relative">
              <Bot className="w-4.5 h-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-black text-slate-800 block">Mentorship Copilot</strong>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Matching & prep advisor</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/20">
            {copilotMessages.map((msg) => {
              const isCopilot = msg.role === "copilot";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%] text-xs font-semibold leading-relaxed",
                    isCopilot ? "self-start" : "ml-auto flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border text-[10px]",
                    isCopilot ? "bg-pink-50 border-pink-100 text-pink-600" : "bg-slate-900 border-slate-900 text-white"
                  )}>
                    {isCopilot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                    isCopilot ? "bg-white border border-slate-150 text-slate-700" : "bg-slate-900 text-white"
                  )}>
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2 mb-1 first:mt-0 font-display">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <li key={idx} className="ml-3 list-disc text-slate-600 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
                      }
                      return <p key={idx} className="my-1">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}

            {copilotLoading && (
              <div className="flex gap-3 max-w-[80%] self-start animate-pulse text-xs">
                <div className="w-6 h-6 rounded-md bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white border border-slate-150 text-slate-400 rounded-2xl font-bold flex items-center gap-1.5">
                  <span>Searching mentor matching logs...</span>
                </div>
              </div>
            )}
          </div>

          {/* Shortcuts panel */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/30 shrink-0">
            {[
              { label: "CRACK GOOGLE MOCK", query: "Who is best for Google preparation?" },
              { label: "ATS RESUME FEEDBACK", query: "I need my resume reviewed" },
              { label: "SHOW FREE MENTORS", query: "Show me free mentors" }
            ].map(prompt => (
              <button
                key={prompt.label}
                disabled={copilotLoading}
                onClick={() => handleCopilotSend(prompt.query)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-pink-300 text-slate-600 hover:text-pink-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Form input */}
          <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              disabled={copilotLoading}
              placeholder="Ask dynamic matching suggestions..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !copilotLoading) handleCopilotSend();
              }}
              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
            />
            <button
              disabled={copilotLoading || !copilotInput.trim()}
              onClick={() => handleCopilotSend()}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-pink-600 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
