import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Fetch all offers for the logged-in user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { data: offers, error } = await supabase
      .from("offers")
      .select(`
        *,
        application:application_id (
          id,
          company,
          job_title,
          status,
          details
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, offers });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: Add or update a manual offer
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, company, role, ctc, baseSalary, bonus, location, joiningDate, status } = body;

    if (!applicationId || !company || !role || !ctc) {
      return NextResponse.json({ success: false, message: "Missing required fields (applicationId, company, role, ctc)." }, { status: 400 });
    }

    // 1. Calculate Heuristic Offer Strength Score and Benchmark Score
    let targetCtc = "10 LPA";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_ctc")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.target_ctc) {
        targetCtc = profile.target_ctc;
      }
    } catch (pErr) {}

    const parseNumber = (val: string | null | undefined): number => {
      if (!val) return 0;
      const matches = val.match(/[\d.]+/);
      return matches ? parseFloat(matches[0]) : 0;
    };
    
    const targetVal = parseNumber(targetCtc);
    const offerCtcVal = parseNumber(ctc);
    
    let strengthScore = 70;
    if (targetVal > 0 && offerCtcVal > 0) {
      strengthScore = Math.min(100, Math.max(40, Math.round((offerCtcVal / targetVal) * 80)));
    }
    
    const marketBenchmarkScore = Math.min(100, Math.max(50, 75 + Math.round((Math.random() - 0.5) * 15)));
    
    const negotiationSuggestions = [
      `Highlight your specific skills matching the ${role} role to request a review of the base salary component.`,
      `Request clarification on the performance bonus structures and annual cycles.`,
      `Given market standard benchmarks, inquire about potential sign-on bonuses to align with target expectations.`
    ];

    // 2. Upsert Offer record
    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .upsert({
        user_id: user.id,
        application_id: applicationId,
        company,
        role,
        ctc,
        base_salary: baseSalary || null,
        bonus: bonus || null,
        location: location || "Remote / Open Location",
        joining_date: joiningDate ? new Date(joiningDate).toISOString().split("T")[0] : null,
        status: status || "Pending",
        strength_score: strengthScore,
        market_benchmark_score: marketBenchmarkScore,
        negotiation_suggestions: negotiationSuggestions,
        updated_at: new Date().toISOString()
      }, { onConflict: "application_id" })
      .select()
      .single();

    if (offerError) {
      return NextResponse.json({ success: false, message: offerError.message }, { status: 400 });
    }

    // 3. Update the CRM Application details and status to "Offer Received"
    const { data: appData } = await supabase
      .from("applications")
      .select("details")
      .eq("id", applicationId)
      .single();

    const currentDetails = appData?.details || {};
    const updatedDetails = {
      ...currentDetails,
      offerExpiry: joiningDate || undefined,
      offer: {
        ctc,
        baseSalary: baseSalary || undefined,
        joiningBonus: bonus || undefined,
        location: location || "Remote / Open Location",
        joiningDate: joiningDate || undefined,
        growthRating: 4,
        exposureRating: 4,
        brandValueRating: 4,
        potentialRating: 4,
        strengthScore,
        marketBenchmarkScore,
        negotiationSuggestions
      }
    };

    const newAppStatus = (status === "Accepted") ? "Joined" : "Offer Received";

    await supabase
      .from("applications")
      .update({
        status: newAppStatus,
        details: updatedDetails,
        last_updated: new Date().toISOString()
      })
      .eq("id", applicationId);

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    await invalidateUserCache(user.id);

    return NextResponse.json({ success: true, offer: offerData });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH: Update Offer Status ('Pending', 'Accepted', 'Declined', 'Counter-offered')
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, status } = body;

    if (!offerId || !status) {
      return NextResponse.json({ success: false, message: "Missing required fields (offerId, status)." }, { status: 400 });
    }

    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (offerError || !offerData) {
      return NextResponse.json({ success: false, message: offerError?.message || "Offer not found." }, { status: 400 });
    }

    // Sync back application status
    let appStatus = "Offer Received";
    if (status === "Accepted") {
      appStatus = "Joined";
    } else if (status === "Declined") {
      appStatus = "Withdrawn";
    }

    await supabase
      .from("applications")
      .update({
        status: appStatus,
        last_updated: new Date().toISOString()
      })
      .eq("id", offerData.application_id);

    // Log history
    await supabase
      .from("application_history")
      .insert({
        application_id: offerData.application_id,
        status: appStatus,
        changed_at: new Date().toISOString(),
        notes: `Status updated via Offer board update to: ${status}`
      });

    // Invalidate Cache
    const { invalidateUserCache } = await import("@/lib/redis");
    await invalidateUserCache(user.id);

    return NextResponse.json({ success: true, offer: offerData });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
