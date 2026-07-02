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
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=${encodeURIComponent(errorParam)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=no_code_provided`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?redirect=/api/auth/outlook/callback?code=${code}`);
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/outlook/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId || "",
        scope: "offline_access User.Read Calendars.ReadWrite",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_secret: clientSecret || ""
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Outlook token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=token_exchange_failed`);
    }

    const { access_token, refresh_token } = tokenData;

    // 2. Fetch user profile from Microsoft Graph
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      console.error("Failed to fetch Outlook/Microsoft profile:", profileData);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=profile_fetch_failed`);
    }

    const outlookEmail = profileData.mail || profileData.userPrincipalName || "outlook_connected_user";

    // 3. Get existing connection to preserve refresh token if necessary
    const { data: existingConnection } = await supabase
      .from("outlook_connections")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    const finalRefreshToken = refresh_token || existingConnection?.refresh_token;

    // 4. Save connection details in supabase
    const { error: dbError } = await supabase
      .from("outlook_connections")
      .upsert({
        user_id: user.id,
        outlook_email: outlookEmail,
        access_token: access_token,
        refresh_token: finalRefreshToken || null,
        connected_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Failed to store outlook connection details:", dbError);
      return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=db_storage_failed`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync=success`);
  } catch (err: any) {
    console.error("Outlook callback exception:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard?tab=placement-tracker&outlook_sync_error=unexpected_exception`);
  }
}
