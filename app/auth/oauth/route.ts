import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getAdmin } from '@/lib/getAdmin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';
  const origin = url.origin;
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in', origin));
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const message = encodeURIComponent(error.message || 'OAuth sign-in failed');
    return NextResponse.redirect(new URL(`/sign-in?error=${message}`, origin));
  }

  const admin = getAdmin();
  if (admin !== null) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (user) {
      const metadata = user.user_metadata as { full_name?: string; name?: string; preferred_username?: string } | null;
      const displayName =
        metadata?.full_name ||
        metadata?.name ||
        metadata?.preferred_username ||
        user.email?.split('@')[0] ||
        'User';
      await admin
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            email: user.email,
            name: displayName,
          },
          { onConflict: 'user_id' }
        );
    }
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
