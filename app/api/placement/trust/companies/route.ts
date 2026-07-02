import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("verified_companies")
      .select("*")
      .order("company_name", { ascending: true });

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
    const { id, company_name, careers_domain, official_website, careers_page, trust_score, verified } = body;

    if (!company_name) {
      return NextResponse.json({ success: false, message: "Company name is required." }, { status: 400 });
    }

    const payload = {
      company_name,
      careers_domain,
      official_website,
      careers_page,
      trust_score: trust_score ?? 100,
      verified: verified ?? true
    };

    let result;
    if (id) {
      result = await supabase
        .from("verified_companies")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("verified_companies")
        .insert(payload)
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
      .from("verified_companies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Company removed." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
