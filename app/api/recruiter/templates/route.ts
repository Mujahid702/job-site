import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplates } from "@/lib/db/recruiters";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const templates = await getTemplates(user.id);
    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    console.error("API templates GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching templates" }, { status: 500 });
  }
}
