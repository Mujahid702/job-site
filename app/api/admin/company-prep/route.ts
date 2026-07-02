import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getCompanyPreps, getCompanyPrepBySlug, upsertCompanyPrep, deleteCompanyPrep } from '@/lib/db/company-prep';

export const dynamic = 'force-dynamic';

// GET: Returns list of all company preps, or specific one by slug
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const data = await getCompanyPrepBySlug(slug);
      if (!data) {
        return NextResponse.json({ success: false, message: 'Company prep not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data });
    }

    const data = await getCompanyPreps();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Company Prep GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: Creates or updates a company prep structure
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prep, rounds, resources } = body;

    if (!prep || !prep.slug || !prep.name || !prep.difficulty || !prep.salary_range) {
      return NextResponse.json(
        { success: false, message: 'Missing required metadata: slug, name, difficulty, salary_range.' },
        { status: 400 }
      );
    }

    const result = await upsertCompanyPrep(prep, rounds || [], resources || []);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error?.message || 'Failed to save company preparation.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Company preparation saved successfully.', prepId: result.prepId });
  } catch (err: any) {
    console.error('[Admin Company Prep POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// DELETE: Deletes a company prep
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Company Prep ID is required for deletion.' },
        { status: 400 }
      );
    }

    const result = await deleteCompanyPrep(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error?.message || 'Failed to delete company preparation.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Company preparation deleted successfully.' });
  } catch (err: any) {
    console.error('[Admin Company Prep DELETE] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
