import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Allow API routes to pass through without redirects
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });
  const authPath = ['/sign-in', '/sign-up', '/auth/callback', '/auth/oauth', '/reset-request', '/reset-password'];
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }
  if (session && authPath.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!session && !authPath.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  return res;
}

export const config = {
  // Exclude API and static assets from middleware
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
