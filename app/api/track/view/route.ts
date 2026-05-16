import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch current views
    const { data: job, error: fetchError } = await supabase
      .from("job_postings")
      .select("views_count")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const currentViews = job.views_count || 0;

    // Update with incremented views
    const { error: updateError } = await supabase
      .from("job_postings")
      .update({ views_count: currentViews + 1 })
      .eq("id", jobId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, views: currentViews + 1 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
