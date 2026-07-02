import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runEmailVerification } from "@/lib/recruitment-trust";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const { sender, subject, body: emailBody, headers, spf, dkim, dmarc } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json({ success: false, message: "Missing sender, subject, or email body." }, { status: 400 });
    }

    const verification = await runEmailVerification(
      user?.id || "guest-user",
      { sender, subject, body: emailBody, headers, spf, dkim, dmarc },
      supabase
    );

    return NextResponse.json({ success: true, verification });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
