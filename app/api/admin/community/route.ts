import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { executeWrite } from "@/lib/db/sync";

export const dynamic = "force-dynamic";

// Helper: Ensure user is authorized admin
async function ensureAdmin() {
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    throw new Error("Forbidden. Admin role required.");
  }
}

export async function GET() {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    const { data: groups, error } = await supabase
      .from("community_groups")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, groups: groups || [] });
  } catch (err: any) {
    console.error("API admin community GET failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Unauthorized" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const {
      groupName,
      groupDescription,
      groupCategory,
      platformType,
      groupLink,
      groupImage,
      groupBanner,
      groupStatus,
      visibility,
      displayOrder,
      featured,
      verificationStatus,
      unlockMinProfileCompletion,
      unlockMinAtsScore,
      unlockResumeUploaded,
      unlockOnboardingCompleted
    } = body;

    if (!groupName || !groupCategory || !platformType || !groupLink) {
      return NextResponse.json({ success: false, message: "Missing required group details." }, { status: 400 });
    }

    try {
      new URL(groupLink);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid invite link URL format." }, { status: 400 });
    }

    const { data: duplicateLink } = await supabase
      .from("community_groups")
      .select("id")
      .eq("group_link", groupLink)
      .maybeSingle();

    if (duplicateLink) {
      return NextResponse.json({ success: false, message: "A community group with this invite link already exists." }, { status: 400 });
    }

    const payload = {
      group_name: groupName,
      group_description: groupDescription || "",
      group_category: groupCategory,
      platform_type: platformType,
      group_link: groupLink,
      group_image: groupImage || "",
      group_banner: groupBanner || "",
      group_status: groupStatus || "Active",
      visibility: visibility || "Public",
      display_order: displayOrder || 0,
      featured: featured || false,
      member_count: 0,
      created_by: user?.id || null,
      verification_status: verificationStatus || "Verified",
      unlock_min_profile_completion: unlockMinProfileCompletion || 0,
      unlock_min_ats_score: unlockMinAtsScore || 0,
      unlock_resume_uploaded: unlockResumeUploaded || false,
      unlock_onboarding_completed: unlockOnboardingCompleted || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const res = await executeWrite("community_groups", "insert", payload, undefined, supabase);
    if (!res.success) throw res.error;

    // Invalidate Cache
    const { invalidateGrowthCache } = await import("@/lib/redis");
    invalidateGrowthCache("groups_list").catch(console.error);

    return NextResponse.json({ success: true, message: "Community group created successfully." });
  } catch (err: any) {
    console.error("API admin community POST failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to create group." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    const body = await request.json().catch(() => ({}));
    const {
      id,
      groupName,
      groupDescription,
      groupCategory,
      platformType,
      groupLink,
      groupImage,
      groupBanner,
      groupStatus,
      visibility,
      displayOrder,
      featured,
      verificationStatus,
      unlockMinProfileCompletion,
      unlockMinAtsScore,
      unlockResumeUploaded,
      unlockOnboardingCompleted,
      memberCount
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Group ID is required for editing." }, { status: 400 });
    }

    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (groupName !== undefined) payload.group_name = groupName;
    if (groupDescription !== undefined) payload.group_description = groupDescription;
    if (groupCategory !== undefined) payload.group_category = groupCategory;
    if (platformType !== undefined) payload.platform_type = platformType;
    if (groupLink !== undefined) {
      try {
        new URL(groupLink);
      } catch {
        return NextResponse.json({ success: false, message: "Invalid invite link URL format." }, { status: 400 });
      }

      const { data: duplicateLink } = await supabase
        .from("community_groups")
        .select("id")
        .eq("group_link", groupLink)
        .neq("id", id)
        .maybeSingle();

      if (duplicateLink) {
        return NextResponse.json({ success: false, message: "A community group with this invite link already exists." }, { status: 400 });
      }
      payload.group_link = groupLink;
    }
    if (groupImage !== undefined) payload.group_image = groupImage;
    if (groupBanner !== undefined) payload.group_banner = groupBanner;
    if (groupStatus !== undefined) payload.group_status = groupStatus;
    if (visibility !== undefined) payload.visibility = visibility;
    if (displayOrder !== undefined) payload.display_order = displayOrder;
    if (featured !== undefined) payload.featured = featured;
    if (verificationStatus !== undefined) payload.verification_status = verificationStatus;
    if (unlockMinProfileCompletion !== undefined) payload.unlock_min_profile_completion = unlockMinProfileCompletion;
    if (unlockMinAtsScore !== undefined) payload.unlock_min_ats_score = unlockMinAtsScore;
    if (unlockResumeUploaded !== undefined) payload.unlock_resume_uploaded = unlockResumeUploaded;
    if (unlockOnboardingCompleted !== undefined) payload.unlock_onboarding_completed = unlockOnboardingCompleted;
    if (memberCount !== undefined) payload.member_count = memberCount;

    const res = await executeWrite("community_groups", "update", payload, { id }, supabase);
    if (!res.success) throw res.error;

    // Invalidate Cache
    const { invalidateGrowthCache } = await import("@/lib/redis");
    invalidateGrowthCache("groups_list").catch(console.error);

    return NextResponse.json({ success: true, message: "Community group updated successfully." });
  } catch (err: any) {
    console.error("API admin community PUT failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to update group." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureAdmin();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "id parameter is required." }, { status: 400 });
    }

    const res = await executeWrite("community_groups", "delete", null, { id }, supabase);
    if (!res.success) throw res.error;

    // Invalidate Cache
    const { invalidateGrowthCache } = await import("@/lib/redis");
    invalidateGrowthCache("groups_list").catch(console.error);

    return NextResponse.json({ success: true, message: "Community group deleted successfully." });
  } catch (err: any) {
    console.error("API admin community DELETE failed:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to delete group." }, { status: 500 });
  }
}
