import { NextResponse } from 'next/server'
import { parsePdf, parseDocx } from '@/lib/resume-parser'
import { generateResponse } from '@/lib/ai/router'
import { rateLimit } from '@/lib/rate-limit'
import { validateUploadedFile } from '@/lib/file-validator'
import { z } from 'zod'
import { logAnalyticsEvent } from '@/lib/db/admin-analytics'

export const dynamic = 'force-dynamic'

const evaluateInputSchema = z.object({
  targetRole: z.string().trim().max(100).optional().nullable(),
  text: z.string().trim().max(75000, 'Pasted text exceeds the maximum 75,000 characters limit.').optional().nullable(),
})

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    // 1. Rate limiting check (20 requests/hour)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'ats')
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 200, headers: limitResult.headers }
      )
    }

    // 2. Parse form data and validate
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, message: 'Invalid request content type.' },
        { status: 200, headers: limitResult.headers }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pastedText = formData.get('text') as string | null
    const targetRole = formData.get('targetRole') as string | null

    // Validate textual fields using Zod
    const textValidation = evaluateInputSchema.safeParse({ text: pastedText, targetRole })
    if (!textValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input fields.',
          errors: textValidation.error.flatten(),
        },
        { status: 200, headers: limitResult.headers }
      )
    }

    let resumeText = ''

    if (file) {
      // Validate file size bounds before reading array buffer fully
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'File size exceeds the maximum 5MB limit.' },
          { status: 200, headers: limitResult.headers }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      
      // Perform strict MIME / magic signature validations
      const fileValidation = validateUploadedFile(file, buffer)
      if (!fileValidation.valid) {
        return NextResponse.json(
          { success: false, message: fileValidation.error || 'Invalid file uploaded.' },
          { status: 200, headers: limitResult.headers }
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
          { status: 200, headers: limitResult.headers }
        )
      }
    } else if (pastedText && pastedText.trim() !== '') {
      resumeText = pastedText
    } else {
      return NextResponse.json(
        { success: false, message: 'Please upload a resume file or paste your resume text.' },
        { status: 200, headers: limitResult.headers }
      )
    }

    if (!resumeText || resumeText.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Could not extract text from the provided resume.' },
        { status: 200, headers: limitResult.headers }
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
      model = 'meta-llama/llama-3.3-70b-instruct:free'
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key is missing. Please configure GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in your environment.',
          needsKey: true,
        },
        { status: 200, headers: limitResult.headers }
      )
    }

    const systemPrompt = `You are a premium explainable ATS evaluation engine, CV consultant.
Analyze the following resume text and provide a highly detailed, explainable, and role-specific ATS evaluation.
Your evaluation must be grounded in actual layout, format, and content analysis of the provided text.

CRITICAL INSTRUCTIONS:
1. You MUST generate a "thinking" property first. In this section, perform a rigorous step-by-step chain of thought:
   - Identify the target role and its standard, genuine industry skill expectations (e.g., an AI/ML role values Python, NumPy, Pandas, PyTorch, TensorFlow, Scikit-Learn, SQL, and stats/probability. It does NOT require Swift, Ruby, or Java. Do not recommend irrelevant skills as gaps).
   - Analyze the candidate's actual extracted text to find what skills are present and which genuine gaps exist.
   - Verify formatting parameters: only report formatting or layout risks (like multi-column or tables) if there is actual evidence in the text structure. Do not output generic warnings.
   - Ground all subsequent scores and recommendations strictly on this thinking process.
2. Do NOT generate fake scores, random percentages, or generic templates.
3. In the "overallExplanation", you MUST explicitly explain the ATS score, explaining exactly why the candidate received that score (e.g. "Your ATS score is 78 because the resume has strong project content and relevant technical skills, but lacks several important keywords, quantified achievements, and role-specific technologies.").
4. For category scores, use the following points scale exactly:
   - **Resume Structure** (max 20)
   - **ATS Compatibility** (max 15)
   - **Skills Relevance** (max 15)
   - **Project Quality** (max 15)
   - **Experience Quality** (max 10)
   - **Keyword Coverage** (max 10)
   - **Readability** (max 10)
   - **Professional Presentation** (max 5)
   Total Score is the sum of these category scores (max 100).
5. For every single category, provide reasons (green checks, e.g. "✓ Includes clear GitHub link") and deductions (red crosses, e.g. "✗ Missing a dedicated Certifications section"). For deductions, explicitly justify why points were lost.
6. If the target role is specified as "${targetRole || 'not specified'}", evaluate the candidate's match percentage, status ("Excellent Match", "Good Match", "Needs Improvement", "Weak Match"), strong areas (green checks ✓), and weak areas (red crosses ✗). If no target role was specified, infer the candidate's natural career path and evaluate against that inferred role, while notifying them of it in the explanation.
7. Provide a natural role match breakdown (percentage and status) for all of the following 11 roles:
   - Software Engineer
   - Full Stack Developer
   - Frontend Developer
   - Backend Developer
   - Data Analyst
   - Data Scientist
   - AI/ML Engineer
   - Cloud Engineer
   - DevOps Engineer
   - Cyber Security Analyst
   - Business Analyst
8. Analyze each project individually. Provide a title, strength score (out of 10), strengths, weaknesses, and a recruiter impact assessment (High/Medium/Low).
9. Scan for ATS layout risks in the text (e.g., detected multi-column layout indicators, tables, graphs, graphics, missing headings, missing contact details) and output clear warning items with severity (High/Medium/Low) and why it hurts parsing.
10. Generate a prioritized Top 10 Improvement Roadmap, ranked from 1 to 10 by impact, detailing what to change and why.

RESUME RAW TEXT:
"""
${resumeText.substring(0, 50000)}
"""

TARGET ROLE:
"${targetRole || 'Not specified'}"`

    const schema = {
      type: 'OBJECT',
      properties: {
        thinking: {
          type: 'STRING',
          description: 'A deep step-by-step reasoning chain about the candidate\'s resume, target role, genuine skills gap, and actual layout risks. Generated first.',
        },
        parsedInfo: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            education: { type: 'ARRAY', items: { type: 'STRING' } },
            skills: { type: 'ARRAY', items: { type: 'STRING' } },
            projects: { type: 'ARRAY', items: { type: 'STRING' } },
            experience: { type: 'ARRAY', items: { type: 'STRING' } },
            certifications: { type: 'ARRAY', items: { type: 'STRING' } },
            achievements: { type: 'ARRAY', items: { type: 'STRING' } },
            contactInformation: {
              type: 'OBJECT',
              properties: {
                email: { type: 'STRING' },
                phone: { type: 'STRING' },
                linkedin: { type: 'STRING' },
                github: { type: 'STRING' },
                portfolio: { type: 'STRING' },
              },
              required: ['email', 'phone'],
            },
          },
          required: [
            'name',
            'education',
            'skills',
            'projects',
            'experience',
            'contactInformation',
          ],
        },
        overallExplanation: { type: 'STRING' },
        atsScore: { type: 'INTEGER' },
        categories: {
          type: 'OBJECT',
          properties: {
            resumeStructure: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            atsCompatibility: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            skillsRelevance: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            projectQuality: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            experienceQuality: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            keywordCoverage: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            readability: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
            professionalPresentation: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                maxScore: { type: 'INTEGER' },
                reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                deductions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['score', 'maxScore', 'reasons', 'deductions'],
            },
          },
          required: [
            'resumeStructure',
            'atsCompatibility',
            'skillsRelevance',
            'projectQuality',
            'experienceQuality',
            'keywordCoverage',
            'readability',
            'professionalPresentation',
          ],
        },
        roleMatch: {
          type: 'OBJECT',
          properties: {
            matchPercentage: { type: 'INTEGER' },
            targetRole: { type: 'STRING' },
            status: { type: 'STRING' },
            reasoning: { type: 'STRING' },
            strongAreas: { type: 'ARRAY', items: { type: 'STRING' } },
            weakAreas: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: [
            'matchPercentage',
            'targetRole',
            'status',
            'reasoning',
            'strongAreas',
            'weakAreas',
          ],
        },
        roleFitBreakdown: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              role: { type: 'STRING' },
              percentage: { type: 'INTEGER' },
              status: { type: 'STRING' },
            },
            required: ['role', 'percentage', 'status'],
          },
        },
        projectsEvaluation: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              score: { type: 'NUMBER' },
              maxScore: { type: 'NUMBER' },
              strengths: { type: 'ARRAY', items: { type: 'STRING' } },
              weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
              recruiterImpact: { type: 'STRING' },
            },
            required: [
              'title',
              'score',
              'maxScore',
              'strengths',
              'weaknesses',
              'recruiterImpact',
            ],
          },
        },
        missingSkillsDetector: {
          type: 'OBJECT',
          properties: {
            detected: { type: 'ARRAY', items: { type: 'STRING' } },
            missing: { type: 'ARRAY', items: { type: 'STRING' } },
            suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['detected', 'missing', 'suggestions'],
        },
        atsRisks: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              risk: { type: 'STRING' },
              severity: { type: 'STRING' },
              explanation: { type: 'STRING' },
            },
            required: ['risk', 'severity', 'explanation'],
          },
        },
        improvementRoadmap: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER' },
              improvement: { type: 'STRING' },
              impact: { type: 'STRING' },
              explanation: { type: 'STRING' },
            },
            required: ['id', 'improvement', 'impact', 'explanation'],
          },
        },
      },
      required: [
        'thinking',
        'parsedInfo',
        'overallExplanation',
        'atsScore',
        'categories',
        'roleMatch',
        'roleFitBreakdown',
        'projectsEvaluation',
        'missingSkillsDetector',
        'atsRisks',
        'improvementRoadmap',
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
      taskType: 'ats_analyzer',
    })

    if (!gatewayResponse.success) {
      await logAnalyticsEvent('ats_analyzer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: gatewayResponse.error })
      return NextResponse.json(
        { success: false, message: `AI Resume evaluation failed: ${gatewayResponse.error}` },
        { status: 200, headers: limitResult.headers }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      await logAnalyticsEvent('ats_analyzer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: 'Invalid response structure from Gemini API.' })
      return NextResponse.json(
        { success: false, message: 'Invalid response structure from Gemini API.' },
        { status: 200, headers: limitResult.headers }
      )
    }

    const result = JSON.parse(textResponse.trim())
    await logAnalyticsEvent('ats_analyzer', undefined, { response_time_ms: Date.now() - startTime, success: true })
    return NextResponse.json(
      { success: true, data: result, rawText: resumeText },
      { status: 200, headers: limitResult.headers }
    )
  } catch (err: any) {
    console.error('Resume Evaluator API error:', err)
    await logAnalyticsEvent('ats_analyzer', undefined, { response_time_ms: Date.now() - startTime, success: false, error: err?.message || 'Temporary issue' })
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 200 }
    )
  }
}
