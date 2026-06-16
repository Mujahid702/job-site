import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterById, updateRecruiter, deleteRecruiter, createRecruiterActivity, calculateRelationshipScore, classifyRelationshipLevel } from "@/lib/db/recruiters";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const recruiter = await getRecruiterById(id, user.id);
    if (!recruiter) {
      return NextResponse.json({ success: false, message: "Recruiter not found." }, { status: 404 });
    }

    // Get activities
    const { data: activities } = await supabase
      .from("recruiter_activities")
      .select("*")
      .eq("recruiter_id", id);

    const score = calculateRelationshipScore(recruiter, activities || []);

    return NextResponse.json({
      success: true,
      recruiter: {
        ...recruiter,
        relationshipScore: score,
        relationshipLevel: classifyRelationshipLevel(score)
      }
    });
  } catch (err: any) {
    console.error("API recruiter GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching recruiter" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // 1. Fetch current recruiter state
    const currentRecruiter = await getRecruiterById(id, user.id);
    if (!currentRecruiter) {
      return NextResponse.json({ success: false, message: "Recruiter not found." }, { status: 444 });
    }

    // 2. Perform updates
    const result = await updateRecruiter(id, body, user.id);

    if (result.success && result.data) {
      const updatedRecruiter = result.data;

      // 3. Side effects based on pipeline stage transitions
      if (body.pipeline_stage && body.pipeline_stage !== currentRecruiter.pipeline_stage) {
        
        // Log stage transition activity
        await createRecruiterActivity(
          id, 
          user.id, 
          "Pipeline Stage Updated", 
          `Stage changed from '${currentRecruiter.pipeline_stage}' to '${body.pipeline_stage}'`
        );

        // Track event
        await logAnalyticsEvent("pipeline_updated", user.id, {
          recruiterId: id,
          company: updatedRecruiter.company,
          stage: body.pipeline_stage
        });

        // A. Referral Received → Increase Readiness Score
        if (body.pipeline_stage === "Referral Received") {
          try {
            const { data: readiness } = await supabase
              .from("placement_readiness")
              .select("mission_bonus_score")
              .eq("user_id", user.id)
              .maybeSingle();

            const currentBonus = readiness?.mission_bonus_score || 0;
            await supabase
              .from("placement_readiness")
              .upsert({
                user_id: user.id,
                mission_bonus_score: currentBonus + 5,
                last_updated: new Date().toISOString()
              }, { onConflict: "user_id" });

            // Trigger score recalculation
            const { calculatePRIScore } = await import("@/lib/db/placement-readiness");
            await calculatePRIScore(user.id, undefined, supabase);
            
            await logAnalyticsEvent("referral_received", user.id, {
              recruiterId: id,
              company: updatedRecruiter.company
            });
          } catch (e) {
            console.error("Failed to update readiness score on referral:", e);
          }
        }

        // B. Interview Opportunity → Create Application Entry
        if (body.pipeline_stage === "Interview Opportunity") {
          try {
            const { createApplication } = await import("@/lib/db/applications");
            await createApplication(user.id, {
              companyName: updatedRecruiter.company,
              role: updatedRecruiter.designation || "Software Engineer",
              status: "Technical Interview",
              notes: `Recruiter Outreach with ${updatedRecruiter.name} converted to Interview!`,
              applicationDate: new Date().toISOString().split("T")[0]
            }, supabase);

            await logAnalyticsEvent("interview_opportunity", user.id, {
              recruiterId: id,
              company: updatedRecruiter.company
            });
          } catch (e) {
            console.error("Failed to create application on interview opportunity:", e);
          }
        }

        // C. Hired → Trigger mission XP triggers & update tracking metrics
        if (body.pipeline_stage === "Hired") {
          try {
            const { triggerMissionProgress } = await import("@/lib/db/missions");
            await triggerMissionProgress(user.id, "applications", 1, undefined, supabase);
            
            // Try to find the company application and update it to "Joined"
            const { data: matchingApps } = await supabase
              .from("applications")
              .select("id")
              .eq("user_id", user.id)
              .eq("company", updatedRecruiter.company)
              .limit(1);

            if (matchingApps && matchingApps.length > 0) {
              const { updateApplicationStatus } = await import("@/lib/db/applications");
              await updateApplicationStatus(matchingApps[0].id, "Joined", user.id, "Marked as Joined via Recruiter CRM Hired pipeline event.", supabase);
            }
          } catch (e) {
            console.error("Failed to trigger success metrics on hired:", e);
          }
        }

        // D. Referral Requested event logging
        if (body.pipeline_stage === "Referral Requested") {
          await logAnalyticsEvent("referral_requested", user.id, {
            recruiterId: id,
            company: updatedRecruiter.company
          });
        }
      }

      // Check if relationship strength changed
      if (body.relationship_strength && body.relationship_strength !== currentRecruiter.relationship_strength) {
        await createRecruiterActivity(
          id,
          user.id,
          "Relationship Status Changed",
          `Connection strength updated to '${body.relationship_strength}'`
        );
      }

      // Get latest score
      const { data: recActivities } = await supabase
        .from("recruiter_activities")
        .select("*")
        .eq("recruiter_id", id);

      const score = calculateRelationshipScore(updatedRecruiter, recActivities || []);

      return NextResponse.json({
        success: true,
        recruiter: {
          ...updatedRecruiter,
          relationshipScore: score,
          relationshipLevel: classifyRelationshipLevel(score)
        }
      });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to update recruiter" }, { status: 500 });
  } catch (err: any) {
    console.error("API recruiter PATCH failed:", err);
    return NextResponse.json({ success: false, message: "Server error updating recruiter" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteRecruiter(id, user.id);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Recruiter deleted successfully." });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to delete recruiter" }, { status: 500 });
  } catch (err: any) {
    console.error("API recruiter DELETE failed:", err);
    return NextResponse.json({ success: false, message: "Server error deleting recruiter" }, { status: 500 });
  }
}
