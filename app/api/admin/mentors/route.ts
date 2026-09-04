import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { adminGetMentors, addMentor } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const mentors = await adminGetMentors();
    return NextResponse.json({ success: true, mentors });
  } catch (err: any) {
    console.error("GET /api/admin/mentors error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, profile_photo, headline, bio, company, job_title, years_experience, skills, specializations, session_types, pricing_type, session_price, currency, availability_status, verified_status, featured_status, linkedin_url, portfolio_url, email, location, languages, max_sessions_per_week, active_status } = body;

    if (!full_name || !company || !job_title) {
      return NextResponse.json({ success: false, message: "Name, Company, and Job Title are required fields" }, { status: 400 });
    }

    const result = await addMentor({
      full_name,
      profile_photo: profile_photo || "",
      headline: headline || "",
      bio: bio || "",
      company,
      job_title,
      years_experience: Number(years_experience || 0),
      skills: skills || [],
      specializations: specializations || [],
      session_types: session_types || [],
      pricing_type: pricing_type || 'FREE',
      session_price: Number(session_price || 0),
      currency: currency || 'USD',
      availability_status: availability_status || 'Available',
      verified_status: verified_status || 'None',
      featured_status: !!featured_status,
      linkedin_url: linkedin_url || "",
      portfolio_url: portfolio_url || "",
      email: email || "",
      location: location || "",
      languages: languages || ["English"],
      max_sessions_per_week: Number(max_sessions_per_week || 5),
      active_status: active_status !== undefined ? !!active_status : true
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error?.message || "Failed to add mentor profile" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mentor profile created successfully" });
  } catch (err: any) {
    console.error("POST /api/admin/mentors error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
