import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { email, password } from '@/lib/api/schemas';
import { handleApiError, ok, readJsonValidated } from '@/lib/api/http';

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

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
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
