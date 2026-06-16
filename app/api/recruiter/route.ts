import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecruiters, createRecruiter, calculateRelationshipScore, classifyRelationshipLevel } from "@/lib/db/recruiters";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const company = searchParams.get("company") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const strength = searchParams.get("strength") || undefined;
    const sortField = searchParams.get("sortField") || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    // Fetch recruiters
    const recruiters = await getRecruiters(user.id, {
      search,
      company,
      stage,
      strength,
      sortField,
      sortOrder
    });

    // Bulk load activities to avoid N+1 queries
    const { data: activities } = await supabase
      .from("recruiter_activities")
      .select("*")
      .eq("user_id", user.id);

    const activitiesList = activities || [];

    // Calculate dynamic scores and levels
    const enrichedRecruiters = recruiters.map(r => {
      const recActivities = activitiesList.filter(a => a.recruiter_id === r.id);
      const score = calculateRelationshipScore(r, recActivities);
      const level = classifyRelationshipLevel(score);
      return {
        ...r,
        relationshipScore: score,
        relationshipLevel: level
      };
    });

    return NextResponse.json({
      success: true,
      recruiters: enrichedRecruiters
    });
  } catch (err: any) {
    console.error("API recruiters GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching recruiters" }, { status: 500 });
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
    const {
      name,
      company,
      designation,
      linkedin_url,
      email,
      phone,
      location,
      hiring_roles,
      relationship_strength,
      pipeline_stage,
      notes,
      tags
    } = body;

    if (!name || !company) {
      return NextResponse.json({ success: false, message: "Name and Company are required fields." }, { status: 400 });
    }

    // Duplicate Check logic
    const orConditions: string[] = [];
    if (linkedin_url && linkedin_url.trim()) {
      orConditions.push(`linkedin_url.eq.${linkedin_url.trim()}`);
    }
    if (email && email.trim()) {
      orConditions.push(`email.eq.${email.trim()}`);
    }
    // Always check for same name + company combination
    orConditions.push(`and(name.eq."${name.replace(/"/g, '\\"')}",company.eq."${company.replace(/"/g, '\\"')}")`);

    const { data: duplicate } = await supabase
      .from("recruiters")
      .select("id")
      .eq("user_id", user.id)
      .or(orConditions.join(","))
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json({
        success: false,
        message: "Duplicate found. Recruiter already exists with matching LinkedIn URL, Email, or Name + Company."
      }, { status: 409 });
    }

    // Create Recruiter
    const result = await createRecruiter(user.id, {
      name,
      company,
      designation,
      linkedin_url,
      email,
      phone,
      location,
      hiring_roles,
      relationship_strength,
      pipeline_stage,
      notes,
      tags
    });

    if (result.success && result.data) {
      const score = calculateRelationshipScore(result.data, []);
      
      // Log event
      await logAnalyticsEvent("recruiter_added", user.id, {
        recruiterId: result.data.id,
        company: result.data.company,
        stage: result.data.pipeline_stage,
        relationshipScore: score
      });

      return NextResponse.json({
        success: true,
        recruiter: {
          ...result.data,
          relationshipScore: score,
          relationshipLevel: classifyRelationshipLevel(score)
        }
      });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to create recruiter" }, { status: 500 });
  } catch (err: any) {
    console.error("API recruiters POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error creating recruiter" }, { status: 500 });
  }
}
