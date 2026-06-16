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

export async function getMentorBookings(userId: string): Promise<MentorBooking[]> {
  try {
    const { data, error } = await supabase
      .from("mentor_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("booking_date", { ascending: false });

    if (error) {
      console.error("Error loading mentor bookings:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception in getMentorBookings:", err);
    return [];
  }
}

export async function bookSession(userId: string, booking: Omit<MentorBooking, "user_id" | "created_at">): Promise<{ success: boolean; error?: any }> {
  const payload = {
    ...booking,
    user_id: userId,
    created_at: new Date().toISOString()
  };
  return executeWrite("mentor_bookings", "insert", payload);
}

export async function updateBooking(userId: string, bookingId: string, updates: Partial<Omit<MentorBooking, "id" | "user_id" | "created_at">>): Promise<{ success: boolean; error?: any }> {
  return executeWrite("mentor_bookings", "update", updates, { id: bookingId, user_id: userId });
}

