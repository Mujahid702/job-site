import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getTemplates, saveTemplate, deleteTemplate } from '@/lib/db/portfolio';

export const dynamic = 'force-dynamic';

// GET: Returns list of portfolio templates
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const data = await getTemplates();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Portfolio Templates GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: Creates or updates a portfolio template
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
    const { id, name, theme, font_family, color_scheme, sections_config, is_active } = body;

    if (!name || !theme || !font_family || !color_scheme) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, theme, font_family, color_scheme.' },
        { status: 400 }
      );
    }

    const payload = {
      id,
      name,
      theme,
      font_family,
      color_scheme,
      sections_config: sections_config || {
        hero: true, about: true, skills: true, projects: true,
        experience: true, achievements: true, certifications: true, contact: true
      },
      is_active: is_active ?? true
    };

    const result = await saveTemplate(payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error?.message || 'Failed to save template.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Template saved successfully.' });
  } catch (err: any) {
    console.error('[Admin Portfolio Templates POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// DELETE: Deletes a template
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { success: false, message: 'Template ID is required for deletion.' },
        { status: 400 }
      );
    }

    const result = await deleteTemplate(templateId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error?.message || 'Failed to delete template.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Template deleted successfully.' });
  } catch (err: any) {
    console.error('[Admin Portfolio Templates DELETE] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
