import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveKnowledge } from '@/lib/ai/rag';

export const dynamic = 'force-dynamic';

// GET: Semantic search retrieval against RAG vector database
export async function GET(request: Request) {
  try {
    // 1. Session verification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    // 2. Query parsing
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category') || undefined;
    const limitVal = searchParams.get('limit');
    const thresholdVal = searchParams.get('threshold');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Query parameter "query" is required.' },
        { status: 400 }
      );
    }

    const limit = limitVal ? parseInt(limitVal, 10) : 3;
    const threshold = thresholdVal ? parseFloat(thresholdVal) : 0.25;

    // 3. Retrieval
    const results = await retrieveKnowledge(query, category, limit, threshold);

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    console.error('[Copilot Search GET] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
