import { SupabaseClient } from '@supabase/supabase-js';

export async function rejectInvite({
  supabase,
  inviteId,
  actorEmail,
}: {
  supabase: SupabaseClient;
  inviteId: string;
  actorEmail: string;
}) {
  const { data: invite } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (!invite || invite.receiver_email !== actorEmail) {
    throw new Error('Not authorized');
  }

  await supabase
    .from('connection_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId);
}
