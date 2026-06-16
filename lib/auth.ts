import { NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'

export function getUserRole(user: User): 'super_admin' | 'admin' | 'user' {
  const email = user.email || ''
  const role = user.user_metadata?.role

  if (
    email === 'mujjumujahid1992@gmail.com' ||
    email === 'buggedbrain2026@gmail.com' ||
    role === 'super_admin'
  ) {
    return 'super_admin'
  }

  if (email === 'admin@example.com' || role === 'admin') {
    return 'admin'
  }

  return 'user'
}

export function isAdmin(user: User): boolean {
  const role = getUserRole(user)
  return role === 'admin' || role === 'super_admin'
}

export function isSuperAdmin(user: User): boolean {
  return getUserRole(user) === 'super_admin'
}

export interface VerifyAuthResult {
  authenticated: boolean
  authorized: boolean
  response: NextResponse | null
  user: User | null
}

export async function verifyAdmin(): Promise<VerifyAuthResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        authenticated: false,
        authorized: false,
        response: NextResponse.json(
          { success: false, message: 'Unauthorized. Session expired or missing.' },
          { status: 401 }
        ),
        user: null,
      }
    }

    if (!isAdmin(user)) {
      return {
        authenticated: true,
        authorized: false,
        response: NextResponse.json(
          { success: false, message: 'Forbidden. Admin role required.' },
          { status: 403 }
        ),
        user,
      }
    }

    return {
      authenticated: true,
      authorized: true,
      response: null,
      user,
    }
  } catch (err) {
    return {
      authenticated: false,
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized. Error verifying session.' },
        { status: 401 }
      ),
      user: null,
    }
  }
}
