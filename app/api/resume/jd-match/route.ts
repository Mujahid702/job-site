import { NextResponse } from 'next/server'
import { parsePdf, parseDocx } from '@/lib/resume-parser'
import { generateResponse } from '@/lib/ai/router'
import { rateLimit } from '@/lib/rate-limit'
import { validateUploadedFile } from '@/lib/file-validator'
import { z } from 'zod'
import { logAnalyticsEvent } from '@/lib/db/admin-analytics'

export const dynamic = 'force-dynamic'

const jdMatchInputSchema = z.object({
  targetRole: z.string().trim().max(100).optional().nullable(),
  resumeText: z.string().trim().max(75000, 'Resume text exceeds maximum limit of 75,000 characters.').optional().nullable(),
  jdText: z.string().trim().min(1, 'Job description is required.').max(75000, 'Job description exceeds maximum limit of 75,000 characters.'),
})

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    // 1. Rate limiting check (20 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'jd')
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let resumeText = ''
    let jdText = ''
    let targetRole = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const text = formData.get('resumeText') as string | null
      jdText = (formData.get('jdText') as string) || ''
      targetRole = (formData.get('targetRole') as string) || ''

      // Validate textual fields via Zod
      const textValidation = jdMatchInputSchema.safeParse({
        targetRole,
        resumeText: text,
        jdText,
      })

      if (!textValidation.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid input fields.',
            errors: textValidation.error.flatten(),
          },
          { status: 400, headers: limitResult.headers }
        )
      }

      if (file) {
        // Enforce 5MB size limit check on the server
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'File size exceeds the maximum 5MB limit.' },
            { status: 400, headers: limitResult.headers }
          )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Perform strict MIME / magic header signature validations
        const fileValidation = validateUploadedFile(file, buffer)
        if (!fileValidation.valid) {
          return NextResponse.json(
            { success: false, message: fileValidation.error || 'Invalid file uploaded.' },
            { status: 400, headers: limitResult.headers }
          )
        }

        const fileName = file.name.toLowerCase()
        try {
          if (fileName.endsWith('.pdf')) {
            resumeText = await parsePdf(buffer)
          } else if (fileName.endsWith('.docx')) {
            resumeText = await parseDocx(buffer)
          }
        } catch (err) {
          return NextResponse.json(
            { success: false, message: 'Corrupt or unreadable resume file. Please upload a valid document.' },
            { status: 400, headers: limitResult.headers }
          )
        }
      } else if (text && text.trim() !== '') {
        resumeText = text
      }
    } else {
      const body = await request.json().catch(() => ({}))
      const validation = jdMatchInputSchema.safeParse(body)
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

      resumeText = validation.data.resumeText || ''
      jdText = validation.data.jdText
      targetRole = validation.data.targetRole || ''
    }

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: resume text or file is required.' },
        { status: 400, headers: limitResult.headers }
      )
    }

    // Determine provider, model, and key based on available environment variables and headers
    const headerApiKey = request.headers.get('x-gemini-api-key')
    
    let provider: 'gemini' | 'groq' | 'openrouter' = 'gemini'
    let apiKey = headerApiKey || process.env.GEMINI_API_KEY
    let model = 'gemini-3.5-flash'

    // If client provides a direct Gemini API key via headers, we respect it.
    // Otherwise, we prioritize Groq's high-speed free tier, followed by OpenRouter.
    if (headerApiKey) {
      provider = 'gemini'
      apiKey = headerApiKey
      model = 'gemini-3.5-flash'
    } else if (process.env.GROQ_API_KEY) {
      provider = 'groq'
      apiKey = process.env.GROQ_API_KEY
      model = 'llama-3.3-70b-versatile'
    } else if (process.env.OPENROUTER_API_KEY) {
      provider = 'openrouter'
      apiKey = process.env.OPENROUTER_API_KEY
      model = 'meta-llama/llama-3.1-8b-instruct:free'
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key is missing. Please configure GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in your environment.',
          needsKey: true,
        },
        { status: 401, headers: limitResult.headers }
      )
    }

    const systemPrompt = `You are a premium AI Job Description Matching engine, CV optimizer, and technical recruiter.
Analyze the provided resume text and job description (JD) text, and perform a comprehensive, explainable matching audit.

CRITICAL INSTRUCTIONS:
1. Ground your evaluations strictly in the provided texts. Do NOT make up qualifications.
2. Determine an Overall Match Score (0 to 100) based on how well the candidate's skills, experience, projects, and education align with the JD requirements.
3. Classify application competitiveness as "Very Competitive", "Competitive", "Moderate", or "Weak" and explain why.
4. Calculate individual match breakdown scores (0 to 100) and provide details:
   - Skills Match (List detected matching skills and missing critical skills)
   - Keywords Match (Compare JD keywords against resume)
   - Experience Match (Align years of experience, titles, and duties)
   - Education Match (Align degrees, majors, and academic level)
   - Project Relevance (Align project architectures/technologies with job requirements)
   - ATS Alignment (Evaluate resume headings, structures, and layout indicators in the text)
5. Extract important keywords from the JD (minimum 8 keywords). Identify which are present in the resume and which are missing, and compute a Keyword Coverage percentage.
6. Identify critical missing skills and categorize their priority ("High", "Medium", "Low") based on how frequently/strongly they are mentioned in the JD.
7. Evaluate any projects mentioned in the resume. Calculate a relevance score (0 to 100) for each, detailing key strengths, weaknesses, and alignment with the role.
8. Simulate a Recruiter View: What helps the application ("helps") and what may raise concerns or need clarification ("concerns").
9. Generate a prioritized Match Improvement Roadmap listing specific actions the candidate should take before applying, categorized by impact ("High", "Medium", "Low").

RESUME TEXT:
"""
${resumeText.substring(0, 50000)}
"""

JOB DESCRIPTION TEXT:
"""
${jdText.substring(0, 50000)}
"""

TARGET ROLE:
"${targetRole || 'Not specified'}"`

    const schema = {
      type: 'OBJECT',
      properties: {
        overallScore: { type: 'INTEGER' },
        competitiveness: { type: 'STRING' },
        competitivenessReasoning: { type: 'STRING' },
        breakdown: {
          type: 'OBJECT',
          properties: {
            skillsMatch: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                detected: { type: 'ARRAY', items: { type: 'STRING' } },
                missing: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'explanation', 'detected', 'missing'],
            },
            keywordsMatch: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                detected: { type: 'ARRAY', items: { type: 'STRING' } },
                missing: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'explanation', 'detected', 'missing'],
            },
            experienceMatch: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
              },
              required: ['score', 'explanation'],
            },
            educationMatch: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
              },
              required: ['score', 'explanation'],
            },
            projectRelevance: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
              },
              required: ['score', 'explanation'],
            },
            atsAlignment: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
              },
              required: ['score', 'explanation'],
            },
          },
          required: [
            'skillsMatch',
            'keywordsMatch',
            'experienceMatch',
            'educationMatch',
            'projectRelevance',
            'atsAlignment',
          ],
        },
        keywordAnalysis: {
          type: 'OBJECT',
          properties: {
            coverage: { type: 'INTEGER' },
            keywords: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  word: { type: 'STRING' },
                  present: { type: 'BOOLEAN' },
                },
                required: ['word', 'present'],
              },
            },
          },
          required: ['coverage', 'keywords'],
        },
        missingSkills: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              skill: { type: 'STRING' },
              priority: { type: 'STRING' },
            },
            required: ['skill', 'priority'],
          },
        },
        projectsRelevance: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              score: { type: 'INTEGER' },
              explanation: { type: 'STRING' },
              strengths: { type: 'ARRAY', items: { type: 'STRING' } },
              weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: [
              'title',
              'score',
              'explanation',
              'strengths',
              'weaknesses',
            ],
          },
        },
        recruiterPerspective: {
          type: 'OBJECT',
          properties: {
            helps: { type: 'ARRAY', items: { type: 'STRING' } },
            concerns: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['helps', 'concerns'],
        },
        roadmap: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              improvement: { type: 'STRING' },
              impact: { type: 'STRING' },
            },
            required: ['improvement', 'impact'],
          },
        },
      },
      required: [
        'overallScore',
        'competitiveness',
        'competitivenessReasoning',
        'breakdown',
        'keywordAnalysis',
        'missingSkills',
        'projectsRelevance',
        'recruiterPerspective',
        'roadmap',
      ],
    }

    const gatewayResponse = await generateResponse({
      provider,
      model,
      prompt: systemPrompt,
      apiKey,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1,
      taskType: 'jd_matcher',
    })

    if (!gatewayResponse.success) {
      await logAnalyticsEvent('jd_matcher', undefined, { response_time_ms: Date.now() - startTime, success: false, error: gatewayResponse.error })
      return NextResponse.json(
        { success: false, message: `AI Job Description matching failed: ${gatewayResponse.error}` },
        { status: 500, headers: limitResult.headers }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      await logAnalyticsEvent('jd_matcher', undefined, { response_time_ms: Date.now() - startTime, success: false, error: 'Invalid response structure from Gemini API.' })
      return NextResponse.json(
        { success: false, message: 'Invalid response structure from Gemini API.' },
        { status: 500, headers: limitResult.headers }
      )
    }

    const result = JSON.parse(textResponse.trim())
    await logAnalyticsEvent('jd_matcher', undefined, { response_time_ms: Date.now() - startTime, success: true })
    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: limitResult.headers }
    )
  } catch (err: any) {
    console.error('JD Matcher API error:', err)
    await logAnalyticsEvent('jd_matcher', undefined, { response_time_ms: Date.now() - startTime, success: false, error: err?.message || 'Temporary issue' })
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 500 }
    )
  }
}
