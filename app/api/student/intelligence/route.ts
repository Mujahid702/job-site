import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentIntelligenceProfile } from "@/lib/ai/intelligence";

/**
 * app/api/student/intelligence/route.ts
 * GET: Retrieves the Unified Student Intelligence Profile context.
 * POST: Updates student target companies, skills, or self-reported milestones (Admin or User owner).
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getStudentIntelligenceProfile(user.id);
    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { error } = await supabase
      .from("student_intelligence_profiles")
      .upsert({
        user_id: user.id,
        academic_info: body.academicInfo || {},
        target_roles: body.targetRoles || ["Software Engineer"],
        preferred_companies: body.preferredCompanies || ["Google"],
        skills_mastery: body.skillsMastery || {},
        assessment_scores: body.assessmentScores || { aptitude: 60, coding: 55, reasoning: 65, verbal: 70, sql: 50 },
        interview_scores: body.interviewScores || { technical: 50, behavioral: 60, communication: 65 },
        learning_speed: body.learningSpeed || 1.0,
        study_consistency: body.studyConsistency || 0.8,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
