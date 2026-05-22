import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Clean up empty date string to avoid database type parsing errors
    const cleanedBody = { ...body }
    if (cleanedBody.expiry_date === "") {
      cleanedBody.expiry_date = null
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from('job_postings').insert([cleanedBody]).select()

    if (error) {
      return NextResponse.json({ error: { message: error.message, details: error } }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || String(err) } }, { status: 500 })
  }
}
