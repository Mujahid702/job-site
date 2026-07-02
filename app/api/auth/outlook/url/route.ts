import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    if (!clientId || clientId === "YOUR_OUTLOOK_CLIENT_ID") {
      return NextResponse.json({ 
        success: false, 
        message: "Outlook Client ID not configured in environment." 
      }, { status: 500 });
    }

    const redirectUri = `${appUrl}/api/auth/outlook/callback`;

    // Request offline_access, User.Read and Calendars.ReadWrite scopes
    const scopes = [
      "offline_access",
      "User.Read",
      "Calendars.ReadWrite"
    ].join(" ");

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&prompt=consent`;

    return NextResponse.json({ success: true, url: authUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
