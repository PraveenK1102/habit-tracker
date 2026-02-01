import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { email, password } from '@/lib/api/schemas';
import { handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { getAuthUserByEmail, getProfileByUserId } from '@/lib/api/authUserLookup';
import { getAdmin } from '@/lib/getAdmin';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        email,
        password,
      })
    );

    const admin = getAdmin();
    if (admin !== null) {
      const { data: authUser, error: authUserError } = await getAuthUserByEmail(admin, body.email);
      if (!authUserError && !authUser) {
        return NextResponse.json(
          { ok: false, error: 'Account not found. Please sign up first.', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid login credentials')) {
        if (admin !== null) {
          const { data: authUser, error: authUserError } = await getAuthUserByEmail(admin, body.email);
          if (!authUserError && authUser) {
            const { data: profile } = await getProfileByUserId(admin, authUser.id);
            if (!profile) {
              await admin.auth.admin.deleteUser(authUser.id);
              return NextResponse.json(
                { ok: false, error: 'Account incomplete. Please sign up again.', code: 'PROFILE_MISSING' },
                { status: 409 }
              );
            }
            if (!authUser.email_confirmed_at) {
              return NextResponse.json(
                { ok: false, error: 'Email not confirmed. Please confirm or resend.', code: 'EMAIL_NOT_CONFIRMED' },
                { status: 403 }
              );
            }
          }
        }
      }
      // Do not leak details; keep message but standardized shape
      return NextResponse.json({ ok: false, error: error.message, code: 'AUTH_FAILED' }, { status: 401 });
    }

    // Return minimal session/user info
    return ok({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session ? { access_token: data.session.access_token } : null,
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
