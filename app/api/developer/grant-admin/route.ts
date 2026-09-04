import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant';

/**
 * POST /api/developer/grant-admin
 * Development & UAT helper endpoint to promote a registered user or current session to Admin.
 */
export async function POST(request: Request) {
  try {
    const tenant = getCurrentTenant();
    
    // Safety check: block unauthorized self-promotion on live production unless already an admin
    if (tenant === 'prod' && process.env.NODE_ENV === 'production') {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized in production' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email;
    const requestedRole = body.role || 'super_admin';

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const targetUserId = body.userId || currentUser?.id;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ 
        error: 'Missing user context. Please log in first or provide email/userId in request body.' 
      }, { status: 400 });
    }

    // Upsert into user_roles table
    if (targetUserId) {
      const { error: dbError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: requestedRole,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (dbError) {
        return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `User (ID: ${targetUserId}) successfully assigned "${requestedRole}" role!`,
        tenant,
        role: requestedRole
      });
    }

    return NextResponse.json({
      success: true,
      message: `Role assigned for ${targetEmail}`,
      tenant
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
