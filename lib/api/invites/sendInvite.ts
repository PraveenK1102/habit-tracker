import { SupabaseClient } from '@supabase/supabase-js';

export async function sendInvite({
  supabase,
  senderId,
  receiverEmail,
}: {
  supabase: SupabaseClient;
  senderId: string;
  receiverEmail: string;
}) {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      sender_id: senderId,
      receiver_email: receiverEmail,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  data.message = 'Invite sent successfully';
  return data;
}
