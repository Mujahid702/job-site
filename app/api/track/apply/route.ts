import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("id");
  const redirectUrl = searchParams.get("url");

  if (!jobId || !redirectUrl) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Fetch complete job details to sync to CRM tracker
    const { data: job, error: fetchError } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!fetchError && job) {
      const currentApps = job.applications_count || 0;

      // Update with incremented applications
      await supabase
        .from("job_postings")
        .update({ applications_count: currentApps + 1 })
        .eq("id", jobId);

      // Authenticate user session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { trackSavedJob } = await import("@/lib/db/applications");
        await trackSavedJob(user.id, job, "Applied");

        // Self-healing Referral Conversion Check:
        try {
          const { processReferralConversion } = await import("@/lib/db/growth");
          await processReferralConversion(user.id);
        } catch (e) {
          console.error("Failed to run self-healing referral conversion in track apply:", e);
        }
      }
    }
  } catch (error) {
    console.error("Error tracking application:", error);
  }

  // Always redirect the user to the destination, even if tracking fails
  return NextResponse.redirect(redirectUrl);
}
