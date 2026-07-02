import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { error } = await supabase
      .from("gmail_connections")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete gmail connection:", error);
      return NextResponse.json({ success: false, message: "Failed to disconnect Gmail connection." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Gmail disconnected successfully." });
  } catch (err: any) {
    console.error("Disconnect route exception:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
