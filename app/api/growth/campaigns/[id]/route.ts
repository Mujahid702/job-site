import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { sendCampaign } from "@/lib/db/growth";
import { executeWrite } from "@/lib/db/sync";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, title, type, messageTemplate, scheduledAt, status, targetGroup } = body;

    if (action === "send") {
      const sendResult = await sendCampaign(id);
      if (sendResult.success) {
        return NextResponse.json({ success: true, message: "Campaign broadcast triggered successfully." });
      }
      return NextResponse.json({ success: false, message: sendResult.error?.message || "Failed to trigger broadcast." }, { status: 500 });
    }

    // Normal PATCH update
    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (type !== undefined) updatePayload.type = type;
    if (messageTemplate !== undefined) updatePayload.message_template = messageTemplate;
    if (scheduledAt !== undefined) updatePayload.scheduled_at = scheduledAt;
    if (status !== undefined) updatePayload.status = status;
    if (targetGroup !== undefined) updatePayload.target_group = targetGroup;
    updatePayload.updated_at = new Date().toISOString();

    const result = await executeWrite("whatsapp_campaigns", "update", updatePayload, { id });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Campaign updated successfully." });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to update campaign." }, { status: 500 });
  } catch (err: any) {
    console.error("API growth campaigns PATCH failed:", err);
    return NextResponse.json({ success: false, message: "Server error updating campaign" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await executeWrite("whatsapp_campaigns", "delete", {}, { id });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Campaign deleted successfully." });
    }

    return NextResponse.json({ success: false, message: result.error?.message || "Failed to delete campaign." }, { status: 500 });
  } catch (err: any) {
    console.error("API growth campaigns DELETE failed:", err);
    return NextResponse.json({ success: false, message: "Server error deleting campaign" }, { status: 500 });
  }
}
