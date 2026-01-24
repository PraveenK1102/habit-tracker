import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * Supabase client for Next.js Route Handlers (for example: `app/api/tasks/route.ts`).
 *
 * Why: `createRouteHandlerClient` is the correct helper for route handlers and
 * ensures auth cookies are read/written properly.
 *
 * Note: If you later introduce Server Components that need Supabase, create a
 * separate helper (server-component client) instead of reusing this.
 */
export function createSupabaseServerClient() {
  return createRouteHandlerClient({ cookies })
}
