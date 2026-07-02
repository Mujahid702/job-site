import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("outlook_connections")
      .select("outlook_email, connected_at, last_sync, sync_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ 
        success: true, 
        connected: false, 
        outlookEmail: null, 
        lastSync: null,
        syncEnabled: false
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      outlookEmail: connection.outlook_email,
      lastSync: connection.last_sync,
      syncEnabled: connection.sync_enabled
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
