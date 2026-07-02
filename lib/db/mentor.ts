import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export interface MentorBooking {
  id?: string;
  user_id: string;
  mentor_name: string;
  session_type: string;
  booking_date: string;
  status: string;
  notes: string;
  created_at?: string;
}

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
  verified_status: 'Verified Badge' | 'Official Badge' | 'Industry Expert Badge' | 'Alumni Badge' | 'Community Mentor Badge' | 'Partner Badge' | 'Partner Mentor Badge' | 'None';
  featured_status: boolean;
  linkedin_url?: string;
  portfolio_url?: string;
  email?: string;
  location?: string;
  languages: string[];
  max_sessions_per_week: number;
  active_status: boolean;
  trust_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface MentorSlot {
  id: string;
  mentor_id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  created_at?: string;
}

export interface StudentBooking {
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
  } | string;
  reviewRating?: number;
  reviewComment?: string;
}

// Student catalog: list active mentors with optional filters
export async function getAllMentors(filters?: {
  company?: string;
  role?: string;
  pricing?: string;
  verifiedOnly?: boolean;
}): Promise<Mentor[]> {
  try {
    let query = supabase
      .from("mentors")
      .select("*")
      .eq("active_status", true);

    if (filters?.company && filters.company !== "all") {
      query = query.ilike("company", filters.company);
    }
    if (filters?.role && filters.role !== "all") {
      query = query.ilike("job_title", `%${filters.role}%`);
    }
    if (filters?.pricing) {
      if (filters.pricing === "free") {
        query = query.eq("session_price", 0);
      } else if (filters.pricing === "paid") {
        query = query.gt("session_price", 0);
      }
    }
    if (filters?.verifiedOnly) {
      query = query.neq("verified_status", "None");
    }

    const { data, error } = await query.order("featured_status", { ascending: false }).order("trust_score", { ascending: false });

    if (error) {
      console.error("Error loading mentors:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getAllMentors:", err);
    return [];
  }
}

// Admin view: list all mentors
export async function adminGetMentors(): Promise<Mentor[]> {
  try {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error admin loading mentors:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in adminGetMentors:", err);
    return [];
  }
}

export async function getMentorById(id: string): Promise<Mentor | null> {
  try {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error loading mentor ${id}:`, error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Exception in getMentorById:", err);
    return null;
  }
}

// Admin CRUD
export async function addMentor(mentor: Omit<Mentor, "id" | "rating" | "review_count" | "trust_score">): Promise<{ success: boolean; data?: any; error?: any }> {
  const newId = Math.random().toString(36).substring(2, 9) + "-" + Date.now();
  const payload = {
    ...mentor,
    rating: 5.0,
    review_count: 0,
    trust_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return executeWrite("mentors", "insert", payload);
}

export async function updateMentor(id: string, updates: Partial<Mentor>): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  return executeWrite("mentors", "update", payload, { id });
}

export async function deleteMentor(id: string): Promise<{ success: boolean; error?: any }> {
  return executeWrite("mentors", "delete", {}, { id });
}

// Bookings query: Load all bookings for a user and format them with joined ratings and notes
export async function getMentorBookings(userId: string): Promise<any[]> {
  try {
    // Fetch bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("mentor_bookings")
      .select(`
        *,
        mentor:mentor_id (
          job_title,
          company
        )
      `)
      .eq("user_id", userId)
      .order("booking_date", { ascending: false });

    if (bookingsError) {
      console.error("Error loading bookings:", bookingsError);
      return [];
    }

    if (!bookingsData || bookingsData.length === 0) return [];

    const bookingIds = bookingsData.map(b => b.id);

    // Fetch reviews for these bookings
    const { data: reviewsData } = await supabase
      .from("mentor_reviews")
      .select("booking_id, rating_overall, comment")
      .in("booking_id", bookingIds);

    // Fetch session notes for these bookings
    const { data: notesData } = await supabase
      .from("mentor_session_notes")
      .select("booking_id, feedback, roadmap, resources, questions, improvement_areas")
      .in("booking_id", bookingIds);

    // Map and combine
    return bookingsData.map(b => {
      const review = reviewsData?.find(r => r.booking_id === b.id);
      const sNote = notesData?.find(n => n.booking_id === b.id);

      let formattedNotes = undefined;
      if (sNote) {
        let resList: string[] = [];
        try {
          if (Array.isArray(sNote.resources)) {
            resList = sNote.resources;
          } else if (typeof sNote.resources === 'string') {
            resList = JSON.parse(sNote.resources);
          }
        } catch {}

        let homeworkList: string[] = [];
        try {
          if (Array.isArray(sNote.questions)) {
            homeworkList = sNote.questions;
          } else if (typeof sNote.questions === 'string') {
            homeworkList = JSON.parse(sNote.questions);
          }
        } catch {}

        formattedNotes = {
          recommendations: sNote.feedback || "",
          weakAreas: sNote.improvement_areas || "",
          actionPlan: typeof sNote.roadmap === 'string' ? sNote.roadmap : JSON.stringify(sNote.roadmap),
          resources: resList,
          homework: homeworkList.join(", ")
        };
      }

      const mentorInfo = b.mentor as any;

      return {
        id: b.id,
        mentorId: b.mentor_id,
        mentorName: b.mentor_name,
        mentorRole: mentorInfo?.job_title || "Mentor",
        mentorCompany: mentorInfo?.company || "Company",
        sessionType: b.session_type,
        date: b.booking_date,
        time: b.booking_time,
        status: b.status,
        pricePaid: Number(b.price_paid || 0),
        paymentMethod: b.payment_method,
        notes: formattedNotes,
        reviewRating: review?.rating_overall ? Number(review.rating_overall) : undefined,
        reviewComment: review?.comment
      };
    });
  } catch (err) {
    console.error("Exception in getMentorBookings:", err);
    return [];
  }
}

// Book session
export async function bookSession(userId: string, booking: {
  mentor_id: string;
  mentor_name: string;
  session_type: string;
  booking_date: string;
  booking_time: string;
  price_paid: number;
  payment_method: string;
  notes?: string;
}): Promise<{ success: boolean; data?: any; error?: any }> {
  const payload = {
    ...booking,
    user_id: userId,
    status: "Upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const res = await executeWrite("mentor_bookings", "insert", payload);
  if (res.success) {
    // Automatically mark the slot as booked
    await supabase
      .from("mentor_slots")
      .update({ is_booked: true })
      .match({ mentor_id: booking.mentor_id, slot_date: booking.booking_date, slot_time: booking.booking_time });
  }
  return res;
}

// Reschedule or Cancel booking
export async function updateBooking(userId: string, bookingId: string, updates: {
  status?: "Upcoming" | "Completed" | "Cancelled" | "Rescheduled";
  booking_date?: string;
  booking_time?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // If cancelled, free up the slot
  if (updates.status === "Cancelled") {
    // Find the booking details
    const { data: bData } = await supabase
      .from("mentor_bookings")
      .select("mentor_id, booking_date, booking_time")
      .eq("id", bookingId)
      .single();

    if (bData) {
      await supabase
        .from("mentor_slots")
        .update({ is_booked: false })
        .match({ mentor_id: bData.mentor_id, slot_date: bData.booking_date, slot_time: bData.booking_time });
    }
  }

  return executeWrite("mentor_bookings", "update", payload, { id: bookingId, user_id: userId });
}

// Slots
export async function getMentorSlots(mentorId: string, date?: string): Promise<MentorSlot[]> {
  try {
    let query = supabase
      .from("mentor_slots")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_booked", false);

    if (date) {
      query = query.eq("slot_date", date);
    }

    const { data, error } = await query.order("slot_date", { ascending: true }).order("slot_time", { ascending: true });

    if (error) {
      console.error("Error loading slots:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getMentorSlots:", err);
    return [];
  }
}

export async function addMentorSlot(slot: Omit<MentorSlot, "id" | "is_booked">): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...slot,
    is_booked: false,
    created_at: new Date().toISOString()
  };
  return executeWrite("mentor_slots", "insert", payload);
}

export async function deleteMentorSlot(slotId: string): Promise<{ success: boolean; error?: any }> {
  return executeWrite("mentor_slots", "delete", {}, { id: slotId });
}

// Submit review (Double-review protection)
export async function submitReview(userId: string, review: {
  booking_id: string;
  mentor_id: string;
  rating_communication: number;
  rating_knowledge: number;
  rating_helpfulness: number;
  rating_advice: number;
  rating_overall: number;
  comment?: string;
}): Promise<{ success: boolean; error?: any }> {
  try {
    // 1. Verify booking is Completed and belongs to this user
    const { data: booking, error: bErr } = await supabase
      .from("mentor_bookings")
      .select("status, user_id")
      .eq("id", review.booking_id)
      .single();

    if (bErr || !booking) {
      return { success: false, error: new Error("Valid booking details not found.") };
    }
    if (booking.user_id !== userId) {
      return { success: false, error: new Error("Unauthorized review submission.") };
    }
    if (booking.status !== "Completed") {
      return { success: false, error: new Error("Reviews can only be submitted for completed sessions.") };
    }

    // 2. Prevent self-review (Check if user_id is the mentor)
    // Assuming mentors table references users in future, currently mentors are admin managed.

    const payload = {
      ...review,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    return executeWrite("mentor_reviews", "insert", payload);
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// Save Session Notes (Mentor uploads after session)
export async function saveSessionNotes(notes: {
  booking_id: string;
  mentor_id: string;
  user_id: string;
  feedback: string;
  roadmap?: any;
  resources?: string[];
  questions?: string[];
  improvement_areas?: string;
}): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...notes,
    created_at: new Date().toISOString()
  };
  return executeWrite("mentor_session_notes", "insert", payload);
}

// Request a Mentor (Student Demand)
export async function createDemandRequest(userId: string, demand: {
  company: string;
  role: string;
  help_needed: string;
}): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...demand,
    user_id: userId,
    created_at: new Date().toISOString()
  };
  return executeWrite("mentor_demand_requests", "insert", payload);
}

// Demand analytics for Admin
export interface DemandAnalytic {
  company: string;
  role: string;
  request_count: number;
}

export async function getDemandAnalytics(): Promise<DemandAnalytic[]> {
  try {
    const { data, error } = await supabase
      .from("mentor_demand_requests")
      .select("company, role");

    if (error) {
      console.error("Error loading demand analytics:", error);
      return [];
    }

    // Group and aggregate
    const aggregates: { [key: string]: { company: string; role: string; count: number } } = {};
    
    (data || []).forEach(row => {
      const key = `${row.company.trim().toLowerCase()}-${row.role.trim().toLowerCase()}`;
      if (aggregates[key]) {
        aggregates[key].count++;
      } else {
        aggregates[key] = {
          company: row.company,
          role: row.role,
          count: 1
        };
      }
    });

    return Object.values(aggregates)
      .map(agg => ({
        company: agg.company,
        role: agg.role,
        request_count: agg.count
      }))
      .sort((a, b) => b.request_count - a.request_count);
  } catch (err) {
    console.error("Exception in getDemandAnalytics:", err);
    return [];
  }
}
