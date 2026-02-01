import { SupabaseClient } from '@supabase/supabase-js';
import { fail } from '@/lib/api/http';

export class InviteError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function acceptInvite({
  supabase,
  inviteId,
  actor,
}: {
  supabase: SupabaseClient;
  inviteId: string;
  actor: { id: string; email: string };
}) {
  const { data: invite, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (error || !invite) throw new InviteError('Invite not found', 404);
  if (invite.status !== 'pending') throw new InviteError('Invite already processed', 400);
  if (invite.receiver_email !== actor.email)
    throw new InviteError('Not authorized', 403);

  const { data: updatedInvite, error: updateError } = await supabase
  .from('connection_requests')
    .update({
      status: 'accepted',
      receiver_id: actor.id,
      responded_at: new Date().toISOString(),
    })
    .eq('id', invite.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (updateError || !updatedInvite) {
    throw new InviteError('Invite already processed', 400);
  }
  const userA = invite.sender_id;
  const userB = actor.id;

  const directKey = userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;

  const { data: conversation, error: convoError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: actor.id,
      direct_key: directKey,
    })
    .select()
    .single();

  if (convoError) throw convoError;

  const { data, error: conversationParticipantsError } = await supabase
  .from('conversation_participants')
  .insert([
    { conversation_id: conversation.id, user_id: invite.sender_id },
    { conversation_id: conversation.id, user_id: actor.id },
  ])
  .select();

  if (conversationParticipantsError) {
    if (conversationParticipantsError instanceof InviteError) {
      return fail(conversationParticipantsError.message, conversationParticipantsError.status);
    }
  }

  return { conversationId: conversation.id };
}
