import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { email, password, safeOptionalText } from '@/lib/api/schemas';
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
        name: safeOptionalText({ max: 120 }),
      })
    );

    // Admin pre-check: use Service Role to see if user already exists in auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // NOTE: We intentionally avoid "list users" pre-checks (not scalable).
    // Supabase `signUp` will return "already registered" error which we map to 409.

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') && msg.includes('registered')) {
        return NextResponse.json({ ok: false, error: 'User already exists', code: 'ALREADY_EXISTS' }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message, code: 'SIGNUP_FAILED' }, { status: 400 });
    }

    // Upsert profile row using the ADMIN client to bypass RLS safely (server-only key)
    if (data.user && supabaseUrl && serviceRoleKey) {
      const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey);
      const { error: upsertError } = await admin
        .from('profiles')
        .upsert(
          {
            user_id: data.user.id,
            email: data.user.email,
            name: body.name || null,
          },
          { onConflict: 'user_id' }
        );
      if (upsertError) {
        return ok({ warning: upsertError.message, user: { id: data.user.id, email: data.user.email } }, 201);
      }
    }
    await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
    return ok({ user: data.user ? { id: data.user.id, email: data.user.email } : null }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
