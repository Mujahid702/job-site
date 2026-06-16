import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateLinkedInAuthenticityScore, submitVerificationDetails } from "@/lib/db/verifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recruiterId, linkedinUrl } = body;

    if (!recruiterId || !linkedinUrl) {
      return NextResponse.json({ success: false, message: "Missing required parameters." }, { status: 400 });
    }

    const score = calculateLinkedInAuthenticityScore(linkedinUrl);
    if (score === 0) {
      return NextResponse.json({ success: false, message: "Invalid LinkedIn URL format. Must link to a valid /in/ profile." }, { status: 400 });
    }

    const result = await submitVerificationDetails(recruiterId, { linkedinUrl });
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      authenticityScore: score,
      verified: score >= 70,
      message: score >= 70 
        ? "LinkedIn profile verified successfully!" 
        : "LinkedIn profile loaded. Pending additional confirmation."
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
