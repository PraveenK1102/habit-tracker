import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export function getAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Service role key not configured');
  }
  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey);
}