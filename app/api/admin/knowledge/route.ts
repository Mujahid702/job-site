import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embeddings';

export const dynamic = 'force-dynamic';

// GET: Retrieve all knowledge base documents (without high-dimensionality embeddings to save bandwidth)
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id, title, category, content, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Knowledge GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: Upload and vectorize a new knowledge base document
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, category, content, metadata = {} } = body;

    if (!title || !category || !content) {
      return NextResponse.json(
        { success: false, message: 'Title, category, and content are required.' },
        { status: 400 }
      );
    }

    const validCategories = ['roadmap', 'interview', 'playbook', 'guide'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // 1. Generate text embedding
    const embedding = await generateEmbedding(content);

    // 2. Insert into Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        title,
        category,
        content,
        metadata,
        embedding,
      })
      .select('id, title, category, content, metadata, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Admin Knowledge POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an existing knowledge base document
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
        { success: false, message: 'Document ID parameter "id" is required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err: any) {
    console.error('[Admin Knowledge DELETE] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
