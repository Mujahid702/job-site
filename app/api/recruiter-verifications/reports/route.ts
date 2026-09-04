import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { submitRecruiterReport } from "@/lib/db/verifications";
import { executeWrite } from "@/lib/db/sync";
import { calculateFraudRiskScore } from "@/lib/db/verifications";
import { invalidateVerificationCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET: Fetch all reports (Admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("recruiter_reports")
      .select("*, recruiters(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, reports: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

// POST: Submit report
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { recruiterId, reason, evidence } = body;

    if (!recruiterId || !reason) {
      return NextResponse.json({ success: false, message: "Missing recruiterId or reason parameters." }, { status: 400 });
    }

    const result = await submitRecruiterReport(recruiterId, user.id, { reason, evidence });
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Report filed successfully. Security teams will investigate." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

// PATCH: Resolve report status (Admin only)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { reportId, status } = body; // status: 'Resolved' | 'Dismissed'

    if (!reportId || !status) {
      return NextResponse.json({ success: false, message: "Missing required parameters." }, { status: 400 });
    }

    // Load report details
    const { data: rep } = await supabase
      .from("recruiter_reports")
      .select("recruiter_id")
      .eq("id", reportId)
      .single();

    if (!rep) {
      return NextResponse.json({ success: false, message: "Report not found." }, { status: 404 });
    }

    await executeWrite(
      "recruiter_reports",
      "update",
      {
        status,
        updated_at: new Date().toISOString()
      },
      { id: reportId }
    );

    // Recompute fraud risk score
    await calculateFraudRiskScore(rep.recruiter_id);
    await invalidateVerificationCache(rep.recruiter_id);

    return NextResponse.json({ success: true, message: `Report status updated to ${status}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
