"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Star,
  CheckCircle,
  Shield,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  Bot,
  UserCheck,
  HeartHandshake,
  User,
  Power,
  X,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Mentor {
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
  availability_status: string;
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

interface MentorSlot {
  id: string;
  mentor_id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

interface DemandAnalytic {
  company: string;
  role: string;
  request_count: number;
}

export default function AdminMentorManager() {
  const [activeSubTab, setActiveSubTab] = useState<string>("mentors");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [demandStats, setDemandStats] = useState<DemandAnalytic[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // CRUD Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(5);
  const [skillsStr, setSkillsStr] = useState("");
  const [specsStr, setSpecsStr] = useState("");
  const [sessionTypes, setSessionTypes] = useState<string[]>(["Mock Technical Interview", "Resume Review & ATS Optimization"]);
  const [pricingType, setPricingType] = useState<'FREE' | 'PAID' | 'PREMIUM' | 'INVITE ONLY'>("FREE");
  const [sessionPrice, setSessionPrice] = useState(0);
  const [verifiedStatus, setVerifiedStatus] = useState("None");
  const [featuredStatus, setFeaturedStatus] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [languagesStr, setLanguagesStr] = useState("English");
  const [maxSessions, setMaxSessions] = useState(5);
  const [activeStatus, setActiveStatus] = useState(true);

  // Slots State
  const [selectedSlotMentorId, setSelectedSlotMentorId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("10:00 AM");
  const [mentorSlots, setMentorSlots] = useState<MentorSlot[]>([]);

  // Note Creator State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteBookingId, setNoteBookingId] = useState("");
  const [noteRec, setNoteRec] = useState("");
  const [noteWeak, setNoteWeak] = useState("");
  const [notePlan, setNotePlan] = useState("");
  const [noteHomework, setNoteHomework] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch mentors list
      const mRes = await fetch("/api/admin/mentors");
      const mData = await mRes.json();
      if (mData.success) {
        setMentors(mData.mentors || []);
        if (mData.mentors && mData.mentors.length > 0 && !selectedSlotMentorId) {
          setSelectedSlotMentorId(mData.mentors[0].id);
        }
      }

      // 2. Fetch Demand analytics
      const dRes = await fetch("/api/admin/mentors/demand");
      const dData = await dRes.json();
      if (dData.success) {
        setDemandStats(dData.demand || []);
      }

      // 3. Fetch bookings for review
      const bRes = await fetch("/api/mentorship/bookings");
      const bData = await bRes.json();
      if (bData.success) {
        setBookings(bData.bookings || []);
      }
    } catch (e) {
      console.error("Error fetching admin statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch slots when selected slot mentor changes
  useEffect(() => {
    if (!selectedSlotMentorId) return;

    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/admin/mentors/slots?mentorId=${selectedSlotMentorId}`);
        const data = await res.json();
        if (data.success) {
          setMentorSlots(data.slots || []);
        }
      } catch (e) {
        console.error("Error loading availability slots:", e);
      }
    };
    fetchSlots();
  }, [selectedSlotMentorId]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingMentorId(null);
    setFullName("");
    setCompany("");
    setJobTitle("");
    setBio("");
    setYearsExperience(5);
    setSkillsStr("");
    setSpecsStr("");
    setSessionTypes(["Mock Technical Interview", "Resume Review & ATS Optimization"]);
    setPricingType("FREE");
    setSessionPrice(0);
    setVerifiedStatus("None");
    setFeaturedStatus(false);
    setLinkedinUrl("");
    setPortfolioUrl("");
    setEmail("");
    setLocation("");
    setLanguagesStr("English");
    setMaxSessions(5);
    setActiveStatus(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (mentor: Mentor) => {
    setEditingMentorId(mentor.id);
    setFullName(mentor.full_name);
    setCompany(mentor.company);
    setJobTitle(mentor.job_title);
    setBio(mentor.bio || "");
    setYearsExperience(mentor.years_experience);
    setSkillsStr(mentor.skills.join(", "));
    setSpecsStr(mentor.specializations.join(", "));
    setSessionTypes(mentor.session_types);
    setPricingType(mentor.pricing_type);
    setSessionPrice(mentor.session_price);
    setVerifiedStatus(mentor.verified_status);
    setFeaturedStatus(mentor.featured_status);
    setLinkedinUrl(mentor.linkedin_url || "");
    setPortfolioUrl(mentor.portfolio_url || "");
    setEmail(mentor.email || "");
    setLocation(mentor.location || "");
    setLanguagesStr(mentor.languages.join(", "));
    setMaxSessions(mentor.max_sessions_per_week);
    setActiveStatus(mentor.active_status);
    setIsModalOpen(true);
  };

  // Handle Save Mentor CRUD
  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      full_name: fullName,
      company,
      job_title: jobTitle,
      bio,
      years_experience: Number(yearsExperience),
      skills: skillsStr.split(",").map(s => s.trim()).filter(Boolean),
      specializations: specsStr.split(",").map(s => s.trim()).filter(Boolean),
      session_types: sessionTypes,
      pricing_type: pricingType,
      session_price: pricingType === "FREE" ? 0 : Number(sessionPrice),
      verified_status: verifiedStatus,
      featured_status: featuredStatus,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      email,
      location,
      languages: languagesStr.split(",").map(l => l.trim()).filter(Boolean),
      max_sessions_per_week: Number(maxSessions),
      active_status: activeStatus
    };

    try {
      let url = "/api/admin/mentors";
      let method = "POST";

      if (editingMentorId) {
        url = `/api/admin/mentors/${editingMentorId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert(editingMentorId ? "Mentor profile updated successfully!" : "Mentor profile created successfully!");
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || "Operation failed.");
    }
  };

  // Toggle Mentor Active Status directly
  const toggleActiveStatus = async (mentor: Mentor) => {
    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_status: !mentor.active_status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to toggle status");
    }
  };

  // Delete Mentor Profile
  const handleDeleteMentor = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this mentor? This deletes all associated bookings, reviews, and availability slots.")) return;

    try {
      const res = await fetch(`/api/admin/mentors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Mentor profile deleted successfully.");
      loadData();
    } catch (e: any) {
      alert(e.message || "Deletion failed.");
    }
  };

  // Availability Slot Add
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !slotTime) {
      alert("Pick date and configure slot time.");
      return;
    }

    try {
      const res = await fetch("/api/admin/mentors/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: selectedSlotMentorId,
          slot_date: slotDate,
          slot_time: slotTime
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Availability slot added successfully.");
      // Reload slots
      const sRes = await fetch(`/api/admin/mentors/slots?mentorId=${selectedSlotMentorId}`);
      const sData = await sRes.json();
      if (sData.success) {
        setMentorSlots(sData.slots || []);
      }
    } catch (e: any) {
      alert(e.message || "Failed to create slot.");
    }
  };

  // Delete Slot
  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/admin/mentors/slots?slotId=${slotId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setMentorSlots(mentorSlots.filter(s => s.id !== slotId));
    } catch (e: any) {
      alert(e.message || "Failed to remove slot.");
    }
  };

  // Admin: Submit Notes for a Booking (Complete Session)
  const handleAdminSubmitNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = bookings.find(x => x.id === noteBookingId);
    if (!b) return;

    try {
      const res = await fetch("/api/mentorship/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: noteBookingId,
          mentor_id: b.mentorId,
          user_id: b.user_id || b.userId || "", // Handle compatibility
          feedback: noteRec,
          roadmap: notePlan,
          resources: ["Practice Sheet PDF", "BuggedBrain Company OS Guide"],
          questions: noteHomework.split(",").map(q => q.trim()),
          improvement_areas: noteWeak
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert("Session marked Completed and notes synced to candidate portfolio.");
      setIsNoteModalOpen(false);
      setNoteRec("");
      setNoteWeak("");
      setNotePlan("");
      setNoteHomework("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to submit session notes");
    }
  };

  // Stats Aggregation
  const totalMentors = mentors.length;
  const verifiedMentors = mentors.filter(m => m.verified_status !== "None").length;
  const activeMentors = mentors.filter(m => m.active_status).length;
  const sessionsBooked = bookings.length;
  const sessionsCompleted = bookings.filter(b => b.status === "Completed").length;
  const avgRating = mentors.length > 0 
    ? (mentors.reduce((sum, m) => sum + m.rating, 0) / mentors.length).toFixed(2)
    : "5.00";

  return (
    <div className="space-y-10 pb-20 font-sans">
      
      {/* Title Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Shield className="w-4 h-4" />
            Admin Overview
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Mentor Marketplace Manager</h1>
          <p className="text-slate-500 font-medium text-sm mt-3">
            Add new mentors, set featured badges, toggle verify scopes, manage available slots, inspect bookings, and trace requested demand metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Mentor
          </button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Mentors", value: totalMentors, icon: Users, color: "bg-blue-600" },
          { label: "Verified Badges", value: verifiedMentors, icon: Award, color: "bg-emerald-600" },
          { label: "Active Profiles", value: activeMentors, icon: CheckCircle, color: "bg-indigo-600" },
          { label: "Avg Marketplace Rating", value: avgRating, icon: Star, color: "bg-amber-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-pink-200 transition-all">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
        {[
          { id: "mentors", label: "Manage Mentors List", icon: <Users className="w-4 h-4" /> },
          { id: "slots", label: "Availability Schedules", icon: <Calendar className="w-4 h-4" /> },
          { id: "bookings", label: "Bookings & Review Notes", icon: <FileText className="w-4 h-4" /> },
          { id: "demand", label: "Demand Demand Analytics", icon: <HeartHandshake className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeSubTab === tab.id
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            Syncing data records...
          </div>
        ) : (
          <>
            {/* SUBTAB: MENTORS LIST */}
            {activeSubTab === "mentors" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                    <tr>
                      <th className="px-8 py-5">Mentor details</th>
                      <th className="px-8 py-5">Pricing & session type</th>
                      <th className="px-8 py-5">Trust Metrics</th>
                      <th className="px-8 py-5">Status Mappings</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mentors.map(mentor => (
                      <tr key={mentor.id} className="hover:bg-slate-50/20 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-black text-lg border">
                              {mentor.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="font-bold text-slate-900 leading-tight block">{mentor.full_name}</strong>
                                {mentor.verified_status !== "None" && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[7px] font-black uppercase">
                                    {mentor.verified_status.replace(" Badge", "")}
                                  </span>
                                )}
                                {mentor.featured_status && (
                                  <span className="px-1.5 py-0.5 bg-pink-50 text-pink-600 border border-pink-100 rounded text-[7px] font-black uppercase">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-semibold block mt-0.5">{mentor.job_title} @ {mentor.company} ({mentor.years_experience} Yrs)</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold text-slate-700">
                            <span>{mentor.pricing_type} (${mentor.session_price})</span>
                            <span className="text-[10px] text-slate-400 font-black block mt-0.5 uppercase tracking-wider">{mentor.session_types.length} Session Types</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{mentor.rating}</span>
                            </div>
                            <span className="text-slate-400">({mentor.review_count} reviews)</span>
                            <span className="px-1.5 py-0.5 bg-slate-50 border rounded text-[9px] font-black text-slate-600">Trust: {mentor.trust_score}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <button
                            onClick={() => toggleActiveStatus(mentor)}
                            className={cn(
                              "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border cursor-pointer transition-all",
                              mentor.active_status
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-slate-100 border-slate-200 text-slate-400"
                            )}
                          >
                            {mentor.active_status ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(mentor)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMentor(mentor.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {mentors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No mentors seeded. Click "Add Mentor" above to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: AVAILABILITY SCHEDULER */}
            {activeSubTab === "slots" && (
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: configure form */}
                  <div className="lg:col-span-4 bg-slate-50/50 p-6 border rounded-3xl space-y-4">
                    <strong className="text-sm font-black text-slate-900 block uppercase tracking-wider">Configure Slots Calendar</strong>
                    
                    <form onSubmit={handleAddSlot} className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Pick Mentor</label>
                        <select
                          value={selectedSlotMentorId}
                          onChange={(e) => setSelectedSlotMentorId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        >
                          {mentors.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name} ({m.company})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                        <input
                          type="date"
                          value={slotDate}
                          onChange={(e) => setSlotDate(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Time</label>
                        <select
                          value={slotTime}
                          onChange={(e) => setSlotTime(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                        >
                          <option value="09:00 AM">09:00 AM - 09:45 AM</option>
                          <option value="10:00 AM">10:00 AM - 10:45 AM</option>
                          <option value="11:00 AM">11:00 AM - 11:45 AM</option>
                          <option value="02:00 PM">02:00 PM - 02:45 PM</option>
                          <option value="03:00 PM">03:00 PM - 03:45 PM</option>
                          <option value="04:00 PM">04:00 PM - 04:45 PM</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Publish Slot
                      </button>
                    </form>
                  </div>

                  {/* Right: existing slots lists */}
                  <div className="lg:col-span-8 space-y-4">
                    <strong className="text-sm font-black text-slate-900 block uppercase tracking-wider">Configured Slots Mappings</strong>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mentorSlots.map(slot => (
                        <div key={slot.id} className="border p-4 rounded-2xl flex justify-between items-center bg-white">
                          <div>
                            <strong className="text-xs font-bold text-slate-850 block">{slot.slot_date}</strong>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Time: {slot.slot_time}</span>
                            <span className={cn(
                              "px-1.5 py-0.2 text-[8px] font-black uppercase rounded mt-1.5 inline-block",
                              slot.is_booked ? "bg-amber-50 text-amber-600 border" : "bg-emerald-50 text-emerald-600 border"
                            )}>
                              {slot.is_booked ? "Booked" : "Available"}
                            </span>
                          </div>
                          {!slot.is_booked && (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {mentorSlots.length === 0 && (
                        <div className="col-span-2 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-2xl border">
                          No availability slots mapped for this mentor. Configure date and publish above.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SUBTAB: BOOKINGS & REVIEWS NOTES */}
            {activeSubTab === "bookings" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                    <tr>
                      <th className="px-8 py-5">Session & Candidate</th>
                      <th className="px-8 py-5">Mentor Mapping</th>
                      <th className="px-8 py-5">Date & Time</th>
                      <th className="px-8 py-5">Status Mappings</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-slate-50/20 transition-all">
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold text-slate-800">
                            <strong>{booking.sessionType}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Paid: {booking.pricePaid === 0 ? "FREE" : `$${booking.pricePaid}`} via {booking.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-semibold text-slate-650">
                            <span>{booking.mentorName}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 uppercase font-bold">{booking.mentorRole} ({booking.mentorCompany})</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-semibold text-slate-650">
                            <span>{booking.date}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{booking.time}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border",
                            booking.status === "Upcoming"
                              ? "bg-amber-50 border-amber-100 text-amber-600"
                              : booking.status === "Completed"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : "bg-red-50 border-red-100 text-red-550"
                          )}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {booking.status === "Upcoming" && (
                            <button
                              onClick={() => {
                                setNoteBookingId(booking.id);
                                setIsNoteModalOpen(true);
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                            >
                              Complete & Notes
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No student bookings registered in queue yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: DEMAND ANALYTICS */}
            {activeSubTab === "demand" && (
              <div className="p-8 space-y-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xs font-bold flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>The Demand Panel lists aggregate companies & roles candidates requested where they couldn't find matching active mentors.</span>
                </div>

                <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                      <tr>
                        <th className="px-8 py-4">Requested Target Company</th>
                        <th className="px-8 py-4">Target Job Role</th>
                        <th className="px-8 py-4 text-right">Demand Count (Students)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demandStats.map((stat, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-4">
                            <strong className="text-xs font-bold text-slate-800 uppercase">{stat.company}</strong>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-xs font-semibold text-slate-600">{stat.role}</span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <span className="px-3 py-1 bg-pink-50 border border-pink-100 text-pink-600 rounded-full text-xs font-black">
                              {stat.request_count} Students
                            </span>
                          </td>
                        </tr>
                      ))}

                      {demandStats.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                            No student demand requests registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}

      </div>

      {/* CRUD ADD/EDIT MENTOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-250 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative flex flex-col gap-6">
            
            <div className="flex justify-between items-center border-b pb-4">
              <strong className="text-lg font-black text-slate-900 font-display">
                {editingMentorId ? "Modify Mentor Profile credentials" : "Create new Mentor profile catalog"}
              </strong>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMentor} className="space-y-6 text-xs">
              
              {/* Core bio details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="Sarah Jenkins"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="Google"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Job Designation Role</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="Senior Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bio Description</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  placeholder="Sarah is a tech lead at Google working on massive-scale distributed databases..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Skills (comma-separated list)</label>
                  <input
                    type="text"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="Go, C++, System Design, Distributed Systems"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Specializations (comma-separated list)</label>
                  <input
                    type="text"
                    value={specsStr}
                    onChange={(e) => setSpecsStr(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="System Design Reviews, FAANG Interview Mock"
                  />
                </div>
              </div>

              {/* Pricing Config */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pricing Scheme</label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PAID">PAID</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="INVITE ONLY">INVITE ONLY</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Session Price ($)</label>
                  <input
                    type="number"
                    value={sessionPrice}
                    disabled={pricingType === "FREE"}
                    onChange={(e) => setSessionPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Max Sessions / Week</label>
                  <input
                    type="number"
                    value={maxSessions}
                    onChange={(e) => setMaxSessions(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Social URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="linkedin.com/in/sarah-jenkins"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Portfolio URL</label>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    placeholder="sarahjenkins.dev"
                  />
                </div>
              </div>

              {/* Badges / featuring toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Verification Badge</label>
                  <select
                    value={verifiedStatus}
                    onChange={(e) => setVerifiedStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="None">None</option>
                    <option value="Verified Badge">Verified Badge</option>
                    <option value="Official Badge">Official Badge</option>
                    <option value="Industry Expert Badge">Industry Expert Badge</option>
                    <option value="Alumni Badge">Alumni Badge</option>
                    <option value="Community Mentor Badge">Community Mentor Badge</option>
                    <option value="Partner Mentor Badge">Partner Mentor Badge</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="featuredStatus"
                    checked={featuredStatus}
                    onChange={(e) => setFeaturedStatus(e.target.checked)}
                    className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="featuredStatus" className="text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer">Feature Profile</label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="activeStatus"
                    checked={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.checked)}
                    className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="activeStatus" className="text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer">Active in Directory</label>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-xl uppercase tracking-widest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl uppercase tracking-widest cursor-pointer shadow-lg"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADMIN SESSION COMPLETION MODAL */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-250 shadow-2xl max-w-lg w-full p-8 relative flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b pb-2">
              <strong className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Complete Session & File Notes</strong>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-850"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAdminSubmitNotes} className="space-y-4 text-xs">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">General Recommendations</label>
                <textarea
                  rows={2}
                  value={noteRec}
                  onChange={(e) => setNoteRec(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  placeholder="E.g. Solid OOP foundation..."
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Weak Areas Detected</label>
                <input
                  type="text"
                  value={noteWeak}
                  onChange={(e) => setNoteWeak(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  placeholder="E.g. Thread synchronization issues"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Action Plan Roadmap</label>
                <input
                  type="text"
                  value={notePlan}
                  onChange={(e) => setNotePlan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  placeholder="E.g. Implement a Redis lock transaction loop"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Homework Checklist Assignment (comma separated)</label>
                <input
                  type="text"
                  value={noteHomework}
                  onChange={(e) => setNoteHomework(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                  placeholder="E.g. Study Redis locks, Solve SQL indexing exercises"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer"
                >
                  Submit Notes & Complete
                </button>
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
