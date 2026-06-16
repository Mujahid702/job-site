import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { logInfo, logWarning, logError } from '@/lib/logger'
import { z } from 'zod'

const createJobSchema = z.object({
  drive_title: z.string().trim().min(1, 'Drive title is required').max(255),
  drive_slug: z.string().trim().min(1, 'Drive slug is required').max(255),
  company_name: z.string().trim().min(1, 'Company name is required').max(255),
  company_logo: z.string().url('Invalid company logo URL').or(z.string().length(0)).optional().nullable(),
  company_website: z.string().url('Invalid company website URL').or(z.string().length(0)).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  job_type: z.string().trim().max(100).optional().nullable(),
  experience_level: z.string().trim().max(100).optional().nullable(),
  salary_range: z.string().trim().max(100).optional().nullable(),
  apply_link: z.string().url('Invalid apply link URL').min(1, 'Apply link is required'),
  drive_description: z.string().max(10000).optional().nullable(),
  eligibility_criteria: z.string().max(10000).optional().nullable(),
  key_responsibilities: z.string().max(10000).optional().nullable(),
  required_skills: z.string().max(5000).optional().nullable(),
  selection_process: z.string().max(5000).optional().nullable(),
  resume_tips: z.string().max(5000).optional().nullable(),
  interview_questions_tips: z.string().max(5000).optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(1000).optional().nullable(),
  keywords: z.string().max(1000).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  expiry_date: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    // 1. Authenticate server-side admin role
    const authResult = await verifyAdmin()
    if (!authResult.authorized) {
      logWarning('Unauthorized attempt to publish a job drive.')
      return authResult.response || NextResponse.json(
        { success: false, message: 'Forbidden. Admin role required.' },
        { status: 403 }
      )
    }

    const adminEmail = authResult.user?.email || 'unknown-admin'

    // 2. Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = await rateLimit(ip, 'create-job')
    if (!limitResult.success) {
      logWarning(`Rate limit exceeded for create-job API by IP: ${ip}`)
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: limitResult.headers }
      )
    }

    // 3. Request input validation via Zod
    const body = await request.json().catch(() => ({}))
    const validation = createJobSchema.safeParse(body)
    if (!validation.success) {
      logWarning(`Validation failed for create-job request by admin ${adminEmail}: ${JSON.stringify(validation.error.flatten())}`)
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input fields.',
          errors: validation.error.flatten(),
        },
        { status: 400, headers: limitResult.headers }
      )
    }

    const jobData = { ...validation.data }
    if (jobData.expiry_date === '') {
      jobData.expiry_date = null
    }

    logInfo(`Admin ${adminEmail} is creating job drive: ${jobData.drive_title}`)

    // 4. Secure insert to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('job_postings')
      .insert([jobData])
      .select()

    if (error) {
      logError(`Database error inserting job drive by admin ${adminEmail}`, error, { jobData })
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400, headers: limitResult.headers }
      )
    }

    logInfo(`Successfully published job drive ID ${data?.[0]?.id} by admin ${adminEmail}`)

    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: limitResult.headers }
    )
  } catch (err: any) {
    logError('Unexpected error in create-job route', err)
    return NextResponse.json(
      { success: false, message: 'Temporary issue. Please try again.' },
      { status: 500 }
    )
  }
}
