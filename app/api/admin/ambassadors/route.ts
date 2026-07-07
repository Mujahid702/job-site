import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { getAmbassadorList, updateAmbassadorStatus } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    throw new Error("Forbidden. Admin role required.");
  }
}

export async function GET() {
  try {
    await ensureAdmin();
    const supabase = await createClient();
    const result = await getAmbassadorList(supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to fetch ambassador list." }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: result.list });
  } catch (err: any) {
    console.error("API admin ambassadors GET failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Unauthorized" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    const body = await request.json().catch(() => ({}));
    const { id, status } = body; // status: "Approved" | "Rejected"

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "id and status are required." }, { status: 400 });
    }

    const result = await updateAmbassadorStatus(id, status, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to update status." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Ambassador application status updated." });
  } catch (err: any) {
    console.error("API admin ambassadors PUT failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to update ambassador" }, { status: 500 });
  }
}
