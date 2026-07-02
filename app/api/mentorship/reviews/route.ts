import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitReview } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, mentor_id, rating_communication, rating_knowledge, rating_helpfulness, rating_advice, rating_overall, comment } = body;

    if (!booking_id || !mentor_id || !rating_communication || !rating_knowledge || !rating_helpfulness || !rating_advice || !rating_overall) {
      return NextResponse.json({ success: false, message: "Missing required review rating scores" }, { status: 400 });
    }

    const result = await submitReview(user.id, {
      booking_id,
      mentor_id,
      rating_communication: Number(rating_communication),
      rating_knowledge: Number(rating_knowledge),
      rating_helpfulness: Number(rating_helpfulness),
      rating_advice: Number(rating_advice),
      rating_overall: Number(rating_overall),
      comment
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to submit review. Note: You can only submit one review per completed booking." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Review submitted successfully" });
  } catch (err: any) {
    console.error("POST /api/mentorship/reviews error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
