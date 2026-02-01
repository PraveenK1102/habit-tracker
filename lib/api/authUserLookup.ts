import type { SupabaseClient } from '@supabase/supabase-js';

export async function getAuthUserByEmail(admin: SupabaseClient, userEmail: string) {
  const { data, error } = await admin
    .from('users')
    .select('id, email_confirmed_at')
    .eq('email', userEmail.toLowerCase())
    .maybeSingle();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function getProfileByUserId(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return { data, error };
}
