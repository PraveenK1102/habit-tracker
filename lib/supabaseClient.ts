// lib/supabaseBrowser.ts
'use client';

import { createPagesBrowserClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () =>
  createPagesBrowserClient();

export const useSupabaseClient = () => createClientComponentClient();
