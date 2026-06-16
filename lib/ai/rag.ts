import { generateEmbedding } from './embeddings';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Get a basic, context-safe Supabase client that doesn't rely on Next.js headers/cookies,
// making it fully compatible with tests, edge runtimes, and route handlers.
function getBaseSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(url, key);
}

interface MatchDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  metadata: any;
  similarity: number;
}

/**
 * Semantic retrieval function that fetches relevant documents from the knowledge base.
 */
export async function retrieveKnowledge(
  query: string,
  category?: string,
  limit = 3,
  minSimilarity = 0.25
): Promise<MatchDocument[]> {
  try {
    const embedding = await generateEmbedding(query);
    const supabase = getBaseSupabase();
    
    const { data, error } = await supabase.rpc('match_knowledge_documents', {
      query_embedding: embedding,
      match_threshold: minSimilarity,
      match_count: limit,
      filter_category: category || null,
    });

    if (error) {
      console.warn('[RAG] match_knowledge_documents RPC call failed:', error.message);
      return [];
    }

    return (data || []) as MatchDocument[];
  } catch (err: any) {
    console.error('[RAG] Failed to retrieve knowledge:', err);
    return [];
  }
}

/**
 * Retrieval Augmented Generation context builder.
 * Semantic searches the database for relevant files and structures them into a prompt template block.
 */
export async function getPlacementContext(
  query: string,
  category?: string,
  limit = 3,
  minSimilarity = 0.25
): Promise<string> {
  const matches = await retrieveKnowledge(query, category, limit, minSimilarity);

  if (matches.length === 0) {
    return '';
  }

  let context = '### RELEVANT PLATFORM KNOWLEDGE BASE REFERENCE CONTEXT:\n';
  context += 'Use the following verified documents to guide your answer. Provide accurate advice grounded in these resources.\n\n';

  matches.forEach((doc, index) => {
    context += `--- DOCUMENT ${index + 1}: ${doc.title} (${doc.category.toUpperCase()}) ---\n`;
    context += `Content:\n${doc.content.trim()}\n`;
    if (doc.metadata && Object.keys(doc.metadata).length > 0) {
      context += `Source details: ${JSON.stringify(doc.metadata)}\n`;
    }
    context += '--------------------------------------------------\n\n';
  });

  return context;
}
