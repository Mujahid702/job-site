import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ success: false, message: "Missing or invalid 'enabled' boolean parameter." }, { status: 400 });
    }

    const { error } = await supabase
      .from("gmail_connections")
      .update({ sync_enabled: enabled })
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enabled });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
