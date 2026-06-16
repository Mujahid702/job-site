import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitVerificationDetails } from "@/lib/db/verifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recruiterId, documentUrl, linkedinUrl } = body;

    if (!recruiterId) {
      return NextResponse.json({ success: false, message: "Missing recruiterId parameter." }, { status: 400 });
    }

    const result = await submitVerificationDetails(recruiterId, { documentUrl, linkedinUrl });
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Verification application submitted for review!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
