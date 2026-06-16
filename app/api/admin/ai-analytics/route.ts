import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getAiCostAnalytics } from '@/lib/db/ai-analytics';

export const dynamic = 'force-dynamic';

// GET: Returns aggregated AI Gateway usage and cost metrics
export async function GET(request: Request) {
  try {
    // 1. Role validation check
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    // 2. Compute cost metrics from database
    const data = await getAiCostAnalytics();

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin AI Analytics GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
