import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResponse } from '@/lib/ai/router';
import { getPlacementContext } from '@/lib/ai/rag';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface EscalationResult {
  escalated: boolean;
  reason: string | null;
}

// Classifier function to inspect the user query for Gemini escalation triggers
function classifyEscalation(query: string): EscalationResult {
  const q = query.toLowerCase();
  
  // 1. Complex reasoning triggers
  const complexKeywords = [
    'compare', 'evaluate', 'analyze', 'why', 'pros and cons', 
    'logic', 'puzzle', 'brainteaser', 'solve', 'recommendation explanation'
  ];
  if (complexKeywords.some(kw => q.includes(kw))) {
    return { escalated: true, reason: 'Complex reasoning query' };
  }

  // 2. Offer comparison triggers
  const offerKeywords = [
    'offer', 'salary', 'package', 'ctc', 'join', 'compensation', 
    'negotiate', 'letter', 'worth', 'stipend'
  ];
  if (offerKeywords.some(kw => q.includes(kw))) {
    return { escalated: true, reason: 'Offer comparison and negotiation analysis' };
  }

  // 3. Deep resume rewrite triggers
  const resumeKeywords = [
    'rewrite', 'improve', 'resume', 'cv', 'bullet point', 
    'rephrase', 'edit', 'tailor'
  ];
  if (resumeKeywords.some(kw => q.includes(kw))) {
    return { escalated: true, reason: 'Deep resume rewrite and optimization' };
  }

  return { escalated: false, reason: null };
}

// POST: Handles AI Placement Copilot conversational responses with dynamically injected RAG context
export async function POST(request: Request) {
  const startTime = Date.now();
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

    // 2. Rate limiting check (50 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(ip, 'copilot');
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      );
    }

    // 3. Input parsing
    const body = await request.json().catch(() => ({}));
    const { message, messages = [], category } = body;

    const userMessage = message || (messages.length > 0 ? messages[messages.length - 1]?.content : '');

    if (!userMessage || userMessage.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message content is required.' },
        { status: 400, headers: limitResult.headers }
      );
    }

    // 4. Run escalation classifier
    const escalation = classifyEscalation(userMessage);

    // 5. Select provider and model based on escalation and available credentials
    let provider: 'gemini' | 'groq' | 'openrouter' = 'gemini';
    let model = 'gemini-3.5-flash';

    if (escalation.escalated) {
      // Escalate to Gemini
      provider = 'gemini';
      model = 'gemini-3.5-flash';
    } else {
      // Default to Llama 3.1
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
        model = 'llama-3.1-8b-instant';
      } else if (process.env.OPENROUTER_API_KEY) {
        provider = 'openrouter';
        model = 'meta-llama/llama-3.3-70b-instruct:free';
      } else {
        // Fallback to Gemini if no keys configured for Llama
        provider = 'gemini';
        model = 'gemini-3.5-flash';
      }
    }

    // 6. Retrieve semantic context from the knowledge base using RAG
    const ragContext = await getPlacementContext(userMessage, category);

    // 7. Construct Copilot System instructions
    const systemInstruction = `You are the AI Placement Copilot. Your goal is to guide students on placement preparation, roadmaps, interview questions, playbooks, and general placement guides.

${ragContext ? ragContext : 'No specific knowledge base context was found for this query.'}

CRITICAL INSTRUCTIONS:
1. Ground your advice strictly in the provided verified platform knowledge context when available.
2. If facts or citations are referenced in the context (like standard questions or company policies), represent them accurately.
3. If no verified knowledge base context is found or it is not relevant, answer professionally using general, high-quality placement preparation practices.
4. Keep answers clear, structured, and easy for students to digest.`;

    // 8. Request completion from AI Gateway
    const gatewayResponse = await generateResponse({
      provider,
      model,
      prompt: userMessage,
      systemInstruction,
      temperature: 0.3,
      taskType: 'placement_copilot',
      userId: user.id,
    });

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { success: false, message: `Copilot chat completion failed: ${gatewayResponse.error}` },
        { status: 500, headers: limitResult.headers }
      );
    }

    // 9. Telemetry logging & persistence (non-blocking)
    try {
      const responseTimeMs = Date.now() - startTime;
      const promptTokens = gatewayResponse.usage?.promptTokens || 0;
      const completionTokens = gatewayResponse.usage?.completionTokens || 0;
      const totalTokens = gatewayResponse.usage?.totalTokens || 0;
      const cost = gatewayResponse.usage?.cost || 0;

      // Save record in public.copilot_interactions
      const { error: dbError } = await supabase.from('copilot_interactions').insert({
        user_id: user.id,
        query: userMessage,
        response: gatewayResponse.text,
        escalated: escalation.escalated,
        escalation_reason: escalation.reason,
        provider: gatewayResponse.provider,
        model: gatewayResponse.model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost,
        response_time_ms: responseTimeMs,
      });

      if (dbError) {
        console.warn('[Copilot Telemetry] Failed to insert to copilot_interactions:', dbError.message);
      }

      // Save event in public.analytics_events
      const { logAnalyticsEvent } = await import('@/lib/db/admin-analytics');
      await logAnalyticsEvent('placement_copilot_request', user.id, {
        escalated: escalation.escalated,
        escalation_reason: escalation.reason,
        provider: gatewayResponse.provider,
        model: gatewayResponse.model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost,
        response_time_ms: responseTimeMs,
        context_retrieved: !!ragContext,
      });
    } catch (telemetryErr) {
      console.warn('[Copilot Telemetry] Telemetry tracking failed:', telemetryErr);
    }

    return NextResponse.json(
      {
        success: true,
        text: gatewayResponse.text,
        escalated: escalation.escalated,
        escalationReason: escalation.reason,
        contextRetrieved: !!ragContext,
      },
      {
        status: 200,
        headers: limitResult.headers,
      }
    );
  } catch (err: any) {
    console.error('[Copilot Chat POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

