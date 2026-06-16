import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyCorporateEmailOtp } from "@/lib/db/verifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recruiterId, email, otp } = body;

    if (!recruiterId || !email || !otp) {
      return NextResponse.json({ success: false, message: "Missing required parameters." }, { status: 400 });
    }

    const result = await verifyCorporateEmailOtp(recruiterId, email, otp, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Corporate email successfully verified!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
