import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getCampaigns, createCampaign } from "@/lib/db/growth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const campaigns = await getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    console.error("API growth campaigns GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error fetching campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, type, messageTemplate, scheduledAt, targetGroup } = body;

    if (!title || !type || !messageTemplate) {
      return NextResponse.json({ success: false, message: "title, type, and messageTemplate are required." }, { status: 400 });
    }

    const result = await createCampaign({
      title,
      type,
      messageTemplate,
      scheduledAt,
      targetGroup
    });

    if (result.success) {
      return NextResponse.json({ success: true, campaign: result.data });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to create campaign." }, { status: 500 });
  } catch (err: any) {
    console.error("API growth campaigns POST failed:", err);
    return NextResponse.json({ success: false, message: "Server error creating campaign" }, { status: 500 });
  }
}
