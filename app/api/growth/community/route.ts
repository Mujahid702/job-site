import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCommunityGroups, joinCommunityGroup, leaveCommunityGroup, saveCommunityGroup } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await getCommunityGroups(user.id, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || "Failed to load groups." }, { status: 500 });
    }

    return NextResponse.json({ success: true, groups: result.groups });
  } catch (err: any) {
    console.error("API growth community GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching community groups" }, { status: 500 });
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
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json({ success: false, message: "groupId is required." }, { status: 400 });
    }

    const result = await joinCommunityGroup(user.id, groupId, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to join group." }, { status: 400 });
    }

    return NextResponse.json({ success: true, nextCount: result.nextCount, message: "Joined group successfully." });
  } catch (err: any) {
    console.error("API growth community POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error joining community group" }, { status: 500 });
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
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ success: false, message: "groupId is required." }, { status: 400 });
    }

    const result = await leaveCommunityGroup(user.id, groupId, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to leave group." }, { status: 400 });
    }

    return NextResponse.json({ success: true, nextCount: result.nextCount, message: "Left group successfully." });
  } catch (err: any) {
    console.error("API growth community DELETE failed:", err);
    return NextResponse.json({ success: false, message: "Server error leaving community group" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { groupId, status } = body;

    if (!groupId || status === undefined) {
      return NextResponse.json({ success: false, message: "groupId and status are required." }, { status: 400 });
    }

    const result = await saveCommunityGroup(user.id, groupId, status, supabase);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error || "Failed to update save status." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Group bookmark updated." });
  } catch (err: any) {
    console.error("API growth community PUT failed:", err);
    return NextResponse.json({ success: false, message: "Server error updating save status" }, { status: 500 });
  }
}
