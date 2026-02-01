import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { ok, fail, handleApiError, readJsonValidated } from '@/lib/api/http';
import { acceptInvite, InviteError } from '@/lib/api/invites/acceptInvite';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    if (!user.email) {
      return fail('Email required', 400);
    }

    const { invite_id } = await readJsonValidated(
      request,
      z.object({
        invite_id: z.string().uuid(),
      })
    );

    const result = await acceptInvite({
      supabase,
      inviteId: invite_id,
      actor: {
        id: user.id,
        email: user.email,
      },
    });

    return ok(result, 200);
  } catch (error: any) {
    if (error instanceof InviteError) {
      return fail(error.message, error.status);
    }
    return handleApiError(error);
  }
}
