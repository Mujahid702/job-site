import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { getCache, setCache, invalidateVerificationCache } from "@/lib/redis";
import { executeWrite } from "@/lib/db/sync";
import { recalculateRecruiterTrustScore } from "@/lib/db/verifications";

export const dynamic = "force-dynamic";

// GET: Load all verifications in queue
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";
    const cacheKey = "admin_verification_queue";

    if (!refresh) {
      const cached = await getCache<any[]>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, verifications: cached });
      }
    }

    // Query all records joining recruiter details
    const { data, error } = await supabase
      .from("recruiter_verifications")
      .select("*, recruiters(*)")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    await setCache(cacheKey, data || [], 900); // 15-minute TTL

    return NextResponse.json({ success: true, verifications: data || [] });
  } catch (err: any) {
    console.error("Admin verification fetch failed:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch verification queue." }, { status: 500 });
  }
}

// POST: Moderate verifications (single or bulk updates)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids, status, notes } = body; // ids is an array of recruiter_ids

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ success: false, message: "Missing required parameters: ids (array) and status." }, { status: 400 });
    }

    for (const recId of ids) {
      // Find verification record
      const { data: ver } = await supabase
        .from("recruiter_verifications")
        .select("id")
        .eq("recruiter_id", recId)
        .maybeSingle();

      const payload: any = {
        verification_status: status,
        verification_notes: notes || "",
        updated_at: new Date().toISOString()
      };

      if (status === "Verified") {
        payload.admin_verified = true;
        payload.verified_by = user.id;
        payload.verified_at = new Date().toISOString();
      } else if (status === "Rejected" || status === "Suspended") {
        payload.admin_verified = false;
        payload.verification_method = "Manual";
      }

      if (ver) {
        await executeWrite("recruiter_verifications", "update", payload, { id: ver.id });
      } else {
        await executeWrite("recruiter_verifications", "insert", {
          ...payload,
          recruiter_id: recId,
          created_at: new Date().toISOString()
        });
      }

      // Recalculate trust score
      await recalculateRecruiterTrustScore(recId);
      await invalidateVerificationCache(recId);
    }

    return NextResponse.json({ success: true, message: `Successfully updated ${ids.length} verification status(es) to ${status}` });
  } catch (err: any) {
    console.error("Admin verification action failed:", err);
    return NextResponse.json({ success: false, message: "Failed to process bulk moderation request." }, { status: 500 });
  }
}
