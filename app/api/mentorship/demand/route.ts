import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDemandRequest } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    const body = await request.json();
    const { company, role, help_needed } = body;

    if (!company || !role) {
      return NextResponse.json({ success: false, message: "Company and Role are required parameters" }, { status: 400 });
    }

    const result = await createDemandRequest(user.id, {
      company,
      role,
      help_needed: help_needed || ""
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to submit request" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mentor demand request logged successfully" });
  } catch (err: any) {
    console.error("POST /api/mentorship/demand error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
