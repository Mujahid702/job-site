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

export async function isAdmin(user: User): Promise<boolean> {
  try {
    const hardcodedRole = getUserRole(user);
    if (hardcodedRole === 'admin' || hardcodedRole === 'super_admin') {
      return true;
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: roleRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const role = roleRecord?.role
    return role === 'admin' || role === 'super_admin'
  } catch {
    return false
  }
}

export async function isSuperAdmin(user: User): Promise<boolean> {
  try {
    const hardcodedRole = getUserRole(user);
    if (hardcodedRole === 'super_admin') {
      return true;
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: roleRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const role = roleRecord?.role
    return role === 'super_admin'
  } catch {
    return false
  }
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

    // 1. Direct role check via user email and metadata
    const hardcodedRole = getUserRole(user);
    if (hardcodedRole === 'admin' || hardcodedRole === 'super_admin') {
      return {
        authenticated: true,
        authorized: true,
        response: null,
        user,
      }
    }

    // 2. Database user_roles table lookup
    const { data: roleRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const role = roleRecord?.role

    if (role !== 'admin' && role !== 'super_admin') {
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
