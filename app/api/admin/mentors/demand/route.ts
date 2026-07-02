import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { getDemandAnalytics } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const demand = await getDemandAnalytics();
    return NextResponse.json({ success: true, demand });
  } catch (err: any) {
    console.error("GET /api/admin/mentors/demand error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
