import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getAdminAnalyticsDashboardData, logAdminAction } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

// GET: Fetch admin dashboard analytics
export async function GET(request: Request) {
  try {
    // 1. Server-side role validation
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // 3. Retrieve aggregates data (using lazy caching/calculations)
    const data = await getAdminAnalyticsDashboardData(refresh);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in admin analytics GET route:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

// POST: Trigger admin actions (e.g. log manual actions, clear cache)
export async function POST(request: Request) {
  try {
    // 1. Server-side role validation
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, details } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: "Action parameter is required." },
        { status: 400 }
      );
    }

    if (action === "log_action") {
      const result = await logAdminAction(details.actionName || "Manual Action", details.actionData || {});
      return NextResponse.json({ success: result.success, error: result.error });
    }

    if (action === "refresh_cache") {
      const data = await getAdminAnalyticsDashboardData(true);
      await logAdminAction("Cache Flushed", { timestamp: new Date().toISOString() });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, message: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error in admin analytics POST route:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
