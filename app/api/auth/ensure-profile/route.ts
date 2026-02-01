import { fail, handleApiError, ok } from '@/lib/api/http';
import { getAdmin } from '@/lib/getAdmin';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = getAdmin();
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }

    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const displayName =
      (user.user_metadata as { full_name?: string; name?: string; preferred_username?: string } | null)?.full_name ||
      (user.user_metadata as { full_name?: string; name?: string; preferred_username?: string } | null)?.name ||
      (user.user_metadata as { full_name?: string; name?: string; preferred_username?: string } | null)?.preferred_username ||
      user.email?.split('@')[0] ||
      'User';

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          name: displayName,
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      return fail(profileError.message, 500, 'PROFILE_CREATE_FAILED');
    }

    return ok({ created: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
