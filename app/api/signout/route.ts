import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { handleApiError, ok } from '@/lib/api/http';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return handleApiError(error);
    }
    return ok({ signedOut: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
