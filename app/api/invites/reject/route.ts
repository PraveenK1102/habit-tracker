import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { ok, fail, handleApiError, readJsonValidated } from '@/lib/api/http';
import { rejectInvite } from '@/lib/api/invites/rejectInvite';

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

    await rejectInvite({
      supabase,
      inviteId: invite_id,
      actorEmail: user.email,
    });

    return ok({ success: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
