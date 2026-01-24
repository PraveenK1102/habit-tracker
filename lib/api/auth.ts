import type { User } from '@supabase/supabase-js';
import { ApiError } from './errors';

export async function requireUser(supabase: any): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return data.user as User;
}



