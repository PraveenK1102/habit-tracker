import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { fail, handleApiError, ok } from '@/lib/api/http';
import { getAdmin } from '@/lib/getAdmin';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const admin = getAdmin();
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return handleApiError(deleteError);
    }

    await supabase.auth.signOut();

    return ok({ success: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
