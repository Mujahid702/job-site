import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

/**
 * app/api/admin/feature-flags/route.ts
 * GET: Retrieves all platform feature flags.
 * POST: Updates or toggles a feature flag (Admin restricted).
 */

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("key", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, flags: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user))) {
      return NextResponse.json({ success: false, error: "Unauthorized access: admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    if (!body.key || typeof body.enabled !== "boolean") {
      return NextResponse.json({ success: false, error: "Missing required parameters: key (string) and enabled (boolean)" }, { status: 400 });
    }

    // Capture state before change for audit logs
    const { data: beforeData } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", body.key)
      .single();

    // Perform feature flag update
    const { error } = await supabase
      .from("feature_flags")
      .update({
        enabled: body.enabled,
        updated_at: new Date().toISOString()
      })
      .eq("key", body.key);

    if (error) throw error;

    // Log the action to public.admin_audit_logs
    await supabase.from("admin_audit_logs").insert([
      {
        admin_name: user.email || "System Admin",
        action: "Modified Feature Flag",
        details: `Toggled feature flag "${body.key}" to ${body.enabled}`,
        before_state: { enabled: beforeData?.enabled ?? true },
        after_state: { enabled: body.enabled },
        ip: req.headers.get("x-forwarded-for") || "unknown",
        device: req.headers.get("user-agent") || "unknown"
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
