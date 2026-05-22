import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const supabase = await createClient()

    const { data, error } = await supabase.from('job_postings').insert([body]).select()

    if (error) {
      return NextResponse.json({ error: { message: error.message, details: error } }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || String(err) } }, { status: 500 })
  }
}
