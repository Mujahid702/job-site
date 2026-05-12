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

    // Fetch current applications count
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("applications")
      .eq("id", jobId)
      .single();

    if (!fetchError) {
      const currentApps = job.applications || 0;

      // Update with incremented applications
      await supabase
        .from("jobs")
        .update({ applications: currentApps + 1 })
        .eq("id", jobId);
    }
  } catch (error) {
    console.error("Error tracking application:", error);
  }

  // Always redirect the user to the destination, even if tracking fails
  return NextResponse.redirect(redirectUrl);
}
