"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMentorBookings, bookSession, updateBooking } from "@/lib/db/mentor";
import { generateUUID } from "@/lib/db/sync";



import {
  Calendar,
  Clock,
  Star,
  Award,
  DollarSign,
  Bot,
  User,
  Send,
  FileText,
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { cn, flattenSkills } from "@/lib/utils";

// Types
export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  experience: number;
  skills: string[];
  specializations: string[];
  bio: string;
  achievements: string[];
  linkedin: string;
  portfolio: string;
  languages: string[];
  rating: number;
  reviewsCount: number;
  pricing: number;
  availableDays: string[];
  imageColor: string; // color gradient key
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
  status: "Upcoming" | "Completed" | "Cancelled";
  pricePaid: number;
  paymentMethod?: string;
  notes?: {
    recommendations: string;
    weakAreas: string;
    actionPlan: string;
    resources: string[];
    homework: string;
  };
  reviewRating?: number;
  reviewComment?: string;
}

// Initial Mock Mentors Data
const INITIAL_MENTORS: Mentor[] = [
  {
    id: "mentor-1",
    name: "Sarah Jenkins",
    role: "Senior Software Engineer",
    company: "Google",
    experience: 8,
    skills: ["Go", "C++", "System Design", "Distributed Systems", "Kubernetes"],
    specializations: ["System Design Reviews", "FAANG Interview Mock", "Backend Architecture Guides"],
    bio: "Sarah is a tech lead at Google working on massive-scale distributed databases. She enjoys coaching students on concurrency and technical scaling paradigms.",
    achievements: ["Google Spot Bonus recipient", "Patents in database replication"],
    linkedin: "linkedin.com/in/sarah-jenkins-mock",
    portfolio: "sarahjenkins.dev",
    languages: ["English", "Spanish"],
    rating: 4.9,
    reviewsCount: 124,
    pricing: 49,
    availableDays: ["Monday", "Wednesday", "Friday"],
    imageColor: "from-red-500 to-yellow-500"
  },
  {
    id: "mentor-2",
    name: "Rahul Sharma",
    role: "AI Tech Lead",
    company: "IBM",
    experience: 6,
    skills: ["Python", "TensorFlow", "PyTorch", "NLP", "LangChain"],
    specializations: ["AI/ML Career Roadmaps", "IBM OA Strategy", "Resume Optimization for AI Roles"],
    bio: "Rahul leads the Watson AI deployment pipeline. He advises on fine-tuning models, vector databases, and enterprise AI governance setups.",
    achievements: ["IBM Master Inventor", "Author of 3 machine learning books"],
    linkedin: "linkedin.com/in/rahul-sharma-mock",
    portfolio: "sharmaml.dev",
    languages: ["English", "Hindi"],
    rating: 4.8,
    reviewsCount: 92,
    pricing: 29,
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    imageColor: "from-blue-600 to-indigo-800"
  },
  {
    id: "mentor-3",
    name: "Arnav Gupta",
    role: "Principal Talent Recruiter",
    company: "Amazon",
    experience: 10,
    skills: ["ATS Scanning", "Behavioral Interview Prep", "LinkedIn Branding", "Resume Reviews"],
    specializations: ["ATS Score Optimization", "Amazon Leadership Principles Coaching", "Offer Negotiation"],
    bio: "Arnav has scanned over 50,000 engineering resumes. He tells candidates exactly what recruiters want to see in project bullet points.",
    achievements: ["Hired 500+ engineers for AWS", "Top HR Voice on LinkedIn"],
    linkedin: "linkedin.com/in/arnav-recruits-mock",
    portfolio: "arnavrecruiting.com",
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.95,
    reviewsCount: 205,
    pricing: 39,
    availableDays: ["Monday", "Tuesday", "Thursday"],
    imageColor: "from-orange-500 to-amber-600"
  },
  {
    id: "mentor-4",
    name: "Elena Rostova",
    role: "Senior Product Manager",
    company: "Microsoft",
    experience: 7,
    skills: ["Product Strategy", "User Research", "Agile", "SQL", "A/B Testing"],
    specializations: ["Product Case Interviews", "Product Design Reviews", "Enterprise Governance Basics"],
    bio: "Elena drives Azure telemetry feature launches. She matches business strategy with developer tools and coaches product management candidates.",
    achievements: ["Shipped 4 cloud developer tools", "Microsoft PM Mentor of the Year"],
    linkedin: "linkedin.com/in/elena-microsoft-mock",
    portfolio: "elenarostova.co",
    languages: ["English", "Russian"],
    rating: 4.75,
    reviewsCount: 68,
    pricing: 59,
    availableDays: ["Wednesday", "Friday"],
    imageColor: "from-blue-500 to-teal-500"
  },
  {
    id: "mentor-5",
    name: "Neha Patel",
    role: "Software Developer (Capgemini Graduate)",
    company: "Accenture",
    experience: 2,
    skills: ["Java", "Spring Boot", "SQL", "DBMS", "REST APIs"],
    specializations: ["Accenture OA & Hiring Process", "Service MNC Migration Preparation", "DSA Basics"],
    bio: "Neha cleared both Capgemini and Accenture off-campus placement tests. She shares the exact strategies that help freshers land coding placements.",
    achievements: ["Cleared 4 off-campus drives", "BuggedBrain top graduate mentor"],
    linkedin: "linkedin.com/in/neha-acc-mock",
    portfolio: "nehacodes.dev",
    languages: ["English", "Gujarati", "Hindi"],
    rating: 4.9,
    reviewsCount: 41,
    pricing: 0, // Free session
    availableDays: ["Saturday", "Sunday"],
    imageColor: "from-purple-600 to-pink-700"
  },
  {
    id: "mentor-6",
    name: "David Miller",
    role: "Senior Consultant (Cloud Architect)",
    company: "Deloitte",
    experience: 9,
    skills: ["AWS Cloud Architecting", "Terraform", "CI/CD Pipelines", "Docker", "Linux"],
    specializations: ["Cloud Migration Architectures", "Deloitte Mock Consultations", "DevOps Roadmaps"],
    bio: "David leads enterprise migration projects for financial clients. He helps developers learn infra-as-code, Terraform architectures, and cloud networking.",
    achievements: ["AWS Certified Solutions Architect Professional", "Consultant lead for 3 Fortune 500 integrations"],
    linkedin: "linkedin.com/in/david-cloud-mock",
    portfolio: "davidmillercloud.dev",
    languages: ["English"],
    rating: 4.85,
    reviewsCount: 79,
    pricing: 35,
    availableDays: ["Tuesday", "Thursday"],
    imageColor: "from-emerald-500 to-teal-700"
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "booking-1",
    mentorId: "mentor-3",
    mentorName: "Arnav Gupta",
    mentorRole: "Principal Talent Recruiter",
    mentorCompany: "Amazon",
    sessionType: "Resume Review & ATS Optimization",
    date: "2026-06-10",
    time: "11:00 AM",
    status: "Upcoming",
    pricePaid: 39,
    paymentMethod: "UPI"
  },
  {
    id: "booking-2",
    mentorId: "mentor-5",
    mentorName: "Neha Patel",
    mentorRole: "Software Developer (Capgemini Graduate)",
    mentorCompany: "Accenture",
    sessionType: "Company Preparation Strategy",
    date: "2026-05-28",
    time: "03:00 PM",
    status: "Completed",
    pricePaid: 0,
    paymentMethod: "Free Access",
    notes: {
      recommendations: "Solid OOP foundations. Focus more on Spring Boot annotation injection locks and standard REST API query parameters optimizations.",
      weakAreas: "Spring Boot configuration contexts, SQL joins indexing overrides.",
      actionPlan: "Build a microservice transaction tracker project with Spring Data JPA. Setup a custom Docker orchestration script to run MySQL alongside the Spring container.",
      resources: ["Spring Boot Framework guide (file:///C:/Users/mujah/job-site/public/docs/spring.pdf)", "LeetCode SQL query schema practices sheet"],
      homework: "Optimize standard API route latencies in the microservices database repository class."
    },
    reviewRating: 5,
    reviewComment: "Neha was extremely clear and gave me excellent guidance for the Accenture coding drive!"
  }
];

// Helper outside component for message ID creation
const generateCopilotMsgId = () => {
  return `mentor-copilot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function MentorshipOS() {
  const [activeTab, setActiveTab] = useState<string>("marketplace");
  const [isMentorView, setIsMentorView] = useState<boolean>(false);

  // States
  const [mentors, setMentors] = useState<Mentor[]>(INITIAL_MENTORS);
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_BOOKINGS);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPricing, setFilterPricing] = useState("all");

  // Selection states
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingType, setBookingType] = useState("Mock Interview");
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Feedback states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);

  // Mentor View states
  const [mentorProfile, setMentorProfile] = useState<Mentor>(() => INITIAL_MENTORS[1]); // Default to Rahul Sharma for simulation
  const [newNoteBookingId, setNewNoteBookingId] = useState<string | null>(null);
  const [newNoteRec, setNewNoteRec] = useState("");
  const [newNoteWeak, setNewNoteWeak] = useState("");
  const [newNotePlan, setNewNotePlan] = useState("");
  const [newNoteHomework, setNewNoteHomework] = useState("");

  // Copilot messages
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: "user" | "copilot"; content: string }>>([
    {
      id: "mentor-welcome",
      role: "copilot",
      content: "Hello! I am your **Mentorship Copilot**. Ask me to match you with top mentors, find company experts (Google/IBM/Amazon), or suggest who should review your current resume project configurations."
    }
  ]);

  const [userId, setUserId] = useState<string | null>(null);

  // Listen to Auth State
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

  // Fetch bookings from Supabase
  useEffect(() => {
    async function loadBookings() {
      if (!userId) {
        const stored = localStorage.getItem("placement_mentorship_bookings");
        if (stored) {
          try {
            setBookings(JSON.parse(stored));
          } catch {}
        }
        return;
      }

      const dbBookings = await getMentorBookings(userId);
      if (dbBookings && dbBookings.length > 0) {
        const loadedBookings = dbBookings.map(b => {
          let meta: any = {};
          try {
            if (b.notes && b.notes.startsWith("{")) {
              meta = JSON.parse(b.notes);
            }
          } catch (e) {}

          return {
            id: b.id!,
            mentorId: meta.mentorId || "mentor-unknown",
            mentorName: b.mentor_name || "",
            mentorRole: meta.mentorRole || "Mentor",
            mentorCompany: meta.mentorCompany || "Company",
            sessionType: b.session_type || "",
            date: b.booking_date ? b.booking_date.split("T")[0] : "",
            time: meta.time || "10:00 AM",
            status: (b.status || "Upcoming") as any,
            pricePaid: meta.pricePaid || 0,
            paymentMethod: meta.paymentMethod || "Free Access",
            notes: meta.notes,
            reviewRating: meta.reviewRating,
            reviewComment: meta.reviewComment
          };
        });
        setBookings(loadedBookings);
      } else {
        // Migrate local storage
        const stored = localStorage.getItem("placement_mentorship_bookings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Booking[];
            setBookings(parsed);
            for (const b of parsed) {
              const notesStr = JSON.stringify({
                mentorId: b.mentorId,
                mentorRole: b.mentorRole,
                mentorCompany: b.mentorCompany,
                time: b.time,
                pricePaid: b.pricePaid,
                paymentMethod: b.paymentMethod,
                notes: b.notes,
                reviewRating: b.reviewRating,
                reviewComment: b.reviewComment
              });

              await bookSession(userId, {
                mentor_name: b.mentorName,
                session_type: b.sessionType,
                booking_date: b.date ? `${b.date}T${b.time.includes("PM") ? "15:00:00Z" : "10:00:00Z"}` : new Date().toISOString(),
                status: b.status,
                notes: notesStr
              });
            }
          } catch {}
        }
      }
    }
    loadBookings();
  }, [userId]);

  // Keep local cache as backup
  useEffect(() => {
    localStorage.setItem("placement_mentorship_bookings", JSON.stringify(bookings));
  }, [bookings]);

  // Apply Coupon Code
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!selectedMentor) return;

    if (code === "WELCOMEFREE") {
      setDiscountAmount(selectedMentor.pricing);
      alert("Coupon 'WELCOMEFREE' applied! 100% discount, session is now FREE.");
    } else if (code === "BUGGED50") {
      setDiscountAmount(Math.round(selectedMentor.pricing * 0.5));
      alert("Coupon 'BUGGED50' applied! 50% discount successfully calculated.");
    } else {
      alert("Invalid promotional or referral discount code.");
    }
  };

  // Confirm Booking
  const handleConfirmBooking = async () => {
    if (!selectedMentor || !bookingDate) {
      alert("Please configure a valid date for booking.");
      return;
    }

    const pricePaid = Math.max(0, selectedMentor.pricing - discountAmount);
    const newId = generateUUID();

    const newBooking: Booking = {
      id: newId,
      mentorId: selectedMentor.id,
      mentorName: selectedMentor.name,
      mentorRole: selectedMentor.role,
      mentorCompany: selectedMentor.company,
      sessionType: bookingType,
      date: bookingDate,
      time: bookingTime,
      status: "Upcoming",
      pricePaid,
      paymentMethod: pricePaid === 0 ? "Free Access" : paymentMethod
    };

    setBookings([newBooking, ...bookings]);
    setSelectedMentor(null);
    setBookingDate("");
    setPromoCode("");
    setDiscountAmount(0);

    if (userId) {
      const notesStr = JSON.stringify({
        mentorId: newBooking.mentorId,
        mentorRole: newBooking.mentorRole,
        mentorCompany: newBooking.mentorCompany,
        time: newBooking.time,
        pricePaid: newBooking.pricePaid,
        paymentMethod: newBooking.paymentMethod,
        notes: newBooking.notes,
        reviewRating: newBooking.reviewRating,
        reviewComment: newBooking.reviewComment
      });

      await bookSession(userId, {
        id: newId,
        mentor_name: newBooking.mentorName,
        session_type: newBooking.sessionType,
        booking_date: newBooking.date ? `${newBooking.date}T${newBooking.time.includes("PM") ? "15:00:00Z" : "10:00:00Z"}` : new Date().toISOString(),
        status: newBooking.status,
        notes: notesStr
      });
    }

    alert(`Successfully booked session with ${selectedMentor.name}! Details synced to Student Dashboard.`);
  };

  // Student Actions
  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      const updated = bookings.map(b => b.id === bookingId ? { ...b, status: "Cancelled" as const } : b);
      setBookings(updated);

      if (userId) {
        const target = updated.find(b => b.id === bookingId);
        if (target) {
          const notesStr = JSON.stringify({
            mentorId: target.mentorId,
            mentorRole: target.mentorRole,
            mentorCompany: target.mentorCompany,
            time: target.time,
            pricePaid: target.pricePaid,
            paymentMethod: target.paymentMethod,
            notes: target.notes,
            reviewRating: target.reviewRating,
            reviewComment: target.reviewComment
          });
          await updateBooking(userId, bookingId, {
            status: "Cancelled",
            notes: notesStr
          });
        }
      }
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: "Completed" as const } : b);
    setBookings(updated);
    setReviewBookingId(bookingId);

    if (userId) {
      const target = updated.find(b => b.id === bookingId);
      if (target) {
        const notesStr = JSON.stringify({
          mentorId: target.mentorId,
          mentorRole: target.mentorRole,
          mentorCompany: target.mentorCompany,
          time: target.time,
          pricePaid: target.pricePaid,
          paymentMethod: target.paymentMethod,
          notes: target.notes,
          reviewRating: target.reviewRating,
          reviewComment: target.reviewComment
        });
        await updateBooking(userId, bookingId, {
          status: "Completed",
          notes: notesStr
        });
      }
    }
  };

  // Submit Feedback Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId) return;

    // Save review to booking
    const updatedBookings = bookings.map(b => {
      if (b.id === reviewBookingId) {
        return {
          ...b,
          reviewRating,
          reviewComment
        };
      }
      return b;
    });

    setBookings(updatedBookings);

    // Update mentor rating average in state
    const targetBooking = bookings.find(b => b.id === reviewBookingId);
    if (targetBooking) {
      const updatedMentors = mentors.map(m => {
        if (m.id === targetBooking.mentorId) {
          const totalRating = m.rating * m.reviewsCount + reviewRating;
          const newCount = m.reviewsCount + 1;
          return {
            ...m,
            rating: Number((totalRating / newCount).toFixed(2)),
            reviewsCount: newCount
          };
        }
        return m;
      });
      setMentors(updatedMentors);
    }

    if (userId) {
      const target = updatedBookings.find(b => b.id === reviewBookingId);
      if (target) {
        const notesStr = JSON.stringify({
          mentorId: target.mentorId,
          mentorRole: target.mentorRole,
          mentorCompany: target.mentorCompany,
          time: target.time,
          pricePaid: target.pricePaid,
          paymentMethod: target.paymentMethod,
          notes: target.notes,
          reviewRating,
          reviewComment
        });
        await updateBooking(userId, reviewBookingId, {
          notes: notesStr
        });
      }
    }

    setReviewBookingId(null);
    setReviewComment("");
    setReviewRating(5);
    alert("Feedback review submitted successfully!");
  };

  // Mentor Portal actions
  const handleUpdateMentorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMentors(mentors.map(m => m.id === mentorProfile.id ? mentorProfile : m));
    alert("Mentor profile credentials updated successfully.");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBookingId) return;

    const sessionNotes = {
      recommendations: newNoteRec,
      weakAreas: newNoteWeak,
      actionPlan: newNotePlan,
      resources: ["Practice Sheet PDF", "BuggedBrain Company OS Guide"],
      homework: newNoteHomework
    };

    const updatedBookings = bookings.map(b => {
      if (b.id === newNoteBookingId) {
        return {
          ...b,
          notes: sessionNotes
        };
      }
      return b;
    });

    setBookings(updatedBookings);

    if (userId) {
      const target = updatedBookings.find(b => b.id === newNoteBookingId);
      if (target) {
        const notesStr = JSON.stringify({
          mentorId: target.mentorId,
          mentorRole: target.mentorRole,
          mentorCompany: target.mentorCompany,
          time: target.time,
          pricePaid: target.pricePaid,
          paymentMethod: target.paymentMethod,
          notes: sessionNotes,
          reviewRating: target.reviewRating,
          reviewComment: target.reviewComment
        });
        await updateBooking(userId, newNoteBookingId, {
          notes: notesStr
        });
      }
    }

    setNewNoteBookingId(null);
    setNewNoteRec("");
    setNewNoteWeak("");
    setNewNotePlan("");
    setNewNoteHomework("");
    alert("Mock session feedback notes saved. Sent to student database.");
  };


  // AI Matching logic
  const getAIMatches = () => {
    const targetRoleLabel = "Software Developer";
    const targetCompanyLabel = "Google";
    let skillsList: string[] = [];
    let atsScoreVal = 75;

    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("resume_builder_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          skillsList = flattenSkills(parsed.skills || []);
        } catch {}
      }
      atsScoreVal = Number(localStorage.getItem("ats_score") || "75");
    }

    return mentors.map(m => {
      let score = 50;

      // 1. Role similarity
      const cleanRole = targetRoleLabel.toLowerCase();
      const cleanMentorRole = m.role.toLowerCase();
      if (cleanMentorRole.includes(cleanRole) || m.skills.some(s => cleanRole.includes(s.toLowerCase()))) {
        score += 20;
      }

      // 2. Company target
      if (m.company.toLowerCase() === targetCompanyLabel.toLowerCase()) {
        score += 15;
      }

      // 3. Specialization match
      if (m.specializations.some(spec => spec.toLowerCase().includes(cleanRole) || spec.toLowerCase().includes("resume"))) {
        score += 5;
      }

      // 4. Skills checklist match
      const matchingSkills = m.skills.filter(s => 
        skillsList.some(userSkill => 
          typeof userSkill === 'string' && 
          userSkill.toLowerCase() === (s || '').toLowerCase()
        )
      );
      score += matchingSkills.length * 2;

      // 5. ATS Score contribution
      if (atsScoreVal > 80) {
        score += 5;
      }

      const finalScore = Math.min(score, 100);

      // Reasoning
      let reasoning = "";
      if (finalScore >= 85) {
        reasoning = `Outstanding match! ${m.name} is a ${m.role} at ${m.company}. They specialize in ${m.specializations[0]}, which directly targets your goals for landing a role at ${m.company}.`;
      } else if (finalScore >= 70) {
        reasoning = `Good alignment. Matches skills in ${m.skills.slice(0, 2).join(", ")}. Can help you optimize projects for ATS review.`;
      } else {
        reasoning = `General career guidance candidate. Highly rated for generic interviews preps and coding tests setup.`;
      }

      return {
        mentor: m,
        score: finalScore,
        reasoning
      };
    }).sort((a, b) => b.score - a.score);
  };

  const aiMatches = getAIMatches();

  // Mentor view analytics indicators
  const totalEarned = bookings
    .filter(b => b.mentorId === mentorProfile.id && b.status === "Completed")
    .reduce((sum, b) => sum + b.pricePaid, 0);

  const totalSessionsConducted = bookings.filter(
    b => b.mentorId === mentorProfile.id && b.status === "Completed"
  ).length;

  // Copilot strategics completions
  const handleCopilotSend = async (customPrompt?: string) => {
    const query = (customPrompt || copilotInput).trim();
    if (!query) return;

    setCopilotInput("");
    const userMsg = {
      id: generateCopilotMsgId(),
      role: "user" as const,
      content: query
    };

    const updatedMsgs = [...copilotMessages, userMsg];
    setCopilotMessages(updatedMsgs);
    setCopilotLoading(true);

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
      const res = await fetch("/api/placement/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey
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
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: data.data.reply
        }
      ]);
    } catch {
      const q = query.toLowerCase();
      let reply = "";

      if (q.includes("google") || q.includes("jenkins") || q.includes("system design")) {
        reply = `### Recommending Google Preparation Mentors:
- **Sarah Jenkins** is your best match (95% Match Index).
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
          id: generateCopilotMsgId(),
          role: "copilot" as const,
          content: reply
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Filtered mentors list
  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          m.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompany = filterCompany === "all" || m.company.toLowerCase() === filterCompany.toLowerCase();
    const matchesRole = filterRole === "all" || m.role.toLowerCase().includes(filterRole.toLowerCase());
    
    let matchesPricing = true;
    if (filterPricing === "free") matchesPricing = m.pricing === 0;
    if (filterPricing === "paid") matchesPricing = m.pricing > 0;

    return matchesSearch && matchesCompany && matchesRole && matchesPricing;
  });

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
            className="px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-650 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
          >
            {isMentorView ? "Switch to Student Portal" : "Switch to Mentor Portal"}
          </button>
        </div>

        {/* Dynamic Context Tabs */}
        {!isMentorView ? (
          <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
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
        ) : (
          <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1">
            {[
              { id: "mentor-dashboard", label: "Mentor Console", icon: <Award className="w-4 h-4" /> },
              { id: "mentor-availability", label: "Manage Availability", icon: <Calendar className="w-4 h-4" /> }
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
        )}

        {/* Tab Cards Content Frame */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200/60 shadow-sm min-h-[500px]">
          
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
                  <option value="ibm">IBM</option>
                  <option value="deloitte">Deloitte</option>
                  <option value="accenture">Accenture</option>
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Careers</option>
                  <option value="engineer">Software Engineer</option>
                  <option value="lead">Tech Lead / PM</option>
                  <option value="recruiter">Recruiters</option>
                </select>

                <select
                  value={filterPricing}
                  onChange={(e) => setFilterPricing(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Pricing</option>
                  <option value="free">Free Sessions</option>
                  <option value="paid">Paid Sessions</option>
                </select>
              </div>

              {/* Mentors Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMentors.map(mentor => (
                  <div
                    key={mentor.id}
                    className="border border-slate-200 hover:border-pink-300 rounded-[2rem] p-6 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      
                      {/* Avatar, Company and Rating Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-white font-black text-xl shadow-md", mentor.imageColor)}>
                            {mentor.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-sm font-black text-slate-800 block leading-tight">{mentor.name}</strong>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{mentor.role} @ {mentor.company}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{mentor.rating}</span>
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
                          {mentor.pricing === 0 ? "FREE" : `$${mentor.pricing}`}
                        </strong>
                      </div>
                      
                      <button
                        onClick={() => setSelectedMentor(mentor)}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-pink-650 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: AI MATCHING ENGINE */}
          {!isMentorView && activeTab === "matching" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xs font-bold">
                🚀 AI Mentor Matcher automatically computes compatibility indexes based on your target role config settings.
              </div>

              <div className="space-y-4">
                {aiMatches.map((match, i) => (
                  <div key={i} className="border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 bg-slate-50/20">
                    <div className="space-y-3 flex-grow max-w-xl">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-black text-lg shadow-sm", match.mentor.imageColor)}>
                          {match.mentor.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-sm font-black text-slate-800 block">{match.mentor.name}</strong>
                          <span className="text-[10px] text-slate-400 font-bold block">{match.mentor.role} at {match.mentor.company}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-550 font-semibold leading-relaxed leading-normal">{match.reasoning}</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                      <div className="text-center md:text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Compatibility Match</span>
                        <strong className="text-xl font-black text-indigo-650 block mt-1">{match.score}%</strong>
                      </div>
                      <button
                        onClick={() => setSelectedMentor(match.mentor)}
                        className="px-4.5 py-2 bg-slate-900 text-white hover:bg-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: STUDENT DASHBOARD */}
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
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMarkCompleted(booking.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 border-y border-slate-100 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
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
                    {booking.notes && (
                      <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-3 mt-2">
                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mentor Feedback & Notes</span>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <strong className="text-slate-800 font-black">Recommendations:</strong>
                            <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.recommendations}</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 font-black">Weak Areas to Address:</strong>
                            <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.weakAreas}</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 font-black">Action Items:</strong>
                            <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.actionPlan}</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 font-black">Homework Assignment:</strong>
                            <p className="text-slate-600 font-semibold leading-relaxed mt-0.5">{booking.notes.homework}</p>
                          </div>
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
                          <span className="text-[11px] text-slate-500 italic font-semibold">&ldquo;{booking.reviewComment}&rdquo;</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: MENTOR CONSOLE (Mentor View) */}
          {isMentorView && activeTab === "mentor-dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Mentor Dashboard Console</h2>

              {/* Earnings Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Earnings", value: `$${totalEarned}` },
                  { label: "Sessions Conducted", value: totalSessionsConducted },
                  { label: "Average Rating", value: mentorProfile.rating },
                  { label: "Reviews Received", value: mentorProfile.reviewsCount }
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
                  {bookings.filter(b => b.mentorId === mentorProfile.id).map(booking => (
                    <div key={booking.id} className="border border-slate-200 p-5 rounded-2xl bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <strong className="text-sm font-black text-slate-800 block">{booking.sessionType}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Date: {booking.date} @ {booking.time} • Status: {booking.status}</span>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === "Completed" && !booking.notes && (
                          <button
                            onClick={() => setNewNoteBookingId(booking.id)}
                            className="px-3 py-1.5 bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                          >
                            Add Notes
                          </button>
                        )}
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-slate-50 border rounded text-slate-550 shrink-0">Paid: {booking.pricePaid === 0 ? "FREE" : `$${booking.pricePaid}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MANAGE AVAILABILITY */}
          {isMentorView && activeTab === "mentor-availability" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 font-display">Manage Availability Slots</h2>

              <form onSubmit={handleUpdateMentorProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                    <input
                      type="text"
                      value={mentorProfile.name}
                      onChange={(e) => setMentorProfile({ ...mentorProfile, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Session Fee ($)</label>
                    <input
                      type="number"
                      value={mentorProfile.pricing}
                      onChange={(e) => setMentorProfile({ ...mentorProfile, pricing: Number(e.target.value) })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Configure Specializations</label>
                  <input
                    type="text"
                    value={mentorProfile.specializations.join(", ")}
                    onChange={(e) => setMentorProfile({ ...mentorProfile, specializations: e.target.value.split(", ") })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    placeholder="E.g. System Design Reviews, FAANG Interview Mocks"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-md cursor-pointer"
                >
                  Save Settings & Availability Mappings
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN: Readiness checklists & Strategics copilot drawer */}
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
                <strong className="text-base font-black text-slate-800 block mt-1">{selectedMentor.name}</strong>
                <span className="text-[10px] text-slate-550 block mt-0.5">{selectedMentor.role} at {selectedMentor.company}</span>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Session Type</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="Resume Review & ATS Optimization">Resume Review & ATS Optimization</option>
                  <option value="Mock Technical Interview">Mock Technical Interview</option>
                  <option value="Placement Prep Strategy Session">Placement Prep Strategy Session</option>
                  <option value="Referral & LinkedIn Audit">Referral & LinkedIn Audit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pick Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="10:00 AM">10:00 AM - 10:45 AM</option>
                    <option value="02:00 PM">02:00 PM - 02:45 PM</option>
                    <option value="04:00 PM">04:00 PM - 04:45 PM</option>
                  </select>
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
                <div className="flex justify-between font-bold text-slate-500">
                  <span>Base Fee:</span>
                  <span>${selectedMentor.pricing}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Discount:</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-800 border-t border-slate-200 pt-1.5">
                  <span>Payable Total:</span>
                  <span>${Math.max(0, selectedMentor.pricing - discountAmount)}</span>
                </div>
              </div>

              {selectedMentor.pricing - discountAmount > 0 && (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["UPI", "Stripe", "Razorpay"].map(method => (
                      <button
                        key={method}
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
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rating Star Count</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-400 focus:outline-none hover:scale-115 transition-transform"
                    >
                      <Star className={cn("w-6 h-6", star <= reviewRating ? "fill-amber-400" : "text-slate-200")} />
                    </button>
                  ))}
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

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all cursor-pointer"
              >
                Submit Review Rating
              </button>
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
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Action Plan Project Recommendations</label>
                <input
                  type="text"
                  value={newNotePlan}
                  onChange={(e) => setNewNotePlan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Build collaborative whiteboard with canvas syncing logs"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Homework Checklist Assignment</label>
                <input
                  type="text"
                  value={newNoteHomework}
                  onChange={(e) => setNewNoteHomework(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  placeholder="E.g. Implement a Redis SETNX inventory caching lock loop"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all cursor-pointer"
              >
                Submit Notes to Student File
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
                        return <li key={idx} className="ml-3 list-disc text-slate-650 font-bold my-0.5">{line.replace(/^[-*]\s+/, "")}</li>;
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
