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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authPath = ['/sign-in', '/sign-up'];
  if (session && authPath.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!session && !authPath.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/sign-up', req.url));
  }
  return res;
}

export const config = {
  // Exclude API and static assets from middleware
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
