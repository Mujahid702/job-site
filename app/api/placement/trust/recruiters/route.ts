import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("verified_recruiters")
      .select("*")
      .order("recruiter_name", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, recruiter_name, recruiter_email, company, linkedin_url, verification_status, trust_score } = body;

    if (!recruiter_name || !recruiter_email) {
      return NextResponse.json({ success: false, message: "Name and email are required." }, { status: 400 });
    }

    const payload = {
      recruiter_name,
      recruiter_email,
      company,
      linkedin_url,
      verification_status: verification_status ?? 'Verified',
      trust_score: trust_score ?? 100,
      last_seen: new Date().toISOString()
    };

    let result;
    if (id) {
      result = await supabase
        .from("verified_recruiters")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("verified_recruiters")
        .insert({
          ...payload,
          first_seen: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("verified_recruiters")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Recruiter removed." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
