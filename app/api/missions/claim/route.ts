import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimMissionReward } from "@/lib/db/missions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to claim mission rewards." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userMissionId } = body;

    if (!userMissionId) {
      return NextResponse.json(
        { error: "userMissionId is required in the request body." },
        { status: 400 }
      );
    }

    const result = await claimMissionReward(user.id, userMissionId, supabase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to claim reward." },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error("API claim mission reward error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
