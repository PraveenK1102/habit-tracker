import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase' // Optional if you have DB types

export function createSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies })
}
