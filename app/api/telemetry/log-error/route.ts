import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/telemetry";

/**
 * app/api/telemetry/log-error/route.ts
 * Public endpoint to allow the frontend to ingest telemetry crashes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.stackTrace) {
      return NextResponse.json({ success: false, error: "Missing stackTrace parameter" }, { status: 400 });
    }

    await logError({
      userId: body.userId,
      page: body.page,
      browser: body.browser,
      device: body.device,
      stackTrace: body.stackTrace,
      apiEndpoint: body.apiEndpoint,
      latency: body.latency
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
