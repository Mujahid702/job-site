import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAmbassadorStatus, applyAmbassador } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await getAmbassadorStatus(user.id, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to load ambassador status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ambassador: result.ambassador });
  } catch (err: any) {
    console.error("API growth ambassadors GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching ambassador details" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await applyAmbassador(user.id, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to apply." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Ambassador application submitted." });
  } catch (err: any) {
    console.error("API growth ambassadors POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error applying for ambassador" }, { status: 500 });
  }
}
