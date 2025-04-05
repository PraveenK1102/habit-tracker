// lib/supabaseBrowser.ts
'use client';

import { createBrowserClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const useSupabaseClient = () => createClientComponentClient();
