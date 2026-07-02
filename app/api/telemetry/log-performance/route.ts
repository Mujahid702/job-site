import { NextRequest, NextResponse } from "next/server";
import { logPerformance } from "@/lib/telemetry";

/**
 * app/api/telemetry/log-performance/route.ts
 * Public endpoint to allow the frontend to ingest user web-vitals load metrics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await logPerformance({
      userId: body.userId,
      pageLoadMs: body.pageLoadMs,
      lcpMs: body.lcpMs,
      fidMs: body.fidMs,
      apiLatencyMs: body.apiLatencyMs,
      aiLatencyMs: body.aiLatencyMs,
      dbLatencyMs: body.dbLatencyMs,
      redisLatencyMs: body.redisLatencyMs,
      memoryUsageMb: body.memoryUsageMb,
      cpuUsagePct: body.cpuUsagePct
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
