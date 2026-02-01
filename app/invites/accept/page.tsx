'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const inviteId = params.get('inviteId');
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState('Checking authentication…');

  useEffect(() => {
    if (!inviteId) {
      setStatus('Invalid invite');
      return;
    }

    async function run() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔒 Not logged in → redirect to login
      if (!session) {
        const next = `/invites/accept?inviteId=${inviteId}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      // ✅ Logged in → accept invite
      setStatus('Accepting invite…');

      try {
        const res = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_id: inviteId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        router.replace(`/chat/${data.conversationId}`);
      } catch (err: any) {
        setStatus(err.message);
      }
    }

    run();
  }, [inviteId, router, supabase]);

  return <p>{status}</p>;
}
