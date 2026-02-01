import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { ok, fail, handleApiError, readJsonValidated } from '@/lib/api/http';
import { sendInvite } from '@/lib/api/invites/sendInvite';
import { sendInviteEmail } from '@/lib/email/sendInviteEmail';
import { getAuthUserByEmail } from '@/lib/api/authUserLookup';
import { getAdmin } from '@/lib/getAdmin';


const supabase = createSupabaseServerClient();
const admin = getAdmin();

export async function POST(req: Request) {
  try {
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }
    const user = await requireUser(supabase);
    if (!user.email) return fail('Email required', 400);

    const { email } = await readJsonValidated(
      req,
      z.object({ email: z.string().email() })
    );

    if (email === user.email) return fail('Cannot invite yourself', 400);

    const isUserExists = await checkIfUserExists(email);
    if (!isUserExists) {
      return fail('Invited user not found', 404, 'INVITED_USER_NOT_FOUND');
    }
    const existingInvite = await checkIfAnyInvitesExists(user.id, email);
    if (existingInvite) {
      return fail('Invite already sent', 400, 'INVITE_ALREADY_SENT');
    }
    const invite = await sendInvite({
      supabase,
      senderId: user.id,
      receiverEmail: email,
    });

    // 🔥 side effect → non-blocking
    sendInviteEmail({
      to: email,
      senderName: user.email,
      inviteId: invite.id,
    }).catch(console.error);

    return ok({ invite_id: invite.id, status: invite.status, message: invite.message }, 200);
  } catch (err: any) {
    return handleApiError(err);
  }
}

async function checkIfAnyInvitesExists(userId: string, email: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('id')
    .eq('sender_id', userId)
    .eq('receiver_email', email)
    .eq('status', 'pending')
    .maybeSingle();
  if (error) {
    return fail(error.message, 500, 'FAILED_TO_CHECK_INVITE_EXISTS');
  };
  return data;
}

async function checkIfUserExists(email: string) {
  const { data: authUser, error: authUserError } = await getAuthUserByEmail(admin, email);
  if (!authUserError && !authUser) {
    return false;
  }
  return true;
}