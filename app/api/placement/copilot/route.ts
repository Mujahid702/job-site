import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logAnalyticsEvent } from '@/lib/db/admin-analytics'
import { generateResponse } from '@/lib/ai/router'

export const dynamic = 'force-dynamic'

const copilotInputSchema = z.object({
  message: z.string().trim().min(1, 'Message is required.').max(10000, 'Message exceeds length constraints.'),
  history: z
    .array(
      z.object({
        role: z.string().trim(),
        content: z.string().trim(),
      })
    )
    .optional()
    .nullable(),
  context: z
    .object({
      targetRole: z.string().trim().max(100).optional().nullable(),
      techStack: z.string().trim().max(500).optional().nullable(),
      atsScore: z.union([z.number(), z.string()]).optional().nullable(),
      interviewAvg: z.union([z.number(), z.string()]).optional().nullable(),
      roadmapProgressCount: z.number().optional().nullable(),
      totalRoadmapCount: z.number().optional().nullable(),
      crmApplications: z.array(z.any()).optional().nullable(),
    })
    .optional()
    .nullable(),
})

export async function POST(request: Request) {
  const startTime = Date.now()
  let messageText = ''
  try {
    // 1. Rate limiting check (50 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'copilot')
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      )
    }

    // 2. Validate inputs
    const body = await request.json().catch(() => ({}))
    const validation = copilotInputSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input fields.',
          errors: validation.error.flatten(),
        },
        { status: 400, headers: limitResult.headers }
      )
    }

    const { message, history, context } = validation.data
    messageText = message || ''

    // Retrieve Gemini API Key
    const headerApiKey = request.headers.get('x-gemini-api-key')
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gemini API Key is missing. Please configure it in your settings or environment variables.',
          needsKey: true,
        },
        { status: 401, headers: limitResult.headers }
      )
    }

    const systemPrompt = `You are the BuggedBrain AI Placement Copilot, the central intelligence system of this Placement Operating System.
Your role is to act as a personalized career advisor, placement mentor, resume reviewer, interview coach, and application strategist.

USER WORKSPACE CONTEXT:
- Target Role: ${context?.targetRole || 'Software Engineer'}
- Tech Stack: ${context?.techStack || 'Not specified'}
- ATS Resume Score: ${context?.atsScore || 'Not scanned'}%
- Average Mock Interview Score: ${context?.interviewAvg || 'Not practiced'}%
- Roadmap Progress: ${context?.roadmapProgressCount || 0} completed steps out of ${context?.totalRoadmapCount || 10}
- Applications list: ${JSON.stringify(context?.crmApplications || [])}

CONVERSATION HISTORY:
${(history || []).map((h) => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}
USER: ${message}

INSTRUCTIONS:
1. Provide a direct, highly customized answer referencing the user's statistics, target role, and context directly. Never give a generic or boilerplate answer.
2. If the user asks about placement readiness, or asks "Am I ready for placements?", analyze their scores and compile a structured Health Report. Update the "healthReport" object in the JSON response with score percentages (0-100) for: resumeQuality, interviewReadiness, projects, and overallReadiness.
3. If the user requests actions or advice that can be done by a specific tool in the OS, you must return an action tag in the "action" property to route the user automatically:
   - "OPEN_ATS" -> if they want to scan or improve their resume
   - "OPEN_JD" -> if they want to match a job description
   - "OPEN_BUILDER" -> if they want to build or compile a resume
   - "OPEN_INTERVIEW" -> if they want to practice mock interviews or check mock history
   - "OPEN_ROADMAP" -> if they want to look at learning paths or roadmaps
   - "OPEN_CRM" -> if they want to check their job tracker, crm board, or application statuses
   - "OPEN_PROJECTS" -> if they want to get project ideas or suggestions
   - "OPEN_COMPANY" -> if they want to prepare for Deloitte, IBM, TCS, Accenture, etc.
   If no tool action is relevant, set "action" to null or leave it out.
4. Keep the markdown formatting inside your "reply" text clean, using lists, tables, and bold headers to make it look premium.
5. Return ONLY pure valid JSON matching the schema. Do NOT include markdown code blocks.`

    const schema = {
      type: 'OBJECT',
      properties: {
        reply: { type: 'STRING' },
        action: { type: 'STRING' },
        healthReport: {
          type: 'OBJECT',
          properties: {
            resumeQuality: { type: 'INTEGER' },
            interviewReadiness: { type: 'INTEGER' },
            projects: { type: 'INTEGER' },
            overallReadiness: { type: 'INTEGER' },
          },
          required: ['resumeQuality', 'interviewReadiness', 'projects', 'overallReadiness'],
        },
      },
      required: ['reply'],
    }

    let eventType = 'placement_copilot'
    if (messageText && messageText.toLowerCase().includes('cover letter')) {
      eventType = 'cover_letter'
    } else if (messageText && (messageText.toLowerCase().includes('linkedin') || messageText.toLowerCase().includes('about section'))) {
      eventType = 'linkedin_optimizer'
    }

    const gatewayResponse = await generateResponse({
      provider: 'gemini',
      prompt: systemPrompt,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
      taskType: eventType,
    })

    if (!gatewayResponse.success) {
      await logAnalyticsEvent(eventType, undefined, { response_time_ms: Date.now() - startTime, success: false, error: gatewayResponse.error })
      return NextResponse.json(
        { success: false, message: `AI Copilot execution failed: ${gatewayResponse.error}` },
        { status: 500, headers: limitResult.headers }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      await logAnalyticsEvent(eventType, undefined, { response_time_ms: Date.now() - startTime, success: false, error: 'Invalid response structure from Gemini API.' })
      return NextResponse.json(
        { success: false, message: 'Invalid response structure from Gemini API.' },
        { status: 500, headers: limitResult.headers }
      )
    }

    const result = JSON.parse(textResponse.trim())
    await logAnalyticsEvent(eventType, undefined, { response_time_ms: Date.now() - startTime, success: true })
    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: limitResult.headers }
    )
  } catch (err: any) {
    console.error('AI Copilot API error:', err)
    let eventType = 'placement_copilot'
    if (messageText && messageText.toLowerCase().includes('cover letter')) {
      eventType = 'cover_letter'
    } else if (messageText && (messageText.toLowerCase().includes('linkedin') || messageText.toLowerCase().includes('headline') || messageText.toLowerCase().includes('about section'))) {
      eventType = 'linkedin_optimizer'
    }
    await logAnalyticsEvent(eventType, undefined, { response_time_ms: Date.now() - startTime, success: false, error: err?.message || 'Temporary issue' })
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 500 }
    )
  }
}
