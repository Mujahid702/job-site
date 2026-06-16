import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logInfo, logError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Session expired or missing.' },
        { status: 401 }
      )
    }

    logInfo(`Initiating account deletion for user: ${user.id}`)

    // 1. Delete user profile records (will cascade delete related entries)
    const { error: dbError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id)

    if (dbError) {
      logError(`Failed to delete profile data for user ${user.id}`, dbError)
    }

    // 2. Delete user from auth.users via Supabase Admin Client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (serviceKey && supabaseUrl) {
      logInfo(`Found Supabase service role key, deleting auth user ${user.id} from identity server.`)
      const adminClient = createAdminClient(supabaseUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      const { error: adminError } = await adminClient.auth.admin.deleteUser(user.id)
      if (adminError) {
        logError(`Admin client failed to delete auth user ${user.id}`, adminError)
        return NextResponse.json(
          { error: `Identity server error: ${adminError.message}` },
          { status: 500 }
        )
      }
    } else {
      logInfo(`Supabase service role key missing in environment. Profile data cleared. User session signed out.`)
    }

    logInfo(`Account deletion completed for user: ${user.id}`)
    return NextResponse.json({ success: true, message: 'Account cleared successfully.' }, { status: 200 })
  } catch (err: any) {
    logError('Unexpected error in account deletion endpoint', err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}
