import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logAnalyticsEvent } from '@/lib/db/admin-analytics'
import { generateResponse } from '@/lib/ai/router'
import { createClient } from '@/lib/supabase/server'
import { checkUsage, incrementUsage, hashString } from '@/lib/security/FeatureGuard'

export const dynamic = 'force-dynamic'

const enhanceInputSchema = z.object({
  inputType: z.enum(['bullet', 'project', 'experience']),
  content: z.string().trim().min(1, 'Content is required.').max(15000, 'Content is too long. Max 15,000 characters.'),
  targetRole: z.string().trim().max(100).optional().nullable(),
})

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    // 1. Rate limiting check (20 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'enhance')
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      )
    }

    // User session check
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    const userId = user?.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized login session required.' },
        { status: 401 }
      )
    }

    // Usage check
    const quota = await checkUsage(userId, 'resume_enhancer')
    if (!quota.allowed) {
      return NextResponse.json({
        success: false,
        message: 'Monthly Free Limit Reached. Upgrade to Premium to continue immediately.',
        quotaExhausted: true,
        remaining: 0,
        limit: quota.limit,
        resetDate: quota.resetDate
      })
    }

    // 2. Validate inputs
    const body = await request.json().catch(() => ({}))
    const validation = enhanceInputSchema.safeParse(body)
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

    const { inputType, content, targetRole } = validation.data

    // Retrieve Gemini API Key from headers or environment
    const headerApiKey = request.headers.get('x-gemini-api-key')
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gemini API Key is missing. Please configure it in your environment.',
          needsKey: true,
        },
        { status: 401, headers: limitResult.headers }
      )
    }

        const systemPrompt = `You are a premium AI Resume Enhancement Engine and CV consultant.
Analyze the following text of type "${inputType}" and provide rewritten versions, quality scores, action verb analysis, and impact quantification suggestions.

CRITICAL INSTRUCTIONS:
1. You MUST generate a "thinking" property first. In this section, perform a rigorous step-by-step chain of thought:
   - Analyze the target role (if specified) and input content.
   - Evaluate structural and stylistic weaknesses (e.g. passive tone, lack of metrics, generic verbs) in the original text.
   - Plan out the edits required for each of the three optimized versions (ATS, Recruiter, Premium/STAR).
   - Identify weak action verbs and brainstorm dynamic, impact-driven alternatives.
   - Map out logical parameters to show where metric placeholders should be added.
2. Generate exactly 3 enhanced versions based on the input type:
   - If input type is "bullet" or "experience", the versions must be:
     a. "ATS Optimized" (focused on keywords, clear syntax, parser-friendly structure)
     b. "Recruiter Optimized" (focused on professional framing, technical depth, and clean delivery)
     c. "Premium Achievement Style" (focused on leadership, action, and results-oriented structure)
   - If input type is "project", the versions must be:
     a. "Resume Version" (concise, bulleted or direct summary suitable for a CV project section)
     b. "LinkedIn Version" (engaging, storytelling, and includes relevant hashtags/mentions format)
     c. "Interview Explanation Version" (STAR framework format: Situation, Task, Action, Result, suitable for oral explanations)

3. Evaluate and score the content:
   - Calculate a score out of 100 for the ORIGINAL text, including a rating label ("Weak", "Average", "Strong", "Excellent") and a brief reasoning explanation.
   - For each of the three generated versions, calculate their scores (out of 100), rating labels, and provide 3-4 bulleted reasons (green checks e.g. "✓ Strong action verb", "✓ ATS keywords added") explaining why it is stronger.

4. Action Verb Analysis:
   - Scan the original text for weak action verbs (e.g. "worked", "helped", "made", "created", "assisted", "responsible for", "had to").
   - For each weak verb detected, list it and suggest 3-4 stronger action verbs (e.g. "engineered", "optimized", "architected", "streamlined", "orchestrated").

5. Impact Quantification Engine:
   - Show how the original statement can be quantified.
   - Provide a "Before" example (from the user's input).
   - Provide an "After" example showing how to quantify it. If metrics are not in the input, include clear brackets/placeholders like "[Insert User Count]" or "[Insert Performance Improvement]" so the user knows where and how to fill them.
   - Explain why quantifying this adds value.

INPUT TEXT:
"""
${content}
"""

TARGET ROLE:
"${targetRole || 'Not specified'}"`

    const schema = {
      type: 'OBJECT',
      properties: {
        thinking: {
          type: 'STRING',
          description: 'A detailed step-by-step thinking/reasoning chain. Generated first.'
        },
        originalScore: { type: 'INTEGER' },
        originalRating: { type: 'STRING' },
        originalReasoning: { type: 'STRING' },
        versions: {
          type: 'OBJECT',
          properties: {
            version1: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                content: { type: 'STRING' },
                score: { type: 'INTEGER' },
                rating: { type: 'STRING' },
                explanations: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['title', 'content', 'score', 'rating', 'explanations'],
            },
            version2: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                content: { type: 'STRING' },
                score: { type: 'INTEGER' },
                rating: { type: 'STRING' },
                explanations: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['title', 'content', 'score', 'rating', 'explanations'],
            },
            version3: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                content: { type: 'STRING' },
                score: { type: 'INTEGER' },
                rating: { type: 'STRING' },
                explanations: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['title', 'content', 'score', 'rating', 'explanations'],
            },
          },
          required: ['version1', 'version2', 'version3'],
        },
        weakVerbs: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              verb: { type: 'STRING' },
              suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['verb', 'suggestions'],
          },
        },
        impactQuantification: {
          type: 'OBJECT',
          properties: {
            before: { type: 'STRING' },
            after: { type: 'STRING' },
            explanation: { type: 'STRING' },
          },
          required: ['before', 'after', 'explanation'],
        },
      },
      required: [
        'thinking',
        'originalScore',
        'originalRating',
        'originalReasoning',
        'versions',
        'weakVerbs',
        'impactQuantification',
      ],
    }

    const gatewayResponse = await generateResponse({
      provider: 'gemini',
      prompt: systemPrompt,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2,
      taskType: 'resume_enhancer',
    })

    if (!gatewayResponse.success) {
      await logAnalyticsEvent('resume_enhancer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: gatewayResponse.error })
      return NextResponse.json(
        { success: false, message: `AI Resume enhancement failed: ${gatewayResponse.error}` },
        { status: 500, headers: limitResult.headers }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      await logAnalyticsEvent('resume_enhancer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: 'Invalid response structure from Gemini API.' })
      return NextResponse.json(
        { success: false, message: 'Invalid response structure from Gemini API.' },
        { status: 500, headers: limitResult.headers }
      )
    }

    const result = JSON.parse(textResponse.trim())
    await logAnalyticsEvent('resume_enhancer', undefined, { response_time_ms: Date.now() - startTime, success: true })
    
    // Increment usage
    await incrementUsage(userId, 'resume_enhancer', {
      executionTimeMs: Date.now() - startTime,
      ipHash: hashString(ip)
    })

    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: limitResult.headers }
    )
  } catch (err: any) {
    console.error('Resume Enhancer API error:', err)
    await logAnalyticsEvent('resume_enhancer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: err?.message || 'Temporary issue' })
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 500 }
    )
  }
}
