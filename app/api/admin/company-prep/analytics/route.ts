import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getCompanyPrepAnalyticsList } from '@/lib/db/company-prep';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const data = await getCompanyPrepAnalyticsList();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Company Prep Analytics GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
