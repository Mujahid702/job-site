import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logInfo, logWarning, logError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      logWarning('Login failed: Missing email or password.')
      return NextResponse.json(
        { error: { message: 'Email and password are required.' } },
        { status: 400 }
      )
    }

    logInfo(`Login attempt initiated for: ${email}`)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logWarning(`Login authentication failed for ${email}: ${error.message}`)
      return NextResponse.json({ error: { message: error.message } }, { status: 400 })
    }

    logInfo(`User successfully authenticated: ${email}`)
    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    logError('Unexpected login route failure', err)
    return NextResponse.json(
      { error: { message: err?.message || 'Unexpected server error' } },
      { status: 500 }
    )
  }
}
