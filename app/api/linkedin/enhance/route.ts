import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResponse } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { draftPost, style, targetRole, skills } = await request.json();

    if (!draftPost || !draftPost.trim()) {
      return NextResponse.json(
        { success: false, message: 'Draft post content is required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const headerApiKey = request.headers.get('x-gemini-api-key');
    let provider: 'gemini' | 'groq' | 'openrouter' = 'gemini';
    let apiKey = headerApiKey || process.env.GEMINI_API_KEY;
    let model = 'gemini-3.5-flash';

    if (headerApiKey) {
      provider = 'gemini';
      apiKey = headerApiKey;
      model = 'gemini-3.5-flash';
    } else if (process.env.GROQ_API_KEY) {
      provider = 'groq';
      apiKey = process.env.GROQ_API_KEY;
      model = 'llama-3.3-70b-versatile';
    } else if (process.env.OPENROUTER_API_KEY) {
      provider = 'openrouter';
      apiKey = process.env.OPENROUTER_API_KEY;
      model = 'meta-llama/llama-3.3-70b-instruct:free';
    }

    if (!apiKey) {
      // Safe fallback if API keys are missing to prevent crashing
      return NextResponse.json({
        success: true,
        enhancedPost: `${draftPost}\n\n🚀 Ready to build and scale! Proud of these recent technical developments.\n\n#softwaredevelopment #${targetRole?.replace(/\s+/g, '') || 'careers'}`,
        tags: ['#softwaredevelopment', `#${targetRole?.replace(/\s+/g, '') || 'careers'}`]
      });
    }

    const styleGuide = 
      style === 'star' ? 'Format the post using the STAR method (Situation, Task, Action, Result) with bold labels.' :
      style === 'viral' ? 'Write a highly engaging, story-driven post with an attention-grabbing hook and call-to-action.' :
      style === 'technical' ? 'Emphasize deep technical implementation details, architectural choices, and clean code principles.' :
      'Structure the post with strong business impact and quantitative metric statements (e.g. reduced latency by 35%).';

    const systemInstruction = `You are a premium LinkedIn ghostwriter and branding optimizer for software engineers.
Optimize the user's raw draft post. 
${styleGuide}

CRITICAL CONSTRAINTS:
1. You MUST generate a "thinking" property first. In this section, perform a step-by-step reasoning chain:
   - Identify the primary achievement or announcement in the user's draft.
   - Outline the hooks, formatting style, and hashtags strategy.
   - Confirm that no factual accomplishments are simulated or added beyond what is in the draft.
2. Return JSON in the specified schema format.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        thinking: {
          type: 'STRING',
          description: 'A step-by-step reasoning chain about post optimization. Generated first.'
        },
        enhancedPost: { 
          type: 'STRING',
          description: 'The final, fully formatted and optimized LinkedIn post copy.'
        },
        tags: { 
          type: 'ARRAY', 
          items: { type: 'STRING' },
          description: 'A list of 3 to 5 relevant technical or professional hashtags.'
        }
      },
      required: ['thinking', 'enhancedPost', 'tags']
    };

    const prompt = `User's Target Role: ${targetRole || 'Software Engineer'}
Core Skills: ${skills?.join(', ') || ''}
Raw Draft Post: "${draftPost}"`;

    const gatewayResponse = await generateResponse({
      provider,
      model,
      prompt,
      systemInstruction,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
      taskType: 'resume_enhancer',
      userId
    });

    if (!gatewayResponse.success || !gatewayResponse.text) {
      throw new Error(gatewayResponse.error || 'Failed to generate enhanced post.');
    }

    const result = JSON.parse(gatewayResponse.text.trim());

    return NextResponse.json({
      success: true,
      enhancedPost: result.enhancedPost,
      tags: result.tags
    });

  } catch (err: any) {
    console.error('LinkedIn Enhance API error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to optimize LinkedIn post.' },
      { status: 500 }
    );
  }
}
