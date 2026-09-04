import { NextResponse } from "next/server";
import { resetMissions } from "@/lib/db/missions";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    // 1. Authorization check
    // Support cron header secret or active admin user session
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    let isAuthorized = isCronAuthorized;

    if (!isAuthorized) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (await isAdmin(user))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Reset action forbidden." },
        { status: 401 }
      );
    }

    // 2. Query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "daily" | "weekly";

    if (!type || (type !== "daily" && type !== "weekly")) {
      return NextResponse.json(
        { error: "Invalid type parameter. Specify 'daily' or 'weekly'." },
        { status: 400 }
      );
    }

    const result = await resetMissions(type, supabase);
    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to reset ${type} missions.` },
        { status: 550 }
      );
    }

    return NextResponse.json(
      { message: `Successfully reset all ${type} user missions.` },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("API reset missions error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
