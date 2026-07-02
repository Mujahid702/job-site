import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { linkedinUrl, profileText } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json(
        { success: false, message: 'LinkedIn profile URL is required.' },
        { status: 400 }
      );
    }

    if (!profileText || profileText.trim() === '') {
      // Return fallback/mock parsing if no raw text pasted
      return getMockFallback(linkedinUrl);
    }

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
      return getMockFallback(linkedinUrl);
    }

    const systemInstruction = `You are a professional LinkedIn parsing engine.
Parse the following raw text copied from a user's LinkedIn profile and extract the structured data.
Be grounded, only extract what is in the text, do not invent projects or experience.

CRITICAL INSTRUCTIONS:
1. You MUST generate a "thinking" property first. In this section, perform a step-by-step reasoning chain:
   - Identify the user's name, current headline, and profile summary from the raw text.
   - Scan for skill keywords present in the text.
   - Map experience milestones (company name, role, date range, description of work).
   - Confirm that no details or facts are invented or extrapolated.
2. Return JSON in the specified schema format.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        thinking: {
          type: 'STRING',
          description: 'A step-by-step thinking/reasoning chain about the profile information extracted. Generated first.'
        },
        name: { type: 'STRING' },
        headline: { type: 'STRING' },
        summary: { type: 'STRING' },
        skills: { type: 'ARRAY', items: { type: 'STRING' } },
        experience: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              company: { type: 'STRING' },
              role: { type: 'STRING' },
              dateRange: { type: 'STRING' },
              description: { type: 'STRING' }
            },
            required: ['company', 'role', 'dateRange', 'description']
          }
        },
        achievements: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['thinking', 'name', 'headline', 'summary', 'skills', 'experience', 'achievements']
    };

    const gatewayResponse = await generateResponse({
      provider,
      model,
      prompt: `LinkedIn raw profile text to parse:\n\n${profileText}`,
      systemInstruction,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1,
      taskType: 'ats_analyzer'
    });

    if (!gatewayResponse.success || !gatewayResponse.text) {
      console.warn("AI parsing of LinkedIn failed. Falling back to mock sync.");
      return getMockFallback(linkedinUrl);
    }

    const result = JSON.parse(gatewayResponse.text.trim());

    return NextResponse.json({
      success: true,
      data: result,
      isMock: false
    });

  } catch (err: any) {
    console.error('LinkedIn API parse error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to parse LinkedIn text.' },
      { status: 500 }
    );
  }
}

function getMockFallback(linkedinUrl: string) {
  const parts = linkedinUrl.split('/');
  const username = parts[parts.length - 1] || parts[parts.length - 2] || 'candidate';

  const mockData = {
    name: username.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    headline: 'Software Engineer Intern | Full Stack Developer',
    summary: 'Results-driven developer focused on responsive designs, backend concurrency algorithms, and DevOps CI/CD integration loops.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Git', 'RESTful APIs'],
    experience: [
      {
        company: 'BuggedBrain Technologies',
        role: 'Full Stack Engineer Intern',
        dateRange: 'Jan 2026 - Present',
        description: 'Refactored backend routes and database schemas to improve load speeds by 24%.'
      },
      {
        company: 'VTU Computer Science Labs',
        role: 'Assistant Web Administrator',
        dateRange: 'Aug 2025 - Dec 2025',
        description: 'Maintained portals serving 2,000+ weekly student query threads.'
      }
    ],
    achievements: [
      'Won 1st place in Inter-College Coding Hackathon 2025',
      'Published research paper on database query optimization methods'
    ]
  };

  return NextResponse.json({
    success: true,
    data: mockData,
    isMock: true
  });
}
