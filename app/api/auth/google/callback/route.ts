import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (errorParam) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=${encodeURIComponent(errorParam)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=no_code_provided`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?redirect=/api/auth/google/callback?code=${code}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=token_exchange_failed`);
    }

    const { access_token, refresh_token } = tokenData;

    // 2. Fetch email profile from Google userInfo
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      console.error("Failed to fetch Google profile:", profileData);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=profile_fetch_failed`);
    }

    const gmailEmail = profileData.email;

    // 3. Get existing connection to preserve refresh token if necessary
    const { data: existingConnection } = await supabase
      .from("gmail_connections")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    const finalRefreshToken = refresh_token || existingConnection?.refresh_token;

    // 4. Save connection details in supabase
    const { error: dbError } = await supabase
      .from("gmail_connections")
      .upsert({
        user_id: user.id,
        gmail_email: gmailEmail,
        access_token: access_token,
        refresh_token: finalRefreshToken || null,
        connected_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Failed to store gmail connection details:", dbError);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=db_storage_failed`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync=success`);
  } catch (err: any) {
    console.error("Google callback exception:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&gmail_sync_error=unexpected_exception`);
  }
}
