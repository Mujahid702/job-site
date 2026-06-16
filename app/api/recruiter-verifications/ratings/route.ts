import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitRecruiterRating } from "@/lib/db/verifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recruiterId, professionalism, response_time, helpfulness, referral_quality, communication, feedbackText } = body;

    if (!recruiterId || !professionalism || !response_time || !helpfulness || !referral_quality || !communication) {
      return NextResponse.json({ success: false, message: "Missing required rating parameters." }, { status: 400 });
    }

    const result = await submitRecruiterRating(recruiterId, user.id, {
      professionalism: Number(professionalism),
      response_time: Number(response_time),
      helpfulness: Number(helpfulness),
      referral_quality: Number(referral_quality),
      communication: Number(communication),
      feedbackText
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully! Reputation scores updated." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
