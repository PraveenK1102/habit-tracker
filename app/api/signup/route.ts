import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email and password' },
        { status: 400 }
      );
    }

    // Admin pre-check: use Service Role to see if user already exists in auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey);
      const { data: list, error: adminErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const users = (list?.users ?? []) as Array<{ email?: string | null }>;
      if (!adminErr && users.some(u => (u.email ?? '').toLowerCase() === email.toLowerCase())) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') && msg.includes('registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
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
            name: name || null,
          },
          { onConflict: 'user_id' }
        );
      if (upsertError) {
        return NextResponse.json({ warning: upsertError.message, user: { id: data.user.id, email: data.user.email } }, { status: 201 });
      }
    }
    await supabase.auth.signInWithPassword({ email, password });
    return NextResponse.json({ user: data.user ? { id: data.user.id, email: data.user.email } : null }, { status: 201 });
  } catch (error) {
    throw new Error((error as Error)?.message || 'Internal Server Error');
  }
}
